import { EmailShell } from '../components/EmailShell.tsx';
import type { TemplateProps } from '../types.ts';

export type ResetPasswordEmailProps = TemplateProps<'email:account:reset-password'>;

/** Carries the one-time link that lets the recipient choose a new password. */
export const ResetPasswordEmail = ({ locale, copy, ...variables }: ResetPasswordEmailProps) => {
  const { t, shared } = copy;

  return (
    <EmailShell
      locale={locale}
      preview={t('preview')}
      category={t('category')}
      eyebrow={t('eyebrow')}
      heading={t('heading')}
      body={t('body', variables)}
      action={t('action')}
      actionUrl={variables.reset_url}
      note={t('note')}
      fallbackUrl={variables.reset_url}
      disclaimer={t('disclaimer', variables)}
      shared={shared}
      helpUrl={variables.help_url}
      privacyUrl={variables.privacy_url}
    />
  );
};
