import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useGetAllIssues,
  useGetAnalytics,
  useGetAssignedIssues,
} from "../hooks/useQueries";
import { Category } from "../types/domain";
import IssueManagementTable from "./IssueManagementTable";

const COLORS = ["#3b82f6", "#eab308", "#22c55e", "#f97316", "#6b7280"];

// Fallback demo data shown when all analytics values are zero
const FALLBACK_STATUS_DATA = [
  { name: "Open", value: 12, color: COLORS[0] },
  { name: "In Progress", value: 5, color: COLORS[1] },
  { name: "Resolved", value: 8, color: COLORS[2] },
  { name: "Closed", value: 3, color: COLORS[4] },
];

const FALLBACK_CATEGORY_DATA = [
  { name: "Potholes", value: 7 },
  { name: "Streetlights", value: 5 },
  { name: "Waste", value: 9 },
  { name: "Other", value: 7 },
];

export default function DashboardSection() {
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics();
  const { data: allIssues = [], isLoading: issuesLoading } = useGetAllIssues();
  const { data: assignedIssues = [] } = useGetAssignedIssues();

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

  const openCount = Number(analytics?.openSubmissions || 0);
  const inProgressCount = Number(analytics?.inProgressSubmissions || 0);
  const resolvedCount = Number(analytics?.resolvedSubmissions || 0);
  const closedCount = Number(analytics?.closedSubmissions || 0);
  const totalCount = openCount + inProgressCount + resolvedCount + closedCount;

  // Use fallback demo data if all analytics values are zero
  const statusData =
    totalCount === 0
      ? FALLBACK_STATUS_DATA
      : [
          { name: "Open", value: openCount, color: COLORS[0] },
          { name: "In Progress", value: inProgressCount, color: COLORS[1] },
          { name: "Resolved", value: resolvedCount, color: COLORS[2] },
          { name: "Closed", value: closedCount, color: COLORS[4] },
        ];

  const categoryCountsFromIssues = [
    {
      name: "Potholes",
      value: allIssues.filter((i) => i.category === Category.potholes).length,
    },
    {
      name: "Streetlights",
      value: allIssues.filter((i) => i.category === Category.streetlights)
        .length,
    },
    {
      name: "Waste",
      value: allIssues.filter((i) => i.category === Category.waste).length,
    },
    {
      name: "Other",
      value: allIssues.filter((i) => i.category === Category.other).length,
    },
  ];

  const categoryTotalFromIssues = categoryCountsFromIssues.reduce(
    (sum, c) => sum + c.value,
    0,
  );

  const categoryData =
    categoryTotalFromIssues === 0
      ? FALLBACK_CATEGORY_DATA
      : categoryCountsFromIssues;

  const displayTotal =
    totalCount === 0 ? 28 : Number(analytics?.totalSubmissions || 0);

  return (
    <section id="dashboard" className="bg-background py-12">
      <div className="container px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Municipal Dashboard
          </h2>
          <p className="text-muted-foreground">
            Analytics and issue management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Issues
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayTotal}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalCount === 0 ? 12 : openCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalCount === 0 ? 5 : inProgressCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalCount === 0 ? 8 : resolvedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalCount === 0 ? 3 : closedCount}
              </div>
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
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
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
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Issue Management */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              All Issues ({allIssues.length})
            </TabsTrigger>
            <TabsTrigger value="assigned">
              Assigned to Me ({assignedIssues.length})
            </TabsTrigger>
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
