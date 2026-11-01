/* SLAB website admin panel (admin.html).
   Sign-in: a one-time code emailed by Supabase Auth; only addresses in public.site_admins get in.
   Data: Supabase REST + Storage with the signed-in user's token; row-level security (supabase/admin_setup.sql)
   enforces admin-only access on the server, so this page holds no secrets. */

const SUPABASE_URL = 'https://oydrudnqcazzytauodup.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4Ep7dLPR3odGYd_uf3GDtw_0U4ieWvw';
const PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/site-assets/`;
const HD = (slug, i) => `${PUBLIC_BASE}projects/hd/${slug}_${i}.webp`;
const SESSION_KEY = 'slab-admin-session';

// Built-in projects (copy of site/app.js data). A cms_projects row with the same id overrides name, client,
// units and sizes (or hides the project); photos added here are shown after the project's own photos.
const AH = ['Aliyah Homes', 'عالية هوم'];
const BUILT_IN = [
  ['soulhittin', 'SOUL Hittin', 'سول حطين', ['OHG', 'OHG'], 9, ['132.26'], 6],
  ['almughrizat', 'Almughrizat Building', 'مبنى المغرزات', AH, 25, ['50', '107'], 3],
  ['masharef', 'Masharef Building', 'مبنى مشارف', AH, 14, ['117', '121', '160'], 3],
  ['mkin30', 'Makeen 30', 'مكين 30', AH, 1, ['245'], 2],
  ['nirvana12', 'Nirvana 12', 'نيرفانا 12', AH, 2, ['50', '145'], 3],
  ['ajlan11', 'Al Ajlan Riviera 12', 'العجلان ريفيرا 12', AH, 1, ['92', '169'], 3],
  ['almajidiya116', 'Almajidiya 116', 'المجيدية 116', AH, 4, ['77', '101', '128', '130'], 2],
  ['almajidiya111', 'Al Majidiya Residence 111', 'المجيدية ريزيدنس 111', AH, 1, ['120'], 4],
  ['jawhara8', 'Jawhara Al Narjis 8', 'جوهرة النرجس 8', AH, 1, ['50', '145'], 4],
  ['ajlan19', 'Al Ajlan Riviera 21', 'العجلان ريفيرا 21', AH, 1, ['137'], 2],
  ['almajidiya70', 'Almajidiya 70', 'المجيدية 70', AH, 1, ['90'], 3],
  ['almajidiya130', 'Almajidiya 130', 'المجيدية 130', AH, 1, ['128'], 4],
  ['ajlan37', 'Al Ajlan Riviera 37', 'العجلان ريفيرا 37', AH, 2, ['77', '101', '128', '130'], 2]
].map(([id, name, name_ar, [client, client_ar], units, sizes, images]) => ({id, name, name_ar, client, client_ar, units, sizes, images, builtIn: true, published: true}));
const BUILT_IN_IDS = BUILT_IN.map(p => p.id);

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
const state = {tab: 'enquiries', data: {}, filter: {q: '', status: ''}, open: null, project: null, addQ: false, signed: {}};
let session = null;
try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { session = null; }

/* ---------- Language (Arabic / English) ---------- */
// The panel is written in Arabic. In English mode every Arabic interface string on screen is swapped through this
// table. Only exact matches (and the few patterns below) are replaced, so names, cities and messages typed by people
// stay as they are. Elements marked data-raw are never translated (e.g. the language button itself).
let LANG = 'ar';
try { LANG = localStorage.getItem('slab-admin-lang') === 'en' ? 'en' : 'ar'; } catch {}
const EN = {
  // shell, login
  'صفحة الموظفين': 'Staff page', 'دخول الموظفين': 'Staff sign-in', '→ العودة للموقع': '← Back to the website', 'البريد الإلكتروني': 'Email address',
  'إرسال رمز الدخول': 'Send sign-in code', 'عندي رمز وصلني بالإيميل': 'I already have a code', 'رمز الدخول': 'Sign-in code', 'دخول': 'Sign in',
  'تغيير البريد / إعادة الإرسال': 'Change email / resend', 'أرسلنا رمز الدخول إلى': 'We sent a sign-in code to',
  '. اكتبيه هنا. إذا ما وصل خلال دقيقة، شيّكي مجلد Junk.': '. Enter it here. If it does not arrive within a minute, check your Junk folder.',
  'يصلك رمز من 6 أرقام على بريدك. الدخول متاح فقط للإيميلات المضافة كمستخدمين.': 'You will receive a 6-digit code by email. Only addresses added as users can sign in.',
  'اكتبي بريدًا صحيحًا.': 'Enter a valid email address.', 'اكتبي بريدك أول.': 'Enter your email first.',
  'هذا البريد غير مضاف كمستخدم في صفحة الموظفين.': 'This email is not a staff page user.',
  'صفحة الموظفين غير مفعّلة بعد: شغّلي ملف supabase/admin_setup.sql في Supabase.': 'The staff page is not set up yet: run supabase/admin_setup.sql in Supabase.',
  'تعذّر إرسال إيميل الدخول. تأكدي من إعداد SMTP في Supabase (اسم المستخدم resend وكلمة المرور = مفتاح Resend).': 'The sign-in email could not be sent. Check the SMTP settings in Supabase (username resend, password = Resend API key).',
  'طلبت رموزًا كثيرة، انتظري دقيقة ثم حاولي مرة ثانية.': 'Too many codes requested. Wait a minute and try again.',
  'الرمز غير صحيح أو منتهي.': 'The code is wrong or has expired.', 'رابط الدخول غير صالح أو منتهي. اطلبي رمزًا جديدًا.': 'The sign-in link is invalid or expired. Request a new code.',
  'انتهت الجلسة، سجّلي الدخول من جديد.': 'Your session has ended. Please sign in again.',
  'تسجيل الخروج': 'Sign out', 'الطلبات الجديدة': 'New enquiries', 'جارٍ التحميل…': 'Loading…',
  'الطلبات': 'Enquiries', 'المشاريع والصور': 'Projects & photos', 'صور الأقسام': 'Section photos', 'أسئلة النموذج': 'Form questions',
  'الأرقام والإعدادات': 'Numbers & settings', 'المستخدمين': 'Users',
  // enquiries
  'بحث بالاسم أو الجوال أو البريد…': 'Search by name, mobile or email…', 'كل الحالات': 'All statuses', 'تصدير Excel': 'Export to Excel',
  'التاريخ': 'Date', 'الاسم': 'Name', 'الجوال': 'Mobile', 'القطاع': 'Sector', 'المدينة': 'City', 'الميزانية': 'Budget', 'الحالة': 'Status', 'الإجراءات': 'Actions',
  'جديد': 'New', 'تم التواصل': 'Contacted', 'مغلق': 'Closed', 'التفاصيل': 'Details', 'إخفاء التفاصيل': 'Hide details', 'المزيد': 'More',
  'مراسلة العميل': 'Email the client', 'اتصال': 'Call', 'حذف الطلب': 'Delete enquiry', 'البريد': 'Email', 'الخدمات': 'Services', 'صور المشروع': 'Project photos',
  'الرسالة': 'Message', 'لغة النموذج': 'Form language', 'العربية': 'Arabic', 'لا توجد طلبات.': 'No enquiries.',
  'سكني': 'Residential', 'ضيافة': 'Hospitality', 'تجاري': 'Commercial', 'حكومي ومؤسسي': 'Government & institutional',
  'التشطيبات والتنفيذ': 'Fit-Out & Execution', 'التصميم': 'Design', 'التشطيبات الداخلية': 'Interior Fit-Out', 'إدارة المشاريع والعقود': 'Project & Contract Management',
  'أقل من 500 ألف': 'Under SAR 500k', '500 ألف – مليون': 'SAR 500k – 1m', '1 – 3 مليون': 'SAR 1 – 3m', 'أكثر من 3 مليون': 'Over SAR 3m', 'غير محددة': 'Not decided',
  'حذف هذا الطلب نهائيًا؟': 'Delete this enquiry permanently?', 'تم حذف الطلب': 'Enquiry deleted', 'تم تحديث الحالة': 'Status updated',
  // projects
  'مشروع جديد': 'New project', 'أساسي': 'Original', 'مضاف': 'Added', 'مخفي': 'Hidden', 'عرض في الموقع': 'View on site', 'إخفاء من الموقع': 'Hide from site',
  'إظهار في الموقع': 'Show on site', 'حذف المشروع': 'Delete project', 'حفظ البيانات': 'Save details', 'أصلية': 'Original', 'حذف': 'Delete', 'إضافة صور': 'Add photos',
  'إضافة مشروع جديد': 'Add a new project', 'إضافة المشروع': 'Add project', 'الصور': 'Photos',
  'الاسم (عربي)': 'Name (Arabic)', 'الاسم (English)': 'Name (English)', 'العميل (عربي)': 'Client (Arabic)', 'العميل (English)': 'Client (English)',
  'المدينة (عربي)': 'City (Arabic)', 'المدينة (English)': 'City (English)', 'النوع': 'Type', 'عدد الوحدات': 'Units', 'المساحات م² (افصلي بفاصلة)': 'Sizes m² (comma separated)',
  'ارفعي صور الغرف الداخلية بجودة عالية. أول صورة تكون صورة الغلاف.': 'Upload high-quality interior photos. The first photo is the cover.',
  'الصور الأصلية من ملف الشركة ثابتة. الصور اللي تضيفينها تظهر بعدها في معرض المشروع.': 'Original photos from the company profile are fixed. Photos you add appear after them in the gallery.',
  'حذف المشروع وكل صوره؟': 'Delete the project and all its photos?', 'حذف الصورة؟': 'Delete this photo?', 'تم حذف المشروع': 'Project deleted', 'تم حذف الصورة': 'Photo deleted',
  'تم رفع الصور': 'Photos uploaded', 'جارٍ رفع الصور…': 'Uploading photos…', 'تمت إضافة المشروع': 'Project added', 'تم حفظ البيانات': 'Details saved', 'تم الحفظ': 'Saved',
  'سول حطين': 'SOUL Hittin', 'مبنى المغرزات': 'Almughrizat Building', 'مبنى مشارف': 'Masharef Building', 'مكين 30': 'Makeen 30', 'نيرفانا 12': 'Nirvana 12',
  'العجلان ريفيرا 12': 'Al Ajlan Riviera 12', 'العجلان ريفيرا 21': 'Al Ajlan Riviera 21', 'العجلان ريفيرا 37': 'Al Ajlan Riviera 37', 'المجيدية 116': 'Almajidiya 116',
  'المجيدية ريزيدنس 111': 'Al Majidiya Residence 111', 'جوهرة النرجس 8': 'Jawhara Al Narjis 8', 'المجيدية 70': 'Almajidiya 70', 'المجيدية 130': 'Almajidiya 130',
  // section photos
  'استبدلي أي صورة في الموقع. «استرجاع» يرجّع الصورة الأصلية.': 'Replace any photo on the site. "Restore" brings back the original.',
  'استبدال': 'Replace', 'استرجاع': 'Restore', 'مُستبدلة': 'Replaced', 'تم استبدال الصورة': 'Photo replaced', 'تم استرجاع الصورة الأصلية': 'Original photo restored', 'جارٍ رفع الصورة…': 'Uploading photo…',
  'الصفحة الرئيسية — بطاقات الخدمات': 'Home — service cards', 'صفحة الخدمات': 'Services page', 'أثرنا والمدن': 'Our impact & cities', 'خلفية «أثرنا»': '"Our impact" background',
  'الرياض': 'Riyadh', 'المدينة المنورة': 'Madinah', 'جدة': 'Jeddah', 'القطاعات (الرئيسية)': 'Sectors (home)', 'القطاعات (صفحة الخدمات)': 'Sectors (services page)',
  'الضيافة': 'Hospitality', 'السكني': 'Residential', 'التجاري': 'Commercial', 'الحكومي والمؤسسي': 'Government & institutional',
  'من نحن — المبادئ والدعوة': 'About — principles & call to action', 'الدقة': 'Precision', 'التحكم': 'Control', 'القيمة': 'Value', 'بانر «لنبدأ مشروعك»': '"Start your project" banner',
  'مراحل العمل': 'Our process', '1 الفهم': '1 Understand', '2 التصميم': '2 Design', '3 الاعتماد': '3 Approve', '4 التخطيط': '4 Plan', '5 التنفيذ': '5 Execute', '6 التحكم': '6 Control', '7 التسليم': '7 Deliver',
  // questions
  'أسئلة نموذج التواصل': 'Contact form questions', 'إضافة سؤال': 'Add question', 'سؤال جديد': 'New question', 'إلغاء': 'Cancel',
  'كل أسئلة نموذج «ابدأ مشروعك» هنا. غيّري النص ثم اضغطي «حفظ». الأسئلة المضافة تظهر في النموذج بعد الميزانية، وإجاباتها تصل في الإيميل وفي جدول الطلبات.': 'All questions of the "Start a project" form. Edit the wording, then press "Save". Added questions appear after the budget; their answers arrive by email and in the enquiries table.',
  'العربي': 'Arabic', 'إجباري': 'Required', 'إجباري دائمًا': 'Always required', 'إجباري ✓': 'Required ✓', 'اختياري': 'Optional', 'إخفاء': 'Hide', 'إظهار': 'Show', 'حفظ': 'Save',
  'السؤال (عربي)': 'Question (Arabic)', 'السؤال (English)': 'Question (English)', 'نوع الإجابة': 'Answer type', 'نص قصير': 'Short text', 'نص طويل': 'Long text', 'رقم': 'Number', 'قائمة اختيارات': 'Choice list',
  'الاختيارات (لنوع «قائمة اختيارات»): كل اختيار في سطر بالشكل': 'Choices (for "Choice list"): one per line, as', 'English | عربي': 'English | Arabic', 'إضافة السؤال': 'Add question',
  'لأعلى': 'Move up', 'لأسفل': 'Move down', 'أضيفي اختيارين على الأقل للقائمة.': 'Add at least two choices.',
  'حذف السؤال؟ الإجابات السابقة تبقى محفوظة في الطلبات.': 'Delete this question? Earlier answers stay saved in the enquiries.',
  'تمت إضافة السؤال': 'Question added', 'تم حذف السؤال': 'Question deleted', 'تم حفظ الأسئلة الأساسية': 'Questions saved',
  // settings
  'أرقام «أثرنا»': '"Our impact" numbers', 'الوحدات المسلّمة أو قيد التنفيذ': 'Units delivered or in progress', 'المدن': 'Cities', 'القطاعات': 'Sectors', 'مراحل التنفيذ': 'Delivery stages',
  'لاحقة (مثل +)': 'Suffix (e.g. +)', 'بيانات التواصل': 'Contact details', 'رقم الهاتف (للاتصال)': 'Phone (for calls)', 'رقم الهاتف (كما يظهر)': 'Phone (as displayed)',
  'بريد استلام الطلبات من النموذج يبقى info@slab.sa (إعداد على السيرفر).': 'Form enquiries are still delivered to info@slab.sa (a server setting).', 'تم حفظ الإعدادات': 'Settings saved',
  // users
  'كل بريد هنا يقدر يدخل صفحة الموظفين برمز يصله على الإيميل.': 'Every address here can sign in to the staff page with an emailed code.',
  'أنتِ': 'You', 'إزالة': 'Remove', 'إضافة مستخدم': 'Add user', 'إضافة': 'Add', 'تمت إضافة المستخدم': 'User added', 'تمت الإزالة': 'Removed'
};
// Strings built from a number, a name or a message.
const EN_PATTERNS = [
  [/^(\d+) من (\d+) طلبات$/, (m, a, b) => `${a} of ${b} enquiries`],
  [/^(\d+) صور$/, (m, a) => `${a} ${a === '1' ? 'photo' : 'photos'}`],
  [/^المشاريع \((\d+)\)$/, (m, a) => `Projects (${a})`], [/^الصور \((\d+)\)$/, (m, a) => `Photos (${a})`],
  [/^أضافه (.+)$/, (m, a) => `Added by ${a}`],
  [/^\+ (.+)$/, (m, a) => `+ ${T(a)}`],
  [/^(.+?) · (.+)$/, (m, a, b) => `${T(a)} · ${b}`],
  [/^(.+?)(: .*)$/, (m, a, b) => (EN[a] ? EN[a] + b : m)],
  [/^تعذّر التحميل: (.*)$/, (m, a) => `Could not load: ${a}`], [/^تعذّر عرض الصور: (.*)$/, (m, a) => `Could not show photos: ${a}`],
  [/^إزالة (.+) من صفحة الموظفين؟$/, (m, a) => `Remove ${a} from the staff page?`], [/^الملف ليس صورة: (.+)$/, (m, a) => `Not an image: ${a}`]
];
function T(s) {
  if (LANG !== 'en' || !s) return s;
  const key = s.trim();
  if (EN[key]) return s.replace(key, EN[key]);
  for (const [re, fn] of EN_PATTERNS) { const m = key.match(re); if (m) { const out = fn(...m); if (out !== key) return s.replace(key, out); } }
  return s;
}
function translateTree(root) {
  if (LANG !== 'en' || !root) return;
  if (root.nodeType === 3) { if (!(root.parentElement && root.parentElement.closest('[data-raw]'))) root.nodeValue = T(root.nodeValue); return; }
  if (root.nodeType !== 1 || root.closest('[data-raw]')) return;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) if (!(n.parentElement && n.parentElement.closest('[data-raw]')) && /[؀-ۿ]/.test(n.nodeValue)) n.nodeValue = T(n.nodeValue);
  [root, ...root.querySelectorAll('[placeholder],[aria-label],[title]')].forEach(el => ['placeholder', 'aria-label', 'title'].forEach(a => {
    const v = el.getAttribute && el.getAttribute(a);
    if (v && /[؀-ۿ]/.test(v)) el.setAttribute(a, T(v));
  }));
}
new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(translateTree))).observe(document.body, {childList: true, subtree: true, characterData: false});
const ask = msg => confirm(T(msg));
function applyLang() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'en' ? 'ltr' : 'rtl';
  document.title = LANG === 'en' ? 'Staff page | SLAB' : 'صفحة الموظفين | SLAB';
}
const langButton = () => `<button type="button" class="admin-lang" data-act="lang" data-raw>${LANG === 'en' ? 'العربية' : 'English'}</button>`;
applyLang();

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
  <div class="admin-login-top">${langButton()}<a class="admin-back" href="./">→ العودة للموقع</a></div>
  <h1>دخول الموظفين</h1>
  ${step === 'email' ? `<form id="login-email" novalidate>
    <label for="login-mail">البريد الإلكتروني</label>
    <input id="login-mail" type="email" dir="ltr" autocomplete="email" required value="${esc(email)}">
    <button class="admin-btn" type="submit">إرسال رمز الدخول</button>
    <button class="admin-link-btn" type="button" data-act="login-have-code">عندي رمز وصلني بالإيميل</button>
    <p class="admin-hint">يصلك رمز من 6 أرقام على بريدك. الدخول متاح فقط للإيميلات المضافة كمستخدمين.</p>
  </form>` : `<form id="login-code" novalidate>
    <p class="admin-hint">أرسلنا رمز الدخول إلى <b dir="ltr">${esc(email)}</b>. اكتبيه هنا. إذا ما وصل خلال دقيقة، شيّكي مجلد Junk.</p>
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
        if (allowed && allowed.code === 'PGRST202') throw new Error('صفحة الموظفين غير مفعّلة بعد: شغّلي ملف supabase/admin_setup.sql في Supabase.');
        if (allowed !== true) throw new Error('هذا البريد غير مضاف كمستخدم في صفحة الموظفين.');
        // The email carries a 6-digit code (custom template) or, with Supabase's default template, a sign-in link back to this page.
        await auth(`otp?redirect_to=${encodeURIComponent(location.origin + location.pathname)}`, {email: mail, create_user: true});
        renderLogin('code', mail);
      } else {
        const code = f.querySelector('input').value.replace(/\D/g, '');
        saveSession(await auth('verify', {type: 'email', email, token: code}));
        renderApp();
      }
    } catch (err) {
      msg.textContent = /error sending/i.test(err.message) ? 'تعذّر إرسال إيميل الدخول. تأكدي من إعداد SMTP في Supabase (اسم المستخدم resend وكلمة المرور = مفتاح Resend).' : /rate limit|seconds/i.test(err.message) ? 'طلبت رموزًا كثيرة، انتظري دقيقة ثم حاولي مرة ثانية.' : /expired|invalid/i.test(err.message) ? 'الرمز غير صحيح أو منتهي.' : err.message;
      btn.disabled = false;
    }
  });
}

