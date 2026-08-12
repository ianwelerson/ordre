import type { Meta, StoryObj } from '@storybook/react';

import { TextLink } from '../TextLink/TextLink';
import { SiteHeader } from './SiteHeader';
import type { NavLink } from './types';

const LINKS: NavLink[] = [
  { label: 'Product', href: '#', active: true },
  { label: 'For providers', href: '#' },
  { label: 'Templates', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Sign in', href: '#', align: 'end' },
  { label: 'Start free', href: '#', role: 'primary' },
];

const meta: Meta<typeof SiteHeader> = {
  title: 'Components/SiteHeader',
  component: SiteHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    links: { control: 'object' },
    logoHref: { control: 'text' },
    logo: { control: false },
    trailing: { control: false },
    menuFooter: { control: 'text' },
  },
  args: {
    links: LINKS,
    logoHref: '#',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Marketing pages. Nav links sit at the start, the sign-in link is pushed to the end
 * with `align`, and the CTA stays in the bar at every width.
 *
 * Narrow the viewport past 860px to watch the nav collapse into the sliding menu.
 */
export const Default: Story = {};

/**
 * Auth pages. No `links` means nothing collapses, so no burger renders and no menu is
 * mounted at all. `trailing` carries whatever the page needs instead.
 */
export const Minimal: Story = {
  args: {
    links: undefined,
    trailing: (
      <span className="font-body text-foreground-muted text-sm">
        <span className="max-nav:hidden">New here? </span>
        <TextLink href="#" className="font-medium">
          Create a workspace
        </TextLink>
      </span>
    ),
  },
};

/** Nav only. Without an action the end of the bar holds just the burger. */
export const NavOnly: Story = {
  args: {
    links: LINKS.filter(({ role }) => role === undefined),
  },
};

/** Two actions read as a pair: the secondary never competes with the accent. */
export const TwoActions: Story = {
  args: {
    links: [
      ...LINKS.filter(({ role }) => role === undefined),
      { label: 'Book a demo', href: '#', role: 'secondary' },
      { label: 'Start free', href: '#', role: 'primary' },
    ],
  },
};

/** Small print under the menu actions. Only visible once the menu is open. */
export const WithMenuFooter: Story = {
  args: { menuFooter: 'No card · Founding rate' },
};

/**
 * `hideOn` keeps a link on one layout only: `desktop` is menu-only, `mobile` is
 * bar-only. A menu-only link still earns the burger.
 */
export const LayoutSpecificLinks: Story = {
  args: {
    links: [
      ...LINKS,
      { label: 'Careers', href: '#', hideOn: 'desktop' },
      { label: 'Status', href: '#', hideOn: 'mobile' },
    ],
  },
};

/** The bar is transparent at rest and turns glassy with a hairline once scrolled. */
export const OverScrollingContent: Story = {
  decorators: [
    (Story) => (
      <div style={{ height: '160vh' }}>
        <Story />
        <div className="font-body text-foreground-muted mx-auto max-w-2xl p-8 text-sm">
          Scroll the preview: the header picks up its background, blur and bottom rule once the page
          moves past the threshold.
        </div>
      </div>
    ),
  ],
};
