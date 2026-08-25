import type { Meta, StoryObj } from '@storybook/react';

import type { ButtonAsButton } from '@ordre/ui/components';

import { AuthAction } from './AuthAction';

/**
 * Types the meta to the button branch rather than the whole component.
 * `AuthActionProps` is a union of a button and an anchor, and Storybook resolves
 * union args to `never`, which would leave every story demanding an arg it
 * cannot be given.
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
 * The default action. Size, width, and icon are fixed by the component, because
 * an auth screen has exactly one primary action and its presentation belongs to
 * the layout.
 */
export const Default: Story = {};

/**
 * Shows the action mid-request. The label is replaced by one that names the wait,
 * and the button disables itself so a second click cannot fire a second request.
 */
export const Busy: Story = {
  render: () => (
    <AuthAction loading loadingLabel="Joining workspace...">
      Accept invite &amp; continue
    </AuthAction>
  ),
};

/**
 * Renders an anchor instead of a button when given `href`. The dead-end screens
 * use this, since an expired link or a spent invite offers a way onward rather
 * than a retry.
 */
export const AsALink: Story = {
  render: () => <AuthAction href="/forgot-password">Request a new link</AuthAction>,
};
