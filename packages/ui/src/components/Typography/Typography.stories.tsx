import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from './Typography';

const VARIANTS = [
  'caption',
  'body',
  'subtitle',
  'title',
  'headline',
  'display',
  'display-lg',
  'mono-label',
  'mono-token',
  'mono-sample',
] as const;

const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'] as const;

const meta: Meta<typeof Typography> = {
  title: 'Components/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
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

export const Caption: Story = {
  args: { children: 'Caption · fine print', variant: 'caption', tag: 'span' },
};

export const Body: Story = {
  args: { children: 'Body copy for paragraphs.', variant: 'body', tag: 'p' },
};

export const Subtitle: Story = {
  args: { children: 'Subtitle for lead-in copy', variant: 'subtitle', tag: 'p' },
};

export const Title: Story = {
  args: { children: 'Section title', variant: 'title', tag: 'h3' },
};

export const Headline: Story = {
  args: { children: 'Page headline', variant: 'headline', tag: 'h2' },
};

export const Display: Story = {
  args: { children: 'Display heading', variant: 'display', tag: 'h1' },
};

export const DisplayLarge: Story = {
  args: { children: 'Marketing hero', variant: 'display-lg', tag: 'h1' },
};

export const MonoLabel: Story = {
  args: {
    children: '01 · THE CLIENT BOARD',
    variant: 'mono-label',
    tag: 'span',
    uppercase: true,
  },
};

export const Uppercase: Story = {
  args: {
    children: 'section tag',
    variant: 'mono-label',
    tag: 'span',
    uppercase: true,
  },
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
    variant: 'display',
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

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <Typography tag="h1" variant="display-lg">
        Display large · 72px
      </Typography>
      <Typography tag="h1" variant="display">
        Display · 44px
      </Typography>
      <Typography tag="h2" variant="headline">
        Headline · 28px
      </Typography>
      <Typography tag="h3" variant="title">
        Title · 22px
      </Typography>
      <Typography tag="p" variant="subtitle">
        Subtitle · 18px - one link, live progress, silent clients.
      </Typography>
      <Typography tag="p" variant="body">
        Body · 16px - Your client sees the same board you do. Changes on the record, decisions in
        one tap, and every message tagged to a milestone.
      </Typography>
      <Typography tag="span" variant="caption">
        Caption · 14px - No credit card. Cancel anytime.
      </Typography>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <Typography tag="span" variant="mono-label" uppercase>
          01 · THE CLIENT BOARD
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
