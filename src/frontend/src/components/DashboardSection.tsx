import { useGetAnalytics, useGetAllIssues, useGetAssignedIssues } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, AlertCircle, Clock, CheckCircle, XCircle, TrendingUp, Activity } from 'lucide-react';
import { Category } from '../backend';
import IssueManagementTable from './IssueManagementTable';

const COLORS = ['#3b82f6', '#eab308', '#22c55e', '#f97316', '#6b7280'];

export default function DashboardSection() {
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics();
  const { data: allIssues = [], isLoading: issuesLoading } = useGetAllIssues();
  const { data: assignedIssues = [] } = useGetAssignedIssues();

  if (analyticsLoading || issuesLoading) {
    return (
      <section id="dashboard" className="border-b bg-gradient-to-br from-background via-background to-orange-50/20 dark:to-orange-950/20 py-12">
        <div className="container px-4">
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
              <p className="text-muted-foreground animate-pulse">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const statusData = [
    { name: 'Open', value: Number(analytics?.openSubmissions || 0), color: COLORS[0] },
    { name: 'In Progress', value: Number(analytics?.inProgressSubmissions || 0), color: COLORS[1] },
    { name: 'Resolved', value: Number(analytics?.resolvedSubmissions || 0), color: COLORS[2] },
    { name: 'Closed', value: Number(analytics?.closedSubmissions || 0), color: COLORS[4] },
  ];

  const categoryData = [
    { name: 'Potholes', value: allIssues.filter((i) => i.category === Category.potholes).length },
    { name: 'Streetlights', value: allIssues.filter((i) => i.category === Category.streetlights).length },
    { name: 'Waste', value: allIssues.filter((i) => i.category === Category.waste).length },
    { name: 'Other', value: allIssues.filter((i) => i.category === Category.other).length },
  ];

  return (
    <section id="dashboard" className="bg-gradient-to-br from-background via-background to-orange-50/20 dark:to-orange-950/20 py-12 border-t-2 border-orange-200 dark:border-orange-800">
      <div className="container px-4">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              Municipal Dashboard & Analytics
            </h2>
            <p className="text-muted-foreground">Live data and issue management</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(analytics?.totalSubmissions || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">All submissions</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{Number(analytics?.openSubmissions || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{Number(analytics?.inProgressSubmissions || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{Number(analytics?.resolvedSubmissions || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Fixed issues</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{Number(analytics?.closedSubmissions || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Issues by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
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

          <Card className="transition-all duration-300 hover:shadow-lg">
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
          <TabsList className="bg-orange-100 dark:bg-orange-900">
            <TabsTrigger value="all" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              All Issues ({allIssues.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Assigned to Me ({assignedIssues.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <IssueManagementTable issues={allIssues} />
          </TabsContent>

          <TabsContent value="assigned" className="mt-6">
            <IssueManagementTable issues={assignedIssues} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
