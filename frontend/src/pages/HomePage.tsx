import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import StatisticsStrip from '../components/StatisticsStrip';
import HowItWorksSection from '../components/HowItWorksSection';
import CivicSenseAnimation from '../components/CivicSenseAnimation';
import IssuesSection from '../components/IssuesSection';
import MapSection from '../components/MapSection';
import DashboardSection from '../components/DashboardSection';
import StatisticsSection from '../components/StatisticsSection';

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
      <div className="min-h-screen bg-beige">
        <HeroSection />
        <StatisticsStrip />
        <HowItWorksSection />
        <StatisticsSection />
        <div id="about" className="bg-background">
          <CivicSenseAnimation />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-0 bg-background">
      <StatisticsSection />
      <IssuesSection />
      <MapSection />
      {isMunicipalStaff && <DashboardSection />}
    </div>
  );
}
