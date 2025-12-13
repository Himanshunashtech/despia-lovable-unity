import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Check if running in Despia native environment
const isDespia = () => /despia/.test(navigator.userAgent);

// Get Despia platform type
const getDespiaPlatform = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('despia-iphone') || ua.includes('despia-ipad')) return 'ios';
  if (ua.includes('despia-android')) return 'android';
  return 'unknown';
};

export const usePushNotifications = () => {
  const { toast } = useToast();

  const linkDeviceToUser = useCallback(async (userId: string) => {
    if (!isDespia()) {
      console.log('Not in Despia environment, skipping device linking');
      return;
    }

    try {
      // Import despia-native dynamically to avoid issues on web
      const despia = (await import('despia-native')).default;
      
      const deviceUUID = despia.uuid;
      const onesignalPlayerId = despia.onesignalplayerid;
      const platform = getDespiaPlatform();

      if (!deviceUUID) {
        console.log('No device UUID available');
        return;
      }

      console.log('Linking device to user:', { userId, deviceUUID, onesignalPlayerId, platform });

      // Upsert device info to database
      const { error } = await supabase
        .from('user_devices')
        .upsert(
          {
            user_id: userId,
            device_uuid: deviceUUID,
            onesignal_player_id: onesignalPlayerId || null,
            platform,
          },
          { onConflict: 'user_id,device_uuid' }
        );

      if (error) {
        console.error('Error linking device:', error);
        throw error;
      }

      console.log('Device linked successfully');
    } catch (error) {
      console.error('Failed to link device:', error);
    }
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (!isDespia()) {
      // Web fallback - request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    
    // In Despia, permissions are handled natively
    return true;
  }, []);

  return {
    isDespia: isDespia(),
    linkDeviceToUser,
    requestPushPermission,
  };
};
