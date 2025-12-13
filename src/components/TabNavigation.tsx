import { Home, ChefHat, BarChart3, Settings, Plus, Flame, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ellaLogo from '@/assets/ella-logo.png';
import NotificationCenter from '@/components/NotificationCenter';

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
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
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

      // Get streak from user_stats table
      const { data: stats } = await supabase
        .from('user_stats')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      if (stats) {
        setCurrentStreak(stats.current_streak || 0);
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
            <img src={ellaLogo} alt="Ella AI" className="w-10 h-10 rounded-full object-contain" />
            <h1 className="text-xl font-bold text-white">Ella AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="flex items-center gap-1 bg-[#2a2a3a] px-3 py-1.5 rounded-full">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-white">{currentStreak}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Dark Modern Design */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e] border-t border-[#2a2a3a]">
        <div className="max-w-2xl mx-auto px-2 h-20 flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors px-3 py-2",
                  isActive ? 'text-white' : 'text-gray-500'
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && 'scale-110')} />
                <span className="text-[10px] font-medium">{tab.label}</span>
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
