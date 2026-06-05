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
const DEFAULT_UPLOAD_FOLDER_ID = '1DzMwLna1JTz3nlZj1iVhMwPEAl-op-QC';

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

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');

    if (body.action === 'uploadEvidence') {
      return uploadEvidence(body);
    }

    return jsonResponse({ ok: false, error: 'Acao invalida.' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Erro no Apps Script.' });
  }
}

function uploadEvidence(body) {
  const props = PropertiesService.getScriptProperties();
  const uploadToken = props.getProperty('UPLOAD_TOKEN');
  const folderId = props.getProperty('UPLOAD_FOLDER_ID') || DEFAULT_UPLOAD_FOLDER_ID;

  if (!uploadToken) {
    throw new Error('UPLOAD_TOKEN nao configurado nas propriedades do Apps Script.');
  }

  if (body.token !== uploadToken) {
    throw new Error('Token de upload invalido.');
  }

  if (!body.dataBase64 || !body.fileName) {
    throw new Error('Arquivo de evidencia invalido.');
  }

  const bytes = Utilities.base64Decode(body.dataBase64);
  const mimeType = body.mimeType || 'application/octet-stream';
  const blob = Utilities.newBlob(bytes, mimeType, sanitizeFileName(body.fileName));
  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonResponse({
    ok: true,
    id: file.getId(),
    url: file.getUrl(),
  });
}

function sanitizeFileName(fileName) {
  const clean = String(fileName || '')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120);

  return clean || `evidencia-${Date.now()}`;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
