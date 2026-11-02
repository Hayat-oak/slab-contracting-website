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
const SITE = 'https://slab-contracting-website.vercel.app';
const FROM = process.env.ENQUIRY_FROM || 'SLAB Website <website@slab.sa>';

const SECTORS = {residential: ['Residential', 'سكني'], hospitality: ['Hospitality', 'ضيافة'], commercial: ['Commercial', 'تجاري'], institutional: ['Government & Institutional', 'حكومي ومؤسسي']};
const SERVICES = {'fit-out-execution': ['Fit-Out & Execution', 'التشطيبات والتنفيذ'], design: ['Design', 'التصميم'], 'interior-fit-out': ['Interior Fit-Out', 'التشطيبات الداخلية'], 'project-contract-management': ['Project & Contract Management', 'إدارة المشاريع والعقود']};
const BUDGETS = {lt500k: ['Under SAR 500,000', 'أقل من 500 ألف ريال'], '500k1m': ['SAR 500,000 – 1 million', 'من 500 ألف إلى مليون ريال'], '1m3m': ['SAR 1 – 3 million', 'من 1 إلى 3 ملايين ريال'], gt3m: ['Over SAR 3 million', 'أكثر من 3 ملايين ريال'], tbd: ['Not decided yet', 'غير محددة بعد']};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Core-field settings from the admin panel (site_settings.form_fields): location, budget and description may be
// optional or hidden. The database still requires a location and a 12+ character message, so empty optional
// answers are stored as placeholders.
async function readFieldSettings() {
  const rows = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=value&key=eq.form_fields`, {headers: {apikey: SUPABASE_KEY}})
    .then(r => (r.ok ? r.json() : [])).catch(() => []);
  return (rows[0] && rows[0].value) || {};
}
const isRequired = (cfg, key) => !(cfg[key] && (cfg[key].hidden || cfg[key].required === false));

function validate(body, cfg = {}) {
  const row = {
    full_name: str(body.full_name, 120), email: str(body.email, 160), phone: str(body.phone, 20),
    project_type: str(body.project_type, 40), project_location: str(body.project_location, 120),
    services: Array.isArray(body.services) ? body.services.filter(s => typeof s === 'string').slice(0, 8) : [],
    message: str(body.message, 3000), consent: body.consent === true, language: body.language === 'ar' ? 'ar' : 'en'
  };
  const budgetKey = str(body.budget, 20);
  // Paths of photos the visitor uploaded to the private enquiry-files bucket.
  const attachments = (Array.isArray(body.attachments) ? body.attachments : [])
    .filter(p => typeof p === 'string' && /^enquiries\/[A-Za-z0-9-]{8,60}\/\d{1,2}\.[a-z]{2,4}$/.test(p)).slice(0, 6);
  const budget = BUDGETS[budgetKey] ? `${BUDGETS[budgetKey][0]} / ${BUDGETS[budgetKey][1]}` : '';
  // Every question can be made optional or hidden on the staff page: an answer is checked when given, and required
  // only when the question is. An email or a phone number is always needed so SLAB can reply.
  const need = key => isRequired(cfg, key);
  const ok = (row.full_name ? row.full_name.length >= 2 : !need('full-name'))
    && (row.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) : !need('email'))
    && (row.phone ? row.phone.replace(/\D/g, '').length >= 7 : !need('phone'))
    && !!(row.email || row.phone)
    && (row.project_type ? !!SECTORS[row.project_type] : !need('project-type'))
    && (row.services.length > 0 || !need('services'))
    && (row.project_location || !need('project-location'))
    && (row.message ? row.message.length >= (need('message') ? 12 : 1) : !need('message'))
    && row.consent && (!!budget || !need('budget'))
    && (attachments.length > 0 || !(cfg.attachments && cfg.attachments.required === true && !cfg.attachments.hidden));
  if (!row.project_location) row.project_location = '—';
  return {ok, row, attachments, budget, budgetKey: budget ? budgetKey : null, budgetEn: BUDGETS[budgetKey] ? BUDGETS[budgetKey][0] : '—'};
}

// Extra questions from the admin panel. Answers are checked against the live list and stored with their wording,
// so an enquiry stays readable after a question is edited or removed. Returns null when a required answer is missing.
async function readAnswers(raw) {
  const qs = await fetch(`${SUPABASE_URL}/rest/v1/form_questions?select=id,label_en,label_ar,kind,options,required&active=eq.true&order=position,id`,
    {headers: {apikey: SUPABASE_KEY}}).then(r => (r.ok ? r.json() : [])).catch(() => []);
  const given = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const q of qs) {
    let a = str(String(given[q.id] ?? ''), q.kind === 'textarea' ? 1000 : 200);
    if (q.kind === 'select') { const o = (q.options || [])[+a]; a = a !== '' && o ? `${o.en} / ${o.ar}` : ''; }
    if (q.kind === 'number' && a !== '' && !Number.isFinite(+a)) a = '';
    if (!a && q.required) return null;
    if (a) out[q.id] = {question_en: q.label_en, question_ar: q.label_ar, answer: a};
  }
  return out;
}

function emailHtml(row, budget, answers = {}, photos = 0) {
  const sector = SECTORS[row.project_type] || ['—', '—'];
  const services = row.services.map(k => (SERVICES[k] ? `${SERVICES[k][0]} / ${SERVICES[k][1]}` : k)).join('<br>');
  const tel = row.phone.replace(/[^\d+]/g, '');
  const rows = [
    ['Name', 'الاسم', esc(row.full_name)],
    ['Phone', 'الجوال', `<a href="tel:${esc(tel)}" dir="ltr" style="color:#546a78">${esc(row.phone)}</a>`],
    ['Email', 'البريد', `<a href="mailto:${esc(row.email)}" style="color:#546a78">${esc(row.email)}</a>`],
    ['Sector', 'القطاع', `${esc(sector[1])} · ${esc(sector[0])}`],
    ['Services', 'الخدمات', services],
    ...Object.values(answers).map(a => [esc(a.question_en), esc(a.question_ar), esc(a.answer).replace(/\n/g, '<br>')]),
    ['Message', 'الرسالة', esc(row.message).replace(/\n/g, '<br>')],
    ...(photos ? [['Photos', 'الصور', `${photos} مرفقة · ${photos} attached`]] : []),
    ['Form language', 'لغة النموذج', row.language === 'ar' ? 'العربية' : 'English']
  ];
  // Same look as the admin sign-in email (supabase/email_signin.html): navy header with logo, white card, info tiles.
  const tile = (label, value) => `<td width="33%" valign="top" style="background:#f3f5f2;border:1px solid #dfe6df;padding:12px 14px">
    <div style="font-size:11px;color:#77736c;letter-spacing:1px">${label}</div><div style="font-size:15px;font-weight:bold;color:#252728;margin-top:4px">${value}</div></td>`;
  const gap = '<td width="10" style="font-size:0">&nbsp;</td>';
  return `<div style="margin:0;padding:0;background:#eeeae4"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eeeae4;font-family:Arial,Helvetica,sans-serif"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px">
  <tr><td align="center" style="background:#2b373e;padding:28px 24px 24px">
    <table role="presentation" cellpadding="0" cellspacing="0" dir="ltr"><tr><td valign="middle" style="padding-right:12px"><div style="width:50px;height:13px;background:#adbfca;margin-bottom:6px;font-size:0;line-height:0">&nbsp;</div><div style="width:50px;height:13px;background:#c7d6ca;font-size:0;line-height:0">&nbsp;</div></td><td valign="middle" style="color:#ffffff;font-size:32px;font-weight:bold;letter-spacing:3px;line-height:1">SLAB</td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px"><tr><td style="width:26px;border-top:2px solid #adbfca;font-size:0">&nbsp;</td>
      <td style="padding:0 12px;color:#c7d6ca;font-size:13px;letter-spacing:2px">PROJECT ENQUIRY · طلب مشروع</td><td style="width:26px;border-top:2px solid #adbfca;font-size:0">&nbsp;</td></tr></table>
  </td></tr>
  <tr><td style="background:#f6f5f2;padding:22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #dedcd7">
    <tr><td align="center" style="padding:30px 26px 8px" dir="rtl">
      <span style="display:inline-block;background:#e9eef1;color:#546a78;font-size:12px;font-weight:bold;letter-spacing:1px;padding:4px 10px">طلب جديد · NEW ENQUIRY</span>
      <h1 style="margin:16px 0 6px;font-size:26px;line-height:1.3;color:#252728">${esc(row.full_name)}</h1>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:50px;border-top:2px solid #adbfca;font-size:0">&nbsp;</td><td style="padding:0 6px;color:#546a78;font-size:12px">●</td><td style="width:50px;border-top:2px solid #adbfca;font-size:0">&nbsp;</td></tr></table>
      <p style="margin:14px 0 0;font-size:15px;color:#3d3e3a">${esc(sector[1])} · ${esc(row.project_location)}</p>
    </td></tr>
    <tr><td style="padding:18px 22px 4px" dir="rtl"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${tile('الجوال · PHONE', `<a href="tel:${esc(tel)}" dir="ltr" style="color:#252728;text-decoration:none">${esc(row.phone)}</a>`)}${gap}
      ${tile('الميزانية · BUDGET', budget ? esc(budget.split(' / ')[1] || budget) : '—')}${gap}
      ${tile('المدينة · CITY', esc(row.project_location))}</tr></table></td></tr>
    <tr><td style="padding:16px 22px 6px" dir="rtl"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows.map(([en, ar, v]) => `
      <tr><td width="150" valign="top" style="padding:10px 0;border-bottom:1px solid #eeece8;color:#546a78">${ar}<br><span style="font-size:11px;color:#9a968e">${en}</span></td><td valign="top" style="padding:10px 0;border-bottom:1px solid #eeece8;color:#252728;line-height:1.6">${v}</td></tr>`).join('')}</table></td></tr>
    <tr><td align="center" style="padding:24px 26px 30px">
      <a href="${SITE}/admin.html" dir="rtl" style="display:inline-block;background:#2b373e;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:15px 36px">فتح الطلب في صفحة الموظفين &larr;</a>
      <p style="margin:14px 0 0;font-size:13px;color:#77736c">اضغطي «رد» للرد على العميل مباشرة · Reply to this email to answer the client.</p>
    </td></tr>
  </table>
  <p style="margin:18px 0 0;text-align:center;font-size:12px;color:#77736c">SLAB Project Management · جزء من مجموعة أوكتري</p></td></tr>
