import env from '#env';
import { Resend } from 'resend';

let resend: Resend | undefined;

/**
 * Built on first send, not at import.
 *
 * The SDK throws on an empty key from its constructor, and this module is pulled in
 * transitively by every producer (through the worker's provider registry), so doing
 * it at module scope takes down anything that imports a controller when the key is
 * unset. Deferring makes a missing key a delivery failure the outbox records and
 * retries, which is where it belongs.
 */
export const getResend = () => (resend ??= new Resend(env.RESEND_API_KEY));