/* ---------- App shell ---------- */
// Line icons (24px grid, stroke = currentColor) for the menu, tabs and table headers.
const AI = Object.fromEntries(Object.entries({
  enquiries: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  projects: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
  images: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  questions: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  settings: '<path d="M4 20V10M9 20V4M14 20v-7M19 20V8M3 20h18"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.6c1.8.7 3 2.5 3 5.4"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  coins: '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7M10 16.8c.9.5 2.4.7 4 .7 2.8 0 5-1.1 5-2.5v-4c0-1-1.2-1.9-3-2.3M4 11v4c0 1.4 2.2 2.5 5 2.5"/>',
  status: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h8M6 8v8M18 8v8M8 18h8"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  dots: '<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>'
}).map(([k, d]) => [k, `<svg class="ai" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`]));
const LOGO_MARK = '<svg class="admin-mark" viewBox="0 0 60 44" aria-hidden="true"><path d="M2 14 22 2h36v14L38 24H2z" fill="#adbfca"/><path d="M2 38 22 26h36v10L38 42H2z" fill="#c7d6ca"/></svg>';
const TABS = [['enquiries', 'الطلبات'], ['projects', 'المشاريع والصور'], ['images', 'صور الأقسام'], ['questions', 'أسئلة النموذج'], ['settings', 'الأرقام والإعدادات'], ['users', 'المستخدمين']];
async function renderApp() {
  $root.innerHTML = `<div class="admin-layout">
  <aside class="admin-side">
    <a class="admin-logo" href="./">${LOGO_MARK}<span><b>SLAB</b><small>صفحة الموظفين</small></span></a>
    <nav class="admin-side-nav">${TABS.map(([k, l]) => `<button type="button" data-tab="${k}" aria-current="${state.tab === k}">${AI[k]}<span>${l}</span></button>`).join('')}</nav>
  </aside>
  <div class="admin-body-col">
    <header class="admin-topbar">
      <button type="button" class="admin-bell" data-act="bell" aria-label="الطلبات الجديدة">${AI.bell}<i id="admin-bell-dot" hidden></i></button>
      <span class="admin-who">${AI.user}<span dir="ltr">${esc(session.email)}</span></span>
      ${langButton()}
      <button type="button" class="admin-logout" data-act="logout">${AI.logout}<span>تسجيل الخروج</span></button>
    </header>
    <main id="admin-main" class="admin-main"><p class="admin-hint">جارٍ التحميل…</p></main>
  </div></div>`;
  await loadTab();
}
async function loadTab() {
  const main = document.getElementById('admin-main');
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute(b.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-current', String(b.dataset.tab === state.tab)));
  try {
    const d = state.data;
    if (state.tab === 'enquiries' || !d.enquiries) d.enquiries = await rest('project_enquiries?select=*&order=created_at.desc');
    if (state.tab === 'projects') [d.cms, d.photos] = await Promise.all([rest('cms_projects?select=*&order=position,created_at'), rest('project_photos?select=*&order=position,id')]);
    if (state.tab === 'images') d.images = await rest('image_overrides?select=*');
    if (state.tab === 'questions') [d.questions, d.settings] = await Promise.all([rest('form_questions?select=*&order=position,id'), rest('site_settings?select=*')]);
    if (state.tab === 'settings') d.settings = await rest('site_settings?select=*');
    if (state.tab === 'users') d.users = await rest('site_admins?select=*&order=created_at');
    updateBell();
    main.innerHTML = VIEWS[state.tab]();
  } catch (e) {
    main.innerHTML = `<p class="admin-msg">تعذّر التحميل: ${esc(e.message)}</p>
      <p class="admin-hint">إذا كانت هذه أول مرة، تأكدي أن ملف <code>supabase/admin_setup.sql</code> تم تشغيله في Supabase، وأن بريدك مضاف في جدول المستخدمين.</p>`;
  }
}
// Dot on the bell while any enquiry is still "new".
function updateBell() {
  const dot = document.getElementById('admin-bell-dot');
  if (dot) dot.hidden = !(state.data.enquiries || []).some(e => e.status === 'new');
}

/* ---------- Enquiries ---------- */
function filteredEnquiries() {
  const q = state.filter.q.trim().toLowerCase();
  return (state.data.enquiries || []).filter(e => (!state.filter.status || e.status === state.filter.status)
    && (!q || [e.full_name, e.email, e.phone, e.project_location, e.message].join(' ').toLowerCase().includes(q)));
}
const fmtDate = s => new Date(s).toLocaleString(LANG === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
function enquiriesView() {
  const list = filteredEnquiries();
  const th = (icon, label) => `<th><span>${AI[icon]}${label}</span></th>`;
  return `<section><div class="admin-pagehead">
    <div><h2>${AI.enquiries}الطلبات</h2><small>${list.length} من ${(state.data.enquiries || []).length} طلبات</small></div>
    <div class="admin-tools">
      <label class="admin-search">${AI.search}<input type="search" id="enq-search" placeholder="بحث بالاسم أو الجوال أو البريد…" value="${esc(state.filter.q)}"></label>
      <select id="enq-status" aria-label="الحالة"><option value="">كل الحالات</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${state.filter.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <button type="button" class="admin-btn admin-export" data-act="export">${AI.download}<span>تصدير Excel</span></button></div></div>
  ${list.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${th('calendar', 'التاريخ')}${th('user', 'الاسم')}${th('phone', 'الجوال')}${th('layers', 'القطاع')}${th('pin', 'المدينة')}${th('coins', 'الميزانية')}${th('status', 'الحالة')}<th>الإجراءات</th></tr></thead><tbody>
  ${list.map(e => `<tr class="${state.open === e.id ? 'is-open' : ''}"><td>${fmtDate(e.created_at)}</td><td>${esc(e.full_name)}</td><td dir="ltr"><a href="tel:${esc(e.phone)}">${esc(e.phone)}</a></td><td>${SECTORS[e.project_type] || esc(e.project_type)}</td>
    <td>${esc(e.project_location)}</td><td>${BUDGETS[e.budget] || '—'}</td>
    <td><select class="admin-status s-${esc(e.status)}" data-act="status" data-id="${e.id}" aria-label="الحالة">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${e.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
    <td class="admin-actions"><button type="button" class="admin-icon-btn" data-act="toggle-enq" data-id="${e.id}" aria-label="${state.open === e.id ? 'إخفاء التفاصيل' : 'التفاصيل'}" title="التفاصيل">${AI.open}</button>
      <span class="admin-menu-wrap"><button type="button" class="admin-icon-btn" data-act="enq-menu" data-id="${e.id}" aria-label="المزيد" aria-expanded="${state.menu === e.id}">${AI.dots}</button>
      ${state.menu === e.id ? `<span class="admin-menu" role="menu"><a role="menuitem" href="mailto:${esc(e.email)}">مراسلة العميل</a><a role="menuitem" href="tel:${esc(e.phone)}">اتصال</a><button type="button" role="menuitem" class="danger" data-act="delete-enq" data-id="${e.id}">حذف الطلب</button></span>` : ''}</span></td></tr>
    ${state.open === e.id ? `<tr class="admin-detail"><td colspan="8"><dl>
      <dt>البريد</dt><dd dir="ltr"><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></dd>
      <dt>الخدمات</dt><dd>${(e.services || []).map(s => SERVICES[s] || esc(s)).join('، ')}</dd>
      ${Object.values(e.answers || {}).map(a => `<dt>${esc(a.question_ar)}</dt><dd>${esc(a.answer)}</dd>`).join('')}
      ${(e.attachments || []).length ? `<dt>صور المشروع</dt><dd><div class="admin-thumbs">${e.attachments.map(p => state.signed[p] ? `<a href="${esc(state.signed[p])}" target="_blank" rel="noopener"><img src="${esc(state.signed[p])}" alt=""></a>` : '<span class="admin-hint">جارٍ التحميل…</span>').join('')}</div></dd>` : ''}
      <dt>الرسالة</dt><dd class="pre">${esc(e.message)}</dd><dt>لغة النموذج</dt><dd>${e.language === 'ar' ? 'العربية' : 'English'}</dd></dl></td></tr>` : ''}`).join('')}
  </tbody></table></div>` : '<p class="admin-hint">لا توجد طلبات.</p>'}</section>`;
}
// CSV with a UTF-8 BOM so Excel opens Arabic text correctly.
function exportExcel() {
  const list = filteredEnquiries();
  const qCols = [];
  list.forEach(e => Object.entries(e.answers || {}).forEach(([id, a]) => { if (!qCols.some(c => c[0] === id)) qCols.push([id, a.question_ar]); }));
  const head = ['التاريخ', 'الاسم', 'الجوال', 'البريد', 'القطاع', 'الخدمات', 'المدينة', 'الميزانية', ...qCols.map(c => c[1]), 'الرسالة', 'عدد الصور', 'الحالة', 'لغة النموذج'];
  const rows = list.map(e => [fmtDate(e.created_at), e.full_name, e.phone, e.email, SECTORS[e.project_type] || e.project_type,
    (e.services || []).map(s => SERVICES[s] || s).join('، '), e.project_location, BUDGETS[e.budget] || '', ...qCols.map(c => ((e.answers || {})[c[0]] || {}).answer || ''),
    e.message, (e.attachments || []).length, STATUS[e.status] || e.status, e.language === 'ar' ? 'العربية' : 'English']);
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [head, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
  a.download = `slab-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// Client photos are private: show them through short-lived signed links (admins only, enforced by storage policy).
async function loadPhotos(e) {
  const paths = (e && e.attachments || []).filter(p => !state.signed[p]);
  if (!paths.length) return;
  try {
    const out = await api('/storage/v1/object/sign/enquiry-files', {method: 'POST', body: {expiresIn: 3600, paths}});
    out.forEach(o => { if (o.signedURL) state.signed[o.path] = `${SUPABASE_URL}/storage/v1${o.signedURL}`; });
    redraw();
  } catch (err) { toast('تعذّر عرض الصور: ' + err.message, true); }
}

/* ---------- Projects & photos ---------- */
// Built-in projects merged with their saved edits, followed by projects added in the panel.
function allProjects() {
  const cms = state.data.cms || [];
  const merged = BUILT_IN.map(b => { const o = cms.find(c => c.id === b.id); return o ? {...b, ...o, builtIn: true, images: b.images, override: true} : b; });
  return [...merged, ...cms.filter(c => !BUILT_IN_IDS.includes(c.id))];
}
// Project name in the panel's language; in Arabic the English name follows in small type. Never auto-translated.
const projectLabel = (p, small = 'span') => (LANG === 'en'
  ? `<b data-raw dir="ltr">${esc(p.name)}</b>`
  : `<b data-raw>${esc(p.name_ar)}</b> <${small} data-raw dir="ltr">${esc(p.name)}</${small}>`);
function projectsView() {
  const d = state.data;
  const all = allProjects();
  const sel = state.project && all.find(p => p.id === state.project);
  const added = id => (d.photos || []).filter(x => x.project_id === id);
  const photoCount = p => (p.builtIn ? p.images : 0) + added(p.id).length;
  return `<section><div class="admin-head"><h2>المشاريع والصور</h2></div>
  <div class="admin-grid2">
  <div class="admin-card"><div class="admin-head"><h3>المشاريع (${all.length})</h3><button type="button" class="admin-btn" data-act="new-project">+ مشروع جديد</button></div>
  <ul class="admin-list">${all.map(p => `<li class="${state.project === p.id ? 'is-sel' : ''}">
    <button type="button" class="admin-project-pick" data-act="pick-project" data-id="${esc(p.id)}">${projectLabel(p)}</button>
    <span class="admin-count">${photoCount(p)} صور</span>
    <span class="admin-tag">${p.published === false ? 'مخفي' : p.builtIn ? 'أساسي' : 'مضاف'}</span></li>`).join('')}</ul></div>
  <div class="admin-card" id="project-panel">${sel ? projectEditor(sel, added(sel.id)) : newProjectForm()}</div></div></section>`;
}
function projectFields(p = {}) {
  return `<label>الاسم (عربي)<input name="name_ar" required maxlength="80" value="${esc(p.name_ar)}"></label><label>الاسم (English)<input name="name" required maxlength="80" value="${esc(p.name)}"></label>
    <label>العميل (عربي)<input name="client_ar" maxlength="80" value="${esc(p.client_ar)}"></label><label>العميل (English)<input name="client" maxlength="80" value="${esc(p.client)}"></label>
    ${p.builtIn ? '' : `<label>المدينة (عربي)<input name="city_ar" maxlength="60" value="${esc(p.city_ar || 'الرياض')}"></label><label>المدينة (English)<input name="city" maxlength="60" value="${esc(p.city || 'Riyadh')}"></label>
    <label>النوع<select name="type">${Object.entries(SECTORS).map(([k, v]) => `<option value="${k}" ${p.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`}
    <label>عدد الوحدات<input name="units" type="number" min="0" value="${esc(p.units ?? '')}"></label>
    <label class="span2">المساحات م² (افصلي بفاصلة)<input name="sizes" placeholder="120, 145" value="${esc((p.sizes || []).join(', '))}"></label>`;
}
function newProjectForm() {
  return `<h3>إضافة مشروع جديد</h3><form id="new-project" class="admin-form">${projectFields()}
    <label class="span2">الصور<input name="files" type="file" accept="image/*" multiple required></label>
    <button class="admin-btn span2" type="submit">إضافة المشروع</button>
    <p class="admin-hint span2">ارفعي صور الغرف الداخلية بجودة عالية. أول صورة تكون صورة الغلاف.</p></form>`;
}
function projectEditor(p, added) {
  const own = p.builtIn ? Array.from({length: p.images}, (_, i) => `${PUBLIC_BASE}projects/${p.id}_${i + 1}.webp`) : [];
  return `<div class="admin-head"><h3>${projectLabel(p, 'small')}</h3>
    <div class="admin-tools"><a class="admin-link-btn" href="./#/projects/${esc(p.id)}" target="_blank" rel="noopener">عرض في الموقع</a>
    <button type="button" class="admin-link-btn" data-act="toggle-publish" data-id="${esc(p.id)}">${p.published === false ? 'إظهار في الموقع' : 'إخفاء من الموقع'}</button>
    ${p.builtIn ? '' : `<button type="button" class="admin-danger" data-act="delete-project" data-id="${esc(p.id)}">حذف المشروع</button>`}</div></div>
  <form id="edit-project" class="admin-form" data-id="${esc(p.id)}">${projectFields(p)}
    <button class="admin-btn span2" type="submit">حفظ البيانات</button></form>
  <h3 class="admin-sub">الصور (${own.length + added.length})</h3>
  <div class="admin-thumbs">${own.map(u => `<figure><img src="${u}" alt="" loading="lazy"><span class="admin-tag">أصلية</span></figure>`).join('')}
    ${added.map(ph => `<figure><img src="${esc(ph.url)}" alt="" loading="lazy"><button type="button" class="admin-danger" data-act="delete-photo" data-id="${ph.id}">حذف</button></figure>`).join('')}</div>
  <label class="admin-upload">+ إضافة صور<input type="file" accept="image/*" multiple data-act="add-photos" data-id="${esc(p.id)}"></label>
  ${p.builtIn ? '<p class="admin-hint">الصور الأصلية من ملف الشركة ثابتة. الصور اللي تضيفينها تظهر بعدها في معرض المشروع.</p>' : ''}`;
}
// Fields stored in cms_projects. For built-in projects the row only overrides text, units, sizes and visibility.
const projectRow = p => ({name: p.name, name_ar: p.name_ar, client: p.client || '', client_ar: p.client_ar || '', units: p.units ?? null, sizes: p.sizes || [],
  published: p.published !== false, ...(p.builtIn ? {} : {city: p.city, city_ar: p.city_ar, type: p.type})});
const formProject = (v, builtIn) => ({name: v('name'), name_ar: v('name_ar'), client: v('client'), client_ar: v('client_ar'),
  units: v('units') === '' ? null : Number(v('units')), sizes: v('sizes').split(/[,،]/).map(s => s.trim()).filter(Boolean),
  ...(builtIn ? {} : {city: v('city') || 'Riyadh', city_ar: v('city_ar') || 'الرياض', type: v('type')})});
async function saveProject(id, row) {
  const [saved] = await rest('cms_projects', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates,return=representation'}, body: {id, ...row}});
  state.data.cms = state.data.cms.filter(c => c.id !== id).concat(saved);
  redraw();
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
// The form's own fields, in page order. `flex`: can be made optional or hidden (the others are always required).
// Photos are optional by default; the other flexible fields are required by default.
const CORE_FIELDS = [
  ['full-name', 'الاسم الكامل', 'Full name'], ['email', 'البريد الإلكتروني', 'Email address'], ['phone', 'رقم الجوال', 'Phone number'],
  ['project-type', 'قطاع المشروع', 'Project sector'], ['services', 'الخدمات المطلوبة', 'Services required'],
  ['project-location', 'موقع المشروع (المدينة)', 'Project location (city)', true], ['budget', 'الميزانية التقديرية', 'Estimated budget', true],
  ['message', 'وصف المشروع', 'Project description'], ['attachments', 'صور المشروع', 'Project photos', true]
];
const coreRequired = (key, c) => (key === 'attachments' ? c.required === true : c.required !== false);
// One list: the form's own questions (editable labels) followed by the questions added here. A single form saves the labels.
function questionsView() {
  const qs = state.data.questions || [];
  const cfg = ((state.data.settings || []).find(s => s.key === 'form_fields') || {}).value || {};
  return `<section><div class="admin-head"><h2>أسئلة نموذج التواصل</h2><button type="button" class="admin-btn" data-act="q-add-open">+ إضافة سؤال</button></div>
  <p class="admin-hint">كل أسئلة نموذج «ابدأ مشروعك» هنا. غيّري النص ثم اضغطي «حفظ». الأسئلة المضافة تظهر في النموذج بعد الميزانية، وإجاباتها تصل في الإيميل وفي جدول الطلبات.</p>
  ${state.addQ ? `<div class="admin-card" id="add-question"><div class="admin-head"><h3>سؤال جديد</h3><button type="button" class="admin-link-btn" data-act="q-add-close">إلغاء</button></div><form id="new-question" class="admin-form">
    <label>السؤال (عربي)<input name="label_ar" required maxlength="200"></label><label>السؤال (English)<input name="label_en" required maxlength="200"></label>
    <label>نوع الإجابة<select name="kind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" name="required"> إجباري</label>
    <label class="span2">الاختيارات (لنوع «قائمة اختيارات»): كل اختيار في سطر بالشكل <code>English | عربي</code><textarea name="options" rows="4" placeholder="Within 3 months | خلال 3 أشهر"></textarea></label>
    <button class="admin-btn span2" type="submit">إضافة السؤال</button></form></div>` : ''}
  <form id="core-fields" class="admin-card"><ol class="admin-qs">
  ${CORE_FIELDS.map(([key, ar, en, flex]) => { const c = cfg[key] || {}; return `<li><div class="admin-core">
    <label>العربي<input name="${key}-ar" maxlength="120" value="${esc(c.label_ar || ar)}"></label>
    <label>English<input name="${key}-en" dir="ltr" maxlength="120" value="${esc(c.label_en || en)}"></label></div>
    <div class="admin-tools">${flex ? `<label class="check"><input type="checkbox" name="${key}-req" ${coreRequired(key, c) ? 'checked' : ''}> إجباري</label>
      <label class="check"><input type="checkbox" name="${key}-hide" ${c.hidden ? 'checked' : ''}> مخفي</label>` : '<span class="admin-tag">إجباري دائمًا</span>'}</div></li>`; }).join('')}
  ${qs.map((q, i) => `<li class="${q.active ? '' : 'is-off'}">
    <div class="admin-core-extra"><span class="admin-tag">مضاف</span> <b>${esc(q.label_ar)}</b> <span dir="ltr">${esc(q.label_en)}</span><br><small>${KINDS[q.kind]}${q.kind === 'select' ? ' · ' + (q.options || []).map(o => esc(o.ar)).join(' / ') : ''}</small></div>
    <div class="admin-tools"><button type="button" data-act="q-move" data-id="${q.id}" data-dir="-1" ${i ? '' : 'disabled'} aria-label="لأعلى">↑</button><button type="button" data-act="q-move" data-id="${q.id}" data-dir="1" ${i < qs.length - 1 ? '' : 'disabled'} aria-label="لأسفل">↓</button>
    <button type="button" class="admin-link-btn" data-act="q-required" data-id="${q.id}">${q.required ? 'إجباري ✓' : 'اختياري'}</button>
    <button type="button" class="admin-link-btn" data-act="q-toggle" data-id="${q.id}">${q.active ? 'إخفاء' : 'إظهار'}</button>
    <button type="button" class="admin-danger" data-act="q-delete" data-id="${q.id}">حذف</button></div></li>`).join('')}
  </ol><button class="admin-btn" type="submit">حفظ</button></form></section>`;
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
  <p class="admin-hint">كل بريد هنا يقدر يدخل صفحة الموظفين برمز يصله على الإيميل.</p>
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
  if (state.menu && !(e.target.closest && e.target.closest('.admin-menu-wrap'))) { state.menu = null; redraw(); }
  if (!t || t.tagName === 'SELECT' || t.type === 'file') return;
  if (t.dataset.tab) { state.tab = t.dataset.tab; state.open = null; loadTab(); return; }
  const id = t.dataset.id;
  const d = state.data;
  switch (t.dataset.act) {
    case 'logout': signOut(); break;
    case 'lang':
      LANG = LANG === 'en' ? 'ar' : 'en';
      try { localStorage.setItem('slab-admin-lang', LANG); } catch {}
      applyLang();
      if (session && session.refresh_token) renderApp(); else renderLogin();
      break;
    case 'bell': state.tab = 'enquiries'; state.filter.status = 'new'; state.open = null; loadTab(); break;
    case 'enq-menu': state.menu = state.menu === id ? null : id; redraw(); break;
    case 'login-restart': renderLogin('email'); break;
    case 'login-have-code': {
      // A code already arrived: go to the code step without requesting (and invalidating) a new one.
      const mail = (document.getElementById('login-mail').value || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { document.getElementById('login-msg').textContent = 'اكتبي بريدك أول.'; break; }
      renderLogin('code', mail); break;
    }
    case 'export': exportExcel(); break;
    case 'toggle-enq': state.open = state.open === id ? null : id; redraw(); if (state.open) loadPhotos(d.enquiries.find(x => x.id === id)); break;
    case 'q-add-open': case 'q-add-close':
      state.addQ = t.dataset.act === 'q-add-open'; redraw();
      if (state.addQ) document.getElementById('add-question').querySelector('input').focus();
      break;
    case 'delete-enq':
      if (ask('حذف هذا الطلب نهائيًا؟')) run(async () => { const gone = d.enquiries.find(x => x.id === id); await rest(`project_enquiries?id=eq.${id}`, {method: 'DELETE'}); if ((gone.attachments || []).length) await api('/storage/v1/object/enquiry-files', {method: 'DELETE', body: {prefixes: gone.attachments}}).catch(() => {}); d.enquiries = d.enquiries.filter(x => x.id !== id); redraw(); }, 'تم حذف الطلب');
      break;
    case 'pick-project': case 'new-project':
      state.project = t.dataset.act === 'pick-project' ? id : null; redraw();
      document.getElementById('project-panel').scrollIntoView({behavior: 'smooth', block: 'start'});
      break;
    case 'toggle-publish': run(async () => {
      const p = allProjects().find(x => x.id === id);
      await saveProject(id, {...projectRow(p), published: p.published === false});
    }, 'تم الحفظ'); break;
    case 'delete-project':
      if (ask('حذف المشروع وكل صوره؟')) run(async () => {
        const urls = d.photos.filter(x => x.project_id === id).map(x => x.url);
        await rest(`project_photos?project_id=eq.${encodeURIComponent(id)}`, {method: 'DELETE'});
        await rest(`cms_projects?id=eq.${encodeURIComponent(id)}`, {method: 'DELETE'});
        await Promise.all(urls.map(removeUpload));
        d.cms = d.cms.filter(x => x.id !== id); d.photos = d.photos.filter(x => x.project_id !== id); state.project = null; redraw();
      }, 'تم حذف المشروع');
      break;
    case 'delete-photo':
      if (ask('حذف الصورة؟')) run(async () => { const ph = d.photos.find(x => String(x.id) === id); await rest(`project_photos?id=eq.${id}`, {method: 'DELETE'}); await removeUpload(ph.url); d.photos = d.photos.filter(x => x !== ph); redraw(); }, 'تم حذف الصورة');
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
    case 'q-delete': if (ask('حذف السؤال؟ الإجابات السابقة تبقى محفوظة في الطلبات.')) run(async () => { await rest(`form_questions?id=eq.${id}`, {method: 'DELETE'}); d.questions = d.questions.filter(x => String(x.id) !== id); redraw(); }, 'تم حذف السؤال'); break;
    case 'user-delete': if (ask(`إزالة ${t.dataset.email} من صفحة الموظفين؟`)) run(async () => { await rest(`site_admins?email=eq.${encodeURIComponent(t.dataset.email)}`, {method: 'DELETE'}); d.users = d.users.filter(u => u.email !== t.dataset.email); redraw(); }, 'تمت الإزالة'); break;
  }
});

$root.addEventListener('input', e => {
  if (e.target.id === 'enq-search') { state.filter.q = e.target.value; const pos = e.target.selectionStart; redraw(); const s = document.getElementById('enq-search'); s.focus(); s.setSelectionRange(pos, pos); }
});

$root.addEventListener('change', e => {
  const t = e.target;
  const d = state.data;
  if (t.id === 'enq-status') { state.filter.status = t.value; redraw(); return; }
  if (t.dataset.act === 'status') run(async () => { await rest(`project_enquiries?id=eq.${t.dataset.id}`, {method: 'PATCH', body: {status: t.value}}); d.enquiries.find(x => x.id === t.dataset.id).status = t.value; t.className = `admin-status s-${t.value}`; updateBell(); }, 'تم تحديث الحالة');
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
  if (!['new-project', 'edit-project', 'core-fields', 'new-question', 'settings', 'new-user'].includes(f.id)) return;
  e.preventDefault();
  if (!f.reportValidity()) return;
  const v = name => (f.elements[name] ? f.elements[name].value.trim() : '');
  const d = state.data;
  const btn = f.querySelector('button[type=submit]');
  btn.disabled = true;
  const done = () => { btn.disabled = false; };
  if (f.id === 'new-project') run(async () => {
    let id = slugify(v('name'));
    while ([...BUILT_IN_IDS, ...d.cms.map(p => p.id)].includes(id)) id = id.slice(0, 36) + '-' + Math.floor(Math.random() * 90 + 10);
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
  if (f.id === 'core-fields') run(async () => {
    const value = Object.fromEntries(CORE_FIELDS.map(([key, , , flex]) => [key, {label_ar: v(key + '-ar'), label_en: v(key + '-en'),
      ...(flex ? {required: f.elements[key + '-req'].checked, hidden: f.elements[key + '-hide'].checked} : {})}]));
    await rest('site_settings', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates'}, body: {key: 'form_fields', value, updated_at: new Date().toISOString()}});
    d.settings = (d.settings || []).filter(s => s.key !== 'form_fields').concat({key: 'form_fields', value});
  }, 'تم حفظ الأسئلة الأساسية').finally(done);
  if (f.id === 'edit-project') run(async () => {
    const p = allProjects().find(x => x.id === f.dataset.id);
    await saveProject(p.id, {...projectRow(p), ...formProject(v, p.builtIn)});
  }, 'تم حفظ البيانات').finally(done);
  if (f.id === 'new-question') run(async () => {
    const kind = v('kind');
    const options = kind === 'select' ? v('options').split('\n').map(l => l.split('|').map(s => s.trim())).filter(([en]) => en).map(([en, ar]) => ({en, ar: ar || en})) : [];
    if (kind === 'select' && options.length < 2) throw new Error('أضيفي اختيارين على الأقل للقائمة.');
    const [q] = await rest('form_questions', {method: 'POST', headers: {Prefer: 'return=representation'}, body: {label_ar: v('label_ar'), label_en: v('label_en'), kind, options, required: f.elements.required.checked, position: d.questions.length}});
    d.questions.push(q); state.addQ = false; redraw();
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

// Returning from the sign-in link in the email: Supabase puts the session in the URL fragment.
async function start() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('access_token')) {
    history.replaceState(null, '', location.pathname);
    try {
      const user = await fetch(`${SUPABASE_URL}/auth/v1/user`, {headers: {apikey: SUPABASE_KEY, Authorization: `Bearer ${hash.get('access_token')}`}}).then(r => r.json());
      saveSession({access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token'), expires_in: +hash.get('expires_in') || 3600, user});
    } catch { session = null; }
  } else if (hash.get('error_description')) {
    history.replaceState(null, '', location.pathname);
    renderLogin();
    document.getElementById('login-msg').textContent = 'رابط الدخول غير صالح أو منتهي. اطلبي رمزًا جديدًا.';
    return;
  }
  if (session && session.refresh_token) renderApp(); else renderLogin();
}
start();
