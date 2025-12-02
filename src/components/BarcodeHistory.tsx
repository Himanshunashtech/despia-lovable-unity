import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { History, Loader2 } from 'lucide-react';

interface BarcodeHistoryProps {
  open: boolean;
  onClose: () => void;
  onRescan: (barcode: string) => void;
}

interface BarcodeHistoryItem {
  id: string;
  barcode: string;
  food_name: string;
  brand: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  serving_size: string | null;
  scan_count: number;
  last_scanned_at: string;
}

const BarcodeHistory = ({ open, onClose, onRescan }: BarcodeHistoryProps) => {
  const [history, setHistory] = useState<BarcodeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('barcode_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_scanned_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setHistory(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load barcode history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = (barcode: string) => {
    onRescan(barcode);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Barcode History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No barcode history yet</p>
            <p className="text-sm mt-2">Scanned items will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.food_name}</h3>
                    {item.brand && (
                      <p className="text-sm text-muted-foreground">{item.brand}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRescan(item.barcode)}
                    className="ml-2"
                  >
                    Rescan
                  </Button>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-sm mb-2">
                  <div>
                    <p className="text-muted-foreground">Calories</p>
                    <p className="font-medium">{item.calories || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Protein</p>
                    <p className="font-medium">{item.protein || 0}g</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Carbs</p>
                    <p className="font-medium">{item.carbs || 0}g</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fat</p>
                    <p className="font-medium">{item.fat || 0}g</p>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Scanned {item.scan_count} time(s)</span>
                  <span>{new Date(item.last_scanned_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeHistory;
