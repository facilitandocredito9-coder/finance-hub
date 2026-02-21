export default async function handler(req, res) {
  try {
    const PIPEFYTOKEN = process.env.PIPEFYTOKEN;
    
    if (!PIPEFYTOKEN) {
      return res.status(401).json({ error: 'PIPEFYTOKEN não configurado' });
    }

    // SEU PIPE_ID completo (todas fases)
    const PIPE_ID = '306470040'; // ex: 12345678
    
    // Pega PIPE COMPLETO com todas fases + cards
    const pipeResponse = await fetch(`https://api.pipefy.com/v1/pipes/${PIPE_ID}`, {
      headers: { 'Authorization': `Bearer ${PIPEFYTOKEN}` }
    });

    if (!pipeResponse.ok) {
      throw new Error(`Pipefy API: ${pipeResponse.status}`);
    }

    const pipeData = await pipeResponse.json();
    
    // Pega TODOS cards do pipe (com fases)
    const cardsResponse = await fetch(`https://api.pipefy.com/v1/pipes/${PIPE_ID}/cards`, {
      headers: { 'Authorization': `Bearer ${PIPEFYTOKEN}` }
    });

    const cardsData = await cardsResponse.json();
    
    // Organiza cards por fase
    const phases = pipeData.data.phases || [];
    const cardsByPhase = {};
    
    phases.forEach(phase => {
      cardsByPhase[phase.id] = {
        name: phase.name,
        cards: cardsData.data.filter(card => card.phase_id === phase.id) || []
      };
    });

    res.status(200).json({
      pipe: pipeData.data.name,
      phases: cardsByPhase,
      totalCards: cardsData.data.length,
      totalPhases: phases.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
