import { EmailShell } from '../components/EmailShell.tsx';
import type { TemplateProps } from '../types.ts';

export type VerifyEmailProps = TemplateProps<'email:account:verify-email'>;

/** Asks the recipient to confirm the address their account was created with. */
export const VerifyEmail = ({ locale, copy, ...variables }: VerifyEmailProps) => {
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
      actionUrl={variables.verify_url}
      note={t('note')}
      fallbackUrl={variables.verify_url}
      disclaimer={t('disclaimer', variables)}
      shared={shared}
      helpUrl={variables.help_url}
      privacyUrl={variables.privacy_url}
    />
  );
};
