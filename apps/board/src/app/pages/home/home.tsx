import { getI18n } from 'react-i18next';

import { HomePage } from '@/views/Home';

export function meta() {
  const { t } = getI18n();

  return [{ title: t('app.name') }, { name: 'description', content: t('app.tagline') }];
}

export default function Home() {
  return <HomePage />;
}
