import type { Meta, StoryObj } from '@storybook/react';

import type { ReactNode } from 'react';

import { Card } from '../Card/Card';
import { Skeleton } from './Skeleton';

/** Stages the three product surfaces, to show the translucent fill holding on each. */
const Surface = ({
  tone,
  label,
  children,
}: {
  tone: 'snow' | 'white' | 'alt';
  label: string;
  children: ReactNode;
}) => (
  <div
    style={{
      width: '220px',
      padding: '20px',
      borderRadius: '12px',
      background: {
        snow: 'var(--color-background, #fafaf8)',
        white: 'var(--color-background-elevated, #ffffff)',
        alt: 'var(--color-background-alt, #f0eeeb)',
      }[tone],
    }}
  >
    <div
      style={{
        marginBottom: '14px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--color-foreground-subtle, #8a8680)',
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Primitives/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    shape: { control: 'inline-radio', options: ['line', 'block', 'circle'] },
    label: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    shape: 'line',
    className: 'h-4 w-40',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A single placeholder. Width and height come from `className` - the component emits
 * none, because they belong to whatever content is missing.
 */
export const Default: Story = {
  render: (args) => (
    <Surface tone="snow" label="On Snow">
      <Skeleton {...args} />
    </Surface>
  ),
};

/** Three corners, for the three things a placeholder ever stands in for. */
export const Shapes: Story = {
  render: () => (
    <Surface tone="snow" label="Shapes">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton shape="line" className="h-4 w-40" />
        <Skeleton shape="block" className="h-20 w-40" />
        <Skeleton shape="circle" className="size-9" />
      </div>
    </Surface>
  ),
};

/**
 * The fill is `bg-foreground/8`, so it lands one tonal step darker than its host
 * rather than needing a tone picked per surface.
 */
export const OnEverySurface: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {(['snow', 'white', 'alt'] as const).map((tone) => (
        <Surface key={tone} tone={tone} label={`On ${tone}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Surface>
      ))}
    </div>
  ),
};

/**
 * A client row mid-load. Compose skeletons in the same wrapper the real row uses, so
 * nothing shifts when the data arrives. Only one of them carries the `label`.
 */
export const ComposedRow: Story = {
  render: () => (
    <Surface tone="white" label="Client row">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Skeleton shape="circle" label="Loading clients" className="size-9 shrink-0" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </Surface>
  ),
};

/** The same idea at page scale: a card standing in for one that has not loaded. */
export const ComposedCard: Story = {
  render: () => (
    <Card className="flex w-xs flex-col gap-6">
      <div className="flex flex-col gap-3.5">
        <Skeleton label="Loading invite" className="h-2.5 w-24" />
        <Card variant="quiet">
          <div className="flex items-center gap-4">
            <Skeleton shape="circle" className="size-13 shrink-0" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
        </Card>
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton shape="block" className="h-12 w-full" />
    </Card>
  ),
};
