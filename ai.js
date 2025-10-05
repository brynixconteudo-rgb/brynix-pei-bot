// ai.js
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function gerarResposta(pergunta) {
  try {
    const promptBase = `
Você é o assistente inteligente da BRYNIX, uma empresa de transformação digital com IA. 
Sua missão é conversar com naturalidade, responder de forma clara e profissional, mantendo o tom humano e inspirador da marca.

Seja acolhedor e mostre como a BRYNIX pode ajudar empresas a se transformarem com IA.
Evite parecer técnico demais. Foco em impacto nos negócios.

Pergunta do visitante: "${pergunta}"
`;

    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: promptBase }],
      temperature: 0.7,
    });

    const respostaGerada = response.data.choices[0].message.content.trim();
    return respostaGerada;
  } catch (err) {
    console.error('Erro na geração de resposta IA:', err);
    return 'Desculpe, houve um problema ao gerar a resposta.';
  }
}

module.exports = { gerarResposta };
