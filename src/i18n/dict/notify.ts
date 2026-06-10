// Notification message texts (delivered to OS/Telegram/Slack/Discord).
// `en` is the source of truth; every other language must mirror its keys.

const en = {
  'test.title': 'Nexus test notification',
  'test.body': 'If you can read this, the channel works.',
  'incident.openedTitle': '⚠ {project}: incident opened',
  'incident.openedBody': 'Status: {severity}',
  'incident.openedBodyError': 'Status: {severity}. {error}',
  'incident.closedTitle': '✓ {project}: recovered',
  'incident.closedBody': 'Incident resolved after {minutes} min',
  'ssl.title': '{project}: SSL certificate expiring',
  'ssl.body': 'Certificate for {host} expires in {days} days',
};

const uk: Record<keyof typeof en, string> = {
  'test.title': 'Тестове сповіщення Nexus',
  'test.body': 'Якщо ви це читаєте — канал працює.',
  'incident.openedTitle': '⚠ {project}: відкрито інцидент',
  'incident.openedBody': 'Статус: {severity}',
  'incident.openedBodyError': 'Статус: {severity}. {error}',
  'incident.closedTitle': '✓ {project}: відновлено',
  'incident.closedBody': 'Інцидент вирішено за {minutes} хв',
  'ssl.title': '{project}: спливає SSL-сертифікат',
  'ssl.body': 'Сертифікат для {host} спливає через {days} дн.',
};

const es: Record<keyof typeof en, string> = {
  'test.title': 'Notificación de prueba de Nexus',
  'test.body': 'Si puedes leer esto, el canal funciona.',
  'incident.openedTitle': '⚠ {project}: incidente abierto',
  'incident.openedBody': 'Estado: {severity}',
  'incident.openedBodyError': 'Estado: {severity}. {error}',
  'incident.closedTitle': '✓ {project}: recuperado',
  'incident.closedBody': 'Incidente resuelto en {minutes} min',
  'ssl.title': '{project}: el certificado SSL vence pronto',
  'ssl.body': 'El certificado de {host} vence en {days} días',
};

const de: Record<keyof typeof en, string> = {
  'test.title': 'Nexus-Testbenachrichtigung',
  'test.body': 'Wenn Sie das lesen können, funktioniert der Kanal.',
  'incident.openedTitle': '⚠ {project}: Vorfall eröffnet',
  'incident.openedBody': 'Status: {severity}',
  'incident.openedBodyError': 'Status: {severity}. {error}',
  'incident.closedTitle': '✓ {project}: wiederhergestellt',
  'incident.closedBody': 'Vorfall nach {minutes} Min. behoben',
  'ssl.title': '{project}: SSL-Zertifikat läuft ab',
  'ssl.body': 'Das Zertifikat für {host} läuft in {days} Tagen ab',
};

const fr: Record<keyof typeof en, string> = {
  'test.title': 'Notification de test Nexus',
  'test.body': 'Si vous lisez ceci, le canal fonctionne.',
  'incident.openedTitle': '⚠ {project} : incident ouvert',
  'incident.openedBody': 'Statut : {severity}',
  'incident.openedBodyError': 'Statut : {severity}. {error}',
  'incident.closedTitle': '✓ {project} : rétabli',
  'incident.closedBody': 'Incident résolu en {minutes} min',
  'ssl.title': '{project} : le certificat SSL expire bientôt',
  'ssl.body': 'Le certificat de {host} expire dans {days} jours',
};

const pt: Record<keyof typeof en, string> = {
  'test.title': 'Notificação de teste do Nexus',
  'test.body': 'Se você consegue ler isto, o canal funciona.',
  'incident.openedTitle': '⚠ {project}: incidente aberto',
  'incident.openedBody': 'Status: {severity}',
  'incident.openedBodyError': 'Status: {severity}. {error}',
  'incident.closedTitle': '✓ {project}: recuperado',
  'incident.closedBody': 'Incidente resolvido em {minutes} min',
  'ssl.title': '{project}: certificado SSL expirando',
  'ssl.body': 'O certificado de {host} expira em {days} dias',
};

const zh: Record<keyof typeof en, string> = {
  'test.title': 'Nexus 测试通知',
  'test.body': '如果您能看到这条消息，说明该渠道工作正常。',
  'incident.openedTitle': '⚠ {project}：发生事件',
  'incident.openedBody': '状态：{severity}',
  'incident.openedBodyError': '状态：{severity}。{error}',
  'incident.closedTitle': '✓ {project}：已恢复',
  'incident.closedBody': '事件已于 {minutes} 分钟后解决',
  'ssl.title': '{project}：SSL 证书即将到期',
  'ssl.body': '{host} 的证书将在 {days} 天后到期',
};

const ar: Record<keyof typeof en, string> = {
  'test.title': 'إشعار تجريبي من Nexus',
  'test.body': 'إذا كنت تقرأ هذا، فالقناة تعمل.',
  'incident.openedTitle': '⚠ {project}: تم فتح حادث',
  'incident.openedBody': 'الحالة: {severity}',
  'incident.openedBodyError': 'الحالة: {severity}. {error}',
  'incident.closedTitle': '✓ {project}: تمت الاستعادة',
  'incident.closedBody': 'تم حل الحادث بعد {minutes} دقيقة',
  'ssl.title': '{project}: شهادة SSL على وشك الانتهاء',
  'ssl.body': 'شهادة {host} تنتهي خلال {days} يومًا',
};

export const notify = { en, uk, es, de, fr, pt, zh, ar };
