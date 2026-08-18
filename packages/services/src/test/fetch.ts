/**
 * Test doubles for the injectable `fetch`. The whole package is built so that
 * swapping this one function is enough to test every service without a network.
 */

/** A `fetch` that answers with the given response and records every call. */
export const stubFetch = (response: Response) => {
  const calls: { url: string; init: RequestInit }[] = [];

  const fetch = ((url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    // Cloned: a Response body can only be read once, and some cases call twice.
    return Promise.resolve(response.clone());
  }) as unknown as typeof globalThis.fetch;

  return { fetch, calls };
};

/** A `fetch` that rejects, standing in for offline / DNS / CORS failures. */
export const failingFetch = (error: unknown) =>
  (() => Promise.reject(error)) as unknown as typeof globalThis.fetch;

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
