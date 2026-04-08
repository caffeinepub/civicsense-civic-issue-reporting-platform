import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Loader2, MapPin, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCreateIssue } from "../hooks/useQueries";
import { Category, Priority, Status } from "../types/domain";
import { getDemoSession } from "../utils/demoSession";
import { DEMO_PRINCIPAL } from "../utils/localStore";

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
  uploadProgress: number;
}

interface VideoPreview {
  file: File;
  preview: string;
}

const categoryOptions: { value: Category; label: string }[] = [
  { value: Category.potholes, label: "Potholes" },
  { value: Category.streetlights, label: "Streetlights" },
  { value: Category.waste, label: "Waste Management" },
  { value: Category.other, label: "Other" },
];

/** Convert a File to a data URL string */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportIssueDialog({
  open,
  onOpenChange,
}: ReportIssueDialogProps) {
  const session = getDemoSession();
  const createIssue = useCreateIssue();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>(Category.other);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [video, setVideo] = useState<VideoPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isSubmitting = createIssue.isPending;

  // Auto-fetch location when dialog opens
  useEffect(() => {
    if (!open) return;

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser. Please enter location manually.",
      );
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

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            const streetVal = [addr.road, addr.house_number]
              .filter(Boolean)
              .join(" ");
            const cityVal =
              addr.city || addr.town || addr.village || addr.county || "";
            const zipVal = addr.postcode || "";
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
          setLocationError(
            "Location access denied. Please enter your location manually.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError(
            "Location unavailable. Please enter your location manually.",
          );
        } else {
          setLocationError(
            "Could not fetch location. Please enter your location manually.",
          );
        }
      },
      { timeout: 10000, maximumAge: 60000 },
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
    if (error === "Please upload at least one image of the issue") {
      setError(null);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (video) URL.revokeObjectURL(video.preview);
    setVideo({ file, preview: URL.createObjectURL(file) });
  };

  const removeVideo = () => {
    if (video) URL.revokeObjectURL(video.preview);
    setVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session) {
      setError("You must be logged in to report an issue.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one image of the issue");
      return;
    }

    try {
      // Convert all image files to data URLs for persistence
      const imageDataUrls = await Promise.all(
        images.map((img) => fileToDataUrl(img.file)),
      );

      // Convert video file to data URL if present
      const videoDataUrls: string[] = [];
      if (video) {
        const videoDataUrl = await fileToDataUrl(video.file);
        videoDataUrls.push(videoDataUrl);
      }

      const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const location =
        latitude && longitude
          ? {
              latitude: Number.parseFloat(latitude),
              longitude: Number.parseFloat(longitude),
            }
          : undefined;

      const address =
        street || city || zipCode ? { street, city, zipCode } : undefined;

      await createIssue.mutateAsync({
        submission: {
          id: submissionId,
          title: title.trim(),
          description: description.trim(),
          category,
          priority: Priority.medium,
          status: Status.open,
          location,
          address,
          createdBy: DEMO_PRINCIPAL,
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
          updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
          attachments: imageDataUrls,
          videos: videoDataUrls,
          assignedStaff: undefined,
        },
        imageDataUrls,
        videoDataUrls,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory(Category.other);
      setStreet("");
      setCity("");
      setZipCode("");
      setLatitude("");
      setLongitude("");
      for (const img of images) URL.revokeObjectURL(img.preview);
      setImages([]);
      if (video) URL.revokeObjectURL(video.preview);
      setVideo(null);
      setLocationError(null);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit issue";
      setError(message);
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
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as Category)}
            >
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

          {/* Mandatory image upload */}
          <div className="space-y-2">
            <Label htmlFor="images" className="flex items-center gap-1">
              Photos
              <span className="text-destructive ml-0.5">*</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">
                (at least 1 required)
              </span>
            </Label>
            <label
              htmlFor="images"
              className={[
                "flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors",
                images.length === 0 &&
                error === "Please upload at least one image of the issue"
                  ? "border-destructive bg-destructive/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/40",
              ].join(" ")}
            >
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {images.length > 0
                  ? `${images.length} photo${images.length > 1 ? "s" : ""} selected — click to add more`
                  : "Click to upload photos of the issue"}
              </span>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={isSubmitting}
                className="sr-only"
              />
            </label>
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
                      aria-label="Remove image"
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 hover:scale-110"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {image.uploadProgress > 0 && image.uploadProgress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 p-1">
                        <Progress
                          value={image.uploadProgress}
                          className="h-1"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional video upload */}
          <div className="space-y-2">
            <Label htmlFor="video" className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              Video
              <span className="text-xs text-muted-foreground font-normal ml-1">
                (optional)
              </span>
            </Label>
            {!video ? (
              <label
                htmlFor="video"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Click to upload a video of the issue (optional)
                </span>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  disabled={isSubmitting}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="relative rounded-lg border bg-muted/30 overflow-hidden">
                <video
                  src={video.preview}
                  controls
                  className="w-full max-h-48 object-contain"
                >
                  <track kind="captions" />
                </video>
                <button
                  type="button"
                  onClick={removeVideo}
                  aria-label="Remove video"
                  disabled={isSubmitting}
                  className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground transition-all duration-200 hover:scale-110"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs text-muted-foreground px-3 py-1.5 truncate">
                  {video.file.name}
                </p>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              <Label className="text-sm font-semibold">Location</Label>
              {locationLoading && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching your location…
                </span>
              )}
              {!locationLoading && latitude && longitude && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Location detected
                </span>
              )}
            </div>

            {locationError && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                {locationError}
              </p>
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
              disabled={isSubmitting || images.length === 0}
              className="transition-all duration-300 hover:scale-105"
              title={
                images.length === 0
                  ? "Please upload at least one photo"
                  : undefined
              }
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
