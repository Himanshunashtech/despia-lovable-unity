import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Apple, Target, Activity, Utensils, Scale, Ruler, TrendingDown, CheckCircle2, Crown } from 'lucide-react';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    height_cm: '',
    current_weight_kg: '',
    weight_goal_kg: '',
    goal_type: 'lose',
    activity_level: 'moderate',
    dietary_preference: 'none',
    daily_calorie_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 250,
    daily_fat_goal: 65,
    daily_water_goal_ml: 2000,
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_step')
      .eq('id', user.id)
      .single();

    const profileData = profile as any;
    if (profileData?.onboarding_completed) {
      navigate('/dashboard');
    } else if (profileData?.onboarding_step) {
      setStep(profileData.onboarding_step as number);
    }
  };

  const updateProfile = async (data: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    return !error;
  };

  const nextStep = async () => {
    if (step < 11) {
      await updateProfile({ onboarding_step: step + 1 });
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const completeOnboarding = async (startTrial: boolean) => {
    setLoading(true);
    try {
      const updates: any = {
        ...formData,
        onboarding_completed: true,
        onboarding_step: 11,
      };

      if (startTrial) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        updates.trial_started_at = now.toISOString();
        updates.trial_ends_at = trialEnd.toISOString();
        updates.subscription_tier = 'premium';
        updates.subscription_status = 'trialing';
      }

      const success = await updateProfile(updates);
      if (success) {
        toast({
          title: startTrial ? 'Trial Started!' : 'Welcome!',
          description: startTrial ? 'Your 3-day free trial has begun' : 'You can upgrade anytime',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateGoals = () => {
    const weight = Number(formData.current_weight_kg);
    const height = Number(formData.height_cm);
    
    let calories = 2000;
    if (formData.activity_level === 'sedentary') calories = weight * 26;
    else if (formData.activity_level === 'moderate') calories = weight * 30;
    else if (formData.activity_level === 'active') calories = weight * 35;

    if (formData.goal_type === 'lose') calories -= 500;
    else if (formData.goal_type === 'gain') calories += 500;

    setFormData({
      ...formData,
      daily_calorie_goal: Math.round(calories),
      daily_protein_goal: Math.round(weight * 2),
      daily_carbs_goal: Math.round(calories * 0.45 / 4),
      daily_fat_goal: Math.round(calories * 0.30 / 9),
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <span className="text-7xl block mx-auto">🍎</span>
            <h1 className="text-4xl font-bold">Welcome to Ella AI</h1>
            <p className="text-xl text-muted-foreground">Your AI-powered nutrition companion</p>
            <p className="text-muted-foreground">Let's personalize your experience in just a few steps</p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">What's your name?</h2>
              <p className="text-muted-foreground">We'll use this to personalize your experience</p>
            </div>
            <Input
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="text-lg h-14"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">What's your goal?</h2>
              <p className="text-muted-foreground">This helps us calculate your daily targets</p>
            </div>
            <div className="space-y-3">
              {[
                { value: 'lose', label: 'Lose Weight', icon: TrendingDown },
                { value: 'maintain', label: 'Maintain Weight', icon: Target },
                { value: 'gain', label: 'Gain Weight', icon: TrendingDown },
              ].map((goal) => (
                <Card
                  key={goal.value}
                  className={`p-4 cursor-pointer transition-all ${
                    formData.goal_type === goal.value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                  onClick={() => setFormData({ ...formData, goal_type: goal.value })}
                >
                  <div className="flex items-center gap-3">
                    <goal.icon className="h-6 w-6" />
                    <span className="text-lg font-medium">{goal.label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Activity className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">Activity Level</h2>
              <p className="text-muted-foreground">How active are you typically?</p>
            </div>
            <div className="space-y-3">
              {[
                { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                { value: 'moderate', label: 'Moderate', desc: 'Exercise 3-5 days/week' },
                { value: 'active', label: 'Very Active', desc: 'Exercise 6-7 days/week' },
              ].map((level) => (
                <Card
                  key={level.value}
                  className={`p-4 cursor-pointer transition-all ${
                    formData.activity_level === level.value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                  onClick={() => setFormData({ ...formData, activity_level: level.value })}
                >
                  <div className="text-lg font-medium">{level.label}</div>
                  <div className="text-sm opacity-80">{level.desc}</div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Ruler className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">Your Height</h2>
              <p className="text-muted-foreground">Help us calculate your BMI</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Height (cm)</label>
              <Input
                type="number"
                placeholder="170"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                className="text-lg h-14"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Scale className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">Current Weight</h2>
              <p className="text-muted-foreground">We'll track your progress from here</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (kg)</label>
              <Input
                type="number"
                placeholder="70"
                value={formData.current_weight_kg}
                onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
                className="text-lg h-14"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">Goal Weight</h2>
              <p className="text-muted-foreground">What's your target weight?</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Weight (kg)</label>
              <Input
                type="number"
                placeholder="65"
                value={formData.weight_goal_kg}
                onChange={(e) => setFormData({ ...formData, weight_goal_kg: e.target.value })}
                className="text-lg h-14"
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Utensils className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">Dietary Preferences</h2>
              <p className="text-muted-foreground">Do you have any dietary restrictions?</p>
            </div>
            <div className="space-y-3">
              {[
                { value: 'none', label: 'No Restrictions' },
                { value: 'vegetarian', label: 'Vegetarian' },
                { value: 'vegan', label: 'Vegan' },
                { value: 'keto', label: 'Keto' },
                { value: 'paleo', label: 'Paleo' },
              ].map((pref) => (
                <Card
                  key={pref.value}
                  className={`p-4 cursor-pointer transition-all ${
                    formData.dietary_preference === pref.value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                  onClick={() => setFormData({ ...formData, dietary_preference: pref.value })}
                >
                  <span className="text-lg font-medium">{pref.label}</span>
                </Card>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Activity className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">Calculating Your Goals</h2>
              <p className="text-muted-foreground">Based on your information</p>
            </div>
            {formData.daily_calorie_goal === 2000 && (
              <Button onClick={calculateGoals} size="lg" className="w-full">
                Calculate My Goals
              </Button>
            )}
            {formData.daily_calorie_goal !== 2000 && (
              <Card className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">{formData.daily_calorie_goal}</div>
                  <div className="text-muted-foreground">Daily Calories</div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-500">{formData.daily_protein_goal}g</div>
                    <div className="text-sm text-muted-foreground">Protein</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-500">{formData.daily_carbs_goal}g</div>
                    <div className="text-sm text-muted-foreground">Carbs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{formData.daily_fat_goal}g</div>
                    <div className="text-sm text-muted-foreground">Fat</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 10:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle2 className="h-20 w-20 mx-auto text-green-500" />
            <h2 className="text-3xl font-bold">You're All Set!</h2>
            <p className="text-muted-foreground">
              Your personalized nutrition plan is ready. Let's get started with tracking!
            </p>
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Crown className="h-20 w-20 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-3xl font-bold mb-2">Unlock Premium Features</h2>
              <p className="text-muted-foreground">Get the most out of Ella AI</p>
            </div>

            <Card className="p-6 border-2 border-primary">
              <div className="text-center mb-6">
                <div className="text-sm text-primary font-semibold mb-2">PREMIUM PLAN</div>
                <div className="text-5xl font-bold mb-2">₹699<span className="text-xl text-muted-foreground">/month</span></div>
                <div className="text-green-600 font-medium">Start with 3 days FREE</div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Unlimited AI food analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Advanced barcode scanner</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Personalized meal suggestions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Detailed analytics & insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Priority support</span>
                </div>
              </div>

              <Button
                onClick={() => completeOnboarding(true)}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                Start 3-Day Free Trial
              </Button>
            </Card>

            <Button
              onClick={() => completeOnboarding(false)}
              disabled={loading}
              variant="ghost"
              className="w-full"
            >
              Continue with Free Plan
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="p-4">
        <Progress value={(step / 11) * 100} className="h-2" />
        <div className="text-sm text-muted-foreground text-center mt-2">
          Step {step} of 11
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {renderStep()}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="p-6 space-y-3">
        {step > 1 && step < 11 && (
          <Button
            onClick={prevStep}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Back
          </Button>
        )}
        {step < 10 && (
          <Button
            onClick={nextStep}
            size="lg"
            className="w-full"
            disabled={
              (step === 2 && !formData.full_name) ||
              (step === 5 && !formData.height_cm) ||
              (step === 6 && !formData.current_weight_kg) ||
              (step === 7 && !formData.weight_goal_kg) ||
              (step === 9 && formData.daily_calorie_goal === 2000)
            }
          >
            Continue
          </Button>
        )}
        {step === 10 && (
          <Button onClick={nextStep} size="lg" className="w-full">
            View Subscription Options
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
