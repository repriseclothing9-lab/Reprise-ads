const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

const getAccountId = () => (META_AD_ACCOUNT_ID || '').replace('act_', '');

app.get('/ping', (req, res) => res.send('OK'));

// Campaigns — no date filter needed
app.get('/api/campaigns', async (req, res) => {
  try {
    const url = `https://graph.facebook.com/v19.0/act_${getAccountId()}/campaigns`;
    const response = await axios.get(url, {
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

// Account insights — WITH date range
app.get('/api/insights', async (req, res) => {
  try {
    const { date_preset, date_since, date_until } = req.query;
    console.log('INSIGHTS REQUEST — date_preset:', date_preset, '| date_since:', date_since, '| date_until:', date_until);

    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,outbound_clicks,outbound_clicks_ctr',
      level: 'campaign',
      limit: 100,
    };

    if (date_since && date_until) {
      params.time_range = JSON.stringify({ since: date_since, until: date_until });
      console.log('Using custom time_range:', params.time_range);
    } else if (date_preset && date_preset !== 'custom') {
      params.date_preset = date_preset;
      console.log('Using date_preset:', date_preset);
    } else {
      params.date_preset = 'last_30d';
      console.log('Fallback to last_30d');
    }

    const response = await axios.get(`https://graph.facebook.com/v19.0/act_${getAccountId()}/insights`, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Insights error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// Single campaign insights — WITH date range
app.get('/api/campaigns/:id/insights', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_preset, date_since, date_until } = req.query;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,outbound_clicks',
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

// Daily breakdown — WITH date range
app.get('/api/campaigns/:id/daily', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_preset, date_since, date_until } = req.query;
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency',
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

// Ad sets for a campaign
app.get('/api/campaigns/:id/adsets', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://graph.facebook.com/v19.0/${id}/adsets`, {
      params: {
        access_token: META_ACCESS_TOKEN,
        fields: 'id,name,status,daily_budget,lifetime_budget,targeting,billing_event,optimization_goal,bid_amount,start_time,end_time',
        limit: 50,
      }
    });
    res.json({ adsets: response.data.data || [], insights: [] });
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Reprise Ads Backend running on port ${PORT}`));
