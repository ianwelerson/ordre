import type { Meta, StoryObj } from '@storybook/react';

import { Avatar, Badge, Card, Typography } from '@ordre/ui/components';

import { AuthCard } from '../AuthCard/AuthCard';
import { AuthHeading } from './AuthHeading';

const meta: Meta<typeof AuthHeading> = {
  title: 'Dashboard/Auth/AuthHeading',
  component: AuthHeading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    eyebrow: { control: 'text' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    media: { control: false },
  },
  args: {
    eyebrow: 'Sign in',
    title: 'Welcome back.',
    subtitle: 'Pick up where you left off, your boards are waiting.',
  },
  decorators: [
    (Story) => (
      <AuthCard>
        <Story />
      </AuthCard>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** What a screen says it is: an eyebrow, a headline, and the sentence under it. */
export const Default: Story = {};

/**
 * The headline carries the whole message on a screen with nothing to add. The
 * subtitle is dropped rather than left empty, so no gap opens under the title.
 */
export const WithoutSubtitle: Story = {
  args: {
    eyebrow: 'Link expired',
    title: 'This link no longer works.',
    subtitle: undefined,
  },
};

/**
 * `media` belongs to the eyebrow, not to the page. Given one, the headline moves
 * below it as a block of its own, so the card's gap separates the two - which is
 * how the invite screens read as eyebrow, workspace, then title.
 */
export const WithMedia: Story = {
  args: {
    eyebrow: 'Join workspace',
    title: 'Set up your account.',
    subtitle: "You'll sign in with lucas@bikeshop.app.",
    media: (
      <Card variant="quiet">
        <div className="flex items-start gap-4">
          <Avatar label="Bike Shop" tone="ink" />
          <div className="flex flex-1 flex-col gap-1">
            <Typography tag="p" tone="default" variant="caption">
              <span className="font-bold">Ian Welerson</span> invited you to join{' '}
              <span className="font-bold">Bike Shop</span>
            </Typography>
            <Badge className="w-fit" tone="neutral">
              Member access
            </Badge>
          </div>
        </div>
      </Card>
    ),
  },
};
