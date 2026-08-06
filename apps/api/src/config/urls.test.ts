import { DASHBOARD_ROUTES, MARKETING_ROUTES } from '@ordre/core/constants';

import { urls } from './urls.ts';

describe('config/urls', () => {
  it('builds every url from an origin and a declared path, never a literal', () => {
    expect(urls.dashboardLogin).toBe(`${urls.dashboard}${DASHBOARD_ROUTES.login}`);
    expect(urls.help).toBe(`${urls.base}${MARKETING_ROUTES.help}`);
    expect(urls.privacy).toBe(`${urls.base}${MARKETING_ROUTES.privacy}`);
  });

  it('hangs the invite link off the dashboard, not the marketing site', () => {
    // Accepting an invite creates a session, which only the dashboard can do.
    expect(urls.invite('abc123')).toBe(`${urls.dashboard}/invite/abc123`);
  });

  it('never produces a double slash between origin and path', () => {
    for (const url of [urls.dashboardLogin, urls.help, urls.privacy, urls.invite('t')]) {
      expect(url.replace(/^https?:\/\//, '')).not.toContain('//');
    }
  });

  it('resolves origins from the environment rather than a hardcoded host', () => {
    // The whole point of the split: production links must not be baked in.
    expect(urls.base).not.toContain('ordre.app');
    expect(urls.dashboard).not.toContain('ordre.app');
  });
});
