import type { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';

import { Button } from '../Button/Button';
import { TextLink } from '../TextLink/TextLink';
import { Drawer, type DrawerProps } from './Drawer';

/**
 * The panel is `position: fixed`, so a story would otherwise cover the whole docs
 * page. A `transform` on the stage makes it the containing block instead, which is
 * the same trick the design system reference uses for its specimens.
 */
const Stage = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: 'relative',
      transform: 'translateZ(0)',
      overflow: 'hidden',
      height: '420px',
      width: '420px',
      maxWidth: '100%',
      border: '1px solid var(--color-border, #d9d6d0)',
      borderRadius: '12px',
      background: 'var(--color-background, #fafaf8)',
    }}
  >
    {children}
  </div>
);

/** `open` is state, not an arg, so the stories drive it from a real trigger. */
const Demo = (args: Partial<DrawerProps>) => {
  const [open, setOpen] = useState(false);

  return (
    <Stage>
      <div style={{ padding: '24px' }}>
        <Button onClick={() => setOpen(true)} aria-controls={args.id}>
          Open drawer
        </Button>
      </div>

      <Drawer {...args} open={open} onClose={() => setOpen(false)}>
        <div className="border-border flex h-17 shrink-0 items-center justify-between border-b border-solid pr-5 pl-6">
          <span className="font-headline font-semibold">Panel</span>
          <Button
            leadingIcon="x"
            variant="ghost"
            className="-mr-2.5"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
        </div>
        <nav className="flex flex-col">
          <TextLink href="#" variant="menu" trailingIcon="arrow-right">
            Product
          </TextLink>
          <TextLink href="#" variant="menu" trailingIcon="arrow-right">
            Pricing
          </TextLink>
        </nav>
      </Drawer>
    </Stage>
  );
};

const meta: Meta<typeof Drawer> = {
  title: 'Components/Surfaces/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    side: { control: 'inline-radio', options: ['left', 'right'] },
    label: { control: 'text' },
    className: { control: 'text' },
    wrapperClassName: { control: 'text' },
    id: { control: 'text' },
    open: { control: false },
    onClose: { control: false },
    children: { control: false },
  },
  args: {
    id: 'drawer-demo',
    label: 'Menu',
    side: 'right',
    className: 'w-[min(320px,86vw)]',
    // Required by the component, but the demo owns them. Listed so the stories stay
    // free of boilerplate they would otherwise have to repeat.
    open: false,
    onClose: () => {},
    children: null,
  },
  render: (args) => <Demo {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Escape, an overlay click, and the close button all dismiss it. */
export const Right: Story = {};

/** Mirrors the transform and the border, for a dashboard sidebar. */
export const Left: Story = {
  args: { side: 'left' },
};

/** `className` sets the panel, so the width is the caller's call. */
export const Wide: Story = {
  args: { className: 'w-[min(420px,92vw)]' },
};
