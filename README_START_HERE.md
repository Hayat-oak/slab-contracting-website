# SLAB Website → Claude Transfer Package

هذه الحزمة تنقل المشروع الحالي مع **الكود الفعلي** و**المعلومات والتصميم المرجعي**، ولا تكتفي بوصف عام.

## كيفية استخدامها في Claude

1. ارفع `SLAB_FULL_PROJECT_BRIEF_AR.md` و`CLAUDE_START_PROMPT_AR.md` داخل محادثة Claude (أو انسخ محتوى ملف التعليمات).
2. أرفق `references/SLAB_PROFILE_2026.pdf` و`references/SLAB_UI_Reference.png` عند الحاجة إلى فهم المحتوى والشكل.
3. أرفق ملفات `site/` أو ZIP الكامل عندما تستخدم Claude Code/بيئة تسمح بفك الضغط والعمل على الملفات. قد لا تتمكن بعض واجهات الدردشة من فك ZIP وحدها.
4. افتح `SLAB_preview_singlefile.html` محليًا في Chrome/Edge لمشاهدة نموذج الموقع الذي تسلّمه Claude.
5. إذا استخدمت Claude Code، افتح مجلد الحزمة كمجلد المشروع واقرأ `CLAUDE.md`.

## محتويات الحزمة

- `README_START_HERE.md`: هذا الملف.
- `SLAB_FULL_PROJECT_BRIEF_AR.md`: مواصفات شاملة بالعربية مع خريطة الصفحات والبيانات والأولويات.
- `CLAUDE_START_PROMPT_AR.md`: توجيه جاهز للنسخ إلى Claude.
- `CLAUDE.md`: تعليمات تقنية مباشرة لـ Claude Code.
- `site/index.html`, `styles.css`, `app.js`: كود مصدر الموقع.
- `site/assets/`: 44 صورة WebP للشركة وfavicon.
- `site/verify_site.cjs`: اختبار مسارات وصور ثابت.
- `references/SLAB_PROFILE_2026.pdf`: المصدر الرسمي للمحتوى وصور المشاريع.
- `references/SLAB_UI_Reference.png`: مرجع تصميم الصفحات المرفق من صاحبة المشروع.
- `references/Early_Visual_Concept.png`: تصور بصري أولي سابق، ثانوي للمرجع الأساسي.
- `SLAB_preview_singlefile.html`: معاينة HTML بملف واحد.

## معلومات مهمة

**لا يوجد نقل آلي لحساب Claude من خلال هذه الحزمة**؛ عليك رفع هذه الملفات إلى Claude بنفسك. الموقع غير منشور بعد، ولا يستقبل النماذج في وضع المعاينة المحلية. تحققي من رقم التواصل وحقوق نشر الصور قبل الإطلاق.

## فحص سريع

افتح `site/index.html` أو نفذ:

```bash
cd site
node verify_site.cjs
```

إذا أردت إعادة نشره، ابدأ بإجراء مراجعة مع التسويق والإدارة ثم اختبر الاستضافة ونموذج استقبال الطلبات فعليًا.
