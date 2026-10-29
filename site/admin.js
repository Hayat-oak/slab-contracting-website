/* SLAB website admin panel (admin.html).
   Sign-in: a one-time code emailed by Supabase Auth; only addresses in public.site_admins get in.
   Data: Supabase REST + Storage with the signed-in user's token; row-level security (supabase/admin_setup.sql)
   enforces admin-only access on the server, so this page holds no secrets. */

const SUPABASE_URL = 'https://oydrudnqcazzytauodup.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4Ep7dLPR3odGYd_uf3GDtw_0U4ieWvw';
const PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/site-assets/`;
const HD = (slug, i) => `${PUBLIC_BASE}projects/hd/${slug}_${i}.webp`;
const SESSION_KEY = 'slab-admin-session';

// Built-in projects (site/app.js). Photos added here are shown after each project's own photos.
const BUILT_IN = [['soulhittin', 'SOUL Hittin'], ['almughrizat', 'Almughrizat Building'], ['masharef', 'Masharef Building'], ['mkin30', 'Mkin 30'],
  ['nirvana12', 'Nirvana 12'], ['ajlan11', 'Ajlan Riviera 12'], ['almajidiya116', 'Almajidiya 116'], ['almajidiya111', 'Al Majidiya Residence 111'],
  ['jawhara8', 'Jawhara Al Narjis 8'], ['ajlan19', 'Ajlan Riviera 21'], ['almajidiya70', 'Almajidiya 70'], ['almajidiya130', 'Almajidiya 130'], ['ajlan37', 'Ajlan Riviera 37']];

// Page-section photos that can be replaced. Slot names match slotSrc() calls in site/app.js.
const SLOTS = [
  ['الصفحة الرئيسية — بطاقات الخدمات', [['home-service-1', 'التشطيبات والتنفيذ', HD('ajlan19', 2)], ['home-service-2', 'التصميم', HD('jawhara8', 2)], ['home-service-3', 'التشطيبات الداخلية', HD('nirvana12', 3)], ['home-service-4', 'إدارة المشاريع والعقود', 'assets/about/svc-4-inspection.webp']]],
  ['صفحة الخدمات', [['services-1', 'التشطيبات والتنفيذ', HD('nirvana12', 2)], ['services-2', 'التصميم', 'assets/about/svc-2-design.webp'], ['services-3', 'التشطيبات الداخلية', HD('soulhittin', 4)], ['services-4', 'إدارة المشاريع والعقود', 'assets/about/svc-4-manage.webp']]],
  ['أثرنا والمدن', [['impact-intro', 'خلفية «أثرنا»', HD('ajlan37', 2)], ['city-riyadh', 'الرياض', 'assets/about/city-riyadh-v2.webp'], ['city-madinah', 'المدينة المنورة', 'assets/about/city-madinah-v2.webp'], ['city-jeddah', 'جدة', 'assets/about/city-jeddah-v2.webp']]],
  ['القطاعات (الرئيسية)', [['sector-hospitality', 'الضيافة', HD('soulhittin', 2)], ['sector-residential', 'السكني', HD('almajidiya111', 2)], ['sector-commercial', 'التجاري', 'assets/about/sector-commercial.webp'], ['sector-institutional', 'الحكومي والمؤسسي', 'assets/about/sector-institutional.webp']]],
  ['القطاعات (صفحة الخدمات)', [['sector-hospitality-2', 'الضيافة', HD('soulhittin', 3)], ['sector-residential-2', 'السكني', HD('ajlan11', 2)], ['sector-commercial-2', 'التجاري', 'assets/about/sector-commercial-2.webp'], ['sector-institutional-2', 'الحكومي والمؤسسي', 'assets/about/sector-institutional-2.webp']]],
  ['من نحن — المبادئ والدعوة', [['principle-precision', 'الدقة', 'assets/about/principle-precision.webp'], ['principle-control', 'التحكم', 'assets/about/principle-control.webp'], ['principle-value', 'القيمة', 'assets/about/principle-value.webp'], ['cta-banner', 'بانر «لنبدأ مشروعك»', 'assets/about/cta-bedroom.webp']]],
  ['مراحل العمل', [['process-1', '1 الفهم', 'assets/process/1-understand.webp'], ['process-2', '2 التصميم', 'assets/process/2-design.webp'], ['process-3', '3 الاعتماد', 'assets/process/3-approve.webp'], ['process-4', '4 التخطيط', 'assets/process/4-plan.webp'], ['process-5', '5 التنفيذ', 'assets/process/5-execute-team-full.webp'], ['process-6', '6 التحكم', 'assets/process/6-control-team-full.webp'], ['process-7', '7 التسليم', 'assets/process/7-deliver-team-full.webp']]]
];

const SECTORS = {residential: 'سكني', hospitality: 'ضيافة', commercial: 'تجاري', institutional: 'حكومي ومؤسسي'};
const SERVICES = {'fit-out-execution': 'التشطيبات والتنفيذ', design: 'التصميم', 'interior-fit-out': 'التشطيبات الداخلية', 'project-contract-management': 'إدارة المشاريع والعقود'};
const BUDGETS = {lt500k: 'أقل من 500 ألف', '500k1m': '500 ألف – مليون', '1m3m': '1 – 3 مليون', gt3m: 'أكثر من 3 مليون', tbd: 'غير محددة'};
const STATUS = {new: 'جديد', contacted: 'تم التواصل', closed: 'مغلق'};
const KINDS = {text: 'نص قصير', textarea: 'نص طويل', number: 'رقم', select: 'قائمة اختيارات'};
const STAT_LABELS = ['الوحدات المسلّمة أو قيد التنفيذ', 'المدن', 'القطاعات', 'مراحل التنفيذ'];

const $root = document.getElementById('admin');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const state = {tab: 'enquiries', data: {}, filter: {q: '', status: ''}, open: null, project: null};
let session = null;
try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { session = null; }

/* ---------- Auth (Supabase GoTrue REST) ---------- */
async function auth(path, body) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {method: 'POST', headers: {apikey: SUPABASE_KEY, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.msg || data.error_description || data.message || 'HTTP ' + r.status);
  return data;
}
function saveSession(d) {
  session = {access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Date.now() + (d.expires_in || 3600) * 1000, email: (d.user && d.user.email) || session?.email};
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
}
function signOut() {
  if (session) fetch(`${SUPABASE_URL}/auth/v1/logout`, {method: 'POST', headers: {apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`}}).catch(() => {});
  session = null;
  try { localStorage.removeItem(SESSION_KEY); } catch {}
  renderLogin();
}
async function freshToken() {
  if (session && Date.now() > session.expires_at - 60000) {
    try { saveSession(await auth('token?grant_type=refresh_token', {refresh_token: session.refresh_token})); } catch { signOut(); throw new Error('انتهت الجلسة، سجّلي الدخول من جديد.'); }
  }
  return session.access_token;
}

