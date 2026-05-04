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
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const SHOPIFY_API_KEY      = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET   = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_STORE        = process.env.SHOPIFY_STORE || 'reprise-official.myshopify.com';
let   SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || null;

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
    anthropic_key: ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.slice(0,10)+'...' : 'MISSING',  // ← ADDED
  });
});

// ── CHAT PROXY — routes frontend AI calls through backend ────
app.post('/api/chat', async (req, res) => {
  try {
    const { system, messages } = req.body;
    const r = await axios.post('https://api.anthropic.com/v1/messages',
      { model: 'claude-sonnet-4-5', max_tokens: 1000, system, messages },  // ← FIXED model name
      { headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' } }
    );
    res.json(r.data);
  } catch(e) {
    console.error('Chat proxy error:', e.response?.data || e.message);
    res.status(500).json({ error: e.message });
  }
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
  const loginCid = (process.env.GOOGLE_LOGIN_CUSTOMER_ID || GOOGLE_CUSTOMER_ID || '').replace(/-/g, '');
  console.log('Google query — cid:', cid, 'login-cid:', loginCid);
  try {
    const r = await axios.post(
      `https://googleads.googleapis.com/v19/customers/${cid}/googleAds:search`,
      { query },
      { headers: {
          'Authorization': `Bearer ${token}`,
          'developer-token': GOOGLE_DEVELOPER_TOKEN,
          'login-customer-id': loginCid,
          'Content-Type': 'application/json'
      }}
    );
    return r.data.results || [];
  } catch(e) {
    const errData = e.response?.data;
    console.error('Google query detail:', JSON.stringify(errData || e.message).slice(0, 500));
    throw e;
  }
}

// ── SNAPCHAT HELPERS ──────────────────────────────────────────
let snapTokenCache = null;
async function getSnapToken() {
  // If SNAP_REFRESH_TOKEN is actually a JWT access token (starts with eyJ), use it directly
  if (SNAP_REFRESH_TOKEN && SNAP_REFRESH_TOKEN.startsWith('eyJ')) {
    return SNAP_REFRESH_TOKEN;
  }
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
    const campRes = await axios.get(
      `https://adsapi.snapchat.com/v1/adaccounts/${adAccountId}/campaigns`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const campaigns = (campRes.data.campaigns || []).map(c => c.campaign);
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


// ── AI AGENT ─────────────────────────────────────────────────
const agentReports = [];
let agentRunning = false;

const AGENT_SYSTEM_PROMPT = `You are JARVIS — Reprise's elite paid growth AI for an Indian D2C clothing brand.
You are running your DAILY AUTONOMOUS ANALYSIS. Be surgical and specific.
Structure your report EXACTLY like this:

🔴 CRITICAL ALERTS
[campaigns burning money, ROAS crashes, frequency spikes — use actual campaign names]

📊 DAILY PERFORMANCE SUMMARY
[spend, revenue, ROAS, top 3 performers, worst 3 performers]

⚡ TOP 3 ACTIONS FOR TODAY
[specific — campaign names, exact budget changes, pause/scale decisions]

🧪 PATTERN DETECTED
[trend across campaigns — creative fatigue, audience saturation, opportunity]

💰 BUDGET COMMAND
[how to reallocate budget today for maximum ROAS]

Use actual numbers. Be sharp. No fluff.`;

async function runDailyAgent() {
  if (agentRunning) return;
  agentRunning = true;
  console.log('🤖 JARVIS Agent — daily analysis starting...');
  try {
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas',
      level: 'campaign', limit: 100, date_preset: 'last_7d',
    };
    const metaRes = await axios.get(`https://graph.facebook.com/v19.0/act_${getMetaId()}/insights`, { params });
    const campaigns = (metaRes.data.data || []).map(row => {
      const spend = parseFloat(row.spend || 0);
      const nr = row.purchase_roas?.[0]?.value ? parseFloat(row.purchase_roas[0].value) : null;
      const pv = (row.action_values || []).find(a => a.action_type === 'purchase')?.value;
      const roas = nr || (pv && spend > 0 ? parseFloat(pv) / spend : null);
      const revenue = pv ? parseFloat(pv) : nr && spend > 0 ? nr * spend : null;
      return { ...row, roas, revenue };
    });
    const totalSpend = campaigns.reduce((a, c) => a + parseFloat(c.spend || 0), 0);
    const totalRevenue = campaigns.reduce((a, c) => a + (c.revenue || 0), 0);
    const blendedRoas = totalRevenue > 0 && totalSpend > 0 ? totalRevenue / totalSpend : null;
    const totalClicks = campaigns.reduce((a, c) => a + parseInt(c.clicks || 0), 0);
    const totalImpressions = campaigns.reduce((a, c) => a + parseInt(c.impressions || 0), 0);
    const stars = campaigns.filter(c => c.roas >= 3).sort((a, b) => b.roas - a.roas);
    const burning = campaigns.filter(c => c.roas && c.roas < 1 && parseFloat(c.spend) > 300);
    const highFreq = campaigns.filter(c => parseFloat(c.frequency || 0) > 4);

    const dataCtx = `REPRISE META DATA — LAST 7 DAYS (${new Date().toDateString()})

ACCOUNT: Spend ₹${totalSpend.toFixed(0)} | Revenue ₹${totalRevenue.toFixed(0)} | ROAS ${blendedRoas ? blendedRoas.toFixed(2)+'x' : 'N/A'} | CTR ${totalImpressions>0?(totalClicks/totalImpressions*100).toFixed(2):0}% | ${campaigns.length} campaigns

STARS (ROAS ≥ 3x): ${stars.length}
${stars.slice(0,5).map(c=>`- ${c.campaign_name}: ${c.roas.toFixed(2)}x ROAS | ₹${parseFloat(c.spend).toFixed(0)} spend`).join('\n')||'None'}

BURNING (ROAS < 1x, spend >₹300): ${burning.length}
${burning.slice(0,8).map(c=>`- ${c.campaign_name}: ${c.roas.toFixed(2)}x ROAS | ₹${parseFloat(c.spend).toFixed(0)} wasted`).join('\n')||'None'}

HIGH FREQUENCY (>4): ${highFreq.length}
${highFreq.slice(0,5).map(c=>`- ${c.campaign_name}: freq ${parseFloat(c.frequency).toFixed(1)} | ₹${parseFloat(c.spend).toFixed(0)}`).join('\n')||'None'}

ALL CAMPAIGNS (top 20 by spend):
${campaigns.sort((a,b)=>parseFloat(b.spend)-parseFloat(a.spend)).slice(0,20).map(c=>`- ${c.campaign_name}: ₹${parseFloat(c.spend).toFixed(0)} | ROAS ${c.roas?c.roas.toFixed(2)+'x':'N/A'} | CTR ${parseFloat(c.ctr||0).toFixed(2)}% | Freq ${parseFloat(c.frequency||0).toFixed(1)}`).join('\n')}`;

    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages',
      { model: 'claude-sonnet-4-5', max_tokens: 1500, system: AGENT_SYSTEM_PROMPT, messages: [{ role: 'user', content: dataCtx }] },  // ← FIXED model name
      { headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' } }
    );
    const analysis = claudeRes.data.content?.find(b => b.type === 'text')?.text || 'Analysis failed.';
    const report = {
      id: Date.now(), timestamp: new Date().toISOString(), date: new Date().toDateString(),
      analysis,
      summary: { totalSpend: totalSpend.toFixed(0), totalRevenue: totalRevenue.toFixed(0), blendedRoas: blendedRoas?blendedRoas.toFixed(2):null, campaignCount: campaigns.length, starsCount: stars.length, burningCount: burning.length, highFreqCount: highFreq.length }
    };
    agentReports.unshift(report);
    if (agentReports.length > 7) agentReports.pop();
    console.log(`✅ JARVIS Agent done — ROAS ${blendedRoas?blendedRoas.toFixed(2)+'x':'N/A'} | ${burning.length} burning campaigns`);
  } catch(e) {
    console.error('Agent error:', e.response?.data || e.message);
    agentReports.unshift({ id: Date.now(), timestamp: new Date().toISOString(), date: new Date().toDateString(), analysis: `Agent error: ${e.message}`, summary: null, error: true });
  } finally { agentRunning = false; }
}

app.get('/api/agent/latest', (req, res) => res.json({ report: agentReports[0] || null }));
app.get('/api/agent/history', (req, res) => res.json({ reports: agentReports }));
app.get('/api/agent/status', (req, res) => res.json({ running: agentRunning, reportsCount: agentReports.length, lastRun: agentReports[0]?.timestamp || null }));
app.post('/api/agent/run', (req, res) => {
  if (agentRunning) return res.json({ message: 'Already running...', running: true });
  runDailyAgent();
  res.json({ message: 'Agent triggered. Check /api/agent/latest in ~15 seconds.', running: true });
});

// Schedule 8AM IST (2:30 UTC) daily
function scheduleAgent() {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(2, 30, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const ms = next - now;
  console.log(`🕐 JARVIS Agent — next run in ${Math.round(ms/60000)} minutes (8:00 IST)`);
  setTimeout(() => { runDailyAgent(); setInterval(runDailyAgent, 24*60*60*1000); }, ms);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Reprise Ads v6 — Meta + Google + Snapchat + AI Agent on port ${PORT}`);
  scheduleAgent();
  if (ANTHROPIC_API_KEY) { setTimeout(runDailyAgent, 8000); }
});

// ── SHOPIFY OAUTH ─────────────────────────────────────────────
app.get('/shopify/callback', async (req, res) => {
  const { code, shop } = req.query;
  if (!code) return res.send('No code received');
  try {
    const r = await axios.post(`https://${shop || SHOPIFY_STORE}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });
    SHOPIFY_ACCESS_TOKEN = r.data.access_token;
    console.log('✅ Shopify connected! Token:', SHOPIFY_ACCESS_TOKEN?.slice(0,15)+'...');
    res.send(`
      <h2 style="font-family:monospace;background:#020914;color:#00D4FF;padding:30px">
        ✅ SHOPIFY CONNECTED!<br><br>
        <span style="font-size:14px;color:#3A7A94">Add this to Render as SHOPIFY_ACCESS_TOKEN:</span><br><br>
        <textarea rows="2" cols="60" onclick="this.select()" style="background:#040D1A;color:#00FF88;border:1px solid #00D4FF33;padding:10px;font-family:monospace">${SHOPIFY_ACCESS_TOKEN}</textarea><br><br>
        <span style="font-size:13px;color:#00FF88">Store: ${shop}</span>
      </h2>
    `);
  } catch(e) {
    res.send(`Error: ${JSON.stringify(e.response?.data || e.message)}`);
  }
});

// ── SHOPIFY DATA HELPERS ──────────────────────────────────────
const shopifyGet = async (path, params = {}) => {
  if (!SHOPIFY_ACCESS_TOKEN) throw new Error('Shopify not connected');
  const url = `https://${SHOPIFY_STORE}/admin/api/2024-01/${path}`;
  const r = await axios.get(url, {
    headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
    params,
  });
  return r.data;
};

const shopifyDateRange = (preset) => {
  const now = new Date();
  const fmt = d => d.toISOString();
  const days = { today: 1, last_7d: 7, last_14d: 14, last_30d: 30, last_60d: 60, last_90d: 90 }[preset] || 30;
  const from = new Date(now); from.setDate(from.getDate() - days);
  return { created_at_min: fmt(from), created_at_max: fmt(now) };
};

// ── SHOPIFY ENDPOINTS ─────────────────────────────────────────

// Overview — orders, revenue, AOV
app.get('/api/shopify/overview', async (req, res) => {
  try {
    const { date_preset = 'last_30d' } = req.query;
    const dr = shopifyDateRange(date_preset);
    const [ordersData, abandonedData] = await Promise.all([
      shopifyGet('orders.json', { status: 'any', limit: 250, ...dr, fields: 'id,total_price,subtotal_price,financial_status,fulfillment_status,created_at,line_items,customer,source_name,cancel_reason,refunds' }),
      shopifyGet('checkouts.json', { limit: 250, ...dr }),
    ]);
    const orders = ordersData.orders || [];
    const checkouts = abandonedData.checkouts || [];
    const completedOrders = orders.filter(o => o.financial_status === 'paid' || o.financial_status === 'partially_paid');
    const refundedOrders = orders.filter(o => o.financial_status === 'refunded' || o.financial_status === 'partially_refunded');
    const totalRevenue = completedOrders.reduce((a, o) => a + parseFloat(o.total_price || 0), 0);
    const totalOrders = completedOrders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalRefunds = refundedOrders.reduce((a, o) => a + parseFloat(o.total_price || 0), 0);
    const refundRate = totalOrders > 0 ? (refundedOrders.length / totalOrders * 100) : 0;
    const abandonedCount = checkouts.filter(c => !c.completed_at).length;
    const abandondedValue = checkouts.filter(c => !c.completed_at).reduce((a, c) => a + parseFloat(c.total_price || 0), 0);
    // Source breakdown
    const sourceMap = {};
    completedOrders.forEach(o => {
      const src = o.source_name || 'unknown';
      if (!sourceMap[src]) sourceMap[src] = { orders: 0, revenue: 0 };
      sourceMap[src].orders++;
      sourceMap[src].revenue += parseFloat(o.total_price || 0);
    });
    res.json({
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      aov: aov.toFixed(2),
      totalRefunds: totalRefunds.toFixed(2),
      refundRate: refundRate.toFixed(1),
      abandonedCarts: abandonedCount,
      abandonedValue: abandondedValue.toFixed(2),
      conversionRate: checkouts.length > 0 ? ((completedOrders.length / checkouts.length) * 100).toFixed(1) : '0',
      sourceBreakdown: sourceMap,
    });
  } catch(e) { console.error('Shopify overview:', e.message); res.status(500).json({ error: e.message }); }
});

// Funnel — sessions, ATC, checkout, purchase
app.get('/api/shopify/funnel', async (req, res) => {
  try {
    const { date_preset = 'last_30d' } = req.query;
    const dr = shopifyDateRange(date_preset);
    const [checkoutsData, ordersData] = await Promise.all([
      shopifyGet('checkouts.json', { limit: 250, ...dr }),
      shopifyGet('orders.json', { status: 'any', financial_status: 'paid', limit: 250, ...dr, fields: 'id,total_price,created_at' }),
    ]);
    const checkouts = checkoutsData.checkouts || [];
    const orders = ordersData.orders || [];
    const totalCheckouts = checkouts.length;
    const completedCheckouts = orders.length;
    const abandonedCheckouts = checkouts.filter(c => !c.completed_at).length;
    res.json({
      checkoutsInitiated: totalCheckouts,
      checkoutsCompleted: completedCheckouts,
      checkoutsAbandoned: abandonedCheckouts,
      checkoutConvRate: totalCheckouts > 0 ? ((completedCheckouts / totalCheckouts) * 100).toFixed(1) : '0',
      abandonRate: totalCheckouts > 0 ? ((abandonedCheckouts / totalCheckouts) * 100).toFixed(1) : '0',
    });
  } catch(e) { console.error('Shopify funnel:', e.message); res.status(500).json({ error: e.message }); }
});

// Top products
app.get('/api/shopify/products', async (req, res) => {
  try {
    const { date_preset = 'last_30d' } = req.query;
    const dr = shopifyDateRange(date_preset);
    const data = await shopifyGet('orders.json', { status: 'any', financial_status: 'paid', limit: 250, ...dr, fields: 'id,line_items,total_price' });
    const orders = data.orders || [];
    const productMap = {};
    orders.forEach(o => {
      (o.line_items || []).forEach(item => {
        const key = item.product_id;
        if (!productMap[key]) productMap[key] = { name: item.title, qty: 0, revenue: 0, variants: {} };
        productMap[key].qty += item.quantity;
        productMap[key].revenue += parseFloat(item.price) * item.quantity;
        const vkey = item.variant_title || 'Default';
        productMap[key].variants[vkey] = (productMap[key].variants[vkey] || 0) + item.quantity;
      });
    });
    const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
    res.json({ products: sorted });
  } catch(e) { console.error('Shopify products:', e.message); res.status(500).json({ error: e.message }); }
});

// Daily revenue trend
app.get('/api/shopify/daily', async (req, res) => {
  try {
    const { date_preset = 'last_30d' } = req.query;
    const dr = shopifyDateRange(date_preset);
    const data = await shopifyGet('orders.json', { status: 'any', financial_status: 'paid', limit: 250, ...dr, fields: 'id,total_price,created_at' });
    const orders = data.orders || [];
    const dailyMap = {};
    orders.forEach(o => {
      const day = o.created_at?.slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { date: day, orders: 0, revenue: 0 };
      dailyMap[day].orders++;
      dailyMap[day].revenue += parseFloat(o.total_price || 0);
    });
    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    res.json({ daily });
  } catch(e) { console.error('Shopify daily:', e.message); res.status(500).json({ error: e.message }); }
});

// Status check
app.get('/api/shopify/status', (req, res) => {
  res.json({ connected: !!SHOPIFY_ACCESS_TOKEN, store: SHOPIFY_STORE });
});
