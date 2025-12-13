import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import despia from 'despia-native';
import AccessibilitySettings from '@/components/AccessibilitySettings';
import MealTemplates from '@/components/MealTemplates';
import CycleTracker from '@/components/CycleTracker';
import ExpertCredentials from '@/components/ExpertCredentials';
import {
  LogOut, User, Bell, Shield, CreditCard, Link2, Moon, Sun,
  Globe, Scale, Trash2, Download, Eye, Key, Smartphone,
  AlertTriangle, ChevronRight, Mail, Lock, Clock, Droplet,
  Dumbbell, Crown, Zap, Accessibility, BookMarked, Heart
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Detect if running in Despia native environment
const isDespia = /despia/.test(navigator.userAgent);

const SettingsTab = () => {
  const [preferences, setPreferences] = useState({
    weightUnit: 'kg',
    heightUnit: 'cm',
    energyUnit: 'kcal',
    language: 'en',
    aiDataUsage: true,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    mealReminders: true,
    waterReminders: true,
    exerciseReminders: true,
    weightReminders: false,
    breakfastTime: '08:00',
    lunchTime: '12:00',
    dinnerTime: '19:00',
  });
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadUserData();
    loadNotificationSettings();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
    }
  };

  const loadNotificationSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setNotificationSettings({
        mealReminders: data.meal_reminders ?? true,
        waterReminders: data.water_reminders ?? true,
        exerciseReminders: data.exercise_reminders ?? true,
        weightReminders: data.weight_log_reminders ?? false,
        breakfastTime: data.breakfast_time || '08:00',
        lunchTime: data.lunch_time || '12:00',
        dinnerTime: data.dinner_time || '19:00',
      });
    }
  };

  const updateNotificationSetting = async (key: string, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dbKey = key === 'mealReminders' ? 'meal_reminders' :
                  key === 'waterReminders' ? 'water_reminders' :
                  key === 'exerciseReminders' ? 'exercise_reminders' :
                  key === 'weightReminders' ? 'weight_log_reminders' :
                  key === 'breakfastTime' ? 'breakfast_time' :
                  key === 'lunchTime' ? 'lunch_time' :
                  key === 'dinnerTime' ? 'dinner_time' : key;

    await supabase
      .from('notification_settings')
      .upsert({ user_id: user.id, [dbKey]: value });

    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleExportData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [foodLogs, waterLogs, exerciseLogs, weightLogs, profileData] = await Promise.all([
      supabase.from('food_logs').select('*').eq('user_id', user.id),
      supabase.from('water_logs').select('*').eq('user_id', user.id),
      supabase.from('exercise_logs').select('*').eq('user_id', user.id),
      supabase.from('weight_logs').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: profileData.data,
      foodLogs: foodLogs.data,
      waterLogs: waterLogs.data,
      exerciseLogs: exerciseLogs.data,
      weightLogs: weightLogs.data,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ella-ai-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleManageSubscription = () => {
    if (isDespia && profile?.revenue_cat_user_id) {
      // Open RevenueCat subscription management
      despia(`revenuecat://manage?external_id=${profile.revenue_cat_user_id}`);
    }
  };

  const handleRestorePurchases = () => {
    if (isDespia) {
      const userId = profile?.id || '';
      despia(`revenuecat://restore?external_id=${userId}`);
    }
  };

  const getSubscriptionLabel = () => {
    if (!profile) return 'Free';
    if (profile.subscription_tier === 'lifetime') return 'Lifetime';
    if (profile.subscription_tier === 'premium') return 'Premium';
    if (profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
      return 'Free Trial';
    }
    return 'Free';
  };

  return (
    <div className="space-y-4 pb-24" style={{ paddingTop: 'var(--safe-area-top, 0px)' }}>
      {/* Account & Security */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Account & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-xs text-muted-foreground">{email || 'Not set'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Change Password</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Two-Factor Auth</p>
            </div>
            <Switch checked={false} disabled />
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-primary" />
            App Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
            </div>
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} 
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Weight Unit</p>
            </div>
            <Select value={preferences.weightUnit} onValueChange={(v) => updatePreference('weightUnit', v)}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">KG</SelectItem>
                <SelectItem value="lbs">LBS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Energy Unit</p>
            </div>
            <Select value={preferences.energyUnit} onValueChange={(v) => updatePreference('energyUnit', v)}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kcal">KCAL</SelectItem>
                <SelectItem value="kJ">KJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Language</p>
            </div>
            <Select value={preferences.language} onValueChange={(v) => updatePreference('language', v)}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Meal Reminders</p>
                <p className="text-xs text-muted-foreground">Breakfast, Lunch, Dinner</p>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.mealReminders} 
              onCheckedChange={(v) => updateNotificationSetting('mealReminders', v)} 
            />
          </div>
          {notificationSettings.mealReminders && (
            <div className="ml-8 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Breakfast</Label>
                <Input 
                  type="time" 
                  value={notificationSettings.breakfastTime}
                  onChange={(e) => updateNotificationSetting('breakfastTime', e.target.value)}
                  className="w-24 h-8 text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Lunch</Label>
                <Input 
                  type="time" 
                  value={notificationSettings.lunchTime}
                  onChange={(e) => updateNotificationSetting('lunchTime', e.target.value)}
                  className="w-24 h-8 text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Dinner</Label>
                <Input 
                  type="time" 
                  value={notificationSettings.dinnerTime}
                  onChange={(e) => updateNotificationSetting('dinnerTime', e.target.value)}
                  className="w-24 h-8 text-xs"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Droplet className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Water Reminders</p>
            </div>
            <Switch 
              checked={notificationSettings.waterReminders} 
              onCheckedChange={(v) => updateNotificationSetting('waterReminders', v)} 
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Exercise Reminders</p>
            </div>
            <Switch 
              checked={notificationSettings.exerciseReminders} 
              onCheckedChange={(v) => updateNotificationSetting('exerciseReminders', v)} 
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Weight Log Reminders</p>
            </div>
            <Switch 
              checked={notificationSettings.weightReminders} 
              onCheckedChange={(v) => updateNotificationSetting('weightReminders', v)} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Eye className="h-5 w-5 text-primary" />
            Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">AI Data Usage</p>
                <p className="text-xs text-muted-foreground">Allow AI to analyze your data</p>
              </div>
            </div>
            <Switch 
              checked={preferences.aiDataUsage} 
              onCheckedChange={(v) => updatePreference('aiDataUsage', v)} 
            />
          </div>
          <div 
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70"
            onClick={handleExportData}
          >
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Export My Data</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-primary" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Current Plan</p>
                <p className="text-xs text-primary font-medium">{getSubscriptionLabel()}</p>
              </div>
            </div>
          </div>
          {isDespia && (
            <>
              <div 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70"
                onClick={handleManageSubscription}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Manage Subscription</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70"
                onClick={handleRestorePurchases}
              >
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Restore Purchases</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Connected Apps */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Link2 className="h-5 w-5 text-primary" />
            Connected Apps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Google Fit</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Apple Health</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <AccessibilitySettings />

      {/* Meal Templates */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <BookMarked className="h-5 w-5 text-primary" />
            Quick Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MealTemplates />
        </CardContent>
      </Card>

      {/* Women's Health */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Heart className="h-5 w-5 text-pink-500" />
            Women's Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CycleTracker />
        </CardContent>
      </Card>

      {/* Expert Credentials */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Professional Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpertCredentials />
        </CardContent>
      </Card>

      {/* Sign Out Button */}
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
        size="lg"
      >
        <LogOut className="mr-2 h-5 w-5" />
        Sign Out
      </Button>

      {/* Delete Account Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data including food logs, progress, and achievements will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-center text-xs text-muted-foreground mt-4" style={{ paddingBottom: 'var(--safe-area-bottom, 16px)' }}>
        Ella AI v1.0.0
      </p>
    </div>
  );
};

export default SettingsTab;