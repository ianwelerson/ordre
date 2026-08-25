'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

import { AuthCard } from '@/shared/components';

import { useInviteState } from '../model/useInviteState';
import { InviteAccept } from './InviteAccept';
import { InviteError } from './InviteError';
import { InviteMismatch } from './InviteMismatch';
import { InviteSignUp } from './InviteSignUp';
import { InviteSkeleton } from './InviteSkeleton';

/**
 * Renders the invite screen, choosing one of five cards from the page state.
 * Branching here rather than inside each card is what lets them take `invite` as
 * a required prop.
 */
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { state, reload } = useInviteState(token);

  const t = useTranslations();

  return (
    <AuthCard>
      {state.status === 'loading' && <InviteSkeleton />}
      {state.status === 'error' && <InviteError message={t(state.errorKey)} />}
      {state.status === 'signUp' && <InviteSignUp token={token} invite={state.invite} />}
      {state.status === 'accept' && (
        <InviteAccept token={token} invite={state.invite} email={state.email} />
      )}
      {state.status === 'mismatch' && (
        <InviteMismatch invite={state.invite} email={state.email} onSignedOut={reload} />
      )}
    </AuthCard>
  );
}
