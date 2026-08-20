'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { Button } from '@ordre/ui/components';
import Icon from '@ordre/ui/icons';

import { services } from '@/shared/services';

export default function Home(): React.ReactElement {
  const t = useTranslations();
  const router = useRouter();

  const signOut = async () => {
    try {
      await services.auth.signOut();
    } finally {
      router.replace(DASHBOARD_ROUTES.login);
    }
  };

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
        <p className="font-mono text-sm">{t('app.domain.dashboard')}</p>
        <Button onClick={signOut} size="sm">
          Sign out
        </Button>
      </div>
    </main>
  );
}
