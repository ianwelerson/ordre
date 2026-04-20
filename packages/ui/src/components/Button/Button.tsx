'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { ReactNode } from 'react';

import IconComponent, { IconName } from './../../icons/Icons';

const variants = cva(
  ['gap-2 rounded-md hover:cursor-pointer font-body font-medium flex flex-row items-center'],
  {
    variants: {
      intent: {
        primary:
          'bg-button hover:bg-button-hover active:bg-button-hover text-white border-transparent',
        secondary:
          'border border-border bg-transparent hover:bg-background-alt active:bg-background-alt text-foreground',
        ghost: 'text-foreground-muted hover:text-foreground',
      },
      size: {
        sm: 'h-8 px-6 text-sm',
        base: 'h-12 text-base px-6',
        lg: 'h-13 text-base px-8',
      },
      align: {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-fill',
      },
      iconPosition: {
        leading: '',
        trailing: 'flex-row-reverse',
      },
      iconOnly: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        iconOnly: true,
        size: 'sm',
        class: '!px-3.5',
      },
    ],
    defaultVariants: {
      size: 'base',
      intent: 'primary',
      align: 'center',
      fullWidth: false,
    },
  }
);

interface ButtonProps extends VariantProps<typeof variants> {
  children?: ReactNode;
  className?: string;
  icon?: IconName;
}

export const Button = ({
  children,
  intent,
  size,
  align,
  iconPosition,
  fullWidth,
  iconOnly,
  icon,
}: ButtonProps) => {
  const currentSize = size ?? 'base';
  const iconSize: Record<typeof currentSize, number> = {
    sm: 12,
    base: 18,
    lg: 24,
  };

  return (
    <button
      data-testid="button"
      className={variants({ intent, size, align, iconPosition, fullWidth, iconOnly })}
    >
      {icon && <IconComponent name={icon} data-testid="button-icon" size={iconSize[currentSize]} />}
      {children && !iconOnly && <span data-testid="button-text">{children}</span>}
    </button>
  );
};
