import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Running in demo mode with mock client.');
}

// Create mock client if credentials are missing
const mockChannel = {
  on: function() { return this; },
  subscribe: function(callback) {
    if (typeof callback === 'function') callback('SUBSCRIBED');
    return this;
  },
  unsubscribe: () => Promise.resolve({ error: null }),
  send: () => Promise.resolve(),
};

const mockSupabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Demo mode') }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => {
    const queryBuilder = {
      select: function() { return this; },
      insert: function() { return this; },
      update: function() { return this; },
      delete: function() { return this; },
      eq: function() { return this; },
      order: function() { return this; },
      limit: function() { return this; },
      single: function() { return this; },
      then: function(resolve) {
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
      catch: function(reject) {
        return Promise.resolve({ data: [], error: null }).catch(reject);
      }
    };
    return queryBuilder;
  },
  channel: () => mockChannel,
  removeChannel: () => Promise.resolve('ok'),
  removeAllChannels: () => Promise.resolve([]),
  getChannels: () => [],
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;
