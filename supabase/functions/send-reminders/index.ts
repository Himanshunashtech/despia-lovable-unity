import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationSetting {
  user_id: string
  meal_reminders: boolean
  water_reminders: boolean
  exercise_reminders: boolean
  weight_log_reminders: boolean
  breakfast_time: string
  lunch_time: string
  dinner_time: string
  snack_time: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current time in HH:MM format
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    
    // We check notifications within a 5-minute window
    const timeWindows: string[] = []
    for (let i = -2; i <= 2; i++) {
      const checkMinute = (currentMinute + i + 60) % 60
      const checkHour = currentMinute + i < 0 ? (currentHour - 1 + 24) % 24 : 
                        currentMinute + i >= 60 ? (currentHour + 1) % 24 : currentHour
      timeWindows.push(`${String(checkHour).padStart(2, '0')}:${String(checkMinute).padStart(2, '0')}`)
    }

    console.log('Checking notifications for time windows:', timeWindows)

    // Fetch all notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')

    if (settingsError) {
      throw settingsError
    }

    const notificationsToSend: { user_id: string; title: string; message: string; type: string }[] = []

    for (const setting of settings || []) {
      // Check meal reminders
      if (setting.meal_reminders) {
        if (timeWindows.includes(setting.breakfast_time?.substring(0, 5))) {
          notificationsToSend.push({
            user_id: setting.user_id,
            title: '🌅 Breakfast Time!',
            message: "Good morning! Don't forget to log your breakfast.",
            type: 'meal_reminder'
          })
        }
        if (timeWindows.includes(setting.lunch_time?.substring(0, 5))) {
          notificationsToSend.push({
            user_id: setting.user_id,
            title: '☀️ Lunch Time!',
            message: "It's lunch time! Remember to log what you eat.",
            type: 'meal_reminder'
          })
        }
        if (timeWindows.includes(setting.dinner_time?.substring(0, 5))) {
          notificationsToSend.push({
            user_id: setting.user_id,
            title: '🌙 Dinner Time!',
            message: "Dinner time! Don't forget to track your evening meal.",
            type: 'meal_reminder'
          })
        }
      }

      // Water reminders - send every 2 hours during waking hours (8am-10pm)
      if (setting.water_reminders && currentHour >= 8 && currentHour <= 22 && currentHour % 2 === 0 && currentMinute < 5) {
        notificationsToSend.push({
          user_id: setting.user_id,
          title: '💧 Stay Hydrated!',
          message: 'Time for a glass of water. Keep up with your hydration goals!',
          type: 'water_reminder'
        })
      }

      // Exercise reminder - send at 6pm if enabled
      if (setting.exercise_reminders && currentHour === 18 && currentMinute < 5) {
        notificationsToSend.push({
          user_id: setting.user_id,
          title: '💪 Exercise Reminder',
          message: 'Have you logged your workout today? Stay active!',
          type: 'exercise_reminder'
        })
      }

      // Weight log reminder - send at 8am if enabled
      if (setting.weight_log_reminders && currentHour === 8 && currentMinute < 5) {
        notificationsToSend.push({
          user_id: setting.user_id,
          title: '⚖️ Weigh-In Reminder',
          message: 'Good morning! Log your weight to track your progress.',
          type: 'weight_reminder'
        })
      }
    }

    console.log(`Sending ${notificationsToSend.length} notifications`)

    // Insert notifications into the database
    if (notificationsToSend.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationsToSend)

      if (insertError) {
        console.error('Error inserting notifications:', insertError)
        throw insertError
      }

      // Send push notifications via OneSignal for each user
      const onesignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
      const onesignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')
      
      if (onesignalAppId && onesignalApiKey) {
        const userIds = [...new Set(notificationsToSend.map(n => n.user_id))]
        
        for (const userId of userIds) {
          const userNotifications = notificationsToSend.filter(n => n.user_id === userId)
          const latestNotification = userNotifications[userNotifications.length - 1]
          
          // Get user's devices
          const { data: devices } = await supabase
            .from('user_devices')
            .select('onesignal_player_id')
            .eq('user_id', userId)
            .not('onesignal_player_id', 'is', null)
          
          const playerIds = devices?.map(d => d.onesignal_player_id).filter(Boolean) || []
          
          if (playerIds.length > 0) {
            try {
              await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Basic ${onesignalApiKey}`,
                },
                body: JSON.stringify({
                  app_id: onesignalAppId,
                  include_player_ids: playerIds,
                  headings: { en: latestNotification.title },
                  contents: { en: latestNotification.message },
                }),
              })
              console.log(`Push sent to user ${userId} on ${playerIds.length} devices`)
            } catch (pushError) {
              console.error(`Push failed for user ${userId}:`, pushError)
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: notificationsToSend.length,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in send-reminders:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})