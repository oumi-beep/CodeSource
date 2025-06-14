
import { useState, useCallback } from 'react';

interface OptimisticUpdate {
  id: number;
  field: 'is_saved' | 'is_viewed';
  originalValue: boolean;
  newValue: boolean;
  timestamp: number;
}

interface Recommendation {
  id: number;
  title: string;
  company: string;
  location: string;
  country: string;
  platform: string;
  description: string;
  skills: string;
  domain: string;
  link: string;
  similarity_score: number;
  recommended_at: string;
  is_viewed: boolean;
  is_saved: boolean;
  duration?: string;
}

export const useOptimisticRecommendations = (
  recommendations: Recommendation[],
  setRecommendations: React.Dispatch<React.SetStateAction<Recommendation[]>>
) => {
  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate[]>([]);

  const applyOptimisticUpdate = useCallback((
    id: number,
    field: 'is_saved' | 'is_viewed',
    newValue: boolean
  ) => {
    const recommendation = recommendations.find(r => r.id === id);
    if (!recommendation) return;

    const originalValue = recommendation[field];
    
    // Add to pending updates
    const update: OptimisticUpdate = {
      id,
      field,
      originalValue,
      newValue,
      timestamp: Date.now(),
    };
    
    setPendingUpdates(prev => [...prev, update]);

    // Apply optimistic update to UI
    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === id ? { ...rec, [field]: newValue } : rec
      )
    );

    return update;
  }, [recommendations, setRecommendations]);

  const confirmOptimisticUpdate = useCallback((updateId: number, field: string) => {
    setPendingUpdates(prev =>
      prev.filter(update => !(update.id === updateId && update.field === field))
    );
  }, []);

  const revertOptimisticUpdate = useCallback((updateId: number, field: 'is_saved' | 'is_viewed') => {
    const update = pendingUpdates.find(u => u.id === updateId && u.field === field);
    if (!update) return;

    // Revert the UI change
    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === updateId ? { ...rec, [field]: update.originalValue } : rec
      )
    );

    // Remove from pending updates
    setPendingUpdates(prev =>
      prev.filter(u => !(u.id === updateId && u.field === field))
    );
  }, [pendingUpdates, setRecommendations]);

  return {
    applyOptimisticUpdate,
    confirmOptimisticUpdate,
    revertOptimisticUpdate,
    pendingUpdates,
  };
};

