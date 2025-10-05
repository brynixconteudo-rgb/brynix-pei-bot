const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function gerarResposta(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erro ao gerar resposta:", error?.response?.data || error.message);
    return "Desculpe, houve um erro ao processar sua solicitação.";
  }
}

module.exports = { gerarResposta };
