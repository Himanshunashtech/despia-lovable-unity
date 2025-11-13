import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Plus } from 'lucide-react';
import CircularProgress from './CircularProgress';

interface WaterLoggerProps {
  todayTotal: number;
  goal: number;
  onUpdate: () => void;
}

const WaterLogger = ({ todayTotal, goal, onUpdate }: WaterLoggerProps) => {
  const [logging, setLogging] = useState(false);
  const { toast } = useToast();

  const logWater = async (amount: number) => {
    setLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('water_logs')
        .insert({
          user_id: user.id,
          amount_ml: amount,
        });

      if (error) throw error;

      toast({
        title: 'Water Logged!',
        description: `Added ${amount}ml to your daily intake`,
      });

      onUpdate();
    } catch (error) {
      console.error('Water logging error:', error);
      toast({
        title: 'Error',
        description: 'Failed to log water',
        variant: 'destructive',
      });
    } finally {
      setLogging(false);
    }
  };

  const progress = (todayTotal / goal) * 100;

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">Water Intake</h3>
          <p className="text-sm text-muted-foreground">
            {todayTotal}ml / {goal}ml
          </p>
        </div>
        <CircularProgress
          value={Math.min(100, progress)}
          size={64}
          strokeWidth={6}
          color="rgb(96, 165, 250)"
          icon={<Droplets className="h-4 w-4 text-blue-400" />}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => logWater(250)}
          disabled={logging}
          size="sm"
          variant="outline"
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          250ml
        </Button>
        <Button
          onClick={() => logWater(500)}
          disabled={logging}
          size="sm"
          variant="outline"
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          500ml
        </Button>
      </div>
    </Card>
  );
};

export default WaterLogger;