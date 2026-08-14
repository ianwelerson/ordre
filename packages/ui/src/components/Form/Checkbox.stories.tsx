import type { Meta, StoryObj } from '@storybook/react';

import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Form/Checkbox',
  component: Checkbox,
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
    name: 'remember',
    label: 'Keep me signed in on this device',
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

/** The mark fills with ink and the check comes in amber. */
export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

/** A second line for what ticking the box actually commits to. */
export const WithDescription: Story = {
  args: {
    label: 'Auto-collect approval signatures',
    description: 'Approvals are stored as a binding record on the board.',
  },
};

export const WithHelper: Story = {
  args: { helper: 'Only on devices you trust.' },
};

/** The error takes the helper's place, and the mark keeps its invalid border once ticked. */
export const Invalid: Story = {
  args: {
    label: 'I accept the terms',
    helper: 'Only on devices you trust.',
    invalid: true,
    invalidMessage: 'You have to accept the terms to continue.',
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
};

/** How a settings page stacks them. */
export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Checkbox
        name="notify-email"
        label="Email notifications"
        description="A daily digest, plus immediate alerts for client replies."
        defaultChecked
      />
      <Checkbox
        name="notify-sms"
        label="SMS notifications"
        description="Urgent client requests only."
      />
      <Checkbox
        name="notify-digest"
        label="Weekly summary"
        description="Every Monday, what moved and what stalled."
        defaultChecked
      />
    </div>
  ),
};
