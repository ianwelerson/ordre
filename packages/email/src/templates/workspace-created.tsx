import { DetailBox } from '../components/DetailBox.tsx';
import { EmailShell } from '../components/EmailShell.tsx';
import { Eyebrow } from '../components/Eyebrow.tsx';
import { Steps } from '../components/Steps.tsx';
import type { TemplateProps } from '../types.ts';

export type WorkspaceCreatedEmailProps = TemplateProps<'email:workspace:created'>;

/** Confirms a new workspace to its owner, summarising it and pointing at the first board. */
export const WorkspaceCreatedEmail = ({
  locale,
  copy,
  ...variables
}: WorkspaceCreatedEmailProps) => {
  const { t, raw, shared } = copy;

  return (
    <EmailShell
      locale={locale}
      preview={t('preview')}
      category={t('category')}
      eyebrow={t('eyebrow')}
      heading={t('heading', variables)}
      body={t('body')}
      action={t('action')}
      actionUrl={variables.dashboard_url}
      note={t('note')}
      fallbackUrl={variables.dashboard_url}
      disclaimer={t('disclaimer', variables)}
      shared={shared}
      helpUrl={variables.help_url}
      privacyUrl={variables.privacy_url}
      details={
        <DetailBox
          rows={[
            { label: t('detailWorkspace'), value: variables.workspace_name },
            { label: t('detailIndustry'), value: variables.workspace_industry },
            { label: t('detailPlan'), value: variables.workspace_plan },
            { label: t('detailOwner'), value: variables.owner_email },
          ]}
        />
      }
    >
      <Eyebrow spacing={18}>{t('stepsLabel')}</Eyebrow>
      <Steps steps={raw.steps} />
    </EmailShell>
  );
};
