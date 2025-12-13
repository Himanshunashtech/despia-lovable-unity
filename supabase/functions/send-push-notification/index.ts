import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationRequest {
  user_id?: string
  player_ids?: string[]
  title: string
  message: string
  data?: Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const onesignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const onesignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!onesignalAppId || !onesignalApiKey) {
      console.log('OneSignal not configured, skipping push notification')
      return new Response(
        JSON.stringify({ success: false, message: 'OneSignal not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { user_id, player_ids, title, message, data }: PushNotificationRequest = await req.json()

    let targetPlayerIds = player_ids || []

    // If user_id provided, look up their devices
    if (user_id && targetPlayerIds.length === 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: devices, error } = await supabase
        .from('user_devices')
        .select('onesignal_player_id')
        .eq('user_id', user_id)
        .not('onesignal_player_id', 'is', null)

      if (error) {
        console.error('Error fetching user devices:', error)
        throw error
      }

      targetPlayerIds = devices
        ?.map(d => d.onesignal_player_id)
        .filter((id): id is string => !!id) || []
    }

    if (targetPlayerIds.length === 0) {
      console.log('No target devices found for push notification')
      return new Response(
        JSON.stringify({ success: false, message: 'No target devices found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending push notification to ${targetPlayerIds.length} devices`)

    // Send via OneSignal REST API
    const onesignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${onesignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: onesignalAppId,
        include_player_ids: targetPlayerIds,
        headings: { en: title },
        contents: { en: message },
        data: data || {},
      }),
    })

    const onesignalResult = await onesignalResponse.json()

    if (!onesignalResponse.ok) {
      console.error('OneSignal API error:', onesignalResult)
      throw new Error(onesignalResult.errors?.[0] || 'OneSignal API error')
    }

    console.log('Push notification sent successfully:', onesignalResult)

    return new Response(
      JSON.stringify({ success: true, result: onesignalResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error sending push notification:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
