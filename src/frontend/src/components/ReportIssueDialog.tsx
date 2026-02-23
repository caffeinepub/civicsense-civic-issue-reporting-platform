// INITIAL DESIGN DOCUMENTATION:
// The initial ReportIssueDialog was a single-column form in a standard dialog component.
// - Form fields: Category (select), Title (input), Description (textarea), Images (file upload), Location (lat/long), Address (street/city/zip)
// - Category options: Potholes, Streetlights, Waste Management, Other
// - Image upload: Multiple file selection with preview thumbnails, remove buttons, and upload progress tracking
// - Validation: Client-side validation with error alerts
// - Styling: Standard dialog and form components from shadcn/ui
// - No gradient backgrounds or special effects
//
// CURRENT VERSION 35 STATE:
// This implementation matches the initial design. Standard form layout with all required
// fields, image upload functionality, and proper validation handling.

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateIssue, useUploadAttachments } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, X } from 'lucide-react';
import { Category, Priority, Status, ExternalBlob } from '../backend';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
  blob?: ExternalBlob;
  uploadProgress: number;
}

const categoryOptions: { value: Category; label: string }[] = [
  { value: Category.potholes, label: 'Potholes' },
  { value: Category.streetlights, label: 'Streetlights' },
  { value: Category.waste, label: 'Waste Management' },
  { value: Category.other, label: 'Other' },
];

export default function ReportIssueDialog({ open, onOpenChange }: ReportIssueDialogProps) {
  const { identity } = useInternetIdentity();
  const createIssue = useCreateIssue();
  const uploadAttachments = useUploadAttachments();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.other);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = createIssue.isPending || uploadAttachments.isPending;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ImagePreview[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      uploadProgress: 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identity) {
      setError('You must be logged in to report an issue');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      const imageBlobs: ExternalBlob[] = [];

      for (const image of images) {
        const arrayBuffer = await image.file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? { ...img, uploadProgress: percentage } : img
            )
          );
        });
        imageBlobs.push(blob);
      }

      const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const location =
        latitude && longitude
          ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
          : undefined;

      const address =
        street || city || zipCode ? { street, city, zipCode } : undefined;

      await createIssue.mutateAsync({
        id: submissionId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority: Priority.medium,
        status: Status.open,
        location,
        address,
        createdBy: identity.getPrincipal(),
        createdAt: BigInt(Date.now() * 1000000),
        updatedAt: BigInt(Date.now() * 1000000),
        attachments: [],
      });

      if (imageBlobs.length > 0) {
        await uploadAttachments.mutateAsync({
          submissionId,
          blobs: imageBlobs,
        });
      }

      setTitle('');
      setDescription('');
      setCategory(Category.other);
      setStreet('');
      setCity('');
      setZipCode('');
      setLatitude('');
      setLongitude('');
      setImages([]);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error creating issue:', err);
      setError(err.message || 'Failed to create issue. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Provide details about the civic issue you'd like to report
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the issue"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Images (Optional)</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
            />
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {image.uploadProgress > 0 && image.uploadProgress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1">
                        <Progress value={image.uploadProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (Optional)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 40.7128"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (Optional)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -74.0060"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address (Optional)</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City (Optional)</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code (Optional)</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="10001"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
