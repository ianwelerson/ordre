import type { Meta, StoryObj } from '@storybook/react';

import { Alert } from './Alert';

const TONES = ['invalid', 'success', 'info'] as const;

const meta: Meta<typeof Alert> = {
  title: 'Components/Primitives/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'inline-radio', options: TONES },
    title: { control: 'text' },
    children: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    tone: 'invalid',
    children: 'That email and password do not match.',
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

/** A failed sign-in: wrong as a pair, so neither field is marked on its own. */
export const Invalid: Story = {};

export const Success: Story = {
  args: { tone: 'success', children: 'Your workspace is ready.' },
};

export const Info: Story = {
  args: { tone: 'info', children: 'Your invite expires in 48 hours.' },
};

/** A title earns its place when the body needs a sentence to explain itself. */
export const WithTitle: Story = {
  args: {
    tone: 'info',
    title: 'Check your inbox',
    children: 'We sent a sign-in link to mia@example.com. It is good for one hour.',
  },
};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {TONES.map((tone) => (
        <Alert {...args} key={tone} tone={tone}>
          {tone} · the message reads the same, the tone does the rest
        </Alert>
      ))}
    </div>
  ),
};
