const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const gerarResposta = require('./ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rota raiz
app.get('/', (req, res) => {
  res.send('BRYNIX PEI BOT online ✨');
});

// Rota de teste de lead (ex: POST via formulário)
app.post('/pei/test', async (req, res) => {
  const { nome, contato, empresa, porte, desafio, classificacao, tipoInteracao, origem } = req.body;

  if (!nome || !contato) {
    return res.status(400).json({ erro: 'Campos obrigatórios ausentes: nome ou contato' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;

    const values = [[
      new Date().toLocaleString('pt-BR'),
      nome,
      contato,
      empresa || '',
      porte || '',
      desafio || '',
      classificacao || '',
      tipoInteracao || '',
      origem || '',
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Leads!A2',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    res.status(200).json({ mensagem: 'Lead registrado com sucesso!' });
  } catch (erro) {
    console.error('Erro ao registrar lead:', erro);
    res.status(500).json({ erro: 'Erro ao salvar lead' });
  }
});

// Rota de conversa com IA
app.post('/pei/ia', async (req, res) => {
  const { mensagem } = req.body;

  if (!mensagem) {
    return res.status(400).json({ erro: 'Mensagem não fornecida' });
  }

  try {
    const resposta = await gerarResposta(mensagem);
    res.status(200).json({ resposta });
  } catch (erro) {
    console.error('Erro IA:', erro);
    res.status(500).json({ erro: 'Erro ao gerar resposta da IA' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
