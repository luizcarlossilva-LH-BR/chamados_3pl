/**
 * Google Apps Script
 *
 * Use este script apenas para preparar a planilha:
 * - criar as abas
 * - criar o usuario admin inicial
 *
 * O backend Next.js le e escreve diretamente via Google Sheets API.
 */

const SHEET_ID = 'SEU_SPREADSHEET_ID_AQUI'; // substitua pelo ID real da planilha

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
    }

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#EE4D2D')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  });

  const usersSheet = ss.getSheetByName('users');
  const rows = usersSheet.getDataRange().getValues();
  const hasAdmin = rows.some(row => String(row[2]).toLowerCase() === 'admin@shopee.com');

  if (!hasAdmin) {
    usersSheet.appendRow([
      'U001',
      'Admin Shopee',
      'admin@shopee.com',
      '$2a$10$Z/RaVRWP8B4w3Q7gFOgeoevGXZqxehexjZoASfLhndM6yilrJNRr2', // senha: admin123
      'admin',
      'Shopee',
      'BSC Team',
      'true',
      new Date().toISOString()
    ]);
    Logger.log('Admin user created.');
  }

  Logger.log('Sheets configurados com sucesso.');
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Apps Script ativo.' });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
