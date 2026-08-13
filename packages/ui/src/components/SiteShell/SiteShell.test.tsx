import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SiteShell } from './SiteShell';

describe('SiteShell.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children inside the main landmark', () => {
    const { getByRole } = render(
      <SiteShell>
        <p>Page body</p>
      </SiteShell>
    );

    expect(getByRole('main')).toHaveTextContent('Page body');
  });

  it('should hide the header by default', () => {
    const { queryByTestId } = render(
      <SiteShell>
        <p>Page body</p>
      </SiteShell>
    );

    expect(queryByTestId('site-header')).toBeNull();
  });

  it('should render the header on request', () => {
    const { getByTestId } = render(
      <SiteShell showHeader>
        <p>Page body</p>
      </SiteShell>
    );

    expect(getByTestId('site-header')).toBeInTheDocument();
  });

  it('should forward the header content', () => {
    const { getByTestId } = render(
      <SiteShell showHeader headerContent={{ trailing: <span>New here?</span> }}>
        <p>Page body</p>
      </SiteShell>
    );

    expect(getByTestId('site-header')).toHaveTextContent('New here?');
  });

  it('should omit the footer landmark when there is no footer', () => {
    const { queryByRole } = render(
      <SiteShell>
        <p>Page body</p>
      </SiteShell>
    );

    expect(queryByRole('contentinfo')).toBeNull();
  });

  it('should render the footer when given one', () => {
    const { getByRole } = render(
      <SiteShell footer={<small>Ordre</small>}>
        <p>Page body</p>
      </SiteShell>
    );

    expect(getByRole('contentinfo')).toHaveTextContent('Ordre');
  });
});
