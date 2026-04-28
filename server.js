const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ── CREDENTIALS ─────────────────────────────────────────────
const META_ACCESS_TOKEN    = process.env.META_ACCESS_TOKEN;
const META_AD_ACCOUNT_ID   = process.env.META_AD_ACCOUNT_ID;
const GOOGLE_DEVELOPER_TOKEN = process.env.GOOGLE_DEVELOPER_TOKEN;
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_CUSTOMER_ID   = process.env.GOOGLE_CUSTOMER_ID;
const SNAP_CLIENT_ID       = process.env.SNAP_CLIENT_ID;
const SNAP_CLIENT_SECRET   = process.env.SNAP_CLIENT_SECRET;
const SNAP_REFRESH_TOKEN   = process.env.SNAP_REFRESH_TOKEN;
const SNAP_AD_ACCOUNT_ID   = process.env.SNAP_AD_ACCOUNT_ID;

const getMetaId = () => (META_AD_ACCOUNT_ID || '').replace('act_', '');

app.get('/ping', (req, res) => res.send('OK'));

// Debug — check env vars are loaded (safe, only shows first 10 chars)
app.get('/debug', (req, res) => {
  res.json({
    meta_token: META_ACCESS_TOKEN ? META_ACCESS_TOKEN.slice(0,10)+'...' : 'MISSING',
    meta_account: META_AD_ACCOUNT_ID || 'MISSING',
    google_dev_token: GOOGLE_DEVELOPER_TOKEN ? GOOGLE_DEVELOPER_TOKEN.slice(0,8)+'...' : 'MISSING',
    google_customer_id: GOOGLE_CUSTOMER_ID || 'MISSING',
    google_client_id: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.slice(0,20)+'...' : 'MISSING',
    google_client_secret: GOOGLE_CLIENT_SECRET ? GOOGLE_CLIENT_SECRET.slice(0,8)+'...' : 'MISSING',
    google_refresh_token: GOOGLE_REFRESH_TOKEN ? GOOGLE_REFRESH_TOKEN.slice(0,15)+'...' : 'MISSING',
    snap_client_id: SNAP_CLIENT_ID ? SNAP_CLIENT_ID.slice(0,8)+'...' : 'MISSING',
    snap_client_secret: SNAP_CLIENT_SECRET ? SNAP_CLIENT_SECRET.slice(0,8)+'...' : 'MISSING',
    snap_refresh_token: SNAP_REFRESH_TOKEN ? SNAP_REFRESH_TOKEN.slice(0,15)+'...' : 'MISSING',
    snap_ad_account_id: SNAP_AD_ACCOUNT_ID || 'MISSING',
  });
});

// Snapchat OAuth — Step 1: redirect to Snapchat login
app.get('/snap-auth', (req, res) => {
  const url = `https://accounts.snapchat.com/login/oauth2/authorize?client_id=${SNAP_CLIENT_ID}&redirect_uri=https://reprise-ads.onrender.com/snap-callback&response_type=code&scope=snapchat-marketing-api`;
  res.redirect(url);
});

// Snapchat OAuth — Step 2: exchange code for refresh token
app.get('/snap-callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.send('No code received');
  try {
    const r = await axios.post('https://accounts.snapchat.com/login/oauth2/access_token',
      new URLSearchParams({
        client_id: SNAP_CLIENT_ID,
        client_secret: SNAP_CLIENT_SECRET,
        code,
        redirect_uri: 'https://reprise-ads.onrender.com/snap-callback',
        grant_type: 'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, refresh_token, expires_in } = r.data;
    res.send(`
      <h2>✅ Snapchat Connected!</h2>
      <p><b>Add this to Render as SNAP_REFRESH_TOKEN:</b></p>
      <textarea rows="3" cols="80" onclick="this.select()">${refresh_token}</textarea>
      <p>Access token (expires in ${expires_in}s): ${access_token?.slice(0,30)}...</p>
    `);
  } catch (e) {
    res.send(`Error: ${JSON.stringify(e.response?.data || e.message)}`);
  }
});

// ── GOOGLE HELPERS ────────────────────────────────────────────
async function getGoogleToken() {
  const r = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token',
  });
  return r.data.access_token;
}
function googleDateRange(preset, since, until) {
  const today = new Date();
  const fmt = d => d.toISOString().slice(0, 10);
  if (since && until) return `BETWEEN '${since}' AND '${until}'`;
  const days = { today: 0, last_7d: 7, last_14d: 14, last_30d: 30, last_60d: 60, last_90d: 90 }[preset] ?? 30;
  if (days === 0) return `= '${fmt(today)}'`;
  const from = new Date(today); from.setDate(from.getDate() - days);
  return `BETWEEN '${fmt(from)}' AND '${fmt(today)}'`;
}
async function googleQuery(query) {
  const token = await getGoogleToken();
  const cid = (GOOGLE_CUSTOMER_ID || '').replace(/-/g, '');
  const r = await axios.post(
    `https://googleads.googleapis.com/v17/customers/${cid}/googleAds:search`,
    { query },
    { headers: { Authorization: `Bearer ${token}`, 'developer-token': GOOGLE_DEVELOPER_TOKEN, 'Content-Type': 'application/json' } }
  );
  return r.data.results || [];
}

