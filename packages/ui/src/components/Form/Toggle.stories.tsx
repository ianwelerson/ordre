import type { Meta, StoryObj } from '@storybook/react';

import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Components/Form/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    helper: { control: 'text' },
    invalidMessage: { control: 'text' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    className: { control: 'text' },
  },
  args: {
    name: 'digest',
    label: 'Email notifications',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '420px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Off is the resting border colour; on is the accent. */
export const Off: Story = {};

export const On: Story = {
  args: { defaultChecked: true },
};

/** The label leads and the switch trails, so a column of them shares one right edge. */
export const WithDescription: Story = {
  args: {
    description: 'A daily digest of activity, plus immediate alerts for client replies.',
    defaultChecked: true,
  },
};

export const WithHelper: Story = {
  args: { helper: 'Sent at 08:00 in your workspace timezone.' },
};

/**
 * The invalid signal is a ring rather than a recoloured track: tinting the track would
 * read as the other position.
 */
export const Invalid: Story = {
  args: {
    label: 'At least one channel',
    invalid: true,
    invalidMessage: 'Turn on at least one way to reach you.',
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
};

/** A settings list. The rule between rows belongs to the list, not the switch. */
export const Rows: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {[
        {
          name: 'row-email',
          label: 'Email notifications',
          description: 'A daily digest of activity, plus immediate alerts for client replies.',
          on: true,
        },
        {
          name: 'row-signatures',
          label: 'Auto-collect approval signatures',
          description: 'Save approvals as a binding record on the board.',
          on: false,
        },
        {
          name: 'row-weekly',
          label: 'Weekly summary',
          description: 'Every Monday, what moved and what stalled.',
          on: true,
        },
      ].map((row, index) => (
        <div
          key={row.name}
          style={{
            padding: '14px 0',
            borderTop: index === 0 ? undefined : '1px solid var(--color-background-alt)',
          }}
        >
          <Toggle
            name={row.name}
            label={row.label}
            description={row.description}
            defaultChecked={row.on}
          />
        </div>
      ))}
    </div>
  ),
};
