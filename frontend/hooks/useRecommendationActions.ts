
import { useState, useCallback } from 'react';
import { recommendationApi } from '../services/recommendationApi'

interface UseRecommendationActionsProps {
  onSuccess?: (action: string, listingId: number) => void;
  onError?: (error: Error, action: string, listingId: number) => void;
}

interface RecommendationActions {
  markAsViewed: (listingId: number) => Promise<void>;
  toggleSaved: (listingId: number, currentSavedState: boolean) => Promise<void>;
  updateStatus: (listingId: number, updates: { is_saved?: boolean; is_viewed?: boolean }) => Promise<void>;
  loading: Record<number, boolean>;
  errors: Record<number, string | null>;
}

export const useRecommendationActions = ({
  onSuccess,
  onError,
}: UseRecommendationActionsProps = {}): RecommendationActions => {
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string | null>>({});

  const setLoadingState = useCallback((listingId: number, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [listingId]: isLoading }));
  }, []);

  const setErrorState = useCallback((listingId: number, error: string | null) => {
    setErrors(prev => ({ ...prev, [listingId]: error }));
  }, []);

  const markAsViewed = useCallback(async (listingId: number) => {
    setLoadingState(listingId, true);
    setErrorState(listingId, null);

    try {
      await recommendationApi.markAsViewed(listingId);
      onSuccess?.('viewed', listingId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setErrorState(listingId, errorMessage);
      onError?.(error as Error, 'viewed', listingId);
    } finally {
      setLoadingState(listingId, false);
    }
  }, [onSuccess, onError, setLoadingState, setErrorState]);

  const toggleSaved = useCallback(async (listingId: number, currentSavedState: boolean) => {
    setLoadingState(listingId, true);
    setErrorState(listingId, null);

    try {
      if (currentSavedState) {
        await recommendationApi.unsaveRecommendation(listingId);
      } else {
        await recommendationApi.saveRecommendation(listingId);
      }
      onSuccess?.(currentSavedState ? 'unsaved' : 'saved', listingId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setErrorState(listingId, errorMessage);
      onError?.(error as Error, currentSavedState ? 'unsaved' : 'saved', listingId);
    } finally {
      setLoadingState(listingId, false);
    }
  }, [onSuccess, onError, setLoadingState, setErrorState]);

  const updateStatus = useCallback(async (
    listingId: number, 
    updates: { is_saved?: boolean; is_viewed?: boolean }
  ) => {
    setLoadingState(listingId, true);
    setErrorState(listingId, null);

    try {
      await recommendationApi.updateRecommendationStatus(listingId, updates);
      onSuccess?.('updated', listingId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setErrorState(listingId, errorMessage);
      onError?.(error as Error, 'updated', listingId);
    } finally {
      setLoadingState(listingId, false);
    }
  }, [onSuccess, onError, setLoadingState, setErrorState]);

  return {
    markAsViewed,
    toggleSaved,
    updateStatus,
    loading,
    errors,
  };
};

