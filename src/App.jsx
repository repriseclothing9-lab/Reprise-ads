import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const API_URL = "https://reprise-ads.onrender.com";
const J = {
  bg:"#020914",bg2:"#040D1A",cyan:"#00D4FF",
  cyanGlow:"0 0 10px #00D4FF,0 0 20px #00D4FF44",cyanGlowSm:"0 0 6px #00D4FF88",
  orange:"#FF6B35",green:"#00FF88",red:"#FF3366",yellow:"#FFD700",purple:"#B06EFF",
  google:"#4E9EFF",meta:"#00D4FF",
  border:"#00D4FF18",borderBright:"#00D4FF55",text:"#E0F4FF",muted:"#3A7A94",grid:"#00D4FF06",
};
const SYSTEM_PROMPT=`You are JARVIS — Reprise's elite paid growth AI for an Indian D2C clothing brand. You have Meta AND Google Ads data. Respond: 🔍 DIAGNOSIS → ⚡ THREAT → 🎯 ACTION → 🧪 EXPERIMENT → 📊 MONITOR → 💰 COMMAND. Sharp, decisive, occasional dry wit.`;
const DATE_PRESETS=[{label:"TODAY",value:"today"},{label:"7D",value:"last_7d"},{label:"14D",value:"last_14d"},{label:"30D",value:"last_30d"},{label:"60D",value:"last_60d"},{label:"90D",value:"last_90d"},{label:"CUSTOM",value:"custom"}];
const fmt=n=>n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${Math.round(n||0)}`;
const fmtN=n=>n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:`${n||0}`;
const fmtDate=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';
const roasColor=r=>!r?J.muted:r>=4?J.green:r>=2.5?J.yellow:J.red;
const buildParams=(preset,since,until)=>{
  if(preset==="custom"&&since&&until)return`date_since=${since}&date_until=${until}`;
  if(preset&&preset!=="custom")return`date_preset=${preset}`;
  return"date_preset=last_30d";
};

const RepriseLogo=({size=52})=>(
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none"
    style={{filter:"drop-shadow(0 0 6px #00D4FF) drop-shadow(0 0 12px #00D4FF88)",flexShrink:0}}>
    <path d="M10 20 L70 20 L90 45 L70 70 L55 70 L68 50 L58 36 L22 36 Z" fill="#00D4FF" opacity=".95"/>
    <path d="M55 70 L70 70 L82 95 L68 95 Z" fill="#00D4FF" opacity=".85"/>
    <path d="M190 20 L130 20 L110 45 L130 70 L145 70 L132 50 L142 36 L178 36 Z" fill="#00D4FF" opacity=".95"/>
    <path d="M145 70 L130 70 L118 95 L132 95 Z" fill="#00D4FF" opacity=".85"/>
    <path d="M100 48 L104 62 L119 62 L107 71 L111 85 L100 76 L89 85 L93 71 L81 62 L96 62 Z" fill="#00D4FF"/>
    <line x1="10" y1="108" x2="190" y2="108" stroke="#00D4FF" strokeWidth="1.5" opacity=".4"/>
    <text x="100" y="140" textAnchor="middle" fontFamily="'Orbitron',monospace" fontSize="28" fontWeight="900" fill="#00D4FF" letterSpacing="8">REPRISE</text>
  </svg>
);

const ArcReactor=({value,max,label,color=J.cyan,size=88})=>{
  const r=size*.36,circ=2*Math.PI*r,pct=Math.min((parseFloat(value)||0)/Math.max(parseFloat(max)||1,1)*100,100),dash=(pct/100)*circ;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color+"18"} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{filter:`drop-shadow(0 0 5px ${color})`}}/>
        <circle cx={size/2} cy={size/2} r={r*.5} fill={color+"0A"} stroke={color+"33"} strokeWidth="1"/>
        <text x={size/2} y={size/2+5} textAnchor="middle" fill={color} fontSize={size*.14} fontFamily="monospace" fontWeight="800">
          {typeof value==="number"&&value>9999?fmtN(value):value}
        </text>
      </svg>
      <div style={{fontSize:8,color:J.muted,letterSpacing:2,fontFamily:"monospace"}}>{label}</div>
    </div>
  );
};

const JCard=({children,style={},glow=false,accent=J.cyan})=>(
  <div style={{background:`linear-gradient(135deg,${J.bg2},#050E1C)`,border:`1px solid ${glow?accent+"55":J.border}`,borderRadius:3,position:"relative",overflow:"hidden",boxShadow:glow?`inset 0 0 30px ${accent}05`:"",...style}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${accent},transparent)`}}/>
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${accent}33,transparent)`}}/>
    {children}
  </div>
);

const PlatformTag=({platform})=>{
  const isGoogle=platform==="google";
  const c=isGoogle?J.google:J.meta;
  return<span style={{padding:"1px 7px",borderRadius:2,fontSize:7,fontWeight:700,fontFamily:"monospace",letterSpacing:1,background:c+"18",color:c,border:`1px solid ${c}33`}}>{isGoogle?"GOOGLE":"META"}</span>;
};

const RoasBadge=({roas})=>{
  if(!roas)return<span style={{color:J.muted,fontSize:9,fontFamily:"monospace"}}>—</span>;
  const c=roasColor(roas);
  return<span style={{padding:"2px 8px",borderRadius:2,fontSize:10,fontWeight:800,fontFamily:"monospace",background:c+"18",color:c,border:`1px solid ${c}44`,textShadow:`0 0 6px ${c}66`}}>{parseFloat(roas).toFixed(2)}x</span>;
};

function DateRangePicker({activePreset,onSelect,dateSince,setDateSince,dateUntil,setDateUntil,onCustomApply}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:2}}>DATE RANGE:</span>
      <div style={{display:"flex",gap:4}}>
        {DATE_PRESETS.map(p=>(
          <button key={p.value} onClick={()=>onSelect(p.value)}
            style={{padding:"4px 11px",background:activePreset===p.value?J.cyan+"22":"transparent",border:`1px solid ${activePreset===p.value?J.cyan:J.border}`,borderRadius:2,color:activePreset===p.value?J.cyan:J.muted,fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:1,boxShadow:activePreset===p.value?J.cyanGlowSm:"none",transition:"all .15s",fontWeight:activePreset===p.value?700:400}}>
            {p.label}
          </button>
        ))}
      </div>
      {activePreset==="custom"&&(
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <input type="date" value={dateSince} onChange={e=>setDateSince(e.target.value)} style={{padding:"3px 8px",background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,fontSize:10,fontFamily:"monospace",outline:"none",colorScheme:"dark"}}/>
          <span style={{color:J.muted,fontSize:9}}>→</span>
          <input type="date" value={dateUntil} onChange={e=>setDateUntil(e.target.value)} style={{padding:"3px 8px",background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,fontSize:10,fontFamily:"monospace",outline:"none",colorScheme:"dark"}}/>
          <button onClick={onCustomApply} style={{padding:"4px 12px",background:J.cyan+"22",border:`1px solid ${J.cyan}`,borderRadius:2,color:J.cyan,fontSize:9,cursor:"pointer",fontFamily:"monospace",boxShadow:J.cyanGlowSm}}>APPLY</button>
        </div>
      )}
    </div>
  );
}

// PLATFORM CARD — shows Meta or Google summary
function PlatformCard({platform,data,loading}){
  const isGoogle=platform==="google";
  const c=isGoogle?J.google:J.meta;
  const icon=isGoogle?"G":"f";
  const label=isGoogle?"GOOGLE ADS":"META ADS";
  if(loading)return<JCard style={{padding:18}} glow accent={c}><div style={{fontSize:9,color:c,letterSpacing:2,fontFamily:"monospace",marginBottom:12}}>◈ {label}</div><div style={{textAlign:"center",padding:20,color:J.muted,fontFamily:"monospace",fontSize:10}}>SYNCING...</div></JCard>;
  if(!data)return<JCard style={{padding:18}} glow accent={c}><div style={{fontSize:9,color:c,letterSpacing:2,fontFamily:"monospace",marginBottom:12}}>◈ {label}</div><div style={{textAlign:"center",padding:20,color:J.red,fontFamily:"monospace",fontSize:10}}>NOT CONNECTED</div></JCard>;
  const spend=isGoogle?data.spend:data.reduce((a,i)=>a+parseFloat(i.spend||0),0);
  const revenue=isGoogle?data.conversion_value:(data.reduce((a,i)=>a+(i.revenue||0),0));
  const roas=isGoogle?data.roas:(spend>0&&revenue>0?revenue/spend:null);
  const impressions=isGoogle?data.impressions:data.reduce((a,i)=>a+parseInt(i.impressions||0),0);
  const clicks=isGoogle?data.clicks:data.reduce((a,i)=>a+parseInt(i.clicks||0),0);
  const ctr=isGoogle?data.ctr:(impressions>0?(clicks/impressions*100):0);
  const cpc=isGoogle?data.cpc:(clicks>0?spend/clicks:0);
  return(
    <JCard style={{padding:18}} glow accent={c}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:9,color:c,letterSpacing:2,fontFamily:"monospace",textShadow:`0 0 6px ${c}88`}}>◈ {label}</div>
        <div style={{width:28,height:28,borderRadius:"50%",background:c+"18",border:`1px solid ${c}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:c}}>{icon}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div style={{padding:"8px 10px",background:c+"0A",border:`1px solid ${c}22`,borderRadius:2}}>
          <div style={{fontSize:7,color:J.muted,letterSpacing:1.5,fontFamily:"monospace",marginBottom:3}}>SPEND</div>
          <div style={{fontSize:18,fontWeight:900,color:c,fontFamily:"monospace",textShadow:`0 0 10px ${c}66`}}>{fmt(spend)}</div>
        </div>
        <div style={{padding:"8px 10px",background:roasColor(roas)+"0A",border:`1px solid ${roasColor(roas)}22`,borderRadius:2}}>
          <div style={{fontSize:7,color:J.muted,letterSpacing:1.5,fontFamily:"monospace",marginBottom:3}}>ROAS</div>
          <div style={{fontSize:18,fontWeight:900,color:roasColor(roas),fontFamily:"monospace",textShadow:`0 0 10px ${roasColor(roas)}66`}}>{roas?`${roas.toFixed(2)}x`:"N/A"}</div>
        </div>
      </div>
      {[["REVENUE",revenue>0?fmt(revenue):"N/A",J.purple],["IMPRESSIONS",fmtN(impressions),J.muted],["CLICKS",fmtN(clicks),c],["CTR",`${parseFloat(ctr).toFixed(2)}%`,parseFloat(ctr)>=1?J.green:J.red],["CPC",`₹${parseFloat(cpc).toFixed(0)}`,J.yellow]].map(([l,v,col])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${J.border}`}}>
          <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>▸ {l}</span>
          <span style={{fontSize:11,fontWeight:700,color:col,fontFamily:"monospace"}}>{v}</span>
        </div>
      ))}
    </JCard>
  );
}

function CampaignDrawer({campaign,insights,googleCampaigns,datePreset,dateSince,dateUntil,onClose}){
  const[sec,setSec]=useState("OVERVIEW");
  const[adsets,setAdsets]=useState([]);
  const[dailyData,setDailyData]=useState([]);
  const[loading,setLoading]=useState(true);
  const isGoogle=campaign.platform==="google";
  const ci=isGoogle?campaign:(insights.find(i=>i.campaign_id===campaign.id||i.campaign_name===campaign.name)||{});
  const spend=parseFloat(ci.spend||0),impressions=parseInt(ci.impressions||0),clicks=parseInt(ci.clicks||0);
  const ctr=parseFloat(ci.ctr||0),cpc=parseFloat(ci.cpc||0),cpm=parseFloat(ci.cpm||0);
  const reach=parseInt(ci.reach||0),freq=parseFloat(ci.frequency||0);
  const roas=ci.roas?parseFloat(ci.roas):null;
  const revenue=ci.revenue?parseFloat(ci.revenue):null;
  const purchases=(ci.actions||[]).find(a=>a.action_type==="purchase")?.value||0;
  const atc=(ci.actions||[]).find(a=>a.action_type==="add_to_cart")?.value||0;
  useEffect(()=>{
    if(isGoogle){setLoading(false);return;}
    const p=buildParams(datePreset,dateSince,dateUntil);
    const go=async()=>{
      setLoading(true);
      try{
        const[a,d]=await Promise.all([
          fetch(`${API_URL}/api/campaigns/${campaign.id}/adsets?${p}`),
          fetch(`${API_URL}/api/campaigns/${campaign.id}/daily?${p}`)
        ]);
        const ad=await a.json(),dd=await d.json();
        setAdsets(ad.adsets||[]);
        const enriched=(dd.data||[]).map(row=>{
          const s=parseFloat(row.spend||0);
          const pv=(row.action_values||[]).find(a=>a.action_type==="purchase")?.value;
          const nr=row.purchase_roas?.[0]?.value?parseFloat(row.purchase_roas[0].value):null;
          return{...row,roas:nr||(pv&&s>0?parseFloat(pv)/s:null),revenue:pv?parseFloat(pv):nr&&s>0?nr*s:null};
        });
        setDailyData(enriched);
      }catch(e){console.log(e);}finally{setLoading(false);}
    };go();
  },[campaign.id,datePreset,dateSince,dateUntil]);
  const SECS=isGoogle?["OVERVIEW"]:["OVERVIEW","DAILY","AD SETS"];
  const accentColor=isGoogle?J.google:J.cyan;
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(2,9,20,.85)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",width:720,background:J.bg,borderLeft:`1px solid ${accentColor}55`,overflowY:"auto",zIndex:201,boxShadow:`-12px 0 60px ${accentColor}22`}}>
        <div style={{position:"sticky",top:0,background:J.bg+"F8",borderBottom:`1px solid ${J.border}`,padding:"14px 20px",zIndex:10,backdropFilter:"blur(10px)"}}>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${accentColor},transparent)`}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div style={{flex:1,paddingRight:16}}>
              <div style={{fontSize:9,color:J.muted,letterSpacing:2,fontFamily:"monospace",marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
                ◈ CAMPAIGN DETAIL <PlatformTag platform={isGoogle?"google":"meta"}/>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:accentColor,fontFamily:"monospace",textShadow:`0 0 6px ${accentColor}88`,lineHeight:1.3}}>{campaign.name}</div>
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{padding:"2px 8px",borderRadius:2,fontSize:8,fontFamily:"monospace",letterSpacing:1.5,background:campaign.status==="ACTIVE"||campaign.status==="ENABLED"?J.green+"18":J.muted+"18",color:campaign.status==="ACTIVE"||campaign.status==="ENABLED"?J.green:J.muted,border:`1px solid ${campaign.status==="ACTIVE"||campaign.status==="ENABLED"?J.green+"44":J.muted+"33"}`}}>{campaign.status}</span>
                {!isGoogle&&<span style={{padding:"2px 8px",borderRadius:2,fontSize:8,fontFamily:"monospace",background:J.cyan+"11",color:J.cyan,border:`1px solid ${J.border}`}}>{campaign.objective?.replace("OUTCOME_","")||"—"}</span>}
                {isGoogle&&<span style={{padding:"2px 8px",borderRadius:2,fontSize:8,fontFamily:"monospace",background:J.google+"11",color:J.google,border:`1px solid ${J.google}33`}}>{campaign.channel||"—"}</span>}
                {roas&&<RoasBadge roas={roas}/>}
              </div>
            </div>
            <button onClick={onClose} style={{background:accentColor+"11",border:`1px solid ${accentColor}55`,borderRadius:2,color:accentColor,cursor:"pointer",fontSize:16,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
          </div>
          <div style={{display:"flex",gap:6}}>
            {SECS.map(s=><button key={s} onClick={()=>setSec(s)} style={{padding:"5px 14px",background:sec===s?accentColor+"22":"transparent",border:`1px solid ${sec===s?accentColor:J.border}`,borderRadius:2,color:sec===s?accentColor:J.muted,fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:1.5,boxShadow:sec===s?`0 0 6px ${accentColor}88`:"none"}}>{s}</button>)}
          </div>
        </div>
        <div style={{padding:20}}>
          {sec==="OVERVIEW"&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <JCard style={{padding:16}} glow accent={roasColor(roas)}>
                <div style={{fontSize:9,color:J.muted,letterSpacing:2,fontFamily:"monospace",marginBottom:8}}>◈ ROAS</div>
                <div style={{fontSize:36,fontWeight:900,color:roasColor(roas),fontFamily:"'Orbitron',monospace",textShadow:`0 0 20px ${roasColor(roas)}88`,letterSpacing:-1}}>{roas?`${parseFloat(roas).toFixed(2)}x`:"N/A"}</div>
                <div style={{fontSize:10,color:J.muted,marginTop:4,fontFamily:"monospace"}}>{roas>=4?"EXCELLENT ✓":roas>=2.5?"GOOD":roas>=1?"BELOW TARGET":"NO CONV DATA"}</div>
              </JCard>
              <JCard style={{padding:16}} glow accent={J.purple}>
                <div style={{fontSize:9,color:J.muted,letterSpacing:2,fontFamily:"monospace",marginBottom:8}}>◈ REVENUE</div>
                <div style={{fontSize:36,fontWeight:900,color:J.purple,fontFamily:"'Orbitron',monospace",textShadow:`0 0 20px ${J.purple}88`,letterSpacing:-1}}>{revenue?fmt(revenue):"N/A"}</div>
                <div style={{fontSize:10,color:J.muted,marginTop:4,fontFamily:"monospace"}}>{revenue&&spend>0?`Spend: ${fmt(spend)}`:"No conversions tracked"}</div>
              </JCard>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[["SPEND",fmt(spend),accentColor],["IMPRESSIONS",fmtN(impressions),J.muted],["CLICKS",fmtN(clicks),accentColor],
                isGoogle?["CONVERSIONS",parseFloat(ci.conversions||0).toFixed(0),J.green]:["REACH",fmtN(reach),J.muted],
                ["CTR",`${ctr.toFixed(2)}%`,ctr>=1?J.green:J.red],["CPC",`₹${cpc.toFixed(0)}`,cpc<=20?J.green:cpc<=50?J.yellow:J.red],
                ["CPM",`₹${cpm.toFixed(0)}`,J.muted],
                isGoogle?["CONV VALUE",revenue?fmt(revenue):"N/A",J.purple]:["FREQUENCY",freq.toFixed(2),freq>4?J.red:freq>2?J.yellow:J.green]
              ].map(([l,v,c])=>(
                <JCard key={l} style={{padding:"11px 13px"}} glow>
                  <div style={{fontSize:8,color:J.muted,letterSpacing:1.5,fontFamily:"monospace",marginBottom:3}}>{l}</div>
                  <div style={{fontSize:16,fontWeight:800,color:c,fontFamily:"monospace",textShadow:`0 0 8px ${c}55`}}>{v}</div>
                </JCard>
              ))}
            </div>
            {!isGoogle&&(parseInt(purchases)>0||parseInt(atc)>0)&&(
              <JCard style={{padding:16,marginBottom:16}} glow>
                <div style={{fontSize:9,color:J.cyan,letterSpacing:2,fontFamily:"monospace",marginBottom:12,textShadow:J.cyanGlowSm}}>◈ CONVERSION EVENTS</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[["PURCHASES",purchases,J.green],["ADD TO CART",atc,J.yellow],["VIEW CONTENT",(ci.actions||[]).find(a=>a.action_type==="view_content")?.value||0,J.cyan]].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:"center",padding:10,background:c+"0A",border:`1px solid ${c}22`,borderRadius:2}}>
                      <div style={{fontSize:22,fontWeight:900,color:c,fontFamily:"monospace"}}>{v}</div>
                      <div style={{fontSize:8,color:J.muted,letterSpacing:1.5,marginTop:4}}>{l}</div>
                    </div>
                  ))}
                </div>
              </JCard>
            )}
            <JCard style={{padding:16}} glow accent={accentColor}>
              <div style={{fontSize:9,color:accentColor,letterSpacing:2,fontFamily:"monospace",marginBottom:12,textShadow:`0 0 6px ${accentColor}88`}}>◈ CAMPAIGN INFO</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {(isGoogle?[
                  ["Daily Budget",campaign.daily_budget?fmt(campaign.daily_budget):"—"],
                  ["Channel",campaign.channel||"—"],
                  ["Conversions",parseFloat(campaign.conversions||0).toFixed(0)],
                  ["Conv Value",campaign.revenue?fmt(campaign.revenue):"—"],
                ]:[
                  ["Daily Budget",campaign.daily_budget?fmt(parseFloat(campaign.daily_budget)/100):"—"],
                  ["Lifetime Budget",campaign.lifetime_budget?fmt(parseFloat(campaign.lifetime_budget)/100):"—"],
                  ["Buying Type",campaign.buying_type||"—"],
                  ["Start Date",fmtDate(campaign.start_time)],
                  ["End Date",campaign.stop_time?fmtDate(campaign.stop_time):"Ongoing"],
                  ["Created",fmtDate(campaign.created_time)],
                ]).map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${J.border}`}}>
                    <span style={{fontSize:9,color:J.muted,fontFamily:"monospace"}}>▸ {l}</span>
                    <span style={{fontSize:11,fontWeight:700,color:J.text,fontFamily:"monospace"}}>{v}</span>
                  </div>
                ))}
              </div>
            </JCard>
          </>}
          {sec==="DAILY"&&!isGoogle&&(
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,fontFamily:"monospace",marginBottom:16}}>◈ DAILY PERFORMANCE</div>
              {loading?<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>LOADING...</div>:
              dailyData.length===0?<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>NO DAILY DATA</div>:<>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={dailyData.map(d=>({date:d.date_start?.slice(5),spend:parseFloat(d.spend||0),revenue:d.revenue||0}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={J.grid}/>
                    <XAxis dataKey="date" tick={{fontSize:8,fill:J.muted,fontFamily:"monospace"}}/>
                    <YAxis tick={{fontSize:8,fill:J.muted,fontFamily:"monospace"}}/>
                    <Tooltip contentStyle={{background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:3,fontSize:10,fontFamily:"monospace",color:J.cyan}} formatter={v=>[fmt(v)]}/>
                    <Bar dataKey="spend" fill={J.cyan} fillOpacity={.7} radius={[2,2,0,0]} name="Spend"/>
                    <Bar dataKey="revenue" fill={J.purple} fillOpacity={.7} radius={[2,2,0,0]} name="Revenue"/>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{overflowX:"auto",marginTop:16}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr style={{borderBottom:`1px solid ${J.border}`,background:J.cyan+"06"}}>
                      {["DATE","SPEND","REVENUE","ROAS","CLICKS","CTR","CPC"].map(h=><th key={h} style={{padding:"8px 10px",fontSize:7,color:J.muted,fontFamily:"monospace",letterSpacing:1.5,textAlign:h==="DATE"?"left":"center"}}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {dailyData.map((d,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${J.border}`}}>
                          <td style={{padding:"7px 10px",fontSize:10,color:J.text,fontFamily:"monospace"}}>{d.date_start}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:10,color:J.cyan,fontFamily:"monospace",fontWeight:700}}>{fmt(parseFloat(d.spend||0))}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:10,color:J.purple,fontFamily:"monospace",fontWeight:700}}>{d.revenue?fmt(d.revenue):"—"}</td>
                          <td style={{padding:"7px 10px",textAlign:"center"}}><RoasBadge roas={d.roas}/></td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>{fmtN(parseInt(d.clicks||0))}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,fontFamily:"monospace",color:parseFloat(d.ctr||0)>=1?J.green:J.red,fontWeight:700}}>{parseFloat(d.ctr||0).toFixed(2)}%</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>₹{parseFloat(d.cpc||0).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>}
            </JCard>
          )}
          {sec==="AD SETS"&&!isGoogle&&(
            <JCard style={{padding:0,overflow:"hidden"}} glow>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${J.border}`}}>
                <div style={{fontSize:9,color:J.cyan,letterSpacing:2,fontFamily:"monospace"}}>◈ AD SETS — {adsets.length} FOUND</div>
              </div>
              {loading?<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>LOADING...</div>:
              adsets.length===0?<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>NO AD SETS FOUND</div>:
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{borderBottom:`1px solid ${J.border}`,background:J.cyan+"06"}}>
                  {["AD SET","STATUS","DAILY BUDGET","OPTIMIZATION","BILLING"].map(h=><th key={h} style={{padding:"9px 12px",fontSize:7,color:J.muted,fontFamily:"monospace",letterSpacing:1.5,textAlign:h==="AD SET"?"left":"center"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {adsets.map((a,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${J.border}`}}>
                      <td style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:J.text,fontFamily:"monospace",maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</td>
                      <td style={{padding:"10px 12px",textAlign:"center"}}><span style={{padding:"2px 7px",borderRadius:2,fontSize:8,fontFamily:"monospace",background:a.status==="ACTIVE"?J.green+"18":J.muted+"18",color:a.status==="ACTIVE"?J.green:J.muted,border:`1px solid ${a.status==="ACTIVE"?J.green+"44":J.muted+"33"}`}}>{a.status}</span></td>
                      <td style={{padding:"10px 12px",textAlign:"center",fontSize:11,fontWeight:700,color:J.cyan,fontFamily:"monospace"}}>{a.daily_budget?fmt(parseFloat(a.daily_budget)/100):"—"}</td>
                      <td style={{padding:"10px 12px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>{a.optimization_goal?.replace(/_/g," ")||"—"}</td>
                      <td style={{padding:"10px 12px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>{a.billing_event?.replace(/_/g," ")||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>}
            </JCard>
          )}
        </div>
      </div>
    </div>
  );
}

