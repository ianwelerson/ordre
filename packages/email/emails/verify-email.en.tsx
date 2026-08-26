import { previewFor } from '../src/preview.ts';

/**
 * Preview entry for the React Email dev server, not used at send time.
 *
 * One file per language because `PreviewProps` holds a single set of props, so
 * without these the sidebar would only ever show one of the two.
 */
const Preview = () => previewFor('email:account:verify-email', 'en');

export default Preview;
