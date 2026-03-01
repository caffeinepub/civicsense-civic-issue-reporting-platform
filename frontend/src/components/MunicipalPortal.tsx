import { useEffect } from 'react';
import DashboardSection from './DashboardSection';
import { Building2 } from 'lucide-react';

export default function MunicipalPortal() {
  // Scroll to dashboard if flagged from login flow
  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Municipal Portal Banner */}
      <div className="border-b bg-navy py-4">
        <div className="container mx-auto flex items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange/20">
            <Building2 className="h-5 w-5 text-orange" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Municipal Portal</h1>
            <p className="text-sm text-white/70">Issue management and analytics dashboard</p>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <DashboardSection />
    </div>
  );
}
