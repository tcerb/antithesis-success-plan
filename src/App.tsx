import { useState, useRef, useEffect } from "react";
// @ts-ignore
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./index.css";

// ── Theme ─────────────────────────────────────────────────────
const C = {
  headerBg:       "#5C2ECC",
  sectionBg:      "#9980FF",
  accent:         "hsla(252,100%,77%,1)",
  accentDark:     "hsla(252,65%,35%,1)",
  accentLight:    "hsla(252,100%,97%,1)",
  accentMid:      "hsla(252,70%,87%,1)",
  secondary:      "#d392db",
  secondaryLight: "#FBF0FC",
  secondaryDark:  "#7B2D82",
  tagBg:          "#F5E8F8",
  tagText:        "#7B2D82",
  rowGoal:        "hsla(252,100%,97%,1)",
  rowGoalAlt:     "hsla(252,55%,93%,1)",
  rowAlt:         "#FAFAFA",
  border:         "#E2E8F0",
  white:          "#FFFFFF",
  lightGray:      "#F8FAFC",
  textDark:       "#1E293B",
  textMid:        "#64748B",
  textLight:      "#94A3B8",
  success:        "#10B981",
  successBg:      "#ECFDF5",
  warnBg:         "#FFFBEB",
  danger:         "#EF4444",
};

const STAGE_COLORS: Record<string, string> = {
  Onboarding:   "#9980FF",
  Optimization: "#B06FE8",
  Adoption:     "#d392db",
  Expansion:    "#E891B8",
  Renewal:      "#10B981",
};

const UTIL_DATA = [
  {week:"Wk 1",  util:32, tests:1240}, {week:"Wk 2",  util:41, tests:1870}, {week:"Wk 3",  util:38, tests:1650},
  {week:"Wk 4",  util:55, tests:2300}, {week:"Wk 5",  util:61, tests:2810}, {week:"Wk 6",  util:58, tests:2540},
  {week:"Wk 7",  util:70, tests:3100}, {week:"Wk 8",  util:74, tests:3450}, {week:"Wk 9",  util:69, tests:3020},
  {week:"Wk 10", util:80, tests:3780}, {week:"Wk 11", util:84, tests:4100}, {week:"Wk 12", util:91, tests:4620},
];

const STAGES = ["Onboarding","Optimization","Adoption","Expansion","Renewal"];

const DEFAULT_STAGE_DATA: Record<string, {context:string, milestones:{text:string,checked:boolean}[]}> = {
  Onboarding:   { context:"", milestones:[
    {text:"Initial environment setup complete",     checked:false},
    {text:"First test suite running in Antithesis", checked:false},
    {text:"Engineering team onboarded to platform", checked:false},
    {text:"CI/CD pipeline integration complete",    checked:false},
    {text:"90-day kickoff review held",             checked:false},
  ]},
  Optimization: { context:"", milestones:[
    {text:"Test suite coverage > 80%",              checked:false},
    {text:"Weekly cadence of test runs established",checked:false},
    {text:"50%+ of engineering using Antithesis",   checked:false},
    {text:"Tests integrated into PR workflow",      checked:false},
    {text:"Internal champion identified",           checked:false},
    {text:"QBR completed with executive sponsor",   checked:false},
  ]},
  Adoption: { context:"", milestones:[
    {text:"Majority of test suite in Antithesis",   checked:false},
    {text:"Bugs found attributed to Antithesis",    checked:false},
    {text:"Team productivity metrics improved",     checked:false},
  ]},
  Expansion: { context:"", milestones:[
    {text:"New team or product area onboarded",     checked:false},
    {text:"Advanced feature adoption underway",     checked:false},
    {text:"Case study or reference agreement",      checked:false},
  ]},
  Renewal: { context:"", milestones:[
    {text:"Renewal discussion initiated",           checked:false},
    {text:"ROI documented and shared",             checked:false},
    {text:"Multi-year or expansion deal explored",  checked:false},
  ]},
};

const DEFAULT_GOALS = [
  { goal:"Get devs using Antithesis", workstreams:[
    {text:"Python Client Bank and Dev Tests (Bank test for V2 Java, SC/Client testing plan)", deadline:"Q2", owner:""},
    {text:"Simplified Multiverse Debugger",                                                   deadline:"Q3", owner:""},
    {text:"Antithesis SDK documentation improvements",                                        deadline:"",   owner:""},
    {text:"Pipeline to push images and launch tests",                                         deadline:"",   owner:""},
  ]},
  { goal:"Testing coverage — all QE tests running in Antithesis", workstreams:[
    {text:"Graph Layer Ring Test",                                                             deadline:"Q2", owner:""},
    {text:"Nightly scheduling of 'Bug Hunt' and QE infra tests (in progress)",                deadline:"",   owner:""},
    {text:"ASX / Antithesis integration for Rust Client SC testing",                          deadline:"H2", owner:""},
  ]},
  { goal:"Additional workload improvements", workstreams:[
    {text:"Bob Test automation",                                                               deadline:"",   owner:""},
    {text:"Linux kernel 5.14 toggle added into Test Launcher (Antithesis assisted RCA)",      deadline:"",   owner:""},
  ]},
];

const DEFAULT_MEETINGS = [
  {type:"Bi-weekly engineering sync", frequency:"Every 2 weeks", owner:"", notes:""},
  {type:"QBR with executive",         frequency:"Quarterly",     owner:"", notes:""},
];

const DEFAULT_IN_PERSON = [
  {event:"", date:"", location:"", type:"", attendees:""},
  {event:"", date:"", location:"", type:"", attendees:""},
  {event:"", date:"", location:"", type:"", attendees:""},
];

