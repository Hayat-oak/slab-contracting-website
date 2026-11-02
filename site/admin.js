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
const state = {tab: 'home', data: {}, filter: {q: '', status: ''}, open: null, project: null, addQ: false, signed: {}};
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
  // dashboard
  'الصفحة الرئيسية': 'Home', 'لوحة التحكم': 'Dashboard', 'نظرة عامة على أداء المنصة والطلبات': 'An overview of the website and its enquiries',
  'إجمالي الطلبات': 'Total enquiries', 'طلبات جديدة': 'New enquiries', 'المدن النشطة': 'Active cities', 'الطلبات حسب المدينة': 'Enquiries by city',
  'توزيع القطاعات': 'Enquiries by sector', 'طلبات': 'enquiries', 'أحدث الطلبات': 'Latest enquiries', 'إجراءات سريعة': 'Quick actions',
  'عرض الطلبات': 'View enquiries', 'إدارة الصور': 'Manage photos', 'أخرى': 'Other', 'غير محدد': 'Not specified',
  'مكة': 'Makkah', 'الدمام': 'Dammam', 'الخبر': 'Al Khobar', 'عرعر': 'Arar', 'أبها': 'Abha', 'تبوك': 'Tabuk', 'لا توجد بيانات بعد.': 'No data yet.',
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
  [/^لديك (\d+) طلبات جديدة$/, (m, a) => `You have ${a} new ${a === '1' ? 'enquiry' : 'enquiries'}`],
  [/^(.+?): (\d+) طلبات$/, (m, a, b) => `${T(a)}: ${b} ${b === '1' ? 'enquiry' : 'enquiries'}`],
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
  try { await task(); if (done) toast(done); } catch (e) {
    const m = e.message || String(e);
    // A column or table from supabase/staff_v2.sql is missing: the database update has not been run yet.
    toast(/schema cache|does not exist|PGRST20[45]/i.test(m) ? L('قاعدة البيانات تحتاج تحديث: شغّلي ملف supabase/staff_v2.sql في Supabase ← SQL Editor.', 'The database needs updating: run supabase/staff_v2.sql in Supabase → SQL Editor.') : m, true);
  }
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
// Text written in both languages (newer screens). Arabic strings without an English pair are translated through EN.
const L = (ar, en) => (LANG === 'en' ? en : ar);
// Line icons (24px grid, stroke = currentColor).
const AI = Object.fromEntries(Object.entries({
  home: '<path d="M4 11 12 4l8 7M6 9.5V20h4.5v-5h3v5H18V9.5"/>',
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
  status: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h8M6 8v8M18 8v8M8 18h8"/>',
  dots: '<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
  plus: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  bars: '<path d="M5 20V12M9.5 20V6M14 20v-9M18.5 20V4"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  filter: '<path d="M4 5h16l-6 7.5V19l-4 1v-7.5z"/>',
  sort: '<path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4"/>',
  chevron: '<path d="m15 6-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M9 9h6M9 12.5h4"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 6l2.6 1.5M17.2 16.5l2.6 1.5M4.2 18l2.6-1.5M17.2 7.5 19.8 6M2.5 12h3M18.5 12h3"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
  linkedin: '<path fill="currentColor" stroke="none" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4z"/>',
  whatsapp: '<path d="M4 20l1.3-4A8.5 8.5 0 1 1 8 18.8z"/><path d="M9 8.5c0 3.3 3 6.5 6.5 6.5l1-1.7-2-1-1 1c-1-.4-2.3-1.7-2.7-2.7l1-1-1-2z"/>',
  clip: '<path d="M8 12.5 14.5 6a3 3 0 0 1 4.2 4.2l-8 8A4.6 4.6 0 0 1 4 11.7L11 4.7"/>',
  log: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  arrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
}).map(([k, d]) => [k, `<svg class="ai" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`]));
const LOGO_MARK = '<svg class="admin-mark" viewBox="0 0 60 44" aria-hidden="true"><path d="M2 14 22 2h36v14L38 24H2z" fill="#c9d8cf"/><path d="M2 38 22 26h36v10L38 42H2z" fill="#e8efe9"/></svg>';
const TABS = [['home', 'الصفحة الرئيسية'], ['enquiries', 'الطلبات'], ['projects', 'المشاريع والصور'], ['images', 'صور الأقسام'], ['questions', 'أسئلة النموذج'], ['settings', 'الأرقام والإعدادات'], ['users', 'المستخدمين']];
// Roles are enforced by the database (supabase/staff_v2.sql); the panel only hides what a role cannot use.
const ROLES = {admin: ['مدير النظام', 'System manager'], projects: ['إدارة مشاريع', 'Project management'], finance: ['مالية', 'Finance']};
const ACCESS = {admin: TABS.map(t => t[0]), projects: ['home', 'enquiries', 'projects', 'images'], finance: ['home', 'enquiries']};
const role = () => (state.me && ACCESS[state.me.role] ? state.me.role : 'finance');
const can = (...roles) => roles.includes(role());
const canEdit = () => can('admin', 'projects');
const allowed = tab => ACCESS[role()].includes(tab);
const PAGE = 10;
Object.assign(state, {filter: {q: '', status: '', sector: ''}, page: 1, enqTab: 'info', projTab: 'all', imgGroup: null, setTab: 'contact', editRow: null, menu: null, bell: false, bellTab: 'all', bellAll: false, activity: [], log: {}, newEnq: false, addUser: false, editContact: false});

async function renderApp() {
  try { state.data.users = await rest('site_admins?select=*&order=created_at'); } catch { state.data.users = []; }
  const mine = state.data.users.find(u => u.email === session.email);
  state.me = {email: session.email, name: '', ...mine, role: (mine && mine.role) || 'admin'};
  if (!allowed(state.tab)) state.tab = 'home';
  const who = state.me.name || session.email;
  $root.innerHTML = `<div class="admin-layout">
  <aside class="admin-side">
    <a class="admin-logo" href="./">${LOGO_MARK}<span><b>SLAB</b><small>صفحة الموظفين</small></span></a>
    <nav class="admin-side-nav">${TABS.filter(([k]) => allowed(k)).map(([k, l]) => `<button type="button" data-tab="${k}" aria-current="${state.tab === k}">${AI[k]}<span>${l}</span></button>`).join('')}</nav>
  </aside>
  <div class="admin-body-col">
    <header class="admin-topbar">
      <div class="admin-bell-wrap" id="admin-bell-wrap"></div>
      <span class="admin-who">${AI.user}<span ${state.me.name ? 'data-raw' : 'dir="ltr"'}>${esc(who)}</span></span>
      ${langButton()}
      <button type="button" class="admin-logout" data-act="logout">${AI.logout}<span>تسجيل الخروج</span></button>
    </header>
    <main id="admin-main" class="admin-main"><p class="admin-hint">جارٍ التحميل…</p></main>
  </div></div>`;
  await loadTab();
  loadActivity();
}
async function loadTab() {
  const main = document.getElementById('admin-main');
  document.querySelectorAll('.admin-side-nav [data-tab]').forEach(b => b.setAttribute('aria-current', String(b.dataset.tab === state.tab)));
  try {
    const d = state.data;
    if (state.tab === 'enquiries' || state.tab === 'home' || !d.enquiries) d.enquiries = await rest('project_enquiries?select=*&order=created_at.desc');
    if (state.tab === 'projects') [d.cms, d.photos] = await Promise.all([rest('cms_projects?select=*&order=position,created_at'), rest('project_photos?select=*&order=position,id')]);
    if (state.tab === 'images') d.images = await rest('image_overrides?select=*');
    if (state.tab === 'questions') [d.questions, d.settings] = await Promise.all([rest('form_questions?select=*&order=position,id'), rest('site_settings?select=*')]);
    if (state.tab === 'settings') d.settings = await rest('site_settings?select=*');
    if (state.tab === 'users') d.users = await rest('site_admins?select=*&order=created_at');
    main.innerHTML = VIEWS[state.tab]();
    renderBell();
  } catch (e) {
    main.innerHTML = `<p class="admin-msg">تعذّر التحميل: ${esc(e.message)}</p>
      <p class="admin-hint">إذا كانت هذه أول مرة، تأكدي أن ملف <code>supabase/admin_setup.sql</code> تم تشغيله في Supabase، وأن بريدك مضاف في جدول المستخدمين.</p>`;
  }
}

