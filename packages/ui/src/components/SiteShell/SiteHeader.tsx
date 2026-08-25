'use client';

import { type ReactNode, useState } from 'react';

import { useScrolled } from '../../hooks/useScrolled';
import Icon from '../../icons/Icons';
import { Button } from '../Button/Button';
import { TextLink } from '../TextLink/TextLink';
import { MobileMenu } from './MobileMenu';
import { desktopAlign, type NavLink } from './types';

export interface SiteHeaderProps {
  links?: NavLink[];
  /** Replaces the default lockup on both layouts. Rendered inside the home link. */
  logo?: ReactNode;
  /** Where the lockup points. */
  logoHref?: string;
  /**
   * Arbitrary content pinned to the end of the bar. Stays visible at every width,
   * so it owns its own responsive behaviour.
   */
  trailing?: ReactNode;
  /** Small print under the menu actions. Only renders when there is a menu to open. */
  menuFooter?: ReactNode;
  /** Keep scrolled state enabled */
  alwaysScrolled?: boolean;
}

const MENU_ID = 'site-header-menu';

const renderNavLinks = (links: NavLink[]) =>
  links.map(({ label, href, active }) => (
    <TextLink key={href} href={href} active={active}>
      {label}
    </TextLink>
  ));

const renderActions = (links: NavLink[]) =>
  links.map(({ label, href, role }) => (
    <Button key={href} href={href} variant={role === 'primary' ? 'primary' : 'secondary'} size="sm">
      {label}
    </Button>
  ));

/**
 * The public site header: marketing pages plus the auth screens.
 *
 * One `links` array feeds both layouts. Desktop splits it by `align`, the sliding
 * menu splits the same array by `role`, so a link can never appear on one layout and
 * silently vanish from the other. Actions and `trailing` never collapse.
 *
 * With no nav links there is nothing to collapse, so no burger renders and no menu
 * mounts. That is the minimal header the auth pages use: lockup plus `trailing`.
 */
export const SiteHeader = ({
  links,
  logo,
  logoHref = '/',
  trailing,
  menuFooter,
  alwaysScrolled,
}: SiteHeaderProps) => {
  const hasScrolled = useScrolled();

  const [menuOpen, setMenuOpen] = useState(false);

  const lockup = logo ?? <Icon name="ordre-lockup" width="100%" height={24} />;

  const desktopLinks = (links ?? []).filter(({ hideOn }) => hideOn !== 'desktop');
  const startLinks = desktopLinks.filter((link) => desktopAlign(link) === 'start');
  const endLinks = desktopLinks.filter((link) => desktopAlign(link) === 'end');
  // Actions never collapse - the CTA stays in the bar at every width.
  const endNavLinks = endLinks.filter(({ role = 'nav' }) => role === 'nav');
  const actionLinks = endLinks.filter(({ role }) => role === 'primary' || role === 'secondary');
  // Only nav links collapse, and mobile-only ones count too. Nothing to collapse
  // means no burger and no menu mounted: that is the minimal header.
  const collapses = (links ?? []).some(
    ({ role = 'nav', hideOn }) => role === 'nav' && hideOn !== 'mobile'
  );

  return (
    <>
      <header
        data-testid="site-header"
        data-scrolled={alwaysScrolled || hasScrolled || undefined}
        className="data-scrolled:bg-background/88 data-scrolled:border-border duration-slow ease-standard sticky top-0 z-50 border-b border-solid border-transparent bg-transparent transition-all data-scrolled:backdrop-blur-md"
      >
        <div className="max-w-site nav:px-7 mx-auto flex h-17 items-center gap-8 px-5">
          {/* Logo */}
          <a href={logoHref} aria-label="Home" className="flex h-10 w-auto shrink-0 items-center">
            {lockup}
          </a>

          {/* Primary nav - collapses into the sliding menu */}
          {startLinks.length > 0 && (
            <nav aria-label="Main" className="nav:flex hidden flex-1 items-center gap-7">
              {renderNavLinks(startLinks)}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-4">
            {/* Secondary nav - collapses too */}
            {endNavLinks.length > 0 && (
              <nav aria-label="Secondary" className="nav:flex hidden items-center gap-7">
                {renderNavLinks(endNavLinks)}
              </nav>
            )}
            {/* Actions, trailing content and the burger stay in the bar at every width */}
            {renderActions(actionLinks)}
            {trailing}
            {collapses && (
              <Button
                onClick={() => setMenuOpen(true)}
                leadingIcon="menu"
                variant="ghost"
                size="md"
                className="nav:hidden -mr-2.5"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls={MENU_ID}
              />
            )}
          </div>
        </div>
      </header>
      {collapses && (
        <MobileMenu
          id={MENU_ID}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          links={links ?? []}
          logo={lockup}
          logoHref={logoHref}
          menuFooter={menuFooter}
        />
      )}
    </>
  );
};
