import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingDown, TrendingUp, Minus, X, Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HealthGoalsProps {
  profile: {
    id: string;
    weight_goal_kg?: number;
    goal_type?: string;
    dietary_preference?: string;
    daily_calorie_goal?: number;
    daily_protein_goal?: number;
    daily_carbs_goal?: number;
    daily_fat_goal?: number;
  };
  onUpdate: () => void;
}

const dietaryOptions = [
  { value: 'none', label: 'No Preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'high_protein', label: 'High Protein' },
];

const allergyOptions = [
  'Dairy', 'Gluten', 'Nuts', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Sesame'
];

const HealthGoals = ({ profile, onUpdate }: HealthGoalsProps) => {
  const [goals, setGoals] = useState({
    weight_goal_kg: profile.weight_goal_kg || 0,
    goal_type: profile.goal_type || 'maintain',
    dietary_preference: profile.dietary_preference || 'none',
    daily_calorie_goal: profile.daily_calorie_goal || 2000,
    daily_protein_goal: profile.daily_protein_goal || 150,
    daily_carbs_goal: profile.daily_carbs_goal || 250,
    daily_fat_goal: profile.daily_fat_goal || 65,
  });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          weight_goal_kg: goals.weight_goal_kg,
          goal_type: goals.goal_type,
          dietary_preference: goals.dietary_preference,
          daily_calorie_goal: goals.daily_calorie_goal,
          daily_protein_goal: goals.daily_protein_goal,
          daily_carbs_goal: goals.daily_carbs_goal,
          daily_fat_goal: goals.daily_fat_goal,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({ title: 'Goals updated successfully!' });
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  return (
    <Card className="bg-[#2a2a3a] border-[#3a3a4a]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-green-500" />
          Health & Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Type */}
        <div className="space-y-2">
          <Label className="text-gray-300">Weight Goal</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'lose', label: 'Lose', icon: TrendingDown, color: 'bg-red-500/20 border-red-500 text-red-400' },
              { value: 'maintain', label: 'Maintain', icon: Minus, color: 'bg-blue-500/20 border-blue-500 text-blue-400' },
              { value: 'gain', label: 'Gain', icon: TrendingUp, color: 'bg-green-500/20 border-green-500 text-green-400' },
            ].map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setGoals({ ...goals, goal_type: value })}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  goals.goal_type === value ? color : 'border-[#3a3a4a] text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight_goal" className="text-gray-300">Target Weight (kg)</Label>
          <Input
            id="weight_goal"
            type="number"
            value={goals.weight_goal_kg}
            onChange={(e) => setGoals({ ...goals, weight_goal_kg: Number(e.target.value) })}
            className="bg-[#1a1a2e] border-[#3a3a4a] text-white"
          />
        </div>

        {/* Dietary Preference */}
        <div className="space-y-2">
          <Label className="text-gray-300">Dietary Preference</Label>
          <Select
            value={goals.dietary_preference}
            onValueChange={(value) => setGoals({ ...goals, dietary_preference: value })}
          >
            <SelectTrigger className="bg-[#1a1a2e] border-[#3a3a4a] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a3a] border-[#3a3a4a]">
              {dietaryOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Allergies */}
        <div className="space-y-2">
          <Label className="text-gray-300">Allergies & Intolerances</Label>
          <div className="flex flex-wrap gap-2">
            {allergyOptions.map(allergy => (
              <Badge
                key={allergy}
                variant={allergies.includes(allergy) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  allergies.includes(allergy) 
                    ? 'bg-red-500/20 text-red-400 border-red-500' 
                    : 'border-[#3a3a4a] text-gray-400 hover:border-gray-500'
                }`}
                onClick={() => toggleAllergy(allergy)}
              >
                {allergy}
                {allergies.includes(allergy) && <X className="h-3 w-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>

        {/* Daily Targets */}
        <div className="space-y-3 pt-4 border-t border-[#3a3a4a]">
          <Label className="text-gray-300 text-base font-semibold">Daily Macro Targets</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">Calories (kcal)</Label>
              <Input
                type="number"
                value={goals.daily_calorie_goal}
                onChange={(e) => setGoals({ ...goals, daily_calorie_goal: Number(e.target.value) })}
                className="bg-[#1a1a2e] border-[#3a3a4a] text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Protein (g)</Label>
              <Input
                type="number"
                value={goals.daily_protein_goal}
                onChange={(e) => setGoals({ ...goals, daily_protein_goal: Number(e.target.value) })}
                className="bg-[#1a1a2e] border-[#3a3a4a] text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Carbs (g)</Label>
              <Input
                type="number"
                value={goals.daily_carbs_goal}
                onChange={(e) => setGoals({ ...goals, daily_carbs_goal: Number(e.target.value) })}
                className="bg-[#1a1a2e] border-[#3a3a4a] text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Fat (g)</Label>
              <Input
                type="number"
                value={goals.daily_fat_goal}
                onChange={(e) => setGoals({ ...goals, daily_fat_goal: Number(e.target.value) })}
                className="bg-[#1a1a2e] border-[#3a3a4a] text-white"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-white text-black hover:bg-gray-200">
          <Save className="h-4 w-4 mr-2" />
          Save Goals
        </Button>
      </CardContent>
    </Card>
  );
};

export default HealthGoals;
