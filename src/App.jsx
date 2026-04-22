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
  {id:1, platform:"meta",     name:"TOF — Polo Collection",     status:"active",spend:42000,revenue:147000,roas:3.5,cac:480,ctr:1.8,cvr:2.4,fatigue:22},
  {id:2, platform:"meta",     name:"TOF — Casuals Prospecting", status:"active",spend:38000,revenue:99800, roas:2.6,cac:590,ctr:1.1,cvr:1.8,fatigue:61},
  {id:3, platform:"meta",     name:"BOF — Retargeting 7D",      status:"active",spend:28000,revenue:112000,roas:4.0,cac:320,ctr:2.2,cvr:4.1,fatigue:38},
  {id:4, platform:"meta",     name:"MOF — Warm Audience",       status:"paused",spend:18000,revenue:39600, roas:2.2,cac:680,ctr:0.8,cvr:1.4,fatigue:84},
  {id:5, platform:"meta",     name:"Catalog — Dynamic Retarget",status:"active",spend:16000,revenue:27200, roas:1.7,cac:820,ctr:0.9,cvr:1.2,fatigue:45},
  {id:6, platform:"google",   name:"Brand Search",              status:"active",spend:8000, revenue:56000, roas:7.0,cac:180,ctr:8.2,cvr:6.1,fatigue:5},
  {id:7, platform:"google",   name:"Non-Brand Search",          status:"active",spend:32000,revenue:108800,roas:3.4,cac:440,ctr:4.1,cvr:3.8,fatigue:12},
  {id:8, platform:"google",   name:"Performance Max",           status:"active",spend:28000,revenue:73200, roas:2.6,cac:590,ctr:2.1,cvr:2.2,fatigue:30},
  {id:9, platform:"snapchat", name:"TOF — Youth Audience",      status:"active",spend:22000,revenue:48400, roas:2.2,cac:780,ctr:0.9,cvr:1.1,fatigue:55},
  {id:10,platform:"tiktok",   name:"UGC Creative Testing",      status:"active",spend:18000,revenue:32400, roas:1.8,cac:920,ctr:0.7,cvr:0.9,fatigue:40},
];

const CREATIVES = [
  {id:1,name:"Polo Fabric Close-up",    platform:"meta",    type:"Video",   spend:18000,roas:4.2,ctr:2.8,cvr:3.1,hook:68,score:92,status:"scaling"},
  {id:2,name:"Founder Story UGC",       platform:"meta",    type:"Video",   spend:14000,roas:3.8,ctr:2.4,cvr:2.9,hook:72,score:88,status:"scaling"},
  {id:3,name:"Fit Trial Static",        platform:"meta",    type:"Image",   spend:12000,roas:3.2,ctr:1.9,cvr:2.3,hook:44,score:74,status:"active"},
  {id:4,name:"Price-Value Carousel",    platform:"meta",    type:"Carousel",spend:9000, roas:2.8,ctr:1.6,cvr:2.0,hook:38,score:65,status:"monitor"},
  {id:5,name:"Manufacture Trust Video", platform:"google",  type:"Video",   spend:11000,roas:3.6,ctr:3.2,cvr:3.4,hook:61,score:85,status:"scaling"},
  {id:6,name:"Collection Showcase",     platform:"snapchat",type:"Video",   spend:8000, roas:2.1,ctr:0.8,cvr:1.0,hook:29,score:42,status:"kill"},
];

