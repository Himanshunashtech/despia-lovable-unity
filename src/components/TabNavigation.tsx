import { useState } from 'react';
import { Apple, Camera, BarChart3, Settings, Plus, Flame, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddFood: () => void;
  streak?: number;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Apple },
  { id: 'history', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Settings', icon: Settings },
];

const TabNavigation = ({ activeTab, onTabChange, onAddFood, streak = 15 }: TabNavigationProps) => {
  return (
    <>
      {/* Header with streak */}
      <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Apple className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Cal AI</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="rounded-full">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <div className="bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-bold">{streak}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-4 relative">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-6 w-6")} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
          
          {/* Floating Action Button */}
          <Button
            onClick={onAddFood}
            size="icon"
            className="absolute -top-6 right-4 h-14 w-14 rounded-full shadow-lg bg-white text-black hover:bg-white/90"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </div>
      </nav>
    </>
  );
};

export default TabNavigation;
