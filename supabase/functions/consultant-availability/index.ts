
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Verify user is a consultant
    const { data: userRole } = await supabaseClient
      .from('user_master')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'consultant') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Consultant role required.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    if (req.method === 'GET') {
      // Get consultant's slots
      const { data, error } = await supabaseClient
        .from('consultant_availability_slots')
        .select('*')
        .eq('consultant_user_id', user.id)
        .order('slot_start_time', { ascending: true })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      return new Response(
        JSON.stringify({ slots: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      const { startDate, endDate, startTime, endTime, slotDurationMinutes = 60 } = await req.json()

      // Generate slots for the time block
      const slots = []
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)
      
      let current = new Date(start)
      while (current < end) {
        const slotEnd = new Date(current.getTime() + slotDurationMinutes * 60000)
        if (slotEnd <= end) {
          slots.push({
            consultant_user_id: user.id,
            slot_start_time: current.toISOString(),
            slot_end_time: slotEnd.toISOString()
          })
        }
        current = slotEnd
      }

      const { data, error } = await supabaseClient
        .from('consultant_availability_slots')
        .insert(slots)
        .select()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, slots: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const slotId = url.pathname.split('/').pop()

      const { error } = await supabaseClient
        .from('consultant_availability_slots')
        .delete()
        .eq('id', slotId)
        .eq('consultant_user_id', user.id)
        .is('booked_by_customer_choice_id', null)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