const ALERTS = [
  {id:1,type:"critical",platform:"tiktok",   title:"TikTok ROAS below threshold",  detail:"ROAS 1.8x — below 2.0x minimum. Burning ₹18K/day.",   time:"2m ago"},
  {id:2,type:"warning", platform:"meta",     title:"Creative fatigue detected",    detail:"TOF Casuals — frequency 4.2, CTR dropped 34%.",         time:"18m ago"},
  {id:3,type:"warning", platform:"snapchat", title:"CAC above profitable range",   detail:"Snapchat CAC ₹780 — target ₹600. Scale paused.",        time:"1h ago"},
  {id:4,type:"info",    platform:"meta",     title:"TOF Polo hitting efficiency",  detail:"ROAS 3.5x with 1.8% CTR — candidate for scaling.",      time:"2h ago"},
  {id:5,type:"info",    platform:"google",   title:"Brand search ROAS exceptional",detail:"7.0x ROAS at ₹8K spend — room to push budget.",         time:"3h ago"},
];

const MER_TREND = Array.from({length:14},(_,i)=>({day:`D${i+1}`,meta:+(2.8+(Math.random()-.5)*.4).toFixed(2),google:+(3.4+(Math.random()-.5)*.3).toFixed(2),snapchat:+(2.1+(Math.random()-.5)*.3).toFixed(2),tiktok:+(1.7+(Math.random()-.5)*.3).toFixed(2)}));
const SPEND_TREND = Array.from({length:14},(_,i)=>({day:`D${i+1}`,spend:Math.round(220000+(Math.random()-.5)*40000),rev:Math.round(660000+(Math.random()-.5)*100000)}));

