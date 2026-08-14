'use client';

import { useId } from 'react';

export interface FieldIdentityProps {
  name: string;
  id?: string;
  helper?: string;
  invalid?: boolean;
  invalidMessage?: string;
}

export interface FieldIdentity {
  controlId: string;
  messageId: string;
  /**
   * The single line under the field. One slot holds one at a time, so the field never
   * grows a second row and shifts the form under it.
   */
  message?: string;
  /** The message id when there is a message, and nothing when there is not. */
  describedBy?: string;
}

/**
 * The identity every field control needs: an id the label and the message can both
 * hang off, and the one line of text that sits below it.
 *
 * Kept separate from {@link useFieldControl} because the selection controls share the
 * label and message wiring but not the box, so they cannot take the whole split.
 */
export const useFieldIdentity = ({
  name,
  id,
  helper,
  invalid,
  invalidMessage,
}: FieldIdentityProps): FieldIdentity => {
  const generatedId = useId();
  const controlId = id ?? `${name}-${generatedId}`;
  const messageId = `${controlId}-message`;
  const message = invalid && invalidMessage ? invalidMessage : helper;

  return {
    controlId,
    messageId,
    message,
    describedBy: message ? messageId : undefined,
  };
};