// ── SNAPCHAT HELPERS ──────────────────────────────────────────
let snapTokenCache = null;
async function getSnapToken() {
  if (snapTokenCache && snapTokenCache.expires > Date.now()) return snapTokenCache.token;
  const r = await axios.post('https://accounts.snapchat.com/login/oauth2/access_token',
    new URLSearchParams({
      client_id: SNAP_CLIENT_ID, client_secret: SNAP_CLIENT_SECRET,
      refresh_token: SNAP_REFRESH_TOKEN, grant_type: 'refresh_token',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  snapTokenCache = { token: r.data.access_token, expires: Date.now() + (r.data.expires_in - 60) * 1000 };
  return snapTokenCache.token;
}
function snapDateRange(preset, since, until) {
  const today = new Date();
  const fmt = d => d.toISOString().slice(0, 10);
  if (since && until) return { start_time: since, end_time: until };
  const days = { today: 0, last_7d: 7, last_14d: 14, last_30d: 30, last_60d: 60, last_90d: 90 }[preset] ?? 30;
  const from = new Date(today); from.setDate(from.getDate() - Math.max(days, 1));
  return { start_time: fmt(from), end_time: fmt(today) };
}

// ── META ENDPOINTS ────────────────────────────────────────────
app.get('/api/campaigns', async (req, res) => {
  try {
    const r = await axios.get(`https://graph.facebook.com/v19.0/act_${getMetaId()}/campaigns`, {
      params: { access_token: META_ACCESS_TOKEN, fields: 'id,name,status,daily_budget,lifetime_budget,objective,start_time,stop_time,created_time,updated_time,budget_remaining,buying_type', limit: 100 }
    });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.response?.data?.error?.message || e.message }); }
});

app.get('/api/insights', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas,outbound_clicks',
      level: 'campaign', limit: 100,
    };
    if (date_since && date_until) params.time_range = JSON.stringify({ since: date_since, until: date_until });
    else params.date_preset = date_preset && date_preset !== 'custom' ? date_preset : 'last_30d';
    const r = await axios.get(`https://graph.facebook.com/v19.0/act_${getMetaId()}/insights`, { params });
    const data = (r.data.data || []).map(row => {
      const spend = parseFloat(row.spend || 0);
      const nr = row.purchase_roas?.[0]?.value ? parseFloat(row.purchase_roas[0].value) : null;
      const pv = (row.action_values || []).find(a => a.action_type === 'purchase')?.value;
      const ov = (row.action_values || []).find(a => a.action_type === 'omni_purchase')?.value;
      const roas = nr || (pv && spend > 0 ? parseFloat(pv) / spend : null) || (ov && spend > 0 ? parseFloat(ov) / spend : null);
      const revenue = pv ? parseFloat(pv) : ov ? parseFloat(ov) : nr && spend > 0 ? nr * spend : null;
      return { ...row, roas, revenue };
    });
    res.json({ ...r.data, data });
  } catch (e) { res.status(500).json({ error: e.response?.data?.error?.message || e.message }); }
});

