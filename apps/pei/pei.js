const express = require('express');
const router = express.Router();
const { appendLead } = require('../../sheets');
const { gerarResposta } = require('../../ai');

router.post('/ia', async (req, res) => {
  try {
    const history = req.body.history || [];
    const lastInput = req.body.lastInput || '';

    const conversa = history.map(msg => msg.content).join(' ') + ' ' + lastInput;

    const respostaIA = await gerarResposta(conversa);

    // Heurística para salvar: nome, contato, desafio
    const temNome = /meu nome é|eu sou o|sou /.test(conversa.toLowerCase());
    const temContato = /@|whats|telefone|celular/.test(conversa.toLowerCase());
    const temDesafio = /preciso|quero|estou com|buscando|desafio/.test(conversa.toLowerCase());

    let salvou = false;

    if (temNome && temContato && temDesafio) {
      const data = {
        nome: 'Visitante do site',
        email: '',
        whatsapp: '',
        empresa: 'BRYNIX',
        porte: 'Não informado',
        desafio: lastInput,
        classificacao: 'morno',
        origem: 'site',
        tipo_interacao: 'conversa livre',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        request_id: '',
        ip_hash: ''
      };

      await appendLead(data);
      salvou = true;
    }

    return res.json({ reply: respostaIA, saved: salvou });

  } catch (error) {
    console.error('Erro na IA:', error.message);
    return res.status(500).json({ error: 'Erro ao processar IA' });
  }
});

module.exports = router;
