const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

const getAccountId = () => {
  const id = META_AD_ACCOUNT_ID || '';
  return id.replace('act_', '');
};

// Health check
app.get('/ping', (req, res) => res.send('OK'));

// GET all campaigns with optional status filter
app.get('/api/campaigns', async (req, res) => {
  try {
    const accountId = getAccountId();
    const { status, limit = 100 } = req.query;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'id,name,status,daily_budget,lifetime_budget,objective,start_time,stop_time,created_time,updated_time,budget_remaining',
      limit,
    };
    if (status) params.effective_status = `["${status}"]`;
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/campaigns`;
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Campaigns error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// GET single campaign details
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://graph.facebook.com/v19.0/${id}`;
    const response = await axios.get(url, {
      params: {
        access_token: META_ACCESS_TOKEN,
        fields: 'id,name,status,daily_budget,lifetime_budget,objective,start_time,stop_time,created_time,updated_time,budget_remaining,buying_type,bid_strategy'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// GET campaign-level insights with date range
app.get('/api/campaigns/:id/insights', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_preset, date_since, date_until, time_increment } = req.query;
    const url = `https://graph.facebook.com/v19.0/${id}/insights`;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,outbound_clicks,outbound_clicks_ctr,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions',
      level: 'campaign',
    };
    if (date_preset) params.date_preset = date_preset;
    else if (date_since && date_until) {
      params.time_range = JSON.stringify({ since: date_since, until: date_until });
    } else {
      params.date_preset = 'last_30d';
    }
    if (time_increment) params.time_increment = time_increment;
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// GET account-level insights with date range
app.get('/api/insights', async (req, res) => {
  try {
    const accountId = getAccountId();
    const { date_preset, date_since, date_until } = req.query;
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights`;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,outbound_clicks,outbound_clicks_ctr',
      level: 'campaign',
      limit: 100,
    };
    if (date_preset) params.date_preset = date_preset;
    else if (date_since && date_until) {
      params.time_range = JSON.stringify({ since: date_since, until: date_until });
    } else {
      params.date_preset = 'last_30d';
    }
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Insights error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// GET ad sets for a campaign
app.get('/api/campaigns/:id/adsets', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_preset, date_since, date_until } = req.query;
    const url = `https://graph.facebook.com/v19.0/${id}/adsets`;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'id,name,status,daily_budget,lifetime_budget,targeting,billing_event,optimization_goal,bid_amount,start_time,end_time',
      limit: 50,
    };
    const response = await axios.get(url, { params });

    // Also get adset insights
    const adsetIds = response.data.data?.map(a => a.id) || [];
    let insightsData = [];
    if (adsetIds.length > 0) {
      const insightParams = {
        access_token: META_ACCESS_TOKEN,
        fields: 'adset_id,adset_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency',
        level: 'adset',
        limit: 50,
      };
      if (date_preset) insightParams.date_preset = date_preset;
      else if (date_since && date_until) insightParams.time_range = JSON.stringify({ since: date_since, until: date_until });
      else insightParams.date_preset = 'last_30d';

      try {
        const insRes = await axios.get(`https://graph.facebook.com/v19.0/${id}/insights`, { params: insightParams });
        insightsData = insRes.data.data || [];
      } catch(e) { console.log('Adset insights error:', e.message); }
    }

    res.json({ adsets: response.data.data || [], insights: insightsData });
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// GET ads for a campaign
app.get('/api/campaigns/:id/ads', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://graph.facebook.com/v19.0/${id}/ads`;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'id,name,status,creative{id,name,title,body,image_url,thumbnail_url},adset_id',
      limit: 50,
    };
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// GET daily breakdown for a campaign
app.get('/api/campaigns/:id/daily', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_preset, date_since, date_until } = req.query;
    const url = `https://graph.facebook.com/v19.0/${id}/insights`;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency',
      time_increment: 1,
      limit: 90,
    };
    if (date_preset) params.date_preset = date_preset;
    else if (date_since && date_until) params.time_range = JSON.stringify({ since: date_since, until: date_until });
    else params.date_preset = 'last_30d';
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Reprise Ads Backend running on port ${PORT}`));
