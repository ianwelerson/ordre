import type { Meta, StoryObj } from '@storybook/react';

import type { ReactNode } from 'react';

import { Badge } from './Badge';

/** Badges sit on Snow throughout the product, the way `11 - Chips & badges` stages them. */
const Surface = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '12px',
      padding: '24px',
      borderRadius: '12px',
      background: 'var(--color-background, #fafaf8)',
    }}
  >
    {children}
  </div>
);

const meta: Meta<typeof Badge> = {
  title: 'Components/Primitives/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['accent', 'success', 'invalid', 'info', 'neutral', 'ink'],
    },
    appearance: { control: 'inline-radio', options: ['tint', 'solid'] },
    shape: { control: 'inline-radio', options: ['square', 'rounded'] },
    uppercase: { control: 'boolean' },
    className: { control: 'text' },
    children: { control: 'text' },
  },
  args: {
    tone: 'neutral',
    appearance: 'tint',
    shape: 'square',
    uppercase: true,
    children: 'Full board',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: a neutral square tag, uppercased by the variant. */
export const Default: Story = {
  render: (args) => (
    <Surface>
      <Badge {...args} />
    </Surface>
  ),
};

/** The classification set - a board type, a tag, a timeline marker. */
export const Tones: Story = {
  render: (args) => (
    <Surface>
      <Badge {...args} tone="neutral">
        Full board
      </Badge>
      <Badge {...args} tone="accent">
        Quick
      </Badge>
      <Badge {...args} tone="success">
        Recurring
      </Badge>
      <Badge {...args} tone="info">
        Awaiting approval
      </Badge>
      <Badge {...args} tone="invalid">
        Message
      </Badge>
      <Badge {...args} tone="ink">
        Internal
      </Badge>
    </Surface>
  ),
};

/** Solid is the step up for a marker that has to be read before the card around it. */
export const Appearances: Story = {
  render: (args) => (
    <Surface>
      <Badge {...args} tone="ink" appearance="tint">
        Tint
      </Badge>
      <Badge {...args} tone="ink" appearance="solid">
        Action needed
      </Badge>
    </Surface>
  ),
};

/** Square classifies, rounded footnotes - the softer corner for a board-card count. */
export const Shapes: Story = {
  render: (args) => (
    <Surface>
      <Badge {...args} shape="square">
        Priority
      </Badge>
      <Badge {...args} shape="rounded" uppercase={false}>
        +2 photos
      </Badge>
    </Surface>
  ),
};

/** Callers pass normal text either way. Turn it off for a phrase rather than a label. */
export const Casing: Story = {
  render: (args) => (
    <Surface>
      <Badge {...args} uppercase>
        New
      </Badge>
      <Badge {...args} uppercase={false} shape="rounded">
        Awaiting approval
      </Badge>
    </Surface>
  ),
};

/** Every tone against both appearances - the reference spread from the design system. */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Surface>
        <Badge {...args} tone="accent" appearance="tint">
          Accent
        </Badge>
        <Badge {...args} tone="success" appearance="tint">
          Success
        </Badge>
        <Badge {...args} tone="invalid" appearance="tint">
          Invalid
        </Badge>
        <Badge {...args} tone="info" appearance="tint">
          Info
        </Badge>
        <Badge {...args} tone="neutral" appearance="tint">
          Neutral
        </Badge>
        <Badge {...args} tone="ink" appearance="tint">
          Ink
        </Badge>
      </Surface>

      <Surface>
        <Badge {...args} tone="accent" appearance="solid">
          Accent
        </Badge>
        <Badge {...args} tone="success" appearance="solid">
          Success
        </Badge>
        <Badge {...args} tone="invalid" appearance="solid">
          Invalid
        </Badge>
        <Badge {...args} tone="info" appearance="solid">
          Info
        </Badge>
        <Badge {...args} tone="neutral" appearance="solid">
          Neutral
        </Badge>
        <Badge {...args} tone="ink" appearance="solid">
          Ink
        </Badge>
      </Surface>
    </div>
  ),
};
