'use client';

import { useTranslations } from 'next-intl';

import { TextLink } from '@ordre/ui/components';

import { AuthCard, AuthFootnote, AuthHeading } from '@/shared/components';

/** The address visitors write to while sign-ups are closed. */
const CONTACT_EMAIL = 'hello@ordre.app';

/**
 * Tells the visitor that new accounts are closed and offers an address to write
 * to. The screen holds the route while the `registration` feature is off.
 */
export default function GetStartedPage() {
  const t = useTranslations('GetStarted');

  return (
    <AuthCard>
      <AuthHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
      <AuthFootnote>
        {t('contact')}{' '}
        <TextLink variant="inline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </TextLink>
      </AuthFootnote>
    </AuthCard>
  );
}
