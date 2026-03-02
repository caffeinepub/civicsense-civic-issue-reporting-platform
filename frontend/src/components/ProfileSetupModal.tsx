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

  // Check if user intended to be municipal staff
  const [isMunicipalStaff, setIsMunicipalStaff] = useState(false);

  useEffect(() => {
    const intendedRole = sessionStorage.getItem('intendedRole');
    if (intendedRole === 'municipal') {
      setIsMunicipalStaff(true);
    }
    
    // Pre-fill with existing profile data if available
    if (existingProfile) {
      setIsMunicipalStaff(existingProfile.isMunicipalStaff);
    }
  }, [existingProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      return;
    }

    const profile: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      isMunicipalStaff,
    };

    await saveProfile.mutateAsync(profile);
    
    // Clear the intended role after profile setup
    sessionStorage.removeItem('intendedRole');

    // Scroll to appropriate section based on role
    if (isMunicipalStaff) {
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
            {isMunicipalStaff ? (
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
            {isMunicipalStaff 
              ? 'Set up your municipal operator profile to access the dashboard'
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

          {isMunicipalStaff && (
            <div className="rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-100">Municipal Operator Access</p>
                  <p className="text-xs mt-1 text-orange-800 dark:text-orange-200">
                    Your account is configured with municipal staff permissions. You'll have access to the dashboard and analytics.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className={`w-full transition-all duration-300 ${
              isMunicipalStaff 
                ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            }`}
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
