import type { Meta, StoryObj } from '@storybook/react';

import type { ButtonAsButton } from '@ordre/ui/components';

import { AuthAction } from './AuthAction';

/**
 * Typed to the button branch rather than to the component. `AuthActionProps` is a
 * union - a button or an anchor, decided by `href` - and Storybook resolves args
 * across a union to `never`, which leaves every story demanding an arg it cannot
 * be given. The anchor still has a story; it renders itself instead of being
 * configured through controls.
 */
const meta: Meta<ButtonAsButton> = {
  title: 'Dashboard/Auth/AuthAction',
  component: AuthAction,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    loading: { control: 'boolean' },
    loadingLabel: { control: 'text' },
  },
  args: {
    children: 'Sign in',
    loading: false,
  },
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
 * The one thing a screen asks its reader to do. Size, width and icon are fixed
 * rather than passed: an auth screen has exactly one primary action, so its
 * presentation is a property of the layout rather than a per-screen decision.
 */
export const Default: Story = {};

/**
 * Mid-request. The label is replaced by one that names the wait, and the button
 * takes itself out of action, so a second click cannot fire a second request.
 */
export const Busy: Story = {
  render: () => (
    <AuthAction loading loadingLabel="Joining workspace...">
      Accept invite &amp; continue
    </AuthAction>
  ),
};

/**
 * With `href` it renders an anchor instead. The dead ends use this - an expired
 * link or a spent invite offers a way onward, not a retry.
 */
export const AsALink: Story = {
  render: () => <AuthAction href="/forgot-password">Request a new link</AuthAction>,
};
