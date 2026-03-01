import { useState } from 'react';
import { useGetMyIssues } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, LogIn, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import IssueCard from './IssueCard';
import ReportIssueDialog from './ReportIssueDialog';
import IssueDetailDialog from './IssueDetailDialog';
import type { Submission } from '../backend';
import { Status } from '../backend';
import { openLoginModal } from '../utils/openLoginModal';

const statusSummaryConfig = [
  { status: Status.pending, label: 'Pending', icon: AlertCircle, color: 'text-orange-600' },
  { status: Status.inProgress, label: 'In Progress', icon: Clock, color: 'text-yellow-600' },
  { status: Status.resolved, label: 'Resolved', icon: CheckCircle2, color: 'text-green-600' },
];

export default function IssuesSection() {
  const { data: myIssues = [], isLoading: myLoading } = useGetMyIssues();
  const { identity, loginStatus } = useInternetIdentity();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Submission | null>(null);

  const isAuthenticated = !!identity;
  const isAuthenticating = loginStatus === 'logging-in' || loginStatus === 'initializing';

  // Count issues by status for the summary strip
  const statusCounts = statusSummaryConfig.map(({ status }) => ({
    status,
    count: myIssues.filter((i) => i.status === status).length,
  }));

  return (
    <section id="issues" className="border-b bg-background py-12">
      <div className="container px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Reported Issues</h2>
            <p className="text-muted-foreground">
              {isAuthenticated
                ? 'Track the status of issues you have submitted'
                : 'Log in to view and manage your reported issues'}
            </p>
          </div>
          {isAuthenticated && (
            <Button
              onClick={() => setReportDialogOpen(true)}
              disabled={isAuthenticating}
              className="transition-all duration-300 hover:scale-105"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Report Issue
                </>
              )}
            </Button>
          )}
        </div>

        {/* Not authenticated — login prompt */}
        {!isAuthenticated && (
          <div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Sign in to see your reports</h3>
            <p className="mb-6 text-muted-foreground">
              Log in to view the issues you have submitted and track their resolution status.
            </p>
            <Button onClick={() => openLoginModal()} className="transition-all duration-300 hover:scale-105">
              <LogIn className="mr-2 h-4 w-4" />
              Log In / Sign Up
            </Button>
          </div>
        )}

        {/* Authenticated — show user's issues */}
        {isAuthenticated && (
          <>
            {/* Status summary strip */}
            {myIssues.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-3">
                {statusSummaryConfig.map(({ status, label, icon: Icon, color }) => {
                  const count = statusCounts.find((s) => s.status === status)?.count ?? 0;
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm shadow-sm"
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="font-medium">{count}</span>
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {myLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myIssues.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">No issues reported yet</h3>
                <p className="mb-6 text-muted-foreground">
                  Help improve your community by reporting civic issues in your area.
                </p>
                <Button
                  onClick={() => setReportDialogOpen(true)}
                  className="transition-all duration-300 hover:scale-105"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Report Your First Issue
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myIssues.map((issue, index) => (
                  <div
                    key={issue.id}
                    className="animate-in fade-in"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationDuration: '500ms',
                      animationFillMode: 'backwards',
                    }}
                  >
                    <IssueCard issue={issue} onClick={() => setSelectedIssue(issue)} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ReportIssueDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
      {selectedIssue && (
        <IssueDetailDialog
          issue={selectedIssue}
          open={!!selectedIssue}
          onOpenChange={(open) => !open && setSelectedIssue(null)}
        />
      )}
    </section>
  );
}
