'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { serviceErrorKey } from '@ordre/ui/form';

import { services } from '@/shared/services';

interface InviteAccept {
  accept: () => Promise<void>;
  pending: boolean;
  errorKey: string | null;
}

/**
 * Accepts the invite for the signed-in user, then redirects to the dashboard.
 *
 * Holds the error as a translation key rather than a sentence, so the view
 * resolves it in the reader's locale.
 *
 * @param token - The invite token from the route.
 * @example
 * const { accept, pending, errorKey } = useInviteAccept(token);
 */
export const useInviteAccept = (token: string): InviteAccept => {
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const accept = async () => {
    setPending(true);
    setErrorKey(null);

    try {
      await services.invite.accept(token);

      router.replace('/');
    } catch (error) {
      setErrorKey(serviceErrorKey(error));
      setPending(false);
    }
  };

  return { accept, pending, errorKey };
};
