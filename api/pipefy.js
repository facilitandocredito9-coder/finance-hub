export const revalidate = 0; // Garante tempo real

export default async function handler(req, res) {
  const { PIPEFY_CLIENT_ID, PIPEFY_CLIENT_SECRET, PIPE_ID } = process.env;

  try {
    // 1. PASSO: Trocar Client ID/Secret por um Token de acesso
    const authResponse = await fetch('https://app.pipefy.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: PIPEFY_CLIENT_ID,
        client_secret: PIPEFY_CLIENT_SECRET
      })
    });

    const authData = await authResponse.json();
    const token = authData.access_token;

    if (!token) throw new Error("Falha na autenticação da Conta de Serviço");

    // 2. PASSO: Buscar os cards com o token gerado
    const query = `
      {
        pipe(id: "${PIPE_ID}") {
          name
          phases {
            id
            name
            cards {
              edges {
                node {
                  id
                  title
                  updated_at
                }
              }
            }
          }
        }
      }
    `;

    const pipeResponse = await fetch('https://api.pipefy.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query }),
    });

    const result = await pipeResponse.json();
    const pipeData = result.data?.pipe;

    if (!pipeData) {
      return res.status(404).json({ error: "Pipe não encontrado ou sem acesso." });
    }

    // 3. PASSO: Formatar para o Claude ler fácil
    const formattedPhases = {};
    pipeData.phases.forEach(phase => {
      formattedPhases[phase.id] = {
        name: phase.name,
        cards: phase.cards.edges.map(edge => edge.node)
      };
    });

    res.status(200).json({
      success: true,
      pipeName: pipeData.name,
      phases: formattedPhases
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
