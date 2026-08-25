import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from '../Typography/Typography';
import { SiteShell } from './SiteShell';

const Page = () => (
  <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16">
    <Typography tag="h1" variant="h1">
      Boards on the record.
    </Typography>
    <Typography tag="p" variant="body">
      The shell only owns the frame: header, main, footer. Everything else is page content.
    </Typography>
  </div>
);

const Footer = () => (
  <div className="border-border bg-background-alt border-t border-solid px-6 py-8">
    <Typography tag="p" variant="mono-label">
      Ordre · The Digital Atelier
    </Typography>
  </div>
);

const meta: Meta<typeof SiteShell> = {
  title: 'Components/Shell/SiteShell',
  component: SiteShell,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    showHeader: { control: 'boolean' },
    headerContent: { control: 'object' },
    children: { control: false },
    footer: { control: false },
  },
  args: {
    showHeader: true,
    headerContent: {
      links: [
        { label: 'Product', href: '#', active: true },
        { label: 'Pricing', href: '#' },
        { label: 'Start free', href: '#', role: 'primary' },
      ],
      logoHref: '#',
    },
    children: <Page />,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Header and content. No footer element exists unless you pass one. */
export const Default: Story = {};

export const WithFooter: Story = {
  args: { footer: <Footer /> },
};

/**
 * The column is at least the viewport tall and `main` absorbs the slack, so a short
 * page still pins its footer to the bottom instead of leaving it mid-screen.
 */
export const ShortPageWithFooter: Story = {
  args: {
    children: (
      <div className="px-6 py-10">
        <Typography tag="p" variant="body">
          One line of content.
        </Typography>
      </div>
    ),
    footer: <Footer />,
  },
};

/** For pages that bring their own chrome, e.g. a full-bleed client board. */
export const WithoutHeader: Story = {
  args: { showHeader: false },
};
