import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetAllIssues } from '../hooks/useQueries';
import { Category, Status } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryCardProps {
  icon: string;
  name: string;
  total: number;
  inProgressCount: number;
  resolvedCount: number;
  reportingCount: number;
}

function CategoryCard({ icon, name, total, inProgressCount, resolvedCount, reportingCount }: CategoryCardProps) {
  // Determine the count label based on dominant status
  let countLabel: string;
  if (inProgressCount > 0 && inProgressCount >= resolvedCount) {
    countLabel = `${total} In Progress`;
  } else {
    countLabel = `${total} reported`;
  }

  return (
    <Card className="bg-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="flex items-center gap-4 p-5">
        {/* Icon */}
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
          <img src={icon} alt={name} className="h-10 w-10 object-contain" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-navy">{name}</h3>
          <p className="mb-2 text-lg font-bold text-navy">{countLabel}</p>
          <div className="flex flex-wrap gap-2">
            {resolvedCount > 0 && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-medium text-xs px-2 py-0.5">
                Resolved
              </Badge>
            )}
            {inProgressCount > 0 && resolvedCount === 0 && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-medium text-xs px-2 py-0.5">
                Pending
              </Badge>
            )}
            {reportingCount > 0 && (
              <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 font-medium text-xs px-2 py-0.5">
                {reportingCount} Reporting
              </Badge>
            )}
            {total === 0 && (
              <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 font-medium text-xs px-2 py-0.5">
                No reports yet
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCardSkeleton() {
  return (
    <Card className="bg-white shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CategoryStatsCards() {
  const { data: issues, isLoading } = useGetAllIssues();

  const getCategoryStats = (category: Category) => {
    if (!issues) return { total: 0, inProgress: 0, resolved: 0, reporting: 0 };

    const categoryIssues = issues.filter((issue) => issue.category === category);
    const total = categoryIssues.length;
    const resolved = categoryIssues.filter(
      (issue) => issue.status === Status.resolved
    ).length;
    const inProgress = categoryIssues.filter(
      (issue) => issue.status === Status.inProgress
    ).length;
    const reporting = categoryIssues.filter(
      (issue) =>
        issue.status === Status.pending ||
        issue.status === Status.inProgress
    ).length;

    return { total, inProgress, resolved, reporting };
  };

  // Show 3 categories matching the screenshot: Garbage, Traffic, Streetlight
  const categories = [
    {
      icon: '/assets/generated/icon-garbage-blue.dim_64x64.png',
      name: 'Garbage',
      category: Category.garbage,
    },
    {
      icon: '/assets/generated/icon-traffic-light.dim_64x64.png',
      name: 'Traffic',
      category: Category.traffic,
    },
    {
      icon: '/assets/generated/icon-streetlight-yellow.dim_64x64.png',
      name: 'Streetlight',
      category: Category.streetlight,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, index) => (
          <CategoryCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => {
        const stats = getCategoryStats(cat.category);
        return (
          <CategoryCard
            key={cat.name}
            icon={cat.icon}
            name={cat.name}
            total={stats.total}
            inProgressCount={stats.inProgress}
            resolvedCount={stats.resolved}
            reportingCount={stats.reporting}
          />
        );
      })}
    </div>
  );
}