/* ---------- Notifications (bell) ---------- */
// Built from the activity log (new enquiries, status changes, notes by others). Read state is kept per person in
// this browser; which kinds to show is chosen in Settings → Notifications.
const NOTIFY_KEY = 'slab-admin-notify', seenKey = () => 'slab-admin-seen:' + session.email;
const prefs = () => { try { return {created: true, status: true, note: true, ...JSON.parse(localStorage.getItem(NOTIFY_KEY) || '{}')}; } catch { return {created: true, status: true, note: true}; } };
const lastSeen = () => { try { return localStorage.getItem(seenKey()) || ''; } catch { return ''; } };
async function loadActivity() {
  try { state.activity = await rest('enquiry_activity?select=*&order=created_at.desc&limit=60'); state.logReady = true; }
  catch { // Before supabase/staff_v2.sql runs: new enquiries only.
    state.activity = (state.data.enquiries || []).slice(0, 30).map(e => ({id: 'c' + e.id, enquiry_id: e.id, kind: 'created', body: 'website', actor: null, created_at: e.created_at}));
    state.logReady = false;
  }
  renderBell();
}
const notifications = () => { const p = prefs(); return state.activity.filter(a => a.actor !== session.email && p[a.kind]); };
const staffName = email => { const u = (state.data.users || []).find(x => x.email === email); return (u && u.name) || email || L('الموقع', 'Website'); };
const enquiryOf = id => (state.data.enquiries || []).find(e => e.id === id);
const refOf = e => refNo(e);
function refNo(e) {
  if (!e) return '—';
  if (e.ref) return '#' + String(e.ref).padStart(3, '0');
  const asc = (state.data.enquiries || []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at));
  return '#' + String(asc.indexOf(e) + 1).padStart(3, '0');
}
function ago(s) {
  const sec = Math.round((new Date(s) - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(LANG === 'en' ? 'en' : 'ar', {numeric: 'auto'});
  for (const [unit, n] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(sec) >= n) return rtf.format(Math.round(sec / n), unit);
  return L('الآن', 'just now');
}
function noteText(a) {
  const e = enquiryOf(a.enquiry_id);
  const name = e ? e.full_name : '';
  const refOf = x => '⁦' + refNo(x) + '⁩'; // isolated so "#006" keeps its order inside Arabic text
  if (a.kind === 'created') return [L('طلب جديد', 'New enquiry'), a.body === 'staff' ? L(`أضاف ${staffName(a.actor)} طلبًا لـ ${name}`, `${staffName(a.actor)} added an enquiry for ${name}`) : L(`تم استلام طلب جديد من ${name}`, `New enquiry received from ${name}`), 'enquiries'];
  if (a.kind === 'status') { const to = (a.body || '').split('>')[1]; return [L('تحديث حالة طلب', 'Enquiry status updated'), L(`تم تغيير حالة ${refOf(e)} إلى ${STATUS[to] || to}`, `${refOf(e)} changed to ${T(STATUS[to] || to)}`), 'refresh']; }
  return [L('ملاحظة جديدة', 'New note'), L(`${staffName(a.actor)} أضاف ملاحظة على ${refOf(e)}`, `${staffName(a.actor)} added a note on ${refOf(e)}`), 'note'];
}
function renderBell() {
  const wrap = document.getElementById('admin-bell-wrap');
  if (!wrap) return;
  const all = notifications(), seen = lastSeen();
  const unread = all.filter(a => a.created_at > seen);
  const list = (state.bellTab === 'unread' ? unread : all).slice(0, state.bellAll ? 60 : 5);
  wrap.innerHTML = `<button type="button" class="admin-bell" data-act="bell" aria-expanded="${state.bell}" aria-label="${L('الإشعارات', 'Notifications')}${unread.length ? ` (${unread.length})` : ''}">${AI.bell}${unread.length ? `<i>${unread.length > 9 ? '9+' : unread.length}</i>` : ''}</button>
  ${state.bell ? `<div class="admin-notify" role="dialog" aria-label="${L('الإشعارات', 'Notifications')}">
    <h3>${L('الإشعارات', 'Notifications')}</h3>
    <div class="admin-seg" role="tablist"><button type="button" role="tab" data-act="bell-tab" data-tab-id="all" aria-selected="${state.bellTab === 'all'}">${L('الكل', 'All')} (${all.length})</button><button type="button" role="tab" data-act="bell-tab" data-tab-id="unread" aria-selected="${state.bellTab === 'unread'}">${L('غير مقروءة', 'Unread')} (${unread.length})</button></div>
    <ul>${list.map(a => { const [title, body, icon] = noteText(a); return `<li class="${a.created_at > seen ? 'is-unread' : ''}"><button type="button" data-act="open-enq" data-id="${a.enquiry_id}"><span class="admin-notify-icon">${AI[icon]}</span><span><b>${title}</b><span>${esc(body)}</span><small>${ago(a.created_at)}</small></span></button></li>`; }).join('') || `<li class="admin-hint">${L('لا توجد إشعارات.', 'No notifications.')}</li>`}</ul>
    <div class="admin-notify-foot">${unread.length ? `<button type="button" data-act="bell-read">${L('تحديد الكل كمقروء', 'Mark all as read')}</button>` : '<span></span>'}
      ${!state.bellAll && (state.bellTab === 'unread' ? unread : all).length > 5 ? `<button type="button" data-act="bell-all">${L('عرض جميع الإشعارات', 'View all notifications')} ${AI.arrow}</button>` : ''}</div></div>` : ''}`;
}

/* ---------- Home (dashboard) ---------- */
// Fixed colour per sector (validated for colour-blind separation); "other" covers unknown types in old rows.
const SECTOR_COLORS = {residential: '#007d63', hospitality: '#c9873a', commercial: '#4a80c4', institutional: '#8f9a35', other: '#8a8780'};
const HILLS = '<svg class="dash-deco" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V40l34-20 30 18 26-12 40 22 34-26 36 20v18z"/></svg>';
const SKYLINE = '<svg class="dash-deco" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V44h14V30h10v14h8V18h12v42h6V36h10V24h8v36h8V40h12V12h10v48h6V32h12v28h8V46h14V28h10v32z"/></svg>';
// The city is typed freely in either language; common spellings are counted as one city (shown in Arabic).
const CITY_ALIASES = {riyadh: 'الرياض', 'الرياض': 'الرياض', jeddah: 'جدة', jedda: 'جدة', 'جدة': 'جدة', 'جده': 'جدة', madinah: 'المدينة المنورة', medina: 'المدينة المنورة',
  'المدينة': 'المدينة المنورة', 'المدينة المنورة': 'المدينة المنورة', makkah: 'مكة', mecca: 'مكة', 'مكة': 'مكة', 'مكة المكرمة': 'مكة', dammam: 'الدمام', 'الدمام': 'الدمام',
  khobar: 'الخبر', 'al khobar': 'الخبر', 'الخبر': 'الخبر', arar: 'عرعر', 'عرعر': 'عرعر', abha: 'أبها', 'أبها': 'أبها', tabuk: 'تبوك', 'تبوك': 'تبوك'};
const cityName = s => { const c = (s || '').trim(); return CITY_ALIASES[c.toLowerCase()] || c || 'غير محدد'; };
function tally(list, key) {
  const m = new Map();
  list.forEach(e => { const k = key(e); m.set(k, (m.get(k) || 0) + 1); });
  return [...m].sort((a, b) => b[1] - a[1]);
}
const pill = s => `<span class="dash-pill s-${esc(s)}">${STATUS[s] || esc(s)}</span>`;
function homeView() {
  const all = state.data.enquiries || [];
  const status = s => all.filter(e => e.status === s).length;
  const cities = tally(all, e => cityName(e.project_location));
  const stat = (icon, tone, label, value, deco) => `<div class="dash-card dash-stat ${tone === 'dark' ? 'is-dark' : ''}"><span class="dash-stat-icon ${tone}">${AI[icon]}</span><div><span>${label}</span><b>${value}</b></div>${deco}</div>`;
  const empty = '<p class="admin-hint">لا توجد بيانات بعد.</p>';

  // Enquiries by city: top five, the rest folded into "other".
  const bars = cities.slice(0, 5);
  if (cities.length > 5) bars.push(['أخرى', cities.slice(5).reduce((s, c) => s + c[1], 0)]);
  const top = Math.max(1, ...bars.map(b => b[1]));
  const step = Math.ceil(top / 5);
  const axis = step * Math.ceil(top / step);
  const ticks = Array.from({length: axis / step + 1}, (_, i) => i * step);
  const cityChart = all.length ? `<div class="dash-bars"><div class="dash-yaxis" aria-hidden="true">${ticks.slice().reverse().map(t => `<span>${t}</span>`).join('')}</div>
    <div class="dash-plot">${ticks.map(t => `<i style="bottom:${t / axis * 100}%"></i>`).join('')}
    ${bars.map(([c, v]) => `<div class="dash-bar" title="${esc(c)}: ${v} طلبات"><span style="height:${v / axis * 100}%"><b>${v}</b></span><small>${esc(c)}</small></div>`).join('')}</div></div>` : empty;

  // Sector donut: one ring segment per sector with a 2-unit gap between segments; the percentages are in the legend.
  const known = Object.keys(SECTORS).map(k => [k, all.filter(e => e.project_type === k).length]);
  const other = all.length - known.reduce((s, x) => s + x[1], 0);
  const slices = [...known, ...(other ? [['other', other]] : [])];
  const R = 70, C = 2 * Math.PI * R, shown = slices.filter(s => s[1]);
  let acc = 0;
  const arcs = shown.map(([k, v]) => {
    const len = v / all.length * C, gap = shown.length > 1 ? 2 : 0, name = SECTORS[k] || 'أخرى';
    const seg = `<circle cx="100" cy="100" r="${R}" stroke="${SECTOR_COLORS[k]}" stroke-dasharray="${Math.max(len - gap, .5)} ${C}" stroke-dashoffset="${-acc}" transform="rotate(-90 100 100)"><title>${name}: ${v} طلبات</title></circle>`;
    acc += len;
    return seg;
  }).join('');
  const donut = all.length ? `<div class="dash-donut-wrap"><ul class="dash-legend">${slices.map(([k, v]) => `<li><i style="background:${SECTOR_COLORS[k]}"></i><span>${SECTORS[k] || 'أخرى'}</span><b dir="ltr">${Math.round(v / all.length * 100)}% (${v})</b></li>`).join('')}</ul>
    <svg class="dash-donut" viewBox="0 0 200 200" role="img" aria-label="توزيع القطاعات">${arcs}<circle class="dash-hole" cx="100" cy="100" r="46"/><text class="dash-total" x="100" y="96">${all.length}</text><text class="dash-total-label" x="100" y="120">طلبات</text></svg></div>` : empty;

  const first = (state.me.name || session.email.split('@')[0]).split(/\s+/)[0];
  const quick = [
    canEdit() && `<button type="button" data-act="new-enq">${AI.plus}<span>${L('إضافة طلب', 'Add enquiry')}</span></button>`,
    `<button type="button" data-act="export">${AI.download}<span>تصدير Excel</span></button>`,
    canEdit() ? `<button type="button" data-tab="images">${AI.projects}<span>${L('إدارة الصور', 'Manage photos')}</span></button>` : `<button type="button" data-tab="enquiries">${AI.enquiries}<span>${L('عرض الطلبات', 'View enquiries')}</span></button>`
  ].filter(Boolean).join('');
  return `<section class="dash">
  <div class="dash-hero"><div><h2>${AI.home}<span>${L('مرحبًا،', 'Welcome,')} <span data-raw>${esc(first)}</span></span></h2><p>${L('نظرة عامة على أداء المشاريع والطلبات', 'An overview of projects and enquiries')}</p></div></div>
  <div class="dash-stats">
    ${stat('layers', 'warm', 'إجمالي الطلبات', all.length, HILLS)}${stat('plus', 'warm', 'طلبات جديدة', status('new'), HILLS)}
    ${stat('phone', 'sage', 'تم التواصل', status('contacted'), HILLS)}${stat('pin', 'sage', 'المدن النشطة', cities.filter(c => c[0] !== 'غير محدد').length, SKYLINE)}</div>
  <div class="dash-row">
    <div class="dash-card"><h3>${AI.pie}توزيع القطاعات</h3>${donut}</div>
    <div class="dash-card"><h3>${AI.bars}الطلبات حسب المدينة</h3>${cityChart}</div></div>
  <div class="dash-row dash-row-b">
    <div class="dash-card"><h3>${AI.calendar}أحدث الطلبات</h3>
      ${all.length ? `<div class="admin-table-wrap"><table class="admin-table dash-latest"><thead><tr><th>الاسم</th><th>القطاع</th><th>المدينة</th><th>الحالة</th><th>${L('تاريخ الطلب', 'Date')}</th></tr></thead><tbody>
      ${all.slice(0, 5).map(e => `<tr><td><button type="button" class="dash-open" data-act="open-enq" data-id="${e.id}">${esc(e.full_name)}</button></td><td>${SECTORS[e.project_type] || esc(e.project_type)}</td><td>${esc(e.project_location)}</td><td>${pill(e.status)}</td><td>${fmtDay(e.created_at)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="admin-hint">لا توجد طلبات.</p>'}</div>
    <div class="dash-card"><h3>${AI.bolt}إجراءات سريعة</h3><div class="dash-quick">${quick}</div></div></div></section>`;
}

/* ---------- Enquiries ---------- */
function filteredEnquiries() {
  const q = state.filter.q.trim().toLowerCase();
  return (state.data.enquiries || []).filter(e => (!state.filter.status || e.status === state.filter.status) && (!state.filter.sector || e.project_type === state.filter.sector)
    && (!q || [e.full_name, e.email, e.phone, e.project_location, e.message, refOf(e)].join(' ').toLowerCase().includes(q)));
}
const fmtDate = s => new Date(s).toLocaleString(LANG === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
const fmtDay = s => new Date(s).toLocaleDateString('en-CA');
const statusSelect = (e, cls = '') => (canEdit()
  ? `<select class="admin-status s-${esc(e.status)} ${cls}" data-act="status" data-id="${e.id}" aria-label="الحالة">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${e.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`
  : pill(e.status));
function enquiriesView() {
  const e = state.open && enquiryOf(state.open);
  if (e) return enquiryDetail(e);
  const all = state.data.enquiries || [], list = filteredEnquiries();
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  state.page = Math.min(state.page, pages);
  const rows = list.slice((state.page - 1) * PAGE, state.page * PAGE);
  const th = (icon, label) => `<th><span>${icon ? AI[icon] : ''}${label}</span></th>`;
  return `<section><div class="admin-pagehead">
    <div><h2>${AI.enquiries}الطلبات</h2><small>${L('إدارة ومتابعة جميع الطلبات', 'Manage and follow up every enquiry')}</small></div>
    ${canEdit() ? `<button type="button" class="admin-btn admin-primary" data-act="new-enq">${AI.add}<span>${L('طلب جديد', 'New enquiry')}</span></button>` : ''}</div>
  ${state.newEnq ? newEnquiryForm() : ''}
  <div class="admin-toolbar">
    <label class="admin-search">${AI.search}<input type="search" id="enq-search" placeholder="${L('بحث بالاسم أو رقم الطلب…', 'Search by name or enquiry number…')}" value="${esc(state.filter.q)}"></label>
    <select id="enq-sector" aria-label="القطاع"><option value="">${L('كل القطاعات', 'All sectors')}</option>${Object.entries(SECTORS).map(([k, v]) => `<option value="${k}" ${state.filter.sector === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <select id="enq-status" aria-label="الحالة"><option value="">كل الحالات</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${state.filter.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <button type="button" class="admin-icon-btn admin-boxed" data-act="filter-reset" title="${L('مسح الفلاتر', 'Clear filters')}" aria-label="${L('مسح الفلاتر', 'Clear filters')}">${AI.filter}</button>
    <button type="button" class="admin-btn admin-ghost" data-act="export">${AI.download}<span>تصدير Excel</span></button>
  </div>
  ${list.length ? `<div class="admin-table-wrap"><table class="admin-table admin-enq"><thead><tr>
    ${th('', '#')}${th('user', 'الاسم')}${th('phone', 'الجوال')}${th('layers', 'القطاع')}${th('pin', 'المدينة')}${th('status', 'الحالة')}${th('calendar', L('تاريخ الطلب', 'Date'))}<th><span class="visually-hidden">الإجراءات</span></th></tr></thead><tbody>
  ${rows.map(e => `<tr>
    <td class="admin-ref" dir="ltr">${refOf(e).slice(1)}</td>
    <td><button type="button" class="dash-open" data-act="open-enq" data-id="${e.id}">${esc(e.full_name)}</button></td>
    <td dir="ltr"><a href="tel:${esc(e.phone)}">${esc(e.phone)}</a></td><td>${SECTORS[e.project_type] || esc(e.project_type)}</td><td>${esc(e.project_location)}</td>
    <td>${statusSelect(e)}</td><td>${fmtDay(e.created_at)}</td>
    <td class="admin-actions"><span class="admin-menu-wrap"><button type="button" class="admin-icon-btn" data-act="menu" data-id="${e.id}" aria-label="المزيد" aria-expanded="${state.menu === e.id}">${AI.dots}</button>
      ${state.menu === e.id ? `<span class="admin-menu" role="menu"><button type="button" role="menuitem" data-act="open-enq" data-id="${e.id}">التفاصيل</button><a role="menuitem" href="mailto:${esc(e.email)}">مراسلة العميل</a><a role="menuitem" href="tel:${esc(e.phone)}">اتصال</a>${can('admin') ? `<button type="button" role="menuitem" class="danger" data-act="delete-enq" data-id="${e.id}">حذف الطلب</button>` : ''}</span>` : ''}</span></td></tr>`).join('')}
  </tbody></table>
  <div class="admin-pager"><span>${L(`عرض ${rows.length} من ${list.length} طلبات`, `Showing ${rows.length} of ${list.length} enquiries`)}</span>
    ${pages > 1 ? `<span class="admin-pages"><button type="button" data-act="page" data-page="${state.page - 1}" ${state.page > 1 ? '' : 'disabled'} aria-label="${L('السابق', 'Previous')}">${AI.chevron}</button>
    ${Array.from({length: pages}, (_, i) => `<button type="button" data-act="page" data-page="${i + 1}" aria-current="${state.page === i + 1}">${i + 1}</button>`).join('')}
    <button type="button" data-act="page" data-page="${state.page + 1}" ${state.page < pages ? '' : 'disabled'} aria-label="${L('التالي', 'Next')}">${AI.chevron}</button></span>` : ''}</div></div>`
  : `<p class="admin-hint">${all.length ? L('لا توجد طلبات تطابق البحث.', 'No enquiries match the filters.') : 'لا توجد طلبات.'}</p>`}</section>`;
}
// A staff member records an enquiry received by phone or in person.
function newEnquiryForm() {
  return `<form id="new-enquiry" class="admin-card admin-form"><div class="admin-head span2"><h3>${L('طلب جديد', 'New enquiry')}</h3><button type="button" class="admin-link-btn" data-act="new-enq-close">إلغاء</button></div>
    <label>الاسم<input name="full_name" required minlength="2" maxlength="120"></label>
    <label>الجوال<input name="phone" required dir="ltr" inputmode="tel" pattern="[0-9+ ]{7,20}"></label>
    <label>البريد<input name="email" type="email" required dir="ltr" maxlength="160"></label>
    <label>المدينة<input name="project_location" required maxlength="120"></label>
    <label>القطاع<select name="project_type" required>${Object.entries(SECTORS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label>الميزانية<select name="budget">${Object.entries(BUDGETS).map(([k, v]) => `<option value="${k}" ${k === 'tbd' ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <fieldset class="span2 admin-checks"><legend>الخدمات</legend>${Object.entries(SERVICES).map(([k, v], i) => `<label class="check"><input type="checkbox" name="services" value="${k}" ${i ? '' : 'checked'}> ${v}</label>`).join('')}</fieldset>
    <label class="span2">${L('وصف المشروع', 'Project description')}<textarea name="message" required minlength="12" maxlength="3000" rows="3"></textarea></label>
    <label class="check span2"><input type="checkbox" name="consent" required> ${L('العميل وافق على استخدام بياناته للرد على طلبه', 'The client agreed that we use these details to respond')}</label>
    <button class="admin-btn admin-primary span2" type="submit">${L('حفظ الطلب', 'Save enquiry')}</button></form>`;
}
function enquiryDetail(e) {
  const log = state.log[e.id];
  const notes = (log || []).filter(a => a.kind === 'note');
  const files = e.attachments || [];
  const tab = (k, icon, label, n) => `<button type="button" role="tab" data-act="enq-tab" data-tab-id="${k}" aria-selected="${state.enqTab === k}">${AI[icon]}<span>${label}</span>${n != null ? ` <small>(${n})</small>` : ''}</button>`;
  const row = (k, v, attrs = '') => `<div><dt>${k}</dt><dd ${attrs}>${v || '—'}</dd></div>`;
  const entry = a => { const [title, body] = noteText(a); return `<li class="k-${a.kind}"><span class="admin-tl-dot"></span><div><b>${a.kind === 'note' ? esc(staffName(a.actor)) : title}</b><small>${fmtDate(a.created_at)}</small>${a.kind === 'note' ? `<p class="pre">${esc(a.body)}</p>` : `<p>${esc(body)}</p>`}</div></li>`; };
  let panel = '';
  if (state.enqTab === 'info') panel = `<div class="admin-detail-grid">
      <div class="admin-card"><h3>${L('معلومات العميل', 'Client details')}</h3><dl class="admin-dl">${row('الاسم', esc(e.full_name))}${row('الجوال', `<a href="tel:${esc(e.phone)}">${esc(e.phone)}</a>`, 'dir="ltr"')}${row('البريد', `<a href="mailto:${esc(e.email)}">${esc(e.email)}</a>`, 'dir="ltr"')}${row('لغة النموذج', e.language === 'ar' ? 'العربية' : 'English')}</dl></div>
      <div class="admin-card"><h3>${L('تفاصيل المشروع', 'Project details')}</h3><dl class="admin-dl">${row('القطاع', SECTORS[e.project_type] || esc(e.project_type))}${row('المدينة', esc(e.project_location))}${row(L('الميزانية التقديرية', 'Estimated budget'), BUDGETS[e.budget])}
        ${row('الخدمات', (e.services || []).map(s => SERVICES[s] || esc(s)).join('، '))}${Object.values(e.answers || {}).map(a => row(esc(LANG === 'en' ? a.question_en || a.question_ar : a.question_ar), esc(a.answer))).join('')}
        ${row(L('المصدر', 'Source'), e.source === 'staff' ? L('أضافه موظف', 'Added by staff') : L('نموذج الموقع', 'Website form'))}${row(L('تاريخ الطلب', 'Date'), fmtDate(e.created_at))}</dl></div>
      <div class="admin-card span2"><h3>${L('وصف المشروع', 'Project description')}</h3><p class="pre">${esc(e.message)}</p></div></div>`;
  if (state.enqTab === 'files') panel = files.length ? `<div class="admin-thumbs">${files.map(p => state.signed[p] ? `<a href="${esc(state.signed[p])}" target="_blank" rel="noopener"><img src="${esc(state.signed[p])}" alt=""></a>` : '<span class="admin-hint">جارٍ التحميل…</span>').join('')}</div>` : `<p class="admin-hint">${L('لا توجد مرفقات لهذا الطلب.', 'This enquiry has no attachments.')}</p>`;
  if (state.enqTab === 'notes') panel = `${state.logReady === false ? `<p class="admin-msg">${L('الملاحظات تحتاج تشغيل ملف supabase/staff_v2.sql في Supabase.', 'Notes need supabase/staff_v2.sql to be run in Supabase.')}</p>` : `<form id="enq-note" class="admin-note-form"><label class="visually-hidden" for="note-body">${L('ملاحظة', 'Note')}</label><textarea id="note-body" name="body" rows="3" maxlength="2000" required placeholder="${L('اكتب ملاحظة داخلية للفريق…', 'Write an internal note for the team…')}"></textarea><button class="admin-btn admin-primary" type="submit">${AI.add}<span>${L('إضافة ملاحظة', 'Add note')}</span></button></form>`}
    ${log ? notes.length ? `<ul class="admin-timeline">${notes.slice().reverse().map(entry).join('')}</ul>` : `<p class="admin-hint">${L('لا توجد ملاحظات بعد.', 'No notes yet.')}</p>` : '<p class="admin-hint">جارٍ التحميل…</p>'}`;
  if (state.enqTab === 'log') panel = log ? log.length ? `<ul class="admin-timeline">${log.slice().reverse().map(entry).join('')}</ul>` : `<p class="admin-hint">${L('لا يوجد نشاط بعد.', 'No activity yet.')}</p>` : '<p class="admin-hint">جارٍ التحميل…</p>';
  return `<section class="admin-enq-detail"><div class="admin-pagehead">
    <div><h2>${AI.calendar}<span>${L('تفاصيل الطلب', 'Enquiry')} <span dir="ltr">${refOf(e)}</span></span></h2><small><bdi>${esc(e.full_name)}</bdi> · <bdi>${fmtDate(e.created_at)}</bdi></small></div>
    <div class="admin-tools"><a class="admin-btn admin-ghost" href="mailto:${esc(e.email)}">${AI.mail}<span>مراسلة العميل</span></a><a class="admin-btn admin-ghost" href="tel:${esc(e.phone)}">${AI.phone}<span>اتصال</span></a>
      ${can('admin') ? `<button type="button" class="admin-danger" data-act="delete-enq" data-id="${e.id}">حذف الطلب</button>` : ''}
      <button type="button" class="admin-icon-btn admin-boxed" data-act="close-enq" aria-label="${L('رجوع للطلبات', 'Back to enquiries')}">${AI.close}</button></div></div>
  <div class="admin-card admin-tabs-card"><div class="admin-tabbar" role="tablist">${tab('info', 'info', L('معلومات الطلب', 'Enquiry details'))}${tab('files', 'clip', L('المرفقات', 'Attachments'), files.length)}${tab('notes', 'note', L('الملاحظات', 'Notes'), log ? notes.length : null)}${tab('log', 'log', L('سجل النشاط', 'Activity log'))}</div>
    <div class="admin-tabpanel" role="tabpanel">${panel}</div>
    <div class="admin-detail-actions">
      ${state.enqTab !== 'notes' && state.logReady !== false ? `<button type="button" class="admin-btn admin-primary" data-act="enq-tab" data-tab-id="notes" data-focus="note-body">${AI.add}<span>${L('إضافة ملاحظة', 'Add note')}</span></button>` : ''}
      ${canEdit() ? `<label class="admin-status-label">${L('تحديث الحالة', 'Update status')} ${statusSelect(e)}</label>` : `<span>${pill(e.status)}</span>`}</div></div></section>`;
}
async function openEnquiry(id) {
  state.tab = 'enquiries'; state.open = id; state.enqTab = 'info'; state.menu = null; state.bell = false;
  await loadTab();
  loadPhotos(enquiryOf(id));
  loadLog(id);
}
async function loadLog(id) {
  try { state.log[id] = await rest(`enquiry_activity?enquiry_id=eq.${id}&order=created_at`); state.logReady = true; }
  catch { const e = enquiryOf(id); state.log[id] = e ? [{id: 'c', enquiry_id: id, kind: 'created', body: e.source || 'website', created_at: e.created_at}] : []; state.logReady = false; }
  if (state.open === id) redraw();
}
// CSV with a UTF-8 BOM so Excel opens Arabic text correctly.
function exportExcel(list = filteredEnquiries()) {
  const qCols = [];
  list.forEach(e => Object.entries(e.answers || {}).forEach(([id, a]) => { if (!qCols.some(c => c[0] === id)) qCols.push([id, a.question_ar]); }));
  const head = ['رقم الطلب', 'التاريخ', 'الاسم', 'الجوال', 'البريد', 'القطاع', 'الخدمات', 'المدينة', 'الميزانية', ...qCols.map(c => c[1]), 'الرسالة', 'عدد الصور', 'الحالة', 'المصدر', 'لغة النموذج'];
  const rows = list.map(e => [refOf(e), fmtDate(e.created_at), e.full_name, e.phone, e.email, SECTORS[e.project_type] || e.project_type,
    (e.services || []).map(s => SERVICES[s] || s).join('، '), e.project_location, BUDGETS[e.budget] || '', ...qCols.map(c => ((e.answers || {})[c[0]] || {}).answer || ''),
    e.message, (e.attachments || []).length, STATUS[e.status] || e.status, e.source === 'staff' ? 'موظف' : 'الموقع', e.language === 'ar' ? 'العربية' : 'English']);
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [head, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
  a.download = `slab-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
// Client photos are private: show them through short-lived signed links (staff only, enforced by storage policy).
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
const PSTATUS = {active: ['نشط', 'Active'], finished: ['منتهي', 'Completed'], promo: ['بروموشن', 'Promotion']};
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
const coverOf = p => (p.builtIn ? `${PUBLIC_BASE}projects/${p.id}_1.webp` : ((state.data.photos || []).find(x => x.project_id === p.id) || {}).url || '');
function projectsView() {
  const all = allProjects();
  if (state.project) {
    const sel = state.project === 'new' ? null : all.find(p => p.id === state.project);
    return `<section><div class="admin-pagehead"><div><h2>${AI.projects}المشاريع والصور</h2></div>
      <button type="button" class="admin-btn admin-ghost" data-act="project-back">${AI.arrow}<span>${L('كل المشاريع', 'All projects')}</span></button></div>
      <div class="admin-card" id="project-panel">${sel ? projectEditor(sel, (state.data.photos || []).filter(x => x.project_id === sel.id)) : newProjectForm()}</div></section>`;
  }
  const count = k => all.filter(p => p.status === k).length;
  const list = state.projTab === 'all' ? all : all.filter(p => p.status === state.projTab);
  const tab = (k, label, n) => `<button type="button" role="tab" data-act="proj-tab" data-tab-id="${k}" aria-selected="${state.projTab === k}">${label} (${n})</button>`;
  return `<section><div class="admin-pagehead">
    <div><h2>${AI.projects}المشاريع والصور</h2><small>${L('إدارة مشاريع الشركة ومعرض الصور', 'Manage the company’s projects and photo galleries')}</small></div>
    <button type="button" class="admin-btn admin-primary" data-act="new-project">${AI.add}<span>مشروع جديد</span></button></div>
  <div class="admin-seg admin-seg-lg" role="tablist">${tab('all', L('الكل', 'All'), all.length)}${Object.entries(PSTATUS).map(([k, v]) => tab(k, L(...v), count(k))).join('')}</div>
  ${list.length ? `<div class="admin-pgrid">${list.map(p => `<button type="button" class="admin-pcard" data-act="pick-project" data-id="${esc(p.id)}">
    <span class="admin-pcard-img">${coverOf(p) ? `<img src="${esc(coverOf(p))}" alt="" loading="lazy">` : ''}
      ${p.status ? `<span class="admin-badge b-${p.status}">${L(...PSTATUS[p.status])}</span>` : ''}${p.published === false ? `<span class="admin-badge b-hidden">مخفي</span>` : ''}</span>
    <span class="admin-pcard-body"><span class="admin-pcard-name">${projectLabel(p, 'small')}</span>
      <span class="admin-pcard-city">${AI.pin}${esc(LANG === 'en' ? p.city || 'Riyadh' : p.city_ar || 'الرياض')}</span>
      ${p.progress != null ? `<span class="admin-progress"><span><i style="width:${p.progress}%"></i></span><b dir="ltr">${p.progress}%</b></span>` : `<span class="admin-progress is-empty">${L('لم تُحدد نسبة الإنجاز', 'No completion set')}</span>`}</span></button>`).join('')}</div>`
  : `<p class="admin-hint">${L('لا توجد مشاريع بهذه الحالة. اختاري مشروعًا وحددي حالته من «تعديل».', 'No projects with this status yet. Open a project to set its status.')}</p>`}</section>`;
}
function projectFields(p = {}) {
  return `<label>الاسم (عربي)<input name="name_ar" required maxlength="80" value="${esc(p.name_ar)}"></label><label>الاسم (English)<input name="name" required maxlength="80" value="${esc(p.name)}"></label>
    <label>العميل (عربي)<input name="client_ar" maxlength="80" value="${esc(p.client_ar)}"></label><label>العميل (English)<input name="client" maxlength="80" value="${esc(p.client)}"></label>
    ${p.builtIn ? '' : `<label>المدينة (عربي)<input name="city_ar" maxlength="60" value="${esc(p.city_ar || 'الرياض')}"></label><label>المدينة (English)<input name="city" maxlength="60" value="${esc(p.city || 'Riyadh')}"></label>
    <label>النوع<select name="type">${Object.entries(SECTORS).map(([k, v]) => `<option value="${k}" ${p.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`}
    <label>عدد الوحدات<input name="units" type="number" min="0" value="${esc(p.units ?? '')}"></label>
    <label class="span2">المساحات م² (افصلي بفاصلة)<input name="sizes" placeholder="120, 145" value="${esc((p.sizes || []).join(', '))}"></label>
    <label>${L('حالة المشروع', 'Project status')}<select name="status"><option value="">${L('بدون حالة', 'No status')}</option>${Object.entries(PSTATUS).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${L(...v)}</option>`).join('')}</select></label>
    <label>${L('نسبة الإنجاز %', 'Completion %')}<input name="progress" type="number" min="0" max="100" placeholder="—" value="${esc(p.progress ?? '')}"></label>
    <p class="admin-hint span2">${L('الحالة والنسبة تظهر في صفحة المشروع على الموقع. اتركيها فاضية إذا ما عندك معلومة مؤكدة.', 'Status and completion appear on the project page on the website. Leave them empty unless confirmed.')}</p>`;
}
function newProjectForm() {
  return `<h3>إضافة مشروع جديد</h3><form id="new-project" class="admin-form">${projectFields()}
    <label class="span2">الصور<input name="files" type="file" accept="image/*" multiple required></label>
    <button class="admin-btn admin-primary span2" type="submit">إضافة المشروع</button>
    <p class="admin-hint span2">ارفعي صور الغرف الداخلية بجودة عالية. أول صورة تكون صورة الغلاف.</p></form>`;
}
function projectEditor(p, added) {
  const own = p.builtIn ? Array.from({length: p.images}, (_, i) => `${PUBLIC_BASE}projects/${p.id}_${i + 1}.webp`) : [];
  return `<div class="admin-head"><h3>${projectLabel(p, 'small')}</h3>
    <div class="admin-tools"><a class="admin-link-btn" href="./#/projects/${esc(p.id)}" target="_blank" rel="noopener">عرض في الموقع</a>
    <button type="button" class="admin-link-btn" data-act="toggle-publish" data-id="${esc(p.id)}">${p.published === false ? 'إظهار في الموقع' : 'إخفاء من الموقع'}</button>
    ${p.builtIn ? '' : `<button type="button" class="admin-danger" data-act="delete-project" data-id="${esc(p.id)}">حذف المشروع</button>`}</div></div>
  <form id="edit-project" class="admin-form" data-id="${esc(p.id)}">${projectFields(p)}
    <button class="admin-btn admin-primary span2" type="submit">حفظ البيانات</button></form>
  <h3 class="admin-sub">الصور (${own.length + added.length})</h3>
  <div class="admin-thumbs">${own.map(u => `<figure><img src="${u}" alt="" loading="lazy"><span class="admin-tag">أصلية</span></figure>`).join('')}
    ${added.map(ph => `<figure><img src="${esc(ph.url)}" alt="" loading="lazy"><button type="button" class="admin-danger" data-act="delete-photo" data-id="${ph.id}">حذف</button></figure>`).join('')}</div>
  <label class="admin-upload">+ إضافة صور<input type="file" accept="image/*" multiple data-act="add-photos" data-id="${esc(p.id)}"></label>
  ${p.builtIn ? '<p class="admin-hint">الصور الأصلية من ملف الشركة ثابتة. الصور اللي تضيفينها تظهر بعدها في معرض المشروع.</p>' : ''}`;
}
// Fields stored in cms_projects. For built-in projects the row overrides text, units, sizes, status and visibility.
const projectRow = p => ({name: p.name, name_ar: p.name_ar, client: p.client || '', client_ar: p.client_ar || '', units: p.units ?? null, sizes: p.sizes || [],
  published: p.published !== false, status: p.status || null, progress: p.progress ?? null, ...(p.builtIn ? {} : {city: p.city, city_ar: p.city_ar, type: p.type})});
const formProject = (v, builtIn) => ({name: v('name'), name_ar: v('name_ar'), client: v('client'), client_ar: v('client_ar'),
  units: v('units') === '' ? null : Number(v('units')), sizes: v('sizes').split(/[,،]/).map(s => s.trim()).filter(Boolean),
  status: v('status') || null, progress: v('progress') === '' ? null : Math.max(0, Math.min(100, Math.round(Number(v('progress'))))),
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
  const head = `<div class="admin-pagehead"><div><h2>${AI.images}صور الأقسام</h2><small>${L('إدارة الصور حسب الأقسام', 'Manage photos by section')}</small></div>
    ${state.imgGroup != null ? `<button type="button" class="admin-btn admin-ghost" data-act="img-back">${AI.arrow}<span>${L('كل الأقسام', 'All sections')}</span></button>` : ''}</div>`;
  if (state.imgGroup == null) return `<section>${head}<div class="admin-cgrid">${SLOTS.map(([group, items], i) => {
    const changed = items.filter(([slot]) => over[slot]).length;
    return `<button type="button" class="admin-ccard" data-act="img-group" data-id="${i}"><span class="admin-ccard-img"><img src="${esc(over[items[0][0]] || items[0][2])}" alt="" loading="lazy"></span>
      <span class="admin-ccard-body"><b>${group}</b><small>(${items.length})${changed ? ` · ${L(`${changed} مُستبدلة`, `${changed} replaced`)}` : ''}</small>${AI.chevron}</span></button>`; }).join('')}</div></section>`;
  const [group, items] = SLOTS[state.imgGroup];
  return `<section>${head}<div class="admin-card"><h3>${group}</h3><p class="admin-hint">استبدلي أي صورة في الموقع. «استرجاع» يرجّع الصورة الأصلية.</p>
  <div class="admin-slots">${items.map(([slot, label, def]) => `<figure class="${over[slot] ? 'is-custom' : ''}">
    <img src="${esc(over[slot] || def)}" alt="" loading="lazy"><figcaption>${label}${over[slot] ? ' <span class="admin-tag">مُستبدلة</span>' : ''}</figcaption>
    <label class="admin-upload small">استبدال<input type="file" accept="image/*" data-act="slot-upload" data-slot="${slot}"></label>
    ${over[slot] ? `<button type="button" class="admin-link-btn" data-act="slot-reset" data-slot="${slot}">استرجاع</button>` : ''}</figure>`).join('')}</div></div></section>`;
}

/* ---------- Form questions ---------- */
// The form's own fields, in page order: [key, Arabic, English, answer type]. Each can be made optional or hidden;
// photos are optional by default. Email or phone must stay shown and required so the team can reply.
const CORE_FIELDS = [
  ['full-name', 'الاسم الكامل', 'Full name', 'text'], ['email', 'البريد الإلكتروني', 'Email address', 'email'], ['phone', 'رقم الجوال', 'Phone number', 'number'],
  ['project-type', 'قطاع المشروع', 'Project sector', 'select'], ['services', 'الخدمات المطلوبة', 'Services required', 'multi'],
  ['project-location', 'موقع المشروع (المدينة)', 'Project location (city)', 'text'], ['budget', 'الميزانية التقديرية', 'Estimated budget', 'select'],
  ['message', 'وصف المشروع', 'Project description', 'textarea'], ['attachments', 'صور المشروع', 'Project photos', 'photos']
].map(f => [...f, true]);
const TYPE_LABEL = {text: ['نص', 'Text'], textarea: ['نص طويل', 'Long text'], number: ['رقم', 'Number'], email: ['بريد إلكتروني', 'Email'], select: ['اختيار من قائمة', 'Choice list'], multi: ['اختيار متعدد', 'Multiple choice'], photos: ['صور', 'Photos']};
const coreRequired = (key, c) => (key === 'attachments' ? c.required === true : c.required !== false);
const formCfg = () => ((state.data.settings || []).find(s => s.key === 'form_fields') || {}).value || {};
async function saveFormFields(value) {
  await rest('site_settings', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates'}, body: {key: 'form_fields', value, updated_at: new Date().toISOString()}});
  state.data.settings = (state.data.settings || []).filter(s => s.key !== 'form_fields').concat({key: 'form_fields', value});
}
const toggle = (on, act, id, label, disabled = false) => `<button type="button" class="admin-switch" role="switch" aria-checked="${on}" aria-label="${label}" data-act="${act}" data-id="${id}" ${disabled ? 'disabled' : ''}><i></i></button>`;
function questionsView() {
  const qs = state.data.questions || [];
  const cfg = formCfg();
  const rows = [
    ...CORE_FIELDS.map(([key, ar, en, type, flex]) => { const c = cfg[key] || {}; return {id: 'core:' + key, key, label: LANG === 'en' ? c.label_en || en : c.label_ar || ar, ar: c.label_ar || ar, en: c.label_en || en, type: L(...TYPE_LABEL[type]), required: coreRequired(key, c), active: !c.hidden, flex, core: true}; }),
    ...qs.map((q, i) => ({id: 'q:' + q.id, q, i, label: LANG === 'en' ? q.label_en : q.label_ar, ar: q.label_ar, en: q.label_en, type: L(...TYPE_LABEL[q.kind] || [KINDS[q.kind], q.kind]), required: q.required, active: q.active, flex: true}))
  ];
  return `<section><div class="admin-pagehead"><div><h2>${AI.questions}أسئلة النموذج</h2><small>${L('إدارة أسئلة نموذج «ابدأ مشروعك»', 'Manage the “Start a Project” form questions')}</small></div>
    <button type="button" class="admin-btn admin-primary" data-act="q-add-open">${AI.add}<span>إضافة سؤال</span></button></div>
  ${state.addQ ? `<div class="admin-card" id="add-question"><div class="admin-head"><h3>سؤال جديد</h3><button type="button" class="admin-link-btn" data-act="q-add-close">إلغاء</button></div><form id="new-question" class="admin-form">
    <label>السؤال (عربي)<input name="label_ar" required maxlength="200"></label><label>السؤال (English)<input name="label_en" required maxlength="200"></label>
    <label>نوع الإجابة<select name="kind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" name="required"> إجباري</label>
    <label class="span2">الاختيارات (لنوع «قائمة اختيارات»): كل اختيار في سطر بالشكل <code>English | عربي</code><textarea name="options" rows="4" placeholder="Within 3 months | خلال 3 أشهر"></textarea></label>
    <button class="admin-btn admin-primary span2" type="submit">إضافة السؤال</button></form></div>` : ''}
  <div class="admin-table-wrap"><table class="admin-table admin-qtable"><thead><tr><th>#</th><th>${L('السؤال', 'Question')}</th><th>نوع الإجابة</th><th>${L('إلزامي', 'Required')}</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>
  ${rows.map((r, n) => `<tr class="${r.active ? '' : 'is-off'}"><td>${n + 1}</td>
    <td><b ${r.core ? '' : 'data-raw'}>${esc(r.label)}</b>${r.required ? ' <span class="admin-req">*</span>' : ''}${r.core ? '' : ` <span class="admin-tag">${L('مضاف', 'Added')}</span>`}</td><td>${r.type}</td>
    <td>${toggle(r.required, r.core ? 'core-required' : 'q-required', r.core ? r.key : r.q.id, L('إلزامي', 'Required'), r.core && !r.flex)}</td>
    <td><span class="dash-pill ${r.active ? 's-contacted' : 's-closed'}">${r.active ? L('نشط', 'Active') : 'مخفي'}</span></td>
    <td class="admin-actions"><button type="button" class="admin-icon-btn" data-act="q-edit" data-id="${r.id}" aria-label="${L('تعديل', 'Edit')}" title="${L('تعديل', 'Edit')}">${AI.edit}</button>
      ${r.flex ? `<span class="admin-menu-wrap"><button type="button" class="admin-icon-btn" data-act="menu" data-id="${r.id}" aria-label="المزيد" aria-expanded="${state.menu === r.id}">${AI.dots}</button>
      ${state.menu === r.id ? `<span class="admin-menu" role="menu"><button type="button" role="menuitem" data-act="${r.core ? 'core-hide' : 'q-toggle'}" data-id="${r.core ? r.key : r.q.id}">${r.active ? 'إخفاء' : 'إظهار'}</button>
        ${r.core ? '' : `<button type="button" role="menuitem" data-act="q-move" data-id="${r.q.id}" data-dir="-1" ${r.i ? '' : 'disabled'}>لأعلى</button><button type="button" role="menuitem" data-act="q-move" data-id="${r.q.id}" data-dir="1" ${r.i < qs.length - 1 ? '' : 'disabled'}>لأسفل</button><button type="button" role="menuitem" class="danger" data-act="q-delete" data-id="${r.q.id}">حذف</button>`}</span>` : ''}</span>` : ''}</td></tr>
  ${state.editRow === r.id ? `<tr class="admin-detail"><td colspan="6"><form id="q-edit-form" class="admin-form" data-id="${r.id}">
    <label>السؤال (عربي)<input name="label_ar" required maxlength="200" value="${esc(r.ar)}"></label><label>السؤال (English)<input name="label_en" dir="ltr" required maxlength="200" value="${esc(r.en)}"></label>
    ${!r.core && r.q.kind === 'select' ? `<label class="span2">الاختيارات (لنوع «قائمة اختيارات»): كل اختيار في سطر بالشكل <code>English | عربي</code><textarea name="options" rows="4">${esc((r.q.options || []).map(o => `${o.en} | ${o.ar}`).join('\n'))}</textarea></label>` : ''}
    <div class="span2 admin-tools"><button class="admin-btn admin-primary" type="submit">حفظ</button><button type="button" class="admin-link-btn" data-act="q-edit" data-id="${r.id}">إلغاء</button></div></form></td></tr>` : ''}`).join('')}
  </tbody></table></div>
  <p class="admin-hint">${L('الأسئلة المضافة تظهر في النموذج بعد الميزانية، وإجاباتها تصل في الإيميل وفي جدول الطلبات.', 'Added questions appear in the form after the budget; answers arrive by email and in the enquiries table.')}</p></section>`;
}

/* ---------- Settings ---------- */
function settingsView() {
  const get = k => ((state.data.settings || []).find(s => s.key === k) || {}).value;
  const stats = get('stats') || [{n: 125, suffix: '+'}, {n: 3, suffix: ''}, {n: 4, suffix: ''}, {n: 7, suffix: ''}];
  const c = get('contact') || {};
  const tab = (k, icon, label) => `<button type="button" role="tab" data-act="set-tab" data-tab-id="${k}" aria-selected="${state.setTab === k}">${AI[icon]}<span>${label}</span></button>`;
  // Account name from a profile link, e.g. instagram.com/slab.saudi/ → @slab.saudi
  const handle = (url, at = '') => { const m = String(url || '').match(/\/(?:company\/|in\/)?([^/?#]+)\/?(?:[?#].*)?$/); return m ? at + m[1] : ''; };
  const state1 = on => `<span class="admin-state ${on ? 'is-on' : ''}">${on ? `${AI.check}${L('مفعل', 'Active')}` : L('غير مضاف', 'Not added')}</span>`;
  const card = (icon, tone, title, value, on, ltr = true) => `<div class="admin-ccontact"><span class="admin-ccontact-icon ${tone}">${AI[icon]}</span><div><small>${title}</small><b ${ltr ? 'dir="ltr"' : ''}>${esc(value || '—')}</b>${state1(on)}</div></div>`;
  let panel = '';
  if (state.setTab === 'contact') panel = `<div class="admin-contact-grid">
      ${card('phone', 'sage', L('رقم SLAB الرئيسي', 'SLAB main number'), c.phone_display || c.phone || '9200 66197', true)}
      ${card('whatsapp', 'warm', L('رقم واتساب', 'WhatsApp number'), c.whatsapp, !!c.whatsapp)}
      ${card('mail', 'sage', 'البريد الإلكتروني', c.email || 'info@slab.sa', true)}
      ${card('instagram', 'warm', 'Instagram', handle(c.instagram, '@'), !!c.instagram)}
      ${card('linkedin', 'sage', 'LinkedIn', handle(c.linkedin), !!c.linkedin)}</div>
    ${state.editContact ? `<form id="contact-form" class="admin-card admin-form"><h3 class="span2">بيانات التواصل</h3>
      <label>رقم الهاتف (للاتصال)<input name="phone" dir="ltr" required value="${esc(c.phone || '920066197')}"></label>
      <label>رقم الهاتف (كما يظهر)<input name="phone_display" dir="ltr" value="${esc(c.phone_display || '9200 66197')}"></label>
      <label>${L('رقم واتساب (اختياري)', 'WhatsApp number (optional)')}<input name="whatsapp" dir="ltr" inputmode="tel" placeholder="05xxxxxxxx" pattern="[0-9+ ]{9,16}" value="${esc(c.whatsapp || '')}"></label>
      <label>البريد الإلكتروني<input name="email" type="email" dir="ltr" required value="${esc(c.email || 'info@slab.sa')}"></label>
      <label>Instagram<input name="instagram" type="url" dir="ltr" value="${esc(c.instagram || '')}"></label>
      <label>LinkedIn<input name="linkedin" type="url" dir="ltr" value="${esc(c.linkedin || '')}"></label>
      <p class="admin-hint span2">${L('رقم واتساب يظهر كأيقونة في أسفل الموقع بعد حفظه.', 'Once saved, the WhatsApp number appears as an icon in the website footer.')}</p>
      <div class="span2 admin-tools"><button class="admin-btn admin-primary" type="submit">حفظ</button><button type="button" class="admin-link-btn" data-act="contact-edit">إلغاء</button></div></form>`
    : `<button type="button" class="admin-btn admin-ghost" data-act="contact-edit">${AI.edit}<span>${L('تعديل بيانات التواصل', 'Edit contact details')}</span></button>`}`;
  if (state.setTab === 'system') panel = `<form id="stats-form" class="admin-card admin-form"><h3 class="span2">أرقام «أثرنا»</h3>
    ${stats.map((s, i) => `<label>${STAT_LABELS[i]}<span class="admin-row"><input name="n${i}" type="number" min="0" required value="${esc(s.n)}"><input name="s${i}" maxlength="3" value="${esc(s.suffix)}" aria-label="لاحقة (مثل +)" placeholder="+"></span></label>`).join('')}
    <p class="admin-hint span2">${L('«125+» تعني وحدات مسلّمة أو قيد التنفيذ، وليست عدد مشاريع مكتملة.', '“125+” means units delivered or in progress, not completed projects.')}</p>
    <button class="admin-btn admin-primary span2" type="submit">حفظ</button></form>`;
  if (state.setTab === 'notify') { const p = prefs(); panel = `<div class="admin-card"><h3>${L('إشعارات الجرس', 'Bell notifications')}</h3>
    <p class="admin-hint">${L('اختاري الإشعارات اللي تظهر لك في الجرس (على هذا الجهاز).', 'Choose which notifications appear in your bell (on this device).')}</p>
    <ul class="admin-prefs">${[['created', L('طلب جديد', 'New enquiry')], ['status', L('تحديث حالة طلب', 'Enquiry status updated')], ['note', L('ملاحظة جديدة', 'New note')]].map(([k, label]) => `<li><span>${label}</span>${toggle(p[k], 'pref', k, label)}</li>`).join('')}</ul></div>
    <div class="admin-card"><h3>${L('إيميلات الطلبات', 'Enquiry emails')}</h3><p class="admin-hint">بريد استلام الطلبات من النموذج يبقى info@slab.sa (إعداد على السيرفر).</p></div>`; }
  return `<section><div class="admin-pagehead"><div><h2>${AI.settings}الأرقام والإعدادات</h2><small>${L('إدارة أرقام التواصل والإعدادات العامة', 'Contact numbers and general settings')}</small></div></div>
  <div class="admin-seg admin-seg-lg" role="tablist">${tab('contact', 'phone', L('أرقام التواصل', 'Contact numbers'))}${tab('system', 'gear', L('إعدادات النظام', 'System settings'))}${tab('notify', 'bell', L('التنبيهات والإشعارات', 'Alerts & notifications'))}</div>
  ${panel}</section>`;
}

/* ---------- Users ---------- */
function usersView() {
  const users = state.data.users || [];
  const roleSelect = (cur, disabled) => `<select name="role" ${disabled ? 'disabled' : ''}>${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${L(...v)}</option>`).join('')}</select>`;
  return `<section><div class="admin-pagehead"><div><h2>${AI.users}المستخدمين</h2><small>${L('إدارة حسابات المستخدمين وصلاحيات الوصول', 'Manage staff accounts and access')}</small></div>
    <button type="button" class="admin-btn admin-primary" data-act="user-add">${AI.add}<span>إضافة مستخدم</span></button></div>
  ${state.addUser ? `<form id="new-user" class="admin-card admin-form"><div class="admin-head span2"><h3>إضافة مستخدم</h3><button type="button" class="admin-link-btn" data-act="user-add">إلغاء</button></div>
    <label>الاسم<input name="name" required maxlength="80"></label>
    <label>البريد الإلكتروني<input name="email" type="email" dir="ltr" required></label>
    <label>${L('الدور', 'Role')}${roleSelect('projects')}</label>
    <p class="admin-hint span2">كل بريد هنا يقدر يدخل صفحة الموظفين برمز يصله على الإيميل.</p>
    <button class="admin-btn admin-primary span2" type="submit">إضافة</button></form>` : ''}
  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>#</th><th>الاسم</th><th>البريد الإلكتروني</th><th>${L('الدور', 'Role')}</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>
  ${users.map((u, i) => { const self = u.email === session.email, active = u.active !== false, key = 'u:' + u.email; return `<tr class="${active ? '' : 'is-off'}"><td>${i + 1}</td>
    <td><span data-raw>${esc(u.name || '—')}</span>${self ? ` <span class="admin-tag">أنتِ</span>` : ''}</td><td dir="ltr">${esc(u.email)}</td><td>${L(...ROLES[u.role || 'admin'])}</td>
    <td><span class="dash-pill ${active ? 's-contacted' : 's-closed'}">${active ? L('نشط', 'Active') : L('موقوف', 'Suspended')}</span></td>
    <td class="admin-actions"><button type="button" class="admin-icon-btn" data-act="user-edit" data-id="${esc(u.email)}" aria-label="${L('تعديل', 'Edit')}" title="${L('تعديل', 'Edit')}">${AI.edit}</button>
      ${self ? '' : `<span class="admin-menu-wrap"><button type="button" class="admin-icon-btn" data-act="menu" data-id="${esc(key)}" aria-label="المزيد" aria-expanded="${state.menu === key}">${AI.dots}</button>
      ${state.menu === key ? `<span class="admin-menu" role="menu"><button type="button" role="menuitem" data-act="user-active" data-id="${esc(u.email)}">${active ? L('إيقاف الحساب', 'Suspend') : L('تفعيل الحساب', 'Activate')}</button><button type="button" role="menuitem" class="danger" data-act="user-delete" data-email="${esc(u.email)}">إزالة</button></span>` : ''}</span>`}</td></tr>
    ${state.editRow === key ? `<tr class="admin-detail"><td colspan="6"><form id="user-edit-form" class="admin-form" data-id="${esc(u.email)}">
      <label>الاسم<input name="name" maxlength="80" value="${esc(u.name || '')}"></label><label>${L('الدور', 'Role')}${roleSelect(u.role || 'admin', self)}</label>
      ${self ? `<p class="admin-hint span2">${L('ما تقدرين تغيرين دورك بنفسك.', 'You cannot change your own role.')}</p>` : ''}
      <div class="span2 admin-tools"><button class="admin-btn admin-primary" type="submit">حفظ</button><button type="button" class="admin-link-btn" data-act="user-edit" data-id="${esc(u.email)}">إلغاء</button></div></form></td></tr>` : ''}`; }).join('')}
  </tbody></table></div>
  <div class="admin-card admin-roles"><h3>${L('الصلاحيات', 'Access by role')}</h3><ul>
    <li><b>${L(...ROLES.admin)}</b><span>${L('كل الصفحات، ومنها المستخدمين والأسئلة والإعدادات.', 'Every page, including users, questions and settings.')}</span></li>
    <li><b>${L(...ROLES.projects)}</b><span>${L('الطلبات (عرض، تعديل الحالة، إضافة، ملاحظات)، المشاريع، وصور الأقسام.', 'Enquiries (view, status, add, notes), projects and section photos.')}</span></li>
    <li><b>${L(...ROLES.finance)}</b><span>${L('عرض الطلبات وتصدير Excel وإضافة ملاحظات فقط.', 'View enquiries, export to Excel and add notes only.')}</span></li></ul></div></section>`;
}

const VIEWS = {home: homeView, enquiries: enquiriesView, projects: projectsView, images: imagesView, questions: questionsView, settings: settingsView, users: usersView};
const redraw = () => { const m = document.getElementById('admin-main'); if (m) m.innerHTML = VIEWS[state.tab](); renderBell(); };

/* ---------- Events ---------- */
$root.addEventListener('click', e => {
  const t = e.target.closest('[data-tab],[data-act]');
  if (state.menu && !(e.target.closest && e.target.closest('.admin-menu-wrap'))) { state.menu = null; redraw(); }
  if (state.bell && !(e.target.closest && e.target.closest('.admin-bell-wrap'))) { state.bell = false; renderBell(); }
  if (!t || t.tagName === 'SELECT' || t.tagName === 'INPUT' || t.type === 'file') return;
  if (t.dataset.tab) { state.tab = t.dataset.tab; state.open = null; state.project = null; state.imgGroup = null; state.editRow = null; state.newEnq = false; loadTab(); return; }
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
    case 'bell': state.bell = !state.bell; state.bellAll = false; renderBell(); break;
    case 'bell-tab': state.bellTab = t.dataset.tabId; renderBell(); break;
    case 'bell-all': state.bellAll = true; renderBell(); break;
    case 'bell-read': try { localStorage.setItem(seenKey(), new Date().toISOString()); } catch {} renderBell(); break;
    case 'menu': state.menu = state.menu === id ? null : id; redraw(); break;
    case 'login-restart': renderLogin('email'); break;
    case 'login-have-code': {
      // A code already arrived: go to the code step without requesting (and invalidating) a new one.
      const mail = (document.getElementById('login-mail').value || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { document.getElementById('login-msg').textContent = 'اكتبي بريدك أول.'; break; }
      renderLogin('code', mail); break;
    }
    case 'export': exportExcel(state.tab === 'enquiries' ? filteredEnquiries() : d.enquiries || []); break;
    case 'filter-reset': state.filter = {q: '', status: '', sector: ''}; state.page = 1; redraw(); break;
    case 'page': state.page = Number(t.dataset.page); redraw(); break;
    case 'new-enq': state.tab = 'enquiries'; state.open = null; state.newEnq = true; loadTab().then(() => { const f = document.getElementById('new-enquiry'); if (f) f.querySelector('input').focus(); }); break;
    case 'new-enq-close': state.newEnq = false; redraw(); break;
    case 'open-enq': openEnquiry(id); break;
    case 'close-enq': state.open = null; redraw(); break;
    case 'enq-tab':
      state.enqTab = t.dataset.tabId; redraw();
      if (t.dataset.focus) { const f = document.getElementById(t.dataset.focus); if (f) f.focus(); }
      break;
    case 'q-add-open': case 'q-add-close':
      state.addQ = t.dataset.act === 'q-add-open'; redraw();
      if (state.addQ) document.getElementById('add-question').querySelector('input').focus();
      break;
    case 'q-edit': state.editRow = state.editRow === id ? null : id; state.menu = null; redraw(); break;
    case 'delete-enq':
      if (ask('حذف هذا الطلب نهائيًا؟')) run(async () => { const gone = d.enquiries.find(x => x.id === id); await rest(`project_enquiries?id=eq.${id}`, {method: 'DELETE'}); if ((gone.attachments || []).length) await api('/storage/v1/object/enquiry-files', {method: 'DELETE', body: {prefixes: gone.attachments}}).catch(() => {}); d.enquiries = d.enquiries.filter(x => x.id !== id); state.open = null; redraw(); }, 'تم حذف الطلب');
      break;
    case 'proj-tab': state.projTab = t.dataset.tabId; redraw(); break;
    case 'pick-project': case 'new-project':
      state.project = t.dataset.act === 'pick-project' ? id : 'new'; redraw();
      document.getElementById('admin-main').scrollIntoView({behavior: 'smooth', block: 'start'});
      break;
    case 'project-back': state.project = null; redraw(); break;
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
    case 'img-group': state.imgGroup = Number(id); redraw(); break;
    case 'img-back': state.imgGroup = null; redraw(); break;
    case 'slot-reset': run(async () => { const old = d.images.find(x => x.slot === t.dataset.slot); await rest(`image_overrides?slot=eq.${t.dataset.slot}`, {method: 'DELETE'}); if (old) await removeUpload(old.url); d.images = d.images.filter(x => x !== old); redraw(); }, 'تم استرجاع الصورة الأصلية'); break;
    case 'core-required': case 'core-hide': run(async () => {
      const cfg = formCfg(), c = {...(cfg[id] || {})};
      if (t.dataset.act === 'core-hide') c.hidden = !c.hidden; else c.required = !coreRequired(id, c);
      const next = {...cfg, [id]: c};
      if (!['email', 'phone'].some(k => !(next[k] || {}).hidden && coreRequired(k, next[k] || {})))
        throw new Error(L('لازم يبقى البريد أو الجوال ظاهر وإلزامي، عشان الفريق يقدر يتواصل مع العميل.', 'Email or phone must stay shown and required so the team can reach the client.'));
      await saveFormFields(next); state.menu = null; redraw();
    }, 'تم الحفظ'); break;
    case 'q-toggle': case 'q-required': run(async () => {
      const q = d.questions.find(x => String(x.id) === id); const field = t.dataset.act === 'q-toggle' ? 'active' : 'required';
      await rest(`form_questions?id=eq.${id}`, {method: 'PATCH', body: {[field]: !q[field]}}); q[field] = !q[field]; state.menu = null; redraw();
    }, 'تم الحفظ'); break;
    case 'q-move': run(async () => {
      const qs = d.questions; const i = qs.findIndex(x => String(x.id) === id); const j = i + Number(t.dataset.dir);
      [qs[i], qs[j]] = [qs[j], qs[i]];
      await Promise.all(qs.map((q, k) => (q.position === k ? null : rest(`form_questions?id=eq.${q.id}`, {method: 'PATCH', body: {position: k}}).then(() => { q.position = k; }))));
      state.menu = null; redraw();
    }); break;
    case 'q-delete': if (ask('حذف السؤال؟ الإجابات السابقة تبقى محفوظة في الطلبات.')) run(async () => { await rest(`form_questions?id=eq.${id}`, {method: 'DELETE'}); d.questions = d.questions.filter(x => String(x.id) !== id); state.menu = null; redraw(); }, 'تم حذف السؤال'); break;
    case 'set-tab': state.setTab = t.dataset.tabId; state.editContact = false; redraw(); break;
    case 'contact-edit': state.editContact = !state.editContact; redraw(); break;
    case 'pref': {
      const p = prefs(); p[id] = !p[id];
      try { localStorage.setItem(NOTIFY_KEY, JSON.stringify(p)); } catch {}
      redraw(); break;
    }
    case 'user-add': state.addUser = !state.addUser; redraw(); if (state.addUser) document.getElementById('new-user').querySelector('input').focus(); break;
    case 'user-edit': state.editRow = state.editRow === 'u:' + id ? null : 'u:' + id; state.menu = null; redraw(); break;
    case 'user-active': run(async () => {
      const u = d.users.find(x => x.email === id);
      await rest(`site_admins?email=eq.${encodeURIComponent(id)}`, {method: 'PATCH', body: {active: u.active === false}});
      u.active = u.active === false; state.menu = null; redraw();
    }, 'تم الحفظ'); break;
    case 'user-delete': if (ask(`إزالة ${t.dataset.email} من صفحة الموظفين؟`)) run(async () => { await rest(`site_admins?email=eq.${encodeURIComponent(t.dataset.email)}`, {method: 'DELETE'}); d.users = d.users.filter(u => u.email !== t.dataset.email); state.menu = null; redraw(); }, 'تمت الإزالة'); break;
  }
});

$root.addEventListener('input', e => {
  if (e.target.id === 'enq-search') { state.filter.q = e.target.value; state.page = 1; const pos = e.target.selectionStart; redraw(); const s = document.getElementById('enq-search'); s.focus(); s.setSelectionRange(pos, pos); }
});
$root.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (state.bell) { state.bell = false; renderBell(); document.querySelector('.admin-bell').focus(); }
  else if (state.menu) { state.menu = null; redraw(); }
});

async function setStatus(ids, value) {
  const d = state.data;
  await rest(`project_enquiries?id=in.(${ids.join(',')})`, {method: 'PATCH', body: {status: value}});
  ids.forEach(id => { const x = d.enquiries.find(y => y.id === id); if (x) x.status = value; delete state.log[id]; });
  if (state.open && ids.includes(state.open)) loadLog(state.open);
  redraw(); loadActivity();
}
$root.addEventListener('change', e => {
  const t = e.target;
  const d = state.data;
  if (t.id === 'enq-status') { state.filter.status = t.value; state.page = 1; redraw(); return; }
  if (t.id === 'enq-sector') { state.filter.sector = t.value; state.page = 1; redraw(); return; }
  if (t.dataset.act === 'status') run(() => setStatus([t.dataset.id], t.value), 'تم تحديث الحالة');
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

const FORMS = ['new-project', 'edit-project', 'new-question', 'q-edit-form', 'contact-form', 'stats-form', 'new-user', 'user-edit-form', 'new-enquiry', 'enq-note'];
$root.addEventListener('submit', e => {
  const f = e.target;
  if (!FORMS.includes(f.id)) return;
  e.preventDefault();
  if (!f.reportValidity()) return;
  const v = name => (f.elements[name] && f.elements[name].value !== undefined ? f.elements[name].value.trim() : '');
  const d = state.data;
  const btn = f.querySelector('button[type=submit]');
  btn.disabled = true;
  const done = () => { btn.disabled = false; };
  const getSetting = k => ((d.settings || []).find(s => s.key === k) || {}).value;
  const saveSetting = async (key, value) => {
    await rest('site_settings', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates'}, body: {key, value, updated_at: new Date().toISOString()}});
    d.settings = (d.settings || []).filter(s => s.key !== key).concat({key, value});
  };
  if (f.id === 'new-project') run(async () => {
    let id = slugify(v('name'));
    while ([...BUILT_IN_IDS, ...d.cms.map(p => p.id)].includes(id)) id = id.slice(0, 36) + '-' + Math.floor(Math.random() * 90 + 10);
    const [p] = await rest('cms_projects', {method: 'POST', headers: {Prefer: 'return=representation'}, body: {id, ...formProject(v, false), position: d.cms.length}});
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
  if (f.id === 'q-edit-form') run(async () => {
    const [type, key] = f.dataset.id.split(/:(.*)/);
    if (type === 'core') {
      const cfg = formCfg();
      await saveFormFields({...cfg, [key]: {...(cfg[key] || {}), label_ar: v('label_ar'), label_en: v('label_en')}});
    } else {
      const q = d.questions.find(x => String(x.id) === key);
      const body = {label_ar: v('label_ar'), label_en: v('label_en')};
      if (q.kind === 'select') {
        body.options = v('options').split('\n').map(l => l.split('|').map(s => s.trim())).filter(([en]) => en).map(([en, ar]) => ({en, ar: ar || en}));
        if (body.options.length < 2) throw new Error('أضيفي اختيارين على الأقل للقائمة.');
      }
      await rest(`form_questions?id=eq.${key}`, {method: 'PATCH', body});
      Object.assign(q, body);
    }
    state.editRow = null; redraw();
  }, 'تم الحفظ').finally(done);
  if (f.id === 'contact-form') run(async () => {
    const whatsapp = v('whatsapp').replace(/[^\d+]/g, '');
    await saveSetting('contact', {...(getSetting('contact') || {}), phone: v('phone'), phone_display: v('phone_display') || v('phone'), whatsapp, email: v('email'), instagram: v('instagram'), linkedin: v('linkedin')});
    state.editContact = false; redraw();
  }, 'تم حفظ الإعدادات').finally(done);
  if (f.id === 'stats-form') run(async () => {
    await saveSetting('stats', [0, 1, 2, 3].map(i => ({n: Number(v('n' + i)), suffix: v('s' + i)})));
  }, 'تم حفظ الإعدادات').finally(done);
  if (f.id === 'new-user') run(async () => {
    const [u] = await rest('site_admins', {method: 'POST', headers: {Prefer: 'return=representation'}, body: {email: v('email').toLowerCase(), name: v('name'), role: v('role'), added_by: session.email}});
    d.users.push(u); state.addUser = false; redraw();
  }, 'تمت إضافة المستخدم').finally(done);
  if (f.id === 'user-edit-form') run(async () => {
    const email = f.dataset.id, self = email === session.email;
    const body = {name: v('name'), ...(self ? {} : {role: v('role')})};
    await rest(`site_admins?email=eq.${encodeURIComponent(email)}`, {method: 'PATCH', body});
    Object.assign(d.users.find(u => u.email === email), body);
    if (self) state.me.name = body.name;
    state.editRow = null; redraw();
  }, 'تم الحفظ').finally(done);
  if (f.id === 'new-enquiry') run(async () => {
    const services = Array.from(f.querySelectorAll('input[name=services]:checked')).map(x => x.value);
    if (!services.length) throw new Error(L('اختاري خدمة واحدة على الأقل.', 'Choose at least one service.'));
    const [row] = await rest('project_enquiries', {method: 'POST', headers: {Prefer: 'return=representation'}, body: {
      full_name: v('full_name'), phone: v('phone'), email: v('email').toLowerCase(), project_type: v('project_type'), project_location: v('project_location'),
      budget: v('budget'), services, message: v('message'), consent: true, language: LANG, source: 'staff', status: 'new'}});
    d.enquiries.unshift(row); state.newEnq = false;
    openEnquiry(row.id); loadActivity();
  }, L('تم حفظ الطلب', 'Enquiry saved')).finally(done);
  if (f.id === 'enq-note') run(async () => {
    const id = state.open;
    const [note] = await rest('enquiry_activity', {method: 'POST', headers: {Prefer: 'return=representation'}, body: {enquiry_id: id, kind: 'note', body: v('body'), actor: session.email}});
    (state.log[id] = state.log[id] || []).push(note); redraw();
  }, L('تمت إضافة الملاحظة', 'Note added')).finally(done);
});

// New activity from the rest of the team every minute while the page is open.
setInterval(() => { if (session && document.visibilityState === 'visible' && document.getElementById('admin-bell-wrap')) loadActivity(); }, 60000);

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
