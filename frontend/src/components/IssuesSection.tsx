import { useState } from 'react';
import { useGetAllIssues, useGetMyIssues, useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2 } from 'lucide-react';
import IssueCard from './IssueCard';
import ReportIssueDialog from './ReportIssueDialog';
import IssueDetailDialog from './IssueDetailDialog';
import type { Submission } from '../backend';

export default function IssuesSection() {
  const { data: allIssues = [], isLoading: allLoading } = useGetAllIssues();
  const { data: myIssues = [], isLoading: myLoading } = useGetMyIssues();
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Submission | null>(null);

  const isAuthenticated = !!identity;
  const isAuthenticating = loginStatus === 'logging-in' || loginStatus === 'initializing';
  const isMunicipalStaff = userProfile?.isMunicipalStaff || isAdmin;

  // Municipal staff should not see the Report Issue button
  const showReportButton = !isMunicipalStaff;

  return (
    <section id="issues" className="border-b bg-background py-12">
      <div className="container px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Civic Issues</h2>
            <p className="text-muted-foreground">Browse and report issues in your community</p>
          </div>
          {showReportButton && (
            <Button
              onClick={() => setReportDialogOpen(true)}
              disabled={!isAuthenticated || isAuthenticating}
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

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All Issues ({allIssues.length})
            </TabsTrigger>
            <TabsTrigger value="my">
              My Reports ({myIssues.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allIssues.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center">
                <p className="text-muted-foreground">No issues reported yet. Be the first to report one!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allIssues.map((issue, index) => (
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
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            {myLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myIssues.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center">
                <p className="text-muted-foreground">You haven't reported any issues yet.</p>
                {showReportButton && (
                  <Button
                    onClick={() => setReportDialogOpen(true)}
                    variant="outline"
                    className="mt-4"
                    disabled={!isAuthenticated || isAuthenticating}
                  >
                    Report Your First Issue
                  </Button>
                )}
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
          </TabsContent>
        </Tabs>
      </div>

      {showReportButton && (
        <ReportIssueDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
      )}
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
