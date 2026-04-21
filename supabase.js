const SUPABASE_URL  = 'https://iqukhrquzxjubsqzyfrd.supabase.co';
const SUPABASE_ANON = 'sb_publishable_wjP8T8ECgvZxrDeyR8DaBg_9hcHFfTQ';

// Minimal Supabase REST client (no SDK needed)
const db = {
  async getRoom(code) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rooms?code=eq.${encodeURIComponent(code)}&select=*`,
      { headers: headers() }
    );
    const rows = await res.json();
    return rows[0] ?? null;
  },

  async createRoom(code) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rooms`, {
      method: 'POST',
      headers: { ...headers(), 'Prefer': 'return=representation' },
      body: JSON.stringify({ code, squares: [] })
    });
    const rows = await res.json();
    return rows[0] ?? null;
  },

  async updateSquares(code, squares) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rooms?code=eq.${encodeURIComponent(code)}`,
      {
        method: 'PATCH',
        headers: { ...headers(), 'Prefer': 'return=representation' },
        body: JSON.stringify({ squares })
      }
    );
    return res.ok;
  }
};

function headers() {
  return {
    'apikey': SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
    'Content-Type': 'application/json'
  };
}
