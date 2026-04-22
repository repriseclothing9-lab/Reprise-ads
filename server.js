const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

app.get('/api/campaigns', async (req, res) => {
  try {
    const accountId = META_AD_ACCOUNT_ID.replace('act_', '');
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/campaigns`;
    const response = await axios.get(url, {
      params: {
        access_token: META_ACCESS_TOKEN,
        fields: 'id,name,status,daily_budget,lifetime_budget,objective',
        limit: 50
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/insights', async (req, res) => {
  try {
    const accountId = META_AD_ACCOUNT_ID.replace('act_', '');
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights`;
    const response = await axios.get(url, {
      params: {
        access_token: META_ACCESS_TOKEN,
        fields: 'campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions',
        date_preset: 'last_30d',
        level: 'campaign',
        limit: 50
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/ping', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
