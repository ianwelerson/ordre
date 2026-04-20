import { cva, type VariantProps } from 'class-variance-authority';

import type { ReactNode } from 'react';

const variants = cva([], {
  variants: {
    variant: {
      caption: 'font-body font-normal text-sm leading-caption text-foreground-subtle',
      body: 'font-body font-normal text-base leading-body text-foreground-muted',
      subtitle: 'font-body font-medium text-lg leading-subtitle text-foreground-muted',
      title: 'font-headline font-semibold text-xl leading-title tracking-title text-foreground',
      headline:
        'font-headline font-semibold text-2xl leading-headline tracking-headline text-foreground',
      display:
        'font-headline font-semibold text-3xl leading-display tracking-display text-foreground',
      'display-lg':
        'font-headline font-bold text-4xl leading-display-lg tracking-display-lg text-foreground',
      'mono-label': 'font-mono font-medium text-sm text-foreground-subtle',
      'mono-token': 'font-mono font-normal text-sm text-foreground',
      'mono-sample': 'font-mono font-normal text-sm text-foreground-muted',
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

interface TypographyProps extends VariantProps<typeof variants> {
  children?: ReactNode;
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  className?: string;
}

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
