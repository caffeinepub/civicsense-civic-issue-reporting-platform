import { useGetAnalytics, useGetAllIssues, useGetAssignedIssues, useSeedDemoData } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, AlertCircle, Clock, CheckCircle, TrendingUp, Database } from 'lucide-react';
import { Category } from '../backend';
import IssueManagementTable from './IssueManagementTable';

const COLORS = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#6b7280'];

export default function DashboardSection() {
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics();
  const { data: allIssues = [], isLoading: issuesLoading } = useGetAllIssues();
  const { data: assignedIssues = [] } = useGetAssignedIssues();
  const seedDemoData = useSeedDemoData();

  if (analyticsLoading || issuesLoading) {
    return (
      <section id="dashboard" className="border-b bg-background py-12">
        <div className="container px-4">
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  const statusData = [
    { name: 'Pending', value: Number(analytics?.pendingSubmissions || 0), color: COLORS[0] },
    { name: 'In Progress', value: Number(analytics?.inProgressSubmissions || 0), color: COLORS[1] },
    { name: 'Resolved', value: Number(analytics?.resolvedSubmissions || 0), color: COLORS[2] },
  ];

  const categoryData = [
    { name: 'Garbage', value: allIssues.filter((i) => i.category === Category.garbage).length },
    { name: 'Traffic', value: allIssues.filter((i) => i.category === Category.traffic).length },
    { name: 'Streetlight', value: allIssues.filter((i) => i.category === Category.streetlight).length },
    { name: 'Potholes', value: allIssues.filter((i) => i.category === Category.potholes).length },
    { name: 'Noise', value: allIssues.filter((i) => i.category === Category.noise).length },
  ];

  return (
    <section id="dashboard" className="bg-background py-12">
      <div className="container px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Municipal Dashboard</h2>
            <p className="text-muted-foreground">Analytics and issue management</p>
          </div>
          <Button
            variant="outline"
            onClick={() => seedDemoData.mutate()}
            disabled={seedDemoData.isPending}
            className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {seedDemoData.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {seedDemoData.isPending ? 'Seeding Data…' : 'Seed Demo Data'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(analytics?.totalSubmissions || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(analytics?.pendingSubmissions || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(analytics?.inProgressSubmissions || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(analytics?.resolvedSubmissions || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Issues by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issues by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Issue Management */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Issues ({allIssues.length})</TabsTrigger>
            <TabsTrigger value="assigned">Assigned to Me ({assignedIssues.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <IssueManagementTable issues={allIssues} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <IssueManagementTable issues={assignedIssues} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
