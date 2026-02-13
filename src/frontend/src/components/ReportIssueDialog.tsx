import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateIssue, useUploadAttachments } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, MapPin, AlertCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
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
  { value: Category.potholes, label: 'Pothole' },
  { value: Category.streetlights, label: 'Streetlight' },
  { value: Category.waste, label: 'Waste Issue' },
  { value: Category.other, label: 'Other' },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: Priority.low, label: 'Low' },
  { value: Priority.medium, label: 'Medium' },
  { value: Priority.high, label: 'High' },
];

export default function ReportIssueDialog({ open, onOpenChange }: ReportIssueDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.potholes);
  const [priority, setPriority] = useState<Priority>(Priority.medium);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);

  const { identity, login, loginStatus } = useInternetIdentity();
  const createIssue = useCreateIssue();
  const uploadAttachments = useUploadAttachments();

  const isAuthenticated = !!identity;
  const isAuthenticating = loginStatus === 'logging-in' || loginStatus === 'initializing';

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enter coordinates manually.');
        setGettingLocation(false);
      }
    );
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImagePreview[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({
        id: `${Date.now()}-${i}`,
        file,
        preview,
        uploadProgress: 0,
      });
    }

    setImages((prev) => [...prev, ...newImages]);
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const convertImageToBlob = async (image: ImagePreview): Promise<ExternalBlob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? { ...img, uploadProgress: percentage } : img
            )
          );
        });
        resolve(blob);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(image.file);
    });
  };

  const validateCoordinates = (lat: string, lon: string): { isValid: boolean; error?: string } => {
    if (!lat && !lon) {
      return { isValid: true };
    }

    if (!lat || !lon) {
      return { isValid: false, error: 'Both latitude and longitude are required if providing location' };
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return { isValid: false, error: 'Latitude and longitude must be valid numbers' };
    }

    if (latNum < -90 || latNum > 90) {
      return { isValid: false, error: 'Latitude must be between -90 and 90' };
    }

    if (lonNum < -180 || lonNum > 180) {
      return { isValid: false, error: 'Longitude must be between -180 and 180' };
    }

    return { isValid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      alert('Please log in to report an issue');
      await login();
      return;
    }

    if (!title.trim() || !description.trim()) return;

    const validation = validateCoordinates(latitude.trim(), longitude.trim());
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    const issueId = `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const hasValidLocation = latitude.trim() && longitude.trim();
    const locationData = hasValidLocation
      ? {
          latitude: parseFloat(latitude.trim()),
          longitude: parseFloat(longitude.trim()),
        }
      : undefined;

    const hasAddress = street.trim() || city.trim() || zipCode.trim();
    const addressData = hasAddress
      ? {
          street: street.trim(),
          city: city.trim(),
          zipCode: zipCode.trim(),
        }
      : undefined;

    try {
      // Create the issue first
      await createIssue.mutateAsync({
        id: issueId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: Status.open,
        location: locationData,
        address: addressData,
        createdBy: identity.getPrincipal(),
        assignedStaff: undefined,
        createdAt: BigInt(0),
        updatedAt: BigInt(0),
        attachments: [],
      });

      // Upload images if any
      if (images.length > 0) {
        const blobs: ExternalBlob[] = [];
        for (const image of images) {
          const blob = await convertImageToBlob(image);
          blobs.push(blob);
        }
        
        await uploadAttachments.mutateAsync({
          submissionId: issueId,
          blobs,
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setCategory(Category.potholes);
      setPriority(Priority.medium);
      setStreet('');
      setCity('');
      setZipCode('');
      setLatitude('');
      setLongitude('');
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting issue:', error);
    }
  };

  const canSubmit = isAuthenticated && !createIssue.isPending && !uploadAttachments.isPending && title.trim() && description.trim();
  const isSubmitting = createIssue.isPending || uploadAttachments.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-civic-orange to-civic-orange-light bg-clip-text text-transparent">
            Report a Civic Issue
          </DialogTitle>
          <DialogDescription>Provide details about the issue you'd like to report to your municipality.</DialogDescription>
        </DialogHeader>

        {!isAuthenticated && (
          <Alert className="border-civic-orange/50 bg-civic-orange/10">
            <AlertCircle className="h-4 w-4 text-civic-orange" />
            <AlertDescription>
              You must be logged in to report an issue.{' '}
              <button onClick={login} disabled={isAuthenticating} className="font-medium text-civic-orange underline transition-colors duration-300 hover:text-civic-orange-light hover:no-underline">
                {isAuthenticating ? 'Logging in...' : 'Log in now'}
              </button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={!isAuthenticated}
              className="transition-all duration-300 focus:border-civic-orange focus:ring-civic-orange"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as Category)} disabled={!isAuthenticated}>
                <SelectTrigger id="category" className="transition-all duration-300 focus:border-civic-blue focus:ring-civic-blue">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="transition-colors duration-300 focus:bg-civic-blue/10">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)} disabled={!isAuthenticated}>
                <SelectTrigger id="priority" className="transition-all duration-300 focus:border-civic-green focus:ring-civic-green">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="transition-colors duration-300 focus:bg-civic-green/10">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              disabled={!isAuthenticated}
              className="transition-all duration-300 focus:border-civic-orange focus:ring-civic-orange"
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3 rounded-lg border border-civic-orange/30 bg-civic-orange/5 p-4 transition-all duration-300 hover:border-civic-orange/50">
            <div className="flex items-center justify-between">
              <Label className="text-base">Photos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={!isAuthenticated}
                className="transition-all duration-300 hover:border-civic-orange hover:bg-civic-orange/10 hover:text-civic-orange"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                disabled={!isAuthenticated}
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image) => (
                  <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity duration-300 hover:bg-destructive/90 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {image.uploadProgress > 0 && image.uploadProgress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                        <Progress value={image.uploadProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 py-8 text-center">
                <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No images selected</p>
                <p className="text-xs text-muted-foreground">Click "Upload Images" to add photos</p>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-civic-blue/30 bg-civic-blue/5 p-4 transition-all duration-300 hover:border-civic-blue/50">
            <div className="flex items-center justify-between">
              <Label className="text-base">Location</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={gettingLocation || !isAuthenticated}
                className="transition-all duration-300 hover:border-civic-blue hover:bg-civic-blue/10 hover:text-civic-blue"
              >
                {gettingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                Get Current Location
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm">
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="40.7128"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  min="-90"
                  max="90"
                  disabled={!isAuthenticated}
                  className="transition-all duration-300 focus:border-civic-blue focus:ring-civic-blue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm">
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="-74.0060"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  min="-180"
                  max="180"
                  disabled={!isAuthenticated}
                  className="transition-all duration-300 focus:border-civic-blue focus:ring-civic-blue"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm">
                Street Address
              </Label>
              <Input
                id="street"
                placeholder="123 Main St"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={!isAuthenticated}
                className="transition-all duration-300 focus:border-civic-blue focus:ring-civic-blue"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm">
                  City
                </Label>
                <Input 
                  id="city" 
                  placeholder="New York" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  disabled={!isAuthenticated}
                  className="transition-all duration-300 focus:border-civic-blue focus:ring-civic-blue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm">
                  ZIP Code
                </Label>
                <Input
                  id="zipCode"
                  placeholder="10001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={!isAuthenticated}
                  className="transition-all duration-300 focus:border-civic-blue focus:ring-civic-blue"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="transition-all duration-300 hover:border-civic-orange hover:text-civic-orange">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!canSubmit}
              className="bg-gradient-to-r from-civic-orange to-civic-orange-light shadow-civic-orange-glow transition-all duration-300 hover:scale-105 hover:shadow-civic-orange-glow hover:from-civic-orange-light hover:to-civic-orange disabled:opacity-50"
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
