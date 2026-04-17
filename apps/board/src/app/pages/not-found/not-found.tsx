import { useTranslation } from 'react-i18next';
import { data, Link } from 'react-router';

export async function loader() {
  return data(null, { status: 404 });
}

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-semibold">{t('NotFound.title')}</h1>
      <p>{t('NotFound.description')}</p>
      <Link to="/" className="text-blue-700 dark:text-blue-500 hover:underline">
        {t('NotFound.backToHome')}
      </Link>
    </main>
  );
}
