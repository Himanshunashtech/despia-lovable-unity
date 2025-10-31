import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FoodLogList from '@/components/FoodLogList';
import TabNavigation from '@/components/TabNavigation';
import ProfileTab from '@/components/ProfileTab';
import HistoryTab from '@/components/HistoryTab';
import ScanTab from '@/components/ScanTab';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchDailySummary();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    }
  };

  const fetchDailySummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      setDailySummary(data);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 pb-20">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(Number(dailySummary?.total_calories || 0))}
                        </p>
                        <p className="text-sm text-muted-foreground">Calories</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(Number(dailySummary?.total_protein || 0))}g
                        </p>
                        <p className="text-sm text-muted-foreground">Protein</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(Number(dailySummary?.total_carbs || 0))}g
                        </p>
                        <p className="text-sm text-muted-foreground">Carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(Number(dailySummary?.total_fat || 0))}g
                        </p>
                        <p className="text-sm text-muted-foreground">Fat</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Today's Meals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FoodLogList onUpdate={fetchDailySummary} />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );
      case 'scan':
        return <ScanTab onSuccess={fetchDailySummary} />;
      case 'history':
        return <HistoryTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 py-3 safe-area-top">
        <h1 className="text-2xl font-bold text-center">Food Tracker</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {renderContent()}
      </main>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Dashboard;