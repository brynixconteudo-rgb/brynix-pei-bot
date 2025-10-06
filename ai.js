const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🎯 Prompt base
const promptBase = `
Você é o PEI (Porta de Entrada Inteligente), um assistente de recepção da BRYNIX.

🧠 Sua missão é recepcionar visitantes do site com leveza, inteligência e simpatia — conduzindo uma conversa fluida, humana e profissional.

🎯 Seu objetivo principal é descobrir de forma natural e progressiva (nunca tudo de uma vez):
- Nome da pessoa
- Nome da empresa
- Forma de contato (WhatsApp ou e-mail)
- O desafio ou objetivo principal da pessoa
- Porte da empresa (micro, pequena, média, grande)
- Se está apenas conhecendo ou realmente interessado agora

⚠️ Importante:
- Nunca reinicie a conversa.
- Nunca repita perguntas já respondidas.
- Sempre considere tudo que foi dito antes.
- Seja natural, traga variações nas frases e conduza como quem está ouvindo de verdade.

✨ Estilo de fala:
- Profissional, sem ser fria
- Acolhedora, sem parecer robótica
- Curiosa, sem ser invasiva
- Fluida, como um humano real
`;

// 📌 Construtor dinâmico do mapa da jornada
function construirMapaJornada(coletado) {
  const pendentes = [];

  if (!coletado.nome) pendentes.push("nome da pessoa");
  if (!coletado.empresa) pendentes.push("nome da empresa");
  if (!coletado.contato) pendentes.push("forma de contato");
  if (!coletado.desafio) pendentes.push("desafio principal");
  if (!coletado.porte) pendentes.push("porte da empresa");
  if (!coletado.classificacao) pendentes.push("nível de interesse");

  if (pendentes.length === 0) {
    return "✅ Todos os dados foram coletados. Agora, finalize a conversa com simpatia e reforce que a BRYNIX entrará em contato.";
  }

  return `Ainda faltam os seguintes dados para entender melhor o visitante:\n- ${pendentes.join("\n- ")}\nConduza a conversa de forma natural para obter essas informações.`;
}

// 🧠 Formatar histórico no padrão OpenAI
function construirMensagens(historico, coletado) {
  const contextoDinamico = construirMapaJornada(coletado);
  const mensagens = [
    { role: "system", content: `${promptBase}\n\n${contextoDinamico}` }
  ];

  for (const msg of historico) {
    mensagens.push({
      role: msg.de === "usuario" ? "user" : "assistant",
      content: msg.texto,
    });
  }

  return mensagens;
}

// 🔍 Regex inteligente
function extrairDados(texto) {
  const coleta = {};
  const regexes = {
    nome: /(?:meu nome é|me chamo|sou o|sou a|sou)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)?)/i,
    empresa: /(?:minha empresa|empresa (?:chama-se|se chama|é|nome é)|sou (?:da|do|de)\s+(?:loja|empresa)?\s*|trabalho (?:na|no|em)\s+)([A-Z0-9&.\- ]{3,})/i,
    contato: /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})|([a-z0-9_.+-]+@[a-z0-9-]+\.[a-z.]+)/i,
    porte: /\b(micro|pequena|média|grande)\b/i,
    desafio: /(?:desafio|problema|dificuldade|questão|objetivo|estou buscando|quero|preciso|gostaria de)[^.!?\n]{10,}/i,
    classificacao: /\b(quente|morno|frio)\b/i,
  };

  for (const campo in regexes) {
    const match = texto.match(regexes[campo]);
    if (match) {
      coleta[campo] = match[1] || match[0];
    }
  }

  return coleta;
}

// 🤖 Resposta principal
async function gerarResposta(mensagem, sessao = {}) {
  try {
    if (typeof sessao !== "object" || sessao === null) sessao = {};
    if (!Array.isArray(sessao.historico)) sessao.historico = [];
    if (typeof sessao.coletado !== "object" || sessao.coletado === null) sessao.coletado = {};

    sessao.historico.push({ de: "usuario", texto: mensagem });

    const mensagens = construirMensagens(sessao.historico, sessao.coletado);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: mensagens,
      temperature: 0.7,
      max_tokens: 500,
    });

    const resposta = completion.choices[0].message.content.trim();

    sessao.historico.push({ de: "bot", texto: resposta });

    // Atualizar coleta com logs ricos
    const historicoCompleto = sessao.historico.map(h => h.texto).join("\n");

    console.log("📥 Histórico completo antes da coleta:");
    console.log(historicoCompleto);

    console.log("📦 Coleta atual antes da regex:");
    console.log(sessao.coletado);

    const dadosExtraidos = extrairDados(historicoCompleto);

    console.log("📤 Novos dados extraídos:");
    console.log(dadosExtraidos);

    for (const chave in dadosExtraidos) {
      if (!sessao.coletado[chave]) {
        sessao.coletado[chave] = dadosExtraidos[chave];
        console.log(`✅ Novo dado coletado: ${chave} = ${dadosExtraidos[chave]}`);
      } else {
        console.log(`ℹ️ Já havia ${chave}: ${sessao.coletado[chave]}`);
      }
    }

    console.log("💡 Dados coletados até agora:", sessao.coletado);

    const completo =
      sessao.coletado.nome &&
      sessao.coletado.empresa &&
      sessao.coletado.contato &&
      sessao.coletado.desafio;

    if (completo && !sessao.coletado.encerrado) {
      console.log("🚪 Finalizando conversa — todos dados coletados:");
      console.log(sessao.coletado);

      sessao.coletado.encerrado = true;

      const fechamento = `Perfeito! 😊 Com todas essas informações, já posso passar seu contato para nosso time.

A equipe da BRYNIX vai falar com você em breve para entender melhor o seu cenário e te mostrar como nossas soluções de IA podem gerar valor real para o seu negócio.

Obrigado por compartilhar tudo com a gente. Foi ótimo conversar com você! 👋`;

      return {
        resposta: fechamento,
        coleta: sessao.coletado
      };
    }

    return {
      resposta,
      coleta: sessao.coletado,
    };
  } catch (erro) {
    console.error("❌ Erro em gerarResposta:", erro.message);
    return {
      resposta: "Desculpe, houve um erro ao gerar a resposta. Pode tentar novamente?",
      coleta: sessao.coletado || {},
    };
  }
}

module.exports = { gerarResposta };
