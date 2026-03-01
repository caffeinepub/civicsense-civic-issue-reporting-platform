import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { openLoginModal } from '../utils/openLoginModal';
import CategoryStatsCards from './CategoryStatsCards';

export default function HeroSection() {
  const { loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  const handleReportNow = () => {
    openLoginModal();
  };

  return (
    <section id="report-issue" className="relative overflow-hidden py-16 md:py-24" style={{ minHeight: '580px' }}>
      {/* Background Cityscape */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/assets/generated/hero-cityscape-watercolor.dim_1920x800.png)',
          opacity: 0.55,
        }}
      />
      {/* Warm beige overlay */}
      <div className="absolute inset-0 bg-beige/60" />

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Text and Search */}
          <div className="flex flex-col justify-center">
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-navy">Building Cleaner Cities</span>
              <br />
              <span className="text-orange">Together With Citizens</span>
            </h1>
            <p className="mb-8 max-w-md text-base text-navy/70 sm:text-lg">
              Report civic issues in your area and help authorities take action faster.
            </p>

            {/* Search Interface - two separate white boxes */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              {/* Category Dropdown */}
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/80 bg-white px-3 py-1 shadow-md">
                <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <Select>
                  <SelectTrigger className="border-0 shadow-none focus:ring-0 focus-visible:ring-0 bg-transparent">
                    <SelectValue placeholder="Search Issue Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="garbage">Garbage</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="streetlight">Streetlight</SelectItem>
                    <SelectItem value="pothole">Pothole</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Input */}
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/80 bg-white px-3 py-1 shadow-md">
                <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Enter Location"
                  className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
                />
              </div>
            </div>

            {/* Report Now Button */}
            <div>
              <button
                onClick={handleReportNow}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 rounded-xl bg-orange px-8 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-orange/90 hover:shadow-lg active:scale-95 disabled:opacity-60"
              >
                {isLoggingIn ? 'Logging in...' : 'Report Now'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right Column - Category Stats Cards */}
          <div className="hidden lg:flex lg:flex-col lg:justify-center">
            <CategoryStatsCards />
          </div>
        </div>
      </div>
    </section>
  );
}
