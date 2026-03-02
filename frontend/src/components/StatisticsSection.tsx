import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllIssues } from '../hooks/useQueries';
import { Status } from '../backend';
import { TrendingUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function StatisticsSection() {
  const { data: allIssues = [], isLoading } = useGetAllIssues();

  // Calculate statistics
  const totalRaised = allIssues.length;
  const totalSolved = allIssues.filter(
    (issue) => issue.status === Status.resolved || issue.status === Status.closed
  ).length;
  const solveRate = totalRaised > 0 ? Math.round((totalSolved / totalRaised) * 100) : 0;

  if (isLoading) {
    return (
      <section className="border-b bg-background py-12">
        <div className="container px-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b bg-background py-12">
      <div className="container px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Community Impact</h2>
          <p className="text-muted-foreground">Track our progress in making our community better</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Issues Raised */}
          <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues Raised</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold transition-all duration-300 group-hover:scale-110">{totalRaised}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Community members reporting civic issues
              </p>
            </CardContent>
          </Card>

          {/* Total Issues Solved */}
          <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground transition-colors duration-300 group-hover:text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success transition-all duration-300 group-hover:scale-110">{totalSolved}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Successfully addressed and closed
              </p>
            </CardContent>
          </Card>

          {/* Resolution Rate */}
          <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground transition-colors duration-300 group-hover:text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold transition-all duration-300 group-hover:scale-110">{solveRate}%</div>
              <p className="mt-2 text-xs text-muted-foreground">
                {totalRaised > 0 ? 'Percentage of issues resolved' : 'No issues reported yet'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
