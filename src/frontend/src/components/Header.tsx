import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, Menu, LogOut, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export default function Header() {
  const { clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = () => {
    // Trigger the login selection modal
    if (typeof window !== 'undefined' && (window as any).openLoginModal) {
      (window as any).openLoginModal();
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    sessionStorage.removeItem('intendedRole');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isMunicipalStaff = userProfile?.isMunicipalStaff || isAdmin;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">CivicSense</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {isAuthenticated && userProfile && (
            <>
              <a href="#issues" className="text-sm font-medium transition-colors hover:text-primary">
                Issues
              </a>
              <a href="#map" className="text-sm font-medium transition-colors hover:text-primary">
                Map
              </a>
              {isMunicipalStaff && (
                <a href="#dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                  Dashboard
                </a>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && userProfile ? (
            <>
              {/* Desktop User Menu */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(userProfile.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isMunicipalStaff && (
                      <DropdownMenuItem disabled>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>{isAdmin ? 'Admin' : 'Municipal Staff'}</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center gap-3 border-b pb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(userProfile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{userProfile.name}</p>
                        <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                      </div>
                    </div>
                    <nav className="flex flex-col gap-2">
                      <a
                        href="#issues"
                        className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Issues
                      </a>
                      <a
                        href="#map"
                        className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Map
                      </a>
                      {isMunicipalStaff && (
                        <a
                          href="#dashboard"
                          className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                        </a>
                      )}
                    </nav>
                    <Button variant="outline" onClick={handleLogout} className="mt-auto">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Button onClick={handleLogin} disabled={isLoggingIn} className="rounded-full">
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
