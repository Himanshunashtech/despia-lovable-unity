import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mic, Loader2, Send, MicOff } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';

interface VoiceInputProps {
  onClose: () => void;
  onSuccess: () => void;
}

const VoiceInput = ({ onClose, onSuccess }: VoiceInputProps) => {
  const [text, setText] = useState('');
  const [mealType, setMealType] = useState<string>('lunch');
  const [processing, setProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();
  const { checkAndUpdateStats } = useAchievements();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: 'Voice recognition error',
          description: 'Could not recognize speech. Please try again.',
          variant: 'destructive',
        });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: 'Voice recognition not supported',
        description: 'Your browser does not support speech recognition.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const parseAndSave = async () => {
    if (!text.trim()) {
      toast({
        title: 'Enter food description',
        description: 'Please describe what you ate',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parse text with AI
      const { data, error } = await supabase.functions.invoke('parse-food-text', {
        body: { text, mealType },
      });

      if (error) throw error;

      const parsedData = data.data;

      // Create food log
      const { data: foodLog, error: logError } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          meal_type: mealType,
          notes: text,
          total_calories: parsedData.total_nutrition.calories,
          total_protein: parsedData.total_nutrition.protein,
          total_carbs: parsedData.total_nutrition.carbs,
          total_fat: parsedData.total_nutrition.fat,
          ai_analysis: parsedData,
        })
        .select()
        .single();

      if (logError) throw logError;

      // Create food items
      const foodItems = parsedData.foods.map((food: any) => ({
        food_log_id: foodLog.id,
        food_name: food.name,
        quantity: food.quantity,
        serving_size: food.serving_size,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
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
            total_calories: Number(existing.total_calories) + parsedData.total_nutrition.calories,
            total_protein: Number(existing.total_protein) + parsedData.total_nutrition.protein,
            total_carbs: Number(existing.total_carbs) + parsedData.total_nutrition.carbs,
            total_fat: Number(existing.total_fat) + parsedData.total_nutrition.fat,
            meal_count: existing.meal_count + 1,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('daily_summaries').insert({
          user_id: user.id,
          date: today,
          total_calories: parsedData.total_nutrition.calories,
          total_protein: parsedData.total_nutrition.protein,
          total_carbs: parsedData.total_nutrition.carbs,
          total_fat: parsedData.total_nutrition.fat,
          meal_count: 1,
        });
      }

      toast({
        title: 'Food logged!',
        description: `Added ${parsedData.foods.length} item(s) to your log`,
      });
      
      // Check achievements
      await checkAndUpdateStats('food');
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error logging food',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Input</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="text">What did you eat?</Label>
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={toggleListening}
                disabled={processing}
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Voice Input
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., I ate a large apple, two slices of whole wheat toast with butter, and a cup of coffee"
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isListening ? 'Listening... Speak now' : 'Describe your meal in natural language or use voice input'}
            </p>
          </div>

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

          <Button
            onClick={parseAndSave}
            disabled={processing || !text.trim()}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Log Food
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceInput;