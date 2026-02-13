import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Submission } from '../backend';
import { Status, Category } from '../backend';
import { useUpdateIssueStatus } from '../hooks/useQueries';
import { Loader2, Edit } from 'lucide-react';

interface IssueManagementTableProps {
  issues: Submission[];
}

const statusColors: Record<Status, string> = {
  [Status.open]: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  [Status.inProgress]: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  [Status.resolved]: 'bg-green-500/10 text-green-700 dark:text-green-400',
  [Status.reopened]: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  [Status.closed]: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

const statusLabels: Record<Status, string> = {
  [Status.open]: 'Open',
  [Status.inProgress]: 'In Progress',
  [Status.resolved]: 'Resolved',
  [Status.reopened]: 'Reopened',
  [Status.closed]: 'Closed',
};

const categoryLabels: Record<Category, string> = {
  [Category.potholes]: 'Pothole',
  [Category.streetlights]: 'Streetlight',
  [Category.waste]: 'Waste',
  [Category.other]: 'Other',
};

export default function IssueManagementTable({ issues }: IssueManagementTableProps) {
  const [selectedIssue, setSelectedIssue] = useState<Submission | null>(null);
  const [newStatus, setNewStatus] = useState<Status>(Status.open);
  const [notes, setNotes] = useState('');
  const updateStatus = useUpdateIssueStatus();

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleUpdateStatus = () => {
    if (!selectedIssue) return;
    updateStatus.mutate(
      { id: selectedIssue.id, status: newStatus, notes: notes.trim() },
      {
        onSuccess: () => {
          setSelectedIssue(null);
          setNotes('');
        },
      }
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
                  <Badge variant="outline" className={statusColors[issue.status]}>
                    {statusLabels[issue.status]}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{issue.priority}</TableCell>
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
                          <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Status)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Status.open}>Open</SelectItem>
                              <SelectItem value={Status.inProgress}>In Progress</SelectItem>
                              <SelectItem value={Status.resolved}>Resolved</SelectItem>
                              <SelectItem value={Status.reopened}>Reopened</SelectItem>
                              <SelectItem value={Status.closed}>Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea placeholder="Add notes about this status change..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                        </div>
                        <Button onClick={handleUpdateStatus} disabled={updateStatus.isPending} className="w-full">
                          {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
