// Parser de user-agent simples, focado no tráfego de páginas de vendas (muito in-app de Instagram/Facebook)
export function parseUA(ua = '', vw = 0) {
  let device = 'desktop';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) device = 'tablet';
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) device = 'mobile';
  if (device === 'desktop' && vw && vw < 600) device = 'mobile';

  let os = 'Outro';
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Outro';
  if (/Instagram/i.test(ua)) browser = 'Instagram (in-app)';
  else if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) browser = 'Facebook (in-app)';
  else if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) browser = 'TikTok (in-app)';
  else if (/WhatsApp/i.test(ua)) browser = 'WhatsApp';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  return { device, os, browser };
}

export const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit|preview|monitor|curl|wget|python-requests|axios|node-fetch/i;
