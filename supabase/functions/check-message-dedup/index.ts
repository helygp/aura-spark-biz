import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth: shared secret header
    const agentKey = req.headers.get('x-agent-key')
    const expected = Deno.env.get('WHATSAPP_AGENT_KEY')
    if (!expected || agentKey !== expected) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const dedupKey =
      body && typeof body === 'object' && 'dedup_key' in body
        ? (body as Record<string, unknown>).dedup_key
        : undefined

    if (typeof dedupKey !== 'string' || dedupKey.length === 0 || dedupKey.length > 512) {
      return new Response(
        JSON.stringify({ error: 'dedup_key must be a non-empty string (<=512 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Atomic dedup: rely on PRIMARY KEY unique constraint.
    // Direct INSERT; if it conflicts (23505), it's a duplicate. No SELECT-then-INSERT.
    // TODO: cron job to DELETE FROM wa_message_dedup WHERE created_at < now() - interval '1 day'.
    const { error } = await supabase
      .from('wa_message_dedup')
      .insert({ dedup_key: dedupKey })

    if (error) {
      // Postgres unique_violation
      if (error.code === '23505') {
        console.log('[dedup] duplicate detected', { dedup_key: dedupKey })
        return new Response(JSON.stringify({ is_duplicate: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      console.error('[dedup] insert error', error)
      return new Response(JSON.stringify({ error: 'Database error', detail: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[dedup] new key stored', { dedup_key: dedupKey })
    return new Response(JSON.stringify({ is_duplicate: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[dedup] unexpected error', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})