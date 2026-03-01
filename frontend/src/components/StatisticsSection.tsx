import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllIssues } from '../hooks/useQueries';
import { Status } from '../backend';
import { TrendingUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function StatisticsSection() {
  const { data: allIssues = [], isLoading } = useGetAllIssues();

  // Calculate statistics
  const totalRaised = allIssues.length;
  const totalSolved = allIssues.filter(
    (issue) => issue.status === Status.resolved
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
          <p className="text-muted-foreground">Real-time statistics from our civic reporting platform</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-2">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-4xl font-bold">{totalRaised}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-muted-foreground">Issues Raised</p>
            </CardContent>
          </Card>

          <Card className="text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-2">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-4xl font-bold">{totalSolved}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-muted-foreground">Issues Resolved</p>
            </CardContent>
          </Card>

          <Card className="text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-2">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-4xl font-bold">{solveRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-muted-foreground">Resolution Rate</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
