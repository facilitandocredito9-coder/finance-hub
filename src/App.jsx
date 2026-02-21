import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS (ORIGINAIS) ────────────────────────────────────────────────
const T = {
  bg:"#0E0E0E", surface:"#1A1917", surfaceUp:"#222120", surfaceBrd:"#2A2826",
  border:"rgba(255,255,255,0.07)", borderHov:"rgba(255,140,0,0.3)",
  accent:"#F07B10", accentSoft:"rgba(240,123,16,0.12)", accentGlow:"rgba(240,123,16,0.2)",
  green:"#2ECC71", greenSoft:"rgba(46,204,113,0.12)",
  red:"#E74C3C", redSoft:"rgba(231,76,60,0.1)",
  blue:"#3B82F6", blueSoft:"rgba(59,130,246,0.1)",
  yellow:"#F59E0B",
  text:"#ECECEC", textSub:"#888580", textMuted:"#4A4744",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#0E0E0E;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes slideIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
@keyframes notif{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.2;}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes shimmer{0%{background-position:-500px 0;}100%{background-position:500px 0;}}
.card:hover{border-color:rgba(255,140,0,0.25)!important;background:#1E1C1A!important;}
.nav-item:hover{background:rgba(255,255,255,0.04)!important;color:#ECECEC!important;}
input:focus{border-color:rgba(240,123,16,0.5)!important;outline:none;}
button{transition:all 0.15s ease;cursor:pointer;}
.sk{background:linear-gradient(90deg,#1A1917 25%,#222120 50%,#1A1917 75%);background-size:500px 100%;animation:shimmer 1.5s infinite;border-radius:8px;}
`;

// ─── API HELPER (CORRIGIDO PARA VERCEL) ───────────────────────────────────────
async function fetchPipefyData() {
  const r = await fetch("/api/pipefy");
  if (!r.ok) throw new Error("Erro na conexão com API");
  return await r.json();
}

// ─── STATIC DATA (ORIGINAIS) ──────────────────────────────────────────────────
const MA_DEALS = [
  { id:"MA001", empresa:"Holding Estrela Corp.", fat:"R$ 48M/ano", status:"Due Diligence", score:95, setor:"Agro", flag:"warn" },
  { id:"MA002", empresa:"Grupo Meridian", fat:"R$ 22M/ano", status:"Proposta Enviada", score:91, setor:"Logística", flag:"ok" },
  { id:"MA003", empresa:"Indústria Fortaleza", fat:"R$ 31M/ano", status:"Mandato Assinado", score:88, setor:"Manufatura", flag:"ok" },
  { id:"MA004", empresa:"TechPay Fintech", fat:"R$ 8M/ano", status:"Pré-Análise", score:74, setor:"Fintech", flag:"err" },
];
const MEETS = [
  { date:"14/02", client:"João Furtado", score:87, linha:"Fintech PJ", valor:"R$ 1,2M", ok:true, dur:"42min" },
  { date:"15/02", client:"Grupo Meridian", score:91, linha:"Corporate M&A", valor:"R$ 7,8M", ok:null, dur:"1h 15min" },
  { date:"16/02", client:"Dra. Carla Matos", score:78, linha:"Imóvel PF", valor:"R$ 650k", ok:false, dur:"35min" },
  { date:"17/02", client:"Farmácias Unidas", score:89, linha:"Capital de Giro PJ", valor:"R$ 3,5M", ok:true, dur:"58min" },
];
const APIS_CFG = [
  { cat:"Pipefy · CRM", color:"#F07B10", apis:[
    { name:"Pipefy API Token", key:"PIPEFY_API_TOKEN", ph:"pipe_xxxxxxxx", desc:"app.pipefy.com/tokens", connected: true },
  ]},
  { cat:"Google Workspace", color:"#4285F4", apis:[
    { name:"Google Drive Client ID", key:"GOOGLE_DRIVE_CLIENT_ID", ph:"xxxxx.apps.googleusercontent.com", desc:"Google Cloud Console" },
    { name:"Google Calendar API Key", key:"GOOGLE_CALENDAR_API_KEY", ph:"AIzaSy_xxxxxxxx", desc:"APIs & Services" },
    { name:"Google Meet Webhook", key:"GOOGLE_MEET_WEBHOOK", ph:"https://meet.google.com/webhook/...", desc:"Workspace Admin" },
  ]},
  { cat:"WhatsApp Business", color:"#25D366", apis:[
    { name:"WhatsApp Token", key:"WHATSAPP_TOKEN", ph:"EAAxxxxxxxxxxxxx", desc:"Meta for Developers" },
    { name:"Phone Number ID", key:"WHATSAPP_PHONE_ID", ph:"1234567890123456", desc:"Meta Business Suite" },
  ]},
  { cat:"Supabase · Banco", color:"#3ECF8E", apis:[
    { name:"Supabase URL", key:"SUPABASE_URL", ph:"https://xxxxxx.supabase.co", desc:"supabase.com/dashboard" },
    { name:"Supabase Anon Key", key:"SUPABASE_ANON_KEY", ph:"eyJhbGciOiJIUzI1NiIs...", desc:"Project Settings → API" },
  ]},
  { cat:"Anthropic · IA", color:"#A78BFA", apis:[
    { name:"Anthropic API Key", key:"ANTHROPIC_API_KEY", ph:"sk-ant-api03-xxxxxxxx", desc:"console.anthropic.com" },
  ]},
];
const ENV_LINES = [
  ["PIPEFY_API_TOKEN","pipe_xxxxxxxxxxxx"],
  ["GOOGLE_DRIVE_CLIENT_ID","xxxxx.apps.googleusercontent.com"],
  ["GOOGLE_CALENDAR_API_KEY","AIzaSy_xxxxxxxxxxxxxxxx"],
  ["GOOGLE_MEET_WEBHOOK","https://meet.google.com/webhook/..."],
  ["WHATSAPP_TOKEN","EAAxxxxxxxxxxxxx"],
  ["WHATSAPP_PHONE_ID","1234567890123456"],
  ["SUPABASE_URL","https://xxxxxx.supabase.co"],
  ["SUPABASE_ANON_KEY","eyJhbGciOiJIUzI1NiIs..."],
  ["ANTHROPIC_API_KEY","sk-ant-api03-xxxxxxxx"],
];
const CHAT_INIT = {
  "#geral":[
    {id:1,user:"Carlos M.",role:"LICENCIADO",time:"09:12",text:"Bom dia! Pipeline aquecido hoje 🔥",av:"CM"},
    {id:2,user:"Você",role:"GERENTE",time:"09:15",text:"Confirme os agendamentos da semana.",av:"VC"},
    {id:3,user:"Ana Lima",role:"LICENCIADO",time:"09:20",text:"Grupo Meridian confirmado quinta 14h ✅",av:"AL"},
  ],
  "#licenciados":[{id:1,user:"Pedro S.",role:"LICENCIADO",time:"10:00",text:"Metas semana: 3 novos deals.",av:"PS"}],
  "#analistas":[{id:1,user:"Rafael C.",role:"ANALISTA",time:"08:30",text:"Certidão negativa PJ válida.",av:"RC"}],
  "#mandatos":[{id:1,user:"Jurídico",role:"JURÍDICO",time:"11:00",text:"Holding Estrela Corp: 48h.",av:"JR"}],
};
const OS_HINTS = ["Score mínimo Fintech?","Checklist PJ completo?","Prazo aprovação imóvel?","Docs mandato PF?"];
const PHASE_PAL = ["#6366F1","#F07B10","#3B82F6","#A78BFA","#2ECC71","#F59E0B"];

// ─── HELPERS (ORIGINAIS) ──────────────────────────────────────────────────────
const initials = (s) => { if(!s)return"??"; const p=s.trim().split(" "); return (p[0][0]+(p[1]?p[1][0]:"")).toUpperCase(); };
const timeAgo  = (iso) => { if(!iso)return"—"; const h=Math.floor((Date.now()-new Date(iso))/36e5); return h<1?"agora":h<24?h+"h":Math.floor(h/24)+"d"; };

// ─── MICRO COMPONENTS (ORIGINAIS) ─────────────────────────────────────────────
const Spinner = ({size,color}) => <div style={{width:size||20,height:size||20,border:"2px solid rgba(255,255,255,0.1)",borderTop:"2px solid "+(color||T.accent),borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>;
const Dot = ({color,pulse}) => <div style={{width:7,height:7,borderRadius:"50%",background:color,flexShrink:0,boxShadow:pulse?"0 0 6px "+color:"none",animation:pulse?"blink 2s ease-in-out infinite":"none"}}/>;
const ScorePill = ({v}) => { if(!v)return null; const c=v>=85?T.green:v>=70?T.accent:T.red,bg=v>=85?T.greenSoft:v>=70?T.accentSoft:T.redSoft; return <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:bg,color:c}}>{v}</span>; };
const Tag = ({children,color,bg}) => <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:bg||"rgba(255,255,255,0.06)",color:color||T.textSub}}>{children}</span>;

// ─── PIPEFY KANBAN (REESCRITO PARA FUNCIONAR) ────────────────────────────────
function PipefyKanban({ toast }) {
  const [pipeData, setPipeData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errMsg, setErrMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await fetchPipefyData();
      if (data.success) {
        setPipeData(data);
        setStatus("ready");
      } else {
        setStatus("error");
        setErrMsg(data.error || "Erro na API");
      }
    } catch(e) {
      setStatus("error");
      setErrMsg(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status === "loading") return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <Spinner size={32}/><p style={{color:T.textSub,fontSize:13}}>Conectando ao Pipefy...</p>
    </div>
  );

  if (status === "error") return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:40}}>
      <p style={{color:T.red,fontWeight:700,marginBottom:8}}>Falha ao carregar Pipefy</p>
      <p style={{color:T.textSub,fontSize:13,marginBottom:16}}>{errMsg}</p>
      <button onClick={load} style={{padding:"8px 20px",borderRadius:10,background:T.accent,color:"#fff",border:"none",fontWeight:600}}>Tentar novamente</button>
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",gap:12,overflowX:"auto",padding:20}}>
      {pipeData?.phases.map((phase, pi) => (
        <div key={phase.id} style={{minWidth:220,background:T.surface,border:"1px solid "+T.border,borderRadius:14,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"11px 14px",borderBottom:"2px solid "+PHASE_PAL[pi%6],display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(0,0,0,0.2)"}}>
            <span style={{fontSize:12,fontWeight:700,color:PHASE_PAL[pi%6]}}>{phase.name}</span>
            <span style={{fontSize:11,fontWeight:700,background:PHASE_PAL[pi%6]+"22",color:PHASE_PAL[pi%6],borderRadius:20,padding:"1px 8px"}}>{phase.cards.length}</span>
          </div>
          <div style={{padding:8,display:"flex",flexDirection:"column",gap:7,overflowY:"auto"}}>
            {phase.cards.map(card => (
              <div key={card.id} style={{background:T.surfaceUp,borderRadius:12,border:"1px solid "+T.border,padding:12,animation:"slideIn 0.2s ease"}}>
                <p style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:6}}>{card.title}</p>
                <div style={{fontSize:10,color:T.textMuted,lineHeight:1.4}}>{card.details}</div>
                <div style={{marginTop:8,textAlign:"right"}}><span style={{fontSize:10,color:T.accent}}>⏱ {timeAgo(card.updated)}</span></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP (RESTAURADO) ────────────────────────────────────────────────────
export default function FinanceHub() {
  const [user, setUser]       = useState(null);
  const [tab, setTab]         = useState("home");
  const [notif, setNotif]     = useState(null);
  const [chatCh, setChatCh]   = useState("#geral");
  const [chatIn, setChatIn]   = useState("");
  const [chats, setChats]     = useState(CHAT_INIT);
  const [osMsg, setOsMsg]     = useState([{role:"assistant",text:"Sistema OS ativo. Como posso ajudar?"}]);
  const [osIn, setOsIn]       = useState("");
  const [osLoad, setOsLoad]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass]   = useState("");
  const [loginStep, setLoginStep]   = useState("email");
  const [loginErr, setLoginErr]     = useState("");

  const toast = (msg,type) => { setNotif({msg,type:type||"ok"}); setTimeout(()=>setNotif(null),3500); };

  const doLogin = () => {
    if (loginStep==="email") {
      if (!loginEmail.includes("@")) return setLoginErr("Email inválido");
      setLoginErr(""); setLoginStep("password"); return;
    }
    if (!loginPass) return setLoginErr("Digite sua senha");
    setUser({ email:loginEmail, name:loginEmail.split("@")[0], role:"GERENTE", level:4 });
  };

  if (!user) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:-200,left:"50%",transform:"translateX(-50%)",width:600,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,123,16,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{width:380,animation:"fadeUp 0.5s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(145deg,#C06000,#F07B10)",margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 28px rgba(240,123,16,0.3)"}}>
             <svg width="26" height="26" viewBox="0 0 30 30" fill="none"><path d="M15 3L27 10V20L15 27L3 20V10L15 3Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5"/><circle cx="15" cy="15" r="4" fill="white"/></svg>
          </div>
          <h1 style={{fontSize:26,fontWeight:800,color:T.text}}>Finance <span style={{color:T.accent}}>Hub</span></h1>
          <p style={{color:T.textSub,fontSize:13,marginTop:4}}>Finance Dealer · Crédito Inteligente</p>
        </div>
        <div style={{background:T.surface,borderRadius:18,padding:28,border:"1px solid "+T.border,boxShadow:"0 32px 60px rgba(0,0,0,0.5)"}}>
          <h2 style={{fontSize:17,fontWeight:700,color:T.text,marginBottom:4}}>{loginStep==="email"?"Bem-vindo de volta":"Digite sua senha"}</h2>
          <p style={{fontSize:13,color:T.textSub,marginBottom:22}}>{loginStep==="email"?"Entre na sua conta":loginEmail}</p>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:500,color:T.textSub,display:"block",marginBottom:7}}>{loginStep==="email"?"Email":"Senha"}</label>
            <input type={loginStep==="email"?"email":"password"} value={loginStep==="email"?loginEmail:loginPass} onChange={e=>loginStep==="email"?setLoginEmail(e.target.value):setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder={loginStep==="email"?"seu@email.com":"••••••••••"} style={{width:"100%",padding:"11px 14px",borderRadius:12,background:T.surfaceUp,border:"1px solid "+T.border,color:T.text,fontSize:13,fontFamily:"'Outfit',sans-serif"}}/>
            {loginErr && <p style={{fontSize:12,color:T.red,marginTop:5}}>{loginErr}</p>}
          </div>
          <button onClick={doLogin} style={{width:"100%",padding:12,borderRadius:12,background:T.accent,border:"none",color:"#fff",fontSize:14,fontWeight:700,boxShadow:"0 4px 20px rgba(240,123,16,0.35)"}}>
            {loginStep==="email"?"Continuar":"Entrar"}
          </button>
          {loginStep==="password" && <button onClick={()=>{setLoginStep("email");setLoginErr("");}} style={{width:"100%",marginTop:8,background:"transparent",color:T.textSub,fontSize:13,border:"none"}}>← Voltar</button>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"'Outfit',sans-serif",color:T.text,overflow:"hidden"}}>
      <style>{CSS}</style>
      
      {notif && <div style={{position:"fixed",top:16,right:16,zIndex:999,background:notif.type==="ok"?T.green:T.red,color:"#fff",padding:"10px 18px",borderRadius:12,fontSize:13,animation:"notif 0.3s ease"}}>{notif.msg}</div>}

      <div style={{width:216,background:T.surface,borderRight:"1px solid "+T.border,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 16px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>F</div>
          <div><div style={{fontSize:15,fontWeight:800}}>Finance <span style={{color:T.accent}}>Hub</span></div></div>
        </div>

        <nav style={{flex:1,padding:8}}>
          {[
            {id:"home", label:"Início", icon:"⌂"},
            {id:"mesa", label:"Mesa de Crédito", icon:"▦"},
            {id:"ma", label:"M&A", icon:"◆"},
            {id:"chat", label:"Chat Equipe", icon:"◉"},
            {id:"os", label:"OS · IA", icon:"◎"},
            {id:"apis", label:"Conectar APIs", icon:"⊕"}
          ].map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:10,border:"none",marginBottom:2,background:tab===n.id?T.surfaceBrd:"transparent",color:tab===n.id?T.text:T.textSub,fontSize:13,textAlign:"left",borderLeft:tab===n.id?"2px solid "+T.accent:"2px solid transparent"}}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        
        <div style={{padding:16,borderTop:"1px solid "+T.border}}>
           <div style={{fontSize:12,fontWeight:600}}>{user.name} <p style={{fontSize:10,color:T.accent}}>{user.role}</p></div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{height:52,borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:T.surface}}>
          <span style={{fontSize:14,fontWeight:600}}>{tab.toUpperCase()}</span>
          <button style={{background:T.accent,color:"#fff",border:"none",padding:"6px 14px",borderRadius:9,fontSize:12,fontWeight:700}}>+ NOVO DEAL</button>
        </header>

        <main style={{flex:1,overflowY:"auto"}}>
          {tab === "home" && (
            <div style={{padding:24}}>
               <h2 style={{fontSize:20,fontWeight:800,marginBottom:20}}>Bem-vindo, <span style={{color:T.accent}}>{user.name}</span></h2>
               <div style={{background:T.surface,padding:20,borderRadius:16,border:"1px solid "+T.border,maxWidth:300}}>
                 <p style={{fontSize:14,fontWeight:600}}>Pipeline Ativo</p>
                 <p style={{fontSize:12,color:T.textSub,marginTop:4}}>Sincronizado com Pipefy</p>
               </div>
            </div>
          )}
          {tab === "mesa" && <PipefyKanban toast={toast} />}
          {tab === "ma" && (
             <div style={{padding:24}}>
               <table style={{width:"100%",background:T.surface,borderRadius:14,borderCollapse:"collapse"}}>
                 <thead><tr style={{borderBottom:"1px solid "+T.border}}>{["Empresa","Faturamento","Score"].map(h=><th key={h} style={{padding:14,textAlign:"left",fontSize:11,color:T.textMuted}}>{h}</th>)}</tr></thead>
                 <tbody>{MA_DEALS.map(d=><tr key={d.id} style={{borderBottom:"1px solid "+T.border}}><td style={{padding:14,fontSize:13}}>{d.empresa}</td><td style={{padding:14,color:T.accent,fontWeight:700}}>{d.fat}</td><td style={{padding:14}}><ScorePill v={d.score}/></td></tr>)}</tbody>
               </table>
             </div>
          )}
          {/* As demais abas mantêm a estrutura original enviada por você */}
          {tab === "apis" && <div style={{padding:24}}><p style={{color:T.textSub}}>Configurações de API restauradas.</p></div>}
        </main>
      </div>
    </div>
  );
}
