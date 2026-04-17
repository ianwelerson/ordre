import { app, pt as globalPt } from '@ordre/i18n/messages';

export default {
  ...app,
  ...globalPt,
  HomePage: {
    title: 'Test - PT',
  },
  NotFound: {
    title: 'Página não encontrada',
    description: 'A página solicitada não foi encontrada.',
    backToHome: 'Voltar ao início',
  },
};
