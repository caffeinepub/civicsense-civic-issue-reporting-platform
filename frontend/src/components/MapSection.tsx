import { useGetAllIssues } from '../hooks/useQueries';
import { MapPin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Status } from '../backend';

const statusColors: Record<Status, string> = {
  [Status.pending]: 'bg-orange-500',
  [Status.inProgress]: 'bg-yellow-500',
  [Status.resolved]: 'bg-green-500',
};

export default function MapSection() {
  const { data: issues = [], isLoading } = useGetAllIssues();

  const issuesWithLocation = issues.filter((issue) => issue.location);

  return (
    <section id="map" className="border-b bg-muted/30 py-12">
      <div className="container px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Issue Map</h2>
          <p className="text-muted-foreground">Geographic distribution of reported issues</p>
        </div>

        {isLoading ? (
          <div className="flex h-96 items-center justify-center rounded-lg border bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : issuesWithLocation.length === 0 ? (
          <div className="flex h-96 items-center justify-center rounded-lg border border-dashed bg-card">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No issues with location data yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Issues with Location Data</h3>
                <Badge variant="outline">{issuesWithLocation.length} issues</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {issuesWithLocation.map((issue) => (
                  <div key={issue.id} className="rounded-lg border bg-background p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="line-clamp-1 text-sm font-medium">{issue.title}</h4>
                      <div className={`h-3 w-3 rounded-full ${statusColors[issue.status]}`} />
                    </div>
                    {issue.location && (
                      <p className="text-xs text-muted-foreground">
                        {issue.location.latitude.toFixed(4)}, {issue.location.longitude.toFixed(4)}
                      </p>
                    )}
                    {issue.address && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {issue.address.street}, {issue.address.city}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Resolved</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
