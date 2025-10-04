const { google } = require('googleapis');
const { format } = require('date-fns');

// Autenticação com Service Account via GOOGLE_SA_JSON
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = process.env.SHEETS_SPREADSHEET_ID;

async function getSheetMetadata() {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });
  return response.data;
}

async function getSheetTabs() {
  try {
    const metadata = await getSheetMetadata();
    const tabs = metadata.sheets.map(sheet => sheet.properties.title);
    return tabs;
  } catch (error) {
    console.error('Erro ao buscar abas:', error);
    throw error;
  }
}

async function appendLead(leadData) {
  const tab = 'Dados_Projeto';
  const values = [[
    new Date().toISOString(),
    leadData.origem || '',
    leadData.nome || '',
    leadData.email || '',
    leadData.whatsapp || '',
    leadData.empresa || '',
    leadData.porte || '',
    leadData.desafio || '',
    leadData.classificacao || '',
    leadData.tipo_interacao || '',
    leadData.request_id || '',
    leadData.ip_hash || ''
  ]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    });
  } catch (error) {
    console.error('Erro ao inserir lead:', error);
    throw error;
  }
}

async function appendLog(message) {
  const tab = 'Atualizacao_LOG';
  const values = [[format(new Date(), 'yyyy-MM-dd HH:mm:ss'), message]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    });
  } catch (error) {
    console.error('Erro ao gravar log:', error);
  }
}

module.exports = {
  getSheetMetadata,
  getSheetTabs,
  appendLead,
  appendLog
};
