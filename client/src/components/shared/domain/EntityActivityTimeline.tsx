import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { ActivityTimeline, type ActivityTimelineItem } from '@/components/shared/ActivityTimeline';
import { useEntityActivity } from '@/features/activity/hooks/activity.hooks';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

interface EntityActivityTimelineProps {
  entityType: string;
  entityId: string;
  title?: string;
  emptyMessage?: string;
}

/**
 * Domain component for displaying the activity timeline of a specific entity.
 * Abstracts the fetching logic and provides a consistent UI wrapper.
 */
export const EntityActivityTimeline: React.FC<EntityActivityTimelineProps> = ({
  entityType,
  entityId,
  title = 'Activity Timeline',
  emptyMessage = 'No activity recorded yet.',
}) => {
  const { data, isLoading } = useEntityActivity(entityType, entityId);

  return (
    <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/30 border-b py-3 px-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <CardTitle className="font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <SkeletonLoader variant="list" rows={3} />
        ) : (
          <ActivityTimeline
            items={(data ?? []) as ActivityTimelineItem[]}
            isLoading={false}
            emptyMessage={emptyMessage}
          />
        )}
      </CardContent>
    </Card>
  );
};
