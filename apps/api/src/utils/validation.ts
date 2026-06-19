/**
 * Parses Better Auth's flattened validation error message into a per-field map.
 *
 * On a `VALIDATION_ERROR`, Better Auth concatenates every field error into a
 * single string of `[<path>] <message>` segments joined by `; `, e.g.:
 *
 *   `[body.email] Invalid input...; [body.password] Invalid input...`
 *
 * This splits that string back into a `{ field: message }` object, stripping the
 * leading `body.` path prefix so keys match the request payload fields:
 *
 *   `{ email: "Invalid input...", password: "Invalid input..." }`
 *
 * Segments that don't match the `[path] message` shape are skipped, so a format
 * change in a future Better Auth release degrades to an empty/partial object
 * rather than throwing.
 *
 * @param message - The `body.message` string from a Better Auth `VALIDATION_ERROR`.
 * @returns A map of field name to its error message (empty if nothing parsed).
 *
 */
export const parseBetterAuthValidationDetails = (message: string): Record<string, string> => {
  const details: Record<string, string> = {};

  if (!message || typeof message !== 'string') {
    return {};
  }

  for (const part of message.split(';')) {
    const match = part.trim().match(/^\[([^\]]+)\]\s*(.*)$/);
    if (!match?.[1]) {
      continue;
    }

    const field = match[1].replace(/^body\./, '');
    details[field] = match[2] ?? '';
  }

  return details;
};
