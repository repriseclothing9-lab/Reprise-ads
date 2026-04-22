import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const API_URL = "https://reprise-ads.onrender.com";

const C = {
  bg:"#F6F8FF", white:"#FFFFFF", border:"#E3E8F5", text:"#0D1226", muted:"#8A96B8", soft:"#F0F3FF",
  blue:"#4E7EF7", pink:"#F7A8C4", yellow:"#FBCF34", green:"#3EC97A", black:"#0D1226", red:"#FF6B8A",
  blueL:"#EEF3FF", pinkL:"#FFF0F6", yellowL:"#FFFBEA", greenL:"#EDFBF3", redL:"#FFF0F4",
};

const SYSTEM_PROMPT = `You are Reprise's elite paid growth head — an AI performance marketing operator for an Indian D2C clothing brand. Think like a founder, CFO, CMO, and media buyer combined. You have full visibility of live campaign data. Always respond: 🔍 Diagnosis → ❓ Why → ⚡ Action Now → 🧪 Test Next → 📊 Watch → 💰 Budget Call. Sharp, decisive, no fluff. Brand: Reprise — men's/women's clothing, India, fit, fabric, value, manufacturing credibility.`;

const fmt = n=>n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${n}`;
const fmtB = n=>n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${Math.round(n||0)}`;
const rc = r=>r>=3.5?C.green:r>=2.5?"#E6A817":C.red;
const rbg= r=>r>=3.5?C.greenL:r>=2.5?C.yellowL:C.redL;
const cc = c=>c<=500?C.green:c<=700?"#E6A817":C.red;
const cbg= c=>c<=500?C.greenL:c<=700?C.yellowL:C.redL;
const ac = t=>t==="critical"?C.red:t==="warning"?"#E6A817":C.blue;
const abg= t=>t==="critical"?C.redL:t==="warning"?C.yellowL:C.blueL;
const sc2= s=>s==="healthy"?C.green:s==="warning"?"#E6A817":C.red;
const sbg= s=>s==="healthy"?C.greenL:s==="warning"?C.yellowL:C.redL;
const pc = p=>({meta:C.blue,google:C.green,snapchat:"#E6A817",tiktok:C.black}[p]||C.blue);

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
    <div style={{width:`${Math.min(val,100)}%`,height:"100%",background:color,borderRadius:3}}/>
  </div>
);