app.get('/api/campaigns/:id/insights', async (req, res) => {
  try {
    const { id } = req.params; const { date_preset, date_since, date_until } = req.query;
    const params = { access_token: META_ACCESS_TOKEN, fields: 'campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas', level: 'campaign' };
    if (date_since && date_until) params.time_range = JSON.stringify({ since: date_since, until: date_until });
    else params.date_preset = date_preset && date_preset !== 'custom' ? date_preset : 'last_30d';
    const r = await axios.get(`https://graph.facebook.com/v19.0/${id}/insights`, { params });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.response?.data?.error?.message || e.message }); }
});

app.get('/api/campaigns/:id/daily', async (req, res) => {
  try {
    const { id } = req.params; const { date_preset, date_since, date_until } = req.query;
    const params = { access_token: META_ACCESS_TOKEN, fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas', time_increment: 1, limit: 90 };
    if (date_since && date_until) params.time_range = JSON.stringify({ since: date_since, until: date_until });
    else params.date_preset = date_preset && date_preset !== 'custom' ? date_preset : 'last_30d';
    const r = await axios.get(`https://graph.facebook.com/v19.0/${id}/insights`, { params });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.response?.data?.error?.message || e.message }); }
});

app.get('/api/campaigns/:id/adsets', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await axios.get(`https://graph.facebook.com/v19.0/${id}/adsets`, {
      params: { access_token: META_ACCESS_TOKEN, fields: 'id,name,status,daily_budget,lifetime_budget,billing_event,optimization_goal,start_time,end_time', limit: 50 }
    });
    res.json({ adsets: r.data.data || [] });
  } catch (e) { res.status(500).json({ error: e.response?.data?.error?.message || e.message }); }
});

// ── GOOGLE ADS ENDPOINTS ──────────────────────────────────────
app.get('/api/google/campaigns', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    const dr = googleDateRange(date_preset, date_since, date_until);
    const results = await googleQuery(`
      SELECT campaign.id,campaign.name,campaign.status,campaign.advertising_channel_type,
        campaign_budget.amount_micros,metrics.cost_micros,metrics.impressions,metrics.clicks,
        metrics.ctr,metrics.average_cpc,metrics.average_cpm,metrics.conversions,metrics.conversions_value
      FROM campaign WHERE segments.date ${dr} AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC LIMIT 100`);
    const data = results.map(r => {
      const spend = r.metrics?.costMicros ? parseInt(r.metrics.costMicros) / 1e6 : 0;
      const revenue = parseFloat(r.metrics?.conversionsValue || 0);
      return {
        id: r.campaign?.id, name: r.campaign?.name, status: r.campaign?.status,
        channel: r.campaign?.advertisingChannelType,
        daily_budget: r.campaignBudget?.amountMicros ? parseInt(r.campaignBudget.amountMicros) / 1e6 : null,
        spend, impressions: parseInt(r.metrics?.impressions || 0),
        clicks: parseInt(r.metrics?.clicks || 0),
        ctr: parseFloat(r.metrics?.ctr || 0) * 100,
        cpc: r.metrics?.averageCpc ? parseInt(r.metrics.averageCpc) / 1e6 : 0,
        cpm: r.metrics?.averageCpm ? parseInt(r.metrics.averageCpm) / 1e6 : 0,
        conversions: parseFloat(r.metrics?.conversions || 0),
        revenue, roas: revenue > 0 && spend > 0 ? revenue / spend : null, platform: 'google',
      };
    });
    res.json({ data });
  } catch (e) { console.error('Google campaigns:', e.message); res.status(500).json({ error: e.message, data: [] }); }
});

