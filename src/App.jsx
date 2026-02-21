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
body{background:#0E0E0E;color:#ECECEC;font-family:'Outfit',sans-serif;overflow:hidden;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(15px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
button{transition:all 0.15s ease;cursor:pointer;border:none;}
button:active{transform:scale(0.98);}
.login-glow{box-shadow: 0 0 80px -20px rgba(240,123,16,0.15);}
`;

// ─── API HELPER ───────────────────────────────────────────────────────────────
async function pipefy() {
  const r = await fetch("/api/pipefy");
  if (!r.ok) throw new Error("Erro na conexão");
  return await r.json();
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const timeAgo = (iso) => { if(!iso)return"—"; const h=Math.floor((Date.now()-new Date(iso))/36e5); return h<1?"agora":h<24?h+"h":Math.floor(h/24)+"d"; };
const PHASE_PAL = ["#6366F1","#F07B10","#3B82F6","#A78BFA","#2ECC71","#F59E0B"];

// ─── COMPONENTES DE CONTEÚDO ──────────────────────────────────────────────────

function PipefyKanban() {
  const [pipeData, setPipeData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await pipefy();
      if (data.success) { setPipeData(data); setStatus("ready"); }
    } catch(e) { setStatus("error"); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status === "loading") return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:30,height:30,border:"2px solid rgba(255,255,255,0.1)",borderTop:"2px solid "+T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>;

  return (
    <div style={{flex:1,display:"flex",gap:16,overflowX:"auto",padding:20}}>
      {pipeData?.phases.map((phase, pi) => (
        <div key={phase.id} style={{minWidth:300,background:T.surface,borderRadius:16,border:"1px solid "+T.border,display:"flex",flexDirection:"column"}}>
          <div style={{padding:16,borderBottom: "2px solid "+PHASE_PAL[pi%6], display:"flex", justifyContent:"space-between"}}>
            <span style={{fontSize:12,fontWeight:800,color:PHASE_PAL[pi%6]}}>{phase.name.toUpperCase()}</span>
            <span style={{fontSize:11,color:T.textMuted}}>{phase.cards.length}</span>
          </div>
          <div style={{padding:12,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
            {phase.cards.map(card => (
              <div key={card.id} style={{background:T.surfaceUp,border:"1px solid "+T.border,padding:14,borderRadius:14,animation:"fadeUp 0.3s ease"}}>
                <p style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:6}}>{card.title}</p>
                <div style={{fontSize:10,color:T.textMuted,lineHeight:1.4}}>{card.details}</div>
                <div style={{marginTop:8,textAlign:"right"}}><span style={{fontSize:9,color:T.accent}}>⏱ {timeAgo(card.updated)}</span></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TELA DE LOGIN ────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: "", pass: "" });
  return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(circle at 50% 50%, #151412 0%, #0E0E0E 100%)"}}>
      <div className="login-glow" style={{width:400,background:T.surface,padding:40,borderRadius:24,border:"1px solid "+T.border,textAlign:"center",animation:"fadeUp 0.6s ease"}}>
        <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>Finance <span style={{color:T.accent}}>Hub</span></h1>
        <p style={{fontSize:12,color:T.textMuted,marginBottom:32}}>ACESSO RESTRITO À MESA DE OPERAÇÕES</p>
        
        <div style={{textAlign:"left",display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:T.textSub,marginBottom:8,marginLeft:4}}>E-MAIL CORPORATIVO</p>
            <input type="text" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} style={{width:"100%",background:T.surfaceUp,border:"1px solid "+T.border,padding:"14px 16px",borderRadius:12,color:"#fff",outline:"none"}} placeholder="seu@email.com"/>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:T.textSub,marginBottom:8,marginLeft:4}}>SENHA</p>
            <input type="password" value={form.pass} onChange={e=>setForm({...form, pass:e.target.value})} style={{width:"100%",background:T.surfaceUp,border:"1px solid "+T.border,padding:"14px 16px",borderRadius:12,color:"#fff",outline:"none"}} placeholder="••••••••"/>
          </div>
          <button onClick={()=>onLogin(form.email)} style={{background:T.accent,color:"#fff",padding:16,borderRadius:12,fontWeight:800,marginTop:8,boxShadow:"0 10px 20px -5px "+T.accent+"44"}}>ENTRAR NO HUB</button>
        </div>
        <p style={{fontSize:11,color:T.textMuted,marginTop:32}}>Finance Dealer V1.0 • Todos os direitos reservados</p>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function FinanceHub() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("mesa");

  if (!user) return <><style>{CSS}</style><LoginPage onLogin={(email)=>setUser({name:email.split('@')[0], role:"GERENTE"})} /></>;

  return (
    <div style={{height:"100vh",background:T.bg,color:T.text,display:"flex",overflow:"hidden"}}>
      <style>{CSS}</style>
      
      {/* Sidebar Original */}
      <div style={{width:240,background:T.surface,borderRight:"1px solid "+T.border,display:"flex",flexDirection:"column",padding:24}}>
        <h1 style={{fontSize:20,fontWeight:800,marginBottom:32}}>Finance <span style={{color:T.accent}}>Hub</span></h1>
        
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
          {["inicio", "mesa", "ma", "chat", "os", "gerencial", "conectar"].map(id => (
            <button key={id} onClick={() => setTab(id)} style={{
              textAlign:"left",padding:"14px 16px",borderRadius:12,
              background:tab===id?T.accentSoft:"transparent",
              color:tab===id?T.accent:T.textSub,
              fontWeight:tab===id?700:500,fontSize:14,display:"flex",alignItems:"center",gap:12
            }}>
              {id === "mesa" ? "▦ Mesa de Crédito" : id.toUpperCase()}
            </button>
          ))}
        </nav>

        <div style={{marginTop:"auto",paddingTop:24,borderTop:"1px solid "+T.border}}>
          <p style={{fontSize:12,fontWeight:700}}>{user.name}</p>
          <p style={{fontSize:10,color:T.textMuted}}>{user.role}</p>
        </div>
      </div>

      {/* Área de Conteúdo */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{padding:"20px 32px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:14,fontWeight:700}}>{tab.toUpperCase()}</p>
          <button style={{background:T.accent,color:"#fff",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:800}}>+ NOVO DEAL</button>
        </header>

        <main style={{flex:1,overflowY:"auto"}}>
          {tab === "mesa" && <PipefyKanban />}
          {tab === "inicio" && <div style={{padding:32}}><h2>Bem-vindo ao Dashboard</h2><p style={{color:T.textMuted,marginTop:10}}>Resumo das operações do dia.</p></div>}
          {tab === "ma" && <div style={{padding:32}}><h2>Pipeline M&A</h2><p style={{color:T.textMuted,marginTop:10}}>Projetos em fase de Mandato e Closing.</p></div>}
          {tab === "conectar" && (
            <div style={{padding:32}}>
              <h2>Hub de Conexões</h2>
              <div style={{marginTop:20,padding:20,background:T.surface,borderRadius:16,border:"1px solid "+T.border}}>
                <p style={{fontWeight:700,color:T.green}}>● Pipefy Conectado</p>
                <p style={{fontSize:12,color:T.textMuted,marginTop:4}}>Sincronização em tempo real ativa.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
