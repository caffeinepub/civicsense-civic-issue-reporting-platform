import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateIssue, useUploadAttachments } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, X, MapPin } from 'lucide-react';
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
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isSubmitting = createIssue.isPending || uploadAttachments.isPending;

  // Auto-fetch location when dialog opens
  useEffect(() => {
    if (!open) return;

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter location manually.');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setLocationLoading(false);

        // Attempt reverse geocoding via browser-side fetch (no backend needed)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            const streetVal = [addr.road, addr.house_number].filter(Boolean).join(' ');
            const cityVal = addr.city || addr.town || addr.village || addr.county || '';
            const zipVal = addr.postcode || '';
            if (streetVal) setStreet(streetVal);
            if (cityVal) setCity(cityVal);
            if (zipVal) setZipCode(zipVal);
          }
        } catch {
          // Reverse geocoding failed silently; coordinates are still set
        }
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location access denied. Please enter your location manually.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Location unavailable. Please enter your location manually.');
        } else {
          setLocationError('Could not fetch location. Please enter your location manually.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [open]);

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
        assignedStaff: undefined,
      });

      if (imageBlobs.length > 0) {
        await uploadAttachments.mutateAsync({
          submissionId,
          blobs: imageBlobs,
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setCategory(Category.other);
      setStreet('');
      setCity('');
      setZipCode('');
      setLatitude('');
      setLongitude('');
      setImages([]);
      setLocationError(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit issue');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto transition-all duration-300 animate-in fade-in zoom-in-95">
        <DialogHeader>
          <DialogTitle>Report a Civic Issue</DialogTitle>
          <DialogDescription>
            Help improve your community by reporting issues that need attention
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
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Photos (optional)</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={isSubmitting}
            />
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="h-24 w-full rounded-lg object-cover transition-all duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 hover:scale-110"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {image.uploadProgress > 0 && image.uploadProgress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 p-1">
                        <Progress value={image.uploadProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange" />
              <Label className="text-sm font-semibold">Location</Label>
              {locationLoading && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching your location…
                </span>
              )}
              {!locationLoading && latitude && longitude && (
                <span className="text-xs text-green-600 font-medium">✓ Location detected</span>
              )}
            </div>

            {locationError && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">{locationError}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 40.7128"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={locationLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., -74.0060"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={locationLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                placeholder="123 Main St"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={locationLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={locationLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  placeholder="10001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={locationLoading}
                />
              </div>
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="transition-all duration-300 hover:scale-105"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
