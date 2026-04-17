import { index, prefix, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('pages/home/home.tsx'),
  ...prefix('br', [index('pages/home/home.tsx', { id: 'home-br' })]),
  route('api/locales/:lng/:ns', 'api/locales.ts'),
  route('*', 'pages/not-found/not-found.tsx'),
] satisfies RouteConfig;
