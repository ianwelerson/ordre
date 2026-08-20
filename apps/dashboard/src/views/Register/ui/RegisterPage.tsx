import { redirect } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';

export default function RegisterPage() {
  redirect(DASHBOARD_ROUTES.getStarted);
}
