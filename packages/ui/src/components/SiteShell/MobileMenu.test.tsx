import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MobileMenu, type MobileMenuProps } from './MobileMenu';
import type { NavLink } from './types';

const LINKS: NavLink[] = [
  { label: 'Product', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Sign in', href: '/login', align: 'end' },
  { label: 'Start free', href: '/signup', role: 'primary' },
  { label: 'Book a demo', href: '/demo', role: 'secondary' },
];

const renderMenu = (props: Partial<MobileMenuProps> = {}) =>
  render(
    <MobileMenu
      id="site-header-menu"
      open
      onClose={() => {}}
      links={LINKS}
      logo={<span>Ordre</span>}
      logoHref="/"
      {...props}
    />
  );

/**
 * Everything here is an anchor, and these tests run in a real browser, so a click
 * would navigate the runner out of its own page. The component's handler still fires:
 * this only cancels the default action once the event reaches the document.
 */
const blockNavigation = (event: MouseEvent) => event.preventDefault();

describe('MobileMenu.tsx', () => {
  beforeEach(() => {
    document.addEventListener('click', blockNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', blockNavigation);
    cleanup();
    document.body.style.overflow = '';
  });

  it('should list nav links as menu rows', () => {
    const { container } = renderMenu();

    const menu = within(container.querySelector('nav[aria-label="Main"]')!);

    expect(menu.getByText('Product').closest('a')).toHaveAttribute('href', '/features');
    expect(menu.getByText('Sign in')).toBeInTheDocument();
    expect(menu.queryByText('Start free')).toBeNull();
  });

  it('should group both action roles into the footer block', () => {
    const { getByText } = renderMenu();

    const primary = getByText('Start free').closest('a');
    const secondary = getByText('Book a demo').closest('a');

    expect(primary).toHaveAttribute('href', '/signup');
    expect(secondary).toHaveAttribute('href', '/demo');
  });

  it('should leave out links hidden on mobile', () => {
    const { queryByText } = renderMenu({
      links: [{ label: 'Status', href: '/status', hideOn: 'mobile' }],
    });

    expect(queryByText('Status')).toBeNull();
  });

  it('should keep links hidden on desktop', () => {
    const { getByText } = renderMenu({
      links: [{ label: 'Careers', href: '/careers', hideOn: 'desktop' }],
    });

    expect(getByText('Careers')).toBeInTheDocument();
  });

  it('should close when a nav link is followed', () => {
    const onClose = vi.fn();
    const { getByText } = renderMenu({ onClose });

    fireEvent.click(getByText('Product'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should close when an action is followed', () => {
    const onClose = vi.fn();
    const { getByText } = renderMenu({ onClose });

    fireEvent.click(getByText('Start free'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should close when the lockup is followed', () => {
    const onClose = vi.fn();
    const { getByLabelText } = renderMenu({ onClose });

    fireEvent.click(getByLabelText('Home'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should close from the close button', () => {
    const onClose = vi.fn();
    const { getByLabelText } = renderMenu({ onClose });

    fireEvent.click(getByLabelText('Close menu'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should render the lockup as a home link', () => {
    const { getByLabelText, getByText } = renderMenu({ logoHref: '/home' });

    expect(getByLabelText('Home')).toHaveAttribute('href', '/home');
    expect(getByText('Ordre')).toBeInTheDocument();
  });

  it('should render the menu footer under the actions', () => {
    const { getByText } = renderMenu({ menuFooter: 'No card required' });

    expect(getByText('No card required')).toBeInTheDocument();
  });

  it('should drop the nav block when there is nothing to list', () => {
    const { container } = renderMenu({
      links: [{ label: 'Start free', href: '/signup', role: 'primary' }],
    });

    expect(container.querySelector('nav[aria-label="Main"]')).toBeNull();
  });

  it('should drop the footer block when there are no actions and no footer', () => {
    const { getByTestId } = renderMenu({
      links: [{ label: 'Product', href: '/features' }],
    });

    expect(getByTestId('drawer').querySelector('.bg-warm-gray')).toBeNull();
  });

  it('should keep the footer block for a footer without actions', () => {
    const { getByText } = renderMenu({
      links: [{ label: 'Product', href: '/features' }],
      menuFooter: 'No card required',
    });

    expect(getByText('No card required')).toBeInTheDocument();
  });
});
