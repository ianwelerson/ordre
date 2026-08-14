import type { Meta, StoryObj } from '@storybook/react';

import { PasswordField } from './PasswordField';

const meta: Meta<typeof PasswordField> = {
  title: 'Components/Form/PasswordField',
  component: PasswordField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['outlined', 'filled'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helper: { control: 'text' },
    invalidMessage: { control: 'text' },
    invalid: { control: 'boolean' },
    className: { control: 'text' },
  },
  args: {
    name: 'password',
    variant: 'outlined',
    size: 'md',
    label: 'Password',
    defaultValue: 'correct-horse-battery',
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

/** The toggle flips the input's `type`; the control starts masked. */
export const Outlined: Story = {};

export const Filled: Story = {
  args: { variant: 'filled' },
};

/** The toggle sits inside the shortest box rather than stretching it. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <PasswordField {...args} key={size} size={size} name={`password-${size}`} label={size} />
      ))}
    </div>
  ),
};

export const WithHelper: Story = {
  args: { helper: 'At least 8 characters, one number and one symbol.' },
};

export const Invalid: Story = {
  args: {
    invalid: true,
    invalidMessage: "That password doesn't match the one on file.",
  },
};
