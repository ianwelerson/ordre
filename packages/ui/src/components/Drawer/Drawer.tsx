'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import { cx } from '../../helpers/cva';

export interface DrawerProps {
  /** Ties the panel to whatever opens it through `aria-controls`. */
  id?: string;
  open: boolean;
  /** Called on Escape, on overlay click, and by anything inside the panel. */
  onClose: () => void;
  /** Edge the panel slides in from. */
  side?: 'left' | 'right';
  /** Accessible name for the dialog. */
  label?: string;
  /** Panel classes, e.g. the width. */
  className?: string;
  /** Classes on the wrapper holding the panel and the overlay, e.g. `md:hidden`. */
  wrapperClassName?: string;
  children: ReactNode;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Tabbable descendants in DOM order, skipping anything not currently rendered. */
const focusableWithin = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => element.getClientRects().length > 0
  );

const sideClasses = {
  left: 'left-0 -translate-x-full border-r shadow-drawer-left',
  right: 'right-0 translate-x-full border-l shadow-drawer-right',
} as const;

/**
 * A panel that slides in from the edge over a dimming overlay, holding whatever
 * content the caller gives it.
 *
 * Both the panel and the overlay stay mounted so the slide can animate in and out,
 * which is why the closed panel is marked `inert`: it keeps off-screen links out of
 * the tab order and out of the accessibility tree. While open the drawer locks body
 * scroll, traps Tab inside the panel, closes on Escape or an overlay click, and hands
 * focus back to whatever opened it.
 */
export const Drawer = ({
  id,
  open,
  onClose,
  side = 'right',
  label,
  className,
  wrapperClassName,
  children,
}: DrawerProps) => {
  const panel = useRef<HTMLDivElement>(null);
  /** What had focus when the drawer opened, so closing can hand it back. */
  const opener = useRef<HTMLElement | null>(null);
  /** Callers pass an inline `onClose`, so keep it out of the effect deps. */
  const close = useRef(onClose);

  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    opener.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close.current();

        return;
      }

      if (event.key !== 'Tab' || !panel.current) {
        return;
      }

      // The page behind stays focusable, so the two ends have to be stitched
      // together by hand. Everything between them is left to the browser.
      const targets = focusableWithin(panel.current);
      const first = targets[0];
      const last = targets.at(-1);
      const active = document.activeElement;
      const backwards = event.shiftKey;

      if (!first || !last) {
        event.preventDefault();
        panel.current.focus();

        return;
      }

      // The panel itself takes focus on open, so it counts as the leading edge.
      const atStart = active === first || active === panel.current;
      const escaping = backwards ? atStart : active === last;

      if (escaping || !panel.current.contains(active)) {
        event.preventDefault();
        (backwards ? last : first).focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      opener.current?.focus();
    };
  }, [open]);

  return (
    <div className={cx('contents', wrapperClassName)}>
      <div
        aria-hidden
        onClick={onClose}
        data-testid="drawer-overlay"
        data-open={open || undefined}
        className="bg-midnight/32 duration-slow ease-standard pointer-events-none fixed inset-0 z-60 opacity-0 transition-opacity data-open:pointer-events-auto data-open:opacity-100"
      ></div>
      <div
        id={id}
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-testid="drawer"
        tabIndex={-1}
        inert={!open}
        data-open={open || undefined}
        className={cx(
          'bg-snow border-ash duration-deliberate ease-decelerate fixed top-0 z-70 flex h-lvh flex-col border-solid transition-transform outline-none data-open:translate-x-0',
          sideClasses[side],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
