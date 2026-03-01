import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateIssue, useUploadAttachment } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Category, Priority, Status, ExternalBlob } from '@/backend';
import { MapPin, Loader2, AlertCircle, X, Upload } from 'lucide-react';

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LocationState {
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage?: string;
}

export default function ReportIssueDialog({ open, onOpenChange }: ReportIssueDialogProps) {
  const { identity } = useInternetIdentity();
  const createIssue = useCreateIssue();
  const uploadAttachment = useUploadAttachment();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.garbage);
  const [priority, setPriority] = useState<Priority>(Priority.medium);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [locationState, setLocationState] = useState<LocationState>({ status: 'idle' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = createIssue.isPending || uploadAttachment.isPending;

  // Auto-fetch location when dialog opens
  useEffect(() => {
    if (!open) return;

    // Reset form state
    setTitle('');
    setDescription('');
    setCategory(Category.garbage);
    setPriority(Priority.medium);
    setLatitude('');
    setLongitude('');
    setStreet('');
    setCity('');
    setZipCode('');
    setImages([]);
    setSubmitError(null);
    setLocationState({ status: 'idle' });

    if (!navigator.geolocation) {
      setLocationState({ status: 'error', errorMessage: 'Geolocation is not supported by your browser.' });
      return;
    }

    setLocationState({ status: 'fetching' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));

        // Reverse geocode using Nominatim (free, no API key needed)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            const streetVal = [addr.road, addr.house_number].filter(Boolean).join(' ') || addr.suburb || '';
            const cityVal = addr.city || addr.town || addr.village || addr.county || '';
            const zipVal = addr.postcode || '';
            setStreet(streetVal);
            setCity(cityVal);
            setZipCode(zipVal);
          }
        } catch {
          // Geocoding failed silently — coordinates are still set
        }

        setLocationState({ status: 'success' });
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access denied. Please enter your location manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable. Please enter manually.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please enter manually.';
        }
        setLocationState({ status: 'error', errorMessage: msg });
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!identity) {
      setSubmitError('You must be logged in to report an issue.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setSubmitError('Title and description are required.');
      return;
    }

    try {
      const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const now = BigInt(Date.now()) * BigInt(1_000_000);

      const location =
        latitude && longitude
          ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
          : undefined;

      const address =
        street || city || zipCode
          ? { street: street.trim(), city: city.trim(), zipCode: zipCode.trim() }
          : undefined;

      await createIssue.mutateAsync({
        id: submissionId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: Status.pending,
        location,
        address,
        createdBy: identity.getPrincipal(),
        assignedStaff: undefined,
        createdAt: now,
        updatedAt: now,
        attachments: [],
      });

      // Upload images if any
      if (images.length > 0) {
        const blobs: ExternalBlob[] = await Promise.all(
          images.map(async (file) => {
            const bytes = new Uint8Array(await file.arrayBuffer());
            return ExternalBlob.fromBytes(bytes);
          })
        );
        await uploadAttachment.mutateAsync({ submissionId, blobs });
      }

      onOpenChange(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit issue. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="text-navy text-xl font-bold">Report a Civic Issue</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fill in the details below to report an issue in your area.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-navy font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-navy font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about the issue..."
              rows={3}
              required
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-navy font-medium">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Category.garbage}>Garbage</SelectItem>
                  <SelectItem value={Category.traffic}>Traffic</SelectItem>
                  <SelectItem value={Category.streetlight}>Streetlight</SelectItem>
                  <SelectItem value={Category.potholes}>Potholes</SelectItem>
                  <SelectItem value={Category.noise}>Noise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-navy font-medium">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Priority.low}>Low</SelectItem>
                  <SelectItem value={Priority.medium}>Medium</SelectItem>
                  <SelectItem value={Priority.high}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-navy font-medium">Location</Label>
              {locationState.status === 'fetching' && (
                <span className="flex items-center gap-1 text-xs text-orange">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Detecting your location…
                </span>
              )}
              {locationState.status === 'success' && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <MapPin className="w-3 h-3" />
                  Location detected automatically
                </span>
              )}
              {locationState.status === 'error' && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {locationState.errorMessage}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="latitude" className="text-xs text-muted-foreground">
                  Latitude
                </Label>
                <div className="relative">
                  <Input
                    id="latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 28.6139"
                    disabled={locationState.status === 'fetching' || isSubmitting}
                  />
                  {locationState.status === 'fetching' && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="longitude" className="text-xs text-muted-foreground">
                  Longitude
                </Label>
                <div className="relative">
                  <Input
                    id="longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. 77.2090"
                    disabled={locationState.status === 'fetching' || isSubmitting}
                  />
                  {locationState.status === 'fetching' && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="street" className="text-xs text-muted-foreground">
                Street Address
              </Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street / Road name"
                disabled={locationState.status === 'fetching' || isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs text-muted-foreground">
                  City
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City / Town"
                  disabled={locationState.status === 'fetching' || isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zipCode" className="text-xs text-muted-foreground">
                  ZIP / PIN Code
                </Label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="PIN / ZIP"
                  disabled={locationState.status === 'fetching' || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-navy font-medium">Photos (optional)</Label>
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:border-orange/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Click to upload photos</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </div>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      className="w-16 h-16 object-cover rounded-md border border-muted transition-transform group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      disabled={isSubmitting}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange hover:bg-orange/90 text-white font-semibold"
              disabled={isSubmitting || !title.trim() || !description.trim()}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </span>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
