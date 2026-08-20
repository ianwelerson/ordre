'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { TextLink } from '@ordre/ui/components';

const HEADER_CTA = {
  [DASHBOARD_ROUTES.login]: { key: 'login', path: DASHBOARD_ROUTES.getStarted },
  [DASHBOARD_ROUTES.getStarted]: { key: 'getStarted', path: DASHBOARD_ROUTES.login },
  [DASHBOARD_ROUTES.inviteBase]: { key: 'invite', path: DASHBOARD_ROUTES.login },
} as const;

export const HeaderCta = () => {
  const t = useTranslations('AuthHeader');
  const pathname = usePathname();

  const cta = Object.entries(HEADER_CTA).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`)
  )?.[1];

  if (!cta) {
    return null;
  }

  return (
    <span className="font-body text-foreground-muted text-sm">
      <span className="max-nav:hidden">{t(`${cta.key}.entry`)} </span>
      <TextLink href={cta.path} className="font-medium">
        {t(`${cta.key}.button`)}
      </TextLink>
    </span>
  );
};