app.get('/api/google/insights', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    const dr = googleDateRange(date_preset, date_since, date_until);
    const results = await googleQuery(`
      SELECT metrics.cost_micros,metrics.impressions,metrics.clicks,metrics.ctr,
        metrics.average_cpc,metrics.average_cpm,metrics.conversions,metrics.conversions_value
      FROM customer WHERE segments.date ${dr}`);
    const t = results.reduce((a, r) => {
      a.spend += r.metrics?.costMicros ? parseInt(r.metrics.costMicros) / 1e6 : 0;
      a.impressions += parseInt(r.metrics?.impressions || 0);
      a.clicks += parseInt(r.metrics?.clicks || 0);
      a.conversions += parseFloat(r.metrics?.conversions || 0);
      a.conversion_value += parseFloat(r.metrics?.conversionsValue || 0);
      return a;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversion_value: 0 });
    t.ctr = t.impressions > 0 ? t.clicks / t.impressions * 100 : 0;
    t.cpc = t.clicks > 0 ? t.spend / t.clicks : 0;
    t.cpm = t.impressions > 0 ? t.spend / t.impressions * 1000 : 0;
    t.roas = t.spend > 0 && t.conversion_value > 0 ? t.conversion_value / t.spend : null;
    t.revenue = t.conversion_value;
    res.json({ data: t });
  } catch (e) { console.error('Google insights:', e.message); res.status(500).json({ error: e.message, data: null }); }
});

// ── SNAPCHAT ENDPOINTS ────────────────────────────────────────
app.get('/api/snapchat/campaigns', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    const token = await getSnapToken();
    const adAccountId = SNAP_AD_ACCOUNT_ID;
    // Get campaigns
    const campRes = await axios.get(
      `https://adsapi.snapchat.com/v1/adaccounts/${adAccountId}/campaigns`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const campaigns = (campRes.data.campaigns || []).map(c => c.campaign);
    // Get stats for each campaign
    const dr = snapDateRange(date_preset, date_since, date_until);
    const statsRes = await axios.get(
      `https://adsapi.snapchat.com/v1/adaccounts/${adAccountId}/stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          granularity: 'TOTAL', fields: 'impressions,swipes,spend,video_views,conversion_purchases,conversion_purchases_value',
          start_time: dr.start_time, end_time: dr.end_time, breakdown: 'campaign',
        }
      }
    );
    const statsMap = {};
    (statsRes.data.total_stats || []).forEach(s => {
      const id = s.breakdown_stats?.campaign?.id;
      if (id) statsMap[id] = s.total_stat?.stats || {};
    });
    const data = campaigns.map(c => {
      const s = statsMap[c.id] || {};
      const spend = (s.spend || 0) / 1e6;
      const revenue = s.conversion_purchases_value || 0;
      const clicks = s.swipes || 0;
      const impressions = s.impressions || 0;
      return {
        id: c.id, name: c.name, status: c.status,
        daily_budget: c.daily_budget_micro ? c.daily_budget_micro / 1e6 : null,
        spend, impressions, clicks,
        ctr: impressions > 0 ? clicks / impressions * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpm: impressions > 0 ? spend / impressions * 1000 : 0,
        conversions: s.conversion_purchases || 0,
        revenue, roas: revenue > 0 && spend > 0 ? revenue / spend : null,
        platform: 'snapchat',
      };
    });
    res.json({ data });
  } catch (e) { console.error('Snap campaigns:', e.response?.data || e.message); res.status(500).json({ error: e.message, data: [] }); }
});

app.get('/api/snapchat/insights', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    const token = await getSnapToken();
    const dr = snapDateRange(date_preset, date_since, date_until);
    const r = await axios.get(
      `https://adsapi.snapchat.com/v1/adaccounts/${SNAP_AD_ACCOUNT_ID}/stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          granularity: 'TOTAL', fields: 'impressions,swipes,spend,video_views,conversion_purchases,conversion_purchases_value',
          start_time: dr.start_time, end_time: dr.end_time,
        }
      }
    );
    const s = r.data.total_stats?.[0]?.total_stat?.stats || {};
    const spend = (s.spend || 0) / 1e6;
    const revenue = s.conversion_purchases_value || 0;
    const clicks = s.swipes || 0;
    const impressions = s.impressions || 0;
    res.json({ data: {
      spend, revenue, impressions, clicks,
      ctr: impressions > 0 ? clicks / impressions * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpm: impressions > 0 ? spend / impressions * 1000 : 0,
      conversions: s.conversion_purchases || 0,
      roas: revenue > 0 && spend > 0 ? revenue / spend : null,
    }});
  } catch (e) { console.error('Snap insights:', e.response?.data || e.message); res.status(500).json({ error: e.message, data: null }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Reprise Ads v5 — Meta + Google + Snapchat on port ${PORT}`));
