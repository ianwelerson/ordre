import { redirect } from 'next/navigation';

import { marketingUrl } from '@/lib/shared';

// The docs site has no landing page of its own - send visitors to the
// Ordre marketing site (per environment).
export default function HomePage() {
  redirect(marketingUrl());
}
