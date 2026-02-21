export const revalidate = 0; // Força dados frescos (tempo real)

export default async function handler(req, res) {
  const TOKEN = process.env.PIPEFY_TOKEN;
  const PIPE_ID = process.env.PIPE_ID;

  if (!TOKEN || !PIPE_ID) {
    return res.status(500).json({ error: "Variáveis PIPEFY_TOKEN ou PIPE_ID não configuradas no Vercel." });
  }

  const query = `
    {
      pipe(id: "${PIPE_ID}") {
        name
        phases {
          id
          name
          cards_count
          cards {
            edges {
              node {
                id
                title
                updated_at
                fields {
                  name
                  report_value
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.pipefy.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    if (result.errors) {
      return res.status(400).json({ error: result.errors[0].message });
    }

    const pipeData = result.data?.pipe;
    if (!pipeData) {
      return res.status(404).json({ error: "Pipe não encontrado. Verifique o ID." });
    }

    // Organiza os dados para o Claude ler os cards por fase
    const formattedPhases = pipeData.phases.map(phase => ({
      id: phase.id,
      name: phase.name,
      count: phase.cards_count,
      cards: phase.cards.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title,
        updated: edge.node.updated_at,
        details: edge.node.fields.map(f => `${f.name}: ${f.report_value}`).join(' | ')
      }))
    }));

    res.status(200).json({
      success: true,
      pipeName: pipeData.name,
      lastUpdate: new Date().toLocaleTimeString('pt-BR'),
      phases: formattedPhases
    });

  } catch (error) {
    res.status(500).json({ error: "Erro na conexão: " + error.message });
  }
}
