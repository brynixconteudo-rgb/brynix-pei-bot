const { google } = require("googleapis");

// 🔐 Autenticação via Service Account
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * ⏺️ Função para salvar um novo lead na aba "Leads"
 */
async function salvarLead({
  timestamp = new Date().toLocaleString("pt-BR"),
  origem = "Chat PEI",
  nome = "",
  email = "",
  whatsapp = "",
  empresa = "",
  porte = "",
  desafio = "",
  tipo_interacao = "chat",
  classificacao = "morno",
  utm_source = "",
  utm_medium = "",
  utm_campaign = "",
  request_id = "",
  ip_hash = ""
}) {
  const valores = [[
    String(timestamp),
    String(origem),
    String(nome),
    String(email),
    String(whatsapp),
    String(empresa),
    String(porte),
    String(desafio),
    String(tipo_interacao),
    String(classificacao),
    String(utm_source),
    String(utm_medium),
    String(utm_campaign),
    String(request_id),
    String(ip_hash)
  ]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
      range: "Leads!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: valores,
      },
    });

    console.log("✅ Lead salvo com sucesso na planilha.");
    return true;
  } catch (error) {
    console.error("❌ Erro ao gravar LEAD na planilha:", error.message);
    return false;
  }
}

/**
 * 📄 Função para salvar LOG de sessão finalizada na aba "Logs"
 */
async function gravarLogPEI(idSessao, sessao = {}) {
  try {
    const dataHora = new Date().toISOString();

    const historicoArray = Array.isArray(sessao.historico) ? sessao.historico : [];

    const historicoString = historicoArray
      .map((h) => {
        const quem = h.system ? "🤖" : "👤";
        const conteudo = h.mensagem || h.system || "";
        return `${quem} ${conteudo}`;
      })
      .join("\n");

    const coletadoString = JSON.stringify(sessao.coletado || {});

    const valores = [[
      String(dataHora),
      String(idSessao),
      String(historicoString),
      String(coletadoString)
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEETS_SPREADSHEET_ID,
      range: "Logs!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: valores,
      },
    });

    console.log("📝 Log gravado com sucesso para a sessão:", idSessao);
    return true;
  } catch (erro) {
    console.error("❌ Erro ao gravar LOG da sessão:", erro.message);
    return false;
  }
}

module.exports = {
  salvarLead,
  gravarLogPEI
};
