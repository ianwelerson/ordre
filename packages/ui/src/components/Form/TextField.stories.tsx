import type { Meta, StoryObj } from '@storybook/react';

import { TextField } from './TextField';

const VARIANTS = ['outlined', 'filled'] as const;
const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

const meta: Meta<typeof TextField> = {
  title: 'Components/Form/TextField',
  component: TextField,
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
    className: { control: 'text' },
  },
  args: {
    name: 'email',
    variant: 'outlined',
    size: 'md',
    label: 'Email',
    placeholder: 'mia@example.com',
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

/** An elevated surface behind a visible border, under a mono uppercase label. */
export const Outlined: Story = {};

/** A tinted surface with no resting border. It lifts to elevated on focus. */
export const Filled: Story = {
  args: { variant: 'filled', label: 'Display name', placeholder: 'Atelier Horlogerie' },
};

/**
 * Size is a separate axis from surface, on the same steps as Button so a field and the
 * button beside it line up.
 */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {SIZES.map((size) => (
        <TextField {...args} key={size} size={size} name={`email-${size}`} label={size} />
      ))}
    </div>
  ),
};

/** The same steps on the other surface: the two axes do not constrain each other. */
export const SizesFilled: Story = {
  args: { variant: 'filled' },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {SIZES.map((size) => (
        <TextField {...args} key={size} size={size} name={`name-${size}`} label={size} />
      ))}
    </div>
  ),
};

/** The quiet line under the field, in the caption scale. */
export const WithHelper: Story = {
  args: {
    label: 'Workspace name',
    placeholder: 'Defaults to "your name"',
    helper: 'This is what clients see at the top of every board.',
  },
};

/**
 * The error replaces the helper rather than joining it, so the form below never
 * shifts when a field goes invalid.
 */
export const Invalid: Story = {
  args: {
    invalid: true,
    helper: 'This is what clients see at the top of every board.',
    invalidMessage: "Looks like that email isn't valid.",
    defaultValue: 'not an email',
  },
};

/** Invalid on the filled field: the resting border is transparent, so it appears. */
export const InvalidFilled: Story = {
  args: {
    variant: 'filled',
    label: 'Display name',
    invalid: true,
    invalidMessage: 'Pick a name your clients will recognise.',
    defaultValue: '',
  },
};

/** The `OPTIONAL` tag rides in the label, not the helper line. */
export const Optional: Story = {
  args: { name: 'phone', label: 'Phone', optional: true, placeholder: '+351 912 345 678' },
};

/** A prefix shares the box with the control, inside the same border. */
export const WithPrefix: Story = {
  args: {
    variant: 'filled',
    name: 'amount',
    label: 'Amount',
    type: 'number',
    placeholder: '0.00',
    prefix: (
      <span className="text-foreground-subtle border-border shrink-0 border-r border-solid pr-2.5 font-mono text-xs">
        CHF
      </span>
    ),
  },
};

/** And a suffix on the other side. */
export const WithSuffix: Story = {
  args: {
    variant: 'filled',
    name: 'url',
    label: 'Custom URL',
    defaultValue: 'ordre.app/atelier-h',
    suffix: <span className="text-2xs text-foreground-subtle shrink-0 font-mono">.app</span>,
  },
};

/** Both flavours, every state, side by side. */
export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      {VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          <TextField
            variant={variant}
            name={`${variant}-default`}
            label="Email"
            placeholder="mia@example.com"
          />
          <TextField
            variant={variant}
            name={`${variant}-helper`}
            label="Workspace"
            defaultValue="Atelier Horlogerie"
            helper="Clients see this on every board."
          />
          <TextField
            variant={variant}
            name={`${variant}-invalid`}
            label="Email"
            defaultValue="not an email"
            invalid
            invalidMessage="Looks like that email isn't valid."
          />
          <TextField
            variant={variant}
            name={`${variant}-optional`}
            label="Phone"
            optional
            placeholder="+351 912 345 678"
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

/**
 * An action at the far end of the label row. It renders beside the label element, not
 * inside it, so clicking it does not also focus the field.
 */
export const WithLabelAction: Story = {
  args: {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Your password',
    labelAction: (
      <a
        href="#reset"
        className="font-body text-foreground hover:text-accent-strong text-xs font-medium underline underline-offset-3"
      >
        Forgot?
      </a>
    ),
  },
};
