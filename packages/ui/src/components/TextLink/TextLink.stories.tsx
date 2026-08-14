import type { Meta, StoryObj } from '@storybook/react';

import { TextLink } from './TextLink';

const meta: Meta<typeof TextLink> = {
  title: 'Components/Primitives/TextLink',
  component: TextLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'inline-radio', options: ['nav', 'menu', 'inline'] },
    active: { control: 'boolean' },
    trailingIcon: { control: 'text' },
    href: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    children: 'Pricing',
    href: '#',
    variant: 'nav',
    active: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Inline text link. Site header nav on desktop, and any prose link. */
export const Nav: Story = {};

/** The current page. Midnight at medium weight, plus `aria-current="page"`. */
export const NavActive: Story = {
  args: { active: true },
};

/**
 * Underlined link worded into a sentence. It sets no size of its own, so it takes
 * the size of the surrounding text: the same link reads at 13px here and at 16px
 * in body copy.
 */
export const Inline: Story = {
  args: { variant: 'inline', children: 'Create one' },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'center' }}>
      <p style={{ fontSize: '13px' }}>
        Don&apos;t have an account? <TextLink {...args} />
      </p>
      <p style={{ fontSize: '16px' }}>
        Don&apos;t have an account? <TextLink {...args} />
      </p>
    </div>
  ),
};

/** Full-width headline row for the sliding menu on small screens. */
export const Menu: Story = {
  args: { variant: 'menu', trailingIcon: 'arrow-right' },
  decorators: [
    (Story) => (
      <div style={{ width: '288px' }}>
        <Story />
      </div>
    ),
  ],
};

/** Active menu rows go deep amber rather than midnight. */
export const MenuActive: Story = {
  args: { variant: 'menu', trailingIcon: 'arrow-right', active: true },
  decorators: [
    (Story) => (
      <div style={{ width: '288px' }}>
        <Story />
      </div>
    ),
  ],
};

export const NavGroup: Story = {
  render: (args) => (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
      <TextLink {...args} active>
        Product
      </TextLink>
      <TextLink {...args}>For providers</TextLink>
      <TextLink {...args}>Templates</TextLink>
      <TextLink {...args}>Pricing</TextLink>
    </nav>
  ),
};

export const MenuGroup: Story = {
  args: { variant: 'menu', trailingIcon: 'arrow-right' },
  render: (args) => (
    <nav style={{ display: 'flex', flexDirection: 'column', width: '288px' }}>
      <TextLink {...args} active>
        Product
      </TextLink>
      <TextLink {...args}>For providers</TextLink>
      <TextLink {...args}>Templates</TextLink>
      <TextLink {...args}>Pricing</TextLink>
      <TextLink {...args}>Sign in</TextLink>
    </nav>
  ),
};