// ── Helpers ───────────────────────────────────────────────────
function computeMonthsRemaining(contractStart: string) {
  if (!contractStart) return null;
  const end = new Date(contractStart);
  end.setFullYear(end.getFullYear() + 1);
  const today = new Date();
  if (today >= end) return 0;
  let m = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth());
  if (end.getDate() < today.getDate()) m--;
  return Math.max(0, m);
}

// ── Primitive components ──────────────────────────────────────
function CardBody({ children }: { children: React.ReactNode }) {
  return <div style={{padding:"16px 18px", background:C.white}}>{children}</div>;
}

function CollapsibleCard({ title, children, accent, headerBg, defaultOpen=true }: {
  title: string; children: React.ReactNode; accent?: string; headerBg?: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{border:`1px solid ${C.border}`,borderTop:`3px solid ${accent||C.accent}`,borderRadius:8,overflow:"hidden",marginBottom:20}}>
      <div onClick={()=>setOpen(o=>!o)} style={{
        background:headerBg||C.sectionBg, color:C.white,
        padding:"10px 18px", fontSize:11, fontWeight:700,
        letterSpacing:".06em", textTransform:"uppercase",
        cursor:"pointer", userSelect:"none",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span>{title}</span>
        <span style={{fontSize:18,fontWeight:300,opacity:.75,lineHeight:1}}>{open?"−":"+"}</span>
      </div>
      {open && children}
    </div>
  );
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 18px 6px",background:C.white}}>
      <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:C.textMid,whiteSpace:"nowrap"}}>{children}</span>
      <div style={{flex:1,height:1,background:C.border}}/>
    </div>
  );
}

function AddButton({ onClick, label, color }: { onClick: ()=>void; label: string; color?: string }) {
  const col = color||C.accent;
  return (
    <button onClick={onClick} style={{marginTop:8,padding:"5px 12px",background:"transparent",border:`1.5px dashed ${col}`,borderRadius:6,color:col,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,fontFamily:"inherit"}}>
      {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: ()=>void }) {
  return (
    <button onClick={onClick} style={{border:"none",background:"none",cursor:"pointer",color:C.textLight,fontSize:16,padding:0,lineHeight:1}}>×</button>
  );
}

function EditableText({ value, onChange, placeholder, multiline, style }: {
  value: string; onChange: (v:string)=>void; placeholder?: string; multiline?: boolean; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:13,color:C.textDark,width:"100%",resize:"none",padding:0,...style};
  return multiline
    ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2} style={{...base,lineHeight:1.5}}/>
    : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base}/>;
}

function AutoTextarea({ value, onChange, placeholder }: { value: string; onChange: (v:string)=>void; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(()=>{
    if (ref.current) { ref.current.style.height="0px"; ref.current.style.height=Math.max(22,ref.current.scrollHeight)+"px"; }
  },[value]);
  return (
    <textarea ref={ref} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={1}
      style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:13,color:C.textDark,width:"100%",resize:"none",padding:0,overflow:"hidden",lineHeight:1.5,wordBreak:"break-word"}}/>
  );
}

