import { useTranslation } from 'react-i18next';
import { data, Link } from 'react-router';

export async function loader() {
  return data(null, { status: 404 });
}

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1 className="text-2xl font-semibold">{t('NotFound.title')}</h1>
      <p>{t('NotFound.description')}</p>
      <Link to="/" className="text-blue-700 hover:underline dark:text-blue-500">
        {t('NotFound.backToHome')}
      </Link>
    </main>
  );
}
