import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Accessibility, Eye, Zap, Type } from 'lucide-react';

const AccessibilitySettings = () => {
  const [settings, setSettings] = useState({
    accessibility_large_text: false,
    accessibility_high_contrast: false,
    accessibility_reduce_motion: false,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement;
    
    if (settings.accessibility_large_text) {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }

    if (settings.accessibility_high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.accessibility_reduce_motion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('accessibility_large_text, accessibility_high_contrast, accessibility_reduce_motion')
        .eq('id', user.id)
        .single();

      if (data) {
        setSettings({
          accessibility_large_text: data.accessibility_large_text || false,
          accessibility_high_contrast: data.accessibility_high_contrast || false,
          accessibility_reduce_motion: data.accessibility_reduce_motion || false,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('id', user.id);

      toast({ title: 'Setting updated' });
    } catch (error) {
      toast({ title: 'Error updating setting', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Accessibility className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Accessibility</h3>
      </div>

      <Card className="divide-y">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Type className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="font-medium">Large Text</Label>
              <p className="text-sm text-muted-foreground">Increase text size throughout the app</p>
            </div>
          </div>
          <Switch
            checked={settings.accessibility_large_text}
            onCheckedChange={(checked) => updateSetting('accessibility_large_text', checked)}
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="font-medium">High Contrast</Label>
              <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
            </div>
          </div>
          <Switch
            checked={settings.accessibility_high_contrast}
            onCheckedChange={(checked) => updateSetting('accessibility_high_contrast', checked)}
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="font-medium">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
            </div>
          </div>
          <Switch
            checked={settings.accessibility_reduce_motion}
            onCheckedChange={(checked) => updateSetting('accessibility_reduce_motion', checked)}
          />
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        These settings help make the app more accessible for users with visual or motion sensitivities.
      </p>
    </div>
  );
};

export default AccessibilitySettings;
