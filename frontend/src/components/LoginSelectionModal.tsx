import { useState, useEffect, useRef, useCallback } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, Loader2, Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { LOGIN_MODAL_EVENT } from '../utils/openLoginModal';

type AuthStage = 'idle' | 'ii-auth' | 'waiting-principal' | 'backend-login' | 'success';

// Consistent sessionStorage key used by both LoginSelectionModal and HomePage
export const SESSION_KEY_IS_MUNICIPAL = 'isMunicipalOperator';

export default function LoginSelectionModal() {
  const { login: iiLogin, loginStatus, identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'public' | 'municipal' | null>(null);
  const [authStage, setAuthStage] = useState<AuthStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs to prevent duplicate calls and track in-flight state
  const loginInProgressRef = useRef(false);
  const retryCountRef = useRef(0);
  const selectedRoleRef = useRef<'public' | 'municipal' | null>(null);

  const isIdle = authStage === 'idle';
  const isIIAuth = authStage === 'ii-auth';
  const isWaitingPrincipal = authStage === 'waiting-principal';
  const isBackendLogin = authStage === 'backend-login';
  const isSuccess = authStage === 'success';
  const isLoggingIn = !isIdle && !isSuccess;

  const resetState = useCallback(() => {
    setSelectedRole(null);
    setAuthStage('idle');
    setError(null);
    setRetryCount(0);
    retryCountRef.current = 0;
    selectedRoleRef.current = null;
    loginInProgressRef.current = false;
  }, []);

  // Step 2: Monitor for principal availability after II authentication
  useEffect(() => {
    if (authStage !== 'waiting-principal') return;

    if (identity) {
      setAuthStage('backend-login');
      return;
    }

    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts += 1;
      if (attempts >= 30) {
        clearInterval(checkInterval);
        setError('Authentication timed out. Please try again.');
        setAuthStage('idle');
        loginInProgressRef.current = false;
        toast.error('Authentication timed out. Please try again.');
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [authStage, identity]);

  // Step 3: Execute backend login once principal is confirmed
  // Using a ref guard to ensure this only fires once per login attempt
  useEffect(() => {
    if (authStage !== 'backend-login' || !identity || !actor) return;

    // Guard: prevent duplicate invocations
    if (loginInProgressRef.current) return;
    loginInProgressRef.current = true;

    const role = selectedRoleRef.current;
    if (!role) {
      loginInProgressRef.current = false;
      setError('No role selected. Please try again.');
      setAuthStage('idle');
      return;
    }

    const executeBackendLogin = async () => {
      try {
        // Set a temporary loading signal in sessionStorage so HomePage
        // can show a spinner instead of flashing PublicPortal
        sessionStorage.setItem('loginInProgress', 'true');

        // backend login() takes NO arguments — role is determined server-side
        // from the caller's stored profile / admin status
        const result = await actor.login();

        if (result.__kind__ === 'success') {
          const isMunicipalFromBackend = result.success.isMunicipalOperator;

          // Write the CONFIRMED role from the backend response to sessionStorage.
          // This is the authoritative value — not the user's selection intent.
          if (isMunicipalFromBackend) {
            sessionStorage.setItem(SESSION_KEY_IS_MUNICIPAL, 'true');
            sessionStorage.setItem('scrollToDashboard', 'true');
          } else {
            // Explicitly clear so no stale value causes wrong portal rendering
            sessionStorage.removeItem(SESSION_KEY_IS_MUNICIPAL);
            sessionStorage.removeItem('scrollToDashboard');
          }
          sessionStorage.removeItem('loginInProgress');

          // Invalidate and wait for the profile to be refetched
          // so HomePage has fresh data before the modal closes
          await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
          await queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
          await queryClient.refetchQueries({ queryKey: ['currentUserProfile'] });

          loginInProgressRef.current = false;
          setAuthStage('success');

          setTimeout(() => {
            setShowModal(false);
            resetState();
            toast.success(
              `Welcome! Logged in as ${isMunicipalFromBackend ? 'Municipal Operator' : 'Public User'}`
            );
          }, 800);
        } else {
          // Backend returned an error result (not a thrown exception)
          const errorMsg = result.error?.message || 'Login failed. Please try again.';
          loginInProgressRef.current = false;
          // Clear all session storage on error
          sessionStorage.removeItem(SESSION_KEY_IS_MUNICIPAL);
          sessionStorage.removeItem('scrollToDashboard');
          sessionStorage.removeItem('loginInProgress');
          setError(errorMsg);
          setAuthStage('idle');
          toast.error(errorMsg);
        }
      } catch (err: any) {
        const currentRetry = retryCountRef.current;
        if (currentRetry < 2) {
          retryCountRef.current = currentRetry + 1;
          setRetryCount(currentRetry + 1);
          loginInProgressRef.current = false;
          // Small delay before retry
          setTimeout(() => {
            setAuthStage('backend-login');
          }, 1200);
        } else {
          retryCountRef.current = 0;
          loginInProgressRef.current = false;
          // Clear all session storage on final failure
          sessionStorage.removeItem(SESSION_KEY_IS_MUNICIPAL);
          sessionStorage.removeItem('scrollToDashboard');
          sessionStorage.removeItem('loginInProgress');
          const errorMsg = err?.message || 'Failed to complete login. Please try again.';
          setError(errorMsg);
          setAuthStage('idle');
          toast.error('Login failed. Please try again.');
        }
      }
    };

    executeBackendLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStage, identity, actor]);

  // Register global modal trigger
  useEffect(() => {
    const openModal = () => {
      if (!isInitializing) {
        resetState();
        setShowModal(true);
      } else {
        toast.error('Please wait a moment and try again.');
      }
    };

    if (typeof window !== 'undefined') {
      (window as any).openLoginModal = openModal;
    }

    const handleEvent = () => openModal();
    window.addEventListener(LOGIN_MODAL_EVENT, handleEvent);

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).openLoginModal;
      }
      window.removeEventListener(LOGIN_MODAL_EVENT, handleEvent);
    };
  }, [isInitializing, resetState]);

  const handleRoleSelect = async (role: 'public' | 'municipal') => {
    if (isLoggingIn) return;

    // Reset all state before starting a new login attempt
    loginInProgressRef.current = false;
    retryCountRef.current = 0;
    selectedRoleRef.current = role;

    setSelectedRole(role);
    setError(null);
    setRetryCount(0);

    try {
      setAuthStage('ii-auth');
      await iiLogin();
      setAuthStage('waiting-principal');
    } catch (err: any) {
      loginInProgressRef.current = false;
      selectedRoleRef.current = null;
      const errorMsg = err?.message || 'Authentication failed. Please try again.';
      setError(errorMsg);
      setAuthStage('idle');
      toast.error('Authentication failed. Please try again.');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoggingIn) {
      setShowModal(false);
      resetState();
    } else if (open) {
      setShowModal(true);
    }
  };

  const getProgressPercentage = () => {
    if (isIdle) return 0;
    if (isIIAuth) return 25;
    if (isWaitingPrincipal) return 50;
    if (isBackendLogin) return 75;
    if (isSuccess) return 100;
    return 0;
  };

  return (
    <Dialog open={showModal} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] transition-all duration-300 animate-in fade-in zoom-in-95">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {isLoggingIn ? 'Logging In...' : 'Choose Your Role'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLoggingIn
              ? 'Please wait while we authenticate your account'
              : 'Select how you want to use CivicSense'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {isLoggingIn && (
          <div className="space-y-3 py-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              {isIIAuth && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting to Internet Identity...</span>
                </>
              )}
              {isWaitingPrincipal && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying your identity...</span>
                </>
              )}
              {isBackendLogin && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    Completing login{retryCount > 0 ? ` (retry ${retryCount}/2)` : ''}...
                  </span>
                </>
              )}
              {isSuccess && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Login successful!</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !isLoggingIn && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Role Selection Cards */}
        {!isLoggingIn && (
          <div className="grid gap-4 py-4">
            {/* Public User Card */}
            <Card
              className="group cursor-pointer border-2 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg active:scale-[0.98]"
              onClick={() => handleRoleSelect('public')}
            >
              <CardHeader>
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg transition-all duration-300 group-hover:scale-110">
                    <Users className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-center">Public User</CardTitle>
                <CardDescription className="text-center">
                  Report civic issues and track their resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Report problems in your area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Track issue status and updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Engage with your community</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Municipal Operator Card */}
            <Card
              className="group cursor-pointer border-2 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-lg active:scale-[0.98]"
              onClick={() => handleRoleSelect('municipal')}
            >
              <CardHeader>
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent shadow-lg transition-all duration-300 group-hover:scale-110">
                    <Building2 className="h-8 w-8 text-accent-foreground" />
                  </div>
                </div>
                <CardTitle className="text-center">Municipal Operator</CardTitle>
                <CardDescription className="text-center">
                  Manage and resolve civic issues efficiently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-foreground" />
                    <span>Access municipal dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-foreground" />
                    <span>Manage and assign issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-foreground" />
                    <span>View analytics and reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Retry Button */}
        {error && !isLoggingIn && (
          <Button
            onClick={() => {
              if (selectedRoleRef.current) handleRoleSelect(selectedRoleRef.current);
            }}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
