import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLogin } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Loader2, Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { LOGIN_MODAL_EVENT } from '../utils/openLoginModal';

type AuthStage = 'idle' | 'ii-auth' | 'waiting-principal' | 'backend-login' | 'success';

export default function LoginSelectionModal() {
  const { login: iiLogin, loginStatus, identity, isInitializing } = useInternetIdentity();
  const backendLogin = useLogin();
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'public' | 'municipal' | null>(null);
  const [authStage, setAuthStage] = useState<AuthStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [principalCheckAttempts, setPrincipalCheckAttempts] = useState(0);

  const isAuthenticated = !!identity;
  const isIdle = authStage === 'idle';
  const isIIAuth = authStage === 'ii-auth';
  const isWaitingPrincipal = authStage === 'waiting-principal';
  const isBackendLogin = authStage === 'backend-login';
  const isSuccess = authStage === 'success';
  const isLoggingIn = !isIdle && !isSuccess;

  // Reset all state
  const resetState = () => {
    setSelectedRole(null);
    setAuthStage('idle');
    setError(null);
    setRetryCount(0);
    setPrincipalCheckAttempts(0);
  };

  // Step 2: Monitor for principal availability after II authentication
  useEffect(() => {
    if (authStage !== 'waiting-principal' || !selectedRole) {
      return;
    }

    // Check if identity is now available
    if (identity) {
      console.log('✓ Principal confirmed:', identity.getPrincipal().toString());
      setAuthStage('backend-login');
      setPrincipalCheckAttempts(0);
      return;
    }

    // Implement timeout for principal check
    const checkInterval = setInterval(() => {
      setPrincipalCheckAttempts(prev => {
        const newCount = prev + 1;
        
        // After 30 attempts (15 seconds), show error
        if (newCount >= 30) {
          clearInterval(checkInterval);
          setError('Authentication timed out. Please try again.');
          setAuthStage('idle');
          toast.error('Authentication timed out. Please try again.');
          return 0;
        }
        
        return newCount;
      });
    }, 500);

    return () => clearInterval(checkInterval);
  }, [authStage, identity, selectedRole]);

  // Step 3: Execute backend login once principal is confirmed
  useEffect(() => {
    if (authStage !== 'backend-login' || !identity || !selectedRole) {
      return;
    }

    const executeBackendLogin = async () => {
      try {
        console.log('→ Calling backend login...');
        const isOperator = selectedRole === 'municipal';
        const result = await backendLogin.mutateAsync(isOperator);

        if (result.__kind__ === 'success') {
          console.log('✓ Backend login successful');
          setAuthStage('success');
          sessionStorage.setItem('intendedRole', selectedRole);
          
          setTimeout(() => {
            setShowModal(false);
            resetState();
            toast.success(`Welcome! Logged in as ${selectedRole === 'municipal' ? 'Municipal Operator' : 'Public User'}`);
          }, 1000);
        } else {
          throw new Error(result.error.message || 'Backend login failed');
        }
      } catch (err: any) {
        console.error('Backend login error:', err);
        
        // Retry logic
        if (retryCount < 3) {
          console.log(`Retrying backend login (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            setAuthStage('backend-login');
          }, 1000);
        } else {
          setError(err.message || 'Failed to complete login. Please try again.');
          setAuthStage('idle');
          toast.error('Login failed. Please try again.');
        }
      }
    };

    executeBackendLogin();
  }, [authStage, identity, selectedRole, backendLogin, retryCount]);

  // Register global modal trigger with both methods
  useEffect(() => {
    const openModal = () => {
      if (!isInitializing) {
        console.log('✓ Opening login modal');
        setShowModal(true);
        resetState();
      } else {
        console.log('⚠ Modal trigger called but still initializing');
        toast.error('Please wait a moment and try again.');
      }
    };

    // Method 1: Direct function call
    if (typeof window !== 'undefined') {
      (window as any).openLoginModal = openModal;
      console.log('✓ Login modal trigger registered (direct)');
    }

    // Method 2: Event listener (fallback)
    const handleEvent = () => {
      console.log('✓ Login modal event received');
      openModal();
    };
    window.addEventListener(LOGIN_MODAL_EVENT, handleEvent);
    console.log('✓ Login modal event listener registered');
    
    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).openLoginModal;
      }
      window.removeEventListener(LOGIN_MODAL_EVENT, handleEvent);
    };
  }, [isInitializing]);

  // Handle role selection and start authentication flow
  const handleRoleSelect = async (role: 'public' | 'municipal') => {
    if (isLoggingIn) return;

    setSelectedRole(role);
    setError(null);
    setRetryCount(0);

    try {
      console.log(`→ Starting ${role} login flow...`);
      setAuthStage('ii-auth');
      
      await iiLogin();
      
      console.log('→ II authentication initiated, waiting for principal...');
      setAuthStage('waiting-principal');
    } catch (err: any) {
      console.error('Internet Identity error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
      setAuthStage('idle');
      toast.error('Authentication failed. Please try again.');
    }
  };

  const handleOpenChange = (open: boolean) => {
    console.log('Dialog onOpenChange called with:', open);
    // Only allow closing if not currently logging in
    if (!open && !isLoggingIn) {
      setShowModal(false);
      resetState();
    } else if (open) {
      // Allow opening
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
      <DialogContent className="sm:max-w-[500px]">
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
                  <span>Completing login{retryCount > 0 ? ` (retry ${retryCount}/3)` : ''}...</span>
                </>
              )}
              {isSuccess && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-success">Login successful!</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
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
              if (selectedRole) {
                handleRoleSelect(selectedRole);
              }
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
