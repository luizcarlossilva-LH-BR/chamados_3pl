/**
 * Google Apps Script — deploy como Web App
 * URL: Executar como "Eu" · Acesso "Qualquer pessoa"
 *
 * Este script cria as abas necessárias e serve como
 * endpoint alternativo de escrita (fallback ao Sheets API).
 *
 * Cole este código em: script.google.com → Novo projeto
 * → Implantar → Web app → Executar como: Eu → Acesso: Qualquer
 *
 * Copie a URL gerada para APPS_SCRIPT_URL no .env
 */

const SHEET_ID = 'SEU_SPREADSHEET_ID_AQUI'; // substitua

// ── Estrutura das abas ──────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  const tabs = {
    tickets: [
      'id','empresa','setor','tipo','categoria','kpis','impacto','status',
      'descricao','evidencia','periodo','rotas','drivers','email','nome',
      'responsavel','sla','timeline','criadoEm','atualizadoEm'
    ],
    users: [
      'id','nome','email','senha','role','empresa','setor','ativo','criadoEm'
    ],
    access_requests: [
      'id','nome','email','empresa','setor','justificativa','status','criadoEm'
    ],
  };

  Object.entries(tabs).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#EE4D2D')
        .setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  });

  // Seed admin user (senha: admin123)
  const usersSheet = ss.getSheetByName('users');
  if (usersSheet.getLastRow() < 2) {
    usersSheet.appendRow([
      'U001',
      'Admin Shopee',
      'admin@shopee.com',
      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // senha: admin123 (bcrypt)
      'admin',
      'Shopee',
      'BSC Team',
      'true',
      new Date().toISOString()
    ]);
    Logger.log('Admin user created.');
  }

  Logger.log('Sheets configurados com sucesso!');
}

// ── Web App entrypoint ──────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, sheet: sheetName, values, rowIndex } = data;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return jsonResponse({ ok: false, error: `Aba "${sheetName}" não encontrada.` });
    }

    if (action === 'append') {
      sheet.appendRow(values);
      return jsonResponse({ ok: true });
    }

    if (action === 'update') {
      const range = sheet.getRange(rowIndex, 1, 1, values.length);
      range.setValues([values]);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: 'Ação desconhecida.' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doGet(e) {
  // Health check
  return jsonResponse({ ok: true, message: 'Apps Script ativo.' });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
