'use client';

import { useState } from 'react';

import { serviceErrorKey } from '@ordre/ui/form';

import { services } from '@/shared/services';

interface InviteSignOut {
  signOut: () => Promise<void>;
  pending: boolean;
  errorKey: string | null;
}

/**
 * Signs the current user out without navigating away.
 *
 * @param onSignedOut - Called once the session is gone, so the caller can reload
 *   whatever depended on it.
 * @example
 * const { signOut, pending, errorKey } = useInviteSignOut(reload);
 */
export const useInviteSignOut = (onSignedOut: () => void): InviteSignOut => {
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const signOut = async () => {
    setPending(true);
    setErrorKey(null);

    try {
      await services.auth.signOut();

      onSignedOut();
    } catch (error) {
      setErrorKey(serviceErrorKey(error));
      setPending(false);
    }
  };

  return { signOut, pending, errorKey };
};
