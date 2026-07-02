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
    email_queue: [
      'id','nome','email','senha','appUrl','status','erro','criadoEm','enviadoEm'
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
 * Processa a fila de e-mails de "acesso liberado".
 * O Next.js grava uma linha em email_queue (status "pendente") ao aprovar
 * uma solicitacao de cadastro; esta funcao deve rodar num gatilho de tempo
 * (Triggers > Adicionar gatilho > processEmailQueue > baseado em tempo,
 * a cada 1-5 minutos), pois o Workspace da Shopee nao permite implantar
 * o Web App deste script como publico ("Qualquer pessoa").
 */
function processEmailQueue() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('email_queue');
  if (!sheet) return;

  var rows = sheet.getDataRange().getValues();
  // Colunas: A id, B nome, C email, D senha, E appUrl, F status, G erro, H criadoEm, I enviadoEm
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var status = row[5];
    if (status !== 'pendente') continue;

    var nome = row[1];
    var email = row[2];
    var senha = row[3];
    var appUrl = row[4];
    var rowNumber = i + 1;

    try {
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

      MailApp.sendEmail({ to: email, subject: subject, body: body, htmlBody: htmlBody });

      sheet.getRange(rowNumber, 6).setValue('enviado');
      sheet.getRange(rowNumber, 9).setValue(new Date().toISOString());
    } catch (err) {
      sheet.getRange(rowNumber, 6).setValue('erro');
      sheet.getRange(rowNumber, 7).setValue(String(err));
    }
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
