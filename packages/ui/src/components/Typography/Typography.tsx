import { cva, type VariantProps } from 'class-variance-authority';

import type { ReactNode } from 'react';

const variants = cva([], {
  variants: {
    variant: {
      display: 'font-headline font-bold text-4xl leading-display-lg tracking-display-lg',
      h1: 'font-headline font-semibold text-3xl leading-display tracking-display',
      h2: 'font-headline font-semibold text-2xl leading-headline tracking-headline',
      h3: 'font-headline font-semibold text-xl leading-title tracking-title',
      subtitle: 'font-body font-medium text-lg leading-subtitle',
      body: 'font-body font-normal text-base leading-body',
      caption: 'font-body font-normal text-xs leading-caption',
      // The eyebrow step, not `tracking-label`, despite the name: variant names and
      // tracking tokens are separate ladders here (`h2` takes `tracking-headline`).
      // The eyebrow and the field label both specify 0.14em and only the divider
      // label specifies 0.12em, so the wider step is what the shared variant carries.
      'mono-label': 'font-mono font-medium text-2xs tracking-eyebrow uppercase',
      'mono-token': 'font-mono font-normal text-xs leading-caption',
      'mono-sample': 'font-mono font-normal text-xs leading-caption',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-foreground-muted',
      subtle: 'text-foreground-subtle',
      invalid: 'text-invalid',
      success: 'text-success',
      info: 'text-info',
    },
    italic: {
      true: 'italic',
      false: '',
    },
    underline: {
      true: 'underline',
      false: '',
    },
    strikethrough: {
      true: 'line-through',
      false: '',
    },
    uppercase: {
      true: 'uppercase',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'body',
    italic: false,
    underline: false,
    strikethrough: false,
    uppercase: false,
  },
});

export type TypographyVariant = NonNullable<VariantProps<typeof variants>['variant']>;
export type TypographyTone = NonNullable<VariantProps<typeof variants>['tone']>;

/**
 * The tone each variant reads as when the caller does not ask for one. Colour lives
 * only in `tone`, so exactly one `text-*` class is ever emitted and an override wins
 * without needing importance or a class merger.
 */
const defaultTone: Record<TypographyVariant, TypographyTone> = {
  display: 'default',
  h1: 'default',
  h2: 'default',
  h3: 'default',
  subtitle: 'muted',
  body: 'muted',
  caption: 'subtle',
  'mono-label': 'subtle',
  'mono-token': 'default',
  'mono-sample': 'muted',
};

export interface TypographyProps extends VariantProps<typeof variants> {
  children?: ReactNode;
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  /** Needed when something else has to point at this text, e.g. `aria-describedby`. */
  id?: string;
  className?: string;
}

/**
 * Type scale, decoupled from document structure: `variant` picks the look and `tag`
 * picks the element, so a visual choice never dictates the heading outline.
 */
export const Typography = ({
  children,
  className,
  id,
  tag: Tag,
  variant,
  tone,
  italic,
  underline,
  strikethrough,
  uppercase,
}: TypographyProps) => {
  return (
    <Tag
      data-testid="typography"
      id={id}
      className={variants({
        variant,
        tone: tone ?? defaultTone[variant ?? 'body'],
        italic,
        underline,
        strikethrough,
        uppercase,
        className,
      })}
    >
      {children}
    </Tag>
  );
};
