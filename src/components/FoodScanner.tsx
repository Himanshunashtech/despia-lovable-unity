import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, X } from 'lucide-react';

interface FoodScannerProps {
  onClose: () => void;
  onSuccess: () => void;
}

const FoodScanner = ({ onClose, onSuccess }: FoodScannerProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [mealType, setMealType] = useState<string>('lunch');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFood = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: { imageBase64: image },
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: 'Analysis complete!',
        description: `Detected ${data.analysis.foods.length} food item(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveFoodLog = async () => {
    if (!analysis) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create food log
      const { data: foodLog, error: logError } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          meal_type: mealType,
          image_url: image,
          notes,
          total_calories: analysis.total_nutrition.calories,
          total_protein: analysis.total_nutrition.protein,
          total_carbs: analysis.total_nutrition.carbs,
          total_fat: analysis.total_nutrition.fat,
          ai_analysis: analysis,
        })
        .select()
        .single();

      if (logError) throw logError;

      // Create food items
      const foodItems = analysis.foods.map((food: any) => ({
        food_log_id: foodLog.id,
        food_name: food.name,
        quantity: food.quantity,
        serving_size: food.serving_size,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        confidence_score: food.confidence,
      }));

      const { error: itemsError } = await supabase
        .from('food_items')
        .insert(foodItems);

      if (itemsError) throw itemsError;

      // Update daily summary
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('daily_summaries')
          .update({
            total_calories: Number(existing.total_calories) + analysis.total_nutrition.calories,
            total_protein: Number(existing.total_protein) + analysis.total_nutrition.protein,
            total_carbs: Number(existing.total_carbs) + analysis.total_nutrition.carbs,
            total_fat: Number(existing.total_fat) + analysis.total_nutrition.fat,
            meal_count: existing.meal_count + 1,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('daily_summaries').insert({
          user_id: user.id,
          date: today,
          total_calories: analysis.total_nutrition.calories,
          total_protein: analysis.total_nutrition.protein,
          total_carbs: analysis.total_nutrition.carbs,
          total_fat: analysis.total_nutrition.fat,
          meal_count: 1,
        });
      }

      toast({
        title: 'Food logged!',
        description: 'Your meal has been saved successfully.',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error saving food log',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scan Food</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!image ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                size="lg"
              >
                <Camera className="mr-2 h-5 w-5" />
                Take Photo
              </Button>
              <Button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Image
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <img
                  src={image}
                  alt="Food"
                  className="w-full rounded-lg"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImage(null);
                    setAnalysis(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!analysis ? (
                <Button
                  onClick={analyzeFood}
                  disabled={analyzing}
                  className="w-full"
                  size="lg"
                >
                  {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {analyzing ? 'Analyzing...' : 'Analyze Food'}
                </Button>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Detected Foods:</h4>
                        <ul className="space-y-2">
                          {analysis.foods.map((food: any, idx: number) => (
                            <li key={idx} className="text-sm">
                              <strong>{food.name}</strong> ({food.quantity})
                              <br />
                              {food.calories} cal | {food.protein}g protein | {food.carbs}g carbs | {food.fat}g fat
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Total Nutrition:</h4>
                        <p className="text-sm">
                          {Math.round(analysis.total_nutrition.calories)} calories |{' '}
                          {Math.round(analysis.total_nutrition.protein)}g protein |{' '}
                          {Math.round(analysis.total_nutrition.carbs)}g carbs |{' '}
                          {Math.round(analysis.total_nutrition.fat)}g fat
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mealType">Meal Type</Label>
                      <Select value={mealType} onValueChange={setMealType}>
                        <SelectTrigger id="mealType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes about this meal..."
                      />
                    </div>

                    <Button onClick={saveFoodLog} className="w-full" size="lg">
                      Save Food Log
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FoodScanner;