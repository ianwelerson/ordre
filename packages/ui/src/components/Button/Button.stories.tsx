import type { Meta, StoryObj } from '@storybook/react';

import { Button, type ButtonAsButton, type ButtonAsLink } from './Button';

const meta: Meta<ButtonAsButton> = {
  title: 'Components/Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'ink', 'destructive'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['rounded', 'pill'] },
    align: { control: 'select', options: ['left', 'center', 'right', 'between'] },
    fullWidth: { control: 'boolean' },
    leadingIcon: { control: 'text' },
    trailingIcon: { control: 'text' },
    disabled: { control: 'boolean' },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
    className: { control: 'text' },
    onClick: { action: 'clicked' },
  },
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
    shape: 'rounded',
    fullWidth: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
type LinkStory = StoryObj<ButtonAsLink>;

/** Amber. The single accent - one primary action per view. */
export const Primary: Story = {
  args: { variant: 'primary' },
};

/** Outlined. Pairs with a primary as the lower-commitment choice. */
export const Secondary: Story = {
  args: { variant: 'secondary' },
};

/** No chrome at rest. Navigation and tertiary actions. */
export const Ghost: Story = {
  args: { variant: 'ghost' },
};

/** Midnight fill. High-attention actions that must not read as the accent. */
export const Ink: Story = {
  args: { variant: 'ink' },
};

/** Brick. Deletes and anything without an undo. */
export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete workspace' },
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="ink">
        Ink
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} disabled>
        Disabled
      </Button>
    </div>
  ),
};

/** 32 / 40 / 48 / 52px. */
export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button {...args} size="sm">
        Small · 32px
      </Button>
      <Button {...args} size="md">
        Medium · 40px
      </Button>
      <Button {...args} size="lg">
        Large · 48px
      </Button>
      <Button {...args} size="xl">
        XL · 52px
      </Button>
    </div>
  ),
};

/** Pills are for share, reschedule and other rounded inline actions. */
export const Pill: Story = {
  args: { shape: 'pill', variant: 'secondary', children: 'Reschedule' },
};

export const LeadingIcon: Story = {
  args: { leadingIcon: 'plus', children: 'New board' },
};

export const TrailingIcon: Story = {
  args: { trailingIcon: 'arrow-right', variant: 'secondary', children: 'Open' },
};

export const BothIcons: Story = {
  args: { leadingIcon: 'send', trailingIcon: 'arrow-right', children: 'Post update' },
};

/** Drop the label and the button squares off around a larger icon. */
export const IconOnly: Story = {
  args: {
    children: undefined,
    leadingIcon: 'x',
    variant: 'ghost',
    'aria-label': 'Close menu',
  },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

/** `align` only matters once the button is wider than its content. */
export const AlignBetween: Story = {
  args: { fullWidth: true, align: 'between', variant: 'ghost', trailingIcon: 'arrow-right' },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Submit: Story = {
  args: { children: 'Create account', type: 'submit' },
  decorators: [
    (Story) => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Story />
      </form>
    ),
  ],
};

/** Passing `href` renders an anchor with the same styling. */
export const AsLink: LinkStory = {
  args: {
    children: 'Read the docs',
    size: 'md',
    variant: 'secondary',
    trailingIcon: 'arrow-up-right',
    href: 'https://ordre.dev',
    target: '_blank',
    rel: 'noreferrer',
  },
};

export const CustomClassName: Story = {
  args: { className: 'uppercase tracking-widest' },
};
