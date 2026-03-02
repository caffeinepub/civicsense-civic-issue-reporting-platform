import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProfileSetupModal from './components/ProfileSetupModal';
import LoginSelectionModal from './components/LoginSelectionModal';
import SuccessBanner from './components/SuccessBanner';
import { useSeedData } from './hooks/useSeedData';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  // Seed sample data when authenticated
  useSeedData();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Show loading state during initialization
  if (loginStatus === 'initializing') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Initializing CivicSense...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {!isAuthenticated && <SuccessBanner />}
      <main className="flex-1">
        <HomePage />
      </main>
      <Footer />
      {showProfileSetup && <ProfileSetupModal />}
      <LoginSelectionModal />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContent />
    </ThemeProvider>
  );
}
