import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Drawer } from './Drawer';

const renderDrawer = (props: Partial<React.ComponentProps<typeof Drawer>> = {}) =>
  render(
    <Drawer open onClose={() => {}} label="Menu" {...props}>
      <a href="/first">First</a>
      <a href="/last">Last</a>
    </Drawer>
  );

describe('Drawer.tsx', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('should render a labelled modal dialog', () => {
    const { getByTestId } = renderDrawer({ id: 'site-menu' });

    const panel = getByTestId('drawer');

    expect(panel).toHaveAttribute('role', 'dialog');
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(panel).toHaveAttribute('aria-label', 'Menu');
    expect(panel).toHaveAttribute('id', 'site-menu');
  });

  it('should keep the closed panel out of the tab order', () => {
    const { getByTestId, rerender } = renderDrawer({ open: false });

    expect(getByTestId('drawer')).toHaveAttribute('inert');

    rerender(
      <Drawer open onClose={() => {}} label="Menu">
        <a href="/first">First</a>
      </Drawer>
    );

    expect(getByTestId('drawer')).not.toHaveAttribute('inert');
  });

  it('should flag the open state for the slide transition', () => {
    const { getByTestId, rerender } = renderDrawer({ open: false });

    expect(getByTestId('drawer')).not.toHaveAttribute('data-open');
    expect(getByTestId('drawer-overlay')).not.toHaveAttribute('data-open');

    rerender(
      <Drawer open onClose={() => {}} label="Menu">
        <a href="/first">First</a>
      </Drawer>
    );

    expect(getByTestId('drawer')).toHaveAttribute('data-open');
    expect(getByTestId('drawer-overlay')).toHaveAttribute('data-open');
  });

  it('should slide in from the right by default', () => {
    const { getByTestId } = renderDrawer();

    expect(getByTestId('drawer')).toHaveClass('right-0', 'translate-x-full');
  });

  it('should slide in from the left when asked', () => {
    const { getByTestId } = renderDrawer({ side: 'left' });

    expect(getByTestId('drawer')).toHaveClass('left-0', '-translate-x-full');
  });

  it('should apply the panel and wrapper classes', () => {
    const { getByTestId } = renderDrawer({
      className: 'w-2xs',
      wrapperClassName: 'nav:hidden',
    });

    const panel = getByTestId('drawer');

    expect(panel).toHaveClass('w-2xs');
    expect(panel.parentElement).toHaveClass('contents', 'nav:hidden');
  });

  it('should close on an overlay click', () => {
    const onClose = vi.fn();
    const { getByTestId } = renderDrawer({ onClose });

    fireEvent.click(getByTestId('drawer-overlay'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should close on Escape while open', () => {
    const onClose = vi.fn();
    renderDrawer({ onClose });

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should ignore Escape while closed', () => {
    const onClose = vi.fn();
    renderDrawer({ open: false, onClose });

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should lock body scroll only while open', () => {
    const { rerender, unmount } = renderDrawer();

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Drawer open={false} onClose={() => {}} label="Menu">
        <a href="/first">First</a>
      </Drawer>
    );

    expect(document.body.style.overflow).toBe('');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('should move focus into the panel on open', () => {
    const { getByTestId } = renderDrawer();

    expect(document.activeElement).toBe(getByTestId('drawer'));
  });

  it('should return focus to whatever opened it', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();

    const { rerender } = renderDrawer();

    rerender(
      <Drawer open={false} onClose={() => {}} label="Menu">
        <a href="/first">First</a>
      </Drawer>
    );

    expect(document.activeElement).toBe(opener);

    opener.remove();
  });

  it('should wrap Tab from the last focusable back to the first', () => {
    const { getByText } = renderDrawer();

    const last = getByText('Last');
    const first = getByText('First');

    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });

    expect(document.activeElement).toBe(first);
  });

  it('should wrap Shift+Tab from the first focusable back to the last', () => {
    const { getByText } = renderDrawer();

    const first = getByText('First');
    const last = getByText('Last');

    first.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it('should ignore keys other than Escape and Tab', () => {
    const onClose = vi.fn();
    const { getByText } = renderDrawer({ onClose });

    getByText('Last').focus();
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(getByText('Last'));
  });

  it('should hold focus on the panel when it has nothing focusable', () => {
    const { getByTestId } = render(
      <Drawer open onClose={() => {}} label="Menu">
        <p>Nothing to focus</p>
      </Drawer>
    );

    fireEvent.keyDown(window, { key: 'Tab' });

    expect(document.activeElement).toBe(getByTestId('drawer'));
  });

  it('should pull focus back when it escapes the panel', () => {
    const outside = document.createElement('button');
    document.body.append(outside);

    const { getByText } = renderDrawer();

    outside.focus();
    fireEvent.keyDown(window, { key: 'Tab' });

    expect(document.activeElement).toBe(getByText('First'));

    outside.remove();
  });
});
