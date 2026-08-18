import type { Meta, StoryObj } from '@storybook/react';

import { Avatar } from './Avatar';

const SIZES = ['xs', 'sm', 'md', 'lg'] as const;
const TONES = ['light', 'ink'] as const;

const PHOTO = 'https://api.dicebear.com/10.x/personas/svg?backgroundColor=b6e3f4&seed=t0bn1ea1';
const LOGO = 'https://api.dicebear.com/10.x/shape-grid/svg?seed=Felix';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Primitives/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    image: { control: 'text' },
    size: { control: 'inline-radio', options: SIZES },
    tone: { control: 'inline-radio', options: TONES },
    inset: { control: 'boolean' },
    className: { control: 'text' },
  },
  args: {
    label: 'Ada Lovelace',
    size: 'md',
    tone: 'light',
    inset: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const Photo: Story = {
  args: { image: PHOTO },
};

export const Logo: Story = {
  args: { image: LOGO, inset: true },
};

export const SingleWordLabel: Story = {
  args: { label: 'Bikeshop' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {SIZES.map((size) => (
        <Avatar {...args} key={size} size={size} />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {TONES.map((tone) => (
        <Avatar {...args} key={tone} tone={tone} />
      ))}
    </div>
  ),
};

export const InsetSizes: Story = {
  args: { image: LOGO, inset: true },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {SIZES.map((size) => (
        <Avatar {...args} key={size} size={size} />
      ))}
    </div>
  ),
};
