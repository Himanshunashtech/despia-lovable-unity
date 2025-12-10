import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Edit2, Trophy, Flame, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  profile: {
    full_name: string;
    email: string;
    current_weight_kg?: number;
    height_cm?: number;
    activity_level?: string;
  };
  stats: {
    current_streak: number;
    total_points: number;
    total_food_logs: number;
  };
  onEditAvatar?: () => void;
}

const ProfileHeader = ({ profile, stats, onEditAvatar }: ProfileHeaderProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevel = (points: number) => {
    if (points >= 1000) return { level: 'Gold', color: 'bg-yellow-500' };
    if (points >= 500) return { level: 'Silver', color: 'bg-gray-400' };
    if (points >= 100) return { level: 'Bronze', color: 'bg-amber-700' };
    return { level: 'Starter', color: 'bg-green-500' };
  };

  const levelInfo = getLevel(stats.total_points);

  return (
    <Card className="p-6 bg-gradient-to-br from-[#2a2a3a] to-[#1a1a2e] border-[#3a3a4a]">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-white/20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-white/10 text-white text-xl">
              {getInitials(profile.full_name || 'User')}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white text-black hover:bg-gray-200"
            onClick={onEditAvatar}
          >
            <Camera className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">{profile.full_name || 'User'}</h2>
            <Badge className={`${levelInfo.color} text-white text-xs`}>
              {levelInfo.level}
            </Badge>
          </div>
          <p className="text-sm text-gray-400 mb-3">{profile.email}</p>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-white font-medium">{stats.current_streak} day streak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-white font-medium">{stats.total_points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Stats */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{profile.current_weight_kg || '--'}</p>
          <p className="text-xs text-gray-400">kg</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{profile.height_cm || '--'}</p>
          <p className="text-xs text-gray-400">cm</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white capitalize">{profile.activity_level || '--'}</p>
          <p className="text-xs text-gray-400">activity</p>
        </div>
      </div>
    </Card>
  );
};

export default ProfileHeader;
