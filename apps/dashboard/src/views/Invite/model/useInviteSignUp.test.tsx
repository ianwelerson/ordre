import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { ServiceError } from '@ordre/core/errors';
import type { WorkspaceInvitePreview } from '@ordre/core/types';
import type { FieldBinding } from '@ordre/ui/form';

import { loginRedirect } from '@/shared/authLinks';
import { LOGIN_NOTICE } from '@/shared/constants';

import { withIntl } from '../../../../vitest/intl';
import { useInviteSignUp } from './useInviteSignUp';

const replace = vi.fn();
const signUpRequest = vi.fn();
const acceptInvite = vi.fn();

/** Records which requests went out, in order, so the two-step submit can be asserted as one. */
let calls: string[] = [];

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/shared/services', () => ({
  services: {
    auth: {
      signUp: (payload: unknown) => signUpRequest(payload),
    },
    invite: {
      accept: (token: string) => acceptInvite(token),
    },
  },
}));

const TOKEN = 'invite-token';
const PASSWORD = 'a-good-secret';

const INVITE: WorkspaceInvitePreview = {
  email: 'lucas@ordre.app',
  name: 'Lucas Marino',
  role: 'member',
  workspaceName: 'Studio Marino',
  workspaceLogo: null,
  invitedByName: 'Ana Prado',
  expiresAt: '2026-09-01T12:00:00.000Z',
};

const Field = ({ binding, name }: { binding: FieldBinding; name: string }) => {
  const { invalid, invalidMessage, ...control } = binding;

  return (
    <>
      <input data-testid={name} aria-invalid={invalid} {...control} />
      <span data-testid={`${name}-error`}>{invalidMessage ?? ''}</span>
    </>
  );
};

const Host = () => {
  const { field, onSubmit, rootError } = useInviteSignUp(TOKEN, INVITE);

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field name="firstName" binding={field('firstName')} />
      <Field name="lastName" binding={field('lastName')} />
      <Field name="password" binding={field('password')} />
      <input data-testid="productNewsOptIn" type="checkbox" {...field('productNewsOptIn')} />
      <span data-testid="root-error">{rootError ?? ''}</span>
      <button type="submit">Accept</button>
    </form>
  );
};

const setup = () => {
  const screen = render(withIntl(<Host />));

  const submit = (password = PASSWORD) => {
    fireEvent.change(screen.getByTestId('password'), { target: { value: password } });
    fireEvent.click(screen.getByRole('button'));
  };

  return {
    ...screen,
    submit,
    rootError: () => screen.getByTestId('root-error').textContent,
    errorOf: (name: string) => screen.getByTestId(`${name}-error`).textContent,
  };
};

describe('useInviteSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls = [];
    signUpRequest.mockImplementation(() => {
      calls.push('signUp');

      return Promise.resolve();
    });
    acceptInvite.mockImplementation(() => {
      calls.push('accept');

      return Promise.resolve();
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should seed both name fields by splitting the name on the invite', () => {
    const { getByTestId } = setup();

    expect((getByTestId('firstName') as HTMLInputElement).value).toBe('Lucas');
    expect((getByTestId('lastName') as HTMLInputElement).value).toBe('Marino');
  });

  /**
   * The address comes from the invite rather than from a field, because
   * `app_invite_accept` refuses any account whose email differs from it.
   */
  it('should sign up with the address the invite was sent to', async () => {
    const { submit } = setup();

    submit();

    await waitFor(() =>
      expect(signUpRequest).toHaveBeenCalledWith({
        name: INVITE.name,
        firstName: 'Lucas',
        lastName: 'Marino',
        email: INVITE.email,
        password: PASSWORD,
        productNewsOptIn: false,
      })
    );
  });

  /** Marketing consent is opt-in, so an untouched form must never send `true`. */
  it('should leave the product news box unticked', () => {
    const { getByTestId } = setup();

    expect((getByTestId('productNewsOptIn') as HTMLInputElement).checked).toBe(false);
  });

  it('should sign up with the consent the invitee gave', async () => {
    const { getByTestId, submit } = setup();

    (getByTestId('productNewsOptIn') as HTMLInputElement).click();
    await submit();

    await waitFor(() =>
      expect(signUpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ productNewsOptIn: true })
      )
    );
  });

  it('should accept the invite with the account it just created', async () => {
    const { submit } = setup();

    submit();

    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith(TOKEN));
    expect(calls).toEqual(['signUp', 'accept']);
  });

  it('should redirect to the dashboard once the invite is accepted', async () => {
    const { submit } = setup();

    submit();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('should not submit a password under eight characters', async () => {
    const { submit, errorOf } = setup();

    submit('short');

    await waitFor(() => expect(errorOf('password')).not.toBe(''));
    expect(signUpRequest).not.toHaveBeenCalled();
  });

  /**
   * An invitee who already has an account is not a failure, so the screen hands
   * them to sign-in with the invite still as the destination.
   */
  it('should send an existing account to sign in', async () => {
    signUpRequest.mockRejectedValue(
      new ServiceError('USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', 'Exists', 422)
    );

    const { submit } = setup();

    submit();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        loginRedirect(DASHBOARD_ROUTES.invite(TOKEN), LOGIN_NOTICE.accountExists)
      )
    );
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it('should put any other sign-up failure on the form', async () => {
    signUpRequest.mockRejectedValue(new ServiceError('NETWORK_ERROR', 'Offline', 500));

    const { submit, rootError } = setup();

    submit();

    await waitFor(() => expect(rootError()).not.toBe(''));
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  /**
   * Sign-up is not idempotent and accept is. Once the account exists, a retry has
   * to resume at the accept, or the second attempt reports an existing account
   * and sends the invitee to a login screen they no longer need.
   */
  it('should resume at the accept when a retry follows a created account', async () => {
    acceptInvite.mockRejectedValueOnce(new ServiceError('NETWORK_ERROR', 'Offline', 500));

    const { submit, rootError } = setup();

    submit();

    await waitFor(() => expect(rootError()).not.toBe(''));
    expect(signUpRequest).toHaveBeenCalledOnce();

    submit();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(signUpRequest).toHaveBeenCalledOnce();
    expect(acceptInvite).toHaveBeenCalledTimes(2);
  });
});
