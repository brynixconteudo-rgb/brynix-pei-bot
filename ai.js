// ai.js
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function gerarResposta(mensagemUsuario) {
  try {
    const resposta = await openai.createChatCompletion({
      model: "gpt-4", // Ou "gpt-3.5-turbo" se quiser mais leve/rápido
      messages: [
        {
          role: "system",
          content: `Você é o PEI - Porta de Entrada Inteligente da BRYNIX. Fale de forma humana, gentil e clara, ajude os visitantes do site com dúvidas sobre uso de IA nos negócios, automações, transformação digital, e registre seus dados para o time. Não seja genérico, nem vago.`
        },
        {
          role: "user",
          content: mensagemUsuario
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return resposta.data.choices[0].message.content.trim();
  } catch (erro) {
    console.error("Erro ao gerar resposta:", erro.message);
    return "Desculpe, algo deu errado ao gerar a resposta. Por favor, tente novamente.";
  }
}

module.exports = { gerarResposta };
