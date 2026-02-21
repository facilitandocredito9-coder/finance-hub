export default async function handler(req, res) {
  try {
    // OAuth2 Client Credentials Flow
    const tokenResponse = await fetch('https://api.pipefy.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.PIPEFY_CLIENT_ID,
        client_secret: process.env.PIPEFY_CLIENT_SECRET,
        scope: 'pipes:read cards:read'
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Pega pipe completo com todas fases
    const pipeResponse = await fetch(`https://api.pipefy.com/v1/pipes/${process.env.PIPE_ID}`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const pipeData = await pipeResponse.json();
    const phases = pipeData.data.phases || [];

    // Organiza cards por fase
    const cardsByPhase = {};
    phases.forEach(phase => {
      cardsByPhase[phase.id] = { name: phase.name, cards: [] };
    });

    res.status(200).json({
      pipe: pipeData.data.name,
      phases: cardsByPhase,
      totalPhases: phases.length,
      tokenStatus: 'OAuth2 OK'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
