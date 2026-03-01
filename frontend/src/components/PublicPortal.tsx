import { useState } from 'react';
import HeroSection from './HeroSection';
import StatisticsStrip from './StatisticsStrip';
import HowItWorksSection from './HowItWorksSection';
import StatisticsSection from './StatisticsSection';
import IssuesSection from './IssuesSection';
import MapSection from './MapSection';
import CivicSenseAnimation from './CivicSenseAnimation';
import ReportIssueDialog from './ReportIssueDialog';

export default function PublicPortal() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-beige">
        <HeroSection />
        <StatisticsStrip />
        <HowItWorksSection />
        <StatisticsSection />
        <IssuesSection />
        <MapSection />
        <div id="about" className="bg-background">
          <CivicSenseAnimation />
        </div>
      </div>
      <ReportIssueDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
    </>
  );
}
