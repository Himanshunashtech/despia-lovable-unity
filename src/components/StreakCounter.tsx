import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';

const StreakCounter = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-full">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold text-foreground">{stats.current_streak} days</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Best</span>
          </div>
          <p className="text-lg font-semibold text-foreground">{stats.longest_streak} days</p>
        </div>
      </div>
      
      {stats.current_streak > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Keep it up! Log today to continue your streak 🔥
          </p>
        </div>
      )}
    </Card>
  );
};

export default StreakCounter;
