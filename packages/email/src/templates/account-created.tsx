import { EmailShell } from '../components/EmailShell.tsx';
import { Eyebrow } from '../components/Eyebrow.tsx';
import { Steps } from '../components/Steps.tsx';
import type { TemplateProps } from '../types.ts';

export type AccountCreatedEmailProps = TemplateProps<'email:account:created'>;

/** Welcomes a new account and walks through the first three things to do. Sent once, on sign-up. */
export const AccountCreatedEmail = ({ locale, copy, ...variables }: AccountCreatedEmailProps) => {
  const { t, raw, shared } = copy;

  return (
    <EmailShell
      locale={locale}
      preview={t('preview')}
      category={t('category')}
      eyebrow={t('eyebrow')}
      heading={t('heading', variables)}
      body={t('body', variables)}
      action={t('action')}
      actionUrl={variables.dashboard_login_url}
      note={t('note', variables)}
      disclaimer={t('disclaimer', variables)}
      shared={shared}
      helpUrl={variables.help_url}
      privacyUrl={variables.privacy_url}
    >
      <Eyebrow spacing={18}>{t('stepsLabel')}</Eyebrow>
      <Steps steps={raw.steps} />
    </EmailShell>
  );
};
