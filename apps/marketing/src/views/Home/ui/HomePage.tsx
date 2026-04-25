import { useTranslations } from 'next-intl';

import Icon from '@ordre/ui/icons';

export default function Home(): React.ReactElement {
  const t = useTranslations();

  return (
    <main className="flex h-screen w-screen flex-col flex-wrap items-center justify-center gap-3">
      <div className="h-8 w-8">
        <Icon name="ordre-logo" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col items-center">
          <h1 className="font-headline text-2xl font-bold">{t('app.name')}</h1>
          <p className="font-body">{t('app.tagline')}</p>
        </div>
        <p className="font-mono text-sm">{t('app.domain.marketing')}</p>
      </div>
    </main>
  );
}
