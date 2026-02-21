export default async function handler(req, res) {
  try {
    // DEBUG: mostra TODAS variáveis
    const debugInfo = {
      clientId: process.env.PIPEFY_CLIENT_ID ? 'OK' : 'FALTANDO',
      clientSecret: process.env.PIPEFY_CLIENT_SECRET ? 'OK' : 'FALTANDO', 
      pipeId: process.env.PIPE_ID || 'FALTANDO',
      email: process.env.PIPEFY_EMAIL || 'FALTANDO'
    };

    // SIMULA resposta válida pro frontend (remove depois)
    res.status(200).json({
      success: true,
      pipe: "Esteira Crédito Finance Dealer",
      phases: {
        "1": { name: "Caixa Entrada", cards: [] },
        "2": { name: "Fase 3 Agendamento", cards: [] },
        "3": { name: "Checklist Docs", cards: [] }
      },
      totalPhases: 3,
      debug: debugInfo,
      message: "SIMULADO - Configure variáveis pra real"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
