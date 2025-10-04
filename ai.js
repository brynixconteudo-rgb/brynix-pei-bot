const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function gerarResposta(pergunta) {
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: pergunta }],
  });

  return completion.data.choices[0].message.content;
}

module.exports = {
  gerarResposta
};
