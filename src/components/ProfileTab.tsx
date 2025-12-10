import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, User, Target, Brain, Scale, Activity, Trophy, Edit2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import HealthGoals from '@/components/profile/HealthGoals';
import AIInsights from '@/components/profile/AIInsights';
import WeightTracker from '@/components/profile/WeightTracker';
import AchievementsDisplay from '@/components/AchievementsDisplay';

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Light (1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (intense daily)' },
];

const ProfileTab = () => {
  const [profile, setProfile] = useState<any>({
    id: '',
    full_name: '',
    email: '',
    current_weight_kg: 0,
    height_cm: 0,
    activity_level: 'moderate',
    weight_goal_kg: 0,
    goal_type: 'maintain',
    dietary_preference: 'none',
    daily_calorie_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 250,
    daily_fat_goal: 65,
  });
  const [stats, setStats] = useState({
    current_streak: 0,
    total_points: 0,
    total_food_logs: 0,
    longest_streak: 0,
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
    loadStats();
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
          id: data.id,
          full_name: data.full_name || '',
          email: data.email || '',
          current_weight_kg: data.current_weight_kg || 0,
          height_cm: data.height_cm || 0,
          activity_level: data.activity_level || 'moderate',
          weight_goal_kg: data.weight_goal_kg || 0,
          goal_type: data.goal_type || 'maintain',
          dietary_preference: data.dietary_preference || 'none',
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

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStats({
          current_streak: data.current_streak || 0,
          total_points: data.total_points || 0,
          total_food_logs: data.total_food_logs || 0,
          longest_streak: data.longest_streak || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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
          current_weight_kg: profile.current_weight_kg,
          height_cm: profile.height_cm,
          activity_level: profile.activity_level,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Profile updated!' });
      setEditing(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <ProfileHeader profile={profile} stats={stats} />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#2a2a3a] p-1">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white data-[state=active]:text-black">
            <User className="h-3.5 w-3.5 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="goals" className="text-xs data-[state=active]:bg-white data-[state=active]:text-black">
            <Target className="h-3.5 w-3.5 mr-1" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="progress" className="text-xs data-[state=active]:bg-white data-[state=active]:text-black">
            <Scale className="h-3.5 w-3.5 mr-1" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs data-[state=active]:bg-white data-[state=active]:text-black">
            <Brain className="h-3.5 w-3.5 mr-1" />
            AI
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="bg-[#2a2a3a] border-[#3a3a4a]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Basic Information
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(!editing)}
                className="text-gray-400 hover:text-white"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300">Full Name</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  disabled={!editing}
                  className="bg-[#1a1a2e] border-[#3a3a4a] text-white disabled:opacity-70"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Height (cm)</Label>
                  <Input
                    type="number"
                    value={profile.height_cm}
                    onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
                    disabled={!editing}
                    className="bg-[#1a1a2e] border-[#3a3a4a] text-white disabled:opacity-70"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Weight (kg)</Label>
                  <Input
                    type="number"
                    value={profile.current_weight_kg}
                    onChange={(e) => setProfile({ ...profile, current_weight_kg: Number(e.target.value) })}
                    disabled={!editing}
                    className="bg-[#1a1a2e] border-[#3a3a4a] text-white disabled:opacity-70"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Activity Level</Label>
                <Select
                  value={profile.activity_level}
                  onValueChange={(value) => setProfile({ ...profile, activity_level: value })}
                  disabled={!editing}
                >
                  <SelectTrigger className="bg-[#1a1a2e] border-[#3a3a4a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a3a] border-[#3a3a4a]">
                    {activityLevels.map(level => (
                      <SelectItem key={level.value} value={level.value} className="text-white">
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editing && (
                <Button onClick={handleSave} disabled={loading} className="w-full bg-white text-black hover:bg-gray-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Achievements Summary */}
          <Card className="bg-[#2a2a3a] border-[#3a3a4a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="bg-[#1a1a2e] rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{stats.current_streak}</p>
                  <p className="text-xs text-gray-400">Current Streak</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{stats.longest_streak}</p>
                  <p className="text-xs text-gray-400">Best Streak</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{stats.total_food_logs}</p>
                  <p className="text-xs text-gray-400">Meals Logged</p>
                </div>
              </div>
              <AchievementsDisplay compact />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-4">
          <HealthGoals profile={profile} onUpdate={loadProfile} />
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-4">
          <WeightTracker />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="mt-4">
          <AIInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTab;
