import { getRequestLocale } from '#/config/request-context.ts';
import type { NextFunction, Request, Response } from 'express';

import { requestLocale } from './request-locale.ts';

const buildRequest = (acceptLanguage?: string) =>
  ({
    headers: acceptLanguage === undefined ? {} : { 'accept-language': acceptLanguage },
  }) as unknown as Request;

/** Runs the middleware and reports the locale visible to the code it continues into. */
const localeSeenByNext = (acceptLanguage?: string) => {
  let seen: string | undefined;
  const next = (() => {
    seen = getRequestLocale();
  }) as unknown as NextFunction;

  requestLocale(buildRequest(acceptLanguage), {} as Response, next);

  return seen;
};

describe('middleware/requestLocale', () => {
  it('binds the negotiated locale for the rest of the request', () => {
    expect(localeSeenByNext('pt-BR,pt;q=0.9,en;q=0.8')).toBe('pt');
  });

  it('resolves a regional tag to the locale it belongs to', () => {
    expect(localeSeenByNext('pt-PT')).toBe('pt');
  });

  it('honours quality values rather than header order', () => {
    expect(localeSeenByNext('pt;q=0.2,en;q=0.9')).toBe('en');
    expect(localeSeenByNext('en;q=0.2,pt;q=0.9')).toBe('pt');
  });

  it('skips a locale the client explicitly refused with q=0', () => {
    expect(localeSeenByNext('en;q=0,pt;q=0.5')).toBe('pt');
  });

  it('falls back to the default for an unsupported, wildcard, or absent header', () => {
    expect(localeSeenByNext('fr-FR,fr;q=0.9')).toBe('en');
    expect(localeSeenByNext('*')).toBe('en');
    expect(localeSeenByNext()).toBe('en');
  });

  it('reads the default outside a request, which is where the worker runs', () => {
    expect(getRequestLocale()).toBe('en');
  });
});
