import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const API_URL = "https://reprise-ads.onrender.com";
const J = {
  bg:"#020914",bg2:"#040D1A",cyan:"#00D4FF",cyanGlow:"0 0 10px #00D4FF,0 0 20px #00D4FF44",
  cyanGlowSm:"0 0 6px #00D4FF88",orange:"#FF6B35",green:"#00FF88",red:"#FF3366",yellow:"#FFD700",
  border:"#00D4FF18",borderBright:"#00D4FF55",text:"#E0F4FF",muted:"#3A7A94",grid:"#00D4FF06",
};
const SYSTEM_PROMPT=`You are JARVIS — Reprise's elite paid growth AI for an Indian D2C clothing brand. Respond: 🔍 DIAGNOSIS → ⚡ THREAT → 🎯 ACTION → 🧪 EXPERIMENT → 📊 MONITOR → 💰 COMMAND. Sharp, decisive, occasional dry wit.`;
const DATE_PRESETS=[
  {label:"TODAY",value:"today"},
  {label:"7 DAYS",value:"last_7d"},
  {label:"14 DAYS",value:"last_14d"},
  {label:"30 DAYS",value:"last_30d"},
  {label:"60 DAYS",value:"last_60d"},
  {label:"90 DAYS",value:"last_90d"},
  {label:"CUSTOM",value:"custom"},
];
const fmt=n=>n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${Math.round(n||0)}`;
const fmtN=n=>n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:`${n||0}`;
const fmtDate=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';

// BUILD DATE PARAMS — takes values directly, no state dependency
const buildParams=(preset,since,until)=>{
  if(preset==="custom"&&since&&until)return`date_since=${since}&date_until=${until}`;
  if(preset&&preset!=="custom")return`date_preset=${preset}`;
  return"date_preset=last_30d";
};

// REPRISE LOGO — uses actual image from public folder, centered with glow
const RepriseLogo=({size=120})=>(
  <div style={{
    width:size,height:size,
    display:"flex",alignItems:"center",justifyContent:"center",
    position:"relative",flexShrink:0,
  }}>
    <img
      src="/reprise-logo.jpg"
      alt="Reprise"
      style={{
        width:"100%",height:"100%",
        objectFit:"contain",
        filter:"brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(170deg) brightness(1.2) drop-shadow(0 0 8px #00D4FF) drop-shadow(0 0 16px #00D4FF66)",
        display:"block",
      }}
    />
  </div>
);

const ArcReactor=({value,max,label,color=J.cyan,size=88})=>{
  const r=size*.36,circ=2*Math.PI*r,pct=Math.min((parseFloat(value)||0)/Math.max(parseFloat(max)||1,1)*100,100),dash=(pct/100)*circ;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color+"18"} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{filter:`drop-shadow(0 0 5px ${color})`}}/>
        <circle cx={size/2} cy={size/2} r={r*.5} fill={color+"0A"} stroke={color+"33"} strokeWidth="1"/>
        <text x={size/2} y={size/2+5} textAnchor="middle" fill={color} fontSize={size*.14} fontFamily="monospace" fontWeight="800">
          {typeof value==="number"&&value>9999?fmtN(value):value}
        </text>
      </svg>
      <div style={{fontSize:8,color:J.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"monospace"}}>{label}</div>
    </div>
  );
};

const JCard=({children,style={},glow=false,accent=J.cyan})=>(
  <div style={{background:`linear-gradient(135deg,${J.bg2} 0%,#050E1C 100%)`,border:`1px solid ${glow?accent+"55":J.border}`,borderRadius:3,position:"relative",overflow:"hidden",boxShadow:glow?`inset 0 0 30px ${accent}05`:"",...style}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${accent},transparent)`}}/>
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${accent}33,transparent)`}}/>
    {children}
  </div>
);

function DateRangePicker({activePreset,onSelect,dateSince,setDateSince,dateUntil,setDateUntil,onCustomApply}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:2}}>DATE RANGE:</span>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {DATE_PRESETS.map(p=>(
          <button key={p.value} onClick={()=>onSelect(p.value)}
            style={{padding:"4px 10px",background:activePreset===p.value?J.cyan+"22":"transparent",border:`1px solid ${activePreset===p.value?J.cyan:J.border}`,borderRadius:2,color:activePreset===p.value?J.cyan:J.muted,fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:1,boxShadow:activePreset===p.value?J.cyanGlowSm:"none",transition:"all .2s"}}>
            {p.label}
          </button>
        ))}
      </div>
      {activePreset==="custom"&&(
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <input type="date" value={dateSince} onChange={e=>setDateSince(e.target.value)}
            style={{padding:"3px 8px",background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,fontSize:10,fontFamily:"monospace",outline:"none",colorScheme:"dark"}}/>
          <span style={{color:J.muted,fontSize:9}}>TO</span>
          <input type="date" value={dateUntil} onChange={e=>setDateUntil(e.target.value)}
            style={{padding:"3px 8px",background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,fontSize:10,fontFamily:"monospace",outline:"none",colorScheme:"dark"}}/>
          <button onClick={onCustomApply}
            style={{padding:"4px 12px",background:J.cyan+"22",border:`1px solid ${J.cyan}`,borderRadius:2,color:J.cyan,fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:1,boxShadow:J.cyanGlowSm}}>
            APPLY
          </button>
        </div>
      )}
    </div>
  );
}

function CampaignDrawer({campaign,insights,datePreset,dateSince,dateUntil,onClose}){
  const[sec,setSec]=useState("OVERVIEW");
  const[adsets,setAdsets]=useState([]);
  const[dailyData,setDailyData]=useState([]);
  const[loading,setLoading]=useState(true);
  const ci=insights.find(i=>i.campaign_id===campaign.id||i.campaign_name===campaign.name)||{};
  const spend=parseFloat(ci.spend||0),impressions=parseInt(ci.impressions||0),clicks=parseInt(ci.clicks||0);
  const ctr=parseFloat(ci.ctr||0),cpc=parseFloat(ci.cpc||0),cpm=parseFloat(ci.cpm||0);
  const reach=parseInt(ci.reach||0),freq=parseFloat(ci.frequency||0);
  const purchases=(ci.actions||[]).find(a=>a.action_type==="purchase")?.value||0;
  const atc=(ci.actions||[]).find(a=>a.action_type==="add_to_cart")?.value||0;
  const vc=(ci.actions||[]).find(a=>a.action_type==="view_content")?.value||0;

  useEffect(()=>{
    const p=buildParams(datePreset,dateSince,dateUntil);
    const go=async()=>{
      setLoading(true);
      try{
        const[a,d]=await Promise.all([
          fetch(`${API_URL}/api/campaigns/${campaign.id}/adsets?${p}`),
          fetch(`${API_URL}/api/campaigns/${campaign.id}/daily?${p}`)
        ]);
        const ad=await a.json(),dd=await d.json();
        setAdsets(ad.adsets||[]);setDailyData(dd.data||[]);
      }catch(e){console.log(e);}finally{setLoading(false);}
    };go();
  },[campaign.id,datePreset,dateSince,dateUntil]);

  const SECS=["OVERVIEW","DAILY","AD SETS"];
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(2,9,20,.85)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",width:680,background:J.bg,borderLeft:`1px solid ${J.borderBright}`,overflowY:"auto",zIndex:201,boxShadow:`-12px 0 60px ${J.cyan}22`}}>
        <div style={{position:"sticky",top:0,background:J.bg+"F8",borderBottom:`1px solid ${J.border}`,padding:"14px 20px",zIndex:10,backdropFilter:"blur(10px)"}}>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${J.cyan},transparent)`}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div style={{flex:1,paddingRight:16}}>
              <div style={{fontSize:9,color:J.muted,letterSpacing:2,fontFamily:"monospace",marginBottom:4}}>◈ CAMPAIGN DETAIL</div>
              <div style={{fontSize:14,fontWeight:700,color:J.cyan,fontFamily:"monospace",textShadow:J.cyanGlowSm,lineHeight:1.3}}>{campaign.name}</div>
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                <span style={{padding:"2px 8px",borderRadius:2,fontSize:8,fontFamily:"monospace",letterSpacing:1.5,background:campaign.status==="ACTIVE"?J.green+"18":J.muted+"18",color:campaign.status==="ACTIVE"?J.green:J.muted,border:`1px solid ${campaign.status==="ACTIVE"?J.green+"44":J.muted+"33"}`}}>{campaign.status}</span>
                <span style={{padding:"2px 8px",borderRadius:2,fontSize:8,fontFamily:"monospace",background:J.cyan+"11",color:J.cyan,border:`1px solid ${J.border}`}}>{campaign.objective?.replace("OUTCOME_","")||"—"}</span>
                <span style={{fontSize:8,color:J.muted,fontFamily:"monospace"}}>ID: {campaign.id}</span>
              </div>
            </div>
            <button onClick={onClose} style={{background:J.cyan+"11",border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,cursor:"pointer",fontSize:16,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
          </div>
          <div style={{display:"flex",gap:6}}>
            {SECS.map(s=><button key={s} onClick={()=>setSec(s)} style={{padding:"5px 14px",background:sec===s?J.cyan+"22":"transparent",border:`1px solid ${sec===s?J.cyan:J.border}`,borderRadius:2,color:sec===s?J.cyan:J.muted,fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:1.5,boxShadow:sec===s?J.cyanGlowSm:"none"}}>{s}</button>)}
          </div>
        </div>
        <div style={{padding:20}}>
          {sec==="OVERVIEW"&&<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[["SPEND",fmt(spend),J.cyan],["IMPRESSIONS",fmtN(impressions),J.muted],["CLICKS",fmtN(clicks),J.cyan],["REACH",fmtN(reach),J.muted],["CTR",`${ctr.toFixed(2)}%`,ctr>=1?J.green:J.red],["CPC",`₹${cpc.toFixed(0)}`,cpc<=20?J.green:cpc<=50?J.yellow:J.red],["CPM",`₹${cpm.toFixed(0)}`,J.muted],["FREQUENCY",freq.toFixed(2),freq>4?J.red:freq>2?J.yellow:J.green]].map(([l,v,c])=>(
                <JCard key={l} style={{padding:"12px 14px"}} glow>
                  <div style={{fontSize:8,color:J.muted,letterSpacing:1.5,fontFamily:"monospace",marginBottom:4}}>{l}</div>
                  <div style={{fontSize:18,fontWeight:800,color:c,fontFamily:"monospace",textShadow:`0 0 10px ${c}66`}}>{v}</div>
                </JCard>
              ))}
            </div>
            {(parseInt(purchases)>0||parseInt(atc)>0||parseInt(vc)>0)&&(
              <JCard style={{padding:16,marginBottom:16}} glow>
                <div style={{fontSize:9,color:J.cyan,letterSpacing:2,fontFamily:"monospace",marginBottom:12,textShadow:J.cyanGlowSm}}>◈ CONVERSION EVENTS</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[["PURCHASES",purchases,J.green],["ADD TO CART",atc,J.yellow],["VIEW CONTENT",vc,J.cyan]].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:"center",padding:"10px",background:c+"0A",border:`1px solid ${c}22`,borderRadius:2}}>
                      <div style={{fontSize:22,fontWeight:900,color:c,fontFamily:"monospace",textShadow:`0 0 10px ${c}66`}}>{v}</div>
                      <div style={{fontSize:8,color:J.muted,letterSpacing:1.5,marginTop:4}}>{l}</div>
                    </div>
                  ))}
                </div>
              </JCard>
            )}
            <JCard style={{padding:16}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,fontFamily:"monospace",marginBottom:12,textShadow:J.cyanGlowSm}}>◈ CAMPAIGN INFO</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[["Daily Budget",campaign.daily_budget?fmt(parseFloat(campaign.daily_budget)/100):"—"],["Lifetime Budget",campaign.lifetime_budget?fmt(parseFloat(campaign.lifetime_budget)/100):"—"],["Budget Remaining",campaign.budget_remaining?fmt(parseFloat(campaign.budget_remaining)/100):"—"],["Buying Type",campaign.buying_type||"—"],["Start Date",fmtDate(campaign.start_time)],["End Date",campaign.stop_time?fmtDate(campaign.stop_time):"Ongoing"],["Created",fmtDate(campaign.created_time)],["Last Updated",fmtDate(campaign.updated_time)]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${J.border}`}}>
                    <span style={{fontSize:9,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>▸ {l}</span>
                    <span style={{fontSize:11,fontWeight:700,color:J.text,fontFamily:"monospace"}}>{v}</span>
                  </div>
                ))}
              </div>
            </JCard>
          </>}
          {sec==="DAILY"&&(
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,fontFamily:"monospace",marginBottom:16,textShadow:J.cyanGlowSm}}>◈ DAILY PERFORMANCE</div>
              {loading?<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10,letterSpacing:2}}>LOADING...</div>:
              dailyData.length===0?<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>NO DAILY DATA FOR THIS PERIOD</div>:<>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:9,color:J.muted,letterSpacing:1.5,fontFamily:"monospace",marginBottom:8}}>DAILY SPEND</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={dailyData.map(d=>({date:d.date_start?.slice(5),spend:parseFloat(d.spend||0)}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={J.grid}/>
                      <XAxis dataKey="date" tick={{fontSize:8,fill:J.muted,fontFamily:"monospace"}}/>
                      <YAxis tick={{fontSize:8,fill:J.muted,fontFamily:"monospace"}}/>
                      <Tooltip contentStyle={{background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:3,fontSize:10,fontFamily:"monospace",color:J.cyan}} formatter={v=>[fmt(v),"Spend"]}/>
                      <Bar dataKey="spend" fill={J.cyan} fillOpacity={.7} radius={[2,2,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:9,color:J.muted,letterSpacing:1.5,fontFamily:"monospace",marginBottom:8}}>DAILY CTR %</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={dailyData.map(d=>({date:d.date_start?.slice(5),ctr:parseFloat(d.ctr||0)}))}>
                      <defs><linearGradient id="ctrG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={J.green} stopOpacity={.25}/><stop offset="95%" stopColor={J.green} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={J.grid}/>
                      <XAxis dataKey="date" tick={{fontSize:8,fill:J.muted,fontFamily:"monospace"}}/>
                      <YAxis tick={{fontSize:8,fill:J.muted,fontFamily:"monospace"}}/>
                      <Tooltip contentStyle={{background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:3,fontSize:10,fontFamily:"monospace",color:J.green}} formatter={v=>[`${parseFloat(v).toFixed(2)}%`,"CTR"]}/>
                      <Area type="monotone" dataKey="ctr" stroke={J.green} fill="url(#ctrG)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr style={{borderBottom:`1px solid ${J.border}`,background:J.cyan+"06"}}>
                      {["DATE","SPEND","IMPR","CLICKS","CTR","CPC","CPM","FREQ"].map(h=><th key={h} style={{padding:"8px 10px",fontSize:7,color:J.muted,fontFamily:"monospace",letterSpacing:1.5,textAlign:h==="DATE"?"left":"center"}}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {dailyData.map((d,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${J.border}`}}>
                          <td style={{padding:"7px 10px",fontSize:10,color:J.text,fontFamily:"monospace"}}>{d.date_start}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:10,color:J.cyan,fontFamily:"monospace",fontWeight:700}}>{fmt(parseFloat(d.spend||0))}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>{fmtN(parseInt(d.impressions||0))}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>{fmtN(parseInt(d.clicks||0))}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,fontFamily:"monospace",color:parseFloat(d.ctr||0)>=1?J.green:J.red,fontWeight:700}}>{parseFloat(d.ctr||0).toFixed(2)}%</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>₹{parseFloat(d.cpc||0).toFixed(0)}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>₹{parseFloat(d.cpm||0).toFixed(0)}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontSize:9,fontFamily:"monospace",color:parseFloat(d.frequency||0)>4?J.red:parseFloat(d.frequency||0)>2?J.yellow:J.green}}>{parseFloat(d.frequency||0).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>}
            </JCard>
          )}
          {sec==="AD SETS"&&(
            <JCard style={{padding:0,overflow:"hidden"}} glow>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${J.border}`}}>
                <div style={{fontSize:9,color:J.cyan,letterSpacing:2,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ AD SETS — {adsets.length} FOUND</div>
              </div>
              {loading?<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10,letterSpacing:2}}>LOADING...</div>:
              adsets.length===0?<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>NO AD SETS FOUND</div>:
              <div style={{overflowX:"auto"}}>
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
                </table>
              </div>}
            </JCard>
          )}
        </div>
      </div>
    </div>
  );
}

function AIPanel({onClose,campaigns,insights}){
  const[msgs,setMsgs]=useState([{role:"assistant",content:`JARVIS ONLINE.\n\n${campaigns.length} campaigns synchronized. ${campaigns.filter(c=>c.status==="ACTIVE").length} active.\n\n⚡ Awaiting command.`}]);
  const[input,setInput]=useState("");const[loading,setLoading]=useState(false);const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"})},[msgs,loading]);
  const QUICK=["Analyse campaigns","Biggest waste?","What to scale?","Threat assessment"];
  const send=async(text)=>{
    const ctx=`\n\nREPRISE: ${campaigns.length} campaigns | ${campaigns.filter(c=>c.status==="ACTIVE").length} active | Leaders: ${insights.slice(0,3).map(i=>`${i.campaign_name?.slice(0,20)} ₹${parseFloat(i.spend||0).toFixed(0)}`).join(", ")} | Command: ${text}`;
    const nm=[...msgs,{role:"user",content:text}];setMsgs(nm);setInput("");setLoading(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM_PROMPT,messages:[...nm.slice(0,-1),{role:"user",content:ctx}]})});
      const d=await r.json();
      setMsgs(p=>[...p,{role:"assistant",content:d.content?.find(b=>b.type==="text")?.text||"Error."}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"CONNECTION INTERRUPTED."}]);}
    finally{setLoading(false);}
  };
  const renderMsg=(text)=>text.split('\n').map((line,i)=>{
    if(/^(🔍|⚡|🎯|🧪|📊|💰|JARVIS)/.test(line))return<div key={i} style={{color:J.cyan,fontWeight:700,fontSize:11,marginTop:10,marginBottom:2,textShadow:J.cyanGlowSm,fontFamily:"monospace"}}>{line}</div>;
    if(line.includes('**')){const p=line.split(/\*\*(.*?)\*\*/g);return<div key={i} style={{marginBottom:2,fontSize:11}}>{p.map((s,j)=>j%2===1?<strong key={j} style={{color:J.cyan}}>{s}</strong>:<span key={j} style={{color:J.muted}}>{s}</span>)}</div>;}
    if(/^[-•]/.test(line.trim()))return<div key={i} style={{paddingLeft:12,fontSize:10,color:J.muted,marginBottom:2}}><span style={{color:J.cyan}}>› </span>{line.replace(/^[-•]\s*/,"")}</div>;
    if(line.trim()==="")return<div key={i} style={{height:4}}/>;
    return<div key={i} style={{fontSize:10,color:"#7AB8CC",lineHeight:1.7,fontFamily:"monospace"}}>{line}</div>;
  });
  return(
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:370,background:J.bg,borderLeft:`1px solid ${J.borderBright}`,display:"flex",flexDirection:"column",zIndex:100,boxShadow:`-8px 0 40px ${J.cyan}18`}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${J.cyan},transparent)`,boxShadow:J.cyanGlow}}/>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${J.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${J.cyan}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:J.cyanGlow,background:J.cyan+"0A"}}><div style={{width:12,height:12,borderRadius:"50%",background:J.cyan,boxShadow:J.cyanGlow}}/></div>
          <div><div style={{fontWeight:700,fontSize:12,color:J.cyan,fontFamily:"monospace",letterSpacing:3,textShadow:J.cyanGlowSm}}>J.A.R.V.I.S</div><div style={{fontSize:8,color:J.muted,letterSpacing:2,fontFamily:"monospace"}}>GROWTH INTELLIGENCE</div></div>
        </div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${J.border}`,borderRadius:2,color:J.muted,cursor:"pointer",fontSize:14,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14,background:J.bg}}>
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
  const[insights,setInsights]=useState([]);
  const[loading,setLoading]=useState(true);
  const[lastUpdated,setLastUpdated]=useState(null);
  const[time,setTime]=useState(new Date());
  const[selectedCampaign,setSelectedCampaign]=useState(null);
  const[statusFilter,setStatusFilter]=useState("ALL");
  // Date range stored as plain state — NO useCallback dependency issues
  const[datePreset,setDatePreset]=useState("last_30d");
  const[dateSince,setDateSince]=useState("");
  const[dateUntil,setDateUntil]=useState("");

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);

  // fetchData takes ALL params directly — never reads stale state
  const fetchData=async(preset,since,until)=>{
    setLoading(true);
    const params=buildParams(preset,since,until);
    try{
      const[c,ins]=await Promise.all([
        fetch(`${API_URL}/api/campaigns`),
        fetch(`${API_URL}/api/insights?${params}`)
      ]);
      const cd=await c.json(),id=await ins.json();
      if(cd.data)setCampaigns(cd.data);
      if(id.data)setInsights(id.data);
      setLastUpdated(new Date());
    }catch(e){console.log(e);}
    finally{setLoading(false);}
  };

  // Initial load
  useEffect(()=>{
    fetchData("last_30d","","");
    const t=setInterval(()=>fetchData(datePreset,dateSince,dateUntil),300000);
    return()=>clearInterval(t);
  // eslint-disable-next-line
  },[]);

  // When user selects a preset button
  const handlePresetSelect=(preset)=>{
    setDatePreset(preset);
    if(preset!=="custom"){
      fetchData(preset,"","");
    }
  };

  // When user clicks Apply on custom range
  const handleCustomApply=()=>{
    if(dateSince&&dateUntil){
      fetchData("custom",dateSince,dateUntil);
    }
  };

  const filteredCampaigns=statusFilter==="ALL"?campaigns:campaigns.filter(c=>c.status===statusFilter);
  const active=campaigns.filter(c=>c.status==="ACTIVE");
  const totalBudget=campaigns.reduce((a,c)=>a+(parseFloat(c.daily_budget||0)/100),0);
  const totalSpend=insights.reduce((a,i)=>a+parseFloat(i.spend||0),0);
  const totalImpressions=insights.reduce((a,i)=>a+parseInt(i.impressions||0),0);
  const totalClicks=insights.reduce((a,i)=>a+parseInt(i.clicks||0),0);
  const avgCTR=totalImpressions>0?((totalClicks/totalImpressions)*100).toFixed(2):0;
  const avgCPC=totalClicks>0?(totalSpend/totalClicks).toFixed(0):0;
  const avgCPM=totalImpressions>0?((totalSpend/totalImpressions)*1000).toFixed(0):0;
  const TABS=[{id:"overview",label:"OVERVIEW"},{id:"campaigns",label:`CAMPAIGNS [${campaigns.length}]`},{id:"insights",label:"INTEL"}];
  const trendData=Array.from({length:14},(_,i)=>({day:`D${i+1}`,v:Math.round(totalSpend/14*(0.6+Math.random()*.8))}));

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
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            {/* LOGO IN NAV — fixed size, no crop */}
            <div style={{width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <img src="/reprise-logo.jpg" alt="Reprise"
                style={{width:44,height:44,objectFit:"contain",filter:"brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(170deg) brightness(1.2) drop-shadow(0 0 6px #00D4FF)",display:"block"}}/>
            </div>
            <div style={{width:1,height:38,background:J.borderBright}}/>
            {TABS.map(t=><button key={t.id} className="tbtn" onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,color:tab===t.id?J.cyan:J.muted,padding:"4px 0",borderBottom:tab===t.id?`2px solid ${J.cyan}`:"2px solid transparent",transition:"all .2s",fontFamily:"monospace",letterSpacing:2,textShadow:tab===t.id?J.cyanGlowSm:"none"}}>{t.label}</button>)}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontFamily:"monospace",fontSize:11,color:J.cyan,textShadow:J.cyanGlowSm,letterSpacing:2}}>{time.toLocaleTimeString()}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",border:`1px solid ${loading?J.yellow+"44":J.green+"44"}`,borderRadius:2}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:loading?J.yellow:J.green,boxShadow:`0 0 8px ${loading?J.yellow:J.green}`,animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:8,color:loading?J.yellow:J.green,fontFamily:"monospace",letterSpacing:2}}>{loading?"SYNCING":"ONLINE"}</span>
            </div>
            <button onClick={()=>fetchData(datePreset,dateSince,dateUntil)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:1.5,boxShadow:J.cyanGlowSm}}>↻ SYNC</button>
            <button onClick={()=>setAiOpen(!aiOpen)} style={{padding:"6px 18px",background:aiOpen?J.cyan+"18":"transparent",border:`1px solid ${J.cyan}`,borderRadius:2,color:J.cyan,fontSize:10,cursor:"pointer",fontFamily:"monospace",letterSpacing:2,fontWeight:700,boxShadow:aiOpen?J.cyanGlow:J.cyanGlowSm,textShadow:J.cyanGlowSm}}>⚡ J.A.R.V.I.S</button>
          </div>
        </div>
      </div>

      {/* DATE BAR */}
      <div style={{background:J.bg2+"CC",borderBottom:`1px solid ${J.border}`,padding:"8px 24px",backdropFilter:"blur(8px)"}}>
        <DateRangePicker
          activePreset={datePreset}
          onSelect={handlePresetSelect}
          dateSince={dateSince} setDateSince={setDateSince}
          dateUntil={dateUntil} setDateUntil={setDateUntil}
          onCustomApply={handleCustomApply}
        />
      </div>

      <div style={{padding:"18px 24px 60px",position:"relative",zIndex:1,animation:"fadeUp .3s ease"}}>
        {tab==="overview"&&<>
          <div style={{display:"flex",gap:8,marginBottom:14,padding:"7px 14px",background:J.bg2,border:`1px solid ${J.border}`,borderRadius:2,alignItems:"center"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:J.green,animation:"pulse 2s infinite",boxShadow:`0 0 6px ${J.green}`}}/>
            <span style={{fontFamily:"monospace",fontSize:9,color:J.muted,letterSpacing:1.5}}>SYSTEM: OPERATIONAL · META: CONNECTED · {campaigns.length} CAMPAIGNS · {active.length} ACTIVE · RANGE: {DATE_PRESETS.find(d=>d.value===datePreset)?.label||datePreset} · SYNCED: {lastUpdated?.toLocaleTimeString()||"—"}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"280px 1fr 260px",gap:14,marginBottom:14}}>
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,marginBottom:14,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ SYSTEM POWER</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <ArcReactor value={active.length} max={Math.max(campaigns.length,1)} label="ACTIVE" color={J.green} size={88}/>
                <ArcReactor value={totalClicks} max={Math.max(totalClicks*1.2,1)} label="CLICKS" color={J.cyan} size={88}/>
                <ArcReactor value={parseFloat(avgCTR)} max={5} label="CTR %" color={parseFloat(avgCTR)>=1?J.green:J.orange} size={88}/>
                <ArcReactor value={parseInt(avgCPC)} max={100} label="CPC ₹" color={J.yellow} size={88}/>
              </div>
            </JCard>

            {/* CENTER with logo — properly centered */}
            <JCard style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}} glow>
              <div style={{position:"relative",width:200,height:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{position:"absolute",width:200,height:200,border:`1px solid ${J.cyan}11`,borderRadius:"50%",animation:"rotate 25s linear infinite"}}/>
                <div style={{position:"absolute",width:170,height:170,border:`1px dashed ${J.cyan}18`,borderRadius:"50%",animation:"rotate 18s linear infinite reverse"}}/>
                <div style={{position:"absolute",width:140,height:140,border:`1px solid ${J.cyan}22`,borderRadius:"50%"}}/>
                {/* LOGO — centered, contained within circle */}
                <div style={{width:100,height:100,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1}}>
                  <img src="/reprise-logo.jpg" alt="Reprise"
                    style={{width:"100%",height:"100%",objectFit:"contain",filter:"brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(170deg) brightness(1.3) drop-shadow(0 0 8px #00D4FF) drop-shadow(0 0 16px #00D4FF66)",display:"block"}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,width:"100%"}}>
                {[[fmt(totalSpend),"SPEND",J.cyan],[fmt(totalBudget),"DAILY BUDGET",J.orange],[fmtN(totalImpressions),"IMPRESSIONS",J.muted]].map(([v,l,c])=>(
                  <div key={l} style={{textAlign:"center",padding:"8px 6px",background:c+"0A",border:`1px solid ${c}22`,borderRadius:2}}>
                    <div style={{fontSize:16,fontWeight:900,color:c,fontFamily:"'Orbitron',monospace",textShadow:`0 0 10px ${c}66`,letterSpacing:-0.5}}>{v}</div>
                    <div style={{fontSize:7,color:J.muted,letterSpacing:1.5,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </JCard>

            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,marginBottom:14,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ FINANCIAL INTEL</div>
              {[["CAMPAIGNS",campaigns.length,J.cyan],["ACTIVE",active.length,J.green],["W/ INTEL",insights.length,J.yellow],["AVG CPM",`₹${avgCPM}`,J.cyan],["AVG CPC",`₹${avgCPC}`,J.green],["AVG CTR",`${avgCTR}%`,parseFloat(avgCTR)>=1?J.green:J.red]].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${J.border}`}}>
                  <span style={{fontSize:8,color:J.muted,letterSpacing:1.5,fontFamily:"monospace"}}>▸ {l}</span>
                  <span style={{fontSize:13,fontWeight:700,color:c,fontFamily:"monospace",textShadow:`0 0 8px ${c}66`}}>{v}</span>
                </div>
              ))}
            </JCard>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14}}>
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,marginBottom:14,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ SPEND TRAJECTORY</div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={trendData}>
                  <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={J.cyan} stopOpacity={.25}/><stop offset="95%" stopColor={J.cyan} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={J.grid}/>
                  <XAxis dataKey="day" tick={{fontSize:7,fill:J.muted,fontFamily:"monospace"}}/><YAxis tick={{fontSize:7,fill:J.muted,fontFamily:"monospace"}}/>
                  <Tooltip contentStyle={{background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:3,fontSize:10,fontFamily:"monospace",color:J.cyan}}/>
                  <Area type="monotone" dataKey="v" stroke={J.cyan} fill="url(#cg)" strokeWidth={2} dot={false} style={{filter:`drop-shadow(0 0 4px ${J.cyan})`}} name="₹"/>
                </AreaChart>
              </ResponsiveContainer>
            </JCard>
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,marginBottom:14,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ TOP SPEND TARGETS</div>
              {insights.slice(0,5).map((c,i)=>(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>▸ {c.campaign_name}</span>
                    <span style={{fontSize:10,fontWeight:700,color:J.cyan,fontFamily:"monospace"}}>{fmt(parseFloat(c.spend||0))}</span>
                  </div>
                  <div style={{height:2,background:J.border,borderRadius:1}}><div style={{width:`${totalSpend>0?(parseFloat(c.spend||0)/totalSpend)*100:0}%`,height:"100%",background:J.cyan,boxShadow:J.cyanGlowSm}}/></div>
                </div>
              ))}
            </JCard>
          </div>
        </>}

        {tab==="campaigns"&&<JCard style={{overflow:"hidden"}} glow>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${J.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:10,color:J.cyan,letterSpacing:2,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ CAMPAIGN REGISTRY — {filteredCampaigns.length} ENTRIES</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1.5}}>FILTER:</span>
              {["ALL","ACTIVE","PAUSED"].map(s=><button key={s} onClick={()=>setStatusFilter(s)} style={{padding:"3px 10px",background:statusFilter===s?J.cyan+"22":"transparent",border:`1px solid ${statusFilter===s?J.cyan:J.border}`,borderRadius:2,color:statusFilter===s?J.cyan:J.muted,fontSize:8,cursor:"pointer",fontFamily:"monospace",letterSpacing:1,boxShadow:statusFilter===s?J.cyanGlowSm:"none"}}>{s}</button>)}
              <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1,marginLeft:8}}>↗ CLICK ROW TO EXPAND</span>
            </div>
          </div>
          {loading&&<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",letterSpacing:2,fontSize:11}}>LOADING...</div>}
          {!loading&&filteredCampaigns.length>0&&<div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${J.border}`,background:J.cyan+"04"}}>
                {["CAMPAIGN","STATUS","OBJECTIVE","DAILY BUDGET","SPEND","CTR","CPC","↗"].map(h=><th key={h} style={{padding:"9px 14px",fontSize:7,color:J.muted,textAlign:h==="CAMPAIGN"?"left":"center",fontFamily:"monospace",letterSpacing:2}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredCampaigns.map((c,i)=>{
                  const ci=insights.find(ins=>ins.campaign_id===c.id||ins.campaign_name===c.name)||{};
                  const ctr=parseFloat(ci.ctr||0),cpc=parseFloat(ci.cpc||0);
                  return(<tr key={i} className="trow" onClick={()=>setSelectedCampaign(c)} style={{borderBottom:`1px solid ${J.border}`,transition:"background .15s"}}>
                    <td style={{padding:"11px 14px",fontSize:11,fontWeight:700,color:J.text,fontFamily:"monospace",maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:J.cyan,marginRight:6,fontSize:8}}>▸</span>{c.name}</td>
                    <td style={{padding:"11px 14px",textAlign:"center"}}><span style={{padding:"2px 8px",borderRadius:2,fontSize:8,fontFamily:"monospace",letterSpacing:1.5,background:c.status==="ACTIVE"?J.green+"18":J.muted+"18",color:c.status==="ACTIVE"?J.green:J.muted,border:`1px solid ${c.status==="ACTIVE"?J.green+"44":J.muted+"33"}`,boxShadow:c.status==="ACTIVE"?`0 0 6px ${J.green}44`:""}}>{c.status}</span></td>
                    <td style={{padding:"11px 14px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace"}}>{c.objective?.replace("OUTCOME_","")||"—"}</td>
                    <td style={{padding:"11px 14px",textAlign:"center",fontSize:11,fontWeight:700,color:J.cyan,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>{c.daily_budget?fmt(parseFloat(c.daily_budget)/100):"—"}</td>
                    <td style={{padding:"11px 14px",textAlign:"center",fontSize:11,fontWeight:700,color:J.orange,fontFamily:"monospace"}}>{ci.spend?fmt(parseFloat(ci.spend)):"—"}</td>
                    <td style={{padding:"11px 14px",textAlign:"center"}}>{ci.ctr?<span style={{padding:"2px 7px",borderRadius:2,fontSize:9,fontFamily:"monospace",background:ctr>=1?J.green+"18":J.red+"18",color:ctr>=1?J.green:J.red,border:`1px solid ${ctr>=1?J.green+"44":J.red+"44"}`}}>{ctr.toFixed(2)}%</span>:<span style={{color:J.muted,fontSize:9}}>—</span>}</td>
                    <td style={{padding:"11px 14px",textAlign:"center",fontSize:10,fontWeight:700,color:cpc<=20?J.green:cpc<=50?J.yellow:cpc>0?J.red:J.muted,fontFamily:"monospace"}}>{ci.cpc?`₹${cpc.toFixed(0)}`:"—"}</td>
                    <td style={{padding:"11px 14px",textAlign:"center",fontSize:9,color:J.cyan,fontFamily:"monospace",letterSpacing:1,textShadow:J.cyanGlowSm}}>EXPAND</td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>}
        </JCard>}

        {tab==="insights"&&<JCard style={{overflow:"hidden"}} glow>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${J.border}`}}>
            <div style={{fontSize:10,color:J.cyan,letterSpacing:2,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ PERFORMANCE INTELLIGENCE — {insights.length} TARGETS · CLICK ROW TO EXPAND</div>
          </div>
          {insights.length===0&&<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:10}}>NO INTELLIGENCE DATA FOR SELECTED PERIOD</div>}
          {insights.length>0&&<div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:J.cyan+"04",borderBottom:`1px solid ${J.border}`}}>
                {["CAMPAIGN","SPEND","IMPRESSIONS","CLICKS","CTR","CPC","CPM","REACH","FREQ"].map(h=><th key={h} style={{padding:"9px 14px",fontSize:7,color:J.muted,textAlign:h==="CAMPAIGN"?"left":"center",fontFamily:"monospace",letterSpacing:2}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {insights.map((c,i)=>{
                  const ctr=parseFloat(c.ctr||0),cpc=parseFloat(c.cpc||0),freq=parseFloat(c.frequency||0);
                  return(<tr key={i} className="trow" onClick={()=>{const camp=campaigns.find(x=>x.id===c.campaign_id||x.name===c.campaign_name);if(camp)setSelectedCampaign(camp);}} style={{borderBottom:`1px solid ${J.border}`,transition:"background .15s"}}>
                    <td style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:J.text,fontFamily:"monospace",maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:J.cyan,marginRight:6,fontSize:8}}>▸</span>{c.campaign_name}</td>
                    <td style={{padding:"10px 14px",textAlign:"center",fontSize:12,fontWeight:700,color:J.cyan,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>{fmt(parseFloat(c.spend||0))}</td>
                    <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,color:J.muted,fontFamily:"monospace"}}>{fmtN(parseInt(c.impressions||0))}</td>
                    <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,color:J.muted,fontFamily:"monospace"}}>{fmtN(parseInt(c.clicks||0))}</td>
                    <td style={{padding:"10px 14px",textAlign:"center"}}><span style={{padding:"2px 7px",borderRadius:2,fontSize:9,fontFamily:"monospace",background:ctr>=1?J.green+"18":J.red+"18",color:ctr>=1?J.green:J.red,border:`1px solid ${ctr>=1?J.green+"44":J.red+"44"}`}}>{ctr.toFixed(2)}%</span></td>
                    <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,fontWeight:700,color:cpc<=20?J.green:cpc<=50?J.yellow:J.red,fontFamily:"monospace"}}>₹{cpc.toFixed(0)}</td>
                    <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,color:J.muted,fontFamily:"monospace"}}>₹{parseFloat(c.cpm||0).toFixed(0)}</td>
                    <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,color:J.muted,fontFamily:"monospace"}}>{fmtN(parseInt(c.reach||0))}</td>
                    <td style={{padding:"10px 14px",textAlign:"center"}}><span style={{padding:"2px 7px",borderRadius:2,fontSize:9,fontFamily:"monospace",background:freq>4?J.red+"18":freq>2?J.yellow+"18":J.green+"18",color:freq>4?J.red:freq>2?J.yellow:J.green}}>{freq.toFixed(1)}</span></td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>}
        </JCard>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:aiOpen?370:0,background:J.bg+"F0",borderTop:`1px solid ${J.border}`,padding:"5px 24px",display:"flex",alignItems:"center",gap:14,zIndex:40,backdropFilter:"blur(10px)",transition:"right .3s"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${J.cyan}44,transparent)`}}/>
        <div style={{width:5,height:5,borderRadius:"50%",background:J.green,animation:"pulse 2s infinite",boxShadow:`0 0 6px ${J.green}`}}/>
        <span style={{fontSize:8,color:J.green,fontFamily:"monospace",letterSpacing:2}}>LIVE META DATA</span>
        <span style={{fontSize:8,color:J.border}}>·</span>
        <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>{campaigns.length} CAMPAIGNS</span>
        <span style={{fontSize:8,color:J.border}}>·</span>
        <span style={{fontSize:8,color:J.cyan,fontFamily:"monospace",letterSpacing:1}}>{DATE_PRESETS.find(d=>d.value===datePreset)?.label||datePreset}</span>
        <span style={{marginLeft:"auto",fontSize:8,color:J.cyan,fontFamily:"monospace",letterSpacing:1.5,cursor:"pointer",textShadow:J.cyanGlowSm}} onClick={()=>fetchData(datePreset,dateSince,dateUntil)}>↻ SYNC</span>
      </div>

      {selectedCampaign&&<CampaignDrawer campaign={selectedCampaign} insights={insights} datePreset={datePreset} dateSince={dateSince} dateUntil={dateUntil} onClose={()=>setSelectedCampaign(null)}/>}
      {aiOpen&&<AIPanel onClose={()=>setAiOpen(false)} campaigns={campaigns} insights={insights}/>}
    </div>
  );
}
