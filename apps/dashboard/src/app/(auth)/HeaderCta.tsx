'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { TextLink } from '@ordre/ui/components';

import { loginRedirect } from '@/shared/authLinks';

/**
 * The screen each auth route points a visitor at when they are on the wrong
 * one. Keyed by route rather than branched in the component, so a new auth
 * screen is one line here.
 */
const HEADER_CTA = {
  [DASHBOARD_ROUTES.login]: { key: 'login', path: DASHBOARD_ROUTES.getStarted },
  [DASHBOARD_ROUTES.getStarted]: { key: 'getStarted', path: DASHBOARD_ROUTES.login },
  [DASHBOARD_ROUTES.inviteBase]: { key: 'invite', path: DASHBOARD_ROUTES.login },
} as const;

/**
 * The counterpart link in the auth header, or nothing on a route with no
 * counterpart to offer.
 */
export const HeaderCta = () => {
  const t = useTranslations('AuthHeader');
  const pathname = usePathname();

  const cta = Object.entries(HEADER_CTA).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`)
  )?.[1];

  if (!cta) {
    return null;
  }

  // The invite screen is the one with somewhere to come back to: an invitee who
  // already has an account has to land on the invite again after signing in, not
  // on the dashboard.
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
