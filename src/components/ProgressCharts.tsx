import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Target } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

interface WeightData {
  date: string;
  weight: number;
}

interface NutrientData {
  name: string;
  value: number;
}

interface CalorieData {
  date: string;
  consumed: number;
  goal: number;
}

const ProgressCharts = () => {
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [nutrientData, setNutrientData] = useState<NutrientData[]>([]);
  const [calorieData, setCalorieData] = useState<CalorieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch weight trend (last 30 days)
      const { data: weights } = await supabase
        .from('weight_logs')
        .select('weight_kg, logged_at')
        .eq('user_id', session.user.id)
        .gte('logged_at', startOfDay(subDays(new Date(), 30)).toISOString())
        .order('logged_at', { ascending: true });

      if (weights) {
        setWeightData(
          weights.map((w) => ({
            date: format(new Date(w.logged_at), 'MM/dd'),
            weight: Number(w.weight_kg),
          }))
        );
      }

      // Fetch nutrient breakdown (today)
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: summary } = await supabase
        .from('daily_summaries')
        .select('total_protein, total_carbs, total_fat')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single();

      if (summary) {
        setNutrientData([
          { name: 'Protein', value: Number(summary.total_protein) },
          { name: 'Carbs', value: Number(summary.total_carbs) },
          { name: 'Fat', value: Number(summary.total_fat) },
        ]);
      }

      // Fetch calorie trend (last 7 days)
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_calorie_goal')
        .eq('id', session.user.id)
        .single();

      const { data: summaries } = await supabase
        .from('daily_summaries')
        .select('date, total_calories')
        .eq('user_id', session.user.id)
        .gte('date', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (summaries && profile) {
        setCalorieData(
          summaries.map((s) => ({
            date: format(new Date(s.date), 'MM/dd'),
            consumed: Number(s.total_calories),
            goal: Number(profile.daily_calorie_goal),
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading charts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Weight Trend Chart */}
      {weightData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Weight Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Nutrient Breakdown Pie Chart */}
      {nutrientData.length > 0 && nutrientData.some(n => n.value > 0) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Today's Macros</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={nutrientData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}g`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {nutrientData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Calorie Goal Bar Chart */}
      {calorieData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Calorie Progress</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={calorieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="consumed" fill="hsl(var(--primary))" name="Consumed" />
              <Bar dataKey="goal" fill="hsl(var(--secondary))" name="Goal" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

export default ProgressCharts;
