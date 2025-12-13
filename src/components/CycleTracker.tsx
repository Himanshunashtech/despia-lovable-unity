import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Droplets, Heart, Moon, Sun } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface CycleLog {
  id: string;
  date: string;
  cycle_day: number | null;
  period_start: boolean;
  period_end: boolean;
  flow_intensity: string | null;
  symptoms: string[];
  mood: string | null;
  notes: string | null;
}

const SYMPTOMS = [
  { id: 'cramps', label: 'Cramps', icon: '😣' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'bloating', label: 'Bloating', icon: '😮‍💨' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'acne', label: 'Acne', icon: '😖' },
  { id: 'cravings', label: 'Cravings', icon: '🍫' },
  { id: 'mood_swings', label: 'Mood Swings', icon: '🎭' },
  { id: 'breast_tenderness', label: 'Breast Tenderness', icon: '💔' },
];

const MOODS = [
  { id: 'happy', label: 'Happy', icon: '😊' },
  { id: 'calm', label: 'Calm', icon: '😌' },
  { id: 'energetic', label: 'Energetic', icon: '⚡' },
  { id: 'anxious', label: 'Anxious', icon: '😰' },
  { id: 'sad', label: 'Sad', icon: '😢' },
  { id: 'irritable', label: 'Irritable', icon: '😤' },
];

const CycleTracker = () => {
  const [enabled, setEnabled] = useState(false);
  const [todayLog, setTodayLog] = useState<CycleLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null);
  const [averageCycleLength, setAverageCycleLength] = useState(28);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [flowIntensity, setFlowIntensity] = useState<string>('');
  const [isPeriod, setIsPeriod] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchSettings();
    fetchTodayLog();
  }, []);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('enable_period_tracking, average_cycle_length, last_period_start')
      .eq('id', user.id)
      .single();

    if (data) {
      setEnabled(data.enable_period_tracking || false);
      setAverageCycleLength(data.average_cycle_length || 28);
      if (data.last_period_start) {
        setLastPeriodStart(new Date(data.last_period_start));
      }
    }
  };

  const fetchTodayLog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('cycle_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (data) {
        const log = {
          ...data,
          symptoms: (data.symptoms as string[]) || [],
        };
        setTodayLog(log);
        setSelectedSymptoms(log.symptoms);
        setSelectedMood(data.mood || '');
        setFlowIntensity(data.flow_intensity || '');
        setIsPeriod(data.period_start || false);
        setNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Error fetching cycle log:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ enable_period_tracking: value })
      .eq('id', user.id);

    setEnabled(value);
    toast({ title: value ? 'Period tracking enabled' : 'Period tracking disabled' });
  };

  const saveLog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const logData = {
        user_id: user.id,
        date: today,
        period_start: isPeriod,
        flow_intensity: isPeriod ? flowIntensity : null,
        symptoms: selectedSymptoms,
        mood: selectedMood,
        notes,
        cycle_day: lastPeriodStart ? differenceInDays(new Date(), lastPeriodStart) + 1 : null,
      };

      if (todayLog) {
        await supabase
          .from('cycle_logs')
          .update(logData)
          .eq('id', todayLog.id);
      } else {
        await supabase
          .from('cycle_logs')
          .insert(logData);
      }

      // Update last period start if this is a new period
      if (isPeriod && !todayLog?.period_start) {
        await supabase
          .from('profiles')
          .update({ last_period_start: today })
          .eq('id', user.id);
        setLastPeriodStart(new Date());
      }

      toast({ title: 'Cycle log saved!' });
      fetchTodayLog();
    } catch (error) {
      toast({ title: 'Error saving log', variant: 'destructive' });
    }
  };

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const getCyclePhase = () => {
    if (!lastPeriodStart) return null;
    const daysSince = differenceInDays(new Date(), lastPeriodStart);
    const cycleDay = (daysSince % averageCycleLength) + 1;

    if (cycleDay <= 5) return { phase: 'Menstrual', icon: <Droplets className="h-4 w-4 text-red-500" />, color: 'text-red-500' };
    if (cycleDay <= 13) return { phase: 'Follicular', icon: <Sun className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-500' };
    if (cycleDay <= 16) return { phase: 'Ovulation', icon: <Heart className="h-4 w-4 text-pink-500" />, color: 'text-pink-500' };
    return { phase: 'Luteal', icon: <Moon className="h-4 w-4 text-purple-500" />, color: 'text-purple-500' };
  };

  const getNextPeriodDate = () => {
    if (!lastPeriodStart) return null;
    return addDays(lastPeriodStart, averageCycleLength);
  };

  const cyclePhase = getCyclePhase();
  const nextPeriod = getNextPeriodDate();

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-pink-500" />
            <div>
              <h3 className="font-semibold">Period Tracking</h3>
              <p className="text-sm text-muted-foreground">Track your cycle for personalized insights</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={toggleEnabled} />
        </div>
      </Card>

      {enabled && (
        <>
          {/* Cycle Overview */}
          {cyclePhase && (
            <Card className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cyclePhase.icon}
                  <span className={`font-medium ${cyclePhase.color}`}>{cyclePhase.phase} Phase</span>
                </div>
                {nextPeriod && (
                  <div className="text-sm text-muted-foreground">
                    Next period: {format(nextPeriod, 'MMM d')}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Today's Log */}
          <Card className="p-4 space-y-4">
            <h4 className="font-medium">Log Today ({format(new Date(), 'MMM d')})</h4>

            {/* Period Toggle */}
            <div className="flex items-center justify-between">
              <Label>Period today?</Label>
              <Switch checked={isPeriod} onCheckedChange={setIsPeriod} />
            </div>

            {/* Flow Intensity */}
            {isPeriod && (
              <div className="space-y-2">
                <Label>Flow Intensity</Label>
                <Select value={flowIntensity} onValueChange={setFlowIntensity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light 💧</SelectItem>
                    <SelectItem value="medium">Medium 💧💧</SelectItem>
                    <SelectItem value="heavy">Heavy 💧💧💧</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Symptoms */}
            <div className="space-y-2">
              <Label>Symptoms</Label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((symptom) => (
                  <Button
                    key={symptom.id}
                    variant={selectedSymptoms.includes(symptom.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSymptom(symptom.id)}
                  >
                    {symptom.icon} {symptom.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <Label>Mood</Label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <Button
                    key={mood.id}
                    variant={selectedMood === mood.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMood(mood.id)}
                  >
                    {mood.icon} {mood.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button onClick={saveLog} className="w-full">
              Save Today's Log
            </Button>
          </Card>
        </>
      )}
    </div>
  );
};

export default CycleTracker;
