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
body{background:#0E0E0E;overflow:hidden;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px;}
@keyframes slideIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
`;

// ─── API HELPER ───────────────────────────────────────────────────────────────
async function pipefy() {
  const r = await fetch("/api/pipefy");
  if (!r.ok) throw new Error("Erro na API: " + r.status);
  return await r.json();
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const initials = (s) => { if(!s)return"??"; const p=s.trim().split(" "); return (p[0][0]+(p[1]?p[1][0]:"")).toUpperCase(); };
const timeAgo = (iso) => { if(!iso)return"—"; const h=Math.floor((Date.now()-new Date(iso))/36e5); return h<1?"agora":h<24?h+"h":Math.floor(h/24)+"d"; };
const PHASE_PAL = ["#6366F1","#F07B10","#3B82F6","#A78BFA","#2ECC71","#F59E0B"];
const phaseColor = (i) => PHASE_PAL[i % PHASE_PAL.length];

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Spinner = ({size,color}) => <div style={{width:size||20,height:size||20,border:"2px solid rgba(255,255,255,0.1)",borderTop:"2px solid "+(color||T.accent),borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>;
const Dot = ({color,pulse}) => <div style={{width:7,height:7,borderRadius:"50%",background:color}}/>;

// ─── KANBAN COMPONENT (A Única Parte que Mudou o Motor) ──────────────────────
function PipefyKanban() {
  const [pipeData, setPipeData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [lastSync, setLastSync] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await pipefy();
      if (data.success) {
        setPipeData(data);
        setStatus("ready");
        setLastSync(new Date());
      }
    } catch(e) { setStatus("error"); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status === "loading") return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner size={30}/></div>;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:20,overflow:"hidden"}}>
      <div style={{display:"flex",gap:16,overflowX:"auto",paddingBottom:20,flex:1}}>
        {pipeData?.phases.map((phase, pi) => (
          <div key={phase.id} style={{minWidth:280,background:T.surface,borderRadius:14,border:"1px solid "+T.border,display:"flex",flexDirection:"column"}}>
            <div style={{padding:12,borderBottom:"2px solid "+phaseColor(pi),background:"rgba(0,0,0,0.2)",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:12,fontWeight:700,color:phaseColor(pi)}}>{phase.name}</span>
              <span style={{fontSize:11,color:T.textMuted}}>{phase.cards.length}</span>
            </div>
            <div style={{padding:10,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
              {phase.cards.map(card => (
                <div key={card.id} style={{background:T.surfaceUp,border:"1px solid "+T.border,padding:12,borderRadius:12,animation:"slideIn 0.3s ease"}}>
                  <p style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:6}}>{card.title}</p>
                  <div style={{fontSize:10,color:T.textMuted,lineHeight:1.4}}>{card.details?.substring(0,100)}...</div>
                  <div style={{marginTop:8,textAlign:"right"}}><span style={{fontSize:9,color:T.accent}}>⏱ {timeAgo(card.updated)}</span></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP (COM TODAS AS SUAS ABAS ORIGINAIS) ──────────────────────────────
export default function FinanceHub() {
  const [tab, setTab] = useState("mesa");
  const [user] = useState({ name: "Teste User", role: "GERENTE", level: 4 });

  // Definição das suas abas originais do seu código
  const navItems = [
    { id: "inicio", label: "Início", icon: "🏠" },
    { id: "mesa", label: "Mesa de Crédito", icon: "▦" },
    { id: "ma", label: "M&A", icon: "◆" },
    { id: "chat", label: "Chat Equipe", icon: "●" },
    { id: "os", label: "OS · IA", icon: "●" },
    { id: "gerencial", label: "Gerencial", icon: "▲" },
    { id: "conectar", label: "Conectar APIs", icon: "⊕", badge: "1/9" }
  ];

  return (
    <div style={{height:"100vh",background:T.bg,color:T.text,fontFamily:"'Outfit',sans-serif",display:"flex",overflow:"hidden"}}>
      <style>{CSS}</style>
      
      {/* Sidebar Original */}
      <div style={{width:240,background:T.surface,borderRight:"1px solid "+T.border,display:"flex",flexDirection:"column",padding:20}}>
        <div style={{marginBottom:30}}>
          <h1 style={{fontSize:20,fontWeight:800}}>Finance <span style={{color:T.accent}}>Hub</span></h1>
          <p style={{fontSize:10,color:T.textMuted}}>Finance Dealer</p>
        </div>

        <nav style={{display:"flex",flexDirection:"column",gap:6,flex:1}}>
          <p style={{fontSize:10,fontWeight:700,color:T.textMuted,marginBottom:8,textTransform:"uppercase"}}>Menu</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              textAlign:"left",padding:"12px 14px",borderRadius:10,border:"none",
              background:tab===item.id?T.accentSoft:"transparent",
              color:tab===item.id?T.accent:T.textSub,
              fontWeight:tab===item.id?700:500,fontSize:13,display:"flex",alignItems:"center",gap:10
            }}>
              <span>{item.icon}</span> {item.label}
              {item.badge && <span style={{marginLeft:"auto",fontSize:9,background:T.surfaceBrd,padding:"2px 6px",borderRadius:6,color:T.accent}}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{marginTop:"auto",paddingTop:20,borderTop:"1px solid "+T.border}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>T</div>
            <div>
              <p style={{fontSize:12,fontWeight:700}}>{user.name}</p>
              <p style={{fontSize:10,color:T.textMuted}}>Lv{user.level} · {user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Conteúdo */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{padding:20,borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:14,fontWeight:600}}>{navItems.find(i=>i.id===tab)?.label}</p>
          <button style={{background:T.accent,color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700}}>+ Novo Deal</button>
        </header>

        {tab === "mesa" ? <PipefyKanban /> : (
          <div style={{padding:40,textAlign:"center",color:T.textMuted}}>
            <p>Módulo <b>{tab.toUpperCase()}</b> em desenvolvimento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
