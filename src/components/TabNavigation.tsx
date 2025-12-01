import { Home, ChefHat, BarChart3, Settings, Plus, Bell, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddFood: () => void;
  streak?: number;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'recipes', label: 'Recipes', icon: ChefHat },
  { id: 'history', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Settings', icon: Settings },
];

const TabNavigation = ({ activeTab, onTabChange, onAddFood, streak = 0 }: TabNavigationProps) => {
  const [currentStreak, setCurrentStreak] = useState(streak);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate streak from food logs
      const { data: logs } = await supabase
        .from('food_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (logs) {
        let streak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        const logDates = new Set(logs.map(log => new Date(log.created_at).toDateString()));
        
        if (logDates.has(today) || logDates.has(yesterday)) {
          streak = 1;
          let checkDate = new Date(logDates.has(today) ? Date.now() - 86400000 : Date.now() - 86400000 * 2);
          
          while (logDates.has(checkDate.toDateString())) {
            streak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
          }
        }
        
        setCurrentStreak(streak);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  return (
    <>
      {/* Header - Ella AI Dark Design */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e] border-b border-[#2a2a3a]">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-2xl">🍎</span>
            </div>
            <h1 className="text-xl font-bold text-white">Ella AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1 bg-[#2a2a3a] px-3 py-1.5 rounded-full">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-white">{currentStreak}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Dark Modern Design */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e] border-t border-[#2a2a3a]">
        <div className="max-w-2xl mx-auto px-4 h-20 flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors",
                  isActive ? 'text-white' : 'text-gray-500'
                )}
              >
                <Icon className={cn("h-6 w-6", isActive && 'scale-110')} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button - Large White Circle */}
      <button
        onClick={onAddFood}
        className="fixed bottom-28 right-6 z-50 w-16 h-16 rounded-full bg-white text-black shadow-2xl hover:shadow-3xl transition-all hover:scale-105 flex items-center justify-center"
      >
        <Plus className="h-8 w-8 stroke-[3]" />
      </button>
    </>
  );
};

export default TabNavigation;