function DeadlineBadge({ value, onChange }: { value: string; onChange: (v:string)=>void }) {
  const [ed, setEd] = useState(false);
  if (ed) return (
    <input autoFocus value={value} onChange={e=>onChange(e.target.value)}
      onBlur={()=>setEd(false)} onKeyDown={e=>e.key==="Enter"&&setEd(false)}
      placeholder="Q2, June 3…"
      style={{border:`1px solid ${C.secondary}`,borderRadius:10,padding:"2px 8px",fontSize:11,width:80,fontFamily:"inherit",outline:"none",color:C.textDark}}/>
  );
  if (value) return (
    <span onClick={()=>setEd(true)} style={{background:C.tagBg,color:C.tagText,borderRadius:10,padding:"2px 8px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>{value}</span>
  );
  return (
    <span onClick={()=>setEd(true)} style={{color:C.textLight,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>+ due date</span>
  );
}

function OwnerBadge({ value, onChange }: { value: string; onChange: (v:string)=>void }) {
  const [ed, setEd] = useState(false);
  const initials = (v: string) => v.trim().split(/\s+/).map((w:string)=>w[0]||"").join("").slice(0,2).toUpperCase();
  if (ed) return (
    <input autoFocus value={value} onChange={e=>onChange(e.target.value)}
      onBlur={()=>setEd(false)} onKeyDown={e=>e.key==="Enter"&&setEd(false)}
      placeholder="Name…"
      style={{border:`1px solid ${C.accent}`,borderRadius:10,padding:"2px 8px",fontSize:11,width:80,fontFamily:"inherit",outline:"none",color:C.textDark}}/>
  );
  if (value) return (
    <span onClick={()=>setEd(true)} title={value} style={{background:C.accent,color:C.white,borderRadius:"50%",width:24,height:24,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>{initials(value)}</span>
  );
  return (
    <span onClick={()=>setEd(true)} style={{color:C.textLight,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>+ owner</span>
  );
}

function TrendUpIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" style={{display:"block",flexShrink:0}}>
      <polyline points="1,12 5,7 9,9.5 15,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="11,2 15,2 15,6"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" style={{display:"block",flexShrink:0}}>
      <polyline points="1,2 5,7 9,4.5 15,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="11,12 15,12 15,8"     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active||!payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:12,boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
      <div style={{fontWeight:600,color:C.textDark,marginBottom:4}}>{label}</div>
      <div style={{color:C.accent,marginBottom:2}}>Utilization: <strong>{d.util}%</strong></div>
      <div style={{color:C.textMid}}>Tests run: <strong style={{color:C.textDark}}>{d.tests?.toLocaleString()}</strong></div>
    </div>
  );
}

// ── Utilization ───────────────────────────────────────────────
function UtilizationSection({ data, onChange }: { data: any; onChange: (k:string,v:string)=>void }) {
  const raw      = (data.mtdDelta||"").replace(/[^0-9.\-]/g,"");
  const deltaNum = parseFloat(raw);
  const isPos    = !isNaN(deltaNum) && deltaNum >= 0;
  const isNeg    = !isNaN(deltaNum) && deltaNum < 0;
  const deltaCol = isPos ? C.success : isNeg ? C.danger : C.textMid;

  return (
    <CollapsibleCard title="Utilization" accent={C.accent}>
      <CardBody>
        <div style={{height:200,marginBottom:16}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={UTIL_DATA} margin={{top:8,right:8,left:-12,bottom:0}}>
              <defs>
                <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.accent} stopOpacity={.18}/>
                  <stop offset="95%" stopColor={C.accent} stopOpacity={.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="week" tick={{fontSize:10,fill:C.textMid}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tickFormatter={(v:number)=>`${v}%`} tick={{fontSize:10,fill:C.textMid}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Area type="monotone" dataKey="util" stroke={C.accent} strokeWidth={2} fill="url(#ug)"
                dot={{r:3,fill:C.accent,strokeWidth:0}} activeDot={{r:5,fill:C.accentDark}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderRight:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.textMid,marginBottom:6}}>Continuous test hours</div>
            <EditableText value={data.testHours} onChange={v=>onChange("testHours",v)} placeholder="9,000" style={{fontSize:24,fontWeight:700,color:"#065F46",textAlign:"center"}}/>
            {(()=>{
              const hrs = parseFloat((data.testHours||"").replace(/,/g,""));
              const months = isNaN(hrs) ? null : Math.round(hrs / 24 / 30);
              return months !== null
                ? <div style={{fontSize:10,color:C.textLight,marginTop:3}}>equivalent to <strong style={{color:"#065F46"}}>{months}</strong> months of testing</div>
                : <div style={{fontSize:10,color:C.textLight,marginTop:3}}>enter hours to calculate</div>;
            })()}
          </div>
          <div style={{padding:"14px 16px",borderRight:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.textMid,marginBottom:6}}>Avg utilization</div>
            <EditableText value={data.overall} onChange={v=>onChange("overall",v)} placeholder="78%" style={{fontSize:24,fontWeight:700,color:C.accentDark,textAlign:"center"}}/>
            <div style={{fontSize:10,color:C.textLight,marginTop:3}}>since contract start</div>
          </div>
          <div style={{padding:"14px 16px",borderRight:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.textMid,marginBottom:6}}>Month-to-date</div>
            <EditableText value={data.mtd} onChange={v=>onChange("mtd",v)} placeholder="65%" style={{fontSize:24,fontWeight:700,color:C.secondaryDark,textAlign:"center"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:3,flexWrap:"nowrap"}}>
              {isPos && <span style={{color:deltaCol,display:"flex",alignItems:"center",flexShrink:0}}><TrendUpIcon/></span>}
              {isNeg && <span style={{color:deltaCol,display:"flex",alignItems:"center",flexShrink:0}}><TrendDownIcon/></span>}
              <input value={data.mtdDelta} onChange={e=>onChange("mtdDelta",e.target.value)} placeholder="+8"
                style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:11,fontWeight:700,color:deltaCol,width:30,padding:0,flexShrink:0}}/>
              <span style={{fontSize:10,color:C.textLight,whiteSpace:"nowrap"}}>% pts vs prev month</span>
            </div>
          </div>
          <div style={{padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.textMid,marginBottom:6}}>Total tests</div>
            <EditableText value={data.totalTests} onChange={v=>onChange("totalTests",v)} placeholder="350" style={{fontSize:24,fontWeight:700,color:"#065F46",textAlign:"center"}}/>
            <div style={{fontSize:10,color:C.textLight,marginTop:3}}>since contract start</div>
          </div>
        </div>
      </CardBody>
    </CollapsibleCard>
  );
}

// ── Bugs ──────────────────────────────────────────────────────
function BugsSection({ data, onChange }: { data: any; onChange: (k:string,v:string)=>void }) {
  return (
    <CollapsibleCard title="Bugs found / resolved" accent={C.secondary} headerBg="#B06FE8">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:`1px solid ${C.border}`}}>
        <div style={{padding:"18px 20px",background:C.warnBg,borderRight:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:"#92400E",marginBottom:8}}>Bugs found</div>
          <EditableText value={data.found} onChange={v=>onChange("found",v)} placeholder="24" style={{fontSize:32,fontWeight:700,color:"#B45309"}}/>
        </div>
        <div style={{padding:"18px 20px",background:C.successBg}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:"#166534",marginBottom:8}}>Bugs resolved</div>
          <EditableText value={data.resolved} onChange={v=>onChange("resolved",v)} placeholder="18" style={{fontSize:32,fontWeight:700,color:"#16A34A"}}/>
        </div>
      </div>
      <CardBody>
        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:C.textMid,marginBottom:6}}>Notable bugs</div>
        <EditableText value={data.notable} onChange={v=>onChange("notable",v)} placeholder="Describe any notable bugs found…" multiline/>
      </CardBody>
    </CollapsibleCard>
  );
}

// ── Stage stepper ─────────────────────────────────────────────
function StageStep({ stage, index, stageData, previousComplete, onToggle, onUpdateText, onAdd, onRemove, onContextChange, onboarding, onOnboardingChange }: any) {
  const [expanded, setExpanded] = useState(index === 0);
  const color   = STAGE_COLORS[stage];
  const data    = stageData[stage];
  const checked = data.milestones.filter((m: any)=>m.checked).length;
  const total   = data.milestones.length;
  const pct     = total ? Math.round((checked/total)*100) : 0;
  const allDone = checked === total && total > 0;

  return (
    <div style={{marginBottom:8,borderRadius:8,border:`1px solid ${expanded?color:C.border}`,overflow:"hidden"}}>
      <div onClick={()=>setExpanded((e: boolean)=>!e)} style={{
        display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
        background:expanded?`${color}15`:C.white,
        cursor:"pointer",userSelect:"none",
      }}>
        <div style={{width:28,height:28,borderRadius:"50%",background:allDone?color:`${color}22`,border:`2px solid ${color}`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {allDone
            ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,7 5.5,10.5 12,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <span style={{fontSize:10,fontWeight:700,color}}>{index+1}</span>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:expanded?color:C.textDark}}>{stage}</div>
          <div style={{fontSize:10,color:C.textMid,marginTop:1}}>{checked}/{total} milestones · {pct}%</div>
        </div>
        <div style={{width:60,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:2,transition:"width .3s"}}/>
        </div>
        <span style={{fontSize:16,color:C.textLight,fontWeight:300}}>{expanded?"−":"+"}</span>
      </div>

      {expanded && (
        <div style={{padding:"12px 14px",borderTop:`1px solid ${color}33`,background:C.white}}>
          {data.milestones.map((m: any, mi: number)=>(
            <div key={mi} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
              <input type="checkbox" checked={m.checked} onChange={()=>onToggle(stage,mi)}
                style={{marginTop:2,accentColor:"#9CA3AF",flexShrink:0,width:15,height:15,cursor:"pointer",colorScheme:"light"}}/>
              <input value={m.text} onChange={e=>onUpdateText(stage,mi,e.target.value)}
                style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:13,
                  color:m.checked?C.textLight:C.textDark,textDecoration:m.checked?"line-through":"none",
                  flex:1,padding:0}}/>
              <RemoveButton onClick={()=>onRemove(stage,mi)}/>
            </div>
          ))}
          <AddButton onClick={()=>onAdd(stage)} label="Add milestone" color={color}/>

          {stage === "Onboarding" && (
            <div style={{marginTop:14,padding:"12px 14px",background:C.accentLight,border:`1px solid ${C.accentMid}`,borderRadius:7,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:C.accentDark,marginBottom:4}}>% Complete</div>
                <div style={{fontSize:22,fontWeight:700,color}}>{pct}%</div>
              </div>
              {[["Days remaining","daysLeft","45"],["Target date","targetDate","Aug 1"],["Key milestone","milestone","First full suite"]].map(([label,key,ph])=>(
                <div key={key}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:C.accentDark,marginBottom:4}}>{label}</div>
                  <EditableText value={onboarding[key]} onChange={(v: string)=>onOnboardingChange(key,v)} placeholder={ph}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:C.accentDark,marginBottom:4}}>Link to Linear</div>
                <EditableText value={onboarding.linear||""} onChange={(v: string)=>onOnboardingChange("linear",v)} placeholder="linear.app/…"/>
              </div>
            </div>
          )}

          <div style={{marginTop:12}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:C.textMid,marginBottom:5}}>Notes</div>
            <textarea value={data.context} onChange={e=>onContextChange(stage,e.target.value)}
              placeholder={`Context or notes for ${stage}…`} rows={2}
              style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.textDark,padding:"9px 11px",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box",background:C.white,colorScheme:"light"}}/>
          </div>
        </div>
      )}
    </div>
  );
}

