import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, Brain, Sparkles, ScanBarcode } from 'lucide-react';
import ellaLogo from '@/assets/ella-logo.png';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background via-accent/20 to-background">
        <div className="max-w-md mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={ellaLogo} alt="Ella AI" className="h-20 w-20 object-contain" />
            <h1 className="text-5xl font-bold">Ella AI</h1>
          </div>
          
          <h2 className="text-3xl font-bold leading-tight">
            Track Nutrition with AI
          </h2>
          
          <p className="text-xl text-muted-foreground">
            Snap, scan, or speak to track your meals. Get AI-powered insights in seconds.
          </p>
          
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 w-full"
          >
            Start Free Trial
          </Button>

          <p className="text-sm text-muted-foreground">
            3 days free, then ₹699/month
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 py-16 max-w-md mx-auto">
        <h3 className="text-2xl font-bold text-center mb-12">Everything You Need</h3>
        
        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">AI Food Scanning</h4>
              <p className="text-muted-foreground">
                Take a photo of your meal and get instant nutrition breakdown with calories, protein, carbs, and fats.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanBarcode className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Barcode Scanner</h4>
              <p className="text-muted-foreground">
                Scan any packaged food to instantly add it to your diary with accurate nutritional data.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Smart Analysis</h4>
              <p className="text-muted-foreground">
                Get personalized insights and meal suggestions based on your goals and eating patterns.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Voice & Text Input</h4>
              <p className="text-muted-foreground">
                Describe your meal in your own words and let AI do the rest. Perfect for quick logging.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 py-16 bg-primary/5">
        <div className="max-w-md mx-auto text-center space-y-6">
          <h3 className="text-3xl font-bold">Ready to Start?</h3>
          <p className="text-lg text-muted-foreground">
            Join thousands achieving their fitness goals with AI
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 w-full"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
