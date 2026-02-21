export default async function handler(req, res) {
  try {
    const PIPEFYTOKEN = process.env.PIPEFYTOKEN; // Token Conta Serviço
    
    const PIPE_ID = '306470040'; // Todas fases
    
    // GraphQL moderno (melhor que REST)
    const query = `
      query {
        pipe(id: ${PIPE_ID}) {
          id
          name
          phases {
            id
            name
            cards {
              id
              title
              phase_id
              custom_fields
              created_at
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.pipefy.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PIPEFYTOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    res.status(200).json({
      pipe: data.data.pipe.name,
      phases: data.data.pipe.phases,
      totalCards: data.data.pipe.phases.reduce((sum, phase) => sum + phase.cards.length, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
