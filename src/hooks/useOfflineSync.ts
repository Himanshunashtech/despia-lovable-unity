import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QueuedAction {
  id: string;
  type: 'food_log' | 'water_log' | 'exercise_log' | 'weight_log';
  data: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'ella_offline_queue';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load queued actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (stored) {
      setPendingActions(JSON.parse(stored));
    }
  }, []);

  // Save queued actions to localStorage
  useEffect(() => {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: 'Back online', description: 'Syncing your data...' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({ 
        title: 'You\'re offline', 
        description: 'Your changes will be saved and synced when you reconnect.',
        variant: 'destructive' 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline]);

  const queueAction = useCallback((type: QueuedAction['type'], data: any) => {
    const action: QueuedAction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
    };
    setPendingActions(prev => [...prev, action]);
    return action.id;
  }, []);

  const syncPendingActions = async () => {
    if (isSyncing || pendingActions.length === 0) return;

    setIsSyncing(true);
    const { supabase } = await import('@/integrations/supabase/client');
    
    const failedActions: QueuedAction[] = [];

    for (const action of pendingActions) {
      try {
        switch (action.type) {
          case 'food_log':
            await supabase.from('food_logs').insert(action.data);
            break;
          case 'water_log':
            await supabase.from('water_logs').insert(action.data);
            break;
          case 'exercise_log':
            await supabase.from('exercise_logs').insert(action.data);
            break;
          case 'weight_log':
            await supabase.from('weight_logs').insert(action.data);
            break;
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
        failedActions.push(action);
      }
    }

    setPendingActions(failedActions);
    setIsSyncing(false);

    if (failedActions.length === 0) {
      toast({ title: 'All data synced successfully!' });
    } else {
      toast({ 
        title: 'Some data failed to sync', 
        description: `${failedActions.length} items will retry later.`,
        variant: 'destructive' 
      });
    }
  };

  const removeAction = useCallback((id: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    isOnline,
    pendingActions,
    isSyncing,
    queueAction,
    syncPendingActions,
    removeAction,
    hasPendingActions: pendingActions.length > 0,
  };
};
