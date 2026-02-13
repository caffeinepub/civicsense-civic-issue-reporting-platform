import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, ThumbsUp } from 'lucide-react';
import type { Submission } from '../backend';
import { Status, Category } from '../backend';
import { useGetVoteCount } from '../hooks/useQueries';

interface IssueCardProps {
  issue: Submission;
  onClick: () => void;
}

const statusColors: Record<Status, string> = {
  [Status.open]: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  [Status.inProgress]: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  [Status.resolved]: 'bg-green-500/10 text-green-700 dark:text-green-400',
  [Status.reopened]: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  [Status.closed]: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

const statusLabels: Record<Status, string> = {
  [Status.open]: 'Open',
  [Status.inProgress]: 'In Progress',
  [Status.resolved]: 'Resolved',
  [Status.reopened]: 'Reopened',
  [Status.closed]: 'Closed',
};

const categoryLabels: Record<Category, string> = {
  [Category.potholes]: 'Pothole',
  [Category.streetlights]: 'Streetlight',
  [Category.waste]: 'Waste',
  [Category.other]: 'Other',
};

export default function IssueCard({ issue, onClick }: IssueCardProps) {
  const { data: voteCount } = useGetVoteCount(issue.id);
  const upvotes = Number(voteCount?.upvotes || 0);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{issue.title}</CardTitle>
          <Badge variant="outline" className={statusColors[issue.status]}>
            {statusLabels[issue.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{categoryLabels[issue.category]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(issue.createdAt)}</span>
          </div>
          {upvotes > 0 && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{upvotes}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
