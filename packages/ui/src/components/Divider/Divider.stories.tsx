import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../Button/Button';
import { Typography } from '../Typography/Typography';
import { Divider, type DividerAsHorizontal, type DividerAsVertical } from './Divider';

const meta: Meta<DividerAsHorizontal> = {
  title: 'Components/Primitives/Divider',
  component: Divider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    tone: { control: 'inline-radio', options: ['standard', 'subtle'] },
    className: { control: 'text' },
  },
  args: {
    orientation: 'horizontal',
    tone: 'standard',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;
type VerticalStory = StoryObj<DividerAsVertical>;

/** The plain rule. Reach for it only when spacing alone does not draw the boundary. */
export const Standard: Story = {};

/** A label breaks the rule in two, set in the `mono-label` type scale. */
export const WithLabel: Story = {
  args: { children: 'Or' },
};

/** Ash at 30%. The quiet separator between nav groups in the sidebar. */
export const Subtle: Story = {
  args: { tone: 'subtle' },
};

/**
 * The vertical rule takes no label and no height of its own: it stretches to the row
 * it sits in, so that row has to have a height.
 */
export const Vertical: VerticalStory = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '24px' }}>
      <Typography tag="span" variant="caption">
        Boards
      </Typography>
      <Divider {...args} />
      <Typography tag="span" variant="caption">
        Clients
      </Typography>
      <Divider {...args} />
      <Typography tag="span" variant="caption">
        Settings
      </Typography>
    </div>
  ),
};

/** How the sign-in card uses it: one alternative route, spelled out between actions. */
export const BetweenActions: Story = {
  args: { children: 'Or' },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Button size="lg" trailingIcon="arrow-right" fullWidth>
        Sign in
      </Button>
      <Divider {...args} />
      <Button size="lg" leadingIcon="mail" fullWidth variant="secondary">
        Email me a sign-in link
      </Button>
    </div>
  ),
};
