// Envio de e-mail. Usa a API da Resend (https://resend.com) se RESEND_API_KEY estiver definida;
// sem ela, só escreve o e-mail no terminal (modo de desenvolvimento).

export const emailConfigured = () => !!process.env.RESEND_API_KEY;

export async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured()) {
    console.log(`\n✉️  [e-mail não enviado: configure RESEND_API_KEY]\n   Para: ${to}\n   Assunto: ${subject}\n   ${text.replace(/\n/g, '\n   ')}\n`);
    return { sent: false };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Projetos com Madeira <acesso@resend.dev>', to, subject, html, text }),
    });
    if (!res.ok) console.error('[email] Resend respondeu', res.status, (await res.text()).slice(0, 300));
    return { sent: res.ok };
  } catch (e) {
    console.error('[email] falha ao enviar:', e.message);
    return { sent: false };
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function accessEmail({ appName, name, link, kind, items = [], supportEmail }) {
  const hi = name ? `Olá, ${name}!` : 'Olá!';
  const intro = kind === 'login'
    ? 'Toque no botão abaixo para entrar na sua área de membros. O link vale por 1 hora e só pode ser usado uma vez.'
    : kind === 'welcome'
      ? 'Seu acesso está liberado. Toque no botão abaixo para entrar e começar pelos seus projetos.'
      : `Acabamos de liberar um novo conteúdo na sua área de membros${items.length ? ': ' + items.join(', ') : ''}.`;
  const subject = kind === 'login' ? `Seu link de acesso • ${appName}` : kind === 'welcome' ? `Seu acesso chegou • ${appName}` : `Novo conteúdo liberado • ${appName}`;
  const text = `${hi}\n\n${intro}\n\n${link}\n\nSe você não pediu este e-mail, pode ignorar.${supportEmail ? `\nDúvidas: ${supportEmail}` : ''}`;
  const html = `<!doctype html><html><body style="margin:0;background:#F5F0E7;font-family:Arial,Helvetica,sans-serif;color:#171512">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:28px 24px;border:1px solid #E8DDD0">
<tr><td style="font-size:13px;font-weight:bold;color:#9E4E0D;letter-spacing:.5px;text-transform:uppercase">${esc(appName)}</td></tr>
<tr><td style="padding-top:14px;font-size:20px;font-weight:bold">${esc(hi)}</td></tr>
<tr><td style="padding-top:10px;font-size:15px;line-height:1.55;color:#3F2A1E">${esc(intro)}</td></tr>
<tr><td style="padding:24px 0 8px"><a href="${esc(link)}" style="display:block;text-align:center;background:#C86A1B;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:15px 18px;border-radius:12px">Entrar na área de membros</a></td></tr>
<tr><td style="padding-top:14px;font-size:12px;line-height:1.5;color:#7a6a5c">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all">${esc(link)}</span></td></tr>
${supportEmail ? `<tr><td style="padding-top:14px;font-size:12px;color:#7a6a5c">Dúvidas: ${esc(supportEmail)}</td></tr>` : ''}
</table></td></tr></table></body></html>`;
  return { subject, html, text };
}
