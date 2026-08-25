/**
 * Components reused across the dashboard.
 *
 * The bar for living here rather than in `@ordre/ui`: composed from design-system
 * primitives, and only meaningful inside this app. Anything that turns out to be
 * useful beyond the dashboard belongs in the design system instead.
 *
 * One explicit line per export, as in `@ordre/ui`'s own barrel, so widening the
 * surface is always a deliberate edit to this file.
 */
export { AuthAction, type AuthActionProps } from './AuthAction/AuthAction';
export { AuthCard, type AuthCardProps } from './AuthCard/AuthCard';
export { AuthFootnote, type AuthFootnoteProps } from './AuthFootnote/AuthFootnote';
export { AuthHeading, type AuthHeadingProps } from './AuthHeading/AuthHeading';