/* ---------- Data helpers ---------- */
async function api(path, {method = 'GET', body, headers = {}} = {}) {
  const token = await freshToken();
  const isFile = body instanceof Blob;
  const r = await fetch(SUPABASE_URL + path, {
    method,
    headers: {apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, ...(body && !isFile ? {'Content-Type': 'application/json'} : {}), ...headers},
    body: isFile ? body : body ? JSON.stringify(body) : undefined
  });
  if (r.status === 401) { signOut(); throw new Error('انتهت الجلسة، سجّلي الدخول من جديد.'); }
  const text = await r.text();
  if (!r.ok) { let m = text; try { m = JSON.parse(text).message || text; } catch {} throw new Error(m || 'HTTP ' + r.status); }
  return text ? JSON.parse(text) : null;
}
const rest = (path, opts) => api('/rest/v1/' + path, opts);

// Resize to at most 2400px and convert to WebP before upload; returns the public URL.
async function upload(file, folder) {
  if (!/^image\//.test(file.type)) throw new Error('الملف ليس صورة: ' + file.name);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', 0.86));
  const name = `uploads/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  await api(`/storage/v1/object/site-assets/${name}`, {method: 'POST', body: blob, headers: {'Content-Type': 'image/webp', 'x-upsert': 'true'}});
  return PUBLIC_BASE + name;
}
// Removes an uploaded file from storage (only files under uploads/ belong to the admin panel).
function removeUpload(url) {
  if (!url.startsWith(PUBLIC_BASE + 'uploads/')) return Promise.resolve();
  return api('/storage/v1/object/site-assets/' + url.slice(PUBLIC_BASE.length), {method: 'DELETE'}).catch(() => {});
}

function toast(msg, bad = false) {
  const el = document.createElement('div');
  el.className = 'admin-toast' + (bad ? ' bad' : '');
  el.setAttribute('role', bad ? 'alert' : 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
async function run(task, done) {
  try { await task(); if (done) toast(done); } catch (e) { toast(e.message || String(e), true); }
}

/* ---------- Login ---------- */
function renderLogin(step = 'email', email = '') {
  $root.innerHTML = `<main class="admin-login">
  <a class="admin-back" href="./">→ العودة للموقع</a>
  <h1>دخول الأدمن</h1>
  ${step === 'email' ? `<form id="login-email" novalidate>
    <label for="login-mail">البريد الإلكتروني</label>
    <input id="login-mail" type="email" dir="ltr" autocomplete="email" required value="${esc(email)}">
    <button class="admin-btn" type="submit">إرسال رمز الدخول</button>
    <p class="admin-hint">يصلك رمز من 6 أرقام على بريدك. الدخول متاح فقط للإيميلات المضافة كمستخدمين.</p>
  </form>` : `<form id="login-code" novalidate>
    <p class="admin-hint">أرسلنا رمز الدخول إلى <b dir="ltr">${esc(email)}</b></p>
    <label for="login-otp">رمز الدخول</label>
    <input id="login-otp" inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="10" required>
    <button class="admin-btn" type="submit">دخول</button>
    <button class="admin-link-btn" type="button" data-act="login-restart">تغيير البريد / إعادة الإرسال</button>
  </form>`}
  <p class="admin-msg" id="login-msg" role="alert"></p>
</main>`;
  const msg = document.getElementById('login-msg');
  const f = $root.querySelector('form');
  f.querySelector('input').focus();
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true; msg.textContent = '';
    try {
      if (step === 'email') {
        const mail = f.querySelector('input').value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) throw new Error('اكتبي بريدًا صحيحًا.');
        const allowed = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_admin_email`, {method: 'POST', headers: {apikey: SUPABASE_KEY, 'Content-Type': 'application/json'}, body: JSON.stringify({p_email: mail})}).then(r => r.json()).catch(() => false);
        if (allowed && allowed.code === 'PGRST202') throw new Error('لوحة الأدمن غير مفعّلة بعد: شغّلي ملف supabase/admin_setup.sql في Supabase.');
        if (allowed !== true) throw new Error('هذا البريد غير مضاف كمستخدم في لوحة الأدمن.');
        await auth('otp', {email: mail, create_user: true});
        renderLogin('code', mail);
      } else {
        const code = f.querySelector('input').value.replace(/\D/g, '');
        saveSession(await auth('verify', {type: 'email', email, token: code}));
        renderApp();
      }
    } catch (err) {
      msg.textContent = /rate limit|seconds/i.test(err.message) ? 'طلبت رموزًا كثيرة، انتظري دقيقة ثم حاولي مرة ثانية.' : /expired|invalid/i.test(err.message) ? 'الرمز غير صحيح أو منتهي.' : err.message;
      btn.disabled = false;
    }
  });
}

