import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Loader2, Lock } from 'lucide-react';

interface AchievementsDisplayProps {
  open?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_type: string;
  criteria_type: string;
  criteria_value: number;
  points: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
}

const AchievementsDisplay = ({ open, onClose, compact = false }: AchievementsDisplayProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open || compact) {
      loadData();
    }
  }, [open, compact]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('points');

      if (achievementsError) throw achievementsError;

      // Load user's earned achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (userAchievementsError) throw userAchievementsError;

      // Load user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statsError) throw statsError;

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
      setStats(statsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load achievements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isEarned = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement: Achievement) => {
    if (!stats) return 0;

    switch (achievement.criteria_type) {
      case 'streak':
        return Math.min((stats.current_streak / achievement.criteria_value) * 100, 100);
      case 'total_logs':
        const total = stats.total_food_logs + stats.total_water_logs + stats.total_exercise_logs;
        return Math.min((total / achievement.criteria_value) * 100, 100);
      case 'water_goal':
        return Math.min((stats.total_water_logs / achievement.criteria_value) * 100, 100);
      case 'exercise_count':
        return Math.min((stats.total_exercise_logs / achievement.criteria_value) * 100, 100);
      default:
        return 0;
    }
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'bronze':
        return 'bg-amber-700 text-white';
      case 'silver':
        return 'bg-gray-400 text-gray-900';
      case 'gold':
        return 'bg-yellow-500 text-gray-900';
      case 'platinum':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.criteria_type]) {
      acc[achievement.criteria_type] = [];
    }
    acc[achievement.criteria_type].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const getCategoryTitle = (type: string) => {
    switch (type) {
      case 'streak':
        return '🔥 Streak Achievements';
      case 'total_logs':
        return '📊 Logging Achievements';
      case 'water_goal':
        return '💧 Hydration Achievements';
      case 'exercise_count':
        return '💪 Exercise Achievements';
      default:
        return 'Achievements';
    }
  };

  // Compact inline view for Profile tab
  if (compact) {
    const earnedAchievements = achievements.filter(a => isEarned(a.id));
    const recentAchievements = earnedAchievements.slice(0, 4);

    return (
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {earnedAchievements.length} / {achievements.length} unlocked
              </span>
              {stats && (
                <span className="text-sm font-medium text-primary">
                  {stats.total_points || 0} pts
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {recentAchievements.length > 0 ? (
                recentAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex flex-col items-center p-2 rounded-lg bg-primary/10 border border-primary/20"
                    title={achievement.name}
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                    <Badge className={`${getBadgeColor(achievement.badge_type)} text-xs mt-1`}>
                      {achievement.badge_type}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center text-sm text-muted-foreground py-4">
                  No achievements yet. Keep logging!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full dialog view
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </DialogTitle>
          {stats && (
            <div className="text-sm text-muted-foreground mt-2">
              Total Points: <span className="font-bold text-primary">{stats.total_points}</span>
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAchievements).map(([type, categoryAchievements]) => (
              <div key={type} className="space-y-3">
                <h3 className="font-semibold text-lg">{getCategoryTitle(type)}</h3>
                <div className="grid gap-3">
                  {categoryAchievements.map((achievement) => {
                    const earned = isEarned(achievement.id);
                    const progress = getProgress(achievement);

                    return (
                      <div
                        key={achievement.id}
                        className={`border rounded-lg p-4 transition-all ${
                          earned
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{earned ? achievement.icon : '🔒'}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold">{achievement.name}</h4>
                              <Badge className={getBadgeColor(achievement.badge_type)}>
                                {achievement.badge_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-primary font-medium">
                                +{achievement.points} points
                              </div>
                              {earned ? (
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  ✓ Earned
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1">
                                    <Progress value={progress} className="h-2" />
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {Math.round(progress)}%
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AchievementsDisplay;
