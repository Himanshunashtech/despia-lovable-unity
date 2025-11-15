import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Save, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';

const ProfileTab = () => {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    daily_calorie_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 250,
    daily_fat_goal: 65,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          daily_calorie_goal: data.daily_calorie_goal || 2000,
          daily_protein_goal: data.daily_protein_goal || 150,
          daily_carbs_goal: data.daily_carbs_goal || 250,
          daily_fat_goal: data.daily_fat_goal || 65,
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          daily_calorie_goal: profile.daily_calorie_goal,
          daily_protein_goal: profile.daily_protein_goal,
          daily_carbs_goal: profile.daily_carbs_goal,
          daily_fat_goal: profile.daily_fat_goal,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="space-y-4 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <Label htmlFor="theme">Dark Mode</Label>
            </div>
            <Switch
              id="theme"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="calories">Calories (kcal)</Label>
            <Input
              id="calories"
              type="number"
              value={profile.daily_calorie_goal}
              onChange={(e) => setProfile({ ...profile, daily_calorie_goal: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              value={profile.daily_protein_goal}
              onChange={(e) => setProfile({ ...profile, daily_protein_goal: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              value={profile.daily_carbs_goal}
              onChange={(e) => setProfile({ ...profile, daily_carbs_goal: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="fat">Fat (g)</Label>
            <Input
              id="fat"
              type="number"
              value={profile.daily_fat_goal}
              onChange={(e) => setProfile({ ...profile, daily_fat_goal: parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="w-full" size="lg">
        <Save className="mr-2 h-5 w-5" />
        Save Changes
      </Button>

      <Button onClick={handleSignOut} variant="destructive" className="w-full" size="lg">
        <LogOut className="mr-2 h-5 w-5" />
        Sign Out
      </Button>
    </div>
  );
};

export default ProfileTab;
