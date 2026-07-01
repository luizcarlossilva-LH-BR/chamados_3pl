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

/**
 * Envia o e-mail de "acesso liberado" quando uma solicitacao de cadastro
 * e aprovada no Next.js. Protegido por segredo compartilhado (Propriedades
 * do script > EMAIL_SECRET) pois a implantacao precisa ser publica
 * ("Qualquer pessoa") para o backend conseguir chamar sem OAuth.
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var expectedSecret = PropertiesService.getScriptProperties().getProperty('EMAIL_SECRET');

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    var to = payload.to;
    var nome = payload.nome;
    var email = payload.email;
    var senha = payload.senha;
    var appUrl = payload.appUrl || '';

    if (!to || !nome || !email || !senha) {
      return jsonResponse({ ok: false, error: 'missing_fields' });
    }

    var subject = 'Acesso liberado - 3PL Chamados';
    var body = [
      'Ola, ' + nome + '.',
      '',
      'Seu cadastro no 3PL Chamados foi aprovado. Seguem os dados de acesso:',
      '',
      'Login: ' + email,
      'Senha temporaria: ' + senha,
      'Acesse em: ' + appUrl,
      '',
      'Recomendamos trocar a senha apos o primeiro acesso.',
    ].join('\n');
    var htmlBody = [
      '<p>Ola, ' + nome + '.</p>',
      '<p>Seu cadastro no <strong>3PL Chamados</strong> foi aprovado. Seguem os dados de acesso:</p>',
      '<p>',
      'Login: <strong>' + email + '</strong><br>',
      'Senha temporaria: <strong>' + senha + '</strong><br>',
      'Acesse em: <a href="' + appUrl + '">' + appUrl + '</a>',
      '</p>',
      '<p>Recomendamos trocar a senha apos o primeiro acesso.</p>',
    ].join('');

    MailApp.sendEmail({ to: to, subject: subject, body: body, htmlBody: htmlBody });
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
