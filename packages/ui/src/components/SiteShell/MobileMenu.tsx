'use client';

import type { ReactNode } from 'react';

import { Button } from '../Button/Button';
import { Drawer } from '../Drawer/Drawer';
import { TextLink } from '../TextLink/TextLink';
import type { NavLink } from './types';

export interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;
  /** The header's full list. Grouping happens here, not at the call site. */
  links: NavLink[];
  logo: ReactNode;
  logoHref: string;
  /** Small print rendered under the action buttons, e.g. terms of service. */
  menuFooter?: ReactNode;
}

/**
 * What the site header collapses into below the `nav` breakpoint.
 *
 * Internal to `SiteShell`: it takes the header's own `links` array rather than
 * pre-split groups, so the two layouts stay in sync by construction. Everything that
 * navigates also calls `onClose`, because a client-side route change leaves the shell
 * mounted and would otherwise strand the drawer open on the new page.
 */
export const MobileMenu = ({
  id,
  open,
  onClose,
  links,
  logo,
  logoHref,
  menuFooter,
}: MobileMenuProps) => {
  const visible = links.filter(({ hideOn }) => hideOn !== 'mobile');
  const navLinks = visible.filter(({ role = 'nav' }) => role === 'nav');
  const actions = visible.filter(({ role }) => role === 'primary' || role === 'secondary');

  return (
    <Drawer
      id={id}
      open={open}
      onClose={onClose}
      label="Menu"
      className="w-[min(320px,86vw)]"
      wrapperClassName="nav:hidden"
    >
      <div className="border-border flex h-17 shrink-0 items-center justify-between border-b border-solid pr-5 pl-6">
        <a
          href={logoHref}
          onClick={onClose}
          aria-label="Home"
          className="flex h-10 w-auto shrink-0 items-center"
        >
          {logo}
        </a>
        <Button
          leadingIcon="x"
          variant="ghost"
          size="md"
          className="-mr-2.5"
          aria-label="Close menu"
          onClick={onClose}
        />
      </div>
      {navLinks.length > 0 && (
        <>
          <div className="text-foreground-subtle tracking-eyebrow text-3xs shrink-0 px-6 pt-6 pb-2.5 font-mono uppercase">
            Menu
          </div>
          <nav aria-label="Main" className="flex flex-1 flex-col overflow-y-auto">
            {navLinks.map(({ label, href, active }) => (
              <TextLink
                key={href}
                href={href}
                onClick={onClose}
                variant="menu"
                active={active}
                trailingIcon="arrow-right"
              >
                {label}
              </TextLink>
            ))}
          </nav>
        </>
      )}
      {(actions.length > 0 || menuFooter) && (
        <div className="bg-background-alt border-border mt-auto flex shrink-0 flex-col gap-2.5 border-t border-solid px-6 pt-5 pb-7">
          {actions.map(({ label, href, role }) => (
            <Button
              key={href}
              href={href}
              onClick={onClose}
              variant={role === 'primary' ? 'primary' : 'secondary'}
              fullWidth={true}
            >
              {label}
            </Button>
          ))}
          {menuFooter && (
            <p className="text-foreground-subtle tracking-label text-3xs text-center font-mono uppercase">
              {menuFooter}
            </p>
          )}
        </div>
      )}
    </Drawer>
  );
};
