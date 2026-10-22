# SLAB Contracting — Website

موقع تسويقي ثنائي اللغة (عربي / إنجليزي) لشركة **سلاب للمقاولات**، جزء من مجموعة أوكتري.
Bilingual (Arabic / English) marketing website for **SLAB Contracting**, part of Oaktree Group.

> **الحالة / Status:** نسخة للمراجعة، بانتظار اعتماد المحتوى من SLAB قبل الإطلاق العام (الصفحات عليها `noindex`).
> Review build — content pending SLAB approval before public launch (pages are `noindex`).

## التشغيل محليًا / Run locally
افتح `site/index.html` في Chrome أو Edge. لا يحتاج أي تثبيت.
Open `site/index.html` in Chrome or Edge — no build step.

## الاختبار / Tests
- في المتصفح: `site/qa/selftest.html` (تظهر PASS أو FAIL).
- مع Node.js: `cd site && node verify_site.cjs`

## النشر / Deploy
- **Vercel:** يقرأ `vercel.json` (مجلد النشر `site/`، بدون خطوة بناء).
- **Netlify:** `site/netlify.toml`.

## الهيكل / Structure
| المسار | المحتوى |
|---|---|
| `site/` | الموقع: `index.html`, `styles.css`, `app.js`, `assets/` (صور 1200px + `assets/hd/` 2400px، الخطوط، الشعار) |
| `references/` | الملف التعريفي 2026، المرجع البصري، `image_sources.tsv` (مصدر كل صورة) |
| `QA_REPORT_AR.md` | تقرير التطوير والجودة وما يحتاج اعتمادًا قبل الإطلاق |
| `SLAB_FULL_PROJECT_BRIEF_AR.md` | وثيقة متطلبات المشروع |

## Supabase
- **طلبات العملاء / Enquiries:** جدول `public.project_enquiries`. الزائر يقدر **يضيف** طلب فقط (RLS)، ولا يقدر يقرأ أو يعدّل.
  عرض الطلبات: لوحة Supabase ← Table Editor ← `project_enquiries`.
- **الصور / Photos:** bucket عام `site-assets` (`projects/` 1200px و `projects/hd/` 2400px).
  نسخة مطابقة في `site/assets/` تُستخدم تلقائيًا إذا تعذّر الوصول إلى Supabase.
- المفتاح في `app.js` هو **publishable key** (عام بطبيعته). لا يُوضع أي مفتاح سري في الكود.
