const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// META credentials
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
const getMetaAccountId = () => (META_AD_ACCOUNT_ID || '').replace('act_', '');

// GOOGLE ADS credentials
const GOOGLE_DEVELOPER_TOKEN = process.env.GOOGLE_DEVELOPER_TOKEN;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_CUSTOMER_ID = process.env.GOOGLE_CUSTOMER_ID; // without dashes e.g. 1234567890

app.get('/ping', (req, res) => res.send('OK'));

// ─── GOOGLE: Get access token from refresh token ─────────────
async function getGoogleAccessToken() {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  return response.data.access_token;
}

// ─── GOOGLE: Build date range for GAQL ───────────────────────
function buildGoogleDateRange(date_preset, date_since, date_until) {
  const today = new Date();
  const fmt = d => d.toISOString().slice(0, 10);
  if (date_since && date_until) return `BETWEEN '${date_since}' AND '${date_until}'`;
  switch (date_preset) {
    case 'today': return `= '${fmt(today)}'`;
    case 'last_7d': { const d = new Date(today); d.setDate(d.getDate() - 7); return `BETWEEN '${fmt(d)}' AND '${fmt(today)}'`; }
    case 'last_14d': { const d = new Date(today); d.setDate(d.getDate() - 14); return `BETWEEN '${fmt(d)}' AND '${fmt(today)}'`; }
    case 'last_30d': { const d = new Date(today); d.setDate(d.getDate() - 30); return `BETWEEN '${fmt(d)}' AND '${fmt(today)}'`; }
    case 'last_60d': { const d = new Date(today); d.setDate(d.getDate() - 60); return `BETWEEN '${fmt(d)}' AND '${fmt(today)}'`; }
    case 'last_90d': { const d = new Date(today); d.setDate(d.getDate() - 90); return `BETWEEN '${fmt(d)}' AND '${fmt(today)}'`; }
    default: { const d = new Date(today); d.setDate(d.getDate() - 30); return `BETWEEN '${fmt(d)}' AND '${fmt(today)}'`; }
  }
}

// ─── GOOGLE: Run GAQL query ───────────────────────────────────
async function runGoogleQuery(query) {
  const accessToken = await getGoogleAccessToken();
  const customerId = (GOOGLE_CUSTOMER_ID || '').replace(/-/g, '');
  const response = await axios.post(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
    { query },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': GOOGLE_DEVELOPER_TOKEN,
        'Content-Type': 'application/json',
      }
    }
  );
  return response.data.results || [];
}

// ─── META ENDPOINTS ───────────────────────────────────────────

