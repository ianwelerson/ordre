import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from './Typography';

const VARIANTS = [
  'display',
  'h1',
  'h2',
  'h3',
  'subtitle',
  'body',
  'caption',
  'mono-label',
  'mono-token',
  'mono-sample',
] as const;

const TONES = ['default', 'muted', 'subtle', 'invalid', 'success', 'info'] as const;

const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'] as const;

const meta: Meta<typeof Typography> = {
  title: 'Components/Primitives/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    tone: { control: 'select', options: TONES },
    tag: { control: 'select', options: TAGS },
    italic: { control: 'boolean' },
    underline: { control: 'boolean' },
    strikethrough: { control: 'boolean' },
    uppercase: { control: 'boolean' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'The quick brown fox jumps over the lazy dog',
    variant: 'body',
    tag: 'p',
  },
};

/** Marketing hero only. Fluid 44-88px. */
export const Display: Story = {
  args: { children: 'A status page for every job', variant: 'display', tag: 'h1' },
};

/** Page heading. Fluid 32-48px. */
export const H1: Story = {
  args: { children: 'Boards on the record', variant: 'h1', tag: 'h1' },
};

export const H2: Story = {
  args: { children: 'Every change in one tap', variant: 'h2', tag: 'h2' },
};

export const H3: Story = {
  args: { children: 'Workshops, not warehouses', variant: 'h3', tag: 'h3' },
};

export const Subtitle: Story = {
  args: { children: 'Subtitle for lead-in copy', variant: 'subtitle', tag: 'p' },
};

export const Body: Story = {
  args: { children: 'Body copy for paragraphs.', variant: 'body', tag: 'p' },
};

export const Caption: Story = {
  args: { children: 'Caption · fine print', variant: 'caption', tag: 'span' },
};

/** Structural labels are always mono uppercase - the variant bakes that in. */
export const MonoLabel: Story = {
  args: { children: '01 · The client board', variant: 'mono-label', tag: 'span' },
};

export const MonoToken: Story = {
  args: { children: 'go.ordre.app/K7F-RM2', variant: 'mono-token', tag: 'span' },
};

export const MonoSample: Story = {
  args: { children: 'Apr 14 · 09:12', variant: 'mono-sample', tag: 'span' },
};

export const Italic: Story = {
  args: {
    children: 'Stop fielding "any update?"',
    variant: 'h1',
    tag: 'h1',
    italic: true,
  },
};

export const Underline: Story = {
  args: {
    children: 'Read the full post',
    variant: 'body',
    tag: 'span',
    underline: true,
  },
};

export const Strikethrough: Story = {
  args: {
    children: '$49/mo',
    variant: 'subtitle',
    tag: 'span',
    strikethrough: true,
  },
};

/** Colour is a separate axis: every variant carries a sensible default tone, and any
 * variant can be recoloured without touching its scale. */
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {TONES.map((tone) => (
        <Typography key={tone} tag="p" variant="body" tone={tone}>
          {tone} · The quick brown fox
        </Typography>
      ))}
    </div>
  ),
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <Typography tag="h1" variant="display">
        Display · 44-88px
      </Typography>
      <Typography tag="h1" variant="h1">
        H1 · 32-48px
      </Typography>
      <Typography tag="h2" variant="h2">
        H2 · 28px
      </Typography>
      <Typography tag="h3" variant="h3">
        H3 · 22px
      </Typography>
      <Typography tag="p" variant="subtitle">
        Subtitle · 18px - one link, live progress, silent clients.
      </Typography>
      <Typography tag="p" variant="body">
        Body · 16px - Your client sees the same board you do. Changes on the record, decisions in
        one tap, and every message tagged to a milestone.
      </Typography>
      <Typography tag="span" variant="caption">
        Caption · 13px - No credit card. Cancel anytime.
      </Typography>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <Typography tag="span" variant="mono-label">
          01 · The client board
        </Typography>
        <Typography tag="span" variant="mono-token">
          go.ordre.app/K7F-RM2
        </Typography>
        <Typography tag="span" variant="mono-sample">
          Apr 14 · 09:12
        </Typography>
      </div>
    </div>
  ),
};
