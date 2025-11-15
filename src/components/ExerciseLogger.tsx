import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ExerciseLogger = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exerciseName || !duration) {
      toast({
        title: 'Missing Information',
        description: 'Please enter exercise name and duration',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase.from('exercise_logs').insert({
        user_id: session.user.id,
        exercise_name: exerciseName,
        duration_minutes: parseInt(duration),
        calories_burned: caloriesBurned ? parseInt(caloriesBurned) : null,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Exercise Logged!',
        description: `${exerciseName} logged successfully`,
      });

      // Reset form
      setExerciseName('');
      setDuration('');
      setCaloriesBurned('');
      setNotes('');
      setOpen(false);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error logging exercise:', error);
      toast({
        title: 'Error',
        description: 'Failed to log exercise',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="p-6 cursor-pointer hover:bg-accent/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Exercise</h3>
                <p className="text-sm text-muted-foreground">Log workout</p>
              </div>
            </div>
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Exercise</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="exercise">Exercise Name *</Label>
            <Input
              id="exercise"
              placeholder="e.g., Running, Weightlifting"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="calories">Calories Burned (optional)</Label>
            <Input
              id="calories"
              type="number"
              placeholder="200"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about your workout"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging...' : 'Log Exercise'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseLogger;
