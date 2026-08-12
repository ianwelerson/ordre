import { cva, type VariantProps } from 'class-variance-authority';

import type { ReactNode } from 'react';

const variants = cva([], {
  variants: {
    variant: {
      display:
        'font-headline font-bold text-4xl leading-display-lg tracking-display-lg text-foreground',
      h1: 'font-headline font-semibold text-3xl leading-display tracking-display text-foreground',
      h2: 'font-headline font-semibold text-2xl leading-headline tracking-headline text-foreground',
      h3: 'font-headline font-semibold text-xl leading-title tracking-title text-foreground',
      subtitle: 'font-body font-medium text-lg leading-subtitle text-foreground-muted',
      body: 'font-body font-normal text-base leading-body text-foreground-muted',
      caption: 'font-body font-normal text-xs leading-caption text-foreground-subtle',
      'mono-label':
        'font-mono font-medium text-2xs tracking-label uppercase text-foreground-subtle',
      'mono-token': 'font-mono font-normal text-xs leading-caption text-foreground',
      'mono-sample': 'font-mono font-normal text-xs leading-caption text-foreground-muted',
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

export interface TypographyProps extends VariantProps<typeof variants> {
  children?: ReactNode;
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  className?: string;
}

/**
 * Type scale, decoupled from document structure: `variant` picks the look and `tag`
 * picks the element, so a visual choice never dictates the heading outline.
 */
export const Typography = ({
  children,
  className,
  tag: Tag,
  variant,
  italic,
  underline,
  strikethrough,
  uppercase,
}: TypographyProps) => {
  return (
    <Tag
      data-testid="typography"
      className={variants({ variant, italic, underline, strikethrough, uppercase, className })}
    >
      {children}
    </Tag>
  );
};
