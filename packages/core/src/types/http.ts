/**
 * Informational (1xx), success (2xx) and redirection (3xx) status codes. These
 * always carry the typed `T` payload in a `Response<T>`.
 */
export type SuccessStatus =
  | 100
  | 101
  | 102
  | 103
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 226
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 306
  | 307
  | 308;

/**
 * Client (4xx) and server (5xx) error status codes. These always carry a
 * `ResponseErrorBody` in a `Response<T>`.
 */
export type ErrorStatus =
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429
  | 431
  | 451
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 510
  | 511;

export type StatusCodes = SuccessStatus | ErrorStatus;

export interface ResponseErrorBody {
  code: string;
  message: string;
  details?: Record<string, string>;
}

/**
 * Discriminated HTTP response envelope. The `status` discriminant gates the
 * `body`: success/redirection codes carry the typed payload `T`, while error
 * codes carry a `ResponseErrorBody`.
 */
export type Response<T> =
  { status: SuccessStatus; body: T } | { status: ErrorStatus; body: ResponseErrorBody };

/**
 * A success response that carries no payload - used for mutations (DELETE, and
 * fire-and-forget POSTs) that signal their outcome purely through the status
 * code. Controllers return `{ status: 204, body: null }`; the adapter writes a
 * bodyless `204 No Content` (see `sendResult`). This replaces the old
 * action-specific success flags (`{ deleted: true }`, `{ removed: true }`, ...).
 */
export type NoContentResponse = Response<null>;