function AIPanel({onClose,metaInsights,googleInsights,campaigns,datePreset}){
  const metaSpend=metaInsights.reduce((a,i)=>a+parseFloat(i.spend||0),0);
  const googleSpend=googleInsights?.spend||0;
  const totalSpend=metaSpend+googleSpend;
  const metaRoas=metaInsights.filter(i=>i.roas);
  const avgMetaRoas=metaRoas.length>0?(metaRoas.reduce((a,i)=>a+parseFloat(i.roas),0)/metaRoas.length).toFixed(2):null;
  const[msgs,setMsgs]=useState([{role:"assistant",content:`JARVIS ONLINE.\n\nMeta: ${metaInsights.length} campaigns | Spend: ${fmt(metaSpend)}\nGoogle: ${googleInsights?`Spend: ${fmt(googleSpend)} | ROAS: ${googleInsights.roas?.toFixed(2)||"N/A"}x`:"Connecting..."}\n\n⚡ Awaiting command.`}]);
  const[input,setInput]=useState("");const[loading,setLoading]=useState(false);const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"})},[msgs,loading]);
  const QUICK=["Compare Meta vs Google","Best ROAS campaign?","Where to shift budget?","Threat assessment"];
  const send=async(text)=>{
    const ctx=`\n\nREPRISE (${datePreset}): META spend=${fmt(metaSpend)} roas=${avgMetaRoas||"N/A"}x | GOOGLE spend=${fmt(googleSpend)} roas=${googleInsights?.roas?.toFixed(2)||"N/A"}x | Combined spend=${fmt(totalSpend)} | Meta top campaigns: ${metaInsights.slice(0,3).map(i=>`${i.campaign_name?.slice(0,15)} ₹${parseFloat(i.spend||0).toFixed(0)} ${i.roas?i.roas.toFixed(1)+"x":""}`).join(", ")} | Command: ${text}`;
    const nm=[...msgs,{role:"user",content:text}];setMsgs(nm);setInput("");setLoading(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM_PROMPT,messages:[...nm.slice(0,-1),{role:"user",content:ctx}]})});
      const d=await r.json();
      setMsgs(p=>[...p,{role:"assistant",content:d.content?.find(b=>b.type==="text")?.text||"Error."}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"CONNECTION INTERRUPTED."}]);}
    finally{setLoading(false);}
  };
  const renderMsg=(text)=>text.split('\n').map((line,i)=>{
    if(/^(🔍|⚡|🎯|🧪|📊|💰|JARVIS)/.test(line))return<div key={i} style={{color:J.cyan,fontWeight:700,fontSize:11,marginTop:10,marginBottom:2,fontFamily:"monospace"}}>{line}</div>;
    if(line.includes('**')){const p=line.split(/\*\*(.*?)\*\*/g);return<div key={i} style={{marginBottom:2,fontSize:11}}>{p.map((s,j)=>j%2===1?<strong key={j} style={{color:J.cyan}}>{s}</strong>:<span key={j} style={{color:J.muted}}>{s}</span>)}</div>;}
    if(/^[-•]/.test(line.trim()))return<div key={i} style={{paddingLeft:12,fontSize:10,color:J.muted,marginBottom:2}}><span style={{color:J.cyan}}>› </span>{line.replace(/^[-•]\s*/,"")}</div>;
    if(line.trim()==="")return<div key={i} style={{height:4}}/>;
    return<div key={i} style={{fontSize:10,color:"#7AB8CC",lineHeight:1.7,fontFamily:"monospace"}}>{line}</div>;
  });
  return(
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:370,background:J.bg,borderLeft:`1px solid ${J.borderBright}`,display:"flex",flexDirection:"column",zIndex:100,boxShadow:`-8px 0 40px ${J.cyan}18`}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${J.cyan},transparent)`}}/>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${J.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${J.cyan}`,display:"flex",alignItems:"center",justifyContent:"center",background:J.cyan+"0A"}}><div style={{width:12,height:12,borderRadius:"50%",background:J.cyan}}/></div>
          <div>
            <div style={{fontWeight:700,fontSize:12,color:J.cyan,fontFamily:"monospace",letterSpacing:3}}>J.A.R.V.I.S</div>
            <div style={{fontSize:8,color:J.muted,letterSpacing:1.5,fontFamily:"monospace"}}>META + GOOGLE · ACTIVE</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${J.border}`,borderRadius:2,color:J.muted,cursor:"pointer",fontSize:14,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{marginBottom:12,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8}}>
            {m.role==="assistant"&&<div style={{width:22,height:22,borderRadius:"50%",border:`1px solid ${J.cyan}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,background:J.cyan+"0A"}}><div style={{width:8,height:8,borderRadius:"50%",background:J.cyan}}/></div>}
            <div style={{maxWidth:"88%",padding:"9px 12px",borderRadius:m.role==="user"?"10px 2px 10px 10px":"2px 10px 10px 10px",background:m.role==="user"?J.cyan+"18":J.bg2,border:`1px solid ${m.role==="user"?J.cyan+"44":J.border}`,color:m.role==="user"?J.cyan:J.text}}>
              {m.role==="user"?<span style={{fontSize:11,fontFamily:"monospace",fontWeight:600}}>{m.content}</span>:renderMsg(m.content)}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:5,padding:10,alignItems:"center"}}>{[0,1,2,3].map(i=><div key={i} style={{width:5,height:2,background:J.cyan,animation:"blink 1s infinite",animationDelay:`${i*.15}s`}}/>)}<span style={{fontSize:9,color:J.muted,fontFamily:"monospace",letterSpacing:2,marginLeft:4}}>PROCESSING...</span></div>}
        <div ref={ref}/>
      </div>
      <div style={{padding:"6px 14px",display:"flex",gap:5,flexWrap:"wrap",borderTop:`1px solid ${J.border}`}}>
        {QUICK.map((q,i)=><button key={i} onClick={()=>send(q)} disabled={loading} style={{padding:"4px 9px",background:J.cyan+"0A",border:`1px solid ${J.cyan}33`,borderRadius:2,color:J.cyan,fontSize:9,cursor:"pointer",fontFamily:"monospace"}}>{q}</button>)}
      </div>
      <div style={{padding:"8px 14px 14px"}}>
        <div style={{display:"flex",gap:8,background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:3,padding:"7px 11px"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&input.trim()&&!loading&&send(input.trim())} placeholder="ENTER COMMAND..." style={{flex:1,background:"none",border:"none",color:J.cyan,fontSize:11,outline:"none",fontFamily:"monospace",letterSpacing:1}}/>
          <button onClick={()=>input.trim()&&!loading&&send(input.trim())} disabled={!input.trim()||loading} style={{width:28,height:28,borderRadius:2,background:input.trim()?J.cyan+"22":"transparent",border:`1px solid ${input.trim()?J.cyan:J.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim()?J.cyan:J.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const[tab,setTab]=useState("overview");
  const[aiOpen,setAiOpen]=useState(false);
  const[campaigns,setCampaigns]=useState([]);
  const[metaInsights,setMetaInsights]=useState([]);
  const[googleCampaigns,setGoogleCampaigns]=useState([]);
  const[googleSummary,setGoogleSummary]=useState(null);
  const[googleLoading,setGoogleLoading]=useState(true);
  const[metaLoading,setMetaLoading]=useState(true);
  const[lastUpdated,setLastUpdated]=useState(null);
  const[time,setTime]=useState(new Date());
  const[selectedCampaign,setSelectedCampaign]=useState(null);
  const[platformFilter,setPlatformFilter]=useState("ALL");
  const[statusFilter,setStatusFilter]=useState("ALL");
  const[datePreset,setDatePreset]=useState("last_30d");
  const[dateSince,setDateSince]=useState("");
  const[dateUntil,setDateUntil]=useState("");

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);

  const fetchMeta=async(preset,since,until)=>{
    setMetaLoading(true);
    const p=buildParams(preset,since,until);
    try{
      const[c,ins]=await Promise.all([fetch(`${API_URL}/api/campaigns`),fetch(`${API_URL}/api/insights?${p}`)]);
      const cd=await c.json(),id=await ins.json();
      if(cd.data)setCampaigns(cd.data);
      if(id.data)setMetaInsights(id.data);
    }catch(e){console.log("Meta error:",e);}
    finally{setMetaLoading(false);}
  };

  const fetchGoogle=async(preset,since,until)=>{
    setGoogleLoading(true);
    const p=buildParams(preset,since,until);
    try{
      const[camps,summary]=await Promise.all([
        fetch(`${API_URL}/api/google/campaigns?${p}`),
        fetch(`${API_URL}/api/google/insights?${p}`)
      ]);
      const cd=await camps.json(),sd=await summary.json();
      if(cd.data)setGoogleCampaigns(cd.data);
      if(sd.data)setGoogleSummary(sd.data);
    }catch(e){console.log("Google error:",e);}
    finally{setGoogleLoading(false);}
  };

  const fetchData=async(preset,since,until)=>{
    await Promise.all([fetchMeta(preset,since,until),fetchGoogle(preset,since,until)]);
    setLastUpdated(new Date());
  };

  useEffect(()=>{fetchData("last_30d","","");},[]);

  const handlePresetSelect=(preset)=>{setDatePreset(preset);if(preset!=="custom")fetchData(preset,"","");};
  const handleCustomApply=()=>{if(dateSince&&dateUntil)fetchData("custom",dateSince,dateUntil);};

  // Combined data
  const metaActive=campaigns.filter(c=>c.status==="ACTIVE");
  const metaSpend=metaInsights.reduce((a,i)=>a+parseFloat(i.spend||0),0);
  const metaRevenue=metaInsights.reduce((a,i)=>a+(i.revenue||0),0);
  const googleSpend=googleSummary?.spend||0;
  const googleRevenue=googleSummary?.conversion_value||0;
  const totalSpend=metaSpend+googleSpend;
  const totalRevenue=metaRevenue+googleRevenue;
  const blendedRoas=totalRevenue>0&&totalSpend>0?totalRevenue/totalSpend:null;
  const metaRoasCamps=metaInsights.filter(i=>i.roas);
  const avgMetaRoas=metaRoasCamps.length>0?metaRoasCamps.reduce((a,i)=>a+parseFloat(i.roas),0)/metaRoasCamps.length:null;
  const totalImpressions=metaInsights.reduce((a,i)=>a+parseInt(i.impressions||0),0)+(googleSummary?.impressions||0);
  const totalClicks=metaInsights.reduce((a,i)=>a+parseInt(i.clicks||0),0)+(googleSummary?.clicks||0);
  const avgCTR=totalImpressions>0?((totalClicks/totalImpressions)*100).toFixed(2):0;
  const loading=metaLoading||googleLoading;

  // All campaigns combined for table
  const allCampaigns=[
    ...campaigns.map(c=>{const ci=metaInsights.find(i=>i.campaign_id===c.id||i.campaign_name===c.name)||{};return{...c,...ci,platform:"meta"};}),
    ...googleCampaigns.map(c=>({...c,platform:"google",status:c.status==="ENABLED"?"ACTIVE":c.status}))
  ];
  const filteredCampaigns=allCampaigns.filter(c=>{
    if(platformFilter!=="ALL"&&c.platform!==platformFilter.toLowerCase())return false;
    if(statusFilter!=="ALL"&&c.status!==statusFilter)return false;
    return true;
  });

  const TABS=[{id:"overview",label:"OVERVIEW"},{id:"campaigns",label:`CAMPAIGNS [${allCampaigns.length}]`},{id:"intel",label:"INTEL"}];
  const trendData=Array.from({length:14},(_,i)=>({day:`D${i+1}`,meta:Math.round(metaSpend/14*(0.6+Math.random()*.8)),google:Math.round(googleSpend/14*(0.6+Math.random()*.8))}));

  return(
    <div style={{fontFamily:"'Courier New',monospace",background:J.bg,minHeight:"100vh",color:J.text,paddingRight:aiOpen?370:0,transition:"padding-right .3s",position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${J.cyan}33}
        @keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}
        @keyframes rotate{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .trow:hover{background:${J.cyan}08!important;cursor:pointer}
        .tbtn:hover{color:${J.cyan}!important}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1) sepia(1) saturate(5) hue-rotate(175deg);opacity:.6;cursor:pointer}
      `}</style>
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${J.grid} 1px,transparent 1px),linear-gradient(90deg,${J.grid} 1px,transparent 1px)`,backgroundSize:"44px 44px",pointerEvents:"none",zIndex:0}}/>

      {/* NAV */}
      <div style={{position:"sticky",top:0,zIndex:50,background:J.bg+"F0",borderBottom:`1px solid ${J.border}`,padding:"0 24px",backdropFilter:"blur(12px)"}}>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${J.cyan}88,transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <RepriseLogo size={52}/>
            <div style={{width:1,height:38,background:J.borderBright}}/>
            {TABS.map(t=><button key={t.id} className="tbtn" onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,color:tab===t.id?J.cyan:J.muted,padding:"4px 0",borderBottom:tab===t.id?`2px solid ${J.cyan}`:"2px solid transparent",transition:"all .2s",fontFamily:"monospace",letterSpacing:2,textShadow:tab===t.id?J.cyanGlowSm:"none"}}>{t.label}</button>)}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {blendedRoas&&<div style={{padding:"4px 12px",border:`1px solid ${roasColor(blendedRoas)}44`,borderRadius:2,background:roasColor(blendedRoas)+"0A"}}>
              <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>BLENDED ROAS </span>
              <span style={{fontSize:13,fontWeight:900,color:roasColor(blendedRoas),fontFamily:"monospace",textShadow:`0 0 8px ${roasColor(blendedRoas)}88`}}>{blendedRoas.toFixed(2)}x</span>
            </div>}
            <div style={{fontFamily:"monospace",fontSize:11,color:J.cyan,letterSpacing:2}}>{time.toLocaleTimeString()}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",border:`1px solid ${loading?J.yellow+"44":J.green+"44"}`,borderRadius:2}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:loading?J.yellow:J.green,boxShadow:`0 0 8px ${loading?J.yellow:J.green}`,animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:8,color:loading?J.yellow:J.green,fontFamily:"monospace",letterSpacing:2}}>{loading?"SYNCING":"ONLINE"}</span>
            </div>
            <button onClick={()=>fetchData(datePreset,dateSince,dateUntil)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,fontSize:9,cursor:"pointer",fontFamily:"monospace",boxShadow:J.cyanGlowSm}}>↻ SYNC</button>
            <button onClick={()=>setAiOpen(!aiOpen)} style={{padding:"6px 18px",background:aiOpen?J.cyan+"18":"transparent",border:`1px solid ${J.cyan}`,borderRadius:2,color:J.cyan,fontSize:10,cursor:"pointer",fontFamily:"monospace",letterSpacing:2,fontWeight:700,boxShadow:aiOpen?J.cyanGlow:J.cyanGlowSm}}>⚡ J.A.R.V.I.S</button>
          </div>
        </div>
      </div>

      {/* DATE BAR */}
      <div style={{background:J.bg2+"CC",borderBottom:`1px solid ${J.border}`,padding:"8px 24px",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <DateRangePicker activePreset={datePreset} onSelect={handlePresetSelect} dateSince={dateSince} setDateSince={setDateSince} dateUntil={dateUntil} setDateUntil={setDateUntil} onCustomApply={handleCustomApply}/>
        <div style={{fontSize:9,color:J.cyan,fontFamily:"monospace",letterSpacing:1,flexShrink:0}}>ACTIVE: {DATE_PRESETS.find(d=>d.value===datePreset)?.label}</div>
      </div>

      <div style={{padding:"18px 24px 60px",position:"relative",zIndex:1,animation:"fadeUp .3s ease"}}>
        {tab==="overview"&&<>
          {/* STATUS BAR */}
          <div style={{display:"flex",gap:8,marginBottom:14,padding:"7px 14px",background:J.bg2,border:`1px solid ${J.border}`,borderRadius:2,alignItems:"center"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:J.green,animation:"pulse 2s infinite",boxShadow:`0 0 6px ${J.green}`}}/>
            <span style={{fontFamily:"monospace",fontSize:9,color:J.muted,letterSpacing:1.5}}>
              META: {campaigns.length} campaigns {metaLoading?"(syncing)":"✓"} · GOOGLE: {googleCampaigns.length} campaigns {googleLoading?"(syncing)":"✓"} · COMBINED SPEND: {fmt(totalSpend)}{blendedRoas?` · ROAS: ${blendedRoas.toFixed(2)}x`:""} · {lastUpdated?.toLocaleTimeString()||"—"}
            </span>
          </div>

          {/* TOP KPI ROW */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:14}}>
            {[
              ["TOTAL SPEND",fmt(totalSpend),J.cyan],
              ["TOTAL REVENUE",totalRevenue>0?fmt(totalRevenue):"N/A",J.purple],
              ["BLENDED ROAS",blendedRoas?`${blendedRoas.toFixed(2)}x`:"N/A",blendedRoas?roasColor(blendedRoas):J.muted],
              ["META ROAS",avgMetaRoas?`${avgMetaRoas.toFixed(2)}x`:"N/A",avgMetaRoas?roasColor(avgMetaRoas):J.muted],
              ["GOOGLE ROAS",googleSummary?.roas?`${googleSummary.roas.toFixed(2)}x`:"N/A",googleSummary?.roas?roasColor(googleSummary.roas):J.muted],
              ["AVG CTR",`${avgCTR}%`,parseFloat(avgCTR)>=1?J.green:J.red],
            ].map(([l,v,c])=>(
              <JCard key={l} style={{padding:"12px 14px"}} glow accent={c}>
                <div style={{fontSize:8,color:J.muted,letterSpacing:1.5,fontFamily:"monospace",marginBottom:4}}>◈ {l}</div>
                <div style={{fontSize:18,fontWeight:900,color:c,fontFamily:"'Orbitron',monospace",textShadow:`0 0 10px ${c}66`,letterSpacing:-0.5}}>{v}</div>
              </JCard>
            ))}
          </div>

          {/* PLATFORM CARDS */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <PlatformCard platform="meta" data={metaInsights} loading={metaLoading}/>
            <PlatformCard platform="google" data={googleSummary} loading={googleLoading}/>
          </div>

          {/* CHARTS */}
          <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14}}>
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,marginBottom:14,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ META vs GOOGLE — SPEND TRAJECTORY</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={J.meta} stopOpacity={.3}/><stop offset="95%" stopColor={J.meta} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={J.google} stopOpacity={.3}/><stop offset="95%" stopColor={J.google} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={J.grid}/>
                  <XAxis dataKey="day" tick={{fontSize:7,fill:J.muted,fontFamily:"monospace"}}/><YAxis tick={{fontSize:7,fill:J.muted,fontFamily:"monospace"}}/>
                  <Tooltip contentStyle={{background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:3,fontSize:10,fontFamily:"monospace"}} formatter={v=>[fmt(v)]}/>
                  <Legend wrapperStyle={{fontSize:9,fontFamily:"monospace",color:J.muted}}/>
                  <Area type="monotone" dataKey="meta" stroke={J.meta} fill="url(#mg)" strokeWidth={2} dot={false} name="Meta"/>
                  <Area type="monotone" dataKey="google" stroke={J.google} fill="url(#gg)" strokeWidth={2} dot={false} name="Google"/>
                </AreaChart>
              </ResponsiveContainer>
            </JCard>
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,marginBottom:14,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ TOP ROAS TARGETS</div>
              {[...metaInsights.filter(i=>i.roas).map(i=>({...i,platform:"meta"})),...googleCampaigns.filter(i=>i.roas).map(i=>({...i,platform:"google"}))]
                .sort((a,b)=>parseFloat(b.roas)-parseFloat(a.roas)).slice(0,6).map((c,i)=>(
                <div key={i} style={{marginBottom:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center",gap:6}}>
                    <PlatformTag platform={c.platform}/>
                    <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.campaign_name||c.name}</span>
                    <RoasBadge roas={c.roas}/>
                  </div>
                  <div style={{height:2,background:J.border,borderRadius:1}}>
                    <div style={{width:`${Math.min(parseFloat(c.roas||0)/8*100,100)}%`,height:"100%",background:roasColor(c.roas),boxShadow:`0 0 4px ${roasColor(c.roas)}`}}/>
                  </div>
                </div>
              ))}
              {[...metaInsights.filter(i=>i.roas),...googleCampaigns.filter(i=>i.roas)].length===0&&(
                <div style={{fontSize:10,color:J.muted,fontFamily:"monospace",textAlign:"center",padding:20}}>No ROAS data.<br/>Ensure conversion tracking is set up.</div>
              )}
            </JCard>
          </div>
        </>}

        {/* CAMPAIGNS TAB */}
        {tab==="campaigns"&&<JCard style={{overflow:"hidden"}} glow>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${J.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:10,color:J.cyan,letterSpacing:2,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ ALL CAMPAIGNS — {filteredCampaigns.length} ENTRIES</div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:8,color:J.muted,fontFamily:"monospace"}}>PLATFORM:</span>
              {["ALL","META","GOOGLE"].map(s=><button key={s} onClick={()=>setPlatformFilter(s)} style={{padding:"3px 9px",background:platformFilter===s?J.cyan+"22":"transparent",border:`1px solid ${platformFilter===s?J.cyan:J.border}`,borderRadius:2,color:platformFilter===s?J.cyan:J.muted,fontSize:8,cursor:"pointer",fontFamily:"monospace",boxShadow:platformFilter===s?J.cyanGlowSm:"none"}}>{s}</button>)}
              <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",marginLeft:8}}>STATUS:</span>
              {["ALL","ACTIVE","PAUSED"].map(s=><button key={s} onClick={()=>setStatusFilter(s)} style={{padding:"3px 9px",background:statusFilter===s?J.cyan+"22":"transparent",border:`1px solid ${statusFilter===s?J.cyan:J.border}`,borderRadius:2,color:statusFilter===s?J.cyan:J.muted,fontSize:8,cursor:"pointer",fontFamily:"monospace",boxShadow:statusFilter===s?J.cyanGlowSm:"none"}}>{s}</button>)}
              <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",marginLeft:8}}>↗ CLICK TO EXPAND</span>
            </div>
          </div>
          {loading&&<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:11}}>LOADING...</div>}
          {!loading&&filteredCampaigns.length>0&&<div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${J.border}`,background:J.cyan+"04"}}>
                {["PLATFORM","CAMPAIGN","STATUS","SPEND","ROAS","REVENUE","CTR","CPC","↗"].map(h=><th key={h} style={{padding:"9px 12px",fontSize:7,color:J.muted,textAlign:h==="CAMPAIGN"?"left":"center",fontFamily:"monospace",letterSpacing:2}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredCampaigns.map((c,i)=>{
                  const ctr=parseFloat(c.ctr||0),cpc=parseFloat(c.cpc||0);
                  return(<tr key={i} className="trow" onClick={()=>setSelectedCampaign(c)} style={{borderBottom:`1px solid ${J.border}`,transition:"background .15s"}}>
                    <td style={{padding:"10px 12px",textAlign:"center"}}><PlatformTag platform={c.platform}/></td>
                    <td style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:J.text,fontFamily:"monospace",maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:c.platform==="google"?J.google:J.cyan,marginRight:6,fontSize:8}}>▸</span>{c.name||c.campaign_name}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}><span style={{padding:"2px 7px",borderRadius:2,fontSize:8,fontFamily:"monospace",background:c.status==="ACTIVE"||c.status==="ENABLED"?J.green+"18":J.muted+"18",color:c.status==="ACTIVE"||c.status==="ENABLED"?J.green:J.muted,border:`1px solid ${c.status==="ACTIVE"||c.status==="ENABLED"?J.green+"44":J.muted+"33"}`}}>{c.status}</span></td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontSize:11,fontWeight:700,color:c.platform==="google"?J.google:J.cyan,fontFamily:"monospace"}}>{c.spend?fmt(parseFloat(c.spend)):"—"}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}><RoasBadge roas={c.roas}/></td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontSize:11,fontWeight:700,color:J.purple,fontFamily:"monospace"}}>{c.revenue&&c.revenue>0?fmt(c.revenue):"—"}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}>{ctr>0?<span style={{padding:"2px 7px",borderRadius:2,fontSize:9,fontFamily:"monospace",background:ctr>=1?J.green+"18":J.red+"18",color:ctr>=1?J.green:J.red,border:`1px solid ${ctr>=1?J.green+"44":J.red+"44"}`}}>{ctr.toFixed(2)}%</span>:<span style={{color:J.muted,fontSize:9}}>—</span>}</td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontSize:10,fontWeight:700,color:cpc<=20?J.green:cpc<=50?J.yellow:cpc>0?J.red:J.muted,fontFamily:"monospace"}}>{cpc>0?`₹${cpc.toFixed(0)}`:"—"}</td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontSize:9,color:J.cyan,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>EXPAND</td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>}
        </JCard>}

        {/* INTEL TAB */}
        {tab==="intel"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* META INTEL */}
          <JCard style={{overflow:"hidden"}} glow>
            <div style={{padding:"12px 18px",borderBottom:`1px solid ${J.border}`,display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:10,color:J.meta,letterSpacing:2,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ META INTEL</div>
              <span style={{fontSize:8,color:J.muted,fontFamily:"monospace"}}>{metaInsights.length} campaigns · click to expand</span>
            </div>
            {metaInsights.length===0?<div style={{padding:30,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>NO META DATA</div>:
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:J.meta+"04",borderBottom:`1px solid ${J.border}`}}>
                  {["CAMPAIGN","SPEND","ROAS","CTR","CPC"].map(h=><th key={h} style={{padding:"8px 10px",fontSize:7,color:J.muted,textAlign:h==="CAMPAIGN"?"left":"center",fontFamily:"monospace",letterSpacing:2}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {metaInsights.sort((a,b)=>parseFloat(b.spend||0)-parseFloat(a.spend||0)).map((c,i)=>{
                    const ctr=parseFloat(c.ctr||0),cpc=parseFloat(c.cpc||0);
                    const camp=campaigns.find(x=>x.id===c.campaign_id||x.name===c.campaign_name);
                    return(<tr key={i} className="trow" onClick={()=>camp&&setSelectedCampaign({...camp,...c,platform:"meta"})} style={{borderBottom:`1px solid ${J.border}`}}>
                      <td style={{padding:"9px 10px",fontSize:10,fontWeight:700,color:J.text,fontFamily:"monospace",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.campaign_name}</td>
                      <td style={{padding:"9px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:J.cyan,fontFamily:"monospace"}}>{fmt(parseFloat(c.spend||0))}</td>
                      <td style={{padding:"9px 10px",textAlign:"center"}}><RoasBadge roas={c.roas}/></td>
                      <td style={{padding:"9px 10px",textAlign:"center"}}><span style={{padding:"2px 6px",borderRadius:2,fontSize:9,fontFamily:"monospace",background:ctr>=1?J.green+"18":J.red+"18",color:ctr>=1?J.green:J.red}}>{ctr.toFixed(2)}%</span></td>
                      <td style={{padding:"9px 10px",textAlign:"center",fontSize:10,color:cpc<=20?J.green:cpc<=50?J.yellow:J.red,fontFamily:"monospace",fontWeight:700}}>₹{cpc.toFixed(0)}</td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>}
          </JCard>
          {/* GOOGLE INTEL */}
          <JCard style={{overflow:"hidden"}} glow accent={J.google}>
            <div style={{padding:"12px 18px",borderBottom:`1px solid ${J.border}`,display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:10,color:J.google,letterSpacing:2,fontFamily:"monospace",textShadow:`0 0 6px ${J.google}88`}}>◈ GOOGLE INTEL</div>
              <span style={{fontSize:8,color:J.muted,fontFamily:"monospace"}}>{googleCampaigns.length} campaigns · click to expand</span>
            </div>
            {googleLoading?<div style={{padding:30,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>SYNCING...</div>:
            googleCampaigns.length===0?<div style={{padding:30,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>NO GOOGLE DATA<br/><span style={{fontSize:9,opacity:.6}}>Check Google credentials in Render</span></div>:
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:J.google+"04",borderBottom:`1px solid ${J.border}`}}>
                  {["CAMPAIGN","SPEND","ROAS","CTR","CPC"].map(h=><th key={h} style={{padding:"8px 10px",fontSize:7,color:J.muted,textAlign:h==="CAMPAIGN"?"left":"center",fontFamily:"monospace",letterSpacing:2}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {googleCampaigns.sort((a,b)=>parseFloat(b.spend||0)-parseFloat(a.spend||0)).map((c,i)=>{
                    const ctr=parseFloat(c.ctr||0),cpc=parseFloat(c.cpc||0);
                    return(<tr key={i} className="trow" onClick={()=>setSelectedCampaign({...c,platform:"google"})} style={{borderBottom:`1px solid ${J.border}`}}>
                      <td style={{padding:"9px 10px",fontSize:10,fontWeight:700,color:J.text,fontFamily:"monospace",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name||c.campaign_name}</td>
                      <td style={{padding:"9px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:J.google,fontFamily:"monospace"}}>{fmt(parseFloat(c.spend||0))}</td>
                      <td style={{padding:"9px 10px",textAlign:"center"}}><RoasBadge roas={c.roas}/></td>
                      <td style={{padding:"9px 10px",textAlign:"center"}}><span style={{padding:"2px 6px",borderRadius:2,fontSize:9,fontFamily:"monospace",background:ctr>=1?J.green+"18":J.red+"18",color:ctr>=1?J.green:J.red}}>{ctr.toFixed(2)}%</span></td>
                      <td style={{padding:"9px 10px",textAlign:"center",fontSize:10,color:cpc<=20?J.green:cpc<=50?J.yellow:J.red,fontFamily:"monospace",fontWeight:700}}>₹{cpc.toFixed(0)}</td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>}
          </JCard>
        </div>}
      </div>

      {/* BOTTOM BAR */}
      <div style={{position:"fixed",bottom:0,left:0,right:aiOpen?370:0,background:J.bg+"F0",borderTop:`1px solid ${J.border}`,padding:"5px 24px",display:"flex",alignItems:"center",gap:12,zIndex:40,backdropFilter:"blur(10px)",transition:"right .3s"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${J.cyan}44,transparent)`}}/>
        <div style={{width:5,height:5,borderRadius:"50%",background:J.green,animation:"pulse 2s infinite",boxShadow:`0 0 6px ${J.green}`}}/>
        <span style={{fontSize:8,color:J.meta,fontFamily:"monospace"}}>META {metaLoading?"...":"✓"}</span>
        <span style={{fontSize:8,color:J.google,fontFamily:"monospace"}}>GOOGLE {googleLoading?"...":"✓"}</span>
        <span style={{fontSize:8,color:J.border}}>·</span>
        <span style={{fontSize:8,color:J.muted,fontFamily:"monospace"}}>{allCampaigns.length} CAMPAIGNS</span>
        <span style={{fontSize:8,color:J.border}}>·</span>
        <span style={{fontSize:8,color:J.cyan,fontFamily:"monospace"}}>{DATE_PRESETS.find(d=>d.value===datePreset)?.label}</span>
        {blendedRoas&&<><span style={{fontSize:8,color:J.border}}>·</span><span style={{fontSize:8,color:roasColor(blendedRoas),fontFamily:"monospace",fontWeight:700}}>ROAS {blendedRoas.toFixed(2)}x</span></>}
        <span style={{marginLeft:"auto",fontSize:8,color:J.cyan,fontFamily:"monospace",cursor:"pointer",textShadow:J.cyanGlowSm}} onClick={()=>fetchData(datePreset,dateSince,dateUntil)}>↻ SYNC</span>
      </div>

      {selectedCampaign&&<CampaignDrawer campaign={selectedCampaign} insights={metaInsights} googleCampaigns={googleCampaigns} datePreset={datePreset} dateSince={dateSince} dateUntil={dateUntil} onClose={()=>setSelectedCampaign(null)}/>}
      {aiOpen&&<AIPanel onClose={()=>setAiOpen(false)} metaInsights={metaInsights} googleInsights={googleSummary} campaigns={campaigns} datePreset={datePreset}/>}
    </div>
  );
}
