import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Droplet, Wheat, Zap, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import CircularProgress from './CircularProgress';
import WaterLogger from './WaterLogger';
import AISuggestions from './AISuggestions';
import ExerciseLogger from './ExerciseLogger';
import StreakCounter from './StreakCounter';
import AchievementsDisplay from './AchievementsDisplay';
import AchievementCelebration from './AchievementCelebration';
import { useAchievements } from '@/hooks/useAchievements';

interface HomeTabProps {
  onRefresh: () => void;
}

const HomeTab = ({ onRefresh }: HomeTabProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState<'today' | 'yesterday'>('today');
  const [waterTotal, setWaterTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const { newAchievement, checkAndUpdateStats, clearAchievement } = useAchievements();

  useEffect(() => {
    fetchData();
  }, [activeDay]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // Fetch summary for selected day
      const targetDate = activeDay === 'today' 
        ? new Date() 
        : new Date(Date.now() - 86400000);
      const dateStr = targetDate.toISOString().split('T')[0];

      const { data: summaryData } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();
      setDailySummary(summaryData);

      // Fetch logs for the day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: logsData } = await supabase
        .from('food_logs')
        .select('*, food_items(*)')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      setTodayLogs(logsData || []);

      // Fetch water logs for today
      const { data: waterData } = await supabase
        .from('water_logs')
        .select('amount_ml')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString());

      const totalWater = waterData?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
      setWaterTotal(totalWater);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const caloriesLeft = (profile?.daily_calorie_goal || 2000) - (dailySummary?.total_calories || 0);
  const proteinDiff = (dailySummary?.total_protein || 0) - (profile?.daily_protein_goal || 150);
  const carbsLeft = (profile?.daily_carbs_goal || 250) - (dailySummary?.total_carbs || 0);
  const fatLeft = (profile?.daily_fat_goal || 65) - (dailySummary?.total_fat || 0);

  const calorieProgress = ((dailySummary?.total_calories || 0) / (profile?.daily_calorie_goal || 2000)) * 100;
  const proteinProgress = ((dailySummary?.total_protein || 0) / (profile?.daily_protein_goal || 150)) * 100;
  const carbsProgress = ((dailySummary?.total_carbs || 0) / (profile?.daily_carbs_goal || 250)) * 100;
  const fatProgress = ((dailySummary?.total_fat || 0) / (profile?.daily_fat_goal || 65)) * 100;

  const handleWaterUpdate = async () => {
    await checkAndUpdateStats('water');
    await fetchData();
  };

  const handleExerciseSuccess = async () => {
    await checkAndUpdateStats('exercise');
    await fetchData();
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header with Achievements Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Ella AI</h1>
        <Button
          onClick={() => setShowAchievements(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Trophy className="h-4 w-4 text-yellow-500" />
          Achievements
        </Button>
      </div>

      {/* Streak Counter */}
      <StreakCounter />

      {/* Day Selector */}
      <div className="flex gap-4">
        <Button
          variant={activeDay === 'today' ? 'default' : 'ghost'}
          onClick={() => setActiveDay('today')}
          className="text-lg"
        >
          Today
        </Button>
        <Button
          variant={activeDay === 'yesterday' ? 'default' : 'ghost'}
          onClick={() => setActiveDay('yesterday')}
          className="text-lg"
        >
          Yesterday
        </Button>
      </div>

      {/* Main Calorie Card - Dark Modern Design */}
      <Card className="p-6 bg-[#2a2a3a] border-[#3a3a4a]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-6xl font-bold mb-2 text-white">
              {Math.round(Math.max(0, caloriesLeft))}
            </div>
            <p className="text-gray-400 text-lg">
              Calories left
            </p>
          </div>
          <CircularProgress
            value={Math.min(100, calorieProgress)}
            size={140}
            strokeWidth={14}
            color="rgb(255, 255, 255)"
            icon={<Flame className="h-10 w-10 text-white" />}
          />
        </div>
      </Card>

      {/* Macro Cards - Dark Modern Design */}
      <div className="grid grid-cols-3 gap-3">
        {/* Protein */}
        <Card className="p-4 bg-[#2a2a3a] border-[#3a3a4a]">
          <div className="text-2xl font-bold mb-1 text-white">
            {Math.abs(Math.round(proteinDiff))}g
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Protein {proteinDiff >= 0 ? 'over' : 'left'}
          </p>
          <CircularProgress
            value={Math.min(100, proteinProgress)}
            size={64}
            strokeWidth={7}
            color="rgb(239, 68, 68)"
            icon={<Zap className="h-4 w-4 text-red-500" />}
          />
        </Card>

        {/* Carbs */}
        <Card className="p-4 bg-[#2a2a3a] border-[#3a3a4a]">
          <div className="text-2xl font-bold mb-1 text-white">
            {Math.abs(Math.round(carbsLeft))}g
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Carbs {carbsLeft >= 0 ? 'left' : 'over'}
          </p>
          <CircularProgress
            value={Math.min(100, carbsProgress)}
            size={64}
            strokeWidth={7}
            color="rgb(251, 146, 60)"
            icon={<Wheat className="h-4 w-4 text-orange-400" />}
          />
        </Card>

        {/* Fat */}
        <Card className="p-4 bg-[#2a2a3a] border-[#3a3a4a]">
          <div className="text-2xl font-bold mb-1 text-white">
            {Math.abs(Math.round(fatLeft))}g
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Fats {fatLeft >= 0 ? 'left' : 'over'}
          </p>
          <CircularProgress
            value={Math.min(100, fatProgress)}
            size={64}
            strokeWidth={7}
            color="rgb(96, 165, 250)"
            icon={<Droplet className="h-4 w-4 text-blue-400" />}
          />
        </Card>
      </div>

      {/* Water Logger */}
      <div className="grid gap-4 md:grid-cols-2">
        <WaterLogger
          todayTotal={waterTotal}
          goal={profile?.daily_water_goal_ml || 2000}
          onUpdate={handleWaterUpdate}
        />
        
        <ExerciseLogger onSuccess={handleExerciseSuccess} />
      </div>

      {/* AI Suggestions */}
      <AISuggestions />

      {/* Recently Uploaded */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Recently uploaded</h3>
        <div className="space-y-3">
          {todayLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No meals logged {activeDay === 'today' ? 'today' : 'yesterday'}
            </p>
          ) : (
            todayLogs.map((log) => {
              const foodItems = Array.isArray(log.food_items) ? log.food_items : [];
              const itemNames = foodItems.map((item: any) => item.food_name).join(', ');

              return (
                <Card key={log.id} className="p-4 bg-[#2a2a3a] border-[#3a3a4a]">
                  <div className="flex gap-4">
                    {log.image_url && (
                      <img
                        src={log.image_url}
                        alt="Food"
                        className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold truncate text-white">
                          {itemNames || 'Food Log'}
                        </h4>
                        <span className="text-sm text-gray-400 whitespace-nowrap ml-2">
                          {format(new Date(log.created_at), 'h:mmaaa')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Flame className="h-4 w-4 text-white" />
                        <span className="font-medium text-white">{Math.round(Number(log.total_calories))} kcal</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-red-500" />
                          <span className="text-gray-300">{Math.round(Number(log.total_protein))}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wheat className="h-4 w-4 text-orange-400" />
                          <span className="text-gray-300">{Math.round(Number(log.total_carbs))}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplet className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-300">{Math.round(Number(log.total_fat))}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Achievements Display */}
      <AchievementsDisplay
        open={showAchievements}
        onClose={() => setShowAchievements(false)}
      />

      {/* Achievement Celebration */}
      <AchievementCelebration
        achievement={newAchievement}
        onClose={clearAchievement}
      />
    </div>
  );
};

export default HomeTab;
