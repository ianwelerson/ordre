import base from '../app.ts';
import { errors } from './errors.ts';
import { validation } from './validation.ts';

/**
 * The English bundle, composed from one file per domain.
 *
 * Each app spreads the default export under its own strings, so every top-level
 * key is a namespace it can read directly - `t('errors.NETWORK_ERROR')`,
 * `t('validation.email')`.
 *
 * The namespaces are also exported individually, because the API needs `errors`
 * on its own - `errorResponse` fills the wire message from English - and has no
 * business pulling in taglines to do it.
 */
export { errors, validation };

export const app = {
  ...base.app,
  tagline: 'Keep every client in the loop.',
};

export default { app, errors, validation };
