import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();

    if (!barcode) {
      throw new Error('No barcode provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up in our food database
    const { data: localFood, error: localError } = await supabase
      .from('food_database')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();

    if (localFood) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          source: 'local',
          food: localFood 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not found locally, try Open Food Facts API
    const offResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    
    if (!offResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Product not found' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const offData = await offResponse.json();

    if (offData.status === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Product not found in database' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const product = offData.product;
    const nutriments = product.nutriments || {};

    // Store in our database for future lookups
    const foodData = {
      barcode,
      food_name: product.product_name || 'Unknown Product',
      brand: product.brands || null,
      serving_size: product.serving_size || '100g',
      serving_unit: 'g',
      calories: nutriments['energy-kcal_100g'] || 0,
      protein_g: nutriments.proteins_100g || 0,
      carbs_g: nutriments.carbohydrates_100g || 0,
      fat_g: nutriments.fat_100g || 0,
      fiber_g: nutriments.fiber_100g || null,
      sugar_g: nutriments.sugars_100g || null,
      sodium_mg: nutriments.sodium_100g ? nutriments.sodium_100g * 1000 : null,
      data_source: 'openfoodfacts',
      verified: true,
    };

    await supabase.from('food_database').insert(foodData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        source: 'openfoodfacts',
        food: foodData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lookup-barcode:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});