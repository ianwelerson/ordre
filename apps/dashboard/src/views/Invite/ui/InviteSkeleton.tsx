import { useTranslations } from 'next-intl';

import { Card, Skeleton } from '@ordre/ui/components';

/**
 * Loading placeholder for the invite card. Mirrors `InviteSignUp`'s block sizes
 * so the card does not resize when the preview lands.
 *
 * Only the first skeleton is labelled; `Skeleton` keeps the unlabelled ones out
 * of the accessibility tree.
 */
export const InviteSkeleton = () => {
  const t = useTranslations('Invite');

  return (
    <>
      <div className="flex flex-col gap-3.5">
        <Skeleton className="h-3 w-36" label={t('loading')} />
        <Card variant="quiet">
          <div className="flex items-center gap-4">
            <Skeleton shape="circle" className="size-13" />
            <Skeleton className="h-3.5 w-44" />
          </div>
        </Card>
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-7 w-3/5" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <div className="flex flex-col gap-4.5">
        <div className="flex flex-col gap-4.5">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton shape="block" className="h-12 w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton shape="block" className="h-12 w-full" />
          </div>
          <Skeleton shape="block" className="h-12 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </>
  );
};
