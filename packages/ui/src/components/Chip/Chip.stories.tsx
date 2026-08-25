import type { Meta, StoryObj } from '@storybook/react';

import type { ReactNode } from 'react';

import { Chip } from './Chip';

/** Staged on Snow: the `outline` appearance is White, and would vanish on a white canvas. */
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

const meta: Meta<typeof Chip> = {
  title: 'Components/Primitives/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['accent', 'success', 'invalid', 'info', 'neutral', 'ink'],
    },
    appearance: { control: 'inline-radio', options: ['tint', 'solid', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    uppercase: { control: 'boolean' },
    dot: { control: 'boolean' },
    icon: { control: 'text' },
    className: { control: 'text' },
    children: { control: 'text' },
  },
  args: {
    tone: 'neutral',
    appearance: 'tint',
    size: 'md',
    uppercase: false,
    children: 'Pending',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: a neutral tinted pill, sentence case, no leading mark. */
export const Default: Story = {
  render: (args) => (
    <Surface>
      <Chip {...args} />
    </Surface>
  ),
};

/** The status set. An app maps its own vocabulary onto these: "overdue" is `invalid`. */
export const Tones: Story = {
  render: (args) => (
    <Surface>
      <Chip {...args} tone="accent" dot>
        In progress
      </Chip>
      <Chip {...args} tone="success" dot>
        Completed
      </Chip>
      <Chip {...args} tone="neutral" dot>
        Pending
      </Chip>
      <Chip {...args} tone="invalid" dot>
        Urgent
      </Chip>
      <Chip {...args} tone="info" dot>
        Awaiting client
      </Chip>
      <Chip {...args} tone="ink" dot>
        Archived
      </Chip>
    </Surface>
  ),
};

/** Tinted reports, solid asserts, outlined recedes behind the status beside it. */
export const Appearances: Story = {
  render: (args) => (
    <Surface>
      <Chip {...args} tone="accent" appearance="tint" dot>
        Tint
      </Chip>
      <Chip {...args} tone="ink" appearance="solid">
        Solid
      </Chip>
      <Chip {...args} appearance="outline">
        Outline
      </Chip>
    </Surface>
  ),
};

/** Two steps. `sm` is the badge step used in dense rows and mobile heroes. */
export const Sizes: Story = {
  render: (args) => (
    <Surface>
      <Chip {...args} tone="accent" size="sm" dot>
        Small
      </Chip>
      <Chip {...args} tone="accent" size="md" dot>
        Medium
      </Chip>
    </Surface>
  ),
};

/** Shouted labels take the wider tracking with them, so the caps stay legible. */
export const Uppercase: Story = {
  render: (args) => (
    <Surface>
      <Chip {...args} tone="accent" size="sm" uppercase dot>
        In progress
      </Chip>
      <Chip {...args} tone="accent" size="sm" uppercase>
        Next visit
      </Chip>
    </Surface>
  ),
};

/**
 * A dot and an icon are alternatives, never a pair - the props are a union, so asking
 * for both is a type error rather than a layout surprise.
 */
export const WithIcon: Story = {
  render: (args) => (
    <Surface>
      <Chip {...args} tone="success" icon="check">
        Verified
      </Chip>
      <Chip {...args} appearance="outline" size="sm" icon="image">
        6 photos
      </Chip>
      <Chip {...args} appearance="outline" size="sm" uppercase icon="star">
        Quick board
      </Chip>
    </Surface>
  ),
};

/** Every tone against every appearance - the reference spread from the design system. */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Surface>
        <Chip {...args} tone="accent" appearance="tint" dot>
          Accent
        </Chip>
        <Chip {...args} tone="success" appearance="tint" dot>
          Success
        </Chip>
        <Chip {...args} tone="invalid" appearance="tint" dot>
          Invalid
        </Chip>
        <Chip {...args} tone="info" appearance="tint" dot>
          Info
        </Chip>
        <Chip {...args} tone="neutral" appearance="tint" dot>
          Neutral
        </Chip>
        <Chip {...args} tone="ink" appearance="tint" dot>
          Ink
        </Chip>
      </Surface>

      <Surface>
        <Chip {...args} tone="accent" appearance="solid">
          Accent
        </Chip>
        <Chip {...args} tone="success" appearance="solid">
          Success
        </Chip>
        <Chip {...args} tone="invalid" appearance="solid">
          Invalid
        </Chip>
        <Chip {...args} tone="info" appearance="solid">
          Info
        </Chip>
        <Chip {...args} tone="neutral" appearance="solid">
          Neutral
        </Chip>
        <Chip {...args} tone="ink" appearance="solid">
          Ink
        </Chip>
      </Surface>

      <Surface>
        <Chip {...args} tone="accent" appearance="outline">
          Accent
        </Chip>
        <Chip {...args} tone="success" appearance="outline">
          Success
        </Chip>
        <Chip {...args} tone="invalid" appearance="outline">
          Invalid
        </Chip>
        <Chip {...args} tone="info" appearance="outline">
          Info
        </Chip>
        <Chip {...args} tone="neutral" appearance="outline">
          Neutral
        </Chip>
        <Chip {...args} tone="ink" appearance="outline">
          Ink
        </Chip>
      </Surface>
    </div>
  ),
};
