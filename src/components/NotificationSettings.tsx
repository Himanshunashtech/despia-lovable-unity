import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, Clock, Droplet, Dumbbell, Scale } from 'lucide-react';

const NotificationSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create default settings
        const { data: newSettings, error: insertError } = await supabase
          .from('notification_settings')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast({
        title: 'Saved!',
        description: 'Notification settings updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Meal Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Meal Reminders
          </CardTitle>
          <CardDescription>
            Get notified when it's time to log your meals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Breakfast */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Breakfast</Label>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={settings?.breakfast_time || '08:00'}
                  onChange={(e) => updateSettings({ breakfast_time: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
            <Switch
              checked={settings?.breakfast_reminder}
              onCheckedChange={(checked) => updateSettings({ breakfast_reminder: checked })}
            />
          </div>

          {/* Lunch */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Lunch</Label>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={settings?.lunch_time || '12:00'}
                  onChange={(e) => updateSettings({ lunch_time: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
            <Switch
              checked={settings?.lunch_reminder}
              onCheckedChange={(checked) => updateSettings({ lunch_reminder: checked })}
            />
          </div>

          {/* Dinner */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Dinner</Label>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={settings?.dinner_time || '18:00'}
                  onChange={(e) => updateSettings({ dinner_time: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
            <Switch
              checked={settings?.dinner_reminder}
              onCheckedChange={(checked) => updateSettings({ dinner_reminder: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Water Reminder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            Water Reminder
          </CardTitle>
          <CardDescription>
            Stay hydrated with regular water reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Remind me every</Label>
              <Select
                value={settings?.water_interval_hours?.toString()}
                onValueChange={(value) => updateSettings({ water_interval_hours: parseInt(value) })}
              >
                <SelectTrigger className="w-32 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Switch
              checked={settings?.water_reminder}
              onCheckedChange={(checked) => updateSettings({ water_reminder: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercise Reminder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Exercise Reminder
          </CardTitle>
          <CardDescription>
            Don't forget to log your workouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Daily reminder at</Label>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={settings?.exercise_time || '17:00'}
                  onChange={(e) => updateSettings({ exercise_time: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
            <Switch
              checked={settings?.exercise_reminder}
              onCheckedChange={(checked) => updateSettings({ exercise_reminder: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weight Log Reminder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Log Reminder
          </CardTitle>
          <CardDescription>
            Track your progress regularly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Frequency</Label>
              <Select
                value={settings?.weight_log_frequency}
                onValueChange={(value) => updateSettings({ weight_log_frequency: value })}
              >
                <SelectTrigger className="w-40 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Switch
              checked={settings?.weight_log_reminder}
              onCheckedChange={(checked) => updateSettings({ weight_log_reminder: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
