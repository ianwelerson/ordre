import type { Meta, StoryObj } from '@storybook/react';

import { Button, Eyebrow, TextField, Typography } from '@ordre/ui/components';

import { AuthCard } from './AuthCard';

const meta: Meta<typeof AuthCard> = {
  title: 'Dashboard/Auth/AuthCard',
  component: AuthCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The card on its own. Its children are the screen's blocks, and the card's gap
 * is what separates them, so a screen never sets that spacing itself.
 */
export const Default: Story = {
  render: () => (
    <AuthCard>
      <div className="flex flex-col gap-3.5">
        <Eyebrow>Sign in</Eyebrow>
        <div className="flex flex-col gap-2.5">
          <Typography tag="h1" variant="h2">
            Welcome back.
          </Typography>
          <Typography tag="p" variant="body">
            Pick up where you left off, your boards are waiting.
          </Typography>
        </div>
      </div>
      <form className="flex flex-col gap-4.5">
        <TextField name="email" type="email" size="lg" label="Email" placeholder="you@ordre.app" />
        <Button size="lg" trailingIcon="arrow-right" fullWidth>
          Sign in
        </Button>
      </form>
    </AuthCard>
  ),
};

/**
 * Shows three blocks rather than two, so the spacing the card imposes is visible.
 * Nothing here declares a margin, which is why the distance is identical on every
 * auth screen.
 */
export const WithFootnote: Story = {
  render: () => (
    <AuthCard>
      <div className="flex flex-col gap-2.5">
        <Typography tag="h1" variant="h2">
          Trouble signing in?
        </Typography>
        <Typography tag="p" variant="body">
          Enter your email and we'll send you a link to set a new password.
        </Typography>
      </div>
      <form className="flex flex-col gap-4.5">
        <TextField name="email" type="email" size="lg" label="Email" placeholder="you@ordre.app" />
        <Button size="lg" trailingIcon="arrow-right" fullWidth>
          Send reset link
        </Button>
      </form>
      <div className="mt-1 text-center">
        <Typography tag="p" variant="caption">
          Remembered your password?
        </Typography>
      </div>
    </AuthCard>
  ),
};

/**
 * Shows the card below 460px, where it squares its corners and runs edge to edge
 * so a narrow phone does not display a floating card on a margin. Resize the
 * frame to cross the breakpoint.
 */
export const OnANarrowScreen: Story = {
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <AuthCard>
        <div className="flex flex-col gap-2.5">
          <Typography tag="h1" variant="h2">
            Welcome back.
          </Typography>
          <Typography tag="p" variant="body">
            Pick up where you left off.
          </Typography>
        </div>
        <Button size="lg" trailingIcon="arrow-right" fullWidth>
          Sign in
        </Button>
      </AuthCard>
    </div>
  ),
};
