import { Button, type ButtonProps } from '@ordre/ui/components';

export type AuthActionProps = ButtonProps;

/**
 * Renders the single primary action of an auth screen. Size, width, and icon are
 * fixed here because they belong to the layout, while behaviour and state still
 * come from the caller.
 *
 * @example
 * <AuthAction type="submit" loading={isBusy}>{t('submit')}</AuthAction>
 */
export const AuthAction = (props: AuthActionProps) => {
  return <Button {...props} size="lg" trailingIcon="arrow-right" fullWidth />;
};
