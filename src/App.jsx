import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const C = {
  bg:"#F6F8FF", white:"#FFFFFF", border:"#E3E8F5", text:"#0D1226", muted:"#8A96B8", soft:"#F0F3FF",
  blue:"#4E7EF7", pink:"#F7A8C4", yellow:"#FBCF34", green:"#3EC97A", black:"#0D1226", red:"#FF6B8A",
  blueL:"#EEF3FF", pinkL:"#FFF0F6", yellowL:"#FFFBEA", greenL:"#EDFBF3", redL:"#FFF0F4",
};

const SYSTEM_PROMPT = `You are Reprise's elite paid growth head — an AI performance marketing operator for an Indian D2C clothing brand. Think like a founder, CFO, CMO, and media buyer combined. You have full visibility of live campaign data. Always respond: 🔍 Diagnosis → ❓ Why → ⚡ Action Now → 🧪 Test Next → 📊 Watch → 💰 Budget Call. Sharp, decisive, no fluff. Brand: Reprise — men's/women's clothing, India, fit, fabric, value, manufacturing credibility.`;

const PLATFORMS = {
  meta:     {name:"Meta",     color:C.blue,   icon:"f",  spend:142000,revenue:426000,roas:3.0,cac:520,ctr:1.42,cpm:198,cvr:2.1,status:"healthy"},
  google:   {name:"Google",   color:C.green,  icon:"G",  spend:68000, revenue:238000,roas:3.5,cac:480,ctr:3.8, cpm:0,  cvr:3.2,status:"healthy"},
  snapchat: {name:"Snapchat", color:"#E6A817",icon:"👻", spend:22000, revenue:48400, roas:2.2,cac:780,ctr:0.9, cpm:280,cvr:1.1,status:"warning"},
  tiktok:   {name:"TikTok",   color:C.black,  icon:"♪",  spend:18000, revenue:32400, roas:1.8,cac:920,ctr:0.7, cpm:310,cvr:0.9,status:"critical"},
};

const CAMPAIGNS = [
  {id:1,​​​​​​​​​​​​​​​​
