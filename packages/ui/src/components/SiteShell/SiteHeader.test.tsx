import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SiteHeader } from './SiteHeader';
import type { NavLink } from './types';

const LINKS: NavLink[] = [
  { label: 'Product', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Sign in', href: '/login', align: 'end' },
  { label: 'Start free', href: '/signup', role: 'primary' },
];

/**
 * The sliding menu repeats the same labels, so every bar assertion scopes itself to
 * the header. An unscoped query would match both layouts and pass for the wrong one.
 */
const bar = (container: HTMLElement) => within(container.querySelector('header')!);

const nav = (container: HTMLElement, label: string) =>
  container.querySelector<HTMLElement>(`header nav[aria-label="${label}"]`);

describe('SiteHeader.tsx', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('should send nav links to the start and actions to the end', () => {
    const { container } = render(<SiteHeader links={LINKS} />);

    expect(nav(container, 'Main')).toHaveTextContent('Product');
    expect(nav(container, 'Main')).toHaveTextContent('Pricing');
    expect(nav(container, 'Main')).not.toHaveTextContent('Start free');
  });

  it('should honour an explicit align over the role default', () => {
    const { container } = render(<SiteHeader links={LINKS} />);

    // "Sign in" is a nav link, so it would start on the left without align: 'end'.
    expect(nav(container, 'Secondary')).toHaveTextContent('Sign in');
    expect(nav(container, 'Main')).not.toHaveTextContent('Sign in');
  });

  it('should keep actions out of the collapsing navs', () => {
    const { container } = render(<SiteHeader links={LINKS} />);

    const action = bar(container).getByText('Start free');

    expect(nav(container, 'Main')).not.toContainElement(action);
    expect(nav(container, 'Secondary')).not.toContainElement(action);
    expect(action.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('should drop desktop-hidden links from the bar but keep them in the menu', () => {
    const { container, getByTestId } = render(
      <SiteHeader links={[{ label: 'Careers', href: '/careers', hideOn: 'desktop' }]} />
    );

    expect(nav(container, 'Main')).toBeNull();
    expect(getByTestId('drawer')).toHaveTextContent('Careers');
  });

  it('should drop mobile-hidden links from the menu but keep them in the bar', () => {
    const { container, getByTestId } = render(
      <SiteHeader
        links={[
          { label: 'Product', href: '/features' },
          { label: 'Status', href: '/status', hideOn: 'mobile' },
        ]}
      />
    );

    expect(nav(container, 'Main')).toHaveTextContent('Status');
    expect(getByTestId('drawer')).not.toHaveTextContent('Status');
  });

  it('should offer a burger whenever there are links to collapse', async () => {
    const { getByLabelText } = render(<SiteHeader links={LINKS} />);

    const burger = getByLabelText('Open menu');

    await waitFor(() => {
      expect(burger).toHaveAttribute('aria-expanded', 'false');
      expect(burger).toHaveAttribute('aria-controls', 'site-header-menu');
    });
  });

  it('should open the menu from the burger', () => {
    const { getByLabelText, getByTestId } = render(<SiteHeader links={LINKS} />);

    expect(getByTestId('drawer')).toHaveAttribute('inert');

    fireEvent.click(getByLabelText('Open menu'));

    expect(getByTestId('drawer')).not.toHaveAttribute('inert');
    expect(getByLabelText('Open menu')).toHaveAttribute('aria-expanded', 'true');
  });

  it('should close the menu again', () => {
    const { getByLabelText, getByTestId } = render(<SiteHeader links={LINKS} />);

    fireEvent.click(getByLabelText('Open menu'));
    fireEvent.click(getByLabelText('Close menu'));

    expect(getByTestId('drawer')).toHaveAttribute('inert');
  });

  describe('minimal header', () => {
    it('should mount no burger and no menu when nothing collapses', () => {
      const { queryByLabelText, queryByTestId } = render(
        <SiteHeader trailing={<span>New here?</span>} />
      );

      expect(queryByLabelText('Open menu')).toBeNull();
      expect(queryByTestId('drawer')).toBeNull();
    });

    it('should mount no menu when every link is an action', () => {
      const { queryByLabelText } = render(
        <SiteHeader links={[{ label: 'Start free', href: '/signup', role: 'primary' }]} />
      );

      expect(queryByLabelText('Open menu')).toBeNull();
    });

    it('should still collapse for a mobile-only nav link', () => {
      const { getByLabelText } = render(
        <SiteHeader links={[{ label: 'Careers', href: '/careers', hideOn: 'desktop' }]} />
      );

      expect(getByLabelText('Open menu')).toBeInTheDocument();
    });
  });

  it('should render trailing content outside the collapsing navs', () => {
    const { container } = render(<SiteHeader links={LINKS} trailing={<span>New here?</span>} />);

    const trailing = bar(container).getByText('New here?');

    expect(trailing).toBeInTheDocument();
    expect(nav(container, 'Main')).not.toContainElement(trailing);
    expect(nav(container, 'Secondary')).not.toContainElement(trailing);
  });

  it('should point the lockup at the home page', async () => {
    const { container } = render(<SiteHeader links={LINKS} />);

    const logo = container.querySelector('header a[aria-label="Home"]');

    await waitFor(() => {
      expect(logo).toHaveAttribute('href', '/');
      expect(logo?.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('should accept a custom logo and destination', () => {
    const { container } = render(<SiteHeader logoHref="/dashboard" logo={<span>Atelier</span>} />);

    expect(container.querySelector('header a[aria-label="Home"]')).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(bar(container).getByText('Atelier')).toBeInTheDocument();
  });

  it('should mark the active link for assistive tech', () => {
    const { container } = render(
      <SiteHeader links={[{ label: 'Pricing', href: '/pricing', active: true }]} />
    );

    expect(bar(container).getByText('Pricing').closest('a')).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('should render nothing but the lockup when given no props', () => {
    const { container, queryByLabelText } = render(<SiteHeader />);

    expect(getComputedStyle(container.querySelector('header')!).display).not.toBe('none');
    expect(nav(container, 'Main')).toBeNull();
    expect(nav(container, 'Secondary')).toBeNull();
    expect(queryByLabelText('Open menu')).toBeNull();
  });
});
