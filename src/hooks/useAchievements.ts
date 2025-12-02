import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Achievement {
  name: string;
  description: string;
  icon: string;
  badge_type: string;
  points: number;
}

export const useAchievements = () => {
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const { toast } = useToast();

  const checkAndUpdateStats = useCallback(async (logType: 'food' | 'water' | 'exercise') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the database function to update stats and check achievements
      const { error } = await supabase.rpc('update_user_stats_and_check_achievements', {
        p_user_id: user.id,
        p_log_type: logType,
      });

      if (error) {
        console.error('Error updating stats:', error);
        return;
      }

      // Check for newly earned achievements
      const { data: recentAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements (
            name,
            description,
            icon,
            badge_type,
            points
          )
        `)
        .eq('user_id', user.id)
        .gte('earned_at', new Date(Date.now() - 5000).toISOString())
        .order('earned_at', { ascending: false })
        .limit(1);

      if (!achievementsError && recentAchievements && recentAchievements.length > 0) {
        const achievement = recentAchievements[0].achievement as any;
        setNewAchievement(achievement);

        // Show toast notification
        toast({
          title: '🎉 Achievement Unlocked!',
          description: `${achievement.name} - ${achievement.description}`,
        });
      }
    } catch (error) {
      console.error('Error in checkAndUpdateStats:', error);
    }
  }, [toast]);

  const clearAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);

  return {
    newAchievement,
    checkAndUpdateStats,
    clearAchievement,
  };
};
