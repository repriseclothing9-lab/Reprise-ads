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

const Tag=({children,color,bg})=><span style={{padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:.4,background:bg||color+"18",color,display:"inline-block"}}>{children}</span>;
const Card=({children,style={}})=><div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18,...style}}>{children}</div>;
const KPI=({label,value,sub,trend,color,bg})=>(
  <div style={{background:bg||C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",borderTop:`3px solid ${color}`}}>
    <div style={{fontSize:10,color:C.muted,letterSpacing:.7,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>{label}</div>
    <div style={{fontSize:26,fontWeight:900,color:C.text,letterSpacing:-1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:trend==="up"?C.green:trend==="down"?C.red:C.muted,marginTop:4,fontWeight:600}}>{sub}</div>}
  </div>
);
const Bar2=({val,color})=>(
  <div style={{width:"100%",height:5,background:C.soft,borderRadius:3,overflow:"hidden"}}>
    <div style={{width:`${val}%`,height:"100%",background:color||(val>70?C.green:val>40?"#E6A817":C.red),borderRadius:3,transition:"width .5s"}}/>
  </div>
);

function AIPanel({onClose}){
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Growth Head online. Full visibility across Meta, Google, Snapchat, TikTok.\n\n⚡ **Right now:** TikTok ROAS 1.8x — below threshold. Meta Casuals fatigue 61%.\n\nAsk me anything or tap a quick action below."}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"})},[msgs,loading]);
  const QUICK=["Why is TikTok failing?","Scale Meta TOF Polo?","Fix Snapchat CAC","Reallocate budget now"];
  const send=async(text)=>{
    const ctx=`\n\nLIVE DATA: Spend ₹2.5L/day | Blended ROAS 2.97x | MER 2.9x | CAC ₹548 | Meta 3.0x ₹520 CAC | Google 3.5x ₹480 CAC | Snapchat 2.2x ₹780 CAC ⚠️ | TikTok 1.8x ₹920 CAC 🚨 | Top creative: Polo Fabric Close-up 4.2x 68% hook | User: ${text}`;
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
    if(/^(🔍|❓|⚡|🧪|📊|💰|🚨|📈)/.test(line))return<div key={i} style={{color:C.blue,fontWeight:800,fontSize:13,marginTop:12,marginBottom:2}}>{line}</div>;
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
        <button onClick={onClose} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,cursor:"pointer",fontSize:16,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,background:C.bg}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{marginBottom:14,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}}>
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
          <button onClick={()=>input.trim()&&!loading&&send(input.trim())} disabled={!​​​​​​​​​​​​​​​​
