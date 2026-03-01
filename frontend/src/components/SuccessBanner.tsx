import { CheckCircle2, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SuccessBanner() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000); // Auto-hide after 10 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full border-b bg-[#F5F1EB] py-3">
      <div className="container flex items-center justify-center gap-2 px-4">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <p className="text-sm font-medium text-foreground">
          12 issues resolved today in your city.
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
