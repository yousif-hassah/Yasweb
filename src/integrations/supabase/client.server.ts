// Server-side Supabase client with service role key — bypasses RLS.
// Use ONLY in server functions. Never import this in browser/client code.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Provide a no-op WebSocket stub so @supabase/supabase-js doesn't throw
// "Node.js 20 detected without native WebSocket support" when createClient()
// is called on the server.  This is pure JS — no Node.js-specific imports —
// so Vite's client bundler doesn't complain. Browsers always have native
// WebSocket, so this block never executes client-side.
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class NoopWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    readyState = 3; // CLOSED — we never actually open Realtime on server
    constructor(_url: string, _protocols?: string | string[]) {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return false; }
    send() {}
    close() {}
  };
}

function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_SERVICE_ROLE_KEY ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
    ];
    const message = `Missing Supabase env var(s): ${missing.join(', ')}. Set them in .env`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Import like: import { supabaseAdmin } from "@/integrations/supabase/client.server";
// SECURITY: service_role key bypasses RLS — server-side only, never expose to the browser.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
