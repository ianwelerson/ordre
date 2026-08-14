import type { Meta, StoryObj } from '@storybook/react';

import type { ReactNode } from 'react';

import { Typography } from '../Typography/Typography';
import { Card } from './Card';

/**
 * The design system shows each card on the surface it is meant to sit on: `standard`
 * and `ink` on Snow, `quiet` on White. Without that background the three read the
 * same, so every story stages its card the way `15 - Cards` does.
 */
const Surface = ({ tone, children }: { tone: 'snow' | 'white'; children: ReactNode }) => (
  <div
    style={{
      width: '320px',
      padding: '32px 24px',
      borderRadius: '12px',
      background:
        tone === 'snow'
          ? 'var(--color-background, #fafaf8)'
          : 'var(--color-background-elevated, #ffffff)',
    }}
  >
    {children}
  </div>
);

const meta: Meta<typeof Card> = {
  title: 'Components/Surfaces/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['standard', 'quiet', 'ink'] },
    padding: { control: 'inline-radio', options: ['none', 'standard'] },
    interactive: { control: 'boolean' },
    tag: { control: 'inline-radio', options: ['div', 'section'] },
    className: { control: 'text' },
    children: { control: false },
  },
  args: {
    tag: 'div',
    variant: 'standard',
    padding: 'standard',
    interactive: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The workhorse surface: White on Snow. Shadow only on hover when clickable. */
export const Standard: Story = {
  args: { variant: 'standard' },
  render: (args) => (
    <Surface tone="snow">
      <Card {...args}>
        <Typography tag="span" variant="mono-label">
          Standard
        </Typography>
        <Typography tag="p" variant="h3">
          Cards rest at one elevation.
        </Typography>
        <Typography tag="p" variant="body">
          Shadow only on hover when clickable.
        </Typography>
      </Card>
    </Surface>
  ),
};

/** Snow on White. The nested container - use it inside a standard card. */
export const Quiet: Story = {
  args: { variant: 'quiet' },
  render: (args) => (
    <Surface tone="white">
      <Card {...args}>
        <Typography tag="span" variant="mono-label">
          Quiet
        </Typography>
        <Typography tag="p" variant="h3">
          Nested container.
        </Typography>
        <Typography tag="p" variant="body">
          Snow background - use inside a white card.
        </Typography>
      </Card>
    </Surface>
  ),
};

/**
 * Midnight. Reserved for next-visit, plan card and hero anatomy.
 *
 * The copy is plain markup rather than `Typography` because the type scale bakes its
 * colours into each variant, and this card inverts all three.
 */
export const Ink: Story = {
  args: { variant: 'ink' },
  render: (args) => (
    <Surface tone="snow">
      <Card {...args}>
        <span className="text-2xs tracking-label text-amber font-mono font-medium uppercase">
          Ink
        </span>
        <p className="font-headline leading-title tracking-title text-xl font-semibold text-white">
          High-attention surface.
        </p>
        <p className="leading-body text-base text-white/65">
          Reserved for next-visit, plan card, hero anatomy.
        </p>
      </Card>
    </Surface>
  ),
};

/**
 * Clickable. Hover the card to see it - cards rest at one elevation, so the lift to
 * `shadow-raised` is the whole affordance.
 *
 * `interactive` is presentation only: it does not make the card focusable or give it a
 * role. Put the real control inside, or reach for `Button` with `href` when the whole
 * surface should be one target.
 */
export const Interactive: Story = {
  args: { variant: 'standard', interactive: true },
  render: (args) => (
    <Surface tone="snow">
      <Card {...args}>
        <Typography tag="span" variant="mono-label">
          Interactive
        </Typography>
        <Typography tag="p" variant="h3">
          Hover me.
        </Typography>
        <Typography tag="p" variant="body">
          Shadow only on hover when clickable.
        </Typography>
      </Card>
    </Surface>
  ),
};

/** The three side by side, each on its own surface - the reference spread from the DS. */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <Surface tone="snow">
        <Card {...args} variant="standard">
          <Typography tag="span" variant="mono-label">
            Standard
          </Typography>
          <Typography tag="p" variant="h3">
            Cards rest at one elevation.
          </Typography>
          <Typography tag="p" variant="body">
            Shadow only on hover when clickable.
          </Typography>
        </Card>
      </Surface>

      <Surface tone="white">
        <Card {...args} variant="quiet">
          <Typography tag="span" variant="mono-label">
            Quiet
          </Typography>
          <Typography tag="p" variant="h3">
            Nested container.
          </Typography>
          <Typography tag="p" variant="body">
            Snow background - use inside a white card.
          </Typography>
        </Card>
      </Surface>

      <Surface tone="snow">
        <Card {...args} variant="ink">
          <span className="text-2xs tracking-label text-amber font-mono font-medium uppercase">
            Ink
          </span>
          <p className="font-headline leading-title tracking-title text-xl font-semibold text-white">
            High-attention surface.
          </p>
          <p className="leading-body text-base text-white/65">
            Reserved for next-visit, plan card, hero anatomy.
          </p>
        </Card>
      </Surface>
    </div>
  ),
};
