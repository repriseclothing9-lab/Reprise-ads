import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const API_URL = "https://reprise-ads.onrender.com";

const J = {
  bg:"#020914", bg2:"#040D1A", cyan:"#00D4FF", cyanDim:"#00D4FF22",
  cyanGlow:"0 0 10px #00D4FF, 0 0 20px #00D4FF44", cyanGlowSm:"0 0 6px #00D4FF88",
  orange:"#FF6B35", green:"#00FF88", greenGlow:"0 0 8px #00FF88",
  red:"#FF3366", yellow:"#FFD700", border:"#00D4FF18", borderBright:"#00D4FF55",
  text:"#E0F4FF", muted:"#3A7A94", grid:"#00D4FF06",
};

const SYSTEM_PROMPT = `You are JARVIS — Reprise's elite paid growth AI for an Indian D2C clothing brand. Analyze with military precision. Always respond: 🔍 DIAGNOSIS → ⚡ THREAT → 🎯 ACTION → 🧪 EXPERIMENT → 📊 MONITOR → 💰 COMMAND. Sharp, decisive. Speak like JARVIS — intelligent, precise, occasional dry wit.`;

const fmt = n => n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${Math.round(n||0)}`;
const fmtN = n => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:`${n||0}`;

const RepriseLogo = ({size=48})=>(
  <svg width={size} height={size*.9} viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{filter:"drop-shadow(0 0 8px #00D4FF) drop-shadow(0 0 20px #00D4FF44)"}}>
    <path d="M15 8 L85 8 L105 42 L85 76 L62 76 L78 48 L68 24 L28 24 L15 8Z" fill="#00D4FF" opacity=".95"/>
    <path d="M205 8 L135 8 L115 42 L135 76 L158 76 L142 48 L152 24 L192 24 L205 8Z" fill="#00D4FF" opacity=".95"/>
    <path d="M110 52 L115 67 L131 67 L119 76 L124 91 L110 82 L96 91 L101 76 L89 67 L105 67Z" fill="#00D4FF"/>
    <rect x="0" y="105" width="220" height="2" fill="#00D4FF" opacity=".3"/>
    <text x="110" y="142" textAnchor="middle" fontFamily="'Orbitron','Arial Black',monospace" fontSize="36" fontWeight="900" fill="#00D4FF" letterSpacing="10">REPRISE</text>
    <text x="110" y="162" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#00D4FF66" letterSpacing="8">ADS COMMAND</text>
  </svg>
);

const ArcReactor = ({value,max,label,color=J.cyan,size=88})=>{
  const r=size*.36; const circ=2*Math.PI*r;
  const pct=Math.min((parseFloat(value)||0)/Math.max(parseFloat(max)||1,1)*100,100);
  const dash=(pct/100)*circ;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color+"18"} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{filter:`drop-shadow(0 0 5px ${color})`}}/>
        <circle cx={size/2} cy={size/2} r={r*.5} fill={color+"0A"} stroke={color+"33"} strokeWidth="1"/>
        <text x={size/2} y={size/2+5} textAnchor="middle" fill={color} fontSize={size*.15} fontFamily="monospace" fontWeight="800">
          {typeof value==="number"&&value>9999?fmtN(value):value}
        </text>
      </svg>
      <div style={{fontSize:8,color:J.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"monospace"}}>{label}</div>
    </div>
  );
};

const JCard = ({children,style={},glow=false,accent=J.cyan})=>(
  <div style={{background:`linear-gradient(135deg,${J.bg2} 0%,#050E1C 100%)`,border:`1px solid ${glow?accent+"55":J.border}`,borderRadius:3,position:"relative",overflow:"hidden",boxShadow:glow?`inset 0 0 30px ${accent}05`:"",...style}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${accent},transparent)`}}/>
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${accent}33,transparent)`}}/>
    {children}
  </div>
);

function AIPanel({onClose,campaigns,insights}){
  const [msgs,setMsgs]=useState([{role:"assistant",content:`JARVIS ONLINE.\n\nAll systems operational. ${campaigns.length} campaigns synchronized from Meta.\n${campaigns.filter(c=>c.status==="ACTIVE").length} active targets detected.\n\n⚡ Awaiting your command.`}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"})},[msgs,loading]);
  const QUICK=["Analyse campaigns","Biggest waste?","What to scale?","Threat assessment"];
  const send=async(text)=>{
    const ctx=`\n\nREPRISE LIVE DATA: ${campaigns.length} campaigns | ${campaigns.filter(c=>c.status==="ACTIVE").length} active | Spend leaders: ${insights.slice(0,3).map(i=>`${i.campaign_name?.slice(0,20)} ₹${parseFloat(i.spend||0).toFixed(0)}`).join(", ")} | Command: ${text}`;
    const nm=[...msgs,{role:"user",content:text}];
    setMsgs(nm);setInput("");setLoading(true);
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
          <div style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${J.cyan}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:J.cyanGlow,background:J.cyan+"0A"}}>
            <div style={{width:12,height:12,borderRadius:"50%",background:J.cyan,boxShadow:J.cyanGlow}}/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:12,color:J.cyan,fontFamily:"monospace",letterSpacing:3,textShadow:J.cyanGlowSm}}>J.A.R.V.I.S</div>
            <div style={{fontSize:8,color:J.muted,letterSpacing:2,fontFamily:"monospace"}}>GROWTH INTELLIGENCE · ACTIVE</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${J.border}`,borderRadius:2,color:J.muted,cursor:"pointer",fontSize:14,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14,background:J.bg}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{marginBottom:12,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8}}>
            {m.role==="assistant"&&<div style={{width:22,height:22,borderRadius:"50%",border:`1px solid ${J.cyan}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,background:J.cyan+"0A"}}><div style={{width:8,height:8,borderRadius:"50%",background:J.cyan}}/></div>}
            <div style={{maxWidth:"88%",padding:"9px 12px",borderRadius:m.role==="user"?"10px 2px 10px 10px":"2px 10px 10px 10px",background:m.role==="user"?J.cyan+"18":J.bg2,border:`1px solid ${m.role==="user"?J.cyan+"44":J.border}`,color:m.role==="user"?J.cyan:J.text,boxShadow:m.role==="user"?J.cyanGlowSm:"none"}}>
              {m.role==="user"?<span style={{fontSize:11,fontFamily:"monospace",fontWeight:600}}>{m.content}</span>:renderMsg(m.content)}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:5,padding:10,alignItems:"center"}}>{[0,1,2,3].map(i=><div key={i} style={{width:5,height:2,background:J.cyan,boxShadow:J.cyanGlowSm,animation:"blink 1s infinite",animationDelay:`${i*.15}s`}}/>)}<span style={{fontSize:9,color:J.muted,fontFamily:"monospace",letterSpacing:2,marginLeft:4}}>PROCESSING...</span></div>}
        <div ref={ref}/>
      </div>
      <div style={{padding:"6px 14px",display:"flex",gap:5,flexWrap:"wrap",borderTop:`1px solid ${J.border}`}}>
        {QUICK.map((q,i)=><button key={i} onClick={()=>send(q)} disabled={loading} style={{padding:"4px 9px",background:J.cyan+"0A",border:`1px solid ${J.cyan}33`,borderRadius:2,color:J.cyan,fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:0.5}}>{q}</button>)}
      </div>
      <div style={{padding:"8px 14px 14px"}}>
        <div style={{display:"flex",gap:8,background:J.bg2,border:`1px solid ${J.borderBright}`,borderRadius:3,padding:"7px 11px"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&input.trim()&&!loading&&send(input.trim())} placeholder="ENTER COMMAND..." style={{flex:1,background:"none",border:"none",color:J.cyan,fontSize:11,outline:"none",fontFamily:"monospace",letterSpacing:1}}/>
          <button onClick={()=>input.trim()&&!loading&&send(input.trim())} disabled={!input.trim()||loading} style={{width:28,height:28,borderRadius:2,background:input.trim()?J.cyan+"22":"transparent",border:`1px solid ${input.trim()?J.cyan:J.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:input.trim()?J.cyanGlowSm:"none"}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim()?J.cyan:J.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [tab,setTab]=useState("overview");
  const [aiOpen,setAiOpen]=useState(false);
  const [campaigns,setCampaigns]=useState([]);
  const [insights,setInsights]=useState([]);
  const [loading,setLoading]=useState(true);
  const [lastUpdated,setLastUpdated]=useState(null);
  const [time,setTime]=useState(new Date());

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);

  const fetchData=async()=>{
    setLoading(true);
    try{
      const [c,ins]=await Promise.all([fetch(`${API_URL}/api/campaigns`),fetch(`${API_URL}/api/insights`)]);
      const cd=await c.json();const id=await ins.json();
      if(cd.data)setCampaigns(cd.data);
      if(id.data)setInsights(id.data);
      setLastUpdated(new Date());
    }catch(e){console.log(e);}
    finally{setLoading(false);}
  };

  useEffect(()=>{fetchData();const t=setInterval(fetchData,300000);return()=>clearInterval(t);},[]);

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
        .trow:hover{background:${J.cyan}06!important}
        .tbtn:hover{color:${J.cyan}!important;text-shadow:${J.cyanGlowSm}!important}
      `}</style>

      {/* GRID */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${J.grid} 1px,transparent 1px),linear-gradient(90deg,${J.grid} 1px,transparent 1px)`,backgroundSize:"44px 44px",pointerEvents:"none",zIndex:0}}/>

      {/* NAV */}
      <div style={{position:"sticky",top:0,zIndex:50,background:J.bg+"F0",borderBottom:`1px solid ${J.border}`,padding:"0 24px",backdropFilter:"blur(12px)"}}>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${J.cyan}88,transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <RepriseLogo size={42}/>
            <div style={{width:1,height:38,background:J.borderBright}}/>
            {TABS.map(t=>(
              <button key={t.id} className="tbtn" onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,color:tab===t.id?J.cyan:J.muted,padding:"4px 0",borderBottom:tab===t.id?`2px solid ${J.cyan}`:"2px solid transparent",transition:"all .2s",fontFamily:"monospace",letterSpacing:2,textShadow:tab===t.id?J.cyanGlowSm:"none"}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontFamily:"monospace",fontSize:11,color:J.cyan,textShadow:J.cyanGlowSm,letterSpacing:2}}>{time.toLocaleTimeString()}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",border:`1px solid ${loading?J.yellow+"44":J.green+"44"}`,borderRadius:2}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:loading?J.yellow:J.green,boxShadow:`0 0 8px ${loading?J.yellow:J.green}`,animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:8,color:loading?J.yellow:J.green,fontFamily:"monospace",letterSpacing:2}}>{loading?"SYNCING...":"ONLINE"}</span>
            </div>
            <button onClick={fetchData} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,fontSize:9,cursor:"pointer",fontFamily:"monospace",letterSpacing:1.5,boxShadow:J.cyanGlowSm}}>↻ SYNC</button>
            <button onClick={()=>setAiOpen(!aiOpen)} style={{padding:"6px 18px",background:aiOpen?J.cyan+"18":"transparent",border:`1px solid ${J.cyan}`,borderRadius:2,color:J.cyan,fontSize:10,cursor:"pointer",fontFamily:"monospace",letterSpacing:2,fontWeight:700,boxShadow:aiOpen?J.cyanGlow:J.cyanGlowSm,textShadow:J.cyanGlowSm}}>
              ⚡ J.A.R.V.I.S
            </button>
          </div>
        </div>
      </div>

      <div style={{padding:"18px 24px 60px",position:"relative",zIndex:1,animation:"fadeUp .3s ease"}}>

        {tab==="overview"&&<>
          {/* STATUS */}
          <div style={{display:"flex",gap:8,marginBottom:16,padding:"7px 14px",background:J.bg2,border:`1px solid ${J.border}`,borderRadius:2,alignItems:"center"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:J.green,boxShadow:`0 0 6px ${J.green}`,animation:"pulse 2s infinite"}}/>
            <span style={{fontFamily:"monospace",fontSize:9,color:J.muted,letterSpacing:1.5}}>
              SYSTEM: OPERATIONAL · META: CONNECTED · {campaigns.length} CAMPAIGNS · {active.length} ACTIVE · SYNCED: {lastUpdated?.toLocaleTimeString()||"—"}
            </span>
          </div>

          {/* MAIN HUD GRID */}
          <div style={{display:"grid",gridTemplateColumns:"280px 1fr 260px",gap:14,marginBottom:16}}>

            {/* LEFT — ARC REACTORS */}
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,marginBottom:14,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ SYSTEM POWER</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <ArcReactor value={active.length} max={Math.max(campaigns.length,1)} label="ACTIVE" color={J.green} size={88}/>
                <ArcReactor value={totalClicks} max={Math.max(totalClicks*1.2,1)} label="CLICKS" color={J.cyan} size={88}/>
                <ArcReactor value={parseFloat(avgCTR)} max={5} label="CTR %" color={parseFloat(avgCTR)>=1?J.green:J.orange} size={88}/>
                <ArcReactor value={parseInt(avgCPC)} max={100} label="CPC ₹" color={J.yellow} size={88}/>
              </div>
            </JCard>

            {/* CENTER */}
            <JCard style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center",gap:14}} glow>
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{position:"absolute",width:180,height:180,border:`1px solid ${J.cyan}11`,borderRadius:"50%",animation:"rotate 25s linear infinite"}}/>
                <div style={{position:"absolute",width:150,height:150,border:`1px dashed ${J.cyan}18`,borderRadius:"50%",animation:"rotate 18s linear infinite reverse"}}/>
                <div style={{position:"absolute",width:120,height:120,border:`1px solid ${J.cyan}22`,borderRadius:"50%"}}/>
                <RepriseLogo size={90}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,width:"100%"}}>
                {[[fmt(totalSpend),"30D SPEND",J.cyan],[fmt(totalBudget),"DAILY BUDGET",J.orange],[fmtN(totalImpressions),"IMPRESSIONS",J.muted]].map(([v,l,c])=>(
                  <div key={l} style={{textAlign:"center",padding:"8px 6px",background:c+"0A",border:`1px solid ${c}22`,borderRadius:2}}>
                    <div style={{fontSize:16,fontWeight:900,color:c,fontFamily:"'Orbitron',monospace",textShadow:`0 0 10px ${c}66`,letterSpacing:-0.5}}>{v}</div>
                    <div style={{fontSize:7,color:J.muted,letterSpacing:1.5,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </JCard>

            {/* RIGHT — INTEL */}
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

          {/* CHARTS ROW */}
          <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14}}>
            <JCard style={{padding:18}} glow>
              <div style={{fontSize:9,color:J.cyan,letterSpacing:2,marginBottom:14,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ SPEND TRAJECTORY — 14 CYCLES</div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={trendData}>
                  <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={J.cyan} stopOpacity={.25}/><stop offset="95%" stopColor={J.cyan} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={J.grid}/>
                  <XAxis dataKey="day" tick={{fontSize:7,fill:J.muted,fontFamily:"monospace"}}/>
                  <YAxis tick={{fontSize:7,fill:J.muted,fontFamily:"monospace"}}/>
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
                  <div style={{height:2,background:J.border,borderRadius:1,overflow:"hidden"}}>
                    <div style={{width:`${totalSpend>0?(parseFloat(c.spend||0)/totalSpend)*100:0}%`,height:"100%",background:J.cyan,boxShadow:J.cyanGlowSm}}/>
                  </div>
                </div>
              ))}
            </JCard>
          </div>
        </>}

        {tab==="campaigns"&&(
          <JCard style={{overflow:"hidden"}} glow>
            <div style={{padding:"12px 18px",borderBottom:`1px solid ${J.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:10,color:J.cyan,letterSpacing:2,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ CAMPAIGN REGISTRY — {campaigns.length} ENTRIES · {active.length} ACTIVE</div>
              <div style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>LIVE · META ADS MANAGER</div>
            </div>
            {loading&&<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",letterSpacing:2,fontSize:11}}>LOADING CAMPAIGN DATA...</div>}
            {!loading&&campaigns.length>0&&(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${J.border}`,background:J.cyan+"04"}}>
                      {["CAMPAIGN","STATUS","OBJECTIVE","DAILY BUDGET","ACTION"].map(h=>(
                        <th key={h} style={{padding:"9px 14px",fontSize:7,color:J.muted,textAlign:h==="CAMPAIGN"?"left":"center",fontFamily:"monospace",letterSpacing:2}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c,i)=>(
                      <tr key={i} className="trow" style={{borderBottom:`1px solid ${J.border}`,transition:"background .15s"}}>
                        <td style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:J.text,fontFamily:"monospace",maxWidth:320,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</td>
                        <td style={{padding:"10px 14px",textAlign:"center"}}>
                          <span style={{padding:"2px 8px",borderRadius:2,fontSize:8,fontWeight:700,fontFamily:"monospace",letterSpacing:1.5,background:c.status==="ACTIVE"?J.green+"18":J.muted+"18",color:c.status==="ACTIVE"?J.green:J.muted,border:`1px solid ${c.status==="ACTIVE"?J.green+"44":J.muted+"33"}`,boxShadow:c.status==="ACTIVE"?`0 0 6px ${J.green}44`:""}}>{c.status}</span>
                        </td>
                        <td style={{padding:"10px 14px",textAlign:"center",fontSize:9,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>{c.objective?.replace("OUTCOME_","")||"—"}</td>
                        <td style={{padding:"10px 14px",textAlign:"center",fontSize:12,fontWeight:700,color:J.cyan,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>{c.daily_budget?fmt(parseFloat(c.daily_budget)/100):"—"}</td>
                        <td style={{padding:"10px 14px",textAlign:"center"}}>
                          <button onClick={()=>setAiOpen(true)} style={{padding:"3px 10px",background:J.cyan+"0A",border:`1px solid ${J.borderBright}`,borderRadius:2,color:J.cyan,fontSize:8,cursor:"pointer",fontFamily:"monospace",letterSpacing:1.5,boxShadow:J.cyanGlowSm}}>ANALYSE</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </JCard>
        )}

        {tab==="insights"&&(
          <JCard style={{overflow:"hidden"}} glow>
            <div style={{padding:"12px 18px",borderBottom:`1px solid ${J.border}`}}>
              <div style={{fontSize:10,color:J.cyan,letterSpacing:2,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>◈ PERFORMANCE INTELLIGENCE — LAST 30 DAYS · {insights.length} TARGETS</div>
            </div>
            {insights.length===0&&<div style={{padding:40,textAlign:"center",color:J.muted,fontFamily:"monospace",fontSize:11}}>NO INTELLIGENCE DATA AVAILABLE</div>}
            {insights.length>0&&(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:J.cyan+"04",borderBottom:`1px solid ${J.border}`}}>
                      {["CAMPAIGN","SPEND","IMPRESSIONS","CLICKS","CTR","CPC","CPM","FREQ"].map(h=>(
                        <th key={h} style={{padding:"9px 14px",fontSize:7,color:J.muted,textAlign:h==="CAMPAIGN"?"left":"center",fontFamily:"monospace",letterSpacing:2}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insights.map((c,i)=>{
                      const ctr=parseFloat(c.ctr||0);const cpc=parseFloat(c.cpc||0);const freq=parseFloat(c.frequency||0);
                      return(
                        <tr key={i} className="trow" style={{borderBottom:`1px solid ${J.border}`,transition:"background .15s"}}>
                          <td style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:J.text,fontFamily:"monospace",maxWidth:260,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.campaign_name}</td>
                          <td style={{padding:"10px 14px",textAlign:"center",fontSize:12,fontWeight:700,color:J.cyan,fontFamily:"monospace",textShadow:J.cyanGlowSm}}>{fmt(parseFloat(c.spend||0))}</td>
                          <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,color:J.muted,fontFamily:"monospace"}}>{fmtN(parseInt(c.impressions||0))}</td>
                          <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,color:J.muted,fontFamily:"monospace"}}>{fmtN(parseInt(c.clicks||0))}</td>
                          <td style={{padding:"10px 14px",textAlign:"center"}}>
                            <span style={{padding:"2px 7px",borderRadius:2,fontSize:9,fontWeight:700,fontFamily:"monospace",background:ctr>=1?J.green+"18":J.red+"18",color:ctr>=1?J.green:J.red,border:`1px solid ${ctr>=1?J.green+"44":J.red+"44"}`}}>{ctr.toFixed(2)}%</span>
                          </td>
                          <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,fontWeight:700,color:cpc<=20?J.green:cpc<=50?J.yellow:J.red,fontFamily:"monospace"}}>₹{cpc.toFixed(0)}</td>
                          <td style={{padding:"10px 14px",textAlign:"center",fontSize:10,color:J.muted,fontFamily:"monospace"}}>₹{parseFloat(c.cpm||0).toFixed(0)}</td>
                          <td style={{padding:"10px 14px",textAlign:"center"}}>
                            <span style={{padding:"2px 7px",borderRadius:2,fontSize:9,fontWeight:700,fontFamily:"monospace",background:freq>4?J.red+"18":freq>2?J.yellow+"18":J.green+"18",color:freq>4?J.red:freq>2?J.yellow:J.green}}>{freq.toFixed(1)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </JCard>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div style={{position:"fixed",bottom:0,left:0,right:aiOpen?370:0,background:J.bg+"F0",borderTop:`1px solid ${J.border}`,padding:"5px 24px",display:"flex",alignItems:"center",gap:14,zIndex:40,backdropFilter:"blur(10px)",transition:"right .3s"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${J.cyan}44,transparent)`}}/>
        <div style={{width:5,height:5,borderRadius:"50%",background:J.green,boxShadow:`0 0 6px ${J.green}`,animation:"pulse 2s infinite"}}/>
        <span style={{fontSize:8,color:J.green,fontFamily:"monospace",letterSpacing:2}}>LIVE META DATA</span>
        <span style={{fontSize:8,color:J.border}}>·</span>
        <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>{campaigns.length} CAMPAIGNS</span>
        <span style={{fontSize:8,color:J.border}}>·</span>
        <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>{insights.length} WITH INTEL</span>
        <span style={{fontSize:8,color:J.border}}>·</span>
        <span style={{fontSize:8,color:J.muted,fontFamily:"monospace",letterSpacing:1}}>REPRISE ADS COMMAND v2.0</span>
        <span style={{marginLeft:"auto",fontSize:8,color:J.cyan,fontFamily:"monospace",letterSpacing:1.5,cursor:"pointer",textShadow:J.cyanGlowSm}} onClick={fetchData}>↻ SYNC SYSTEMS</span>
      </div>

      {aiOpen&&<AIPanel onClose={()=>setAiOpen(false)} campaigns={campaigns} insights={insights}/>}
    </div>
  );
}
