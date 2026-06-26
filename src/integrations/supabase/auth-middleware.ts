// Server-side middleware: extracts and validates the Supabase Bearer token
// from incoming server function requests.
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// No-op WebSocket stub for Node.js < 22 (no native WebSocket).
// Pure JS — no Node.js-specific imports — so Vite's client bundler is happy.
// Browsers always have native WebSocket, so this is unreachable client-side.
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class NoopWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    readyState = 3;
    constructor(_url: string, _protocols?: string | string[]) {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return false; }
    send() {}
    close() {}
  };
}

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      const missing = [
        ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
        ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
      ];
      throw new Error(
        `Missing Supabase env var(s): ${missing.join(', ')}. Set them in .env`,
      );
    }

    const request = getRequest();
    if (!request?.headers) throw new Error('Unauthorized: no request headers');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    if (!token) throw new Error('Unauthorized: empty token');

    // Per-request client scoped to this user's JWT
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    // Verify the token with Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user?.id) {
      throw new Error('Unauthorized: invalid or expired token');
    }

    return next({
      context: {
        supabase,
        userId: user.id,
        userEmail: user.email,
      },
    });
  },
);
