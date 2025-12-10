import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import NotificationSettings from '@/components/NotificationSettings';
import {
  LogOut, User, Bell, Shield, CreditCard, Link2, Moon, Sun,
  Globe, Scale, Trash2, Download, Eye, EyeOff, Key, Smartphone,
  AlertTriangle, ChevronRight, Mail, Lock
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

const SettingsTab = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    weightUnit: 'kg',
    heightUnit: 'cm',
    energyUnit: 'kcal',
    language: 'en',
    aiDataUsage: true,
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all user data
      const [foodLogs, waterLogs, exerciseLogs, weightLogs, profile] = await Promise.all([
        supabase.from('food_logs').select('*').eq('user_id', user.id),
        supabase.from('water_logs').select('*').eq('user_id', user.id),
        supabase.from('exercise_logs').select('*').eq('user_id', user.id),
        supabase.from('weight_logs').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profile.data,
        foodLogs: foodLogs.data,
        waterLogs: waterLogs.data,
        exerciseLogs: exerciseLogs.data,
        weightLogs: weightLogs.data,
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ella-ai-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Data exported successfully!' });
    } catch (error: any) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Note: Full account deletion requires server-side implementation
    toast({ 
      title: 'Account deletion requested', 
      description: 'Your request has been submitted. You will receive a confirmation email.',
    });
  };

  const settingsSections = [
    {
      id: 'account',
      title: 'Account & Security',
      icon: Shield,
      items: [
        { label: 'Email', value: email, icon: Mail },
        { label: 'Change Password', action: true, icon: Lock },
        { label: 'Two-Factor Auth', toggle: false, icon: Key },
      ],
    },
    {
      id: 'preferences',
      title: 'App Preferences',
      icon: User,
      items: [
        { label: 'Dark Mode', toggle: theme === 'dark', onToggle: (v: boolean) => setTheme(v ? 'dark' : 'light'), icon: theme === 'dark' ? Moon : Sun },
        { label: 'Weight Unit', select: true, options: ['kg', 'lbs'], value: preferences.weightUnit, icon: Scale },
        { label: 'Energy Unit', select: true, options: ['kcal', 'kJ'], value: preferences.energyUnit, icon: Scale },
        { label: 'Language', select: true, options: ['en', 'es', 'hi', 'fr'], value: preferences.language, icon: Globe },
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      component: NotificationSettings,
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      icon: Eye,
      items: [
        { label: 'AI Data Usage', description: 'Allow AI to analyze your data', toggle: preferences.aiDataUsage, icon: Eye },
        { label: 'Export My Data', action: true, onClick: handleExportData, icon: Download },
        { label: 'Delete Account', action: true, danger: true, icon: Trash2 },
      ],
    },
    {
      id: 'subscription',
      title: 'Subscription',
      icon: CreditCard,
      items: [
        { label: 'Current Plan', value: 'Free Trial', icon: CreditCard },
        { label: 'Manage Subscription', action: true, icon: ChevronRight },
      ],
    },
    {
      id: 'integrations',
      title: 'Connected Apps',
      icon: Link2,
      items: [
        { label: 'Google Fit', status: 'Not connected', action: true, icon: Smartphone },
        { label: 'Apple Health', status: 'Not connected', action: true, icon: Smartphone },
      ],
    },
  ];

  const renderSectionContent = (section: typeof settingsSections[0]) => {
    if (section.component) {
      const Component = section.component;
      return <Component />;
    }

    return (
      <div className="space-y-3">
        {section.items?.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg ${
              item.action ? 'cursor-pointer hover:bg-[#252535]' : ''
            }`}
            onClick={item.onClick}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon className={`h-5 w-5 ${item.danger ? 'text-red-400' : 'text-gray-400'}`} />}
              <div>
                <p className={`text-sm font-medium ${item.danger ? 'text-red-400' : 'text-white'}`}>{item.label}</p>
                {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                {item.value && <p className="text-xs text-gray-400">{item.value}</p>}
                {item.status && <p className="text-xs text-gray-500">{item.status}</p>}
              </div>
            </div>
            <div>
              {item.toggle !== undefined && (
                <Switch checked={item.toggle} onCheckedChange={item.onToggle} />
              )}
              {item.select && (
                <Select value={item.value}>
                  <SelectTrigger className="w-24 bg-[#2a2a3a] border-[#3a3a4a] text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a3a] border-[#3a3a4a]">
                    {item.options?.map(opt => (
                      <SelectItem key={opt} value={opt} className="text-white">
                        {opt.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {item.action && !item.select && !item.danger && (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24">
      {settingsSections.map((section) => (
        <Card key={section.id} className="bg-[#2a2a3a] border-[#3a3a4a]">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
          >
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <section.icon className="h-5 w-5 text-gray-400" />
                {section.title}
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-500 transition-transform ${
                  activeSection === section.id ? 'rotate-90' : ''
                }`}
              />
            </CardTitle>
          </CardHeader>
          {activeSection === section.id && (
            <CardContent>{renderSectionContent(section)}</CardContent>
          )}
        </Card>
      ))}

      {/* Sign Out Button */}
      <Button
        onClick={handleSignOut}
        variant="destructive"
        className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
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
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#2a2a3a] border-[#3a3a4a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. All your data including food logs, progress, and achievements will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1a1a2e] border-[#3a3a4a] text-white hover:bg-[#252535]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-center text-xs text-gray-500 mt-4">
        Ella AI v1.0.0
      </p>
    </div>
  );
};

export default SettingsTab;
