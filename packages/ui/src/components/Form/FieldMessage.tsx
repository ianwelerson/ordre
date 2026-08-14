import { Typography } from '../Typography/Typography';

export interface FieldMessageProps {
  /** What the control points `aria-describedby` at. */
  id: string;
  message?: string;
  invalid?: boolean;
}

/**
 * The one line of helper or error text below a control.
 *
 * Shared by every field so the message reads the same whether it sits under a text
 * box, a checkbox or a group of radios.
 */
export const FieldMessage = ({ id, message, invalid }: FieldMessageProps) => {
  if (!message) {
    return null;
  }

  return (
    <Typography id={id} tag="span" variant="caption" tone={invalid ? 'invalid' : undefined}>
      {message}
    </Typography>
  );
};
