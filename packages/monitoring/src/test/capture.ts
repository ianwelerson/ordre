import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

/** A record as a log platform receives it: one JSON line pino wrote to stdout. */
export type LogRecord = Record<string, unknown> & { level: number };

export type LogCapture = {
  /** Resolves the oldest record not yet returned. */
  next: () => Promise<LogRecord>;
  /** Drops the records read so far, so one test cannot answer another's `next`. */
  clear: () => void;
  /** Restores `process.stdout`. */
  restore: () => void;
};

/**
 * Redirects `process.stdout` into an array, so the assertions run against the
 * line a log platform would ingest rather than against the serializers the
 * logger happens to have been built with.
 *
 * Install it before building a logger: pino resolves `process.stdout.write` once,
 * when the instance is constructed, and a logger built earlier writes past this.
 */
export const captureLogs = (): LogCapture => {
  const lines: string[] = [];
  const write = process.stdout.write.bind(process.stdout);

  process.stdout.write = ((chunk: unknown) => {
    lines.push(String(chunk));

    return true;
  }) as typeof process.stdout.write;

  return {
    next: async () => {
      // Polls, because the access log writes on the response's `finish` event,
      // which fires after the client already has its reply.
      const deadline = Date.now() + 5_000;

      while (Date.now() < deadline) {
        const line = lines.shift();

        if (line?.startsWith('{')) {
          return JSON.parse(line) as LogRecord;
        }

        if (line === undefined) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }

      throw new Error('No log record was written');
    },
    clear: () => {
      lines.length = 0;
    },
    restore: () => {
      process.stdout.write = write;
    },
  };
};

/** The cookie Better Auth sets on a sign-in, and the value that must never be logged. */
export const SESSION_COOKIE = 'better-auth.session_token';
export const SESSION_VALUE = 'sess_9d41c7b0';

export type TestServer = {
  /** Absolute URL for a path on the running server. */
  url: (path: string) => string;
  close: () => Promise<void>;
};

/**
 * Runs `middleware` over a real HTTP server, so the access log is exercised
 * through the request and response objects Node builds rather than a stub.
 *
 * Every reply sets a session cookie and takes its status from the
 * `x-test-status` request header, which defaults to 200.
 */
export const startServer = async (
  middleware: (req: IncomingMessage, res: ServerResponse) => void
): Promise<TestServer> => {
  const server = createServer((req, res) => {
    middleware(req, res);

    res.statusCode = Number(req.headers['x-test-status'] ?? 200);
    res.setHeader('set-cookie', `${SESSION_COOKIE}=${SESSION_VALUE}; HttpOnly`);
    res.end('ok');
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;

  return {
    url: (path) => `http://127.0.0.1:${port}${path}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
};
