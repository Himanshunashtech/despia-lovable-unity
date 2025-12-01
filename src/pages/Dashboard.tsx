import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import TabNavigation from '@/components/TabNavigation';
import ProfileTab from '@/components/ProfileTab';
import HistoryTab from '@/components/HistoryTab';
import HomeTab from '@/components/HomeTab';
import RecipesTab from '@/components/RecipesTab';
import FoodScanner from '@/components/FoodScanner';
import VoiceInput from '@/components/VoiceInput';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Mic, ScanBarcode } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if onboarding is completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    const profileData = profile as any;
    if (!profileData?.onboarding_completed) {
      navigate('/onboarding');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFoodAdded = () => {
    setShowScanner(false);
    setShowVoice(false);
    setShowBarcode(false);
    setShowAddDialog(false);
    handleRefresh();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab key={refreshKey} onRefresh={handleRefresh} />;
      case 'recipes':
        return <RecipesTab />;
      case 'history':
        return <HistoryTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <TabNavigation
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddFood={() => setShowAddDialog(true)}
      />

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24">
        {renderContent()}
      </main>

      {/* Add Food Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4 py-4">
            <Button
              onClick={() => {
                setShowAddDialog(false);
                setShowScanner(true);
              }}
              className="w-full h-20 text-lg"
              size="lg"
            >
              <Camera className="mr-3 h-6 w-6" />
              Scan Food with Camera
            </Button>
            <Button
              onClick={() => {
                setShowAddDialog(false);
                setShowVoice(true);
              }}
              variant="secondary"
              className="w-full h-20 text-lg"
              size="lg"
            >
              <Mic className="mr-3 h-6 w-6" />
              Voice Input
            </Button>
            <Button
              onClick={() => {
                setShowAddDialog(false);
                setShowBarcode(true);
              }}
              variant="outline"
              className="w-full h-20 text-lg"
              size="lg"
            >
              <ScanBarcode className="mr-3 h-6 w-6" />
              Scan Barcode
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Food Scanner */}
      {showScanner && (
        <FoodScanner
          onClose={() => setShowScanner(false)}
          onSuccess={handleFoodAdded}
        />
      )}

      {/* Voice Input */}
      {showVoice && (
        <VoiceInput
          onClose={() => setShowVoice(false)}
          onSuccess={handleFoodAdded}
        />
      )}

      {/* Barcode Scanner */}
      {showBarcode && (
        <BarcodeScanner
          open={showBarcode}
          onClose={() => setShowBarcode(false)}
          onSuccess={handleFoodAdded}
        />
      )}
    </div>
  );
};

export default Dashboard;