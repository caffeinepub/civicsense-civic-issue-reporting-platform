import CivicSenseAnimation from "../components/CivicSenseAnimation";
import DashboardSection from "../components/DashboardSection";
import HeroSection from "../components/HeroSection";
import HowItWorksSection from "../components/HowItWorksSection";
import IssuesSection from "../components/IssuesSection";
import LiveStatsSection from "../components/LiveStatsSection";
import MapSection from "../components/MapSection";
import StatisticsSection from "../components/StatisticsSection";
import StatisticsStrip from "../components/StatisticsStrip";
import { getDemoSession } from "../utils/demoSession";

export default function HomePage() {
  const session = getDemoSession();
  const isAuthenticated = !!session;
  const isMunicipalStaff = session?.role === "municipal";

  // Landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-beige">
        <LiveStatsSection />
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

  // Authenticated portal view
  return (
    <div className="min-h-screen space-y-0 bg-background">
      <LiveStatsSection />
      <StatisticsSection />
      <IssuesSection />
      <MapSection />
      {isMunicipalStaff && <DashboardSection />}
    </div>
  );
}
