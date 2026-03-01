import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Hexagon, LogOut, Shield, LayoutDashboard, Menu, X, Building2 } from 'lucide-react';
import { openLoginModal } from '../utils/openLoginModal';
import { useState } from 'react';

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

  const handleSignUpClick = () => {
    openLoginModal();
  };

  const handleAuthorityPortalClick = () => {
    openLoginModal();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Hexagon className="h-8 w-8 fill-navy text-navy" />
          <span className="text-xl font-bold text-navy">CivicSense</span>
          {/* Municipal Portal badge shown when municipal staff is logged in */}
          {isAuthenticated && isMunicipalStaff && (
            <Badge className="ml-1 hidden items-center gap-1 bg-navy px-2 py-0.5 text-xs font-semibold text-white sm:flex">
              <Building2 className="h-3 w-3" />
              Municipal Portal
            </Badge>
          )}
        </div>

        {/* Desktop Navigation - Center */}
        {/* Show public nav only for unauthenticated users or non-municipal citizens */}
        {(!isAuthenticated || (isAuthenticated && userProfile && !isMunicipalStaff)) && (
          <nav className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('report-issue')}
              className="text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              Report Issue
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              About
            </button>
          </nav>
        )}

        {/* Municipal Portal nav links for staff */}
        {isAuthenticated && isMunicipalStaff && (
          <nav className="hidden items-center gap-6 md:flex">
            <button
              onClick={() => scrollToSection('dashboard')}
              className="flex items-center gap-1.5 text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
          </nav>
        )}

        {/* Desktop Auth Buttons / User Menu */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && userProfile ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-orange text-sm font-semibold text-white">
                        {getInitials(userProfile.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userProfile.name}</p>
                      <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isMunicipalStaff && (
                    <DropdownMenuItem disabled className="cursor-default">
                      <Shield className="mr-2 h-4 w-4 text-orange" />
                      <span>{isAdmin ? 'Admin' : 'Municipal Staff'}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Login text link */}
              <button
                onClick={handleLoginClick}
                disabled={isLoggingIn}
                className="text-sm font-medium text-navy transition-colors hover:text-orange disabled:opacity-50"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>

              {/* Sign Up outlined button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignUpClick}
                disabled={isLoggingIn}
                className="border-navy text-navy hover:bg-navy hover:text-white"
              >
                Sign Up
              </Button>

              {/* Authority Portal orange button */}
              <Button
                size="sm"
                onClick={handleAuthorityPortalClick}
                disabled={isLoggingIn}
                className="bg-orange text-white hover:bg-orange/90"
              >
                Authority Portal
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-navy md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="container mx-auto space-y-3 px-4 py-4">
            {/* Municipal staff mobile badge */}
            {isAuthenticated && isMunicipalStaff && (
              <div className="flex items-center gap-2 rounded-lg bg-navy/5 px-3 py-2">
                <Building2 className="h-4 w-4 text-navy" />
                <span className="text-sm font-semibold text-navy">Municipal Portal</span>
              </div>
            )}

            {/* Public nav for unauthenticated or citizen users */}
            {(!isAuthenticated || (isAuthenticated && userProfile && !isMunicipalStaff)) && (
              <>
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                >
                  How It Works
                </button>
                <button
                  onClick={() => scrollToSection('report-issue')}
                  className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                >
                  Report Issue
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                >
                  About
                </button>
              </>
            )}

            {/* Municipal staff mobile nav */}
            {isAuthenticated && isMunicipalStaff && (
              <button
                onClick={() => scrollToSection('dashboard')}
                className="flex w-full items-center gap-2 py-2 text-left text-sm font-medium text-navy hover:text-orange"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
            )}

            {/* Unauthenticated auth buttons */}
            {!isAuthenticated && (
              <div className="space-y-2 border-t pt-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-navy hover:text-orange"
                  onClick={() => {
                    handleLoginClick();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-navy text-navy hover:bg-navy hover:text-white"
                  onClick={() => {
                    handleSignUpClick();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isLoggingIn}
                >
                  Sign Up
                </Button>
                <Button
                  className="w-full bg-orange text-white hover:bg-orange/90"
                  onClick={() => {
                    handleAuthorityPortalClick();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isLoggingIn}
                >
                  Authority Portal
                </Button>
              </div>
            )}

            {/* Authenticated user info and logout */}
            {isAuthenticated && userProfile && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-orange text-sm font-semibold text-white">
                      {getInitials(userProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-navy">{userProfile.name}</p>
                    <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full py-2 text-left text-sm font-medium text-destructive hover:text-destructive/80"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
