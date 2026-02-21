import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
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
@keyframes pulse-ring{0%{transform:scale(1);opacity:0.8;}100%{transform:scale(1.9);opacity:0;}}
.card:hover{border-color:rgba(255,140,0,0.25)!important;background:#1E1C1A!important;}
.nav-item:hover{background:rgba(255,255,255,0.04)!important;color:#ECECEC!important;}
.row-h:hover{background:rgba(255,255,255,0.03)!important;}
input:focus{border-color:rgba(240,123,16,0.5)!important;outline:none;}
input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #1A1917 inset!important;-webkit-text-fill-color:#ECECEC!important;}
button{transition:all 0.15s ease;cursor:pointer;}
.sk{background:linear-gradient(90deg,#1A1917 25%,#222120 50%,#1A1917 75%);background-size:500px 100%;animation:shimmer 1.5s infinite;border-radius:8px;}
`;

// ─── PIPEFY TOKEN ─────────────────────────────────────────────────────────────
const PIPEFY_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJQaXBlZnkiLCJpYXQiOjE3NzE1NDgyODgsImp0aSI6IjcwNjk5ZDU3LTRkOGEtNDdhMC05ZDQxLWU3MGFiYTRiOTdmMSIsInN1YiI6MzA2NjI4MDk1LCJ1c2VyIjp7ImlkIjozMDY2MjgwOTUsImVtYWlsIjoiaGFtaWx0b25AZmluYW5jZWRlYWxlci5jb20uYnIifSwidXNlcl90eXBlIjoiYXV0aGVudGljYXRlZCJ9.Rc3j8NFiWmdQr6ZNaJDUd-HLR6QlXLcO2eJravTWJozYhkHxm12tInQ_hDiIK19nHsvvVzqnS1RhxLO9V98Y0g";

// Chama o nosso backend no Vercel que já processa os dados
async function pipefy() {
  const endpoint = "/api/pipefy";
  
  const r = await fetch(endpoint, {
    method: "GET", // Mudamos para GET porque o Vercel entrega o dado pronto
    headers: { "Content-Type": "application/json" },
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: "Erro na API" }));
    throw new Error(err.error || "HTTP " + r.status);
  }

  // Retorna o JSON com success, pipeName e phases
  return await r.json();
}

const Q_PIPES = `query{me{name email organization{name pipes(first:20){edges{node{id name cards_count}}}}}}`;
const Q_PIPE  = `query GetPipe($id:ID!){pipe(id:$id){id name phases{id name color cards_count cards(first:50){edges{node{id title due_date createdAt assignees{name email}labels{name color}fields{name value field{type}}}}}}}}`;
const M_MOVE  = `mutation MoveCard($cardId:ID!,$destPhaseId:ID!){moveCardToPhase(input:{card_id:$cardId,destination_phase_id:$destPhaseId}){card{id current_phase{name}}}}`;
const M_CREATE= `mutation CreateCard($pipeId:ID!,$title:String!,$phaseId:ID){createCard(input:{pipe_id:$pipeId,title:$title,phase_id:$phaseId}){card{id title current_phase{name}}}}`;

// ─── STATIC DATA (fallback + outras abas) ─────────────────────────────────────
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
  "#licenciados":[
    {id:1,user:"Pedro S.",role:"LICENCIADO",time:"10:00",text:"Metas semana: 3 novos deals. Quem lidera?",av:"PS"},
  ],
  "#analistas":[
    {id:1,user:"Rafael C.",role:"ANALISTA",time:"08:30",text:"Certidão negativa PJ: validade max 30 dias.",av:"RC"},
  ],
  "#mandatos":[
    {id:1,user:"Jurídico",role:"JURÍDICO",time:"11:00",text:"Holding Estrela Corp: est. 48h.",av:"JR"},
  ],
};
const OS_HINTS = ["Score mínimo Fintech?","Checklist PJ completo?","Prazo aprovação imóvel?","Docs mandato PF?","CDCA vs CRI?"];
const PHASE_PAL = ["#6366F1","#F07B10","#3B82F6","#A78BFA","#2ECC71","#F59E0B","#EC4899","#14B8A6"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (v) => {
  const n = parseFloat(String(v||"").replace(/[^0-9.]/g,""));
  if (!n || isNaN(n)) return null;
  return n>=1e6 ? "R$ "+(n/1e6).toFixed(1)+"M" : n>=1e3 ? "R$ "+(n/1e3).toFixed(0)+"k" : "R$ "+n;
};
const initials = (s) => { if(!s)return"??"; const p=s.trim().split(" "); return (p[0][0]+(p[1]?p[1][0]:"")).toUpperCase(); };
const timeAgo  = (iso) => { if(!iso)return"—"; const h=Math.floor((Date.now()-new Date(iso))/36e5); return h<1?"agora":h<24?h+"h":Math.floor(h/24)+"d"; };
const phaseColor = (i) => PHASE_PAL[i % PHASE_PAL.length];
const extractVal = (fields) => { if(!fields)return null; const f=fields.find(f=>/valor|value|montante|crédito|credito|amount/i.test(f.name)||f.field?.type==="currency"); return f?.value||null; };
const extractScore = (fields) => { if(!fields)return null; const f=fields.find(f=>/score|pontu/i.test(f.name)); return f?.value?parseInt(f.value):null; };

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Spinner = ({size,color}) => <div style={{width:size||20,height:size||20,border:"2px solid rgba(255,255,255,0.1)",borderTop:"2px solid "+(color||T.accent),borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>;
const Dot = ({color,pulse}) => <div style={{width:7,height:7,borderRadius:"50%",background:color,flexShrink:0,boxShadow:pulse?"0 0 6px "+color:"none",animation:pulse?"blink 2s ease-in-out infinite":"none"}}/>;
const ScorePill = ({v}) => { if(!v)return null; const c=v>=85?T.green:v>=70?T.accent:T.red,bg=v>=85?T.greenSoft:v>=70?T.accentSoft:T.redSoft; return <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:bg,color:c}}>{v}</span>; };
const Tag = ({children,color,bg}) => <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:bg||"rgba(255,255,255,0.06)",color:color||T.textSub}}>{children}</span>;

function SkCard() {
  return <div style={{background:T.surfaceUp,borderRadius:12,border:"1px solid "+T.border,padding:12,marginBottom:7}}>
    <div className="sk" style={{height:26,width:26,borderRadius:8,marginBottom:10}}/>
    <div className="sk" style={{height:11,width:"80%",marginBottom:6}}/>
    <div className="sk" style={{height:14,width:"50%",marginBottom:8}}/>
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <div className="sk" style={{height:9,width:"35%"}}/>
      <div className="sk" style={{height:9,width:"20%"}}/>
    </div>
  </div>;
}

// ─── PIPEFY KANBAN COMPONENT ─────────────────────────────────────────────────
function PipefyKanban({ toast }) {
  const [pipes, setPipes]           = useState([]);
  const [selPipe, setSelPipe]       = useState(null);
  const [pipeData, setPipeData]     = useState(null);
  const [status, setStatus]         = useState("idle"); 
  const [errMsg, setErrMsg]         = useState("");
  const [movingCard, setMovingCard] = useState(null);
  const [showNew, setShowNew]       = useState(null);
  const [newTitle, setNewTitle]     = useState("");
  const [lastSync, setLastSync]     = useState(null);

 // 1. O MOTOR: Função para carregar os dados
  const load = useCallback(async () => {
    setStatus("loading-pipes"); 
    setErrMsg("");
    try {
      const data = await pipefy(); 
      if (data.success) {
        // Reconstruímos o 'node' para o seu design original funcionar
        const formattedPhases = data.phases.map(phase => ({
          ...phase,
          cards: {
            edges: phase.cards.map(card => ({
              node: { ...card, createdAt: card.updated }
            }))
          }
        }));

        const list = [{ id: "main-pipe", name: data.pipeName, phases: formattedPhases }];
        setPipes(list);
        setSelPipe("main-pipe");
        setPipeData({ name: data.pipeName, phases: formattedPhases });
        setStatus("ready");
        setLastSync(new Date());
      } else {
        setStatus("error");
        setErrMsg(data.error || "Erro na API");
      }
    } catch(e) {
      setStatus("error"); 
      setErrMsg("Falha ao conectar: " + e.message);
    }
  }, []); // FECHA O USECALLBACK

  // 2. O GATILHO: Roda ao carregar a tela
  useEffect(() => {
    load();
  }, [load]); // FECHA O USEEFFECT

  // 3. O APELIDO: Para as funções de 'Mover Card' encontrarem o load
  const loadPipe = load;
  
  // ABAIXO DISSO VOCÊ MANTÉM O RESTANTE (loadPipe, moveCard, etc)

  const moveCard = async (cardId, destPhaseId, phaseName) => {
    setMovingCard(cardId);
    try {
      await pipefy(M_MOVE, { cardId, destPhaseId });
      toast("Card movido para " + phaseName);
      await loadPipe(selPipe);
    } catch(e) { toast("Erro ao mover: " + e.message, "err"); }
    setMovingCard(null);
  };

  const createCard = async (phaseId) => {
    if (!newTitle.trim()) return;
    try {
      await pipefy(M_CREATE, { pipeId: selPipe, title: newTitle, phaseId });
      toast("Card criado: " + newTitle);
      setNewTitle(""); setShowNew(null);
      await loadPipe(selPipe);
    } catch(e) { toast("Erro: " + e.message, "err"); }
  };

  const totalCards = pipeData?.phases?.reduce((a,p)=>a+(p.cards?.edges?.length||0),0)||0;
  const totalVal   = pipeData?.phases?.reduce((a,p)=>{
    return a + (p.cards?.edges||[]).reduce((s,{node:c})=>{
      const v=extractVal(c.fields); return s+(v?parseFloat(String(v).replace(/[^0-9.]/g,""))||0:0);
    },0);
  },0)||0;

  // Estados visuais
  if (status==="loading-pipes") return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <Spinner size={32}/><p style={{color:T.textSub,fontSize:13}}>Conectando ao Pipefy...</p>
    </div>
  );

  if (status==="error") return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:40}}>
      <div style={{width:52,height:52,borderRadius:14,background:T.redSoft,border:"1px solid rgba(231,76,60,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>⚠️</div>
      <p style={{color:T.red,fontSize:14,fontWeight:700}}>Erro de conexão</p>
      <p style={{color:T.textSub,fontSize:13,textAlign:"center",maxWidth:420,lineHeight:1.6}}>{errMsg}</p>
      <p style={{color:T.textMuted,fontSize:12,textAlign:"center",maxWidth:420}}>
        O artifact viewer bloqueia chamadas diretas ao Pipefy (CORS).<br/>
        Para conexão live, faça o deploy em Vercel — leva 3 minutos.
      </p>
      <div style={{display:"flex",gap:8}}>
        <button onClick={() => loadPipe(selPipe)} style={{padding:"9px 20px",borderRadius:10,background:T.accent,border:"none",color:"#fff",fontSize:13,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>
          Tentar novamente
        </button>
        <button onClick={() => { setPipeData(FALLBACK_PIPE); setStatus("ready"); toast("Usando dados de demonstração"); }} style={{padding:"9px 20px",borderRadius:10,background:T.surfaceUp,border:"1px solid "+T.border,color:T.textSub,fontSize:13,fontFamily:"'Outfit',sans-serif"}}>
          Ver demonstração
        </button>
      </div>
    </div>
  );

  return (
    <div style={{flex:1,overflowY:"auto",padding:20}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          {pipes.length > 1 && pipes.map(p=>(
            <button key={p.id} onClick={()=>setSelPipe(p.id)} style={{padding:"5px 14px",borderRadius:20,border:"1px solid "+(selPipe===p.id?T.accent:T.border),background:selPipe===p.id?T.accentSoft:"transparent",color:selPipe===p.id?T.accent:T.textSub,fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>
              {p.name}
            </button>
          ))}
          {pipeData && (
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <Dot color={T.green} pulse={true}/>
              <span style={{fontSize:12,color:T.textSub}}>
                {pipeData.name} · <strong style={{color:T.text}}>{totalCards}</strong> cards
                {lastSync && <span style={{color:T.textMuted}}> · {lastSync.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>}
              </span>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {totalVal>0 && <div style={{padding:"5px 13px",borderRadius:20,background:T.accentSoft,border:"1px solid "+T.borderHov}}><span style={{fontSize:12,fontWeight:700,color:T.accent}}>{fmt(totalVal)} em pipeline</span></div>}
          <button onClick={()=>loadPipe(selPipe)} disabled={status==="loading-pipe"} style={{padding:"5px 14px",borderRadius:20,background:T.surfaceUp,border:"1px solid "+T.border,color:T.textSub,fontSize:12,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:6}}>
            {status==="loading-pipe"?<Spinner size={12}/>:"↻"} Atualizar
          </button>
        </div>
      </div>

      {/* Skeleton */}
      {status==="loading-pipe" && !pipeData && (
        <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:12}}>
          {[1,2,3,4,5].map(i=>(
            <div key={i} style={{minWidth:215,background:T.surface,border:"1px solid "+T.border,borderRadius:14,overflow:"hidden",flexShrink:0}}>
              <div className="sk" style={{height:42,borderRadius:0}}/>
              <div style={{padding:8}}>{[1,2].map(j=><SkCard key={j}/>)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban real */}
      {pipeData && (
        <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:16}}>
          {pipeData.phases.map((phase, pi) => {
            const cards = phase.cards?.edges || [];
            const pc = phase.color || phaseColor(pi);
            return (
              <div key={phase.id} style={{minWidth:220,background:T.surface,border:"1px solid "+T.border,borderRadius:14,overflow:"hidden",flexShrink:0,display:"flex",flexDirection:"column"}}>
                {/* Phase header */}
                <div style={{padding:"11px 14px",borderBottom:"2px solid "+pc,display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(0,0,0,0.2)"}}>
                  <span style={{fontSize:12,fontWeight:700,color:pc}}>{phase.name}</span>
                  <span style={{fontSize:11,fontWeight:700,background:pc+"22",color:pc,borderRadius:20,padding:"1px 8px"}}>{cards.length}</span>
                </div>
                {/* Cards list */}
                <div style={{padding:8,display:"flex",flexDirection:"column",gap:7,flex:1,overflowY:"auto",maxHeight:560}}>
                  {cards.length === 0 && (
                    <div style={{padding:"20px 12px",textAlign:"center",color:T.textMuted,fontSize:12}}>Nenhum card</div>
                  )}
                  {cards.map(({node:card}) => {
                    const val   = extractVal(card.fields);
                    const score = extractScore(card.fields);
                    const asgn  = card.assignees?.[0];
                    const lbl   = card.labels?.[0];
                    const isM   = movingCard === card.id;
                    return (
                      <div key={card.id} style={{background:T.surfaceUp,borderRadius:12,border:"1px solid "+T.border,padding:"11px 13px",cursor:isM?"wait":"default",transition:"all 0.15s",animation:"slideIn 0.2s ease",opacity:isM?0.5:1,position:"relative"}}
                        onMouseEnter={e=>{if(!isM){e.currentTarget.style.borderColor="rgba(255,140,0,0.25)";e.currentTarget.style.background="#1E1C1A";}}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.surfaceUp;}}>
                        {isM && <div style={{position:"absolute",inset:0,borderRadius:12,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}><Spinner size={18}/></div>}
                        {/* Card header */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div style={{width:28,height:28,borderRadius:8,background:asgn?"linear-gradient(145deg,#C06000,#F07B10)":T.surfaceBrd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:asgn?"#fff":T.textMuted,flexShrink:0,title:asgn?.name}}>
                            {asgn?initials(asgn.name):"—"}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
                            {score && <ScorePill v={score}/>}
                            {lbl && <span style={{fontSize:9,fontWeight:600,padding:"1px 6px",borderRadius:20,background:(lbl.color||T.accent)+"22",color:lbl.color||T.accent}}>{lbl.name}</span>}
                          </div>
                        </div>
                        <p style={{fontSize:12,fontWeight:600,marginBottom:4,lineHeight:1.35,color:T.text}}>{card.title}</p>
                        {fmt(val) && <p style={{fontSize:13,fontWeight:800,color:T.accent,marginBottom:6}}>{fmt(val)}</p>}
                        <div style={{display:"flex",justifyContent:"space-between"}}>
                          <span style={{fontSize:10,color:T.textMuted}}>{asgn?.name?.split(" ")[0]||"Sem responsável"}</span>
                          <span style={{fontSize:10,color:T.textMuted}}>⏱ {timeAgo(card.createdAt)}</span>
                        </div>
                        {card.due_date && <div style={{marginTop:5,fontSize:10,color:new Date(card.due_date)<new Date()?T.red:T.textMuted}}>📅 {new Date(card.due_date).toLocaleDateString("pt-BR")}</div>}
                        {/* Move buttons */}
                        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>
                          {pipeData.phases.filter(p=>p.id!==phase.id).slice(0,3).map(p=>(
                            <button key={p.id} onClick={()=>moveCard(card.id,p.id,p.name)} style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:T.textMuted,fontFamily:"'Outfit',sans-serif"}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor=pc;e.currentTarget.style.color=pc;}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.color=T.textMuted;}}>
                              → {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* Add card */}
                  {showNew===phase.id ? (
                    <div style={{background:T.surfaceUp,borderRadius:12,border:"1px solid "+T.accent+"55",padding:"10px 12px"}}>
                      <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")createCard(phase.id);if(e.key==="Escape")setShowNew(null);}} placeholder="Título do card..." style={{width:"100%",padding:"8px 10px",borderRadius:8,background:T.surfaceBrd,border:"1px solid "+T.border,color:T.text,fontSize:12,fontFamily:"'Outfit',sans-serif",marginBottom:8}}/>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>createCard(phase.id)} style={{flex:1,padding:"6px",borderRadius:8,background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>+ Criar</button>
                        <button onClick={()=>{setShowNew(null);setNewTitle("");}} style={{padding:"6px 10px",borderRadius:8,background:"transparent",border:"1px solid "+T.border,color:T.textSub,fontSize:11,fontFamily:"'Outfit',sans-serif"}}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={()=>setShowNew(phase.id)} style={{width:"100%",padding:"8px",borderRadius:10,background:"transparent",border:"1px dashed rgba(255,255,255,0.1)",color:T.textMuted,fontSize:12,fontFamily:"'Outfit',sans-serif"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=pc;e.currentTarget.style.color=pc;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color=T.textMuted;}}>
                      + Novo card
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function FinanceHub() {
  const [user, setUser]       = useState(null);
  const [tab, setTab]         = useState("home");
  const [notif, setNotif]     = useState(null);
  const [chatCh, setChatCh]   = useState("#geral");
  const [chatIn, setChatIn]   = useState("");
  const [chats, setChats]     = useState(CHAT_INIT);
  const [osMsg, setOsMsg]     = useState([{role:"assistant",text:"Sistema OS ativo. Pipefy conectado. Como posso ajudar?"}]);
  const [osIn, setOsIn]       = useState("");
  const [osLoad, setOsLoad]   = useState(false);
  const [apiVals, setApiVals] = useState({ PIPEFY_API_TOKEN: PIPEFY_TOKEN });
  const [apiSt, setApiSt]     = useState({ PIPEFY_API_TOKEN: "connected" });
  const [apiSh, setApiSh]     = useState({});
  const [profileOpen, setProfileOpen] = useState(false);
  const chatEnd = useRef(null);
  const osEnd   = useRef(null);

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chats, chatCh]);
  useEffect(()=>{ osEnd.current?.scrollIntoView({behavior:"smooth"}); }, [osMsg]);

  // LOGIN simples
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass]   = useState("");
  const [loginStep, setLoginStep]   = useState("email");
  const [loginErr, setLoginErr]     = useState("");

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
          <h1 style={{fontSize:26,fontWeight:800,color:T.text,letterSpacing:"-0.5px"}}>Finance <span style={{color:T.accent}}>Hub</span></h1>
          <p style={{color:T.textSub,fontSize:13,marginTop:4}}>Finance Dealer · Crédito Inteligente</p>
        </div>
        <div style={{background:T.surface,borderRadius:18,padding:"28px",border:"1px solid "+T.border,boxShadow:"0 32px 60px rgba(0,0,0,0.5)"}}>
          <h2 style={{fontSize:17,fontWeight:700,color:T.text,marginBottom:4}}>{loginStep==="email"?"Bem-vindo de volta":"Digite sua senha"}</h2>
          <p style={{fontSize:13,color:T.textSub,marginBottom:22}}>{loginStep==="email"?"Entre na sua conta":loginEmail}</p>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:500,color:T.textSub,display:"block",marginBottom:7}}>{loginStep==="email"?"Email":"Senha"}</label>
            <input type={loginStep==="email"?"email":"password"} value={loginStep==="email"?loginEmail:loginPass} onChange={e=>loginStep==="email"?setLoginEmail(e.target.value):setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder={loginStep==="email"?"seu@email.com":"••••••••••"} style={{width:"100%",padding:"11px 14px",borderRadius:12,background:T.surfaceUp,border:"1px solid "+T.border,color:T.text,fontSize:13,fontFamily:"'Outfit',sans-serif",transition:"border-color 0.2s"}}/>
            {loginErr && <p style={{fontSize:12,color:T.red,marginTop:5}}>{loginErr}</p>}
          </div>
          <button onClick={doLogin} style={{width:"100%",padding:"12px",borderRadius:12,background:T.accent,border:"none",color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Outfit',sans-serif",boxShadow:"0 4px 20px rgba(240,123,16,0.35)"}}>
            {loginStep==="email"?"Continuar":"Entrar"}
          </button>
          {loginStep==="password" && <button onClick={()=>{setLoginStep("email");setLoginPass("");setLoginErr("");}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:12,background:"transparent",border:"none",color:T.textSub,fontSize:13,fontFamily:"'Outfit',sans-serif"}}>← Voltar</button>}
        </div>
      </div>
    </div>
  );

  const toast = (msg,type) => { setNotif({msg,type:type||"ok"}); setTimeout(()=>setNotif(null),3500); };
  const connCount = Object.values(apiSt).filter(s=>s==="connected").length;
  const totalApis = APIS_CFG.reduce((a,c)=>a+c.apis.length,0);
  const agentsOn  = connCount >= 2;

  const sendChat = () => {
    if (!chatIn.trim()) return;
    setChats(p=>({...p,[chatCh]:[...(p[chatCh]||[]),{id:Date.now(),user:"Você",role:"GERENTE",time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),text:chatIn,av:"VC"}]}));
    setChatIn("");
  };

  const sendOS = async () => {
    if (!osIn.trim()||osLoad) return;
    const q=osIn; setOsIn("");
    setOsMsg(p=>[...p,{role:"user",text:q}]);
    setOsLoad(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"Você é o OS da Finance Dealer, especialista em crédito brasileiro. Responda concisamente em português.",messages:[{role:"user",content:q}]})});
      const d = await r.json();
      setOsMsg(p=>[...p,{role:"assistant",text:d.content?.[0]?.text||"Erro."}]);
    } catch { setOsMsg(p=>[...p,{role:"assistant",text:"Erro de conexão."}]); }
    setOsLoad(false);
  };

  const connectApi  = (key) => { if(!apiVals[key]?.trim())return toast("Insira o valor","err"); setApiSt(p=>({...p,[key]:"connected"})); toast("Conectado!"); };
  const disconnApi  = (key) => { if(key==="PIPEFY_API_TOKEN")return toast("Token Pipefy é fixo","err"); setApiSt(p=>{const n={...p};delete n[key];return n;}); setApiVals(p=>{const n={...p};delete n[key];return n;}); };

  const NAV = [
    {id:"home",     label:"Início",          icon:"⌂"},
    {id:"mesa",     label:"Mesa de Crédito", icon:"▦"},
    {id:"ma",       label:"M&A",             icon:"◆"},
    {id:"chat",     label:"Chat Equipe",     icon:"◉"},
    {id:"os",       label:"OS · IA",         icon:"◎"},
    {id:"gerencial",label:"Gerencial",       icon:"▲"},
    {id:"apis",     label:"Conectar APIs",   icon:"⊕", badge:connCount+"/"+totalApis},
  ];

  const HOME_CARDS = [
    {label:"Reuniões Recentes",   sub:"4 esta semana",                    action:"Ver todas",  onClick:()=>setTab("gerencial"), color:T.accent},
    {label:"Pipeline Ativo",      sub:"Dados live do Pipefy",             action:"Abrir mesa", onClick:()=>setTab("mesa"),      color:T.green},
    {label:"M&A · Action Items",  sub:"4 deals corporativos ativos",      action:"Ver M&A",    onClick:()=>setTab("ma"),        color:T.blue},
    {label:"Emails Urgentes",     sub:"0 não lidos",                      action:null,         onClick:()=>{},                  badge:"X 0"},
    {label:"Comercial",           sub:"Pipeline live · Pipefy",           action:"Ver todos",  onClick:()=>setTab("mesa"),      badge:"live"},
    {label:"Action Items Urgentes",sub:"Verificar pendências",            action:null,         onClick:()=>{},                  badge:"⚠"},
    {label:"Decisões Pendentes",  sub:"0 aguardando aprovação",           action:"Ver todas",  onClick:()=>{},                  badge:"⚠ 0"},
    {label:"Follow-up Urgente",   sub:"0 pendentes",                      action:"Ver todos",  onClick:()=>{},                  badge:"⚠ 0"},
    {label:"Saúde do Sistema",    sub:agentsOn?"Todos sistemas ativos":"Conecte as APIs", action:null, onClick:()=>setTab("apis"), badge:agentsOn?"✓ —":"—"},
  ];

  const tabLabel = {home:"Início",mesa:"Mesa de Crédito · Pipefy Live",ma:"M&A · Fusões & Aquisições",chat:"Chat Equipe",os:"OS · Operation System",gerencial:"Gerencial",apis:"Conectar APIs"};

  return (
    <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"'Outfit',sans-serif",color:T.text,overflow:"hidden"}}>
      <style>{CSS}</style>

      {notif && (
        <div style={{position:"fixed",top:16,right:16,zIndex:9999,background:notif.type==="ok"?T.green:T.red,color:"#fff",padding:"10px 18px",borderRadius:12,fontSize:13,fontWeight:600,animation:"notif 0.3s ease",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
          {notif.msg}
        </div>
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <div style={{width:216,background:T.surface,borderRight:"1px solid "+T.border,display:"flex",flexDirection:"column",flexShrink:0}}>
        {/* Logo */}
        <div style={{padding:"18px 16px 14px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(145deg,#C06000,#F07B10)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(240,123,16,0.3)",flexShrink:0}}>
            <svg width="17" height="17" viewBox="0 0 30 30" fill="none"><path d="M15 3L27 10V20L15 27L3 20V10L15 3Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5"/><circle cx="15" cy="15" r="3.5" fill="white"/></svg>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:800,lineHeight:1.1}}>Finance <span style={{color:T.accent}}>Hub</span></div>
            <div style={{fontSize:10,color:T.textMuted}}>Finance Dealer</div>
          </div>
        </div>

        {/* Agents */}
        <div style={{margin:"12px 12px 4px",background:T.surfaceUp,borderRadius:12,padding:"10px 12px",border:"1px solid "+T.border}}>
          <p style={{fontSize:10,fontWeight:600,color:T.textMuted,letterSpacing:"0.5px",marginBottom:8,textTransform:"uppercase"}}>Agentes IA</p>
          {[{n:1,name:"Pré-Análise"},{n:2,name:"Agendamento"},{n:3,name:"Pós-Reunião"},{n:4,name:"Jurídico"}].map(a=>(
            <div key={a.n} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
              <Dot color={agentsOn?T.green:T.textMuted} pulse={agentsOn}/>
              <span style={{fontSize:11,color:agentsOn?T.textSub:T.textMuted}}>{a.name}</span>
            </div>
          ))}
          {!agentsOn && <p style={{fontSize:10,color:T.accent,marginTop:6,cursor:"pointer"}} onClick={()=>setTab("apis")}>Conectar APIs →</p>}
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"8px 8px",overflowY:"auto"}}>
          {NAV.map(n=>(
            <button key={n.id} className="nav-item" onClick={()=>setTab(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:10,border:"none",cursor:"pointer",marginBottom:2,background:tab===n.id?T.surfaceBrd:"transparent",color:tab===n.id?T.text:T.textSub,fontSize:13,fontWeight:tab===n.id?600:400,fontFamily:"'Outfit',sans-serif",textAlign:"left",borderLeft:tab===n.id?"2px solid "+T.accent:"2px solid transparent"}}>
              <span style={{color:tab===n.id?T.accent:T.textSub,fontSize:14,width:16,textAlign:"center"}}>{n.icon}</span>
              <span style={{flex:1}}>{n.label}</span>
              {n.badge && <span style={{fontSize:10,fontWeight:700,background:connCount===totalApis?T.greenSoft:T.accentSoft,color:connCount===totalApis?T.green:T.accent,borderRadius:20,padding:"1px 7px"}}>{n.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Pipefy status */}
        <div style={{margin:"0 12px 10px",background:T.surfaceUp,borderRadius:12,padding:"9px 12px",border:"1px solid "+T.border,display:"flex",alignItems:"center",gap:8}}>
          <Dot color={T.green} pulse={true}/>
          <div>
            <p style={{fontSize:11,fontWeight:600,color:T.text}}>Pipefy</p>
            <p style={{fontSize:10,color:T.textMuted}}>Token ativo</p>
          </div>
        </div>

        {/* Profile */}
        <div style={{padding:"10px 8px",borderTop:"1px solid "+T.border,position:"relative"}}>
          <button onClick={()=>setProfileOpen(!profileOpen)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:10,border:"none",background:"transparent",cursor:"pointer",color:T.text,fontFamily:"'Outfit',sans-serif"}}>
            <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(145deg,#C06000,#F07B10)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>
              {initials(user.name)}
            </div>
            <div style={{textAlign:"left",flex:1}}>
              <div style={{fontSize:12,fontWeight:600}}>{user.name}</div>
              <div style={{fontSize:10,color:T.accent}}>Lv{user.level} · {user.role}</div>
            </div>
            <span style={{fontSize:11,color:T.textMuted}}>▲</span>
          </button>
          {profileOpen && (
            <div style={{position:"absolute",bottom:"calc(100% + 4px)",left:8,right:8,background:T.surfaceUp,border:"1px solid "+T.border,borderRadius:12,padding:6,boxShadow:"0 -8px 32px rgba(0,0,0,0.5)"}}>
              {[{label:"Configurações"},{label:"Sair",danger:true}].map((item,i)=>(
                <button key={i} onClick={()=>{if(item.danger){setUser(null);setProfileOpen(false);}}} style={{width:"100%",padding:"8px 12px",borderRadius:9,border:"none",background:"transparent",color:item.danger?T.red:T.text,fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surfaceBrd}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{height:52,borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:T.surface,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{color:T.textMuted,fontSize:13}}>›</span>
            <span style={{fontSize:14,fontWeight:600}}>{tabLabel[tab]}</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,color:T.textMuted}}>{new Date().toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})}</span>
            {tab==="mesa" && <button onClick={()=>toast("Use o botão '+ Novo card' na fase desejada")} style={{padding:"6px 14px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>+ Novo Deal</button>}
            {tab==="ma"   && <button onClick={()=>toast("Mandato M&A criado")} style={{padding:"6px 14px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>+ Mandato M&A</button>}
          </div>
        </div>

        {/* ── HOME ─────────────────────────────────────────────────────── */}
        {tab==="home" && (
          <div style={{flex:1,overflowY:"auto",padding:24}}>
            <div style={{maxWidth:580,margin:"0 auto 36px",position:"relative"}}>
              <input placeholder="Buscar em tudo... (Ctrl+K para ações)" style={{width:"100%",padding:"14px 54px 14px 20px",borderRadius:50,background:T.surface,border:"1px solid "+T.border,color:T.text,fontSize:14,fontFamily:"'Outfit',sans-serif",boxShadow:"0 4px 20px rgba(0,0,0,0.3)",transition:"border-color 0.2s"}}/>
              <div style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:38,height:38,borderRadius:50,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(240,123,16,0.4)"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {HOME_CARDS.map((card,i)=>(
                <div key={i} className="card" onClick={card.onClick} style={{background:T.surface,border:"1px solid "+T.border,borderRadius:16,padding:"18px 20px",cursor:"pointer",transition:"all 0.2s",animation:"fadeUp 0.4s ease both",animationDelay:(i*0.05)+"s",minHeight:110,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                    <span style={{fontSize:14,fontWeight:600,color:T.text}}>{card.label}</span>
                    {card.badge && <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:card.badge.includes("✓")?T.greenSoft:card.badge.includes("X")?T.redSoft:T.accentSoft,color:card.badge.includes("✓")?T.green:card.badge.includes("X")?T.red:T.accent,whiteSpace:"nowrap"}}>{card.badge}</span>}
                  </div>
                  <div>
                    <p style={{fontSize:13,color:T.textSub,marginBottom:card.action?8:0}}>{card.sub}</p>
                    {card.action && <span style={{fontSize:12,color:T.accent,fontWeight:600}}>{card.action}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MESA — PIPEFY LIVE ───────────────────────────────────────── */}
        {tab==="mesa" && <PipefyKanban toast={toast}/>}

        {/* ── M&A ─────────────────────────────────────────────────────── */}
        {tab==="ma" && (
          <div style={{flex:1,overflowY:"auto",padding:24}}>
            <div style={{background:T.surface,borderRadius:14,border:"1px solid "+T.border,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:"1px solid "+T.border}}>
                    {["Empresa Alvo","Faturamento","Setor","Score","Status","Ações"].map(h=>(
                      <th key={h} style={{padding:"12px 16px",fontSize:11,fontWeight:600,color:T.textMuted,textAlign:"left",textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MA_DEALS.map(d=>(
                    <tr key={d.id} className="row-h" style={{borderBottom:"1px solid "+T.border,transition:"background 0.1s"}}>
                      <td style={{padding:"14px 16px",fontSize:13,fontWeight:600}}>{d.empresa}</td>
                      <td style={{padding:"14px 16px",fontSize:13,fontWeight:700,color:T.accent}}>{d.fat}</td>
                      <td style={{padding:"14px 16px"}}><Tag>{d.setor}</Tag></td>
                      <td style={{padding:"14px 16px"}}><ScorePill v={d.score}/></td>
                      <td style={{padding:"14px 16px",fontSize:13}}>
                        <span style={{display:"flex",alignItems:"center",gap:6}}>
                          <Dot color={d.flag==="ok"?T.green:d.flag==="warn"?T.yellow:T.red}/>
                          {d.status}
                        </span>
                      </td>
                      <td style={{padding:"14px 16px"}}>
                        <button onClick={()=>toast("Abrindo: "+d.empresa)} style={{padding:"6px 14px",borderRadius:9,background:T.accentSoft,border:"1px solid "+T.borderHov,color:T.accent,fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>Abrir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CHAT ─────────────────────────────────────────────────────── */}
        {tab==="chat" && (
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            <div style={{width:158,borderRight:"1px solid "+T.border,padding:"14px 8px",flexShrink:0}}>
              <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",padding:"0 8px 10px"}}>Canais</p>
              {["#geral","#licenciados","#analistas","#mandatos"].map(ch=>(
                <button key={ch} onClick={()=>setChatCh(ch)} style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:10,border:"none",marginBottom:2,background:chatCh===ch?T.surfaceBrd:"transparent",color:chatCh===ch?T.text:T.textSub,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:chatCh===ch?600:400,borderLeft:chatCh===ch?"2px solid "+T.accent:"2px solid transparent",transition:"all 0.12s"}}>
                  {ch}
                </button>
              ))}
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
                {(chats[chatCh]||[]).map(msg=>(
                  <div key={msg.id} style={{display:"flex",gap:10,marginBottom:16,animation:"slideIn 0.2s ease"}}>
                    <div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:msg.user==="Você"?"linear-gradient(145deg,#C06000,#F07B10)":T.surfaceBrd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>
                      {msg.av}
                    </div>
                    <div>
                      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:5}}>
                        <span style={{fontSize:13,fontWeight:700}}>{msg.user}</span>
                        <Tag color={T.textMuted}>{msg.role}</Tag>
                        <span style={{fontSize:11,color:T.textMuted}}>{msg.time}</span>
                      </div>
                      <div style={{fontSize:13,color:T.text,lineHeight:1.5,background:T.surfaceUp,borderRadius:"4px 14px 14px 14px",padding:"10px 14px",border:"1px solid "+T.border,maxWidth:500}}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEnd}/>
              </div>
              <div style={{padding:"14px 20px",borderTop:"1px solid "+T.border,display:"flex",gap:10}}>
                <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder={"Mensagem em "+chatCh+"..."} style={{flex:1,background:T.surfaceUp,border:"1px solid "+T.border,borderRadius:12,padding:"10px 16px",color:T.text,fontSize:13,fontFamily:"'Outfit',sans-serif",transition:"border-color 0.2s"}}/>
                <button onClick={sendChat} style={{padding:"10px 20px",borderRadius:12,background:T.accent,border:"none",color:"#fff",fontWeight:700,fontFamily:"'Outfit',sans-serif",fontSize:13}}>Enviar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── OS IA ────────────────────────────────────────────────────── */}
        {tab==="os" && (
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
              {osMsg.length<=1 && (
                <div style={{marginBottom:20}}>
                  <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Sugestões rápidas</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {OS_HINTS.map((s,i)=>(
                      <button key={i} onClick={()=>setOsIn(s)} style={{padding:"7px 14px",borderRadius:20,border:"1px solid "+T.border,background:"transparent",color:T.textSub,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.12s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSub;}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {osMsg.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:14,animation:"slideIn 0.2s ease"}}>
                  {m.role==="assistant" && <div style={{width:32,height:32,borderRadius:10,flexShrink:0,marginRight:10,background:"linear-gradient(145deg,#1a5c38,#2ECC71)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>OS</div>}
                  <div style={{maxWidth:"72%",padding:"11px 16px",borderRadius:m.role==="user"?"14px 4px 14px 14px":"4px 14px 14px 14px",background:m.role==="user"?T.accent:T.surfaceUp,color:m.role==="user"?"#fff":T.text,fontSize:13,lineHeight:1.6,border:"1px solid "+(m.role==="user"?"transparent":T.border)}}>
                    {m.text}
                  </div>
                </div>
              ))}
              {osLoad && (
                <div style={{display:"flex",gap:10,marginBottom:14}}>
                  <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(145deg,#1a5c38,#2ECC71)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>OS</div>
                  <div style={{background:T.surfaceUp,borderRadius:"4px 14px 14px 14px",padding:"11px 16px",border:"1px solid "+T.border,display:"flex",gap:5,alignItems:"center"}}>
                    {[0,1,2].map(j=><div key={j} style={{width:6,height:6,borderRadius:"50%",background:T.accent,animation:"blink 1.2s "+(j*0.2)+"s infinite"}}/>)}
                  </div>
                </div>
              )}
              <div ref={osEnd}/>
            </div>
            <div style={{padding:"14px 20px",borderTop:"1px solid "+T.border,display:"flex",gap:10}}>
              <input value={osIn} onChange={e=>setOsIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendOS()} placeholder="Pergunte ao OS: score, checklist, linhas de crédito..." style={{flex:1,background:T.surfaceUp,border:"1px solid "+T.border,borderRadius:12,padding:"11px 16px",color:T.text,fontSize:13,fontFamily:"'Outfit',sans-serif",transition:"border-color 0.2s"}}/>
              <button onClick={sendOS} disabled={osLoad} style={{padding:"11px 22px",borderRadius:12,background:osLoad?T.surfaceBrd:T.accent,border:"none",color:"#fff",fontWeight:700,fontFamily:"'Outfit',sans-serif",fontSize:13,opacity:osLoad?0.5:1}}>Enviar</button>
            </div>
          </div>
        )}

        {/* ── GERENCIAL ────────────────────────────────────────────────── */}
        {tab==="gerencial" && (
          <div style={{flex:1,overflowY:"auto",padding:24}}>
            <div style={{background:T.redSoft,border:"1px solid rgba(231,76,60,0.2)",borderRadius:12,padding:"10px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
              <Dot color={T.red}/>
              <span style={{fontSize:13,color:T.textSub}}><strong style={{color:T.red}}>Gargalo:</strong> 3 deals parados +72h em Checklist Docs</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
              {[{label:"Deals Fechados",v:"4",sub:"▲ +1 semana",c:T.green},{label:"Volume Aprovado",v:"R$ 6,4M",sub:"▲ +23%",c:T.accent},{label:"Conversão Mês",v:"67%",sub:"▲ Meta 60%",c:T.blue}].map((k,i)=>(
                <div key={i} style={{background:T.surface,borderRadius:14,border:"1px solid "+T.border,padding:"18px 20px"}}>
                  <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>{k.label}</p>
                  <p style={{fontSize:26,fontWeight:800,color:k.c}}>{k.v}</p>
                  <p style={{fontSize:11,color:T.green,marginTop:4}}>{k.sub}</p>
                </div>
              ))}
            </div>
            <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:12}}>Reuniões · Últimos 7 dias</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {MEETS.map((m,i)=>(
                <div key={i} className="card" style={{background:T.surface,borderRadius:14,border:"1px solid "+T.border,padding:"14px 18px",display:"flex",alignItems:"center",gap:18,cursor:"pointer",transition:"all 0.15s"}} onClick={()=>toast("Resumo: "+m.client)}>
                  <div style={{width:40,height:40,borderRadius:12,background:T.surfaceUp,border:"1px solid "+T.border,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:12,fontWeight:800,color:T.accent}}>{m.date.split("/")[0]}</span>
                    <span style={{fontSize:9,color:T.textMuted}}>{"/" + m.date.split("/")[1]}</span>
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:14,fontWeight:700,marginBottom:2}}>{m.client}</p>
                    <p style={{fontSize:12,color:T.textSub}}>{m.linha} · {m.dur}</p>
                  </div>
                  <div style={{textAlign:"center",flexShrink:0}}>
                    <p style={{fontSize:10,color:T.textMuted,marginBottom:4}}>Score</p>
                    <ScorePill v={m.score}/>
                  </div>
                  <p style={{fontSize:13,fontWeight:800,color:T.accent,flexShrink:0}}>{m.valor}</p>
                  <span style={{fontSize:12,padding:"3px 12px",borderRadius:20,flexShrink:0,background:m.ok===true?T.greenSoft:m.ok===false?T.redSoft:"rgba(245,158,11,0.1)",color:m.ok===true?T.green:m.ok===false?T.red:T.yellow}}>
                    {m.ok===true?"✓ Aprovado":m.ok===false?"Pendente":"Em análise"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── APIS ─────────────────────────────────────────────────────── */}
        {tab==="apis" && (
          <div style={{flex:1,overflowY:"auto",padding:24}}>
            {/* Status banner */}
            <div style={{background:connCount===totalApis?T.greenSoft:T.accentSoft,border:"1px solid "+(connCount===totalApis?"rgba(46,204,113,0.25)":"rgba(240,123,16,0.25)"),borderRadius:12,padding:"13px 18px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Dot color={connCount===totalApis?T.green:connCount>0?T.accent:T.textMuted} pulse={connCount>0&&connCount<totalApis}/>
                <span style={{fontSize:14,fontWeight:600,color:connCount===totalApis?T.green:T.accent}}>
                  {connCount===0?"Sistema desconectado":connCount===totalApis?"Todas APIs conectadas":connCount+"/"+totalApis+" APIs conectadas"}
                </span>
              </div>
              <span style={{fontSize:12,color:T.textSub}}>Agentes ativam ao conectar Pipefy + Anthropic</span>
            </div>

            {APIS_CFG.map((cat,ci)=>(
              <div key={ci} style={{marginBottom:22}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
                  <div style={{width:4,height:16,borderRadius:2,background:cat.color}}/>
                  <span style={{fontSize:13,fontWeight:700,color:cat.color}}>{cat.cat}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {cat.apis.map((api,ai)=>{
                    const conn = apiSt[api.key]==="connected" || api.connected;
                    return (
                      <div key={ai} style={{background:T.surface,borderRadius:14,border:"1px solid "+(conn?cat.color+"44":T.border),padding:"16px 18px",transition:"border-color 0.2s"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                              <span style={{fontSize:14,fontWeight:600}}>{api.name}</span>
                              {conn && <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:T.greenSoft,color:T.green}}>Conectado</span>}
                            </div>
                            <p style={{fontSize:11,color:T.textMuted}}>{api.desc}</p>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <div style={{position:"relative",flex:1}}>
                            <input
                              type={apiSh[api.key]?"text":"password"}
                              value={conn&&api.key==="PIPEFY_API_TOKEN"?"••••••••••••••••":apiVals[api.key]||""}
                              onChange={e=>setApiVals(p=>({...p,[api.key]:e.target.value}))}
                              placeholder={conn?"••••••••••••••••":api.ph}
                              disabled={conn}
                              style={{width:"100%",padding:"9px 36px 9px 14px",borderRadius:10,background:conn?"rgba(0,0,0,0.2)":T.surfaceUp,border:"1px solid "+(conn?cat.color+"22":T.border),color:conn?T.textMuted:T.text,fontFamily:"'JetBrains Mono',monospace",fontSize:11,opacity:conn?0.6:1,transition:"border-color 0.2s"}}
                            />
                            {!conn && <button onClick={()=>setApiSh(p=>({...p,[api.key]:!p[api.key]}))} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.textMuted,fontSize:13,padding:2}}>{apiSh[api.key]?"●":"○"}</button>}
                          </div>
                          {conn
                            ? <button onClick={()=>disconnApi(api.key)} style={{padding:"9px 14px",borderRadius:10,background:T.redSoft,border:"1px solid rgba(231,76,60,0.2)",color:T.red,fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>Remover</button>
                            : <button onClick={()=>connectApi(api.key)} style={{padding:"9px 18px",borderRadius:10,background:cat.color,border:"none",color:"#fff",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap",boxShadow:"0 4px 12px "+cat.color+"44"}}>Conectar</button>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* .env */}
            <div style={{background:T.surfaceUp,borderRadius:14,border:"1px solid "+T.border,padding:"18px 20px"}}>
              <p style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:12}}>.env Example</p>
              <div>
                {ENV_LINES.map(([k,v],i)=>(
                  <div key={i} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,lineHeight:1.9}}>
                    <span style={{color:T.accent}}>{k}</span>
                    <span style={{color:T.textMuted}}>{"="+v}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>toast("Conteúdo copiado")} style={{marginTop:12,padding:"7px 16px",borderRadius:10,background:T.accentSoft,border:"1px solid "+T.borderHov,color:T.accent,fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>
                Copiar .env
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
