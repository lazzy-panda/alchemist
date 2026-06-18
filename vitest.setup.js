// Polyfill WebSocket for Node 20 (required by @supabase/realtime-js at import time)
import ws from 'ws';
globalThis.WebSocket = ws;
