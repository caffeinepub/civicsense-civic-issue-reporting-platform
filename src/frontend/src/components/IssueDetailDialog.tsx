import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, User, ThumbsUp, ThumbsDown, MessageSquare, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Submission } from '../backend';
import { Status, Category, Variant_upvote_downvote } from '../backend';
import { useGetComments, useAddComment, useGetVoteCount, useAddVote, useRemoveVote, useGetStatusHistory } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface IssueDetailDialogProps {
  issue: Submission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function IssueDetailDialog({ issue, open, onOpenChange }: IssueDetailDialogProps) {
  const { identity } = useInternetIdentity();
  const { data: comments = [] } = useGetComments(issue.id);
  const { data: voteCount } = useGetVoteCount(issue.id);
  const { data: statusHistory = [] } = useGetStatusHistory(issue.id);
  const addComment = useAddComment();
  const addVote = useAddVote();
  const removeVote = useRemoveVote();

  const [commentText, setCommentText] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  const upvotes = Number(voteCount?.upvotes || 0);
  const downvotes = Number(voteCount?.downvotes || 0);

  // Load image URLs when dialog opens
  useState(() => {
    if (issue.attachments && issue.attachments.length > 0) {
      setLoadingImages(true);
      const urls = issue.attachments.map((blob) => blob.getDirectURL());
      setImageUrls(urls);
      setLoadingImages(false);
    } else {
      setLoadingImages(false);
    }
  });

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    addComment.mutate(
      { submissionId: issue.id, content: commentText.trim(), commentId },
      {
        onSuccess: () => setCommentText(''),
      }
    );
  };

  const handleVote = (voteType: Variant_upvote_downvote) => {
    if (hasVoted) {
      removeVote.mutate(issue.id, {
        onSuccess: () => setHasVoted(false),
      });
    } else {
      addVote.mutate(
        { submissionId: issue.id, voteType },
        {
          onSuccess: () => setHasVoted(true),
        }
      );
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < imageUrls.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl">{issue.title}</DialogTitle>
              <Badge variant="outline" className={statusColors[issue.status]}>
                {statusLabels[issue.status]}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
            <div className="space-y-6">
              {/* Issue Details */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{categoryLabels[issue.category]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{issue.description}</p>

                {/* Image Gallery */}
                {imageUrls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Photos ({imageUrls.length})</h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {imageUrls.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className="group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all duration-300 hover:border-civic-orange hover:shadow-lg"
                        >
                          <img
                            src={url}
                            alt={`Issue photo ${index + 1}`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {issue.location && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Location:</p>
                    <p className="text-muted-foreground">
                      Lat: {issue.location.latitude.toFixed(6)}, Lng: {issue.location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                {issue.address && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Address:</p>
                    <p className="text-muted-foreground">
                      {issue.address.street}, {issue.address.city} {issue.address.zipCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Voting */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => handleVote(Variant_upvote_downvote.upvote)} disabled={!identity}>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  {upvotes}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleVote(Variant_upvote_downvote.downvote)} disabled={!identity}>
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  {downvotes}
                </Button>
              </div>

              <Separator />

              {/* Status History */}
              {statusHistory.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Status History</h3>
                  <div className="space-y-2">
                    {statusHistory.map((update, index) => (
                      <div key={index} className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {statusLabels[update.previousStatus]} → {statusLabels[update.newStatus]}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDate(update.timestamp)}</span>
                        </div>
                        {update.notes && <p className="mt-1 text-muted-foreground">{update.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="font-semibold">
                  <MessageSquare className="mr-2 inline h-4 w-4" />
                  Comments ({comments.length})
                </h3>

                {identity && (
                  <div className="space-y-2">
                    <Textarea placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} />
                    <Button onClick={handleAddComment} disabled={addComment.isPending || !commentText.trim()} size="sm">
                      {addComment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post Comment
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg border bg-muted/30 p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{comment.userId.toString().slice(0, 8)}...</span>
                          <span>•</span>
                          <span>{formatDate(comment.timestamp)}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {selectedImageIndex !== null && (
        <Dialog open={true} onOpenChange={() => setSelectedImageIndex(null)}>
          <DialogContent className="max-w-5xl p-0">
            <div className="relative flex items-center justify-center bg-black">
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </button>

              {selectedImageIndex > 0 && (
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <img
                src={imageUrls[selectedImageIndex]}
                alt={`Issue photo ${selectedImageIndex + 1}`}
                className="max-h-[90vh] w-auto object-contain"
              />

              {selectedImageIndex < imageUrls.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
                {selectedImageIndex + 1} / {imageUrls.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
