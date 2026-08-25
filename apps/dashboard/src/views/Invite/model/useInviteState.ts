'use client';

import { useCallback, useEffect, useState } from 'react';

import { WorkspaceInvitePreview } from '@ordre/core/types';
import { serviceErrorKey } from '@ordre/ui/form';

import { services } from '@/shared/services';

/**
 * The invite page's state as a discriminated union. `status` narrows the rest,
 * so `status === 'signUp'` is what makes `invite` non-null.
 *
 * `errorKey` holds a translation key such as `errors.INVITE_NOT_FOUND`, never a
 * sentence. The view resolves it.
 */
export type InviteState =
  | { status: 'loading' }
  | { status: 'error'; errorKey: string }
  /** No session, so the invitee has to create an account first. */
  | { status: 'signUp'; invite: WorkspaceInvitePreview }
  /** Signed in as the invited address, so joining is one request away. */
  | { status: 'accept'; invite: WorkspaceInvitePreview; email: string }
  /** Signed in as a different address, so accepting would join the wrong account. */
  | { status: 'mismatch'; invite: WorkspaceInvitePreview; email: string };

/**
 * Returns the signed-in user's email, or `null` when there is no session or the
 * check fails. Treating a failed check as signed out costs at most a sign-up
 * form shown to someone who did not need one, and that path still ends at
 * sign-in.
 */
const currentEmail = async (): Promise<string | null> => {
  try {
    const session = await services.auth.getSession();

    return session?.user.email ?? null;
  } catch {
    return null;
  }
};

/**
 * Compares two email addresses case-insensitively. Better Auth lowercases the
 * address on sign-up, while the invite row stores it as it was typed.
 */
const sameAddress = (a: string, b: string) => {
  return a.toLowerCase() === b.toLowerCase();
};

/**
 * Loads the invite preview and the current session together, then picks which of
 * the three screens the page should show.
 *
 * The comparison here only chooses a screen. `app_invite_accept` re-checks the
 * address against the session's own user and returns `INVITE_EMAIL_MISMATCH`, so
 * the database still refuses a visitor who forces past this.
 *
 * @param token - The invite token from the route.
 * @returns The current state, and a `reload` that re-runs the load.
 */
export const useInviteState = (token: string) => {
  const [state, setState] = useState<InviteState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    // Cleared by the cleanup below, so a response landing after this effect has
    // been superseded is dropped rather than written over the current state.
    let active = true;

    const load = async () => {
      try {
        const [invite, email] = await Promise.all([services.invite.preview(token), currentEmail()]);

        if (!active) {
          return;
        }

        if (!email) {
          setState({ status: 'signUp', invite });

          return;
        }

        if (sameAddress(email, invite.email)) {
          setState({ status: 'accept', invite, email });

          return;
        }

        setState({ status: 'mismatch', invite, email });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({ status: 'error', errorKey: serviceErrorKey(error) });
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [token, nonce]);

  /**
   * Re-runs the load. The session cookie is `HttpOnly`, so the page cannot see
   * whether signing out worked and has to ask again.
   */
  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setNonce((current) => current + 1);
  }, []);

  return { state, reload };
};
