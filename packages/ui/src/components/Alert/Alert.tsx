import { cva, type VariantProps } from 'class-variance-authority';
import { type IconName as LucideIconName } from 'lucide-react/dynamic';

import type { ReactNode } from 'react';

import Icon from '../../icons/Icons';
import { Typography } from '../Typography/Typography';

const variants = cva('flex w-full items-start gap-2.5 rounded-md border border-solid px-3.5 py-3', {
  variants: {
    /**
     * The tint is the token at low opacity rather than a mix with a fixed white,
     * so the alert keeps its tone on whichever surface it lands on.
     */
    tone: {
      invalid: 'bg-invalid/8 border-invalid/30',
      success: 'bg-success/8 border-success/30',
      info: 'bg-info/8 border-info/30',
    },
  },
  defaultVariants: {
    tone: 'invalid',
  },
});

const iconVariants = cva('mt-0.5 shrink-0', {
  variants: {
    tone: {
      invalid: 'text-invalid',
      success: 'text-success',
      info: 'text-info',
    },
  },
  defaultVariants: {
    tone: 'invalid',
  },
});

type AlertTone = NonNullable<VariantProps<typeof variants>['tone']>;

const TONE_ICON: Record<AlertTone, LucideIconName> = {
  invalid: 'circle-alert',
  success: 'circle-check',
  info: 'info',
};

/**
 * A failure is interrupting: it is announced the moment it lands, because the reader
 * has just been stopped and needs to know why. The other two are reported when the
 * reader next comes up for air.
 */
const TONE_ROLE: Record<AlertTone, 'alert' | 'status'> = {
  invalid: 'alert',
  success: 'status',
  info: 'status',
};

export interface AlertProps extends VariantProps<typeof variants> {
  /** A short headline above the body. The body alone is often enough. */
  title?: string;
  children: ReactNode;
  /** Overrides the icon the tone would otherwise pick. */
  icon?: LucideIconName;
  className?: string;
}

/**
 * A message about the form or the page rather than about one control.
 *
 * This is what a failed sign-in belongs in: the credentials are wrong as a pair, so
 * marking either field invalid on its own would say something untrue about it.
 */
export const Alert = ({ tone, title, children, icon, className }: AlertProps) => {
  const currentTone = tone ?? 'invalid';

  return (
    <div
      data-testid="alert"
      role={TONE_ROLE[currentTone]}
      className={variants({ tone, className })}
    >
      <Icon
        name={icon ?? TONE_ICON[currentTone]}
        data-testid="alert-icon"
        size={16}
        className={iconVariants({ tone })}
      />
      <div className="flex flex-col gap-1">
        {title && (
          <Typography tag="span" variant="caption" tone="default">
            {title}
          </Typography>
        )}
        <Typography tag="span" variant="caption" tone="muted">
          {children}
        </Typography>
      </div>
    </div>
  );
};