</table></td></tr></table></div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ok: false}); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ok: false, error: 'bad_request'});
  if (body.bot_field) return res.status(200).json({ok: true}); // honeypot: pretend success, store nothing

  const {ok, row, attachments, budget, budgetKey, budgetEn} = validate(body, await readFieldSettings());
  const answers = ok ? await readAnswers(body.answers) : null;
  if (!ok || !answers) return res.status(400).json({ok: false, error: 'invalid'});

  // 1) Store. Before supabase/admin_setup.sql has run the table has no budget/answers columns, so retry in the old shape.
  const insert = data => fetch(`${SUPABASE_URL}/rest/v1/project_enquiries`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'return=minimal'},
    body: JSON.stringify(data)
  }).catch(() => null);
  // Unanswered optional questions are stored as empty (null), not as blank text.
  const stored = {...row, full_name: row.full_name || null, email: row.email || null, phone: row.phone || null, project_type: row.project_type || null};
  let db = await insert({...stored, budget: budgetKey, answers, attachments});
  if (db && db.status === 400) {
    const extra = Object.values(answers).map(a => `${a.question_en}: ${a.answer}`).join('\n');
    db = await insert({...stored, message: `${row.message}\n\n[Estimated budget: ${budgetEn}]${extra ? '\n' + extra : ''}`});
  }
  if (!db || !db.ok) return res.status(502).json({ok: false, error: 'store_failed'});

  // 2) Email. A failure here is reported but the enquiry is already saved.
  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    const city = row.project_location ? ` — ${row.project_location}` : '';
    const mail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}`},
      body: JSON.stringify({from: FROM, to: [TO], ...(row.email ? {reply_to: row.email} : {}), subject: `New enquiry — ${row.full_name || row.phone || row.email}${city}`, html: emailHtml(row, budget, answers, attachments.length)})
    }).catch(() => null);
    emailed = !!(mail && mail.ok);
    if (!emailed) console.error('Resend failed', mail && mail.status, mail && await mail.text().catch(() => ''));
  } else {
    console.error('RESEND_API_KEY is not set; enquiry stored without email');
  }
  return res.status(200).json({ok: true, emailed});
};
