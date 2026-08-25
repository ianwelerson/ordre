'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { TextLink } from '@ordre/ui/components';

import { loginRedirect } from '@/shared/authLinks';

/**
 * The counterpart screen each auth route offers, keyed by route so that adding
 * an auth screen is one line rather than a new branch below.
 */
const HEADER_CTA = {
  [DASHBOARD_ROUTES.login]: { key: 'login', path: DASHBOARD_ROUTES.getStarted },
  [DASHBOARD_ROUTES.getStarted]: { key: 'getStarted', path: DASHBOARD_ROUTES.login },
  [DASHBOARD_ROUTES.inviteBase]: { key: 'invite', path: DASHBOARD_ROUTES.login },
} as const;

/** Renders the auth header's counterpart link, or nothing on an unlisted route. */
export const HeaderCta = () => {
  const t = useTranslations('AuthHeader');
  const pathname = usePathname();

  const cta = Object.entries(HEADER_CTA).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`)
  )?.[1];

  if (!cta) {
    return null;
  }

  // An invitee who already has an account has to land back on the invite after
  // signing in, not on the dashboard, so the invite link carries a destination.
  const href = cta.key === 'invite' ? loginRedirect(pathname) : cta.path;

  return (
    <span className="font-body text-foreground-muted text-sm">
      <span className="max-nav:hidden">{t(`${cta.key}.entry`)} </span>
      <TextLink href={href} className="font-medium">
        {t(`${cta.key}.button`)}
      </TextLink>
    </span>
  );
};
