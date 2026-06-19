import { pinoHttp } from 'pino-http';

import { baseOptions } from './config.ts';

/**
 * Express/HTTP request logger (automatic access logs).
 * Shares redaction + dev/prod formatting with `createLogger`.
 */
export const httpLogger = (service: string, enabled: boolean = true) =>
  pinoHttp({ ...baseOptions, enabled, base: { service } });
