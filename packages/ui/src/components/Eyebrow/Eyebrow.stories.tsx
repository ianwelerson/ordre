import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from '../Typography/Typography';
import { Eyebrow } from './Eyebrow';

const meta: Meta<typeof Eyebrow> = {
  title: 'Components/Eyebrow',
  component: Eyebrow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    leading: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    children: 'Sign in',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The label on its own: a 32px rule, then mono uppercase type. */
export const Standard: Story = {};

/**
 * A qualifier ahead of the label, separated by a middot. The middot is decoration and
 * is hidden from the accessibility tree, so the two halves read as one phrase.
 */
export const WithLeading: Story = {
  args: { leading: 'Step 1' },
};

/**
 * The casing belongs to the type scale, not the caller: `mono-label` uppercases the
 * label, so both rows below render identically.
 */
export const Casing: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Eyebrow {...args}>Sign in</Eyebrow>
      <Eyebrow {...args}>SIGN IN</Eyebrow>
    </div>
  ),
};

/**
 * How the sign-in card uses it. The eyebrow carries the rule only - the space down to
 * the headline is the card's, so the group sets it once for all three lines.
 */
export const AboveAHeadline: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '380px' }}>
      <Eyebrow {...args} />
      <Typography tag="h1" variant="h2">
        Welcome back.
      </Typography>
      <Typography tag="p" variant="body">
        Pick up where you left off, your boards are waiting.
      </Typography>
    </div>
  ),
};