const fmt = n=>n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${n}`;
const rc = r=>r>=3.5?C.green:r>=2.5?"#E6A817":C.red;
const rbg= r=>r>=3.5?C.greenL:r>=2.5?C.yellowL:C.redL;
const cc = c=>c<=500?C.green:c<=700?"#E6A817":C.red;
const cbg= c=>c<=500?C.greenL:c<=700?C.yellowL:C.redL;
const ac = t=>t==="critical"?C.red:t==="warning"?"#E6A817":C.blue;
const abg= t=>t==="critical"?C.redL:t==="warning"?C.yellowL:C.blueL;
const sc2= s=>s==="healthy"?C.green:s==="warning"?"#E6A817":C.red;
const sbg= s=>s==="healthy"?C.greenL:s==="warning"?C.yellowL:C.redL;
const pc = p=>PLATFORMS[p]?.color||C.blue;

const Tag=({children,color,bg})=><span style={{padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:bg||color+"18",color,display:"inline-block"}}>{children}</span>;
const Card=({children,style={}})=><div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18,...style}}>{children}</div>;
const KPI=({label,value,sub,trend,color,bg})=>(
  <div style={{background:bg||C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",borderTop:`3px solid ${color}`}}>
    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>{label}</div>
    <div style={{fontSize:26,fontWeight:900,color:C.text,letterSpacing:-1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:trend==="up"?C.green:trend==="down"?C.red:C.muted,marginTop:4,fontWeight:600}}>{sub}</div>}
  </div>
);
const Bar2=({val,color})=>(
  <div style={{width:"100%",height:5,background:C.soft,borderRadius:3,overflow:"hidden"}}>
    <div style={{width:`${val}%`,height:"100%",background:color,borderRadius:3}}/>
  </div>
);

function AIPanel({onClose}){
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Growth Head online. Full visibility across Meta, Google, Snapchat, TikTok.\n\n⚡ **Right now:** TikTok ROAS 1.8x — below threshold. Meta Casuals fatigue 61%.\n\nAsk me anything."}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"})},[msgs,loading]);
  const QUICK=["Why is TikTok failing?","Scale Meta TOF Polo?","Fix Snapchat CAC","Reallocate budget now"];
  const send=async(text)=>{
    const ctx=`\n\nLIVE DATA: Spend ₹2.5L/day | Blended ROAS 2.97x | MER 2.9x | CAC ₹548 | Meta 3.0x ₹520 CAC | Google 3.5x ₹480 CAC | Snapchat 2.2x ₹780 CAC | TikTok 1.8x ₹920 CAC | User: ${text}`;
    const nm=[...msgs,{role:"user",content:text}];
    setMsgs(nm);setInput("");setLoading(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM_PROMPT,messages:[...nm.slice(0,-1),{role:"user",content:ctx}]})});
      const d=await r.json();
      setMsgs(p=>[...p,{role:"assistant",content:d.content?.find(b=>b.type==="text")?.text||"Error."}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"Connection error."}]);}
    finally{setLoading(false);}
  };
  const render=(text)=>text.split('\n').map((line,i)=>{
    if(/^(🔍|❓|⚡|🧪|📊|💰)/.test(line))return<div key={i} style={{color:C.blue,fontWeight:800,fontSize:13,marginTop:12,marginBottom:2}}>{line}</div>;
    if(line.includes('**')){const p=line.split(/\*\*(.*?)\*\*/g);return<div key={i} style={{marginBottom:2,fontSize:13}}>{p.map((s,j)=>j%2===1?<strong key={j} style={{color:C.text}}>{s}</strong>:<span key={j} style={{color:C.muted}}>{s}</span>)}</div>;}
    if(/^[-•]/.test(line.trim()))return<div key={i} style={{paddingLeft:12,fontSize:12,color:C.muted,marginBottom:2}}><span style={{color:C.blue}}>› </span>{line.replace(/^[-•]\s*/,"")}</div>;
    if(line.trim()==="")return<div key={i} style={{height:4}}/>;
    return<div key={i} style={{fontSize:12,color:"#4A5270",lineHeight:1.75}}>{line}</div>;
  });
  return(
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:340,background:C.white,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",zIndex:100,boxShadow:"-8px 0 32px rgba(78,126,247,0.1)"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.blueL}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:11,background:`linear-gradient(135deg,${C.blue},${C.pink})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:C.white}}>AI</div>
          <div>
            <div style={{fontWeight:800,fontSize:13,color:C.text}}>Growth Head AI</div>
            <div style={{fontSize:10,color:C.muted}}>Live data · All platforms</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,cursor:"pointer",fontSize:16,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,background:C.bg}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{marginBottom:14,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8}}>
            {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.blue},${C.pink})`,color:C.white,fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>R</div>}
            <div style={{maxWidth:"86%",padding:"11px 14px",borderRadius:m.role==="user"?"14px 4px 14px 14px":"4px 14px 14px 14px",background:m.role==="user"?`linear-gradient(135deg,${C.blue},#6B9CF8)`:C.white,border:m.role==="user"?"none":`1px solid ${C.border}`,color:m.role==="user"?C.white:C.text}}>
              {m.role==="user"?<span style={{fontSize:13,fontWeight:700}}>{m.content}</span>:render(m.content)}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:5,padding:"11px 14px",background:C.white,border:`1px solid ${C.border}`,borderRadius:"4px 14px 14px 14px",width:"fit-content"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.blue,animation:"blink 1.2s infinite",animationDelay:`${i*.2}s`}}/>)}</div>}
        <div ref={ref}/>
      </div>
      <div style={{padding:"8px 16px",display:"flex",gap:6,flexWrap:"wrap",borderTop:`1px solid ${C.border}`,background:C.white}}>
        {QUICK.map((q,i)=><button key={i} onClick={()=>send(q)} disabled={loading} style={{padding:"5px 11px",background:C.blueL,border:`1px solid ${C.blue}22`,borderRadius:16,color:C.blue,fontSize:11,cursor:"pointer",fontWeight:600}}>{q}</button>)}
      </div>
      <div style={{padding:"10px 16px 16px",background:C.white}}>
        <div style={{display:"flex",gap:8,background:C.bg,border:`1px solid ${C.border}`,borderRadius:11,padding:"9px 13px"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&input.trim()&&!loading&&send(input.trim())} placeholder="Ask about campaigns, creatives, budget..." style={{flex:1,background:"none",border:"none",color:C.text,fontSize:13,outline:"none"}}/>
          <button onClick={()=>input.trim()&&!loading&&send(input.trim())} disabled={!input.trim()||loading} style={{width:32,height:32,borderRadius:9,background:input.trim()?C.blue:C.border,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim()?C.white:C.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [tab,setTab]=useState("overview");
  const [plat,setPlat]=useState("all");
  const [aiOpen,setAiOpen]=useState(false);
  const [dismissed,setDismissed]=useState([]);
  const tSpend=Object.values(PLATFORMS).reduce((a,p)=>a+p.spend,0);
  const tRev=Object.values(PLATFORMS).reduce((a,p)=>a+p.revenue,0);
  const bROAS=(tRev/tSpend).toFixed(2);
  const bCAC=Math.round(Object.values(PLATFORMS).reduce((a,p)=>a+p.cac,0)/4);
  const alerts=ALERTS.filter(a=>!dismissed.includes(a.id));
  const crit=alerts.filter(a=>a.type==="critical").length;
  const TABS=[{id:"overview",label:"Overview"},{id:"campaigns",label:"Campaigns"},{id:"creatives",label:"Creatives"},{id:"alerts",label:`Alerts${alerts.length?` (${alerts.length})`:""}`},{id:"budget",label:"Budget"}];
  const PLATS=[{id:"all",label:"All Platforms",color:C.blue},...Object.entries(PLATFORMS).map(([k,v])=>({id:k,label:v.name,color:v.color}))];
  const camps=plat==="all"?CAMPAIGNS:CAMPAIGNS.filter(c=>c.platform===plat);
  const creas=plat==="all"?CREATIVES:CREATIVES.filter(c=>c.platform===plat);
  return(
    <div style={{fontFamily:"'Nunito','Segoe UI',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,paddingRight:aiOpen?340:0,transition:"padding-right .3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes blink{0%,100%{opacity:.25}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .trow:hover{background:${C.soft}!important}
        .pcard:hover{box-shadow:0 8px 30px rgba(78,126,247,.12)!important;transform:translateY(-2px)}
      `}</style>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 10px rgba(13,18,38,.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:22}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${C.blue},${C.pink})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:C.white}}>R</div>
            <div>
              <div style={{fontWeight:900,fontSize:15,color:C.text}}>Reprise</div>
              <div style={{fontSize:9,color:C.muted,fontWeight:600}}>ADS PLATFORM</div>
            </div>
          </div>
          <div style={{width:1,height:28,background:C.border}}/>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?800:500,color:tab===t.id?C.blue:C.muted,padding:"4px 2px",borderBottom:tab===t.id?`2.5px solid ${C.blue}`:"2.5px solid transparent",transition:"all .2s",fontFamily:"inherit"}}>{t.label}</button>)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:C.greenL,borderRadius:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/>
            <span style={{fontSize:11,color:C.green,fontWeight:800}}>Live</span>
          </div>
          {crit>0&&<div style={{padding:"6px 12px",background:C.redL,borderRadius:8,fontSize:11,color:C.red,fontWeight:800}}>🚨 {crit} Critical</div>}
          <button onClick={()=>setAiOpen(!aiOpen)} style={{padding:"8px 18px",background:aiOpen?C.blue:C.blueL,border:`1.5px solid ${C.blue}44`,borderRadius:10,color:aiOpen?C.white:C.blue,fontSize:12,cursor:"pointer",fontWeight:800,fontFamily:"inherit",transition:"all .2s"}}>⚡ AI Growth Head</button>
        </div>
      </div>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px",display:"flex",gap:2,overflowX:"auto"}}>
        {PLATS.map(p=><button key={p.id} onClick={()=>setPlat(p.id)} style={{padding:"10px 18px",background:plat===p.id?p.color+"12":"none",border:"none",borderBottom:plat===p.id?`2.5px solid ${p.color}`:"2.5px solid transparent",color:plat===p.id?p.color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:plat===p.id?800:500,whiteSpace:"nowrap",transition:"all .2s"}}>{p.label}</button>)}
      </div>
      <div style={{padding:"22px 24px 70px",animation:"fadeUp .3s ease"}}>
        {tab==="overview"&&<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
            <KPI label="Total Spend"   value={fmt(tSpend)}  sub="↑ 12% vs last week" trend="up"    color={C.blue}   bg={C.blueL}/>
            <KPI label="Revenue"       value={fmt(tRev)}    sub="↑ 8% vs last week"  trend="up"    color={C.green}  bg={C.greenL}/>
            <KPI label="Blended ROAS"  value={`${bROAS}x`}  sub="Target: 3.0x"       trend="down"  color={parseFloat(bROAS)>=3?C.green:"#E6A817"} bg={parseFloat(bROAS)>=3?C.greenL:C.yellowL}/>
            <KPI label="Blended CAC"   value={`₹${bCAC}`}   sub="Target: ₹500"       trend="up"    color={bCAC<=500?C.green:C.red} bg={bCAC<=500?C.greenL:C.redL}/>
            <KPI label="MER"           value="2.9x"          sub="Healthy range"      trend="stable" color={C.green} bg={C.greenL}/>
            <KPI label="Active Alerts" value={alerts.length} sub={`${crit} critical`} trend={crit>0?"down":"up"} color={crit>0?C.red:C.green} bg={crit>0?C.redL:C.greenL}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {Object.entries(PLATFORMS).map(([key,p])=>(
              <div key={key} className="pcard" onClick={()=>{setPlat(key);setTab("campaigns")}} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18,cursor:"pointer",transition:"all .25s",borderTop:`3px solid ${p.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:34,height:34,borderRadius:9,background:p.color+"16",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:p.color}}>{p.icon}</div>
                    <span style={{fontWeight:900,fontSize:14,color:C.text}}>{p.name}</span>
                  </div>
                  <Tag color={sc2(p.status)} bg={sbg(p.status)}>{p.status}</Tag>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["Spend",fmt(p.spend),C.text,C.soft],["Revenue",fmt(p.revenue),C.text,C.soft],["ROAS",`${p.roas}x`,rc(p.roas),rbg(p.roas)],["CAC",`₹${p.cac}`,cc(p.cac),cbg(p.cac)]].map(([l,v,tc,bg])=>(
                    <div key={l} style={{background:bg,borderRadius:9,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:C.muted,fontWeight:700}}>{l}</div>
                      <div style={{fontSize:16,fontWeight:900,color:tc}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            <Card>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:14,textTransform:"uppercase"}}>ROAS Trend — 14 Days</div>
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={MER_TREND}>
                  <defs>
                    <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={.15}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={.15}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="day" tick={{fontSize:9,fill:C.muted}}/>
                  <YAxis tick={{fontSize:9,fill:C.muted}} domain={[0,5]}/>
                  <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,fontSize:11}}/>
                  <Area type="monotone" dataKey="meta"     stroke={C.blue}  fill="url(#gm)" strokeWidth={2.5} name="Meta"/>
                  <Area type="monotone" dataKey="google"   stroke={C.green} fill="url(#gg)" strokeWidth={2.5} name="Google"/>
                  <Area type="monotone" dataKey="snapchat" stroke="#E6A817" fill="#E6A81711" strokeWidth={2}   name="Snap"/>
                  <Area type="monotone" dataKey="tiktok"   stroke={C.black} fill="#0D122611" strokeWidth={2}   name="TikTok"/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:14,textTransform:"uppercase"}}>Spend vs Revenue — 14 Days</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={SPEND_TREND} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="day" tick={{fontSize:9,fill:C.muted}}/>
                  <YAxis tick={{fontSize:9,fill:C.muted}}/>
                  <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,fontSize:11}} formatter={v=>fmt(v)}/>
                  <Bar dataKey="spend" fill={C.pink}  name="Spend"   radius={[5,5,0,0]}/>
                  <Bar dataKey="rev"   fill={C.green} name="Revenue" radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:800,color:C.text}}>Live Alerts</div>
              <button onClick={()=>setTab("alerts")} style={{background:"none",border:"none",color:C.blue,fontSize:12,cursor:"pointer",fontWeight:700}}>View all →</button>
            </div>
            {alerts.slice(0,3).map((a,i)=>(
              <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:ac(a.type),flexShrink:0}}/>
                <Tag color={pc(a.platform)} bg={pc(a.platform)+"18"}>{PLATFORMS[a.platform]?.name}</Tag>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:800,color:C.text}}>{a.title}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{a.detail}</div>
                </div>
                <div style={{fontSize:10,color:C.muted}}>{a.time}</div>
                <button onClick={()=>setAiOpen(true)} style={{padding:"5px 13px",background:abg(a.type),border:`1px solid ${ac(a.type)}44`,borderRadius:8,color:ac(a.type),fontSize:11,cursor:"pointer",fontWeight:800,whiteSpace:"nowrap"}}>AI Diagnose</button>
              </div>
            ))}
          </Card>
        </>}
        {tab==="campaigns"&&(
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:800,color:C.text}}>Campaigns <span style={{color:C.muted,fontWeight:500}}>({camps.length})</span></div>
              <div style={{fontSize:11,color:C.muted}}>Sorted by ROAS ↓</div>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:C.soft}}>
                    {["Campaign","Platform","Status","Spend","Revenue","ROAS","CAC","CTR","CVR","Fatigue","Action"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",fontSize:9,color:C.muted,textAlign:h==="Campaign"?"left":"center",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {camps.sort((a,b)=>b.roas-a.roas).map(c=>(
                    <tr key={c.id} className="trow" style={{borderBottom:`1px solid ${C.border}`,transition:"background .15s"}}>
                      <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:C.text}}>{c.name}</td>
                      <td style={{padding:"12px 14px",textAlign:"center"}}><Tag color={pc(c.platform)} bg={pc(c.platform)+"18"}>{PLATFORMS[c.platform]?.name}</Tag></td>
                      <td style={{padding:"12px 14px",textAlign:"center"}}><Tag color={c.status==="active"?C.green:C.muted} bg={c.status==="active"?C.greenL:C.soft}>{c.status}</Tag></td>
                      <td style={{padding:"12px 14px",textAlign:"center",fontSize:12,fontWeight:700}}>{fmt(c.spend)}</td>
                      <td style={{padding:"12px 14px",textAlign:"center",fontSize:12,fontWeight:700}}>{fmt(c.revenue)}</td>
                      <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{padding:"4px 10px",borderRadius:8,background:rbg(c.roas),color:rc(c.roas),fontSize:13,fontWeight:900}}>{c.roas}x</span></td>
                      <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{padding:"4px 10px",borderRadius:8,background:cbg(c.cac),color:cc(c.cac),fontSize:12,fontWeight:700}}>₹{c.cac}</span></td>
                      <td style={{padding:"12px 14px",textAlign:"center",fontSize:12,color:C.muted}}>{c.ctr}%</td>
                      <td style={{padding:"12px 14px",textAlign:"center",fontSize:12,color:C.muted}}>{c.cvr}%</td>
                      <td style={{padding:"12px 14px",textAlign:"center",width:110}}>
                        <div style={{fontSize:10,color:c.fatigue>70?C.red:c.fatigue>50?"#E6A817":C.green,marginBottom:4,fontWeight:700}}>{c.fatigue}%</div>
                        <Bar2 val={c.fatigue} color={c.fatigue>70?C.red:c.fatigue>50?"#E6A817":C.green}/>
                      </td>
                      <td style={{padding:"12px 14px",textAlign:"center"}}>
                        <button onClick={()=>setAiOpen(true)} style={{padding:"5px 12px",background:c.roas>=3.5?C.greenL:c.fatigue>70?C.pinkL:c.roas<2?C.redL:C.blueL,border:`1px solid ${c.roas>=3.5?C.green:c.fatigue>70?C.pink:c.roas<2?C.red:C.blue}44`,borderRadius:8,color:c.roas>=3.5?C.green:c.fatigue>70?C.pink:c.roas<2?C.red:C.blue,fontSize:11,cursor:"pointer",fontWeight:800}}>
                          {c.roas>=3.5?"⬆ Scale":c.fatigue>70?"⚠ Refresh":c.roas<2?"✕ Kill?":"→ AI"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {tab==="creatives"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {creas.sort((a,b)=>b.score-a.score).map(c=>{
              const s=c.status==="scaling"?C.green:c.status==="kill"?C.red:c.status==="monitor"?"#E6A817":C.blue;
              const sb=c.status==="scaling"?C.greenL:c.status==="kill"?C.redL:c.status==="monitor"?C.yellowL:C.blueL;
              return(
                <Card key={c.id} style={{borderTop:`3px solid ${s}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                    <div style={{flex:1,paddingRight:10}}>
                      <div style={{fontSize:13,fontWeight:900,color:C.text,marginBottom:6}}>{c.name}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <Tag color={pc(c.platform)} bg={pc(c.platform)+"18"}>{PLATFORMS[c.platform]?.name}</Tag>
                        <Tag color={C.muted} bg={C.soft}>{c.type}</Tag>
                        <Tag color={s} bg={sb}>{c.status}</Tag>
                      </div>
                    </div>
                    <div style={{textAlign:"center",background:c.score>=80?C.greenL:c.score>=60?C.yellowL:C.redL,borderRadius:12,padding:"8px 12px",minWidth:54}}>
                      <div style={{fontSize:24,fontWeight:900,color:c.score>=80?C.green:c.score>=60?"#E6A817":C.red,lineHeight:1}}>{c.score}</div>
                      <div style={{fontSize:8,color:C.muted,fontWeight:700}}>SCORE</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                    {[["ROAS",`${c.roas}x`,rc(c.roas),rbg(c.roas)],["CTR",`${c.ctr}%`,c.ctr>=2?C.green:C.muted,c.ctr>=2?C.greenL:C.soft],["CVR",`${c.cvr}%`,c.cvr>=2.5?C.green:C.muted,c.cvr>=2.5?C.greenL:C.soft]].map(([l,v,tc,bg])=>(
                      <div key={l} style={{background:bg,borderRadius:9,padding:"8px 10px"}}>
                        <div style={{fontSize:9,color:C.muted,fontWeight:700}}>{l}</div>
                        <div style={{fontSize:16,fontWeight:900,color:tc}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:10,color:C.muted,fontWeight:700}}>HOOK RATE</span>
                      <span style={{fontSize:10,fontWeight:800,color:c.hook>=60?C.green:c.hook>=40?"#E6A817":C.red}}>{c.hook}%</span>
                    </div>
                    <Bar2 val={c.hook} color={c.hook>=60?C.green:c.hook>=40?"#E6A817":C.red}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.muted}}>Spend: <strong style={{color:C.text}}>{fmt(c.spend)}</strong></span>
                    <button onClick={()=>setAiOpen(true)} style={{padding:"5px 12px",background:C.blueL,border:`1px solid ${C.blue}33`,borderRadius:8,color:C.blue,fontSize:11,cursor:"pointer",fontWeight:800}}>AI Analysis →</button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {tab==="alerts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {alerts.length===0&&<div style={{textAlign:"center",padding:60,color:C.green,fontSize:14,fontWeight:700,background:C.white,borderRadius:14,border:`1px solid ${C.border}`}}>✓ No active alerts</div>}
            {alerts.map(a=>(
              <div key={a.id} style={{background:C.white,border:`1px solid ${ac(a.type)}33`,borderLeft:`4px solid ${ac(a.type)}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:ac(a.type),flexShrink:0}}/>
                <Tag color={ac(a.type)} bg={abg(a.type)}>{a.type}</Tag>
                <Tag color={pc(a.platform)} bg={pc(a.platform)+"18"}>{PLATFORMS[a.platform]?.name}</Tag>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,color:C.text}}>{a.title}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>{a.detail}</div>
                </div>
                <div style={{fontSize:11,color:C.muted}}>{a.time}</div>
                <button onClick={()=>setAiOpen(true)} style={{padding:"7px 16px",background:abg(a.type),border:`1px solid ${ac(a.type)}44`,borderRadius:9,color:ac(a.type),fontSize:12,cursor:"pointer",fontWeight:800,whiteSpace:"nowrap"}}>AI Diagnose</button>
                <button onClick={()=>setDismissed(p=>[...p,a.id])} style={{background:C.soft,border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,cursor:"pointer",fontSize:14,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            ))}
          </div>
        )}
        {tab==="budget"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:18,textTransform:"uppercase"}}>Current Allocation</div>
              {Object.entries(PLATFORMS).map(([key,p])=>{
                const pct=Math.round((p.spend/tSpend)*100);
                return(
                  <div key={key} style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:800,color:C.text}}>{p.name}</span>
                      <div style={{display:"flex",gap:12,fontSize:12}}>
                        <span style={{color:C.muted}}>{fmt(p.spend)}</span>
                        <span style={{fontWeight:800,color:rc(p.roas)}}>{p.roas}x</span>
                        <span style={{color:C.muted}}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{height:9,background:C.soft,borderRadius:5,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:p.color,borderRadius:5}}/>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:18,textTransform:"uppercase"}}>AI Recommended</div>
              {[{name:"Meta",pct:58,reason:"Best ROAS + scale headroom",color:C.blue,change:"+6%",up:true},{name:"Google",pct:30,reason:"Strong branded search ROI",color:C.green,change:"+4%",up:true},{name:"Snapchat",pct:8,reason:"Hold — fix CAC first",color:"#E6A817",change:"-2%",up:false},{name:"TikTok",pct:4,reason:"Reduce — below threshold",color:C.pink,change:"-8%",up:false}].map(p=>(
                <div key={p.name} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:800,color:C.text}}>{p.name}</span>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:11,color:C.muted}}>{p.reason}</span>
                      <Tag color={p.up?C.green:C.red} bg={p.up?C.greenL:C.redL}>{p.change}</Tag>
                      <span style={{fontSize:14,fontWeight:900,color:p.color}}>{p.pct}%</span>
                    </div>
                  </div>
                  <div style={{height:9,background:C.soft,borderRadius:5,overflow:"hidden"}}>
                    <div style={{width:`${p.pct}%`,height:"100%",background:p.color,borderRadius:5}}/>
                  </div>
                </div>
              ))}
              <button onClick={()=>setAiOpen(true)} style={{width:"100%",marginTop:8,padding:"11px",background:C.blueL,border:`1.5px solid ${C.blue}33`,borderRadius:10,color:C.blue,fontSize:13,cursor:"pointer",fontWeight:800,fontFamily:"inherit"}}>Get Full Budget Breakdown →</button>
            </Card>
          </div>
        )}
      </div>
      <div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 20px",fontSize:11,color:C.muted,display:"flex",alignItems:"center",gap:10,zIndex:40,boxShadow:"0 4px 20px rgba(13,18,38,.08)",whiteSpace:"nowrap"}}>
        <span style={{color:"#E6A817",fontWeight:800}}>⚡ Demo mode</span>
        <span>Connect:</span>
        {["Meta","Google","Snapchat","TikTok"].map(p=><span key={p} style={{padding:"2px 10px",background:C.blueL,border:`1px solid ${C.blue}22`,borderRadius:6,color:C.blue,cursor:"pointer",fontWeight:700}}>{p}</span>)}
      </div>
      {aiOpen&&<AIPanel onClose={()=>setAiOpen(false)}/>}
    </div>
  );
}

