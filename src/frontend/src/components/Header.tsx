import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Hexagon,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { clearDemoSession, getDemoSession } from "../utils/demoSession";
import { openLoginModal } from "../utils/openLoginModal";

export default function Header() {
  const [session] = useState(getDemoSession());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!session;
  const isMunicipalStaff = session?.role === "municipal";
  const userProfile = session ? { name: session.name } : null;

  const handleLogout = () => {
    clearDemoSession();
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Hexagon className="h-8 w-8 fill-navy text-navy" />
          <span className="text-xl font-bold text-navy">CivicSense</span>
        </button>

        {/* Desktop Navigation - Center */}
        {!isAuthenticated && (
          <nav className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("report-issue")}
              className="text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              Report Issue
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="text-sm font-medium text-navy transition-colors hover:text-orange"
            >
              About
            </button>
          </nav>
        )}

        {/* Desktop Auth Buttons / User Menu */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && userProfile ? (
            <>
              {isMunicipalStaff && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection("dashboard")}
                  className="text-navy hover:bg-orange/10 hover:text-orange"
                  data-ocid="header.link"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                    data-ocid="header.toggle"
                  >
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
                      <p className="text-xs text-muted-foreground">
                        {isMunicipalStaff ? "Municipal Staff" : "Public User"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isMunicipalStaff && (
                    <DropdownMenuItem disabled className="cursor-default">
                      <Shield className="mr-2 h-4 w-4 text-orange" />
                      <span>Municipal Staff</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    data-ocid="header.delete_button"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Login - opens public user login */}
              <button
                type="button"
                onClick={() => openLoginModal("public")}
                className="text-sm font-medium text-navy transition-colors hover:text-orange"
                data-ocid="header.link"
              >
                Login
              </button>

              {/* Sign Up - opens public user login */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => openLoginModal("public")}
                className="border-navy text-navy hover:bg-navy hover:text-white"
                data-ocid="header.secondary_button"
              >
                Sign Up
              </Button>

              {/* Authority Portal - opens municipal login directly */}
              <Button
                size="sm"
                onClick={() => openLoginModal("municipal")}
                className="bg-orange text-white hover:bg-orange/90"
                data-ocid="header.primary_button"
              >
                Authority Portal
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-navy md:hidden"
          aria-label="Toggle menu"
          data-ocid="header.toggle"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="container mx-auto space-y-3 px-4 py-4">
            {!isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("how-it-works")}
                  className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                >
                  How It Works
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("report-issue")}
                  className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                >
                  Report Issue
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("about")}
                  className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                >
                  About
                </button>
                <div className="space-y-2 border-t pt-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-navy hover:text-orange"
                    onClick={() => {
                      openLoginModal("public");
                      setMobileMenuOpen(false);
                    }}
                    data-ocid="header.link"
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-navy text-navy hover:bg-navy hover:text-white"
                    onClick={() => {
                      openLoginModal("public");
                      setMobileMenuOpen(false);
                    }}
                    data-ocid="header.secondary_button"
                  >
                    Sign Up
                  </Button>
                  <Button
                    className="w-full bg-orange text-white hover:bg-orange/90"
                    onClick={() => {
                      openLoginModal("municipal");
                      setMobileMenuOpen(false);
                    }}
                    data-ocid="header.primary_button"
                  >
                    Authority Portal
                  </Button>
                </div>
              </>
            )}
            {isAuthenticated && userProfile && (
              <>
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-orange text-sm font-semibold text-white">
                      {getInitials(userProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-navy">
                      {userProfile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isMunicipalStaff ? "Municipal Staff" : "Public User"}
                    </p>
                  </div>
                </div>
                {isMunicipalStaff && (
                  <button
                    type="button"
                    onClick={() => scrollToSection("dashboard")}
                    className="block w-full py-2 text-left text-sm font-medium text-navy hover:text-orange"
                  >
                    Dashboard
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full py-2 text-left text-sm font-medium text-destructive hover:text-destructive/80"
                  data-ocid="header.delete_button"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
