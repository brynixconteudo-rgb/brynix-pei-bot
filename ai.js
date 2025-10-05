const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function gerarResposta(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4", // Ou "gpt-3.5-turbo" se quiser economizar
      messages: [{ role: "user", content: prompt }],
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erro ao gerar resposta:", error.response?.data || error.message);
    return "Desculpe, houve um erro ao processar sua solicitação.";
  }
}

module.exports = { gerarResposta };
