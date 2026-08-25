import type { Meta, StoryObj } from '@storybook/react';

import { TextLink } from '@ordre/ui/components';

import { AuthFootnote } from './AuthFootnote';

const meta: Meta<typeof AuthFootnote> = {
  title: 'Dashboard/Auth/AuthFootnote',
  component: AuthFootnote,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '380px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The way to the screen that would have suited the reader better. It is a direct
 * child of `AuthCard`, never nested inside the form above it, which is what gives
 * every screen the same distance between the action and this line.
 */
export const Default: Story = {
  render: () => (
    <AuthFootnote>
      Don&apos;t have an account?{' '}
      <TextLink variant="inline" href="/get-started">
        Create one
      </TextLink>
    </AuthFootnote>
  ),
};

/** Two links in one sentence, which is what the invite screen's terms line is. */
export const WithTwoLinks: Story = {
  render: () => (
    <AuthFootnote>
      By continuing you agree to Ordre&apos;s{' '}
      <TextLink variant="inline" href="/terms">
        Terms
      </TextLink>{' '}
      and{' '}
      <TextLink variant="inline" href="/privacy">
        Privacy Policy
      </TextLink>
      .
    </AuthFootnote>
  ),
};

/** A bare link, with no sentence around it - the way out of the wrong-account card. */
export const LinkOnly: Story = {
  render: () => (
    <AuthFootnote>
      <TextLink variant="inline" href="/">
        Back to the dashboard
      </TextLink>
    </AuthFootnote>
  ),
};
