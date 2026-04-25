import { useTranslation } from 'react-i18next';

import Icon from '@ordre/ui/icons';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <main
      data-testid="home-page"
      className="flex h-screen w-screen flex-col flex-wrap items-center justify-center gap-3"
    >
      <div className="h-8 w-8">
        <Icon name="ordre-logo" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col items-center">
          <h1 className="font-headline text-2xl font-bold">{t('app.name')}</h1>
          <p className="font-body">{t('app.tagline')}</p>
        </div>
        <p className="font-mono text-sm">{t('app.domain.board')}</p>
      </div>
    </main>
  );
}
