import { CheckCircle2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Status } from "../backend";
import { useGetAllIssues } from "../hooks/useQueries";

export default function LiveStatsSection() {
  const { data: allIssues = [] } = useGetAllIssues();
  const [todayResolved, setTodayResolved] = useState(0);
  const [totalReported, setTotalReported] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();

    const resolved = allIssues.filter(
      (i) => i.status === Status.resolved || i.status === Status.closed,
    );

    const todayResolvedReal = resolved.filter((i) => {
      const ms = Number(i.updatedAt) / 1_000_000;
      return ms >= startOfDayMs && ms <= now;
    });

    setTodayResolved(
      todayResolvedReal.length > 0 ? todayResolvedReal.length : resolved.length,
    );
    setTotalReported(allIssues.length);
  }, [allIssues]);

  if (totalReported === 0) return null;

  return (
    <div className="bg-black py-3 text-white">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-6 px-4 text-sm font-medium sm:gap-10 sm:text-base">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />
          <span className="text-white">
            <span className="text-xl font-bold text-white">
              {todayResolved}
            </span>{" "}
            issues resolved today in your city
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 flex-shrink-0 text-blue-400" />
          <span className="text-white">
            <span className="text-xl font-bold text-white">
              {totalReported}
            </span>{" "}
            total reports submitted
          </span>
        </div>
      </div>
    </div>
  );
}
