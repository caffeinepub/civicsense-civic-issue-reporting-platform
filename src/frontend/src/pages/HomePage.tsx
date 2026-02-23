// INITIAL DESIGN DOCUMENTATION:
// The initial HomePage had two distinct views based on authentication state:
// - Unauthenticated: HeroSection + CivicSenseAnimation (about section with id="about")
// - Authenticated: IssuesSection + MapSection + DashboardSection (for municipal staff only)
// - Auto-scroll behavior: Municipal staff are scrolled to dashboard after login
// - Background: Standard bg-background color throughout
// - No stats strip or additional hero imagery
// - LiveStatsSection component existed but returned null (disabled)
//
// CURRENT VERSION 35 STATE:
// This implementation matches the initial design. Conditional rendering based on auth state,
// with proper section ordering and auto-scroll functionality for municipal staff.

import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import CivicSenseAnimation from '../components/CivicSenseAnimation';
import IssuesSection from '../components/IssuesSection';
import MapSection from '../components/MapSection';
import DashboardSection from '../components/DashboardSection';

export default function HomePage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const isMunicipalStaff = userProfile?.isMunicipalStaff || isAdmin;

  useEffect(() => {
    if (isAuthenticated && userProfile && isMunicipalStaff) {
      const shouldScroll = sessionStorage.getItem('scrollToDashboard');
      const intendedRole = sessionStorage.getItem('intendedRole');
      
      if (shouldScroll === 'true' && intendedRole === 'municipal') {
        sessionStorage.removeItem('scrollToDashboard');
        sessionStorage.removeItem('intendedRole');
        
        setTimeout(() => {
          const dashboardSection = document.getElementById('dashboard');
          if (dashboardSection) {
            dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 800);
      }
    }
  }, [isAuthenticated, userProfile, isMunicipalStaff]);

  if (!isAuthenticated || profileLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <HeroSection />
        <div id="about" className="bg-background">
          <CivicSenseAnimation />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-0 bg-background">
      <IssuesSection />
      <MapSection />
      {isMunicipalStaff && <DashboardSection />}
    </div>
  );
}
