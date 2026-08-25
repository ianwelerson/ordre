import { Button, type ButtonProps } from '@ordre/ui/components';

export type AuthActionProps = ButtonProps;

/**
 * The one thing a screen asks its reader to do.
 *
 * Presentation is fixed rather than passed: an auth screen has exactly one
 * primary action, so its size, width and icon are a property of the layout, not
 * a decision each screen makes again. Everything about the action itself -
 * whether it submits, navigates, or is busy - still comes from the caller.
 */
export const AuthAction = (props: AuthActionProps) => {
  return <Button {...props} size="lg" trailingIcon="arrow-right" fullWidth />;
};
