/**
 * What the link means, not where it sits. The role drives the visual treatment on
 * both layouts and decides which mobile group the link lands in.
 */
export type NavRole = 'nav' | 'primary' | 'secondary';

export interface NavLink {
  label: string;
  href: string;
  /** Defaults to `nav`, rendered as a text link. `primary`/`secondary` render as buttons. */
  role?: NavRole;
  /** Desktop placement override. Defaults to `start` for nav links and `end` for actions. */
  align?: 'start' | 'end';
  /** Drop the link from one of the layouts. */
  hideOn?: 'desktop' | 'mobile';
  /** Marks the current page.*/
  active?: boolean;
}

/** Desktop side a link belongs to, honouring the explicit override first. */
export const desktopAlign = ({ align, role = 'nav' }: NavLink) => {
  return align ?? (role === 'nav' ? 'start' : 'end');
};
