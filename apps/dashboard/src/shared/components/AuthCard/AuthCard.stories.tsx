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
 * The sheet on its own. Its children are the screen's blocks, and the card's own
 * gap is what separates them - a screen never sets that spacing itself.
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
 * Three blocks rather than two, to show the rhythm the card imposes. Nothing here
 * declares a margin: the gap between the heading, the form and the footnote is
 * the same distance on every auth screen because it is set in one place.
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
 * Below its own width the card squares its corners and runs edge to edge, so a
 * narrow phone does not show a floating sheet on a margin. Resize the frame to
 * cross 460px.
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
