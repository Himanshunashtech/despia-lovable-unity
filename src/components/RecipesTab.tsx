import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Flame, Zap, Wheat, Droplet, ChefHat, Apple } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RecipesTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [servingSize, setServingSize] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch food database items
      let foodQuery = supabase
        .from('food_database')
        .select('*')
        .limit(50);

      if (searchQuery) {
        foodQuery = foodQuery.ilike('food_name', `%${searchQuery}%`);
      }

      const { data: foodData } = await foodQuery;
      setFoodItems(foodData || []);

      // Fetch user recipes
      const { data: recipesData } = await supabase
        .from('recipes')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      setRecipes(recipesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMeal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedItem) return;

      const now = new Date();
      const mealTimes = {
        breakfast: 8,
        lunch: 12,
        dinner: 18,
        snack: 15,
      };

      now.setHours(mealTimes[selectedMeal as keyof typeof mealTimes], 0, 0, 0);

      // Create food log entry
      const { error: logError } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          meal_type: selectedMeal,
          total_calories: selectedItem.calories_per_100g * servingSize,
          total_protein: selectedItem.protein_per_100g * servingSize,
          total_carbs: selectedItem.carbs_per_100g * servingSize,
          total_fat: selectedItem.fat_per_100g * servingSize,
          created_at: now.toISOString(),
        });

      if (logError) throw logError;

      toast({
        title: 'Added to meal!',
        description: `${selectedItem.food_name} added to ${selectedMeal}`,
      });

      setShowAddDialog(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search foods and recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="foods" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="foods" className="gap-2">
            <Apple className="h-4 w-4" />
            Foods
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2">
            <ChefHat className="h-4 w-4" />
            Recipes
          </TabsTrigger>
        </TabsList>

        {/* Foods Tab */}
        <TabsContent value="foods" className="space-y-3 mt-4">
          {foodItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'No foods found' : 'No foods available'}
            </p>
          ) : (
            foodItems.map((food) => (
              <Card
                key={food.id}
                className="p-4 bg-card/50 backdrop-blur border-border/50 cursor-pointer hover:bg-card/70 transition-colors"
                onClick={() => {
                  setSelectedItem(food);
                  setShowAddDialog(true);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{food.food_name}</h4>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {food.brand && (
                  <p className="text-sm text-muted-foreground mb-2">{food.brand}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>{Math.round(food.calories_per_100g)}cal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-red-500" />
                    <span>{Math.round(food.protein_per_100g)}g</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wheat className="h-4 w-4 text-orange-400" />
                    <span>{Math.round(food.carbs_per_100g)}g</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplet className="h-4 w-4 text-blue-400" />
                    <span>{Math.round(food.fat_per_100g)}g</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-3 mt-4">
          {recipes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No recipes yet</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Recipe
              </Button>
            </div>
          ) : (
            recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="p-4 bg-card/50 backdrop-blur border-border/50 cursor-pointer hover:bg-card/70 transition-colors"
                onClick={() => {
                  setSelectedItem(recipe);
                  setShowAddDialog(true);
                }}
              >
                <div className="flex gap-4">
                  {recipe.image_url && (
                    <img
                      src={recipe.image_url}
                      alt={recipe.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{recipe.name}</h4>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>{Math.round(recipe.total_calories)}cal</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-red-500" />
                        <span>{Math.round(recipe.total_protein)}g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wheat className="h-4 w-4 text-orange-400" />
                        <span>{Math.round(recipe.total_carbs)}g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplet className="h-4 w-4 text-blue-400" />
                        <span>{Math.round(recipe.total_fat)}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add to Meal Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Meal Type</label>
              <Select value={selectedMeal} onValueChange={setSelectedMeal}>
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
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Serving Size (100g units)</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={servingSize}
                onChange={(e) => setServingSize(parseFloat(e.target.value))}
              />
            </div>
            <Button onClick={handleAddToMeal} className="w-full">
              Add to {selectedMeal}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipesTab;
