/**
 * The public component API.
 *
 * One explicit line per export, values and types together. `export *` is banned
 * here (see eslint.config.ts) so that widening the surface is always a
 * deliberate edit to this file rather than a side effect somewhere downstream.
 */

// Primitives
export { Button, type ButtonAsButton, type ButtonAsLink, type ButtonProps } from './Button/Button';
export { TextLink, type TextLinkProps } from './TextLink/TextLink';
export { Typography, type TypographyProps } from './Typography/Typography';

// Surfaces
export { Card, type CardProps } from './Card/Card';
export { Drawer, type DrawerProps } from './Drawer/Drawer';

// Shell
export { SiteHeader, type SiteHeaderProps } from './SiteShell/SiteHeader';
export { SiteShell, type SiteShellProps } from './SiteShell/SiteShell';
export type { NavLink, NavRole } from './SiteShell/types';
