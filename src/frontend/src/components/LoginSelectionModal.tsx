import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLogin } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Loader2, Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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
  const isLoggingIn = authStage !== 'idle' && authStage !== 'success';

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

    const performBackendLogin = async () => {
      try {
        console.log('→ Calling backend login...');
        const isOperator = selectedRole === 'municipal';
        const result = await backendLogin.mutateAsync(isOperator);

        if (result.__kind__ === 'success') {
          console.log('✓ Backend login successful');
          setAuthStage('success');
          
          // Store session data for navigation
          if (result.success.isMunicipalOperator) {
            sessionStorage.setItem('intendedRole', 'municipal');
            sessionStorage.setItem('scrollToDashboard', 'true');
            toast.success('Welcome, Municipal Operator! Redirecting to dashboard...', {
              icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            });
          } else {
            sessionStorage.setItem('intendedRole', 'public');
            toast.success('Welcome to CivicSense!', {
              icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            });
          }

          // Close modal after brief success display
          setTimeout(() => {
            setShowModal(false);
            resetState();
          }, 1000);
        } else if (result.__kind__ === 'error') {
          console.error('✗ Backend login error:', result.error);
          handleBackendError(result.error.message, result.error.code);
        }
      } catch (error: any) {
        console.error('✗ Backend login exception:', error);
        handleBackendError(error.message);
      }
    };

    performBackendLogin();
  }, [authStage, identity, selectedRole, backendLogin]);

  const handleBackendError = (message: string, code?: string) => {
    let errorMessage = 'Failed to complete login. Please try again.';
    
    if (code === 'unauthorized' || message?.includes('Unauthorized')) {
      errorMessage = 'Authentication required. Please ensure you completed Internet Identity sign-in.';
    } else if (code === 'invalidCredentials') {
      errorMessage = 'Invalid credentials. Please try logging in again.';
    } else if (message?.includes('Actor not available')) {
      errorMessage = 'Connection error. Please check your network and try again.';
    } else if (message) {
      errorMessage = message;
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
    setAuthStage('idle');
  };

  // Step 1: Start authentication flow
  const handleLogin = async (role: 'public' | 'municipal') => {
    if (isLoggingIn || isInitializing) return;

    console.log(`\n=== Starting ${role} login flow ===`);
    setSelectedRole(role);
    setError(null);
    setAuthStage('ii-auth');

    try {
      console.log('→ Initiating Internet Identity authentication...');
      await iiLogin();
      console.log('✓ Internet Identity authentication completed');
      
      // Move to waiting for principal stage
      setAuthStage('waiting-principal');
      
    } catch (error: any) {
      console.error('✗ Internet Identity error:', error);
      
      let errorMessage = 'Failed to authenticate with Internet Identity.';
      
      if (error.message === 'User is already authenticated') {
        errorMessage = 'Already authenticated. Please refresh the page and try again.';
      } else if (error.message?.includes('User interrupted') || error.message?.includes('UserInterrupt')) {
        errorMessage = 'Authentication cancelled. Please try again when ready.';
        setError(null); // Don't show error for user cancellation
        setAuthStage('idle');
        setSelectedRole(null);
        return;
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Authentication timed out. Please try again.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setAuthStage('idle');
      setSelectedRole(null);
    }
  };

  const handleRetry = () => {
    if (!selectedRole) return;
    
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setError(null);
      handleLogin(selectedRole);
    } else {
      setError('Maximum retry attempts reached. Please refresh the page and try again.');
      toast.error('Maximum retry attempts reached. Please refresh the page.');
    }
  };

  const handleCancel = () => {
    resetState();
    setShowModal(false);
  };

  // Expose modal trigger for Header component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).openLoginModal = () => {
        setShowModal(true);
        resetState();
      };
    }
  }, []);

  const getLoadingMessage = (): string => {
    switch (authStage) {
      case 'ii-auth':
        return 'Authenticating with Internet Identity...';
      case 'waiting-principal':
        return 'Confirming authentication...';
      case 'backend-login':
        return 'Completing login...';
      case 'success':
        return 'Success! Redirecting...';
      default:
        return 'Logging in...';
    }
  };

  const getStageIcon = () => {
    if (authStage === 'success') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (authStage !== 'idle') {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return null;
  };

  const getProgressPercentage = (): number => {
    switch (authStage) {
      case 'idle': return 0;
      case 'ii-auth': return 25;
      case 'waiting-principal': return 50;
      case 'backend-login': return 75;
      case 'success': return 100;
      default: return 0;
    }
  };

  const showCancelButton = authStage !== 'idle' && authStage !== 'success';
  const isSuccessStage = authStage === 'success';

  return (
    <Dialog 
      open={showModal && !isAuthenticated} 
      onOpenChange={(open) => {
        if (!isLoggingIn) {
          setShowModal(open);
          if (!open) resetState();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl modal-centered">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Welcome to CivicSense
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Choose how you'd like to access the platform
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {isLoggingIn && (
          <div className="mx-4 space-y-3">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                {getStageIcon()}
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {getLoadingMessage()}
                  </p>
                  {authStage === 'waiting-principal' && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Waiting for authentication to complete... ({principalCheckAttempts}/30)
                    </p>
                  )}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
            {showCancelButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive mb-2">{error}</p>
                <div className="flex gap-2">
                  {retryCount < 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="border-destructive/20 hover:bg-destructive/10"
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Retry {retryCount > 0 && `(${retryCount}/3)`}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
                {retryCount >= 3 && (
                  <p className="text-xs text-destructive/80 mt-2">
                    Please refresh the page and try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 py-6 md:grid-cols-2">
          {/* Public User Card */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-500 ${
              selectedRole === 'public' ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg' : ''
            } ${isLoggingIn && selectedRole !== 'public' ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => !isLoggingIn && handleLogin('public')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 shadow-md">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">Public User</CardTitle>
              <CardDescription className="text-sm">
                For citizens reporting and tracking civic issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Report civic issues in your community</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Track progress on reported issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>View issues on interactive map</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Comment and vote on issues</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300" 
                disabled={isLoggingIn || isInitializing}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin('public');
                }}
              >
                {isLoggingIn && selectedRole === 'public' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSuccessStage ? 'Success!' : 'Logging in...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Continue as Public User
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Municipal Operator Card */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-orange-500 ${
              selectedRole === 'municipal' ? 'border-orange-500 ring-2 ring-orange-500 shadow-lg' : ''
            } ${isLoggingIn && selectedRole !== 'municipal' ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => !isLoggingIn && handleLogin('municipal')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 shadow-md">
                <Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-xl">Municipal Operator</CardTitle>
              <CardDescription className="text-sm">
                For municipal staff and administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">✓</span>
                  <span>Access Municipal Dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">✓</span>
                  <span>Manage and update issue status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">✓</span>
                  <span>Assign issues to staff members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">✓</span>
                  <span>View analytics and reports</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 transition-all duration-300" 
                disabled={isLoggingIn || isInitializing}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin('municipal');
                }}
              >
                {isLoggingIn && selectedRole === 'municipal' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSuccessStage ? 'Success!' : 'Logging in...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Continue as Municipal Operator
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground animate-pulse">
          🔒 You'll be redirected to Internet Identity for secure authentication
        </p>
      </DialogContent>
    </Dialog>
  );
}
