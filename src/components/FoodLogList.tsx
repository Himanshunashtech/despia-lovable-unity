import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface FoodLogListProps {
  onUpdate: () => void;
}

const FoodLogList = ({ onUpdate }: FoodLogListProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    
    // Subscribe to changes
    const channel = supabase
      .channel('food_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_logs'
        },
        () => {
          fetchLogs();
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('food_logs')
        .select('*, food_items(*)')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No meals logged today. Start by scanning your food!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <Card key={log.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Badge variant="secondary" className="mb-2">
                {log.meal_type}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </p>
            </div>
            {log.image_url && (
              <img
                src={log.image_url}
                alt="Food"
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
          </div>
          
          <div className="space-y-1 mb-2">
            {Array.isArray(log.food_items) && log.food_items.map((item: any) => (
              <div key={item.id} className="text-sm">
                <strong>{item.food_name}</strong> ({item.quantity})
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{Math.round(Number(log.total_calories))} cal</span>
            <span>{Math.round(Number(log.total_protein))}g protein</span>
            <span>{Math.round(Number(log.total_carbs))}g carbs</span>
            <span>{Math.round(Number(log.total_fat))}g fat</span>
          </div>
          
          {log.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{log.notes}</p>
          )}
        </Card>
      ))}
    </div>
  );
};

export default FoodLogList;