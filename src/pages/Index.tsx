import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Apple, Camera, Brain, Zap } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Apple className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            CaloriAI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Track your nutrition with advanced AI-powered food recognition. 
            Snap a photo, speak your meal, or type it in - we handle the rest.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="text-lg px-8 py-6"
          >
            Get Started Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Camera className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Food Scanning</h3>
            <p className="text-gray-600">
              Snap a photo of your meal and instantly get detailed nutritional information 
              with multi-food detection and portion estimation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
            <p className="text-gray-600">
              Powered by Google Gemini AI for accurate food recognition, 
              nutritional analysis, and meal composition insights.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Voice & Text Input</h3>
            <p className="text-gray-600">
              Simply say or type what you ate. Our AI understands natural language 
              and logs everything automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
