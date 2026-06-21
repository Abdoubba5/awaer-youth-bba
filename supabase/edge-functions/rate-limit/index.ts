// ============================================================
// منصة وعي الشباب BBA - Rate Limit Edge Function
// IP-based server-side rate limiting using Supabase Edge Functions
// (Deno runtime with supabase-js)
//
// Deploy: supabase functions deploy rate-limit --no-verify-jwt
// Invoke: POST /functions/v1/rate-limit
//
// This Edge Function enforces rate limits using the client's
// real IP address (from x-forwarded-for header), which cannot
// be forged by the client — unlike client-passed identifiers.
//
// Actions: login, volunteer_registration, consultation,
//          certificate_verify, portal_login
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// CORS Headers
// ============================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================================
// Rate Limit Configuration (matching client-side js/rate-limiter.js)
// ============================================================
interface ActionConfig {
  maxAttempts: number
  windowMinutes: number
  cooldownSeconds: number
  dailyLimit: number
  backoffBaseMinutes: number
  maxBlockHours: number
}

const ACTION_CONFIGS: Record<string, ActionConfig> = {
  login:                    { maxAttempts: 5,  windowMinutes: 15, cooldownSeconds: 10, dailyLimit: 20, backoffBaseMinutes: 15, maxBlockHours: 24 },
  volunteer_registration:   { maxAttempts: 3,  windowMinutes: 60, cooldownSeconds: 30, dailyLimit: 10, backoffBaseMinutes: 60, maxBlockHours: 24 },
  consultation:             { maxAttempts: 5,  windowMinutes: 60, cooldownSeconds: 15, dailyLimit: 20, backoffBaseMinutes: 30, maxBlockHours: 12 },
  certificate_verify:       { maxAttempts: 10, windowMinutes: 15, cooldownSeconds: 5,  dailyLimit: 50, backoffBaseMinutes: 15, maxBlockHours: 6  },
  portal_login:             { maxAttempts: 5,  windowMinutes: 15, cooldownSeconds: 10, dailyLimit: 20, backoffBaseMinutes: 15, maxBlockHours: 24 },
}

// ============================================================
// Request / Response Types
// ============================================================
interface RateLimitRequest {
  action: string              // Required: which action to rate limit
  identifier?: string         // Optional: passed client identifier
  mode: 'check' | 'record' | 'reset' | 'backoff' | 'status'
}

interface RateLimitResponse {
  allowed?: boolean
  message?: string
  remaining?: number
  daily_remaining?: number
  blocked?: boolean
  blocked_until?: string
  block_count?: number
  server_enforced: boolean
  error?: string
}

// ============================================================
// Helper: resolve IP from request headers
// ============================================================
function getClientIP(request: Request): string {
  // x-forwarded-for is set by Supabase Edge Function gateway — trustworthy
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0].trim()
  }
  // Fallback to connecting IP
  const cfConnecting = request.headers.get('cf-connecting-ip')
  if (cfConnecting) return cfConnecting

  // Last resort
  const remoteAddr = request.headers.get('x-real-ip') || 'unknown'
  return remoteAddr
}

// ============================================================
// Handler
// ============================================================
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Parse request body
    const body: RateLimitRequest = await req.json()
    const { action, identifier, mode } = body

    // Validate action
    if (!action || !ACTION_CONFIGS[action]) {
      return new Response(JSON.stringify({
        error: `Invalid action. Supported: ${Object.keys(ACTION_CONFIGS).join(', ')}`,
        server_enforced: true,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Validate mode
    if (!mode || !['check', 'record', 'reset', 'backoff', 'status'].includes(mode)) {
      return new Response(JSON.stringify({
        error: 'Invalid mode. Supported: check, record, reset, backoff, status',
        server_enforced: true,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get client IP (trustworthy — set by Supabase gateway)
    const clientIP = getClientIP(req)

    // Create Supabase client with SERVICE_ROLE key for direct DB access
    // (Skips RLS on rate_limits table since we enforce deny all)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Use IP-based identifier that cannot be forged
    const ipIdentifier = `ip:${clientIP}`

    const cfg = ACTION_CONFIGS[action]
    const now = new Date().toISOString()

    // ============================================================
    // MODE: CHECK
    // ============================================================
    if (mode === 'check') {
      // Call the PostgreSQL function with IP-based identifier
      const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
        p_action_type: action,
        p_client_identifier: ipIdentifier,
        p_max_attempts: cfg.maxAttempts,
        p_window_minutes: cfg.windowMinutes,
        p_cooldown_seconds: cfg.cooldownSeconds,
        p_daily_limit: cfg.dailyLimit,
      })

      if (error) {
        // Server-side function not deployed — fall through to allow
        return new Response(JSON.stringify({
          allowed: true,
          server_enforced: false,
          message: 'Server-side rate limiting not available',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({
        allowed: data?.allowed ?? true,
        server_enforced: true,
        message: data?.message ?? '',
        remaining: data?.remaining ?? cfg.maxAttempts,
        daily_remaining: data?.daily_remaining ?? cfg.dailyLimit,
        blocked: data?.should_backoff === true || (data?.blocked_until ? new Date(data.blocked_until) > new Date() : false),
        blocked_until: data?.blocked_until ?? null,
        block_count: data?.block_count ?? 0,
        client_ip: clientIP,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ============================================================
    // MODE: RECORD
    // ============================================================
    if (mode === 'record') {
      await supabaseAdmin.rpc('record_rate_limit', {
        p_action_type: action,
        p_client_identifier: ipIdentifier,
      }).catch(() => {})

      return new Response(JSON.stringify({
        recorded: true,
        server_enforced: true,
        client_ip: clientIP,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ============================================================
    // MODE: RESET
    // ============================================================
    if (mode === 'reset') {
      await supabaseAdmin.rpc('reset_rate_limit', {
        p_action_type: action,
        p_client_identifier: ipIdentifier,
      }).catch(() => {})

      return new Response(JSON.stringify({
        reset: true,
        server_enforced: true,
        client_ip: clientIP,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ============================================================
    // MODE: BACKOFF
    // ============================================================
    if (mode === 'backoff') {
      await supabaseAdmin.rpc('backoff_rate_limit', {
        p_action_type: action,
        p_client_identifier: ipIdentifier,
        p_backoff_base_minutes: cfg.backoffBaseMinutes,
        p_max_block_hours: cfg.maxBlockHours,
      }).catch(() => {})

      return new Response(JSON.stringify({
        backoff_applied: true,
        server_enforced: true,
        client_ip: clientIP,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ============================================================
    // MODE: STATUS
    // ============================================================
    if (mode === 'status') {
      const { data, error } = await supabaseAdmin.rpc('get_rate_limit_status', {
        p_action_type: action,
        p_client_identifier: ipIdentifier,
        p_window_minutes: cfg.windowMinutes,
        p_max_attempts: cfg.maxAttempts,
        p_daily_limit: cfg.dailyLimit,
      })

      return new Response(JSON.stringify({
        server_enforced: !error,
        ...(data ?? {}),
        client_ip: clientIP,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Should never reach here due to mode validation above
    return new Response(JSON.stringify({ error: 'Unknown mode', server_enforced: true }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : 'Internal error',
      server_enforced: true,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
