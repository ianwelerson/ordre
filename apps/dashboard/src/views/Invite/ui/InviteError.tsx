import { useTranslations } from 'next-intl';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';

import { AuthAction, AuthHeading } from '@/shared/components';

interface InviteErrorProps {
  /** The reason the preview could not be loaded, already resolved to a sentence. */
  message: string;
}

/**
 * Card shown when the invite could not be loaded, whether it expired, was already
 * used, or never existed. The action is sign-in rather than a retry, since
 * nothing the visitor does here revives a spent invite.
 */
export const InviteError = ({ message }: InviteErrorProps) => {
  const t = useTranslations('Invite.error');

  return (
    <>
      <AuthHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={message} />
      <AuthAction href={DASHBOARD_ROUTES.login}>{t('action')}</AuthAction>
    </>
  );
};
