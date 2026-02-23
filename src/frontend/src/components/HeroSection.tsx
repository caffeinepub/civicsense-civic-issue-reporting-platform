// INITIAL DESIGN DOCUMENTATION:
// The initial HeroSection was a simple, centered text layout with a call-to-action button.
// - Heading: "Report Civic Issues in Your Community"
// - Description: Standard text about reporting civic issues
// - CTA: Single "Get Started" button with standard primary styling
// - Background: Standard bg-background color (no images, no gradients)
// - Layout: Centered content with responsive padding
// - No hero banner image displayed (generated/civic-hero-banner.dim_1200x400.jpg was available but not used)
//
// CURRENT VERSION 35 STATE:
// This implementation matches the initial design. Simple, functional hero section with
// standard theme styling and no visual enhancements.

import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { openLoginModal } from '../utils/openLoginModal';

export default function HeroSection() {
  const { loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  const handleGetStarted = () => {
    openLoginModal();
  };

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Report Civic Issues in Your Community
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Help improve your neighborhood by reporting potholes, broken streetlights, waste management issues, and more.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            disabled={isLoggingIn}
            className="px-8 py-6 text-lg"
          >
            {isLoggingIn ? 'Logging in...' : 'Get Started'}
          </Button>
        </div>
      </div>
    </section>
  );
}
