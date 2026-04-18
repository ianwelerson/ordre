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
    className: { control: 'text' },
    appName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click me',
    appName: 'MyApp',
  },
};

export const WithClassName: Story = {
  args: {
    children: 'Styled Button',
    className: 'bg-amber text-white px-4 py-2 rounded',
    appName: 'MyApp',
  },
};
