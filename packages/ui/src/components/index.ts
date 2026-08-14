/**
 * The public component API.
 *
 * One explicit line per export, values and types together. `export *` is banned
 * here (see eslint.config.ts) so that widening the surface is always a
 * deliberate edit to this file rather than a side effect somewhere downstream.
 *
 * The groups below are also the Storybook sidebar, which takes its folders from these
 * headings. Adding a component in one place and filing it in the other is the same
 * edit.
 */

// Primitives
export { Alert, type AlertProps } from './Alert/Alert';
export { Button, type ButtonAsButton, type ButtonAsLink, type ButtonProps } from './Button/Button';
export {
  Divider,
  type DividerAsHorizontal,
  type DividerAsVertical,
  type DividerProps,
} from './Divider/Divider';
export { Eyebrow, type EyebrowProps } from './Eyebrow/Eyebrow';
export { TextLink, type TextLinkProps } from './TextLink/TextLink';
export { Typography, type TypographyProps } from './Typography/Typography';

/**
 * Form
 *
 * The one group whose directory is not one component. Every other component owns a
 * directory; these six sit flat in `Form/` beside the field anatomy, the shared cva and
 * the hooks they all compose, because nesting them would leave each importing its own
 * siblings from a parent.
 */
export { Checkbox, type CheckboxProps } from './Form/Checkbox';
export { PasswordField, type PasswordFieldProps } from './Form/PasswordField';
export { RadioGroup, type RadioGroupProps, type RadioOption } from './Form/RadioGroup';
export { TextArea, type TextAreaProps } from './Form/TextArea';
export { TextField, type TextFieldProps } from './Form/TextField';
export { Toggle, type ToggleProps } from './Form/Toggle';

// Surfaces
export { Card, type CardProps } from './Card/Card';
export { Drawer, type DrawerProps } from './Drawer/Drawer';

// Shell
export { SiteHeader, type SiteHeaderProps } from './SiteShell/SiteHeader';
export { SiteShell, type SiteShellProps } from './SiteShell/SiteShell';
export type { NavLink, NavRole } from './SiteShell/types';
