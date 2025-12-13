import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookMarked, Plus, Trash2, Utensils } from 'lucide-react';

interface MealTemplate {
  id: string;
  name: string;
  meal_type: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  foods: any[];
}

interface MealTemplatesProps {
  onUseTemplate?: (template: MealTemplate) => void;
}

const MealTemplates = ({ onUseTemplate }: MealTemplatesProps) => {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    meal_type: 'breakfast',
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('meal_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const templates = (data || []).map(t => ({
        ...t,
        foods: (t.foods as any[]) || [],
      }));
      setTemplates(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('meal_templates')
        .insert({
          user_id: user.id,
          ...newTemplate,
          foods: [],
        });

      if (error) throw error;

      toast({ title: 'Template saved!' });
      setShowCreate(false);
      setNewTemplate({
        name: '',
        meal_type: 'breakfast',
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
      });
      fetchTemplates();
    } catch (error) {
      toast({ title: 'Error saving template', variant: 'destructive' });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meal_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Template deleted' });
      fetchTemplates();
    } catch (error) {
      toast({ title: 'Error deleting template', variant: 'destructive' });
    }
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      default: return '🍎';
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookMarked className="h-5 w-5" />
          Meal Templates
        </h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Meal Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  placeholder="e.g., My Favorite Breakfast"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select
                  value={newTemplate.meal_type}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, meal_type: value })}
                >
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Calories</Label>
                  <Input
                    type="number"
                    value={newTemplate.total_calories}
                    onChange={(e) => setNewTemplate({ ...newTemplate, total_calories: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={newTemplate.total_protein}
                    onChange={(e) => setNewTemplate({ ...newTemplate, total_protein: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    value={newTemplate.total_carbs}
                    onChange={(e) => setNewTemplate({ ...newTemplate, total_carbs: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fat (g)</Label>
                  <Input
                    type="number"
                    value={newTemplate.total_fat}
                    onChange={(e) => setNewTemplate({ ...newTemplate, total_fat: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={createTemplate} disabled={!newTemplate.name} className="w-full">
                Save Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="p-6 text-center">
          <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No meal templates yet</p>
          <p className="text-sm text-muted-foreground">Save your frequent meals for quick logging</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMealTypeIcon(template.meal_type)}</span>
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.total_calories} cal • {template.total_protein}g P • {template.total_carbs}g C • {template.total_fat}g F
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onUseTemplate && (
                    <Button size="sm" onClick={() => onUseTemplate(template)}>
                      Use
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteTemplate(template.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealTemplates;
