import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LoginSelectionModal from "./components/LoginSelectionModal";
import SuccessBanner from "./components/SuccessBanner";
import HomePage from "./pages/HomePage";
import { getDemoSession } from "./utils/demoSession";

function AppContent() {
  const session = getDemoSession();
  const isAuthenticated = !!session;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {!isAuthenticated && <SuccessBanner />}
      <main className="flex-1">
        <HomePage />
      </main>
      <Footer />
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
