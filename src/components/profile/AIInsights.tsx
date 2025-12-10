import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, AlertTriangle, TrendingUp, Utensils, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface Insight {
  type: 'recommendation' | 'warning' | 'achievement' | 'tip';
  title: string;
  description: string;
}

const AIInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [nutritionScore, setNutritionScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    avgCalories: 0,
    avgProtein: 0,
    daysLogged: 0,
    calorieGoal: 2000,
  });

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get weekly data
      const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { data: summaries } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekAgo);

      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_calorie_goal, daily_protein_goal')
        .eq('id', user.id)
        .single();

      if (summaries && profile) {
        const avgCalories = summaries.length > 0 
          ? summaries.reduce((sum, s) => sum + (Number(s.total_calories) || 0), 0) / summaries.length 
          : 0;
        const avgProtein = summaries.length > 0 
          ? summaries.reduce((sum, s) => sum + (Number(s.total_protein) || 0), 0) / summaries.length 
          : 0;

        setWeeklyStats({
          avgCalories: Math.round(avgCalories),
          avgProtein: Math.round(avgProtein),
          daysLogged: summaries.length,
          calorieGoal: profile.daily_calorie_goal || 2000,
        });

        // Calculate nutrition score (0-100)
        const calorieAccuracy = Math.max(0, 100 - Math.abs(avgCalories - (profile.daily_calorie_goal || 2000)) / 20);
        const proteinScore = Math.min(100, (avgProtein / (profile.daily_protein_goal || 150)) * 100);
        const consistencyScore = (summaries.length / 7) * 100;
        const score = Math.round((calorieAccuracy + proteinScore + consistencyScore) / 3);
        setNutritionScore(Math.min(100, Math.max(0, score)));

        // Generate insights
        const generatedInsights: Insight[] = [];

        if (avgProtein < (profile.daily_protein_goal || 150) * 0.8) {
          generatedInsights.push({
            type: 'warning',
            title: 'Low Protein Intake',
            description: `You're averaging ${Math.round(avgProtein)}g protein daily. Try adding more lean meats, eggs, or legumes.`,
          });
        }

        if (summaries.length < 5) {
          generatedInsights.push({
            type: 'tip',
            title: 'Log More Consistently',
            description: `You logged ${summaries.length}/7 days this week. Consistent tracking helps achieve your goals faster!`,
          });
        }

        if (avgCalories > (profile.daily_calorie_goal || 2000) * 1.1) {
          generatedInsights.push({
            type: 'warning',
            title: 'Calorie Surplus Detected',
            description: `You're averaging ${Math.round(avgCalories)} kcal/day, which is above your goal. Consider portion control.`,
          });
        } else if (avgCalories < (profile.daily_calorie_goal || 2000) * 0.7 && avgCalories > 0) {
          generatedInsights.push({
            type: 'warning',
            title: 'Calorie Deficit Too Large',
            description: `Averaging only ${Math.round(avgCalories)} kcal/day may slow your metabolism. Eat enough to fuel your body!`,
          });
        }

        generatedInsights.push({
          type: 'recommendation',
          title: 'Try This Today',
          description: 'Add a serving of leafy greens to your next meal for extra fiber and micronutrients.',
        });

        setInsights(generatedInsights);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Utensils className="h-4 w-4 text-blue-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'achievement': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'tip': return <Sparkles className="h-4 w-4 text-purple-400" />;
      default: return <Brain className="h-4 w-4 text-white" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-[#2a2a3a] border-[#3a3a4a]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Insights
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchInsights} disabled={loading}>
          <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nutrition Score */}
        <div className="bg-[#1a1a2e] rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">Weekly Nutrition Score</p>
          <p className={`text-4xl font-bold ${getScoreColor(nutritionScore)}`}>{nutritionScore}</p>
          <p className="text-xs text-gray-500 mt-1">out of 100</p>
        </div>

        {/* Weekly Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <p className="text-lg font-bold text-white">{weeklyStats.avgCalories}</p>
            <p className="text-xs text-gray-400">Avg kcal/day</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <p className="text-lg font-bold text-white">{weeklyStats.avgProtein}g</p>
            <p className="text-xs text-gray-400">Avg protein</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <p className="text-lg font-bold text-white">{weeklyStats.daysLogged}/7</p>
            <p className="text-xs text-gray-400">Days logged</p>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex gap-3 p-3 bg-[#1a1a2e] rounded-lg"
            >
              <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
              <div>
                <p className="text-sm font-medium text-white">{insight.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>

        {insights.length === 0 && !loading && (
          <p className="text-center text-gray-400 text-sm py-4">
            Start logging meals to get personalized insights!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsights;
