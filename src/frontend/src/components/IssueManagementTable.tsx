import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Image, Loader2, Video, X } from "lucide-react";
import { useState } from "react";
import { useUpdateIssueStatus } from "../hooks/useQueries";
import type { Submission } from "../types/domain";
import { Category, Status } from "../types/domain";

interface IssueManagementTableProps {
  issues: Submission[];
}

const statusColors: Record<Status, string> = {
  [Status.open]: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  [Status.inProgress]: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  [Status.resolved]: "bg-green-500/10 text-green-700 dark:text-green-400",
  [Status.reopened]: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  [Status.closed]: "bg-muted-foreground/10 text-muted-foreground",
};

const statusLabels: Record<Status, string> = {
  [Status.open]: "Open",
  [Status.inProgress]: "In Progress",
  [Status.resolved]: "Resolved",
  [Status.reopened]: "Reopened",
  [Status.closed]: "Closed",
};

const categoryLabels: Record<Category, string> = {
  [Category.potholes]: "Pothole",
  [Category.streetlights]: "Streetlight",
  [Category.waste]: "Waste",
  [Category.other]: "Other",
};

interface MediaDialogProps {
  issue: Submission;
}

function MediaDialog({ issue }: MediaDialogProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const images = issue.attachments ?? [];
  const videos = issue.videos ?? [];
  const totalMedia = images.length + videos.length;

  if (totalMedia === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">No media</span>
    );
  }

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7 px-2"
          >
            {images.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Image className="h-3.5 w-3.5" />
                {images.length}
              </span>
            )}
            {videos.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Video className="h-3.5 w-3.5" />
                {videos.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media — {issue.title}</DialogTitle>
            <DialogDescription>
              {images.length} photo{images.length !== 1 ? "s" : ""}
              {videos.length > 0
                ? `, ${videos.length} video${videos.length !== 1 ? "s" : ""}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Photos
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((url, idx) => (
                    <button
                      key={`${url.slice(0, 20)}-${idx}`}
                      type="button"
                      onClick={() => setLightboxSrc(url)}
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all duration-200 hover:scale-105 hover:border-primary hover:shadow-md"
                    >
                      <img
                        src={url}
                        alt={`Attachment ${idx + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Videos
                </p>
                <div className="space-y-2">
                  {videos.map((url, idx) => (
                    <div
                      key={`${url.slice(0, 20)}-${idx}`}
                      className="rounded-lg border bg-muted/30 overflow-hidden"
                    >
                      <video
                        src={url}
                        controls
                        className="w-full max-h-56 object-contain"
                      >
                        <track kind="captions" />
                      </video>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox for full-size image */}
      {lightboxSrc && (
        <Dialog open={true} onOpenChange={() => setLightboxSrc(null)}>
          <DialogContent className="max-w-5xl p-0 animate-in fade-in zoom-in-95">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLightboxSrc(null)}
                aria-label="Close image"
                className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
              <img
                src={lightboxSrc}
                alt="Full size"
                className="h-auto max-h-[90vh] w-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function IssueManagementTable({
  issues,
}: IssueManagementTableProps) {
  const [selectedIssue, setSelectedIssue] = useState<Submission | null>(null);
  const [newStatus, setNewStatus] = useState<Status>(Status.open);
  const [notes, setNotes] = useState("");
  const updateStatus = useUpdateIssueStatus();

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleUpdateStatus = () => {
    if (!selectedIssue) return;
    updateStatus.mutate(
      { id: selectedIssue.id, status: newStatus, notes: notes.trim() },
      {
        onSuccess: () => {
          setSelectedIssue(null);
          setNotes("");
        },
      },
    );
  };

  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground">No issues to display</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Media</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">{issue.title}</TableCell>
                <TableCell>{categoryLabels[issue.category]}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[issue.status]}
                  >
                    {statusLabels[issue.status]}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{issue.priority}</TableCell>
                <TableCell>
                  <MediaDialog issue={issue} />
                </TableCell>
                <TableCell>{formatDate(issue.createdAt)}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedIssue(issue);
                          setNewStatus(issue.status);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Issue Status</DialogTitle>
                        <DialogDescription>{issue.title}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>New Status</Label>
                          <Select
                            value={newStatus}
                            onValueChange={(value) =>
                              setNewStatus(value as Status)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Status.open}>Open</SelectItem>
                              <SelectItem value={Status.inProgress}>
                                In Progress
                              </SelectItem>
                              <SelectItem value={Status.resolved}>
                                Resolved
                              </SelectItem>
                              <SelectItem value={Status.reopened}>
                                Reopened
                              </SelectItem>
                              <SelectItem value={Status.closed}>
                                Closed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            placeholder="Add notes about this status change..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={handleUpdateStatus}
                          disabled={updateStatus.isPending}
                          className="w-full"
                        >
                          {updateStatus.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update Status
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
