// Gera um PDF provisório (3 páginas) quando o arquivo real ainda não está na pasta content/.
// Assim o app funciona de ponta a ponta antes de você subir os PDFs de verdade.

const enc = (s) => String(s).replace(/[\\()]/g, (c) => '\\' + c).replace(/[^\x20-\xff]/g, '?');

function wrap(text, max) {
  const out = [];
  let line = '';
  for (const w of String(text).split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max) { if (line) out.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}

/** Mesmo PDF como string latin1 (1 caractere = 1 byte): funciona no Node e no navegador. */
export function placeholderPdfString({ title, parent, file }) {
  const pages = [
    [[parent || 'Área de membros', 13, 70, 760, '0.62 0.31 0.05'], ...wrap(title, 30).map((l, i) => [l, 26, 70, 715 - i * 32, '0.09 0.08 0.07']),
      ['Arquivo provisório', 14, 70, 560, '0.25 0.16 0.12'],
      ...wrap(`Envie o PDF real para a pasta content/ com o nome ${file} e ele substitui esta página automaticamente.`, 62).map((l, i) => [l, 12, 70, 535 - i * 18, '0.25 0.16 0.12'])],
    [['Página 2', 22, 70, 715, '0.09 0.08 0.07'], ['Conteúdo de exemplo para testar a leitura no celular.', 12, 70, 685, '0.25 0.16 0.12']],
    [['Página 3 (final)', 22, 70, 715, '0.09 0.08 0.07'], ['Ao chegar aqui, o app mostra a oferta anexada a este conteúdo.', 12, 70, 685, '0.25 0.16 0.12']],
  ];
  const objs = [];
  const add = (s) => { objs.push(s); return objs.length; };
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pagesId = objs.length + 1 + pages.length * 2;
  const kids = [];
  for (const lines of pages) {
    const stream = '0.96 0.94 0.91 rg 0 0 595 842 re f 0.78 0.42 0.11 rg 0 822 595 20 re f\n' +
      lines.map(([t, size, x, y, color]) => `BT ${color} rg /F1 ${size} Tf ${x} ${y} Td (${enc(t)}) Tj ET`).join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  add(`<< /Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`);
  const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

export const placeholderPdf = (opts) => Buffer.from(placeholderPdfString(opts), 'latin1');
