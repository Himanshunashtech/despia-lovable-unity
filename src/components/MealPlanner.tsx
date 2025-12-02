import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface MealPlannerProps {
  open: boolean;
  onClose: () => void;
}

interface MealPlan {
  id: string;
  date: string;
  meal_type: string;
  custom_food_name: string | null;
  planned_calories: number;
  planned_protein: number;
  planned_carbs: number;
  planned_fat: number;
  is_logged: boolean;
}

const MealPlanner = ({ open, onClose }: MealPlannerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadMealPlans();
    }
  }, [open, selectedDate]);

  const loadMealPlans = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .order('meal_type');

      if (error) throw error;

      setMealPlans(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load meal plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchFood = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('food_database')
        .select('*')
        .ilike('food_name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to search food',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const addMealPlan = async (food: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          date: dateStr,
          meal_type: selectedMealType,
          food_database_id: food.id,
          custom_food_name: food.food_name,
          planned_calories: food.calories,
          planned_protein: food.protein_g,
          planned_carbs: food.carbs_g,
          planned_fat: food.fat_g,
        });

      if (error) throw error;

      toast({
        title: 'Added to meal plan',
        description: `${food.food_name} added to ${selectedMealType}`,
      });

      setShowAddDialog(false);
      setSearchQuery('');
      setSearchResults([]);
      loadMealPlans();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to add meal plan',
        variant: 'destructive',
      });
    }
  };

  const deleteMealPlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Removed from meal plan',
      });

      loadMealPlans();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete meal plan',
        variant: 'destructive',
      });
    }
  };

  const logMealPlan = async (plan: MealPlan) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create food log
      const { data: foodLog, error: logError } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          meal_type: plan.meal_type,
          notes: plan.custom_food_name,
          total_calories: plan.planned_calories,
          total_protein: plan.planned_protein,
          total_carbs: plan.planned_carbs,
          total_fat: plan.planned_fat,
        })
        .select()
        .single();

      if (logError) throw logError;

      // Create food item
      const { error: itemError } = await supabase
        .from('food_items')
        .insert({
          food_log_id: foodLog.id,
          food_name: plan.custom_food_name || 'Planned meal',
          calories: plan.planned_calories,
          protein: plan.planned_protein,
          carbs: plan.planned_carbs,
          fat: plan.planned_fat,
        });

      if (itemError) throw itemError;

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
            total_calories: Number(existing.total_calories) + plan.planned_calories,
            total_protein: Number(existing.total_protein) + plan.planned_protein,
            total_carbs: Number(existing.total_carbs) + plan.planned_carbs,
            total_fat: Number(existing.total_fat) + plan.planned_fat,
            meal_count: existing.meal_count + 1,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('daily_summaries').insert({
          user_id: user.id,
          date: today,
          total_calories: plan.planned_calories,
          total_protein: plan.planned_protein,
          total_carbs: plan.planned_carbs,
          total_fat: plan.planned_fat,
          meal_count: 1,
        });
      }

      // Mark as logged
      await supabase
        .from('meal_plans')
        .update({ is_logged: true })
        .eq('id', plan.id);

      toast({
        title: 'Meal logged',
        description: 'Added to your daily log',
      });

      loadMealPlans();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to log meal',
        variant: 'destructive',
      });
    }
  };

  const getMealsByType = (type: string) => {
    return mealPlans.filter(plan => plan.meal_type === type);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Meal Planner
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[300px,1fr] gap-6">
          {/* Calendar */}
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          {/* Meal Plans */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">
                {format(selectedDate, 'EEEE, MMM d')}
              </h3>
              <Button
                size="sm"
                onClick={() => setShowAddDialog(!showAddDialog)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Meal
              </Button>
            </div>

            {showAddDialog && (
              <div className="border border-border rounded-lg p-4 space-y-4 bg-accent/20">
                <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>

                <input
                  type="text"
                  placeholder="Search food..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchFood(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />

                {searching && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((food) => (
                      <div
                        key={food.id}
                        className="flex justify-between items-center p-3 border border-border rounded-md hover:bg-accent/50"
                      >
                        <div>
                          <p className="font-medium">{food.food_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {food.calories} cal | P: {food.protein_g}g | C: {food.carbs_g}g | F: {food.fat_g}g
                          </p>
                        </div>
                        <Button size="sm" onClick={() => addMealPlan(food)}>
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                  const meals = getMealsByType(mealType);
                  return (
                    <div key={mealType} className="space-y-2">
                      <h4 className="font-semibold capitalize">{mealType}</h4>
                      {meals.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No meals planned</p>
                      ) : (
                        meals.map((meal) => (
                          <div
                            key={meal.id}
                            className="border border-border rounded-lg p-3 flex justify-between items-center"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{meal.custom_food_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {meal.planned_calories} cal | P: {meal.planned_protein}g | C: {meal.planned_carbs}g | F: {meal.planned_fat}g
                              </p>
                              {meal.is_logged && (
                                <span className="text-xs text-primary">✓ Logged</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {!meal.is_logged && (
                                <Button
                                  size="sm"
                                  onClick={() => logMealPlan(meal)}
                                >
                                  Log
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteMealPlan(meal.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealPlanner;
