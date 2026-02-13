import { useEffect, useRef, useState } from 'react';
import { Sparkles, Shield, Leaf } from 'lucide-react';

export default function CivicSenseAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const civicValues = [
    {
      title: 'Cleanliness',
      description: 'Keep our community clean and beautiful for everyone to enjoy',
      icon: Sparkles,
      image: '/assets/generated/cleanliness-civic-value.dim_400x300.png',
      color: 'civic-green',
      delay: 'delay-100',
    },
    {
      title: 'Safety',
      description: 'Ensure safe streets and public spaces for all citizens',
      icon: Shield,
      image: '/assets/generated/safety-civic-value.dim_400x300.png',
      color: 'civic-blue',
      delay: 'delay-300',
    },
    {
      title: 'Responsibility',
      description: 'Take ownership of our shared environment and civic duties',
      icon: Leaf,
      image: '/assets/generated/responsibility-civic-value.dim_400x300.png',
      color: 'civic-orange',
      delay: 'delay-500',
    },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background py-20">
      <div className="container px-4">
        {/* Section Header */}
        <div
          className={`mb-16 text-center transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-civic-blue via-civic-green to-civic-orange bg-clip-text text-transparent">
              Civic Sense
            </span>{' '}
            in Action
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Building a better community through shared values and collective responsibility
          </p>
        </div>

        {/* Animated Value Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {civicValues.map((value, index) => (
            <div
              key={value.title}
              className={`group relative transition-all duration-1000 ${value.delay} ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
              }`}
            >
              <div className="relative overflow-hidden rounded-2xl border bg-card shadow-lg transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl">
                {/* Image Container with Overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={value.image}
                    alt={value.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-${value.color}/90 via-${value.color}/50 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90`}
                  />
                  
                  {/* Floating Icon */}
                  <div
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12`}
                  >
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-${value.color} to-${value.color}-light shadow-${value.color}-glow`}
                    >
                      <value.icon className="h-10 w-10 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3
                    className={`mb-3 text-2xl font-bold transition-colors duration-300 group-hover:text-${value.color}`}
                  >
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {value.description}
                  </p>
                </div>

                {/* Animated Border Glow */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  style={{
                    background: `linear-gradient(135deg, oklch(var(--${value.color})) 0%, transparent 50%, oklch(var(--${value.color}-light)) 100%)`,
                    padding: '2px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Decorative Elements */}
        <div className="mt-16 flex items-center justify-center gap-8">
          <div
            className={`transition-all duration-1000 delay-700 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            <img
              src="/assets/generated/civic-building-icon.dim_200x200.png"
              alt="Civic Building"
              className="h-16 w-16 opacity-60 transition-all duration-500 hover:scale-110 hover:opacity-100"
            />
          </div>
          <div
            className={`transition-all duration-1000 delay-900 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            <img
              src="/assets/generated/community-engagement-icon-transparent.dim_100x100.png"
              alt="Community Engagement"
              className="h-16 w-16 opacity-60 transition-all duration-500 hover:scale-110 hover:opacity-100"
            />
          </div>
          <div
            className={`transition-all duration-1000 delay-1100 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            <img
              src="/assets/generated/environmental-responsibility-icon-transparent.dim_100x100.png"
              alt="Environmental Responsibility"
              className="h-16 w-16 opacity-60 transition-all duration-500 hover:scale-110 hover:opacity-100"
            />
          </div>
        </div>
      </div>

      {/* Background Decorative Circles */}
      <div className="pointer-events-none absolute left-10 top-20 h-64 w-64 rounded-full bg-civic-blue/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-10 h-64 w-64 rounded-full bg-civic-orange/5 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-civic-green/5 blur-3xl" />
    </section>
  );
}
