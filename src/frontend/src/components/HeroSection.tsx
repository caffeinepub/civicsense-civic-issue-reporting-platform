import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, TrendingUp, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function HeroSection() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';
  const [isVisible, setIsVisible] = useState(false);
  const actionSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger initial animations
    setTimeout(() => setIsVisible(true), 100);

    // Intersection observer for action sections
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.2 }
    );

    if (actionSectionRef.current) {
      observer.observe(actionSectionRef.current);
    }

    return () => {
      if (actionSectionRef.current) {
        observer.unobserve(actionSectionRef.current);
      }
    };
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Hero Banner */}
      <div className="relative h-[400px] w-full">
        <img
          src="/assets/Civic-Sense-The-Forgotten-Superpower-That-Can-Transform-Society-Dr.-Ravinder-Singal.jpeg"
          alt="Community civic engagement - people working together for a better society"
          className="h-full w-full object-cover"
        />
        {/* Enhanced color overlay with civic-blue tone and warm gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/85 via-blue-800/75 to-blue-700/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-950/40" />
        
        <div className="absolute inset-0 flex items-center">
          <div className="container px-4">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-lg">
                <span className={`inline-block bg-gradient-to-r from-civic-orange via-civic-orange-light to-civic-orange bg-clip-text text-transparent transition-all duration-700 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'} hover:scale-105 animate-pulse-glow`}>
                  Report.
                </span>{' '}
                <span className={`inline-block bg-gradient-to-r from-civic-green via-civic-green-light to-civic-green bg-clip-text text-transparent transition-all duration-700 delay-200 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'} hover:scale-105 animate-pulse-glow`}>
                  Track.
                </span>{' '}
                <span className={`inline-block bg-gradient-to-r from-civic-blue-light to-blue-200 bg-clip-text text-transparent transition-all duration-700 delay-400 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'} hover:scale-105 animate-pulse-glow`}>
                  Improve.
                </span>
              </h1>
              <p className={`text-lg text-blue-50 sm:text-xl drop-shadow-md transition-all duration-700 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
                Help make your community better by reporting civic issues. Track progress in real-time and see the impact of your voice.
              </p>
              <div className={`transition-all duration-700 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
                <Button 
                  size="lg" 
                  onClick={login} 
                  disabled={isLoggingIn} 
                  className="rounded-full bg-gradient-to-r from-civic-orange to-civic-orange-light shadow-civic-orange-glow transition-all duration-300 hover:scale-105 hover:shadow-civic-orange-glow hover:from-civic-orange-light hover:to-civic-orange"
                >
                  {isLoggingIn ? 'Logging in...' : 'Get Started'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Action Sections - Report, Track, Improve */}
      <div ref={actionSectionRef} className="relative bg-gradient-to-b from-background via-muted/10 to-background py-20">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Three simple steps to make a difference in your community
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {/* Report Section */}
            <div className="action-card group relative">
              <div className="relative overflow-hidden rounded-2xl border-2 border-civic-orange/20 bg-card p-8 shadow-lg transition-all duration-500 hover:-translate-y-3 hover:border-civic-orange hover:shadow-civic-orange-glow">
                {/* Animated Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src="/assets/generated/citizen-reporting-animated.dim_200x200.png"
                      alt="Citizen Reporting"
                      className="h-32 w-32 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 animate-float"
                    />
                    <div className="absolute inset-0 rounded-full bg-civic-orange/20 blur-2xl transition-all duration-500 group-hover:bg-civic-orange/40 animate-pulse-slow" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="mb-3 text-2xl font-bold transition-colors duration-300 group-hover:text-civic-orange">
                    <span className="inline-block transition-transform duration-300 group-hover:scale-110">
                      Report
                    </span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Snap a photo and report civic issues in your neighborhood with precise location tagging
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-civic-orange/10 blur-2xl transition-all duration-500 group-hover:bg-civic-orange/20" />
                <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-civic-orange/10 blur-2xl transition-all duration-500 group-hover:bg-civic-orange/20" />
              </div>
            </div>

            {/* Track Section */}
            <div className="action-card group relative">
              <div className="relative overflow-hidden rounded-2xl border-2 border-civic-green/20 bg-card p-8 shadow-lg transition-all duration-500 hover:-translate-y-3 hover:border-civic-green hover:shadow-civic-green-glow">
                {/* Animated Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src="/assets/generated/map-tracking-animated.dim_200x200.png"
                      alt="Map Location Tracking"
                      className="h-32 w-32 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 animate-float"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <div className="absolute inset-0 rounded-full bg-civic-green/20 blur-2xl transition-all duration-500 group-hover:bg-civic-green/40 animate-pulse-slow" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="mb-3 text-2xl font-bold transition-colors duration-300 group-hover:text-civic-green">
                    <span className="inline-block transition-transform duration-300 group-hover:scale-110">
                      Track
                    </span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Monitor your reports in real-time and see updates as municipal staff work on resolving issues
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-civic-green/10 blur-2xl transition-all duration-500 group-hover:bg-civic-green/20" />
                <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-civic-green/10 blur-2xl transition-all duration-500 group-hover:bg-civic-green/20" />
              </div>
            </div>

            {/* Improve Section */}
            <div className="action-card group relative">
              <div className="relative overflow-hidden rounded-2xl border-2 border-civic-blue/20 bg-card p-8 shadow-lg transition-all duration-500 hover:-translate-y-3 hover:border-civic-blue hover:shadow-civic-glow">
                {/* Animated Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src="/assets/generated/infrastructure-improvement-animated.dim_200x200.png"
                      alt="Infrastructure Improvement"
                      className="h-32 w-32 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 animate-float"
                      style={{ animationDelay: '0.4s' }}
                    />
                    <div className="absolute inset-0 rounded-full bg-civic-blue/20 blur-2xl transition-all duration-500 group-hover:bg-civic-blue/40 animate-pulse-slow" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="mb-3 text-2xl font-bold transition-colors duration-300 group-hover:text-civic-blue">
                    <span className="inline-block transition-transform duration-300 group-hover:scale-110">
                      Improve
                    </span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Watch your community transform as issues get resolved and infrastructure improves
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-civic-blue/10 blur-2xl transition-all duration-500 group-hover:bg-civic-blue/20" />
                <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-civic-blue/10 blur-2xl transition-all duration-500 group-hover:bg-civic-blue/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="pointer-events-none absolute left-10 top-20 h-64 w-64 rounded-full bg-civic-orange/5 blur-3xl animate-pulse-slow" />
        <div className="pointer-events-none absolute bottom-20 right-10 h-64 w-64 rounded-full bg-civic-green/5 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-civic-blue/5 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Features */}
      <div className="container px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="group flex flex-col items-center space-y-3 text-center transition-all duration-300 hover:-translate-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-civic-blue to-civic-blue-light shadow-civic-glow transition-all duration-300 group-hover:scale-110 group-hover:shadow-civic-glow">
              <MapPin className="h-8 w-8 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-civic-blue">Geo-Tagged Reports</h3>
            <p className="text-sm text-muted-foreground">Precise location tracking for every issue reported in your community</p>
          </div>
          <div className="group flex flex-col items-center space-y-3 text-center transition-all duration-300 hover:-translate-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-civic-orange to-civic-orange-light shadow-civic-orange-glow transition-all duration-300 group-hover:scale-110 group-hover:shadow-civic-orange-glow">
              <Camera className="h-8 w-8 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-civic-orange">Photo Evidence</h3>
            <p className="text-sm text-muted-foreground">Upload photos to provide visual documentation of civic issues</p>
          </div>
          <div className="group flex flex-col items-center space-y-3 text-center transition-all duration-300 hover:-translate-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-civic-green to-civic-green-light shadow-civic-green-glow transition-all duration-300 group-hover:scale-110 group-hover:shadow-civic-green-glow">
              <TrendingUp className="h-8 w-8 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-civic-green">Real-Time Tracking</h3>
            <p className="text-sm text-muted-foreground">Monitor the status of your reports from submission to resolution</p>
          </div>
          <div className="group flex flex-col items-center space-y-3 text-center transition-all duration-300 hover:-translate-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-civic-blue to-civic-blue-light shadow-civic-glow transition-all duration-300 group-hover:scale-110 group-hover:shadow-civic-glow">
              <Users className="h-8 w-8 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-civic-blue">Community Engagement</h3>
            <p className="text-sm text-muted-foreground">Vote and comment on issues to show community support</p>
          </div>
        </div>
      </div>

      {/* Issue Types */}
      <div className="border-t bg-muted/30 py-16">
        <div className="container px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">What Can You Report?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group flex flex-col items-center space-y-3 rounded-lg border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:border-civic-orange hover:shadow-civic-orange-glow">
              <img src="/assets/generated/pothole-icon-transparent.dim_64x64.png" alt="Pothole" className="h-16 w-16 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-semibold transition-colors duration-300 group-hover:text-civic-orange">Potholes</h3>
              <p className="text-sm text-muted-foreground">Road damage and surface issues</p>
            </div>
            <div className="group flex flex-col items-center space-y-3 rounded-lg border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:border-civic-blue hover:shadow-civic-glow">
              <img src="/assets/generated/streetlight-icon-transparent.dim_64x64.png" alt="Streetlight" className="h-16 w-16 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-semibold transition-colors duration-300 group-hover:text-civic-blue">Streetlights</h3>
              <p className="text-sm text-muted-foreground">Broken or malfunctioning lights</p>
            </div>
            <div className="group flex flex-col items-center space-y-3 rounded-lg border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:border-civic-green hover:shadow-civic-green-glow">
              <img src="/assets/generated/waste-icon-transparent.dim_64x64.png" alt="Waste" className="h-16 w-16 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-semibold transition-colors duration-300 group-hover:text-civic-green">Waste Issues</h3>
              <p className="text-sm text-muted-foreground">Garbage collection and disposal</p>
            </div>
            <div className="group flex flex-col items-center space-y-3 rounded-lg border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:border-civic-orange hover:shadow-civic-orange-glow">
              <img src="/assets/generated/other-issue-icon-transparent.dim_64x64.png" alt="Other" className="h-16 w-16 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-semibold transition-colors duration-300 group-hover:text-civic-orange">Other Issues</h3>
              <p className="text-sm text-muted-foreground">Any other civic concerns</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
