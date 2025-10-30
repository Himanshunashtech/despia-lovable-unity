import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LogOut, Camera, Plus, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FoodScanner from '@/components/FoodScanner';
import FoodLogList from '@/components/FoodLogList';
import VoiceInput from '@/components/VoiceInput';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // Fetch today's summary
    const today = new Date().toISOString().split('T')[0];
    const { data: summaryData } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();
    setTodaySummary(summaryData);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const calorieProgress = todaySummary && profile
    ? (Number(todaySummary.total_calories) / profile.daily_calorie_goal) * 100
    : 0;

  const proteinProgress = todaySummary && profile
    ? (Number(todaySummary.total_protein) / profile.daily_protein_goal) * 100
    : 0;

  const carbsProgress = todaySummary && profile
    ? (Number(todaySummary.total_carbs) / profile.daily_carbs_goal) * 100
    : 0;

  const fatProgress = todaySummary && profile
    ? (Number(todaySummary.total_fat) / profile.daily_fat_goal) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">CaloriAI</h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Daily Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaySummary ? Math.round(Number(todaySummary.total_calories)) : 0}
                <span className="text-sm text-muted-foreground ml-1">
                  / {profile?.daily_calorie_goal || 2000}
                </span>
              </div>
              <Progress value={calorieProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Protein</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaySummary ? Math.round(Number(todaySummary.total_protein)) : 0}g
                <span className="text-sm text-muted-foreground ml-1">
                  / {profile?.daily_protein_goal || 150}g
                </span>
              </div>
              <Progress value={proteinProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Carbs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaySummary ? Math.round(Number(todaySummary.total_carbs)) : 0}g
                <span className="text-sm text-muted-foreground ml-1">
                  / {profile?.daily_carbs_goal || 250}g
                </span>
              </div>
              <Progress value={carbsProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaySummary ? Math.round(Number(todaySummary.total_fat)) : 0}g
                <span className="text-sm text-muted-foreground ml-1">
                  / {profile?.daily_fat_goal || 65}g
                </span>
              </div>
              <Progress value={fatProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => setShowScanner(true)}
            className="flex-1"
            size="lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            Scan Food
          </Button>
          <Button
            onClick={() => setShowVoiceInput(true)}
            variant="secondary"
            className="flex-1"
            size="lg"
          >
            <Mic className="mr-2 h-5 w-5" />
            Voice Input
          </Button>
        </div>

        {/* Food Log */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <FoodLogList onUpdate={fetchData} />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showScanner && (
        <FoodScanner
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            setShowScanner(false);
            fetchData();
          }}
        />
      )}

      {showVoiceInput && (
        <VoiceInput
          onClose={() => setShowVoiceInput(false)}
          onSuccess={() => {
            setShowVoiceInput(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;