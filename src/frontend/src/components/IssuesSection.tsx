import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import type { Submission } from "../backend";
import { useGetAllIssues, useGetMyIssues } from "../hooks/useQueries";
import { getDemoSession } from "../utils/demoSession";
import IssueCard from "./IssueCard";
import IssueDetailDialog from "./IssueDetailDialog";
import ReportIssueDialog from "./ReportIssueDialog";

export default function IssuesSection() {
  const { data: allIssues = [], isLoading: allLoading } = useGetAllIssues();
  const { data: myIssues = [], isLoading: myLoading } = useGetMyIssues();
  const session = getDemoSession();
  const isMunicipalStaff = session?.role === "municipal";
  const isAuthenticated = !!session;

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Submission | null>(null);

  const showReportButton = isAuthenticated && !isMunicipalStaff;

  return (
    <section id="issues" className="border-b bg-background py-12">
      <div className="container px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Civic Issues</h2>
            <p className="text-muted-foreground">
              Browse and report issues in your community
            </p>
          </div>
          {showReportButton && (
            <Button
              onClick={() => setReportDialogOpen(true)}
              className="transition-all duration-300 hover:scale-105"
            >
              <Plus className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All Issues
              <Badge
                variant="secondary"
                className="ml-1 min-w-[24px] font-bold text-foreground bg-primary/15"
              >
                {allLoading ? "..." : allIssues.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-2">
              My Reports
              <Badge
                variant="secondary"
                className="ml-1 min-w-[24px] font-bold text-foreground bg-primary/15"
              >
                {myLoading ? "..." : myIssues.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allIssues.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center">
                <p className="text-muted-foreground">
                  No issues reported yet. Be the first to report one!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allIssues.map((issue, index) => (
                  <div
                    key={issue.id}
                    className="animate-in fade-in"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationDuration: "500ms",
                      animationFillMode: "backwards",
                    }}
                  >
                    <IssueCard
                      issue={issue}
                      onClick={() => setSelectedIssue(issue)}
                    />
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
                <p className="text-muted-foreground">
                  You haven't reported any issues yet.
                </p>
                {showReportButton && (
                  <Button
                    onClick={() => setReportDialogOpen(true)}
                    variant="outline"
                    className="mt-4"
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
                      animationDuration: "500ms",
                      animationFillMode: "backwards",
                    }}
                  >
                    <IssueCard
                      issue={issue}
                      onClick={() => setSelectedIssue(issue)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showReportButton && (
        <ReportIssueDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
        />
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