/* ---------- App shell ---------- */
const TABS = [['enquiries', 'الطلبات'], ['projects', 'المشاريع والصور'], ['images', 'صور الأقسام'], ['questions', 'أسئلة النموذج'], ['settings', 'الأرقام والإعدادات'], ['users', 'المستخدمين']];
async function renderApp() {
  $root.innerHTML = `<div class="admin-shell">
  <header class="admin-top"><a class="admin-brand" href="./">SLAB <span>لوحة الأدمن</span></a>
    <span class="admin-who" dir="ltr">${esc(session.email)}</span>
    <button type="button" class="admin-link-btn" data-act="logout">تسجيل الخروج</button></header>
  <nav class="admin-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${state.tab === k}">${l}</button>`).join('')}</nav>
  <main id="admin-main" class="admin-main"><p class="admin-hint">جارٍ التحميل…</p></main></div>`;
  await loadTab();
}
async function loadTab() {
  const main = document.getElementById('admin-main');
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === state.tab)));
  try {
    const d = state.data;
    if (state.tab === 'enquiries') d.enquiries = await rest('project_enquiries?select=*&order=created_at.desc');
    if (state.tab === 'projects') [d.cms, d.photos] = await Promise.all([rest('cms_projects?select=*&order=position,created_at'), rest('project_photos?select=*&order=position,id')]);
    if (state.tab === 'images') d.images = await rest('image_overrides?select=*');
    if (state.tab === 'questions') d.questions = await rest('form_questions?select=*&order=position,id');
    if (state.tab === 'settings') d.settings = await rest('site_settings?select=*');
    if (state.tab === 'users') d.users = await rest('site_admins?select=*&order=created_at');
    main.innerHTML = VIEWS[state.tab]();
  } catch (e) {
    main.innerHTML = `<p class="admin-msg">تعذّر التحميل: ${esc(e.message)}</p>
      <p class="admin-hint">إذا كانت هذه أول مرة، تأكدي أن ملف <code>supabase/admin_setup.sql</code> تم تشغيله في Supabase، وأن بريدك مضاف في جدول المستخدمين.</p>`;
  }
}

/* ---------- Enquiries ---------- */
function filteredEnquiries() {
  const q = state.filter.q.trim().toLowerCase();
  return (state.data.enquiries || []).filter(e => (!state.filter.status || e.status === state.filter.status)
    && (!q || [e.full_name, e.email, e.phone, e.project_location, e.message].join(' ').toLowerCase().includes(q)));
}
const fmtDate = s => new Date(s).toLocaleString('ar-SA-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
function enquiriesView() {
  const list = filteredEnquiries();
  return `<section><div class="admin-head"><h2>الطلبات <small>${list.length} من ${(state.data.enquiries || []).length}</small></h2>
  <div class="admin-tools"><input type="search" id="enq-search" placeholder="بحث بالاسم أو الجوال أو المدينة…" value="${esc(state.filter.q)}">
    <select id="enq-status"><option value="">كل الحالات</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${state.filter.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <button type="button" class="admin-btn" data-act="export">تصدير Excel</button></div></div>
  ${list.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>التاريخ</th><th>الاسم</th><th>الجوال</th><th>القطاع</th><th>المدينة</th><th>الميزانية</th><th>الحالة</th><th></th></tr></thead><tbody>
  ${list.map(e => `<tr><td>${fmtDate(e.created_at)}</td><td>${esc(e.full_name)}</td><td dir="ltr"><a href="tel:${esc(e.phone)}">${esc(e.phone)}</a></td><td>${SECTORS[e.project_type] || esc(e.project_type)}</td>
    <td>${esc(e.project_location)}</td><td>${BUDGETS[e.budget] || '—'}</td>
    <td><select data-act="status" data-id="${e.id}" aria-label="الحالة">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${e.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
    <td><button type="button" class="admin-link-btn" data-act="toggle-enq" data-id="${e.id}">${state.open === e.id ? 'إخفاء' : 'التفاصيل'}</button></td></tr>
    ${state.open === e.id ? `<tr class="admin-detail"><td colspan="8"><dl>
      <dt>البريد</dt><dd dir="ltr"><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></dd>
      <dt>الخدمات</dt><dd>${(e.services || []).map(s => SERVICES[s] || esc(s)).join('، ')}</dd>
      ${Object.values(e.answers || {}).map(a => `<dt>${esc(a.question_ar)}</dt><dd>${esc(a.answer)}</dd>`).join('')}
      <dt>الرسالة</dt><dd class="pre">${esc(e.message)}</dd><dt>لغة النموذج</dt><dd>${e.language === 'ar' ? 'العربية' : 'English'}</dd></dl>
      <button type="button" class="admin-danger" data-act="delete-enq" data-id="${e.id}">حذف الطلب</button></td></tr>` : ''}`).join('')}
  </tbody></table></div>` : '<p class="admin-hint">لا توجد طلبات.</p>'}</section>`;
}
// CSV with a UTF-8 BOM so Excel opens Arabic text correctly.
function exportExcel() {
  const list = filteredEnquiries();
  const qCols = [];
  list.forEach(e => Object.entries(e.answers || {}).forEach(([id, a]) => { if (!qCols.some(c => c[0] === id)) qCols.push([id, a.question_ar]); }));
  const head = ['التاريخ', 'الاسم', 'الجوال', 'البريد', 'القطاع', 'الخدمات', 'المدينة', 'الميزانية', ...qCols.map(c => c[1]), 'الرسالة', 'الحالة', 'لغة النموذج'];
  const rows = list.map(e => [fmtDate(e.created_at), e.full_name, e.phone, e.email, SECTORS[e.project_type] || e.project_type,
    (e.services || []).map(s => SERVICES[s] || s).join('، '), e.project_location, BUDGETS[e.budget] || '', ...qCols.map(c => ((e.answers || {})[c[0]] || {}).answer || ''),
    e.message, STATUS[e.status] || e.status, e.language === 'ar' ? 'العربية' : 'English']);
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [head, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
  a.download = `slab-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------- Projects & photos ---------- */
function projectsView() {
  const d = state.data;
  const all = [...BUILT_IN.map(([id, name]) => ({id, name, builtIn: true})), ...(d.cms || [])];
  const sel = state.project && all.find(p => p.id === state.project);
  const photos = sel ? (d.photos || []).filter(p => p.project_id === sel.id) : [];
  return `<section><div class="admin-head"><h2>المشاريع والصور</h2></div>
  <div class="admin-grid2">
  <div class="admin-card"><h3>المشاريع</h3><ul class="admin-list">${all.map(p => `<li class="${state.project === p.id ? 'is-sel' : ''}">
    <button type="button" class="admin-link-btn" data-act="pick-project" data-id="${esc(p.id)}">${esc(p.name)}${p.name_ar ? ` — ${esc(p.name_ar)}` : ''}</button>
    <span class="admin-tag">${p.builtIn ? 'أساسي' : p.published ? 'منشور' : 'مخفي'}</span>
    <span class="admin-count">${(d.photos || []).filter(x => x.project_id === p.id).length} صور مضافة</span></li>`).join('')}</ul></div>
  <div class="admin-card"><h3>إضافة مشروع جديد</h3>
  <form id="new-project" class="admin-form">
    <label>الاسم (English)<input name="name" required maxlength="80"></label><label>الاسم (عربي)<input name="name_ar" required maxlength="80"></label>
    <label>العميل (English)<input name="client" maxlength="80"></label><label>العميل (عربي)<input name="client_ar" maxlength="80"></label>
    <label>المدينة (English)<input name="city" value="Riyadh" maxlength="60"></label><label>المدينة (عربي)<input name="city_ar" value="الرياض" maxlength="60"></label>
    <label>النوع<select name="type">${Object.entries(SECTORS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label>عدد الوحدات<input name="units" type="number" min="0"></label>
    <label class="span2">المساحات م² (افصلي بفاصلة)<input name="sizes" placeholder="120, 145"></label>
    <label class="span2">الصور<input name="files" type="file" accept="image/*" multiple required></label>
    <button class="admin-btn span2" type="submit">إضافة المشروع</button>
    <p class="admin-hint span2">المشروع يظهر في الموقع بعد رفع صورة واحدة على الأقل. ارفعي صور الغرف الداخلية بجودة عالية.</p>
  </form></div></div>
  ${sel ? `<div class="admin-card"><div class="admin-head"><h3>صور: ${esc(sel.name)}</h3>
    ${sel.builtIn ? '' : `<div class="admin-tools"><button type="button" class="admin-link-btn" data-act="toggle-publish" data-id="${esc(sel.id)}">${sel.published ? 'إخفاء من الموقع' : 'نشر في الموقع'}</button>
    <button type="button" class="admin-danger" data-act="delete-project" data-id="${esc(sel.id)}">حذف المشروع</button></div>`}</div>
    ${sel.builtIn ? '<p class="admin-hint">صور المشروع الأساسية ثابتة. الصور اللي تضيفينها هنا تظهر بعدها في معرض المشروع.</p>' : ''}
    <div class="admin-thumbs">${photos.map(p => `<figure><img src="${esc(p.url)}" alt=""><button type="button" class="admin-danger" data-act="delete-photo" data-id="${p.id}">حذف</button></figure>`).join('') || '<p class="admin-hint">لا توجد صور مضافة.</p>'}</div>
    <label class="admin-upload">إضافة صور<input type="file" accept="image/*" multiple data-act="add-photos" data-id="${esc(sel.id)}"></label></div>` : '<p class="admin-hint">اختاري مشروعًا من القائمة لإدارة صوره.</p>'}
  </section>`;
}
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'project';

/* ---------- Section images ---------- */
function imagesView() {
  const over = Object.fromEntries((state.data.images || []).map(i => [i.slot, i.url]));
  return `<section><div class="admin-head"><h2>صور الأقسام</h2></div>
  <p class="admin-hint">استبدلي أي صورة في الموقع. «استرجاع» يرجّع الصورة الأصلية.</p>
  ${SLOTS.map(([group, items]) => `<div class="admin-card"><h3>${group}</h3><div class="admin-slots">${items.map(([slot, label, def]) => `<figure class="${over[slot] ? 'is-custom' : ''}">
    <img src="${esc(over[slot] || def)}" alt="" loading="lazy"><figcaption>${label}${over[slot] ? ' <span class="admin-tag">مُستبدلة</span>' : ''}</figcaption>
    <label class="admin-upload small">استبدال<input type="file" accept="image/*" data-act="slot-upload" data-slot="${slot}"></label>
    ${over[slot] ? `<button type="button" class="admin-link-btn" data-act="slot-reset" data-slot="${slot}">استرجاع</button>` : ''}</figure>`).join('')}</div></div>`).join('')}</section>`;
}

/* ---------- Form questions ---------- */
function questionsView() {
  const qs = state.data.questions || [];
  return `<section><div class="admin-head"><h2>أسئلة نموذج التواصل</h2></div>
  <p class="admin-hint">الأسئلة النشطة تظهر في نموذج «ابدأ مشروعك» بعد الميزانية، وإجاباتها تصل في الإيميل وفي جدول الطلبات.</p>
  <div class="admin-card">${qs.length ? `<ol class="admin-qs">${qs.map((q, i) => `<li class="${q.active ? '' : 'is-off'}">
    <div><b>${esc(q.label_ar)}</b> <span dir="ltr">${esc(q.label_en)}</span><br><small>${KINDS[q.kind]}${q.required ? ' · إجباري' : ' · اختياري'}${q.kind === 'select' ? ' · ' + (q.options || []).map(o => esc(o.ar)).join(' / ') : ''}</small></div>
    <div class="admin-tools"><button type="button" data-act="q-move" data-id="${q.id}" data-dir="-1" ${i ? '' : 'disabled'} aria-label="لأعلى">↑</button><button type="button" data-act="q-move" data-id="${q.id}" data-dir="1" ${i < qs.length - 1 ? '' : 'disabled'} aria-label="لأسفل">↓</button>
    <button type="button" class="admin-link-btn" data-act="q-toggle" data-id="${q.id}">${q.active ? 'إيقاف' : 'تفعيل'}</button>
    <button type="button" class="admin-link-btn" data-act="q-required" data-id="${q.id}">${q.required ? 'جعله اختياري' : 'جعله إجباري'}</button>
    <button type="button" class="admin-danger" data-act="q-delete" data-id="${q.id}">حذف</button></div></li>`).join('')}</ol>` : '<p class="admin-hint">لا توجد أسئلة إضافية بعد.</p>'}</div>
  <div class="admin-card"><h3>إضافة سؤال</h3><form id="new-question" class="admin-form">
    <label>السؤال (عربي)<input name="label_ar" required maxlength="200"></label><label>السؤال (English)<input name="label_en" required maxlength="200"></label>
    <label>نوع الإجابة<select name="kind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" name="required"> إجباري</label>
    <label class="span2">الاختيارات (لنوع «قائمة اختيارات»): كل اختيار في سطر بالشكل <code>English | عربي</code><textarea name="options" rows="4" placeholder="Within 3 months | خلال 3 أشهر"></textarea></label>
    <button class="admin-btn span2" type="submit">إضافة السؤال</button></form></div></section>`;
}

/* ---------- Settings ---------- */
function settingsView() {
  const get = k => ((state.data.settings || []).find(s => s.key === k) || {}).value;
  const stats = get('stats') || [{n: 125, suffix: '+'}, {n: 3, suffix: ''}, {n: 4, suffix: ''}, {n: 7, suffix: ''}];
  const c = get('contact') || {};
  return `<section><div class="admin-head"><h2>الأرقام والإعدادات</h2></div>
  <form id="settings" class="admin-card admin-form"><h3 class="span2">أرقام «أثرنا»</h3>
    ${stats.map((s, i) => `<label>${STAT_LABELS[i]}<span class="admin-row"><input name="n${i}" type="number" min="0" required value="${esc(s.n)}"><input name="s${i}" maxlength="3" value="${esc(s.suffix)}" aria-label="لاحقة (مثل +)" placeholder="+"></span></label>`).join('')}
    <h3 class="span2">بيانات التواصل</h3>
    <label>رقم الهاتف (للاتصال)<input name="phone" dir="ltr" required value="${esc(c.phone || '920066197')}"></label>
    <label>رقم الهاتف (كما يظهر)<input name="phone_display" dir="ltr" value="${esc(c.phone_display || '9200 66197')}"></label>
    <label>البريد الإلكتروني<input name="email" type="email" dir="ltr" required value="${esc(c.email || 'info@slab.sa')}"></label>
    <label>Instagram<input name="instagram" type="url" dir="ltr" value="${esc(c.instagram || '')}"></label>
    <label>LinkedIn<input name="linkedin" type="url" dir="ltr" value="${esc(c.linkedin || '')}"></label>
    <button class="admin-btn span2" type="submit">حفظ</button>
    <p class="admin-hint span2">بريد استلام الطلبات من النموذج يبقى info@slab.sa (إعداد على السيرفر).</p></form></section>`;
}

/* ---------- Users ---------- */
function usersView() {
  return `<section><div class="admin-head"><h2>المستخدمين</h2></div>
  <p class="admin-hint">كل بريد هنا يقدر يدخل لوحة الأدمن برمز يصله على الإيميل.</p>
  <div class="admin-card"><ul class="admin-list">${(state.data.users || []).map(u => `<li><span dir="ltr">${esc(u.email)}</span>
    <span class="admin-count">${u.added_by && u.added_by !== 'setup' ? 'أضافه ' + esc(u.added_by) : ''}</span>
    ${u.email === session.email ? '<span class="admin-tag">أنتِ</span>' : `<button type="button" class="admin-danger" data-act="user-delete" data-email="${esc(u.email)}">إزالة</button>`}</li>`).join('')}</ul></div>
  <form id="new-user" class="admin-card admin-form"><h3 class="span2">إضافة مستخدم</h3>
    <label class="span2">البريد الإلكتروني<input name="email" type="email" dir="ltr" required></label>
    <button class="admin-btn span2" type="submit">إضافة</button></form></section>`;
}

const VIEWS = {enquiries: enquiriesView, projects: projectsView, images: imagesView, questions: questionsView, settings: settingsView, users: usersView};
const redraw = () => { const m = document.getElementById('admin-main'); if (m) m.innerHTML = VIEWS[state.tab](); };

/* ---------- Events ---------- */
$root.addEventListener('click', e => {
  const t = e.target.closest('[data-tab],[data-act]');
  if (!t || t.tagName === 'SELECT' || t.type === 'file') return;
  if (t.dataset.tab) { state.tab = t.dataset.tab; state.open = null; loadTab(); return; }
  const id = t.dataset.id;
  const d = state.data;
  switch (t.dataset.act) {
    case 'logout': signOut(); break;
    case 'login-restart': renderLogin('email'); break;
    case 'export': exportExcel(); break;
    case 'toggle-enq': state.open = state.open === id ? null : id; redraw(); break;
    case 'delete-enq':
      if (confirm('حذف هذا الطلب نهائيًا؟')) run(async () => { await rest(`project_enquiries?id=eq.${id}`, {method: 'DELETE'}); d.enquiries = d.enquiries.filter(x => x.id !== id); redraw(); }, 'تم حذف الطلب');
      break;
    case 'pick-project': state.project = id; redraw(); break;
    case 'toggle-publish': run(async () => { const p = d.cms.find(x => x.id === id); await rest(`cms_projects?id=eq.${encodeURIComponent(id)}`, {method: 'PATCH', body: {published: !p.published}}); p.published = !p.published; redraw(); }, 'تم الحفظ'); break;
    case 'delete-project':
      if (confirm('حذف المشروع وكل صوره؟')) run(async () => {
        const urls = d.photos.filter(x => x.project_id === id).map(x => x.url);
        await rest(`project_photos?project_id=eq.${encodeURIComponent(id)}`, {method: 'DELETE'});
        await rest(`cms_projects?id=eq.${encodeURIComponent(id)}`, {method: 'DELETE'});
        await Promise.all(urls.map(removeUpload));
        d.cms = d.cms.filter(x => x.id !== id); d.photos = d.photos.filter(x => x.project_id !== id); state.project = null; redraw();
      }, 'تم حذف المشروع');
      break;
    case 'delete-photo':
      if (confirm('حذف الصورة؟')) run(async () => { const ph = d.photos.find(x => String(x.id) === id); await rest(`project_photos?id=eq.${id}`, {method: 'DELETE'}); await removeUpload(ph.url); d.photos = d.photos.filter(x => x !== ph); redraw(); }, 'تم حذف الصورة');
      break;
    case 'slot-reset': run(async () => { const old = d.images.find(x => x.slot === t.dataset.slot); await rest(`image_overrides?slot=eq.${t.dataset.slot}`, {method: 'DELETE'}); if (old) await removeUpload(old.url); d.images = d.images.filter(x => x !== old); redraw(); }, 'تم استرجاع الصورة الأصلية'); break;
    case 'q-toggle': case 'q-required': run(async () => {
      const q = d.questions.find(x => String(x.id) === id); const field = t.dataset.act === 'q-toggle' ? 'active' : 'required';
      await rest(`form_questions?id=eq.${id}`, {method: 'PATCH', body: {[field]: !q[field]}}); q[field] = !q[field]; redraw();
    }, 'تم الحفظ'); break;
    case 'q-move': run(async () => {
      const qs = d.questions; const i = qs.findIndex(x => String(x.id) === id); const j = i + Number(t.dataset.dir);
      [qs[i], qs[j]] = [qs[j], qs[i]];
      await Promise.all(qs.map((q, k) => (q.position === k ? null : rest(`form_questions?id=eq.${q.id}`, {method: 'PATCH', body: {position: k}}).then(() => { q.position = k; }))));
      redraw();
    }); break;
    case 'q-delete': if (confirm('حذف السؤال؟ الإجابات السابقة تبقى محفوظة في الطلبات.')) run(async () => { await rest(`form_questions?id=eq.${id}`, {method: 'DELETE'}); d.questions = d.questions.filter(x => String(x.id) !== id); redraw(); }, 'تم حذف السؤال'); break;
    case 'user-delete': if (confirm(`إزالة ${t.dataset.email} من لوحة الأدمن؟`)) run(async () => { await rest(`site_admins?email=eq.${encodeURIComponent(t.dataset.email)}`, {method: 'DELETE'}); d.users = d.users.filter(u => u.email !== t.dataset.email); redraw(); }, 'تمت الإزالة'); break;
  }
});

$root.addEventListener('input', e => {
  if (e.target.id === 'enq-search') { state.filter.q = e.target.value; const pos = e.target.selectionStart; redraw(); const s = document.getElementById('enq-search'); s.focus(); s.setSelectionRange(pos, pos); }
});

$root.addEventListener('change', e => {
  const t = e.target;
  const d = state.data;
  if (t.id === 'enq-status') { state.filter.status = t.value; redraw(); return; }
  if (t.dataset.act === 'status') run(async () => { await rest(`project_enquiries?id=eq.${t.dataset.id}`, {method: 'PATCH', body: {status: t.value}}); d.enquiries.find(x => x.id === t.dataset.id).status = t.value; }, 'تم تحديث الحالة');
  if (t.dataset.act === 'add-photos' && t.files.length) run(async () => {
    t.disabled = true; toast('جارٍ رفع الصور…');
    const start = d.photos.filter(x => x.project_id === t.dataset.id).length;
    const files = Array.from(t.files);
    for (let i = 0; i < files.length; i++) {
      const url = await upload(files[i], 'projects/' + t.dataset.id);
      const [row] = await rest('project_photos', {method: 'POST', body: {project_id: t.dataset.id, url, position: start + i}, headers: {Prefer: 'return=representation'}});
      d.photos.push(row);
    }
    redraw();
  }, 'تم رفع الصور');
  if (t.dataset.act === 'slot-upload' && t.files.length) run(async () => {
    toast('جارٍ رفع الصورة…');
    const old = d.images.find(x => x.slot === t.dataset.slot);
    const url = await upload(t.files[0], 'sections');
    await rest('image_overrides', {method: 'POST', body: {slot: t.dataset.slot, url, updated_at: new Date().toISOString()}, headers: {Prefer: 'resolution=merge-duplicates'}});
    if (old) await removeUpload(old.url);
    d.images = d.images.filter(x => x.slot !== t.dataset.slot).concat({slot: t.dataset.slot, url});
    redraw();
  }, 'تم استبدال الصورة');
});

$root.addEventListener('submit', e => {
  const f = e.target;
  if (!['new-project', 'new-question', 'settings', 'new-user'].includes(f.id)) return;
  e.preventDefault();
  if (!f.reportValidity()) return;
  const v = name => (f.elements[name] ? f.elements[name].value.trim() : '');
  const d = state.data;
  const btn = f.querySelector('button[type=submit]');
  btn.disabled = true;
  const done = () => { btn.disabled = false; };
  if (f.id === 'new-project') run(async () => {
    let id = slugify(v('name'));
    while ([...BUILT_IN.map(b => b[0]), ...d.cms.map(p => p.id)].includes(id)) id = id.slice(0, 36) + '-' + Math.floor(Math.random() * 90 + 10);
    const sizes = v('sizes').split(/[,،]/).map(s => s.trim()).filter(Boolean);
    const [p] = await rest('cms_projects', {method: 'POST', headers: {Prefer: 'return=representation'}, body: {id, name: v('name'), name_ar: v('name_ar'), client: v('client'), client_ar: v('client_ar'),
      city: v('city') || 'Riyadh', city_ar: v('city_ar') || 'الرياض', type: v('type'), units: v('units') === '' ? null : Number(v('units')), sizes, position: d.cms.length}});
    d.cms.push(p);
    toast('جارٍ رفع الصور…');
    const files = Array.from(f.elements.files.files);
    for (let i = 0; i < files.length; i++) {
      const url = await upload(files[i], 'projects/' + id);
      const [row] = await rest('project_photos', {method: 'POST', body: {project_id: id, url, position: i}, headers: {Prefer: 'return=representation'}});
      d.photos.push(row);
    }
    state.project = id; redraw();
  }, 'تمت إضافة المشروع').finally(done);
  if (f.id === 'new-question') run(async () => {
    const kind = v('kind');
    const options = kind === 'select' ? v('options').split('\n').map(l => l.split('|').map(s => s.trim())).filter(([en]) => en).map(([en, ar]) => ({en, ar: ar || en})) : [];
    if (kind === 'select' && options.length < 2) throw new Error('أضيفي اختيارين على الأقل للقائمة.');
    const [q] = await rest('form_questions', {method: 'POST', headers: {Prefer: 'return=representation'}, body: {label_ar: v('label_ar'), label_en: v('label_en'), kind, options, required: f.elements.required.checked, position: d.questions.length}});
    d.questions.push(q); redraw();
  }, 'تمت إضافة السؤال').finally(done);
  if (f.id === 'settings') run(async () => {
    const stats = [0, 1, 2, 3].map(i => ({n: Number(v('n' + i)), suffix: v('s' + i)}));
    const contact = {phone: v('phone'), phone_display: v('phone_display') || v('phone'), email: v('email'), instagram: v('instagram'), linkedin: v('linkedin')};
    const now = new Date().toISOString();
    await rest('site_settings', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates'}, body: [{key: 'stats', value: stats, updated_at: now}, {key: 'contact', value: contact, updated_at: now}]});
    d.settings = [{key: 'stats', value: stats}, {key: 'contact', value: contact}];
  }, 'تم حفظ الإعدادات').finally(done);
  if (f.id === 'new-user') run(async () => {
    const email = v('email').toLowerCase();
    const [u] = await rest('site_admins', {method: 'POST', headers: {Prefer: 'return=representation'}, body: {email, added_by: session.email}});
    d.users.push(u); redraw();
  }, 'تمت إضافة المستخدم').finally(done);
});

if (session && session.refresh_token) renderApp(); else renderLogin();
