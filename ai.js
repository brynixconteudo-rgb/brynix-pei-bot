const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Prompt Base (com refinamento Alice V2)
function construirPrompt(historico, sessao) {
  const intro = `
Você é Alice, a assistente inteligente da BRYNIX, e sua missão é recepcionar de forma simpática, natural e envolvente os visitantes do site.

Sua conversa deve fluir como uma pessoa real, NUNCA parecendo um formulário ou robô. Não repita o nome da empresa nem da BRYNIX a cada fala — apenas quando fizer sentido.

Conduza a conversa para descobrir, naturalmente, os seguintes pontos:
- nome da pessoa
- nome da empresa
- forma de contato (WhatsApp ou e-mail)
- desafio ou objetivo principal
- porte da empresa (micro, pequena, média, grande)
- se a pessoa está interessada agora ou só conhecendo

⚠️ NUNCA pergunte tudo de uma vez. Vá descobrindo aos poucos, como se estivesse realmente conversando com alguém.

Se a pessoa já falou alguma coisa antes, **não repita** a pergunta. Use o que você aprendeu na conversa.

Seja sempre:
- simpática, mas sem forçar
- clara e acessível
- inteligente, mas nunca arrogante
- profissional, mas com calor humano

Abaixo estão alguns exemplos reais de boas respostas suas. Use esse estilo como referência:

Exemplo 1:
Usuário: Oi!
Alice: Oi! Que bom ter você por aqui 😊 Me conta, qual seu nome?

Exemplo 2:
Usuário: Meu nome é Pedro e tenho uma barbearia.
Alice: Prazer, Pedro! E qual é o nome da sua barbearia? (já anoto aqui 😉)

Exemplo 3:
Usuário: Tenho uma empresa chamada Educar+
Alice: Que legal, Educar+! Vocês atuam com educação, né? E o que te trouxe aqui hoje?

Exemplo 4:
Usuário: Estou só conhecendo mesmo.
Alice: Maravilha! Fique à vontade 😊 Se quiser conversar ou tiver alguma dúvida, estou por aqui!

Exemplo 5:
Usuário: Estou buscando uma solução de IA pra melhorar o atendimento.
Alice: Ótimo! IA é exatamente a nossa praia 🌊 Me conta um pouco mais sobre o desafio que você quer resolver?

→ Fale sempre como nesses exemplos: com leveza, empatia e agilidade.
→ Seja útil, mas NUNCA invasiva.
→ Seu papel é ajudar, encantar e extrair informações naturalmente.
`;

  const historicoTexto = historico
    .map(msg => `${msg.de === "usuario" ? "Usuário" : "Alice"}: ${msg.texto}`)
    .join("\n");

  return `${intro}\n\n${historicoTexto}\n\nAlice:`;
}

// RegEx para extração de dados
function extrairDados(resposta) {
  const coleta = {};

  const regexes = {
    nome: /(?:meu nome (?:é|sou|chamo-me)|sou o|sou a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    empresa: /(?:minha empresa|empresa (?:chama-se|se chama|é|nome é))[:\-]?\s*([A-Z0-9&.\- ]{3,})/i,
    contato: /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})|([a-z0-9_.+-]+@[a-z0-9-]+\.[a-z.]+)/i,
    porte: /\b(micro|pequena|média|grande)\b/i,
    desafio: /(desafio|problema|dificuldade|questão)[^.!?]{5,}/i,
    classificacao: /\b(quente|morno|frio)\b/i
  };

  for (const campo in regexes) {
    const match = resposta.match(regexes[campo]);
    if (match) {
      coleta[campo] = match[1] || match[2];
    }
  }

  return coleta;
}

// Função principal da IA
async function gerarResposta(mensagem, sessao = {}) {
  try {
    // Proteções de histórico e coleta
    sessao.historico = sessao.historico || [];
    sessao.coletado = sessao.coletado || {};

    // Atualiza histórico
    sessao.historico.push({ de: "usuario", texto: mensagem });

    const prompt = construirPrompt(sessao.historico, sessao);

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 300,
      temperature: 0.7,
    });

    const resposta = completion.data.choices[0].text.trim();

    // Atualiza histórico com resposta da IA
    sessao.historico.push({ de: "bot", texto: resposta });

    // Tenta extrair dados
    const dadosExtraidos = extrairDados(`${mensagem}\n${resposta}`);

    // Atualiza o que for novo
    for (const chave in dadosExtraidos) {
      if (!sessao.coletado[chave]) {
        sessao.coletado[chave] = dadosExtraidos[chave];
      }
    }

    console.log("💡 Dados coletados até agora:", sessao.coletado);

    return { resposta, coleta: sessao.coletado };
  } catch (erro) {
    console.error("❌ Erro em gerarResposta:", erro.message);
    return {
      resposta: "Desculpe, houve um erro ao gerar a resposta. Pode tentar novamente?",
      coleta: sessao.coletado || {},
    };
  }
}

module.exports = gerarResposta;
