import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Flame, Zap, Wheat, Droplet, ChefHat, Apple, Trash2, Clock, Users } from 'lucide-react';

interface Ingredient {
  food_name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const RecipesTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [servingSize, setServingSize] = useState(1);

  // Create recipe state
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({ food_name: '', quantity: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const mealTimes: Record<string, number> = {
        breakfast: 8,
        lunch: 12,
        dinner: 18,
        snack: 15,
      };

      now.setHours(mealTimes[selectedMeal] || 12, 0, 0, 0);

      // Check if it's a recipe or food item
      const isRecipe = selectedItem.total_calories !== undefined;
      const calories = isRecipe ? selectedItem.total_calories : (selectedItem.calories || 0);
      const protein = isRecipe ? selectedItem.total_protein : (selectedItem.protein_g || 0);
      const carbs = isRecipe ? selectedItem.total_carbs : (selectedItem.carbs_g || 0);
      const fat = isRecipe ? selectedItem.total_fat : (selectedItem.fat_g || 0);

      const { error: logError } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          meal_type: selectedMeal,
          total_calories: calories * servingSize,
          total_protein: protein * servingSize,
          total_carbs: carbs * servingSize,
          total_fat: fat * servingSize,
          notes: isRecipe ? `Recipe: ${selectedItem.name}` : selectedItem.food_name,
          created_at: now.toISOString(),
        });

      if (logError) throw logError;

      setShowAddDialog(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('Error adding to meal:', error);
    }
  };

  const addIngredient = () => {
    if (!newIngredient.food_name.trim()) return;
    setIngredients([...ingredients, { ...newIngredient }]);
    setNewIngredient({ food_name: '', quantity: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const getTotals = () => {
    return ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + (ing.calories || 0),
        protein: acc.protein + (ing.protein || 0),
        carbs: acc.carbs + (ing.carbs || 0),
        fat: acc.fat + (ing.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleCreateRecipe = async () => {
    if (!recipeName.trim()) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totals = getTotals();

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: recipeName.trim(),
          description: recipeDescription.trim() || null,
          instructions: recipeInstructions.trim() || null,
          prep_time_minutes: prepTime ? parseInt(prepTime) : null,
          cook_time_minutes: cookTime ? parseInt(cookTime) : null,
          servings: parseInt(servings) || 1,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_carbs: totals.carbs,
          total_fat: totals.fat,
          is_public: isPublic,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Add ingredients
      if (ingredients.length > 0 && recipe) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(
            ingredients.map((ing) => ({
              recipe_id: recipe.id,
              food_name: ing.food_name,
              quantity: ing.quantity || null,
              calories: ing.calories,
              protein: ing.protein,
              carbs: ing.carbs,
              fat: ing.fat,
            }))
          );

        if (ingredientsError) console.error('Error adding ingredients:', ingredientsError);
      }

      // Reset form
      setRecipeName('');
      setRecipeDescription('');
      setRecipeInstructions('');
      setPrepTime('');
      setCookTime('');
      setServings('1');
      setIngredients([]);
      setIsPublic(false);
      setShowCreateRecipe(false);

      // Refresh recipes
      fetchData();
    } catch (error) {
      console.error('Error creating recipe:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      // Delete ingredients first
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      // Then delete recipe
      await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      fetchData();
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : foodItems.length === 0 ? (
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
                    <span>{Math.round(food.calories || 0)}cal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-red-500" />
                    <span>{Math.round(food.protein_g || 0)}g</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wheat className="h-4 w-4 text-orange-400" />
                    <span>{Math.round(food.carbs_g || 0)}g</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplet className="h-4 w-4 text-blue-400" />
                    <span>{Math.round(food.fat_g || 0)}g</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-3 mt-4">
          <Button onClick={() => setShowCreateRecipe(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create New Recipe
          </Button>

          {recipes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No recipes yet. Create your first recipe!
            </p>
          ) : (
            recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="p-4 bg-card/50 backdrop-blur border-border/50"
              >
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{recipe.name}</h4>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(recipe);
                            setShowAddDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteRecipe(recipe.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      {recipe.prep_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Prep: {recipe.prep_time_minutes}m
                        </span>
                      )}
                      {recipe.cook_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Cook: {recipe.cook_time_minutes}m
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recipe.servings} servings
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>{Math.round(recipe.total_calories || 0)}cal</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-red-500" />
                        <span>{Math.round(recipe.total_protein || 0)}g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wheat className="h-4 w-4 text-orange-400" />
                        <span>{Math.round(recipe.total_carbs || 0)}g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplet className="h-4 w-4 text-blue-400" />
                        <span>{Math.round(recipe.total_fat || 0)}g</span>
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
            <p className="text-sm text-muted-foreground">
              Adding: <span className="font-medium text-foreground">{selectedItem?.name || selectedItem?.food_name}</span>
            </p>
            <div>
              <Label className="mb-2 block">Meal Type</Label>
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
              <Label className="mb-2 block">Servings</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={servingSize}
                onChange={(e) => setServingSize(parseFloat(e.target.value) || 1)}
              />
            </div>
            <Button onClick={handleAddToMeal} className="w-full">
              Add to {selectedMeal}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Recipe Dialog */}
      <Dialog open={showCreateRecipe} onOpenChange={setShowCreateRecipe}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Recipe Name *</Label>
              <Input
                placeholder="e.g., Healthy Chicken Salad"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Description</Label>
              <Textarea
                placeholder="Brief description of your recipe..."
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-2 block text-xs">Prep (min)</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs">Cook (min)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs">Servings</Label>
                <Input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <Label className="mb-2 block">Ingredients</Label>
              <div className="space-y-2 mb-3">
                {ingredients.map((ing, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <span className="flex-1 text-sm">{ing.quantity} {ing.food_name}</span>
                    <span className="text-xs text-muted-foreground">{ing.calories}cal</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 p-3 border border-dashed rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Ingredient name"
                    value={newIngredient.food_name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, food_name: e.target.value })}
                  />
                  <Input
                    placeholder="Quantity (e.g., 100g)"
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">Calories</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newIngredient.calories || ''}
                      onChange={(e) => setNewIngredient({ ...newIngredient, calories: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Protein</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newIngredient.protein || ''}
                      onChange={(e) => setNewIngredient({ ...newIngredient, protein: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carbs</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newIngredient.carbs || ''}
                      onChange={(e) => setNewIngredient({ ...newIngredient, carbs: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fat</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newIngredient.fat || ''}
                      onChange={(e) => setNewIngredient({ ...newIngredient, fat: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={addIngredient}
                  disabled={!newIngredient.food_name.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
            </div>

            {/* Totals */}
            {ingredients.length > 0 && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium mb-2">Recipe Totals:</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-orange-500">{getTotals().calories} cal</span>
                  <span className="text-red-500">{getTotals().protein}g protein</span>
                  <span className="text-orange-400">{getTotals().carbs}g carbs</span>
                  <span className="text-blue-400">{getTotals().fat}g fat</span>
                </div>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Instructions</Label>
              <Textarea
                placeholder="Step-by-step cooking instructions..."
                value={recipeInstructions}
                onChange={(e) => setRecipeInstructions(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isPublic" className="text-sm">Make this recipe public</Label>
            </div>

            <Button
              onClick={handleCreateRecipe}
              disabled={!recipeName.trim() || saving}
              className="w-full"
            >
              {saving ? 'Creating...' : 'Create Recipe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipesTab;