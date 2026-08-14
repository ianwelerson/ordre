import type { Meta, StoryObj } from '@storybook/react';

import { TextArea } from './TextArea';

const VARIANTS = ['outlined', 'filled'] as const;
const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

const meta: Meta<typeof TextArea> = {
  title: 'Components/Form/TextArea',
  component: TextArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    size: { control: 'inline-radio', options: SIZES },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helper: { control: 'text' },
    invalidMessage: { control: 'text' },
    optional: { control: 'boolean' },
    invalid: { control: 'boolean' },
    rows: { control: 'number' },
    className: { control: 'text' },
  },
  args: {
    name: 'note',
    variant: 'filled',
    size: 'md',
    label: 'Internal note',
    placeholder: 'Notes the client never sees...',
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

/** A tinted surface with no resting border. It lifts to elevated on focus. */
export const Filled: Story = {};

/** An elevated surface behind a visible border, under a mono uppercase label. */
export const Outlined: Story = {
  args: { variant: 'outlined', label: 'What changed?' },
};

/** The box floors at 100px; `rows` takes it higher. */
export const Tall: Story = {
  args: { rows: 8, label: 'Update' },
};

/**
 * Size sets the type and the horizontal inset. The 100px floor is shared, since a
 * multiline box grows past its height rather than being set to one.
 */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {SIZES.map((size) => (
        <TextArea {...args} key={size} size={size} name={`note-${size}`} label={size} />
      ))}
    </div>
  ),
};

export const WithHelper: Story = {
  args: { helper: 'Only your team can read this.' },
};

/** As with the single-line field, the error takes the helper's place. */
export const Invalid: Story = {
  args: {
    invalid: true,
    helper: 'Only your team can read this.',
    invalidMessage: 'An update needs at least a sentence.',
    defaultValue: 'ok',
  },
};

export const Optional: Story = {
  args: { optional: true, label: 'Extra detail' },
};

/** Both flavours side by side. */
export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      {VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          <TextArea
            variant={variant}
            name={`${variant}-default`}
            label="Internal note"
            placeholder="Notes the client never sees..."
          />
          <TextArea
            variant={variant}
            name={`${variant}-invalid`}
            label="Update"
            defaultValue="ok"
            invalid
            invalidMessage="An update needs at least a sentence."
          />
        </div>
      ))}
    </div>
  ),
  decorators: [
    (Story) => (
      <div style={{ width: '760px' }}>
        <Story />
      </div>
    ),
  ],
};
