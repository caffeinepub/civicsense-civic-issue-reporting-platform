import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import PublicPortal from '../components/PublicPortal';
import MunicipalPortal from '../components/MunicipalPortal';
import { SESSION_KEY_IS_MUNICIPAL } from '../components/LoginSelectionModal';

export default function HomePage() {
  const { identity } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  const isAuthenticated = !!identity;

  // Determine if the user is municipal staff from the profile or admin check
  const isMunicipalStaffFromProfile = userProfile?.isMunicipalStaff === true;
  const isMunicipalStaffFromAdmin = isAdmin === true;

  // Read the CONFIRMED municipal role from sessionStorage.
  // This value is written by LoginSelectionModal ONLY after the backend
  // confirms isMunicipalOperator: true — it is NOT the user's selection intent.
  const confirmedMunicipal =
    typeof window !== 'undefined'
      ? sessionStorage.getItem(SESSION_KEY_IS_MUNICIPAL) === 'true'
      : false;

  // While authenticated and still loading profile/admin status,
  // use the sessionStorage signal to avoid flashing the wrong portal
  const isStillLoading = isAuthenticated && (profileLoading || adminLoading);

  // Determine if this user should see the municipal portal:
  // 1. Confirmed by profile flag (isMunicipalStaff set by admin)
  // 2. Confirmed as admin
  // 3. Backend confirmed municipal role in sessionStorage AND we're still loading (prevents flash)
  const showMunicipalPortal =
    isAuthenticated &&
    (isMunicipalStaffFromProfile ||
      isMunicipalStaffFromAdmin ||
      (isStillLoading && confirmedMunicipal));

  // Wait for a definitive answer before rendering if:
  // - User is authenticated
  // - Profile hasn't been fetched yet (not just loading, but never fetched)
  // - Backend previously confirmed this is a municipal operator (sessionStorage)
  if (isAuthenticated && !profileFetched && confirmedMunicipal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (showMunicipalPortal) {
    return <MunicipalPortal />;
  }

  // Show public portal for unauthenticated users, citizens, and while loading
  return <PublicPortal />;
}
