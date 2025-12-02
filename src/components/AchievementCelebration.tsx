import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles } from 'lucide-react';

interface AchievementCelebrationProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    badge_type: string;
    points: number;
  } | null;
  onClose: () => void;
}

const AchievementCelebration = ({ achievement, onClose }: AchievementCelebrationProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (achievement) {
      setShow(true);
    }
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-6">
          {/* Celebration Animation */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-20 w-20 text-yellow-500 animate-pulse" />
            </div>
            <div className="relative text-8xl animate-bounce">
              {achievement.icon}
            </div>
          </div>

          {/* Achievement Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-2xl font-bold text-foreground">Achievement Unlocked!</h2>
            </div>
            <h3 className="text-xl font-semibold text-primary">{achievement.name}</h3>
            <p className="text-muted-foreground">{achievement.description}</p>
          </div>

          {/* Points Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-2xl">🏆</span>
            <span className="text-lg font-bold text-primary">+{achievement.points} points</span>
          </div>

          {/* Confetti Effect with CSS */}
          <div className="confetti-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>

          <Button onClick={onClose} size="lg" className="w-full">
            Awesome! 🎉
          </Button>
        </div>

        <style>{`
          .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
          }
          
          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            top: -10px;
            animation: confetti-fall 3s linear forwards;
          }
          
          @keyframes confetti-fall {
            to {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementCelebration;
