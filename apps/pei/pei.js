const express = require('express');
const router = express.Router();
const { appendLeadToSheet } = require('../../sheets');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { HumanMessage, AIMessage } = require('langchain/schema');

const chat = new ChatOpenAI({
  temperature: 0.7,
  modelName: 'gpt-4',
});

router.post('/lead', async (req, res) => {
  try {
    const history = req.body.history || [];
    const lastInput = req.body.lastInput || '';

    const response = await chat.call([
      ...history.map(msg => msg.role === 'user'
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
      ),
      new HumanMessage(lastInput)
    ]);

    const botReply = response.content;

    // Detecta se temos dados suficientes para salvar (simulação simples por enquanto)
    const texto = history.map(h => h.content).join(' ') + ' ' + lastInput;
    const temNome = /meu nome é|eu sou o|sou /.test(texto.toLowerCase());
    const temContato = /@|whats|telefone|celular/.test(texto.toLowerCase());
    const temDesafio = /preciso|quero|estou com|buscando|desafio/.test(texto.toLowerCase());

    let salvou = false;

    if (temNome && temContato && temDesafio) {
      const timestamp = new Date().toISOString();
      const dados = [
        timestamp,
        'Visitante do site',
        'BRYNIX PEI',
        'Contato em aberto',
        'Desafio não estruturado',
        'Não informado',
        'Morno',
        'site',
        'Conversa via PEI',
      ];
      await appendLeadToSheet(dados);
      salvou = true;
    }

    return res.json({
      reply: botReply,
      saved: salvou
    });

  } catch (error) {
    console.error('Erro na conversa:', error);
    return res.status(500).json({ error: 'Erro ao gerar resposta do PEI.' });
  }
});

module.exports = router;
