import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { Calendar } from 'lucide-react';

const HistoryTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('food_logs')
        .select('*, food_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground pb-20">
        Loading history...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 pb-20">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          No food logs yet. Start tracking your meals!
        </p>
      </div>
    );
  }

  const groupedLogs = logs.reduce((acc, log) => {
    const date = format(new Date(log.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 pb-20">
      {Object.entries(groupedLogs).map(([date, dateLogs]) => (
        <div key={date}>
          <h3 className="text-lg font-semibold mb-3 sticky top-0 bg-background py-2">
            {format(new Date(date), 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-3">
            {dateLogs.map((log) => {
              const foodItems = Array.isArray(log.food_items) ? log.food_items : [];
              
              return (
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
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1 mb-2">
                    {foodItems.map((item: any) => (
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
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryTab;
