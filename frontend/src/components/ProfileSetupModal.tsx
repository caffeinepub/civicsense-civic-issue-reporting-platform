import { useState, useEffect } from 'react';
import { useSaveCallerUserProfile, useGetCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, Users } from 'lucide-react';
import type { UserProfile } from '../backend';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const saveProfile = useSaveCallerUserProfile();
  const { data: existingProfile } = useGetCallerUserProfile();

  // Check if user intended to be municipal staff (for UI display only)
  // Note: actual isMunicipalStaff flag can only be granted by an admin
  const [isMunicipalIntent, setIsMunicipalIntent] = useState(false);

  useEffect(() => {
    const intendedRole = sessionStorage.getItem('intendedRole');
    if (intendedRole === 'municipal') {
      setIsMunicipalIntent(true);
    }

    // Pre-fill with existing profile data if available
    if (existingProfile) {
      setIsMunicipalIntent(existingProfile.isMunicipalStaff);
    }
  }, [existingProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      return;
    }

    // isMunicipalStaff is always false for new profiles (backend enforces this).
    // Only admins can grant municipal staff status via setMunicipalStaffStatus.
    const profile: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      isMunicipalStaff: false,
    };

    await saveProfile.mutateAsync(profile);

    // Clear the intended role after profile setup
    sessionStorage.removeItem('intendedRole');

    // Scroll to appropriate section based on intent
    if (isMunicipalIntent) {
      setTimeout(() => {
        const dashboardSection = document.getElementById('dashboard');
        if (dashboardSection) {
          dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md modal-centered" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            {isMunicipalIntent ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800">
                <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>
          <DialogTitle className="text-center">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-center">
            {isMunicipalIntent
              ? 'Set up your profile to get started with CivicSense'
              : 'Please provide your information to get started with CivicSense'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saveProfile.isPending}
              className="transition-all focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={saveProfile.isPending}
              className="transition-all focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saveProfile.isPending}
              className="transition-all focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending || !name.trim() || !email.trim()}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
