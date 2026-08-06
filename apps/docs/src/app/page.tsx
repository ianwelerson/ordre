import { redirect } from 'next/navigation';

import { docsRoute } from '@/lib/shared';

// The docs site has no landing page of its own - send visitors straight to
// the guides index.
export default function HomePage() {
  redirect(docsRoute);
}
