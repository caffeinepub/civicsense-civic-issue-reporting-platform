import { useGetAllIssues } from '../hooks/useQueries';
import { TrendingUp, CheckCircle2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Status } from '../backend';

export default function LiveStatsSection() {
  const { data: issues, isLoading, isError } = useGetAllIssues();
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedResolved, setAnimatedResolved] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Calculate stats from all issues
  const totalIssues = issues?.length || 0;
  const resolvedIssues = issues?.filter(issue => issue.status === Status.resolved || issue.status === Status.closed).length || 0;

  // Animate counters immediately on load when data is available
  useEffect(() => {
    if (isLoading || !issues || hasAnimated) return;

    setHasAnimated(true);

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      // Ease-out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedTotal(Math.floor(totalIssues * easeProgress));
      setAnimatedResolved(Math.floor(resolvedIssues * easeProgress));

      if (currentStep >= steps) {
        setAnimatedTotal(totalIssues);
        setAnimatedResolved(resolvedIssues);
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isLoading, issues, totalIssues, resolvedIssues, hasAnimated]);

  if (isLoading) {
    return (
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-civic-blue/5 via-civic-orange/5 to-civic-green/5 py-12 md:py-16">
        <div className="container px-4">
          <div className="mb-8 text-center md:mb-12">
            <div className="mx-auto mb-3 h-8 w-64 animate-pulse rounded bg-gradient-to-r from-civic-blue/20 to-civic-orange/20 md:h-10" />
            <div className="mx-auto h-5 w-80 animate-pulse rounded bg-gradient-to-r from-civic-orange/20 to-civic-green/20 md:h-6 md:w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div className="flex flex-col items-center space-y-4 rounded-2xl border-2 border-civic-blue/30 bg-gradient-to-br from-civic-blue/10 to-civic-blue-light/5 p-6 shadow-lg md:p-8">
              <div className="h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-civic-blue/40 to-civic-blue-light/40 md:h-20 md:w-20" />
              <div className="h-10 w-28 animate-pulse rounded bg-civic-blue/30 md:h-12 md:w-32" />
              <div className="h-5 w-40 animate-pulse rounded bg-civic-blue/20 md:h-6 md:w-48" />
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-2xl border-2 border-civic-green/30 bg-gradient-to-br from-civic-green/10 to-civic-green-light/5 p-6 shadow-lg md:p-8">
              <div className="h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-civic-green/40 to-civic-green-light/40 md:h-20 md:w-20" />
              <div className="h-10 w-28 animate-pulse rounded bg-civic-green/30 md:h-12 md:w-32" />
              <div className="h-5 w-40 animate-pulse rounded bg-civic-green/20 md:h-6 md:w-48" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-civic-blue/5 via-civic-orange/5 to-civic-green/5 py-12 md:py-16">
        <div className="container px-4">
          <div className="rounded-2xl border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 p-6 text-center shadow-lg md:p-8">
            <p className="text-base text-destructive md:text-lg">Unable to load statistics. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden border-b bg-gradient-to-br from-civic-blue/5 via-civic-orange/5 to-civic-green/5 py-12 md:py-16 animate-fade-in"
    >
      {/* Enhanced Background Decorative Elements with Multiple Colors */}
      <div className="pointer-events-none absolute left-5 top-5 h-48 w-48 rounded-full bg-gradient-to-br from-civic-blue/20 to-civic-blue-light/10 blur-3xl animate-pulse-slow md:left-10 md:top-10 md:h-72 md:w-72" />
      <div className="pointer-events-none absolute bottom-5 right-5 h-48 w-48 rounded-full bg-gradient-to-br from-civic-green/20 to-civic-green-light/10 blur-3xl animate-pulse-slow md:bottom-10 md:right-10 md:h-72 md:w-72" style={{ animationDelay: '1s' }} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-civic-orange/15 to-civic-orange-light/5 blur-3xl animate-pulse-slow md:h-96 md:w-96" style={{ animationDelay: '2s' }} />

      <div className="container relative px-4">
        {/* Section Header with Gradient Text */}
        <div className="mb-8 text-center md:mb-12 animate-slide-up">
          <div className="mb-3 flex items-center justify-center gap-2 md:mb-4">
            <Sparkles className="h-6 w-6 text-civic-orange animate-pulse-glow md:h-8 md:w-8" />
            <h2 className="bg-gradient-to-r from-civic-blue via-civic-orange to-civic-green bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl md:text-4xl">
              Live Community Impact
            </h2>
            <Sparkles className="h-6 w-6 text-civic-green animate-pulse-glow md:h-8 md:w-8" style={{ animationDelay: '0.5s' }} />
          </div>
          <p className="mx-auto max-w-2xl bg-gradient-to-r from-muted-foreground to-foreground bg-clip-text text-base text-transparent md:text-lg">
            Real-time statistics showing the power of civic engagement
          </p>
        </div>

        {/* Stats Grid with Enhanced Colorful Cards */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Total Issues Created - Blue/Purple Gradient */}
          <div className="group relative animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-civic-blue via-civic-blue-light to-civic-blue opacity-20 blur-xl transition-all duration-500 group-hover:opacity-40 animate-gradient-shift" />
            <div className="relative overflow-hidden rounded-2xl border-2 border-civic-blue/40 bg-gradient-to-br from-civic-blue/15 via-civic-blue-light/10 to-background p-6 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-civic-blue hover:shadow-civic-glow-strong md:p-8 md:hover:-translate-y-3">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-civic-blue blur-2xl animate-float" />
                <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-civic-blue-light blur-2xl animate-float" style={{ animationDelay: '1s' }} />
              </div>

              {/* Icon with Enhanced Glow */}
              <div className="relative mb-4 flex justify-center md:mb-6">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-civic-blue via-civic-blue-light to-civic-blue shadow-civic-glow-strong transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 md:h-20 md:w-20">
                    <TrendingUp className="h-8 w-8 text-white transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 md:h-10 md:w-10" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-civic-blue/40 blur-xl transition-all duration-500 group-hover:bg-civic-blue/60 animate-pulse-slow" />
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-civic-blue to-civic-blue-light opacity-30 blur-2xl transition-all duration-500 group-hover:opacity-50 animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>

              {/* Counter with Gradient Text */}
              <div className="relative text-center">
                <div className="mb-2 bg-gradient-to-br from-civic-blue via-civic-blue to-civic-blue-light bg-clip-text text-4xl font-bold text-transparent transition-all duration-300 group-hover:scale-110 sm:text-5xl md:text-6xl">
                  {animatedTotal.toLocaleString()}
                </div>
                <h3 className="bg-gradient-to-r from-civic-blue to-civic-blue-light bg-clip-text text-lg font-semibold text-transparent md:text-xl">
                  Total Issues Created
                </h3>
                <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                  Citizens actively reporting civic concerns
                </p>
              </div>

              {/* Enhanced Decorative Elements */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-civic-blue/20 to-civic-blue-light/10 blur-2xl transition-all duration-500 group-hover:bg-civic-blue/30 md:h-32 md:w-32" />
              <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-br from-civic-blue-light/20 to-civic-blue/10 blur-2xl transition-all duration-500 group-hover:bg-civic-blue-light/30 md:h-32 md:w-32" />
            </div>
          </div>

          {/* Issues Resolved - Green/Emerald Gradient */}
          <div className="group relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-civic-green via-civic-green-light to-civic-green opacity-20 blur-xl transition-all duration-500 group-hover:opacity-40 animate-gradient-shift" style={{ animationDelay: '1s' }} />
            <div className="relative overflow-hidden rounded-2xl border-2 border-civic-green/40 bg-gradient-to-br from-civic-green/15 via-civic-green-light/10 to-background p-6 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-civic-green hover:shadow-civic-green-glow-strong md:p-8 md:hover:-translate-y-3">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-civic-green blur-2xl animate-float" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-civic-green-light blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />
              </div>

              {/* Icon with Enhanced Glow */}
              <div className="relative mb-4 flex justify-center md:mb-6">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-civic-green via-civic-green-light to-civic-green shadow-civic-green-glow-strong transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 md:h-20 md:w-20">
                    <CheckCircle2 className="h-8 w-8 text-white transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 md:h-10 md:w-10" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-civic-green/40 blur-xl transition-all duration-500 group-hover:bg-civic-green/60 animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-civic-green to-civic-green-light opacity-30 blur-2xl transition-all duration-500 group-hover:opacity-50 animate-pulse-slow" style={{ animationDelay: '1s' }} />
                </div>
              </div>

              {/* Counter with Gradient Text */}
              <div className="relative text-center">
                <div className="mb-2 bg-gradient-to-br from-civic-green via-civic-green to-civic-green-light bg-clip-text text-4xl font-bold text-transparent transition-all duration-300 group-hover:scale-110 sm:text-5xl md:text-6xl">
                  {animatedResolved.toLocaleString()}
                </div>
                <h3 className="bg-gradient-to-r from-civic-green to-civic-green-light bg-clip-text text-lg font-semibold text-transparent md:text-xl">
                  Issues Resolved
                </h3>
                <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                  Problems fixed through community action
                </p>
              </div>

              {/* Enhanced Decorative Elements */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-civic-green/20 to-civic-green-light/10 blur-2xl transition-all duration-500 group-hover:bg-civic-green/30 md:h-32 md:w-32" />
              <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-br from-civic-green-light/20 to-civic-green/10 blur-2xl transition-all duration-500 group-hover:bg-civic-green-light/30 md:h-32 md:w-32" />
            </div>
          </div>
        </div>

        {/* Enhanced Success Rate Indicator with Orange Gradient */}
        {totalIssues > 0 && (
          <div className="mt-6 text-center animate-slide-up md:mt-8" style={{ animationDelay: '0.3s' }}>
            <div className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border-2 border-civic-orange/40 bg-gradient-to-r from-civic-orange/20 via-civic-orange-light/15 to-civic-orange/20 px-4 py-2 text-xs font-medium shadow-civic-orange-glow transition-all duration-300 hover:scale-105 hover:border-civic-orange hover:shadow-civic-orange-glow-strong md:px-6 md:py-3 md:text-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-civic-orange/0 via-civic-orange/20 to-civic-orange/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 animate-gradient-shift" />
              <CheckCircle2 className="relative h-4 w-4 text-civic-orange transition-transform duration-300 group-hover:rotate-12 md:h-5 md:w-5" />
              <span className="relative bg-gradient-to-r from-civic-orange to-civic-orange-light bg-clip-text text-transparent">
                {Math.round((resolvedIssues / totalIssues) * 100)}% Resolution Rate
              </span>
              <Sparkles className="relative h-4 w-4 text-civic-orange-light animate-pulse-glow md:h-5 md:w-5" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
