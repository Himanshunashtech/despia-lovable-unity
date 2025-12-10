import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scale, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface WeightEntry {
  date: string;
  weight: number;
}

const WeightTracker = () => {
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWeightData();
  }, []);

  const fetchWeightData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('weight_logs')
        .select('weight_kg, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', subDays(new Date(), 30).toISOString())
        .order('logged_at', { ascending: true });

      if (data) {
        setWeightData(data.map(w => ({
          date: format(new Date(w.logged_at!), 'MM/dd'),
          weight: Number(w.weight_kg),
        })));
      }
    } catch (error) {
      console.error('Error fetching weight data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWeight = async () => {
    if (!newWeight) return;
    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('weight_logs').insert({
        user_id: user.id,
        weight_kg: Number(newWeight),
        logged_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update profile current weight
      await supabase
        .from('profiles')
        .update({ current_weight_kg: Number(newWeight) })
        .eq('id', user.id);

      toast({ title: 'Weight logged!' });
      setNewWeight('');
      fetchWeightData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const getWeightChange = () => {
    if (weightData.length < 2) return { change: 0, trend: 'neutral' };
    const first = weightData[0].weight;
    const last = weightData[weightData.length - 1].weight;
    const change = last - first;
    return {
      change: Math.abs(change).toFixed(1),
      trend: change < 0 ? 'down' : change > 0 ? 'up' : 'neutral',
    };
  };

  const weightChange = getWeightChange();

  return (
    <Card className="bg-[#2a2a3a] border-[#3a3a4a]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Scale className="h-5 w-5 text-blue-500" />
          Weight Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Weight */}
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.1"
            placeholder="Enter weight (kg)"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="bg-[#1a1a2e] border-[#3a3a4a] text-white flex-1"
          />
          <Button onClick={addWeight} disabled={adding || !newWeight} className="bg-white text-black hover:bg-gray-200">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Weight Change Summary */}
        {weightData.length >= 2 && (
          <div className="flex items-center justify-center gap-2 bg-[#1a1a2e] p-3 rounded-lg">
            {weightChange.trend === 'down' ? (
              <TrendingDown className="h-5 w-5 text-green-400" />
            ) : weightChange.trend === 'up' ? (
              <TrendingUp className="h-5 w-5 text-orange-400" />
            ) : (
              <Minus className="h-5 w-5 text-gray-400" />
            )}
            <span className={`font-medium ${
              weightChange.trend === 'down' ? 'text-green-400' : 
              weightChange.trend === 'up' ? 'text-orange-400' : 'text-gray-400'
            }`}>
              {weightChange.trend === 'down' ? '-' : weightChange.trend === 'up' ? '+' : ''}
              {weightChange.change} kg in 30 days
            </span>
          </div>
        )}

        {/* Chart */}
        {weightData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #3a3a4a',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">
            No weight data yet. Start logging!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WeightTracker;
