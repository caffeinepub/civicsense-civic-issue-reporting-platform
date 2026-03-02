import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { seedSampleData } from '../utils/seedData';

const SEED_KEY = 'civicsense_seeded_v1';

/**
 * Hook that seeds sample data into the backend on first authenticated load.
 * Only runs once per browser session (tracked via localStorage).
 * Requires an authenticated user since createSubmission needs #user permission.
 */
export function useSeedData() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const hasSeeded = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only seed if:
    // 1. Actor is ready
    // 2. Not already seeded this session
    // 3. Not already seeded in localStorage
    // 4. User is authenticated (needed for createSubmission)
    if (
      !actor ||
      isFetching ||
      hasSeeded.current ||
      localStorage.getItem(SEED_KEY) ||
      !identity
    ) {
      return;
    }

    hasSeeded.current = true;

    seedSampleData(actor).then(() => {
      // Invalidate queries so the UI refreshes with new data
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });
  }, [actor, isFetching, identity, queryClient]);
}
