import { app, en as globalEn } from '@ordre/i18n/messages';

export default {
  ...app,
  ...globalEn,
  HomePage: {
    title: 'Test - EN',
  },
  NotFound: {
    title: 'Page not found',
    description: 'The requested page could not be found.',
    backToHome: 'Back to home',
  },
};
