import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (foodData: any) => void;
}

const BarcodeScanner = ({ open, onClose, onSuccess }: BarcodeScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setScanning(true);
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please enter barcode manually.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const lookupBarcode = async (barcode: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-barcode', {
        body: { barcode }
      });

      if (error) throw error;

      if (data.success) {
        onSuccess(data.food);
        toast({
          title: 'Product Found!',
          description: `${data.food.food_name} from ${data.source}`,
        });
        handleClose();
      } else {
        toast({
          title: 'Product Not Found',
          description: 'Try entering the nutrition information manually.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      toast({
        title: 'Error',
        description: 'Failed to lookup barcode',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setManualBarcode('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!scanning ? (
            <>
              <Button onClick={startCamera} className="w-full" size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Start Camera
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter barcode number"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <Button
                  onClick={() => lookupBarcode(manualBarcode)}
                  disabled={!manualBarcode || processing}
                  className="w-full"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    'Lookup Barcode'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-32 border-2 border-white rounded-lg" />
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Position barcode within the frame
              </p>

              <Button onClick={stopCamera} variant="outline" className="w-full">
                <X className="mr-2 h-4 w-4" />
                Cancel Scanning
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;