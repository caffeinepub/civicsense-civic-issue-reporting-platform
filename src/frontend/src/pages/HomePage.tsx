import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import LiveStatsSection from '../components/LiveStatsSection';
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

  // Auto-scroll to dashboard for municipal operators after login
  useEffect(() => {
    if (isAuthenticated && userProfile && isMunicipalStaff) {
      const shouldScroll = sessionStorage.getItem('scrollToDashboard');
      const intendedRole = sessionStorage.getItem('intendedRole');
      
      if (shouldScroll === 'true' && intendedRole === 'municipal') {
        // Clear the flags immediately to prevent repeated scrolling
        sessionStorage.removeItem('scrollToDashboard');
        sessionStorage.removeItem('intendedRole');
        
        // Scroll to dashboard after a short delay to ensure DOM is ready
        setTimeout(() => {
          const dashboardSection = document.getElementById('dashboard');
          if (dashboardSection) {
            dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 800);
      }
    }
  }, [isAuthenticated, userProfile, isMunicipalStaff]);

  // Show hero for non-authenticated users or during profile loading
  if (!isAuthenticated || profileLoading || !userProfile) {
    return (
      <>
        <LiveStatsSection />
        <HeroSection />
        <CivicSenseAnimation />
      </>
    );
  }

  return (
    <div className="space-y-0">
      <IssuesSection />
      <MapSection />
      {isMunicipalStaff && <DashboardSection />}
    </div>
  );
}
