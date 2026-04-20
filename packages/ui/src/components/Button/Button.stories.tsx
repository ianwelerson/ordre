import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    intent: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'base', 'lg'] },
    align: { control: 'select', options: ['left', 'center', 'right'] },
    fullWidth: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    iconPosition: { control: 'select', options: ['leading', 'trailing'] },
    icon: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click me',
    size: 'base',
    fullWidth: false,
    iconOnly: false,
    intent: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Click me',
    size: 'base',
    fullWidth: false,
    iconOnly: false,
    intent: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Click me',
    size: 'base',
    fullWidth: false,
    iconOnly: false,
    intent: 'ghost',
  },
};

export const LeadingIcon: Story = {
  args: {
    children: 'Click me',
    size: 'base',
    fullWidth: false,
    iconOnly: false,
    intent: 'primary',
    icon: 'plus',
  },
};

export const TrailingIcon: Story = {
  args: {
    children: 'Click me',
    size: 'base',
    fullWidth: false,
    iconOnly: false,
    intent: 'primary',
    iconPosition: 'trailing',
    icon: 'arrow-right',
  },
};

export const IconOnly: Story = {
  args: {
    iconPosition: 'trailing',
    icon: 'arrow-right',
    iconOnly: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Click me',
    size: 'base',
    iconOnly: false,
    intent: 'primary',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};