function AIPanel({onClose,campaigns,insights}){
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Growth Head online. I now have your real Meta campaign data loaded.\n\n⚡ Ask me anything about your campaigns, spend, ROAS, or what to do next."}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"})},[msgs,loading]);
  const QUICK=["What's my best campaign?","Which campaigns should I pause?","Where am I wasting budget?","How to improve ROAS?"];
  const send=async(text)=>{
    const campSummary=campaigns.slice(0,5).map(c=>`${c.name}: ${c.status}, budget ₹${Math.round((c.daily_budget||0)/100)}/day`).join(" | ");
    const ctx=`\n\nLIVE META DATA: ${campaigns.length} campaigns loaded. Top campaigns: ${campSummary}. User asks: ${text}`;
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
            <div style={{fontSize:10,color:C.muted}}>{campaigns.length} real campaigns loaded</div>
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
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&input.trim()&&!loading&&send(input.trim())} placeholder="Ask about your real campaigns..." style={{flex:1,background:"none",border:"none",color:C.text,fontSize:13,outline:"none"}}/>
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
  const [aiOpen,setAiOpen]=useState(false);
  const [campaigns,setCampaigns]=useState([]);
  const [insights,setInsights]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [lastUpdated,setLastUpdated]=useState(null);

  const fetchData=async()=>{
    setLoading(true);
    try{
      const [campRes,insRes]=await Promise.all([
        fetch(`${API_URL}/api/campaigns`),
        fetch(`${API_URL}/api/insights`)
      ]);
      const campData=await campRes.json();
      const insData=await insRes.json();
      if(campData.data) setCampaigns(campData.data);
      if(insData.data) setInsights(insData.data);
      setLastUpdated(new Date());
      setError(null);
    }catch(e){
      setError("Could not connect to backend. Showing cached data.");
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    fetchData();
    const interval=setInterval(fetchData,300000);
    return()=>clearInterval(interval);
  },[]);

  const activeCampaigns=campaigns.filter(c=>c.status==="ACTIVE");
  const pausedCampaigns=campaigns.filter(c=>c.status==="PAUSED");
  const totalBudget=campaigns.reduce((a,c)=>a+(parseFloat(c.daily_budget||0)/100),0);
  const totalSpend=insights.reduce((a,i)=>a+parseFloat(i.spend||0),0);
  const totalImpressions=insights.reduce((a,i)=>a+parseInt(i.impressions||0),0);
  const totalClicks=insights.reduce((a,i)=>a+parseInt(i.clicks||0),0);
  const avgCTR=totalImpressions>0?((totalClicks/totalImpressions)*100).toFixed(2):0;
  const avgCPC=totalClicks>0?(totalSpend/totalClicks).toFixed(0):0;
  const avgCPM=totalImpressions>0?((totalSpend/totalImpressions)*1000).toFixed(0):0;

  const TABS=[{id:"overview",label:"Overview"},{id:"campaigns",label:`Campaigns (${campaigns.length})`},{id:"insights",label:"Insights"}];

  return(
    <div style={{fontFamily:"'Nunito','Segoe UI',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,paddingRight:aiOpen?340:0,transition:"padding-right .3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes blink{0%,100%{opacity:.25}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .trow:hover{background:${C.soft}!important}
        .pcard:hover{box-shadow:0 8px 30px rgba(78,126,247,.12)!important;transform:translateY(-2px)}
      `}</style>

      {/* NAV */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 10px rgba(13,18,38,.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:22}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${C.blue},${C.pink})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:C.white}}>R</div>
            <div>
              <div style={{fontWeight:900,fontSize:15,color:C.text}}>Reprise</div>
              <div style={{fontSize:9,color:C.muted,fontWeight:600}}>ADS PLATFORM · LIVE META DATA</div>
            </div>
          </div>
          <div style={{width:1,height:28,background:C.border}}/>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?800:500,color:tab===t.id?C.blue:C.muted,padding:"4px 2px",borderBottom:tab===t.id?`2.5px solid ${C.blue}`:"2.5px solid transparent",transition:"all .2s",fontFamily:"inherit"}}>{t.label}</button>)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {loading&&<div style={{width:16,height:16,border:`2px solid ${C.blue}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
          {!loading&&lastUpdated&&<div style={{fontSize:10,color:C.muted}}>Updated {lastUpdated.toLocaleTimeString()}</div>}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:C.greenL,borderRadius:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/>
            <span style={{fontSize:11,color:C.green,fontWeight:800}}>Live</span>
          </div>
          <button onClick={fetchData} style={{padding:"6px 12px",background:C.soft,border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:11,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>↻ Refresh</button>
          <button onClick={()=>setAiOpen(!aiOpen)} style={{padding:"8px 18px",background:aiOpen?C.blue:C.blueL,border:`1.5px solid ${C.blue}44`,borderRadius:10,color:aiOpen?C.white:C.blue,fontSize:12,cursor:"pointer",fontWeight:800,fontFamily:"inherit",transition:"all .2s"}}>⚡ AI Growth Head</button>
        </div>
      </div>

      {error&&<div style={{background:C.yellowL,borderBottom:`1px solid ${C.yellow}44`,padding:"10px 24px",fontSize:12,color:"#8A6A00"}}>{error}</div>}

      <div style={{padding:"22px 24px 70px",animation:"fadeUp .3s ease"}}>

        {/* OVERVIEW */}
        {tab==="overview"&&<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
            <KPI label="Total Campaigns" value={campaigns.length} sub={`${activeCampaigns.length} active`} trend="up" color={C.blue} bg={C.blueL}/>
            <KPI label="Active" value={activeCampaigns.length} sub={`${pausedCampaigns.length} paused`} trend="up" color={C.green} bg={C.greenL}/>
            <KPI label="Daily Budget" value={fmtB(totalBudget)} sub="across all campaigns" trend="stable" color={C.pink} bg={C.pinkL}/>
            <KPI label="Total Spend" value={fmtB(totalSpend)} sub="last 30 days" trend="up" color="#E6A817" bg={C.yellowL}/>
            <KPI label="Avg CTR" value={`${avgCTR}%`} sub="last 30 days" trend={parseFloat(avgCTR)>=1?"up":"down"} color={parseFloat(avgCTR)>=1?C.green:C.red} bg={parseFloat(avgCTR)>=1?C.greenL:C.redL}/>
            <KPI label="Avg CPC" value={`₹${avgCPC}`} sub="last 30 days" trend="stable" color={C.blue} bg={C.blueL}/>
          </div>

          {/* Summary Cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            <Card style={{borderTop:`3px solid ${C.green}`}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:12,textTransform:"uppercase"}}>Active Campaigns</div>
              {activeCampaigns.slice(0,4).map((c,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
                  <span style={{fontSize:12,color:C.text,fontWeight:600,flex:1,marginRight:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</span>
                  <Tag color={C.green} bg={C.greenL}>ACTIVE</Tag>
                </div>
              ))}
              {activeCampaigns.length>4&&<div style={{fontSize:11,color:C.muted,marginTop:8}}>+{activeCampaigns.length-4} more</div>}
            </Card>
            <Card style={{borderTop:`3px solid ${C.blue}`}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:12,textTransform:"uppercase"}}>Spend by Campaign (30D)</div>
              {insights.slice(0,4).map((c,i)=>(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:C.text,fontWeight:600,flex:1,marginRight:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.campaign_name}</span>
                    <span style={{fontSize:11,fontWeight:700,color:C.blue}}>{fmtB(parseFloat(c.spend||0))}</span>
                  </div>
                  <Bar2 val={totalSpend>0?(parseFloat(c.spend||0)/totalSpend)*100:0} color={C.blue}/>
                </div>
              ))}
            </Card>
            <Card style={{borderTop:`3px solid ${C.pink}`}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:12,textTransform:"uppercase"}}>Performance (30D)</div>
              {[["Total Spend",fmtB(totalSpend),C.blue],["Total Impressions",totalImpressions.toLocaleString(),C.muted],["Total Clicks",totalClicks.toLocaleString(),C.green],["Avg CTR",`${avgCTR}%`,parseFloat(avgCTR)>=1?C.green:C.red],["Avg CPC",`₹${avgCPC}`,C.blue],["Avg CPM",`₹${avgCPM}`,C.muted]].map(([l,v,col])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:11,color:C.muted}}>{l}</span>
                  <span style={{fontSize:12,fontWeight:700,color:col}}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        </>}

        {/* CAMPAIGNS */}
        {tab==="campaigns"&&(
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:800,color:C.text}}>All Campaigns <span style={{color:C.muted,fontWeight:500}}>({campaigns.length} total · {activeCampaigns.length} active)</span></div>
              <div style={{fontSize:11,color:C.muted}}>Live from Meta Ads</div>
            </div>
            {loading&&<div style={{padding:40,textAlign:"center",color:C.muted}}>Loading your campaigns...</div>}
            {!loading&&campaigns.length===0&&<div style={{padding:40,textAlign:"center",color:C.muted}}>No campaigns found. Check your Meta API connection.</div>}
            {!loading&&campaigns.length>0&&(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:C.soft}}>
                      {["Campaign Name","Status","Objective","Daily Budget","Action"].map(h=>(
                        <th key={h} style={{padding:"10px 14px",fontSize:9,color:C.muted,textAlign:h==="Campaign Name"?"left":"center",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c,i)=>(
                      <tr key={i} className="trow" style={{borderBottom:`1px solid ${C.border}`,transition:"background .15s"}}>
                        <td style={{padding:"12px 14px",fontSize:12,fontWeight:700,color:C.text,maxWidth:300,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</td>
                        <td style={{padding:"12px 14px",textAlign:"center"}}>
                          <Tag color={c.status==="ACTIVE"?C.green:C.muted} bg={c.status==="ACTIVE"?C.greenL:C.soft}>{c.status}</Tag>
                        </td>
                        <td style={{padding:"12px 14px",textAlign:"center",fontSize:11,color:C.muted}}>{c.objective?.replace("OUTCOME_","")}</td>
                        <td style={{padding:"12px 14px",textAlign:"center",fontSize:12,fontWeight:700,color:C.text}}>{c.daily_budget?fmtB(parseFloat(c.daily_budget)/100):"—"}</td>
                        <td style={{padding:"12px 14px",textAlign:"center"}}>
                          <button onClick={()=>setAiOpen(true)} style={{padding:"5px 12px",background:C.blueL,border:`1px solid ${C.blue}33`,borderRadius:8,color:C.blue,fontSize:11,cursor:"pointer",fontWeight:800}}>AI Analyse</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* INSIGHTS */}
        {tab==="insights"&&(
          <div>
            {loading&&<div style={{padding:40,textAlign:"center",color:C.muted,background:C.white,borderRadius:14,border:`1px solid ${C.border}`}}>Loading insights data...</div>}
            {!loading&&insights.length===0&&<div style={{padding:40,textAlign:"center",color:C.muted,background:C.white,borderRadius:14,border:`1px solid ${C.border}`}}>No insights data. Data may take 24h to appear for new campaigns.</div>}
            {!loading&&insights.length>0&&(
              <Card style={{padding:0,overflow:"hidden"}}>
                <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontSize:13,fontWeight:800,color:C.text}}>Campaign Performance — Last 30 Days</div>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:C.soft}}>
                        {["Campaign","Spend","Impressions","Clicks","CTR","CPC","CPM","Frequency"].map(h=>(
                          <th key={h} style={{padding:"10px 14px",fontSize:9,color:C.muted,textAlign:h==="Campaign"?"left":"center",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {insights.map((c,i)=>{
                        const ctr=parseFloat(c.ctr||0);
                        const cpc=parseFloat(c.cpc||0);
                        const cpm=parseFloat(c.cpm||0);
                        const freq=parseFloat(c.frequency||0);
                        return(
                          <tr key={i} className="trow" style={{borderBottom:`1px solid ${C.border}`,transition:"background .15s"}}>
                            <td style={{padding:"12px 14px",fontSize:12,fontWeight:700,color:C.text,maxWidth:250,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.campaign_name}</td>
                            <td style={{padding:"12px 14px",textAlign:"center",fontSize:12,fontWeight:700,color:C.blue}}>{fmtB(parseFloat(c.spend||0))}</td>
                            <td style={{padding:"12px 14px",textAlign:"center",fontSize:11,color:C.muted}}>{parseInt(c.impressions||0).toLocaleString()}</td>
                            <td style={{padding:"12px 14px",textAlign:"center",fontSize:11,color:C.muted}}>{parseInt(c.clicks||0).toLocaleString()}</td>
                            <td style={{padding:"12px 14px",textAlign:"center"}}>
                              <span style={{padding:"3px 8px",borderRadius:6,background:ctr>=1?C.greenL:C.redL,color:ctr>=1?C.green:C.red,fontSize:11,fontWeight:700}}>{ctr.toFixed(2)}%</span>
                            </td>
                            <td style={{padding:"12px 14px",textAlign:"center",fontSize:11,fontWeight:600,color:cpc<=20?C.green:cpc<=40?"#E6A817":C.red}}>₹{cpc.toFixed(0)}</td>
                            <td style={{padding:"12px 14px",textAlign:"center",fontSize:11,color:C.muted}}>₹{cpm.toFixed(0)}</td>
                            <td style={{padding:"12px 14px",textAlign:"center"}}>
                              <span style={{padding:"3px 8px",borderRadius:6,background:freq>4?C.redL:freq>2?C.yellowL:C.greenL,color:freq>4?C.red:freq>2?"#E6A817":C.green,fontSize:11,fontWeight:700}}>{freq.toFixed(1)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 20px",fontSize:11,color:C.muted,display:"flex",alignItems:"center",gap:10,zIndex:40,boxShadow:"0 4px 20px rgba(13,18,38,.08)",whiteSpace:"nowrap"}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/>
        <span style={{color:C.green,fontWeight:800}}>Live Meta Data</span>
        <span>·</span>
        <span>{campaigns.length} campaigns</span>
        <span>·</span>
        <span>{insights.length} with insights</span>
        <span>·</span>
        <span style={{color:C.blue,cursor:"pointer"}} onClick={fetchData}>↻ Refresh</span>
      </div>

      {aiOpen&&<AIPanel onClose={()=>setAiOpen(false)} campaigns={campaigns} insights={insights}/>}
    </div>
  );
}
