import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Award, GraduationCap, Shield, Stethoscope, Dumbbell, Edit2, Trash2 } from 'lucide-react';

interface Credential {
  id: string;
  credential_type: string;
  credential_name: string;
  institution: string | null;
  year_obtained: number | null;
  license_number: string | null;
  is_verified: boolean;
}

const CREDENTIAL_TYPES = [
  { value: 'nutritionist', label: 'Registered Nutritionist', icon: GraduationCap },
  { value: 'dietitian', label: 'Registered Dietitian', icon: Award },
  { value: 'doctor', label: 'Medical Doctor', icon: Stethoscope },
  { value: 'fitness_coach', label: 'Certified Fitness Coach', icon: Dumbbell },
];

const ExpertCredentials = () => {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({
    credential_type: 'nutritionist',
    credential_name: '',
    institution: '',
    year_obtained: new Date().getFullYear(),
    license_number: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCredential();
  }, []);

  const fetchCredential = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('expert_credentials')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setCredential(data);
        setFormData({
          credential_type: data.credential_type,
          credential_name: data.credential_name,
          institution: data.institution || '',
          year_obtained: data.year_obtained || new Date().getFullYear(),
          license_number: data.license_number || '',
        });
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCredential = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const credData = {
        user_id: user.id,
        ...formData,
        is_verified: false,
      };

      if (credential) {
        await supabase
          .from('expert_credentials')
          .update(credData)
          .eq('id', credential.id);
      } else {
        await supabase
          .from('expert_credentials')
          .insert(credData);
      }

      toast({ title: 'Credentials saved!' });
      setShowEdit(false);
      fetchCredential();
    } catch (error) {
      toast({ title: 'Error saving credentials', variant: 'destructive' });
    }
  };

  const deleteCredential = async () => {
    if (!credential) return;

    try {
      await supabase
        .from('expert_credentials')
        .delete()
        .eq('id', credential.id);

      toast({ title: 'Credentials removed' });
      setCredential(null);
      setFormData({
        credential_type: 'nutritionist',
        credential_name: '',
        institution: '',
        year_obtained: new Date().getFullYear(),
        license_number: '',
      });
    } catch (error) {
      toast({ title: 'Error removing credentials', variant: 'destructive' });
    }
  };

  const getTypeInfo = (type: string) => {
    return CREDENTIAL_TYPES.find(t => t.value === type) || CREDENTIAL_TYPES[0];
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Expert Credentials
        </h3>
      </div>

      {credential ? (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {(() => {
                const TypeIcon = getTypeInfo(credential.credential_type).icon;
                return <TypeIcon className="h-8 w-8 text-primary mt-1" />;
              })()}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{credential.credential_name}</h4>
                  <Badge variant={credential.is_verified ? 'default' : 'secondary'}>
                    {credential.is_verified ? '✓ Verified' : 'Self-declared'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getTypeInfo(credential.credential_type).label}
                </p>
                {credential.institution && (
                  <p className="text-sm text-muted-foreground">{credential.institution}</p>
                )}
                {credential.year_obtained && (
                  <p className="text-sm text-muted-foreground">Obtained: {credential.year_obtained}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => setShowEdit(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={deleteCredential}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No credentials added</p>
          <p className="text-sm text-muted-foreground mb-4">
            Are you a nutrition professional? Add your credentials to display a badge on your profile.
          </p>
          <Button onClick={() => setShowEdit(true)}>
            Add Credentials
          </Button>
        </Card>
      )}

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{credential ? 'Edit' : 'Add'} Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Credential Type</Label>
              <Select
                value={formData.credential_type}
                onValueChange={(value) => setFormData({ ...formData, credential_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREDENTIAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Credential/Certification Name</Label>
              <Input
                placeholder="e.g., RD, CNS, MD, NASM-CPT"
                value={formData.credential_name}
                onChange={(e) => setFormData({ ...formData, credential_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Institution (Optional)</Label>
              <Input
                placeholder="e.g., Academy of Nutrition and Dietetics"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Year Obtained</Label>
                <Input
                  type="number"
                  value={formData.year_obtained}
                  onChange={(e) => setFormData({ ...formData, year_obtained: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>License # (Optional)</Label>
                <Input
                  placeholder="License number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: Credentials are self-declared and displayed as "Self-declared" badge. 
              Verification by admin may be available in the future.
            </p>

            <Button onClick={saveCredential} disabled={!formData.credential_name} className="w-full">
              Save Credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertCredentials;
