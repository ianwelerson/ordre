import type { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';

import { RadioGroup, type RadioGroupProps, type RadioOption } from './RadioGroup';

const CADENCE: RadioOption[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/Form/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    helper: { control: 'text' },
    invalidMessage: { control: 'text' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    columns: { control: 'inline-radio', options: [1, 2] },
    className: { control: 'text' },
  },
  args: {
    name: 'cadence',
    label: 'Cadence',
    options: CADENCE,
    defaultValue: 'biweekly',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** One column. The chosen option's label lifts out of the muted resting colour. */
export const Vertical: Story = {};

/** Two columns suit short options; anything that wraps wants one. */
export const TwoColumns: Story = {
  args: { columns: 2 },
};

export const WithHelper: Story = {
  args: { helper: 'Visits repeat on this rhythm until the contract ends.' },
};

export const Invalid: Story = {
  args: {
    defaultValue: undefined,
    helper: 'Visits repeat on this rhythm until the contract ends.',
    invalid: true,
    invalidMessage: 'Pick a cadence to schedule the first visit.',
  },
};

/** A single option can be ruled out without ruling out the group. */
export const OptionDisabled: Story = {
  args: {
    options: [...CADENCE.slice(0, 3), { value: 'quarterly', label: 'Quarterly', disabled: true }],
  },
};

export const GroupDisabled: Story = {
  args: { disabled: true },
};

const ControlledExample = (args: RadioGroupProps) => {
  const [value, setValue] = useState('weekly');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RadioGroup {...args} value={value} defaultValue={undefined} onChange={setValue} />
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>
        value: {value}
      </code>
    </div>
  );
};

/** Driven from outside, for a form that keeps its own state. */
export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
};
