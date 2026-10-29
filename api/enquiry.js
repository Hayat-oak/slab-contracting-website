// Vercel serverless function: POST /api/enquiry
// Saves a project enquiry in Supabase, then emails it to SLAB through Resend.
// The enquiry is stored first, so a failed email never loses it.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY  (required for email) Resend API key, kept server-side only
//   ENQUIRY_TO      (optional) recipient, default info@slab.sa
//   ENQUIRY_FROM    (optional) sender, default "SLAB Website <website@slab.sa>" (slab.sa must be verified in Resend).
//   SUPABASE_URL / SUPABASE_KEY (optional) default to the site's public project and publishable key

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oydrudnqcazzytauodup.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_4Ep7dLPR3odGYd_uf3GDtw_0U4ieWvw';
const TO = process.env.ENQUIRY_TO || 'info@slab.sa';
const FROM = process.env.ENQUIRY_FROM || 'SLAB Website <website@slab.sa>';

const SECTORS = {residential: ['Residential', 'سكني'], hospitality: ['Hospitality', 'ضيافة'], commercial: ['Commercial', 'تجاري'], institutional: ['Government & Institutional', 'حكومي ومؤسسي']};
const SERVICES = {'fit-out-execution': ['Fit-Out & Execution', 'التشطيبات والتنفيذ'], design: ['Design', 'التصميم'], 'interior-fit-out': ['Interior Fit-Out', 'التشطيبات الداخلية'], 'project-contract-management': ['Project & Contract Management', 'إدارة المشاريع والعقود']};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

function validate(body) {
  const row = {
    full_name: str(body.full_name, 120), email: str(body.email, 160), phone: str(body.phone, 20),
    project_type: str(body.project_type, 40), project_location: str(body.project_location, 120),
    services: Array.isArray(body.services) ? body.services.filter(s => typeof s === 'string').slice(0, 8) : [],
    message: str(body.message, 3000), consent: body.consent === true, language: body.language === 'ar' ? 'ar' : 'en'
  };
  const budget = str(body.budget, 80);
  const ok = row.full_name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) && row.phone.replace(/\D/g, '').length >= 7
    && row.project_location && row.message.length >= 12 && row.consent && row.services.length > 0;
  return {ok, row, budget};
}

function emailHtml(row, budget) {
  const sector = SECTORS[row.project_type] || [row.project_type, row.project_type];
  const services = row.services.map(k => (SERVICES[k] ? `${SERVICES[k][0]} / ${SERVICES[k][1]}` : k)).join('<br>');
  const tel = row.phone.replace(/[^\d+]/g, '');
  const rows = [
    ['Name', 'الاسم', esc(row.full_name)],
    ['Phone', 'الجوال', `<a href="tel:${esc(tel)}" dir="ltr">${esc(row.phone)}</a>`],
    ['Email', 'البريد', `<a href="mailto:${esc(row.email)}">${esc(row.email)}</a>`],
    ['Sector', 'القطاع', `${esc(sector[0])} / ${esc(sector[1])}`],
    ['Services', 'الخدمات', services],
    ['Location', 'الموقع', esc(row.project_location)],
    ['Estimated budget', 'الميزانية التقديرية', budget ? esc(budget) : '—'],
    ['Message', 'الرسالة', esc(row.message).replace(/\n/g, '<br>')],
    ['Form language', 'لغة النموذج', row.language === 'ar' ? 'العربية' : 'English']
  ];
  return `<div style="font-family:Arial,sans-serif;color:#252728;max-width:640px">
<h2 style="font-weight:500;margin:0 0 6px">New project enquiry · طلب مشروع جديد</h2>
<p style="color:#77736c;margin:0 0 18px">Submitted on the SLAB website. Reply to this email to answer the client directly.</p>
<table style="border-collapse:collapse;width:100%;font-size:15px">${rows.map(([en, ar, v]) => `
<tr><td style="padding:10px 12px;border-bottom:1px solid #dedcd7;width:170px;vertical-align:top;color:#546a78">${en}<br><span style="font-size:13px">${ar}</span></td><td style="padding:10px 12px;border-bottom:1px solid #dedcd7;vertical-align:top">${v}</td></tr>`).join('')}
</table></div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ok: false}); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ok: false, error: 'bad_request'});
  if (body.bot_field) return res.status(200).json({ok: true}); // honeypot: pretend success, store nothing

  const {ok, row, budget} = validate(body);
  if (!ok) return res.status(400).json({ok: false, error: 'invalid'});

  // 1) Store (the table has no budget column yet, so it travels inside the message).
  const stored = {...row, message: budget ? `${row.message}\n\n[Estimated budget: ${budget}]` : row.message};
  const db = await fetch(`${SUPABASE_URL}/rest/v1/project_enquiries`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'return=minimal'},
    body: JSON.stringify(stored)
  }).catch(() => null);
  if (!db || !db.ok) return res.status(502).json({ok: false, error: 'store_failed'});

  // 2) Email. A failure here is reported but the enquiry is already saved.
  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    const city = row.project_location ? ` — ${row.project_location}` : '';
    const mail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}`},
      body: JSON.stringify({from: FROM, to: [TO], reply_to: row.email, subject: `New enquiry — ${row.full_name}${city}`, html: emailHtml(row, budget)})
    }).catch(() => null);
    emailed = !!(mail && mail.ok);
    if (!emailed) console.error('Resend failed', mail && mail.status, mail && await mail.text().catch(() => ''));
  } else {
    console.error('RESEND_API_KEY is not set; enquiry stored without email');
  }
  return res.status(200).json({ok: true, emailed});
};
