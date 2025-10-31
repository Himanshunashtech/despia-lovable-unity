import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Mic } from 'lucide-react';
import FoodScanner from './FoodScanner';
import VoiceInput from './VoiceInput';

interface ScanTabProps {
  onSuccess: () => void;
}

const ScanTab = ({ onSuccess }: ScanTabProps) => {
  const [showScanner, setShowScanner] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] pb-20 px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Log Your Food</h2>
          <p className="text-muted-foreground">
            Choose how you'd like to track your meal
          </p>
        </div>

        <Button
          onClick={() => setShowScanner(true)}
          className="w-full h-24 text-lg"
          size="lg"
        >
          <Camera className="mr-3 h-8 w-8" />
          Scan Food with Camera
        </Button>

        <Button
          onClick={() => setShowVoice(true)}
          variant="secondary"
          className="w-full h-24 text-lg"
          size="lg"
        >
          <Mic className="mr-3 h-8 w-8" />
          Voice Input
        </Button>

        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>AI-powered food recognition</p>
          <p>Instant nutrition analysis</p>
        </div>
      </div>

      {showScanner && (
        <FoodScanner
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            setShowScanner(false);
            onSuccess();
          }}
        />
      )}

      {showVoice && (
        <VoiceInput
          onClose={() => setShowVoice(false)}
          onSuccess={() => {
            setShowVoice(false);
            onSuccess();
          }}
        />
      )}
    </div>
  );
};

export default ScanTab;