app.get('/api/campaigns', async (req, res) => {
  try {
    const response = await axios.get(`https://graph.facebook.com/v19.0/act_${getMetaAccountId()}/campaigns`, {
      params: {
        access_token: META_ACCESS_TOKEN,
        fields: 'id,name,status,daily_budget,lifetime_budget,objective,start_time,stop_time,created_time,updated_time,budget_remaining,buying_type',
        limit: 100,
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

app.get('/api/insights', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    console.log('META insights — preset:', date_preset, 'since:', date_since, 'until:', date_until);
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,cost_per_action_type,purchase_roas,outbound_clicks',
      level: 'campaign',
      limit: 100,
    };
    if (date_since && date_until) params.time_range = JSON.stringify({ since: date_since, until: date_until });
    else if (date_preset && date_preset !== 'custom') params.date_preset = date_preset;
    else params.date_preset = 'last_30d';
    const response = await axios.get(`https://graph.facebook.com/v19.0/act_${getMetaAccountId()}/insights`, { params });
    const data = (response.data.data || []).map(row => {
      const spend = parseFloat(row.spend || 0);
      const nativeRoas = row.purchase_roas?.[0]?.value ? parseFloat(row.purchase_roas[0].value) : null;
      const purchaseValue = (row.action_values || []).find(a => a.action_type === 'purchase')?.value;
      const calculatedRoas = purchaseValue && spend > 0 ? parseFloat(purchaseValue) / spend : null;
      const omniValue = (row.action_values || []).find(a => a.action_type === 'omni_purchase')?.value;
      const omniRoas = omniValue && spend > 0 ? parseFloat(omniValue) / spend : null;
      const roas = nativeRoas || calculatedRoas || omniRoas || null;
      const revenue = purchaseValue ? parseFloat(purchaseValue) : omniValue ? parseFloat(omniValue) : nativeRoas && spend > 0 ? nativeRoas * spend : null;
      return { ...row, roas, revenue };
    });
    res.json({ ...response.data, data });
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

app.get('/api/campaigns/:id/insights', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_preset, date_since, date_until } = req.query;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas,outbound_clicks',
      level: 'campaign',
    };
    if (date_since && date_until) params.time_range = JSON.stringify({ since: date_since, until: date_until });
    else if (date_preset && date_preset !== 'custom') params.date_preset = date_preset;
    else params.date_preset = 'last_30d';
    const response = await axios.get(`https://graph.facebook.com/v19.0/${id}/insights`, { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

app.get('/api/campaigns/:id/daily', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_preset, date_since, date_until } = req.query;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas',
      time_increment: 1,
      limit: 90,
    };
    if (date_since && date_until) params.time_range = JSON.stringify({ since: date_since, until: date_until });
    else if (date_preset && date_preset !== 'custom') params.date_preset = date_preset;
    else params.date_preset = 'last_30d';
    const response = await axios.get(`https://graph.facebook.com/v19.0/${id}/insights`, { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

app.get('/api/campaigns/:id/adsets', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://graph.facebook.com/v19.0/${id}/adsets`, {
      params: {
        access_token: META_ACCESS_TOKEN,
        fields: 'id,name,status,daily_budget,lifetime_budget,billing_event,optimization_goal,start_time,end_time',
        limit: 50,
      }
    });
    res.json({ adsets: response.data.data || [], insights: [] });
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// ─── GOOGLE ADS ENDPOINTS ─────────────────────────────────────

// Google campaigns
app.get('/api/google/campaigns', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    const dateRange = buildGoogleDateRange(date_preset, date_since, date_until);
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.conversions,
        metrics.conversions_value,
        metrics.search_impression_share
      FROM campaign
      WHERE segments.date ${dateRange}
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `;
    const results = await runGoogleQuery(query);
    const campaigns = results.map(r => ({
      id: r.campaign?.id,
      name: r.campaign?.name,
      status: r.campaign?.status,
      channel: r.campaign?.advertisingChannelType,
      daily_budget: r.campaignBudget?.amountMicros ? (parseInt(r.campaignBudget.amountMicros) / 1000000) : null,
      spend: r.metrics?.costMicros ? (parseInt(r.metrics.costMicros) / 1000000) : 0,
      impressions: parseInt(r.metrics?.impressions || 0),
      clicks: parseInt(r.metrics?.clicks || 0),
      ctr: parseFloat(r.metrics?.ctr || 0) * 100,
      cpc: r.metrics?.averageCpc ? (parseInt(r.metrics.averageCpc) / 1000000) : 0,
      cpm: r.metrics?.averageCpm ? (parseInt(r.metrics.averageCpm) / 1000000) : 0,
      conversions: parseFloat(r.metrics?.conversions || 0),
      conversion_value: parseFloat(r.metrics?.conversionsValue || 0),
      roas: r.metrics?.conversionsValue && r.metrics?.costMicros && parseInt(r.metrics.costMicros) > 0
        ? parseFloat(r.metrics.conversionsValue) / (parseInt(r.metrics.costMicros) / 1000000)
        : null,
      impression_share: r.metrics?.searchImpressionShare,
    }));
    res.json({ data: campaigns });
  } catch (error) {
    console.error('Google campaigns error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// Google account-level summary
app.get('/api/google/insights', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    const dateRange = buildGoogleDateRange(date_preset, date_since, date_until);
    const query = `
      SELECT
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.conversions,
        metrics.conversions_value,
        metrics.all_conversions
      FROM customer
      WHERE segments.date ${dateRange}
    `;
    const results = await runGoogleQuery(query);
    const totals = results.reduce((acc, r) => {
      acc.spend += r.metrics?.costMicros ? parseInt(r.metrics.costMicros) / 1000000 : 0;
      acc.impressions += parseInt(r.metrics?.impressions || 0);
      acc.clicks += parseInt(r.metrics?.clicks || 0);
      acc.conversions += parseFloat(r.metrics?.conversions || 0);
      acc.conversion_value += parseFloat(r.metrics?.conversionsValue || 0);
      return acc;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversion_value: 0 });
    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    totals.cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
    totals.roas = totals.spend > 0 && totals.conversion_value > 0 ? totals.conversion_value / totals.spend : null;
    res.json({ data: totals });
  } catch (error) {
    console.error('Google insights error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || error.message, data: null });
  }
});

// Google daily breakdown
app.get('/api/google/daily', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    const dateRange = buildGoogleDateRange(date_preset, date_since, date_until);
    const query = `
      SELECT
        segments.date,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions_value,
        metrics.conversions
      FROM customer
      WHERE segments.date ${dateRange}
      ORDER BY segments.date ASC
    `;
    const results = await runGoogleQuery(query);
    const daily = results.map(r => ({
      date: r.segments?.date,
      spend: r.metrics?.costMicros ? parseInt(r.metrics.costMicros) / 1000000 : 0,
      impressions: parseInt(r.metrics?.impressions || 0),
      clicks: parseInt(r.metrics?.clicks || 0),
      ctr: parseFloat(r.metrics?.ctr || 0) * 100,
      cpc: r.metrics?.averageCpc ? parseInt(r.metrics.averageCpc) / 1000000 : 0,
      revenue: parseFloat(r.metrics?.conversionsValue || 0),
      conversions: parseFloat(r.metrics?.conversions || 0),
    }));
    res.json({ data: daily });
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// Combined dashboard endpoint — Meta + Google together
app.get('/api/combined', async (req, res) => {
  const { date_preset = 'last_30d', date_since, date_until } = req.query;
  const results = { meta: null, google: null, errors: {} };
  await Promise.allSettled([
    // Meta
    (async () => {
      const params = { access_token: META_ACCESS_TOKEN, fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas', level: 'campaign', limit: 100 };
      if (date_since && date_until) params.time_range = JSON.stringify({ since: date_since, until: date_until });
      else params.date_preset = date_preset !== 'custom' ? date_preset : 'last_30d';
      const r = await axios.get(`https://graph.facebook.com/v19.0/act_${getMetaAccountId()}/insights`, { params });
      results.meta = (r.data.data || []).map(row => {
        const spend = parseFloat(row.spend || 0);
        const nativeRoas = row.purchase_roas?.[0]?.value ? parseFloat(row.purchase_roas[0].value) : null;
        const pv = (row.action_values || []).find(a => a.action_type === 'purchase')?.value;
        const roas = nativeRoas || (pv && spend > 0 ? parseFloat(pv) / spend : null);
        const revenue = pv ? parseFloat(pv) : nativeRoas && spend > 0 ? nativeRoas * spend : null;
        return { ...row, roas, revenue, platform: 'meta' };
      });
    })(),
    // Google
    (async () => {
      const dateRange = buildGoogleDateRange(date_preset, date_since, date_until);
      const query = `SELECT campaign.id,campaign.name,campaign.status,campaign.advertising_channel_type,campaign_budget.amount_micros,metrics.cost_micros,metrics.impressions,metrics.clicks,metrics.ctr,metrics.average_cpc,metrics.average_cpm,metrics.conversions,metrics.conversions_value FROM campaign WHERE segments.date ${dateRange} AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC LIMIT 100`;
      const gResults = await runGoogleQuery(query);
      results.google = gResults.map(r => ({
        id: r.campaign?.id,
        campaign_id: r.campaign?.id,
        campaign_name: r.campaign?.name,
        name: r.campaign?.name,
        status: r.campaign?.status,
        channel: r.campaign?.advertisingChannelType,
        daily_budget: r.campaignBudget?.amountMicros ? parseInt(r.campaignBudget.amountMicros) / 1000000 : null,
        spend: r.metrics?.costMicros ? parseInt(r.metrics.costMicros) / 1000000 : 0,
        impressions: parseInt(r.metrics?.impressions || 0),
        clicks: parseInt(r.metrics?.clicks || 0),
        ctr: parseFloat(r.metrics?.ctr || 0) * 100,
        cpc: r.metrics?.averageCpc ? parseInt(r.metrics.averageCpc) / 1000000 : 0,
        cpm: r.metrics?.averageCpm ? parseInt(r.metrics.averageCpm) / 1000000 : 0,
        conversions: parseFloat(r.metrics?.conversions || 0),
        revenue: parseFloat(r.metrics?.conversionsValue || 0),
        roas: r.metrics?.conversionsValue && r.metrics?.costMicros && parseInt(r.metrics.costMicros) > 0
          ? parseFloat(r.metrics.conversionsValue) / (parseInt(r.metrics.costMicros) / 1000000) : null,
        platform: 'google',
      }));
    })(),
  ]);
  res.json(results);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Reprise Ads Backend v4 — Meta + Google running on port ${PORT}`));
