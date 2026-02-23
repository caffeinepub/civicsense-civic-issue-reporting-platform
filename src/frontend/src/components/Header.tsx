// INITIAL DESIGN DOCUMENTATION:
// The initial Header design featured a clean, sticky header with standard shadcn/ui components.
// - Branding: MapPin icon + "CivicSense" text
// - Navigation: Simple "Home" and "About" links for unauthenticated users
// - Auth UI: Standard button for login, avatar dropdown menu for authenticated users
// - Mobile: Sheet component with hamburger menu icon
// - Styling: Standard theme tokens (foreground, primary, muted-foreground) without gradients
// - No special effects or custom styling beyond shadcn/ui defaults
//
// CURRENT VERSION 35 STATE:
// This implementation matches the initial design closely. The component structure, navigation,
// and authentication UI follow the original specifications with standard theme styling.

import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, Menu, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { openLoginModal } from '../utils/openLoginModal';

export default function Header() {
  const { clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    openLoginModal();
  };

  const handleMobileLoginClick = () => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      openLoginModal();
    }, 300);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">CivicSense</h1>
        </div>

        {!isAuthenticated && (
          <nav className="hidden items-center gap-6 md:flex">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              About
            </button>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated && userProfile ? (
            <>
              <div className="hidden md:flex md:items-center md:gap-3">
                {isMunicipalStaff && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToSection('dashboard')}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                )}
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
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

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
                    {isMunicipalStaff && (
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => scrollToSection('dashboard')}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                    )}
                    <Button variant="ghost" className="justify-start" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Button
                onClick={handleLoginClick}
                disabled={isLoggingIn}
                className="hidden md:inline-flex"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 py-4">
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setMobileMenuOpen(false);
                      }}
                      className="text-left text-sm font-medium text-foreground hover:text-primary"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => scrollToSection('about')}
                      className="text-left text-sm font-medium text-foreground hover:text-primary"
                    >
                      About
                    </button>
                    <Button
                      onClick={handleMobileLoginClick}
                      disabled={isLoggingIn}
                      className="mt-4"
                    >
                      {isLoggingIn ? 'Logging in...' : 'Login'}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