function EngagementSection({ stageData, onToggle, onUpdateText, onAdd, onRemove, onContextChange, onboarding, onOnboardingChange }: any) {
  return (
    <CollapsibleCard title="Engagement stage" accent={C.accent}>
      <CardBody>
        {STAGES.map((stage,i)=>(
          <StageStep key={stage} stage={stage} index={i} stageData={stageData}
            onToggle={onToggle} onUpdateText={onUpdateText} onAdd={onAdd} onRemove={onRemove}
            onContextChange={onContextChange} onboarding={onboarding} onOnboardingChange={onOnboardingChange}/>
        ))}
      </CardBody>
    </CollapsibleCard>
  );
}

// ── Goals ─────────────────────────────────────────────────────
function GoalRow({ goal, index, onGoalChange, onGoalRemove, workstreams, onWorkstreamChange, onWorkstreamAdd, onWorkstreamRemove }: any) {
  return (
    <div style={{marginBottom:16,padding:"14px 16px",background:index%2===0?C.rowGoal:C.rowGoalAlt,borderRadius:8,border:`1px solid ${C.accentMid}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0}}/>
        <input value={goal} onChange={e=>onGoalChange(e.target.value)} placeholder="Goal…"
          style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:14,fontWeight:700,color:C.textDark,flex:1}}/>
        <RemoveButton onClick={onGoalRemove}/>
      </div>
      {workstreams.map((w: any, wi: number)=>(
        <div key={wi} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6,paddingLeft:14}}>
          <div style={{width:4,height:4,borderRadius:"50%",background:C.accentMid,flexShrink:0,marginTop:8}}/>
          <div style={{flex:1,minWidth:0}}>
            <AutoTextarea value={w.text} onChange={v=>onWorkstreamChange(wi,"text",v)} placeholder="Workstream…"/>
          </div>
          <DeadlineBadge value={w.deadline} onChange={v=>onWorkstreamChange(wi,"deadline",v)}/>
          <OwnerBadge value={w.owner} onChange={v=>onWorkstreamChange(wi,"owner",v)}/>
          <RemoveButton onClick={()=>onWorkstreamRemove(wi)}/>
        </div>
      ))}
      <div style={{paddingLeft:14}}>
        <AddButton onClick={onWorkstreamAdd} label="Add workstream" color={C.accent}/>
      </div>
    </div>
  );
}

function FutureOppItem({ item, index, goals, onChange, onRemove }: any) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customTag,  setCustomTag]  = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h = (e: MouseEvent) => { if(ref.current&&!ref.current.contains(e.target as Node)) setPickerOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const goalTags = goals.map((g: any)=>g.goal).filter(Boolean);
  const toggleTag = (tag: string) => {
    const tags = item.tags||[];
    onChange("tags", tags.includes(tag) ? tags.filter((t: string)=>t!==tag) : [...tags,tag]);
  };
  const addCustom = () => {
    if (!customTag.trim()) return;
    toggleTag(customTag.trim());
    setCustomTag("");
  };

  return (
    <div style={{padding:"12px 14px",background:index%2===0?C.secondaryLight:"#FDF6FF",borderRadius:8,border:`1px solid #E8C8F0`,marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <input value={item.title} onChange={e=>onChange("title",e.target.value)} placeholder="Opportunity title…"
          style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:13,fontWeight:600,color:C.textDark,flex:1}}/>
        <RemoveButton onClick={onRemove}/>
      </div>
      <EditableText value={item.description} onChange={(v: string)=>onChange("description",v)}
        placeholder="Describe the opportunity…" multiline style={{fontSize:12,color:C.textMid}}/>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8,alignItems:"center",position:"relative"}} ref={ref}>
        {(item.tags||[]).map((t: string)=>(
          <span key={t} onClick={()=>toggleTag(t)}
            style={{background:C.tagBg,color:C.tagText,borderRadius:10,padding:"2px 8px",fontSize:11,cursor:"pointer"}}>
            {t} ×
          </span>
        ))}
        <span onClick={()=>setPickerOpen(p=>!p)}
          style={{background:"transparent",border:`1px dashed ${C.secondary}`,color:C.secondary,borderRadius:10,padding:"2px 8px",fontSize:11,cursor:"pointer"}}>
          + update with goal
        </span>
        {pickerOpen && (
          <div style={{position:"absolute",top:"100%",left:0,background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:10,boxShadow:"0 4px 16px rgba(0,0,0,.1)",zIndex:99,minWidth:180,marginTop:4}}>
            {goalTags.map((t: string)=>(
              <div key={t} onClick={()=>{toggleTag(t);setPickerOpen(false);}}
                style={{padding:"5px 8px",borderRadius:5,cursor:"pointer",fontSize:12,color:C.textDark,background:(item.tags||[]).includes(t)?C.accentLight:"transparent"}}>
                {t}
              </div>
            ))}
            <div style={{display:"flex",gap:4,marginTop:6}}>
              <input value={customTag} onChange={e=>setCustomTag(e.target.value)} placeholder="Custom tag…"
                style={{flex:1,border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 6px",fontSize:11,fontFamily:"inherit",outline:"none"}}
                onKeyDown={e=>e.key==="Enter"&&addCustom()}/>
              <button onClick={addCustom} style={{background:C.secondary,color:C.white,border:"none",borderRadius:5,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>+</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalsSection({ goals, onGoalChange, onGoalAdd, onGoalRemove, onWorkstreamChange, onWorkstreamAdd, onWorkstreamRemove, futureOpps, onFutureOppChange, onFutureOppAdd, onFutureOppRemove }: any) {
  return (
    <CollapsibleCard title="Goals + Workstreams" accent={C.accent}>
      <CardBody>
        {goals.map((g: any, gi: number)=>(
          <GoalRow key={gi} goal={g.goal} index={gi}
            onGoalChange={(v: string)=>onGoalChange(gi,v)} onGoalRemove={()=>onGoalRemove(gi)}
            workstreams={g.workstreams}
            onWorkstreamChange={(wi: number,f: string,v: string)=>onWorkstreamChange(gi,wi,f,v)}
            onWorkstreamAdd={()=>onWorkstreamAdd(gi)}
            onWorkstreamRemove={(wi: number)=>onWorkstreamRemove(gi,wi)}/>
        ))}
        <AddButton onClick={onGoalAdd} label="Add goal" color={C.accent}/>
      </CardBody>
      <SectionDivider>Future opportunities</SectionDivider>
      <CardBody>
        {futureOpps.map((item: any, i: number)=>(
          <FutureOppItem key={i} item={item} index={i} goals={goals}
            onChange={(f: string,v: any)=>onFutureOppChange(i,f,v)} onRemove={()=>onFutureOppRemove(i)}/>
        ))}
        <AddButton onClick={onFutureOppAdd} label="Add future opportunity" color={C.secondary}/>
      </CardBody>
    </CollapsibleCard>
  );
}

// ── Meetings ──────────────────────────────────────────────────
function TouchpointsSection({ meetings, onMeetingChange, onMeetingAdd, onMeetingRemove, events, onEventChange, onEventAdd, onEventRemove }: any) {
  const Th = ({children,w}: {children?: React.ReactNode; w?: string}) => (
    <th style={{padding:"8px 12px",background:C.lightGray,color:C.textMid,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",textAlign:"left",width:w,borderBottom:`1px solid ${C.border}`}}>
      {children}
    </th>
  );
  return (
    <CollapsibleCard title="Meetings" accent={C.secondary} headerBg="#B06FE8">
      <SectionDivider>Regular cadence</SectionDivider>
      <div style={{overflowX:"auto",padding:"0 18px 4px"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr><Th w="30%">Meeting type</Th><Th w="18%">Frequency</Th><Th w="18%">Owner</Th><Th w="30%">Notes</Th><Th w="32px"></Th></tr>
          </thead>
          <tbody>
            {meetings.map((m: any, i: number)=>(
              <tr key={i} style={{background:i%2===0?C.white:C.rowAlt,borderBottom:`1px solid ${C.border}`}}>
                {["type","frequency","owner","notes"].map(f=>(
                  <td key={f} style={{padding:"9px 12px"}}><EditableText value={m[f]} onChange={v=>onMeetingChange(i,f,v)} placeholder={f[0].toUpperCase()+f.slice(1)}/></td>
                ))}
                <td style={{padding:"9px 6px",textAlign:"center"}}><RemoveButton onClick={()=>onMeetingRemove(i)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:"8px 18px 4px"}}><AddButton onClick={onMeetingAdd} label="+Add" color={C.secondary}/></div>

      <SectionDivider>In-person opportunities</SectionDivider>
      <div style={{overflowX:"auto",padding:"0 18px 4px"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr><Th w="22%">Opportunity</Th><Th w="15%">Date / Timeframe</Th><Th w="18%">Location</Th><Th w="20%">Customer contact(s)</Th><Th w="20%">Antithesis contact(s)</Th><Th w="32px"></Th></tr>
          </thead>
          <tbody>
            {events.map((ev: any, i: number)=>(
              <tr key={i} style={{background:i%2===0?C.white:C.rowAlt,borderBottom:`1px solid ${C.border}`}}>
                {["event","date","location","type","attendees"].map(f=>(
                  <td key={f} style={{padding:"9px 12px"}}><EditableText value={ev[f]} onChange={v=>onEventChange(i,f,v)} placeholder={({event:"Opportunity",date:"Date",location:"Location",type:"Customer contact(s)",attendees:"Antithesis contact(s)"} as any)[f]}/></td>
                ))}
                <td style={{padding:"9px 6px",textAlign:"center"}}><RemoveButton onClick={()=>onEventRemove(i)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:"8px 18px 16px"}}><AddButton onClick={onEventAdd} label="+Add" color={C.secondary}/></div>
    </CollapsibleCard>
  );
}

// ── Notes ─────────────────────────────────────────────────────
function NotesSection({ value, onChange }: { value: string; onChange: (v:string)=>void }) {
  return (
    <CollapsibleCard title="Notes / open items" accent={C.secondary} headerBg="#B06FE8">
      <CardBody>
        <textarea value={value} onChange={e=>onChange(e.target.value)}
          placeholder="Add open items, risks, or action items here…" rows={4}
          style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,color:C.textDark,padding:"10px 12px",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",background:C.white,colorScheme:"light"}}/>
      </CardBody>
    </CollapsibleCard>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function SuccessPlan() {
  const [info,         setInfo]         = useState({customer:"",csm:"",am:"",fde:"",contractStart:"",arr:""});
  const [risks,        setRisks]        = useState([{text:"",mitigation:""}]);
  const [opps,         setOpps]         = useState([{text:""}]);
  const [custContacts, setCustContacts] = useState([
    {role:"Champion",          name:""},
    {role:"Executive Sponsor", name:""},
    {role:"Technical Lead",    name:""},
  ]);
  const [util,       setUtil]       = useState({overall:"",mtd:"",mtdDelta:"",testHours:"9000",totalTests:""});
  const [bugs,       setBugs]       = useState({found:"",resolved:"",notable:""});
  const [stageData,  setStageData]  = useState(DEFAULT_STAGE_DATA);
  const [onboarding, setOnboarding] = useState({daysLeft:"",targetDate:"",milestone:"",linear:""});
  const [goals,      setGoals]      = useState(DEFAULT_GOALS);
  const [futureOpps, setFutureOpps] = useState([{title:"",description:"",tags:[] as string[]}]);
  const [meetings,   setMeetings]   = useState(DEFAULT_MEETINGS);
  const [inPerson,   setInPerson]   = useState(DEFAULT_IN_PERSON);
  const [notes,      setNotes]      = useState("");

  const updInfo = (k: string,v: string) => setInfo(p=>({...p,[k]:v}));
  const updCustContact = (i: number,f: string,v: string) => setCustContacts(cs=>cs.map((c,j)=>j===i?{...c,[f]:v}:c));
  const addCustContact = () => setCustContacts(cs=>[...cs,{role:"",name:""}]);
  const rmCustContact  = (i: number) => setCustContacts(cs=>cs.filter((_,j)=>j!==i));
  const updUtil = (k: string,v: string) => setUtil(p=>({...p,[k]:v}));
  const updBugs = (k: string,v: string) => setBugs(p=>({...p,[k]:v}));
  const updOb   = (k: string,v: string) => setOnboarding(p=>({...p,[k]:v}));

  const toggleMilestone = (s: string,mi: number) => setStageData(d=>({...d,[s]:{...d[s],milestones:d[s].milestones.map((m,j)=>j===mi?{...m,checked:!m.checked}:m)}}));
  const updateMilestone = (s: string,mi: number,t: string) => setStageData(d=>({...d,[s]:{...d[s],milestones:d[s].milestones.map((m,j)=>j===mi?{...m,text:t}:m)}}));
  const addMilestone    = (s: string) => setStageData(d=>({...d,[s]:{...d[s],milestones:[...d[s].milestones,{text:"",checked:false}]}}));
  const removeMilestone = (s: string,mi: number) => setStageData(d=>({...d,[s]:{...d[s],milestones:d[s].milestones.filter((_,j)=>j!==mi)}}));
  const updateContext   = (s: string,v: string) => setStageData(d=>({...d,[s]:{...d[s],context:v}}));

  const updGoal = (gi: number,v: string) => setGoals(gs=>gs.map((g,i)=>i===gi?{...g,goal:v}:g));
  const addGoal = () => setGoals(gs=>[...gs,{goal:"",workstreams:[{text:"",deadline:"",owner:""}]}]);
  const rmGoal  = (gi: number) => setGoals(gs=>gs.filter((_,i)=>i!==gi));
  const updWs   = (gi: number,wi: number,f: string,v: string) => setGoals(gs=>gs.map((g,i)=>i!==gi?g:{...g,workstreams:g.workstreams.map((w,j)=>j!==wi?w:{...w,[f]:v})}));
  const addWs   = (gi: number) => setGoals(gs=>gs.map((g,i)=>i!==gi?g:{...g,workstreams:[...g.workstreams,{text:"",deadline:"",owner:""}]}));
  const rmWs    = (gi: number,wi: number) => setGoals(gs=>gs.map((g,i)=>i!==gi?g:{...g,workstreams:g.workstreams.filter((_,j)=>j!==wi)}));

  const updFuture = (i: number,f: string,v: any) => setFutureOpps(os=>os.map((o,j)=>j===i?{...o,[f]:v}:o));
  const addFuture = () => setFutureOpps(os=>[...os,{title:"",description:"",tags:[]}]);
  const rmFuture  = (i: number) => setFutureOpps(os=>os.filter((_,j)=>j!==i));

  const updMeeting = (i: number,f: string,v: string) => setMeetings(ms=>ms.map((m,j)=>j===i?{...m,[f]:v}:m));
  const addMeeting = () => setMeetings(ms=>[...ms,{type:"",frequency:"",owner:"",notes:""}]);
  const rmMeeting  = (i: number) => setMeetings(ms=>ms.filter((_,j)=>j!==i));
  const updEvent   = (i: number,f: string,v: string) => setInPerson(es=>es.map((e,j)=>j===i?{...e,[f]:v}:e));
  const addEvent   = () => setInPerson(es=>[...es,{event:"",date:"",location:"",type:"",attendees:""}]);
  const rmEvent    = (i: number) => setInPerson(es=>es.filter((_,j)=>j!==i));

  const monthsLeft = computeMonthsRemaining(info.contractStart);

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 20px",fontFamily:"system-ui,-apple-system,sans-serif"}}>
      {/* Top bar */}
      <div style={{background:C.headerBg,color:C.white,borderRadius:"8px 8px 0 0",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:16,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Antithesis Success Plan</div>
        <div style={{fontSize:11,opacity:.5}}>Antithesis — Customer Success</div>
      </div>

      {/* Header info */}
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 8px 8px",padding:"20px 24px 16px",marginBottom:20}}>
        <input value={info.customer} onChange={e=>updInfo("customer",e.target.value)} placeholder="Customer name"
          style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:22,fontWeight:700,color:C.headerBg,width:"100%",marginBottom:14}}/>

        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:0,paddingBottom:12,borderBottom:`1px solid ${C.border}`,marginBottom:12}}>
          {/* Customer contacts */}
          <div style={{minWidth:0}}>
            <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".09em",color:C.secondary,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <span style={{whiteSpace:"nowrap"}}>{info.customer||"Customer"}</span>
              <div style={{flex:1,height:1,background:C.border}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {custContacts.map((c,i)=>(
                <div key={i} style={{display:"flex",gap:6,alignItems:"baseline",flexWrap:"wrap"}}>
                  <input value={c.role} onChange={e=>updCustContact(i,"role",e.target.value)} placeholder="Role"
                    style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.textMid,minWidth:0,flexShrink:1,flexBasis:80}}/>
                  <span style={{color:C.border,flexShrink:0}}>·</span>
                  <input value={c.name} onChange={e=>updCustContact(i,"name",e.target.value)} placeholder="Name"
                    style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:13,color:C.textDark,minWidth:0,flex:1}}/>
                  <button onClick={()=>rmCustContact(i)} style={{border:"none",background:"none",cursor:"pointer",color:C.textLight,fontSize:14,padding:0,lineHeight:1,flexShrink:0}}>×</button>
                </div>
              ))}
              <button onClick={addCustContact} style={{marginTop:2,border:"none",background:"none",cursor:"pointer",color:C.secondary,fontSize:11,padding:0,textAlign:"left",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:14,lineHeight:1}}>+</span> Add contact
              </button>
            </div>
          </div>

          <div style={{width:1,background:C.border,margin:"0 24px",alignSelf:"stretch"}}/>

          {/* Antithesis team */}
          <div style={{minWidth:0}}>
            <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".09em",color:C.accent,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <span style={{whiteSpace:"nowrap"}}>Antithesis</span>
              <div style={{flex:1,height:1,background:C.border}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[["csm","CSM"],["am","AM"],["fde","FDE"]].map(([key,label])=>(
                <div key={key} style={{display:"flex",gap:6,alignItems:"baseline",flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.textMid,width:110,flexShrink:0}}>{label}</span>
                  <span style={{color:C.border,flexShrink:0}}>·</span>
                  <input value={(info as any)[key]} onChange={e=>updInfo(key,e.target.value)} placeholder="Name"
                    style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:13,color:C.textDark,minWidth:0,flex:1}}/>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contract row */}
        <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap",padding:"10px 14px",background:C.accentLight,borderRadius:7,border:`1px solid ${C.accentMid}`}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.accentDark}}>Contract start</span>
            <input type="date" value={info.contractStart} onChange={e=>updInfo("contractStart",e.target.value)}
              style={{border:`1px solid ${C.accentMid}`,borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",outline:"none",color:C.textDark,background:C.white}}/>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.accentDark}}>Months remaining</span>
            <span style={{fontSize:16,fontWeight:700,color:monthsLeft!==null&&monthsLeft<=3?C.danger:monthsLeft!==null&&monthsLeft<=6?"#D97706":C.success}}>
              {monthsLeft !== null ? monthsLeft : "—"}
            </span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginLeft:"auto"}}>
            <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:C.accentDark}}>ARR</span>
            <input value={info.arr} onChange={e=>updInfo("arr",e.target.value)} placeholder="$250,000"
              style={{border:`1px solid ${C.accentMid}`,borderRadius:6,padding:"4px 8px",fontSize:13,fontWeight:700,fontFamily:"inherit",outline:"none",color:C.accentDark,background:C.white,width:110}}/>
          </div>
        </div>

        {/* Risks / Strategic Opportunities */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
          {/* Risks */}
          <div style={{padding:"12px 14px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:7}}>
            <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#9A3412",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <span>⚠ Risks</span>
              <div style={{flex:1,height:1,background:"#FED7AA"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {risks.map((r,i)=>(
                <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid #FED7AA"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:"#EA580C",flexShrink:0,marginTop:6}}/>
                    <input value={r.text} onChange={e=>setRisks(rs=>rs.map((x,j)=>j===i?{...x,text:e.target.value}:x))}
                      placeholder="Describe a risk…"
                      style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:12,fontWeight:600,color:"#7C2D12",flex:1,padding:0}}/>
                    <button onClick={()=>setRisks(rs=>rs.filter((_,j)=>j!==i))}
                      style={{border:"none",background:"none",cursor:"pointer",color:"#FCA572",fontSize:14,padding:0,lineHeight:1,flexShrink:0}}>×</button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4,paddingLeft:11,flexWrap:"nowrap"}}>
                    <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"#C2410C",flexShrink:0,whiteSpace:"nowrap"}}>Mitigation:</span>
                    <input value={r.mitigation} onChange={e=>setRisks(rs=>rs.map((x,j)=>j===i?{...x,mitigation:e.target.value}:x))}
                      placeholder="Enter mitigation plan…"
                      style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:12,color:"#9A3412",flex:1,minWidth:0,padding:0}}/>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>setRisks(rs=>[...rs,{text:"",mitigation:""}])}
              style={{marginTop:6,border:"none",background:"none",cursor:"pointer",color:"#EA580C",fontSize:11,padding:0,fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:14,lineHeight:1}}>+</span> Add risk
            </button>

          </div>

          {/* Strategic Opportunities */}
          <div style={{padding:"12px 14px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:7}}>
            <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#166534",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <span>✦ Strategic Opportunities</span>
              <div style={{flex:1,height:1,background:"#BBF7D0"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {opps.map((o,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:6}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:C.success,flexShrink:0,marginTop:6}}/>
                  <input value={o.text} onChange={e=>setOpps(os=>os.map((x,j)=>j===i?{text:e.target.value}:x))}
                    placeholder="Describe an opportunity…"
                    style={{border:"none",outline:"none",background:"transparent",fontFamily:"inherit",fontSize:12,color:"#14532D",flex:1,padding:0}}/>
                  <button onClick={()=>setOpps(os=>os.filter((_,j)=>j!==i))}
                    style={{border:"none",background:"none",cursor:"pointer",color:"#86EFAC",fontSize:14,padding:0,lineHeight:1,flexShrink:0}}>×</button>
                </div>
              ))}
            </div>
            <button onClick={()=>setOpps(os=>[...os,{text:""}])}
              style={{marginTop:6,border:"none",background:"none",cursor:"pointer",color:C.success,fontSize:11,padding:0,fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:14,lineHeight:1}}>+</span> Add opportunity
            </button>
          </div>
        </div>
      </div>

      <UtilizationSection data={util} onChange={updUtil}/>
      <BugsSection data={bugs} onChange={updBugs}/>
      <EngagementSection
        stageData={stageData}
        onToggle={toggleMilestone} onUpdateText={updateMilestone}
        onAdd={addMilestone} onRemove={removeMilestone}
        onContextChange={updateContext}
        onboarding={onboarding} onOnboardingChange={updOb}/>
      <GoalsSection
        goals={goals}
        onGoalChange={updGoal} onGoalAdd={addGoal} onGoalRemove={rmGoal}
        onWorkstreamChange={updWs} onWorkstreamAdd={addWs} onWorkstreamRemove={rmWs}
        futureOpps={futureOpps}
        onFutureOppChange={updFuture} onFutureOppAdd={addFuture} onFutureOppRemove={rmFuture}/>
      <TouchpointsSection
        meetings={meetings} onMeetingChange={updMeeting} onMeetingAdd={addMeeting} onMeetingRemove={rmMeeting}
        events={inPerson}   onEventChange={updEvent}     onEventAdd={addEvent}     onEventRemove={rmEvent}/>
      <NotesSection value={notes} onChange={setNotes}/>
    </div>
  );
}
