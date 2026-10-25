'use strict';
/*
 * SLAB Contracting — public marketing website (vanilla JS, hash routing).
 * Content source of truth: references/SLAB_PROFILE_2026.pdf (page numbers noted in `source`).
 * Anything not in the profile is marked "UNVERIFIED" in a comment and listed in QA_REPORT.md.
 */

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

// Supabase: enquiries are stored in table `project_enquiries` (visitors may INSERT only, enforced by RLS);
// project photos are served from the public Storage bucket `site-assets`. The publishable key is public by design.
const SUPABASE_URL = 'https://oydrudnqcazzytauodup.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4Ep7dLPR3odGYd_uf3GDtw_0U4ieWvw';
const ASSET_BASE = `${SUPABASE_URL}/storage/v1/object/public/site-assets/projects/`;

// Photos load from Supabase Storage; site/assets keeps identical local copies used as a fallback (see 'error' listener).
const IMAGE = (slug, i = 1) => `${ASSET_BASE}${slug}_${i}.webp`;
// Large versions (up to 2400px) for backgrounds, gallery and lightbox. Most come from SLAB's original photography;
// 4 (Ajlan Riviera 19 #1-2, Almajidiya 116 #2, Almajidiya 130 #4) are enhanced upscales until originals are supplied.
const HD = (slug, i = 1) => `${ASSET_BASE}hd/${slug}_${i}.webp`;
const localAsset = url => url.replace(ASSET_BASE, 'assets/');

// `images` must equal the number of assets/{id}_{n}.webp files (checked by verify_site.cjs and qa/selftest.html).
// Interior room photos only, one photo per space — outdoor areas, exteriors and repeat shots of the same room are excluded.
// `sizes` are apartment sizes in m², copied from the profile table for each project.
// Client corrections (2026-10-25): Masharef 14 units; Ajlan Riviera 11 -> 12 (1 unit); Ajlan Riviera 19 -> 21;
// Jawhara Al Narjis 8 -> 1 unit. Project ids are unchanged so image files and links keep working.
const projects = [
  {id:'soulhittin', name:'SOUL Hittin', ar:'سول حطين', client:'OHG', clientAr:'OHG', units:9, sizes:['132.26'], images:6, category:'soul', source:26},
  {id:'almughrizat', name:'Almughrizat Building', ar:'مبنى المغرزات', client:'Aliyah Homes', clientAr:'عليّة هومز', units:25, sizes:['50','107'], images:3, category:'aliyah', source:13},
  {id:'masharef', name:'Masharef Building', ar:'مبنى مشارف', client:'Aliyah Homes', clientAr:'عليّة هومز', units:14, sizes:['117','121','160'], images:3, category:'aliyah', source:14},
  {id:'mkin30', name:'Mkin 30', ar:'مكين 30', client:'Aliyah Homes', clientAr:'عليّة هومز', units:1, sizes:['245'], images:2, category:'aliyah', source:16},
  {id:'nirvana12', name:'Nirvana 12', ar:'نيرفانا 12', client:'Aliyah Homes', clientAr:'عليّة هومز', units:2, sizes:['50','145'], images:3, category:'aliyah', source:15},
  {id:'ajlan11', name:'Ajlan Riviera 12', ar:'عجلان ريفيرا 12', client:'Aliyah Homes', clientAr:'عليّة هومز', units:1, sizes:['92','169'], images:3, category:'aliyah', source:17},
  {id:'almajidiya116', name:'Almajidiya 116', ar:'المجيدية 116', client:'Aliyah Homes', clientAr:'عليّة هومز', units:4, sizes:['77','101','128','130'], images:2, category:'aliyah', source:19},
  {id:'almajidiya111', name:'Al Majidiya Residence 111', ar:'المجيدية ريزيدنس 111', client:'Aliyah Homes', clientAr:'عليّة هومز', units:1, sizes:['120'], images:4, category:'aliyah', source:20},
  {id:'jawhara8', name:'Jawhara Al Narjis 8', ar:'جوهرة النرجس 8', client:'Aliyah Homes', clientAr:'عليّة هومز', units:1, sizes:['50','145'], images:4, category:'aliyah', source:21},
  {id:'ajlan19', name:'Ajlan Riviera 21', ar:'عجلان ريفيرا 21', client:'Aliyah Homes', clientAr:'عليّة هومز', units:1, sizes:['137'], images:2, category:'aliyah', source:22},
  {id:'almajidiya70', name:'Almajidiya 70', ar:'المجيدية 70', client:'Aliyah Homes', clientAr:'عليّة هومز', units:1, sizes:['90'], images:3, category:'aliyah', source:23},
  {id:'almajidiya130', name:'Almajidiya 130', ar:'المجيدية 130', client:'Aliyah Homes', clientAr:'عليّة هومز', units:1, sizes:['128'], images:4, category:'aliyah', source:24},
  // NEEDS CLIENT REVIEW: profile p.18 lists 2 units but four sizes, identical to Almajidiya 116 (p.19). Shown as printed.
  {id:'ajlan37', name:'Ajlan Riviera 37', ar:'عجلان ريفيرا 37', client:'Aliyah Homes', clientAr:'عليّة هومز', units:2, sizes:['77','101','128','130'], images:2, category:'aliyah', source:18, review:true}
];

// Full-width and large placements use photos that have high-resolution originals (assets/hd, from SLAB's Drive folders).
const heroSlides = [['almughrizat', 1], ['soulhittin', 1], ['almajidiya111', 1], ['almajidiya116', 1]];
// One visual per delivery stage. Design = SLAB floor plan; Execute/Control/Deliver = SLAB team photos shown whole ('full');
// stages 1, 3, 4 use free Unsplash License photos
// (see references/image_sources.tsv) until SLAB site photography is supplied. Replace files in assets/process/ to update.
const processVisuals = [
  {src: 'assets/process/1-understand.webp', kind: 'photo'},
  {src: 'assets/process/2-design.webp', kind: 'drawing'},
  {src: 'assets/process/3-approve.webp', kind: 'photo'},
  {src: 'assets/process/4-plan.webp', kind: 'photo'},
  {src: 'assets/process/5-execute-team-full.webp', kind: 'full'},
  {src: 'assets/process/6-control-team-full.webp', kind: 'full'},
  {src: 'assets/process/7-deliver-team-full.webp', kind: 'full'}
];
const servicePhotos = [['nirvana12', 2], ['almajidiya111', 2], ['almughrizat', 3], ['almajidiya130', 1]];
// Form values for the 'services' multi-select; must match the check constraint on project_enquiries.services.
const SERVICE_KEYS = ['fit-out-execution', 'design', 'interior-fit-out', 'project-contract-management'];
const ICON_CHECK = '<svg class="icon chip-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PHONE = '920066197'; // UNVERIFIED: not in the profile — confirm before launch.
const PHONE_DISPLAY = '9200 66197';

const phrases = {
 en: {
 home:'Home', projects:'Projects', services:'Services', about:'About', process:'Our Process', contact:'Contact', privacy:'Privacy', start:'Start a Project', back:'Projects', explore:'Explore Our Projects',
 skip:'Skip to content', language:'العربية', languageLabel:'Switch to Arabic', brandLabel:'SLAB Contracting — home', closeMenu:'Close navigation menu',
 heroTop:'SAUDI CONSTRUCTION · DESIGN · FIT-OUT', heroA:'Design', heroB:'Build', heroC:'Deliver', heroS:'Build with greater control.', heroSlide:'Show project photo', heroNow:'Featured', pauseVideo:'Pause background video', playVideo:'Play background video',
 ourServices:'Our Services', servicesSub:'Integrated construction and fit-out solutions, from concept to completion.', viewAll:'View All',
 service1:'Fit-Out & Execution', service1desc:'End-to-end site delivery supported by planning and quality control.',
 service2:'Design', service2desc:'Technical coordination and design development before execution.',
 service3:'Interior Fit-Out', service3desc:'Refined interiors designed for how spaces are used.',
 service4:'Project & Contract Management', service4desc:'Clear control of scope, resources, costs and schedules.',
 creating:'Crafting Meaningful Spaces', aboutHome:'SLAB Contracting is a Saudi construction and fit-out company, part of Oaktree Group. We bring design coordination, procurement, site execution, quality control and handover together in one integrated delivery process.',
 aboutSlab:'About SLAB', featured:'Featured Projects', featuredSub:'Real spaces. Delivered with purpose and precision.',
 bannerTitle:'Let’s Build\nYour Next Project', bannerDesc:'Tell us about your next project, and let’s begin the conversation.',
 projectHero:'Projects', projectsTagline:'A COLLECTION OF RESIDENTIAL DESIGN, FURNITURE & FIT-OUT WORK.', all:'All', aliyah:'Aliyah Homes', soul:'SOUL', showing:'projects shown', filterLabel:'Filter projects by client',
 projectTitle:'Residential Fit-Out', type:'Type',
 location:'Location', client:'Client', units:'Number of units', size:'Apartment size', scope:'Scope of work', riyadh:'Riyadh, Saudi Arabia', riyadhShort:'Riyadh', residential:'Residential', projScope:'Design, Furniture & Fit-Out',
 scopeItems:'Design|Furniture|Fit-Out',
 gallery:'Gallery', overview:'Overview', nextProject:'Next Project', prevProject:'Previous Project', similarProjects:'More Projects', projectTabs:'Project sections',
 view:'View', openPhoto:'Open full-screen photo', prevPhoto:'Previous photo', nextPhoto:'Next photo', closePhoto:'Close photo viewer', photo:'Photo', photoOf:'of',
 projectLead:(p)=>`A residential project in Riyadh for ${p.client}: ${p.units} ${p.units===1?'unit':'units'}, delivered across design, furniture and fit-out.`,
 projectOverview:'SLAB’s scope on this project covered design, furniture and fit-out, coordinated through one delivery team from early definition to handover.',
 deliveredThrough:'Delivered through the SLAB process', seeProcess:'See our seven stages',
 servicesHero:'Services', servicesHeroSub:'COMPREHENSIVE CONSTRUCTION AND FIT-OUT SOLUTIONS', servicesIntro:'One coordinated approach, from project definition to delivery.',
 serviceLong1:'End-to-end project execution supported by planning, site management, quality control, and stakeholder coordination.',
 serviceLong2:'Coordinate design development, technical requirements, stakeholder review, and approvals before execution.',
 serviceLong3:'Deliver functional, refined interior environments aligned with the operational and design requirements of each asset.',
 serviceLong4:'Coordinate scope, contractors, schedules, procurement, resources, reporting, and contractual requirements.',
 sectors:'Sectors We Serve', sectorsSub:'Solutions shaped for a range of environments and operational needs.', hospitality:'Hospitality', hospitalityDesc:'Hotels, serviced residences and guest-facing spaces.', residentialDesc:'Apartments, villas, compounds and renovation programs.', commercial:'Commercial', commercialDesc:'Offices, towers, mixed-use environments and commercial fit-out.', institutional:'Government & Institutional', institutionalDesc:'Projects requiring governance, accountability and documented controls.',
 aboutHero:'About SLAB', aboutHeroSub:'SAUDI CONTRACTING · INTEGRATED DELIVERY', ourStory:'Our Story', storyCopy:'SLAB Contracting is a Saudi construction and fit-out company, part of Oaktree Group. We work with residential, hospitality, commercial and institutional clients through design support, procurement, construction and interior fit-out.',
 storyCopy2:'Our role spans early project definition, technical coordination, execution, quality control and handover — with a structured focus on scope, cost, schedule and quality.',
 storyTitle:'Design & Build and Fit-Out Expertise', aboutNav:'On this page',
 delivery:'Integrated Delivery', deliveryDesc:'Design coordination, construction, fit-out and handover through one framework.', control:'Structured Control', controlDesc:'Oversight of scope, schedule, procurement, cost, quality and site progress.',ksa:'KSA Coverage',ksaDesc:'Project experience across Riyadh, Madinah and Jeddah.',
 principles:'Our Delivery Principles', principlesSub:'Precision. Control. Value.', principlesLead:'Successful construction is measured by more than completion — by the quality of execution, the control maintained throughout delivery, and the long-term performance of the finished asset.', precision:'Precision', precisionDesc:'Deliver against standards, coordinated designs and approved requirements.', controlPrinciple:'Control', controlPrincipleDesc:'Maintain visibility across progress, resources, procurement, cost, quality and execution.',value:'Value',valueDesc:'Make delivery decisions with readiness, durability and long-term asset performance in mind.',
 stats1:'Units delivered or in progress',stats2:'Cities: Riyadh, Madinah & Jeddah',stats3:'Sectors served',stats4:'Delivery stages',why:'Why Clients Choose SLAB', whyDesc:'A coordinated approach, digital tools and local delivery knowledge help projects move forward with clarity.',
 why1:'Integrated Delivery',why1d:'A coordinated approach across design support, procurement, construction, fit-out and handover.',
 why2:'Project Control',why2d:'Structured management of scope, schedule, quality, cost and reporting.',
 why3:'Technology-Enabled Oversight',why3d:'Digital tools support project visibility, procurement tracking and faster decision-making.',
 why4:'Local Delivery Knowledge',why4d:'Project activity across Riyadh, Madinah and Jeddah, with an understanding of local execution requirements.',
 why5:'Growing Portfolio',why5d:'A developing pipeline across residential, hospitality, renovation and commercial opportunities.',
 why6:'Part of Oaktree Group',why6d:'Operating within the Oaktree Group ecosystem, supporting SLAB’s continued growth and project delivery.',
 processHero:'Our Process',processHeroSub:'A STRUCTURED APPROACH FROM FIRST BRIEF TO HANDOVER',processTitle:'The SLAB Delivery Process',
 processIntro:'Explore the seven stages of our integrated project delivery approach.', processStages:'Delivery stages', stage:'Stage', prevStage:'Previous stage', nextStage:'Next stage', expand:'Expand',
 processTeaser:'Seven stages. One accountable team.', processTeaserSub:'From the first brief to handover, every SLAB project follows the same structured path.',
 p1:'Understand',p1d:'Confirm objectives, technical requirements, budget priorities, site conditions and operational needs.',
 p2:'Design',p2d:'Translate the brief into coordinated architectural, interior and technical specifications.',
 p3:'Approve',p3d:'Complete stakeholder review and design sign-off before procurement and construction.',
 p4:'Plan',p4d:'Define scope, schedule, resources, procurement requirements, vendor strategy and key controls.',
 p5:'Execute',p5d:'Coordinate site activities and stakeholders through structured supervision and quality management.',
 p6:'Control',p6d:'Track progress, workforce activity, resources, cost, timelines and reporting.',
 p7:'Deliver',p7d:'Inspect, close out, hand over and prepare the asset for its intended use.',
 tech:'Technology Supporting Delivery',tech1:'Cost & Resource Visibility',tech1d:'Clear insight into costs and resource allocation to support faster, better-informed decisions.',tech2:'Progress Reporting',tech2d:'Regular reporting on project status and completion progress.',tech3:'Digital Project Management',tech3d:'Centralized coordination of tasks, schedules and resources across active projects.',tech4:'AI Workforce Monitoring',tech4d:'Real-time attendance and site activity tracking powered by AI.',
 contactHero:'Contact',contactHeroSub:'LET’S DISCUSS YOUR NEXT PROJECT',getInTouch:'Get in Touch',contactCopy:'Whether you are defining a new project or preparing for fit-out, tell us what you have in mind. Our team will review your enquiry.',
 phone:'Phone', locationOffice:'Saudi Arabia', activeIn:'Active in Riyadh, Madinah & Jeddah', fullName:'Full name',email:'Email address',phoneField:'Phone number',sector:'Project sector', servicesNeeded:'Services required', servicesHint:'Select one or more.', errServices:'Please select at least one service.',projectLocation:'Project location (city)',message:'Project description',messageHint:'Scope, size, timing — whatever you know so far.',send:'Send Enquiry',sending:'Sending…',choose:'Select a sector',required:'Required',
 consent:'I agree that SLAB may use these details to respond to my enquiry, as described in the', consentLink:'privacy notice',
 errRequired:'Please fill in this field.', errEmail:'Please enter a valid email address.', errPhone:'Please enter a valid phone number (8–15 digits).', errShort:'Please add a little more detail (at least 12 characters).', errConsent:'Please confirm you agree to the privacy notice.', errSummary:'Please correct the highlighted fields.', errTooFast:'That was very fast — please review your details and send again.',
 formNote:'Fields marked * are required. Your details are used only to respond to this enquiry.',
 localNote:'This is a local preview file, so nothing was sent. Please use the published website to send an enquiry, or call SLAB on the number shown.', sendSuccessTitle:'Thank you — your enquiry has been received.', sendSuccess:'Our team will review your project details and get back to you.', sendAnother:'Send another enquiry', sendError:'The form could not be submitted. Please try again or call the phone number shown.',
 privacyTitle:'Privacy Notice', privacyDraft:'Draft for review — this notice must be approved by SLAB management and legal before launch.',
 privacyBody:[
  ['What we collect','When you submit a project enquiry we collect your name, email address, phone number, project sector, project location and the description you provide.'],
  ['Why we collect it','We use these details only to review and respond to your enquiry and to discuss your project with you.'],
  ['Who can see it','Enquiries are received by SLAB Contracting staff responsible for responding to project requests, through the website’s form-hosting provider.'],
  ['How long we keep it','We keep enquiry details only for as long as needed to respond and to manage any resulting business relationship, unless a longer period is required by law.'],
  ['Your rights','You may ask us to access, correct or delete your details by contacting SLAB using the phone number on the Contact page.']],
 quick:'Quick Links',contactLabel:'Contact',rights:'All rights reserved.',part:'Part of Oaktree Group',brandTag:'Design · Build · Deliver',learn:'Learn More',
 navMenu:'Open navigation menu',noData:'No projects match the selected filter.', notFound:'This page could not be found.', interiorBusiness:'Integrated Construction & Project Delivery', sourcePhoto:'Project photography: SLAB Company Profile 2026.',
 },
 ar: {
 home:'الرئيسية',projects:'المشاريع',services:'خدماتنا',about:'من نحن',process:'مراحل العمل',contact:'تواصل معنا',privacy:'الخصوصية',start:'ابدأ مشروعك',back:'المشاريع',explore:'استكشف مشاريعنا',
 skip:'انتقل إلى المحتوى',language:'English',languageLabel:'التبديل إلى الإنجليزية',brandLabel:'سلاب للمقاولات — الرئيسية',closeMenu:'إغلاق قائمة التنقل',
 heroTop:'الإنشاءات · التصميم · التشطيبات',heroA:'نصمم',heroB:'ننفذ',heroC:'نسلّم',heroS:'تنفيذ بتحكم أكبر.',heroSlide:'عرض صورة المشروع',heroNow:'مشروع مختار',pauseVideo:'إيقاف الفيديو',playVideo:'تشغيل الفيديو',
 ourServices:'خدماتنا',servicesSub:'حلول متكاملة للإنشاءات والتشطيبات، من الفكرة إلى التسليم.',viewAll:'عرض الكل',
 service1:'التشطيبات والتنفيذ',service1desc:'تنفيذ متكامل مع التخطيط والإشراف وضبط الجودة.',service2:'التصميم',service2desc:'تنسيق التصميم والمتطلبات الفنية قبل التنفيذ.',
 service3:'التشطيبات الداخلية',service3desc:'مساحات داخلية عملية تراعي التصميم ومتطلبات الاستخدام.',service4:'إدارة المشاريع والعقود',service4desc:'إدارة نطاق الأعمال والموارد والتكاليف والجداول.',
 creating:'نصنع مساحات ذات معنى',aboutHome:'سلاب للمقاولات شركة سعودية متخصصة في الإنشاءات والتشطيبات، وهي جزء من مجموعة أوكتري. تجمع بين تنسيق التصميم والمشتريات والتنفيذ وضبط الجودة والتسليم في إطار عمل متكامل.',aboutSlab:'تعرف على سلاب',featured:'مشاريع مختارة',featuredSub:'مساحات حقيقية نُفذت بعناية ودقة.',
 bannerTitle:'لنبدأ\nمشروعك القادم',bannerDesc:'حدثنا عن مشروعك القادم لنبدأ رحلة العمل معًا.',
 projectHero:'مشاريعنا',projectsTagline:'مجموعة من أعمال التصميم والأثاث والتشطيبات السكنية',all:'الكل',aliyah:'عليّة هومز',soul:'سول',showing:'مشروع معروض',filterLabel:'تصفية المشاريع حسب العميل',
 projectTitle:'تشطيبات سكنية',type:'النوع',
 location:'الموقع',client:'العميل',units:'عدد الوحدات',size:'مساحات الشقق',scope:'نطاق العمل',riyadh:'الرياض، المملكة العربية السعودية',riyadhShort:'الرياض',residential:'سكني',projScope:'التصميم والأثاث والتشطيبات',
 scopeItems:'التصميم|الأثاث|التشطيبات',
 gallery:'الصور',overview:'نبذة',nextProject:'المشروع التالي',prevProject:'المشروع السابق',similarProjects:'مشاريع أخرى',projectTabs:'أقسام المشروع',
view:'عرض',openPhoto:'عرض الصورة بملء الشاشة',prevPhoto:'الصورة السابقة',nextPhoto:'الصورة التالية',closePhoto:'إغلاق عارض الصور',photo:'صورة',photoOf:'من',
 projectLead:(p)=>`مشروع سكني في الرياض لصالح ${p.clientAr}: ${arUnits(p.units)}، شمل التصميم والأثاث والتشطيبات.`,
 projectOverview:'شمل نطاق عمل سلاب في هذا المشروع التصميم والأثاث والتشطيبات، بتنسيق فريق تنفيذ واحد من تعريف المشروع حتى التسليم.',
 deliveredThrough:'نُفذ وفق منهجية سلاب',seeProcess:'تعرّف على مراحلنا السبع',
 servicesHero:'خدماتنا',servicesHeroSub:'حلول متكاملة للإنشاءات والتشطيبات',servicesIntro:'إطار عمل منسق من تعريف المشروع حتى التسليم.',
 serviceLong1:'تنفيذ متكامل للمشاريع بدعم من التخطيط وإدارة الموقع وضبط الجودة والتنسيق مع الأطراف المعنية.',serviceLong2:'تنسيق تطوير التصاميم والمتطلبات الفنية ومراجعة الجهات المعنية والموافقات قبل التنفيذ.',
 serviceLong3:'تنفيذ بيئات داخلية عملية ومدروسة تتماشى مع المتطلبات التشغيلية والتصميمية لكل مشروع.',serviceLong4:'تنسيق النطاق والمقاولين والجداول والمشتريات والموارد والتقارير ومتطلبات العقود.',
 sectors:'القطاعات التي نخدمها',sectorsSub:'حلول تلائم أنواعًا مختلفة من المشاريع والمتطلبات التشغيلية.',hospitality:'الضيافة',hospitalityDesc:'الفنادق والشقق المخدومة والمساحات المخصصة للضيوف.',residentialDesc:'الشقق والفلل والمجمعات السكنية وبرامج التجديد.',commercial:'التجاري',commercialDesc:'المكاتب والأبراج والمشاريع متعددة الاستخدام والتشطيبات التجارية.',institutional:'الحكومي والمؤسسي',institutionalDesc:'مشاريع تتطلب الحوكمة والمساءلة والالتزام والتوثيق.',
 aboutHero:'من نحن',aboutHeroSub:'مقاولات سعودية · تنفيذ متكامل',ourStory:'قصتنا',storyCopy:'سلاب للمقاولات شركة سعودية متخصصة في الإنشاءات والتشطيبات، وهي جزء من مجموعة أوكتري. نخدم المشاريع السكنية والضيافة والتجارية والمؤسسية عبر دعم التصميم والمشتريات والإنشاءات والتشطيبات الداخلية.',storyCopy2:'يشمل دورنا تعريف المشروع وتنسيق الجوانب الفنية والتنفيذ وضبط الجودة والتسليم، مع تركيز منظم على النطاق والتكلفة والجدول والجودة.',
 storyTitle:'خبرة في التصميم والبناء والتشطيبات',aboutNav:'في هذه الصفحة',
 delivery:'تنفيذ متكامل',deliveryDesc:'تنسيق التصميم والإنشاءات والتشطيبات والتسليم ضمن إطار واحد.',control:'رقابة منظمة',controlDesc:'متابعة نطاق الأعمال والجدول والمشتريات والتكلفة والجودة والموقع.',ksa:'انتشار داخل المملكة',ksaDesc:'خبرة في مشاريع بالرياض والمدينة المنورة وجدة.',
 principles:'مبادئنا في التنفيذ',principlesSub:'الدقة. التحكم. القيمة.',principlesLead:'لا يُقاس نجاح الإنشاء بالإنجاز وحده، بل بجودة التنفيذ ومستوى التحكم طوال مراحل المشروع والأداء طويل الأجل للأصل المنجز.',precision:'الدقة',precisionDesc:'التنفيذ وفق المعايير والتصاميم المنسقة والمتطلبات المعتمدة.',controlPrinciple:'التحكم',controlPrincipleDesc:'الوضوح في متابعة تقدم الأعمال والموارد والمشتريات والتكاليف والجودة.',value:'القيمة',valueDesc:'اتخاذ قرارات تراعي الجاهزية التشغيلية والمتانة والأداء طويل الأجل.',
 stats1:'وحدة تم تسليمها أو قيد التنفيذ',stats2:'مدن: الرياض والمدينة وجدة',stats3:'قطاعات نخدمها',stats4:'مراحل للتنفيذ',why:'لماذا يختار العملاء سلاب؟',whyDesc:'التنفيذ المنسق والأدوات الرقمية والخبرة المحلية لتقدم واضح في المشاريع.',
 why1:'تنفيذ متكامل',why1d:'نهج منسق يشمل دعم التصميم والمشتريات والإنشاءات والتشطيبات والتسليم.',
 why2:'التحكم في المشروع',why2d:'إدارة منظمة للنطاق والجدول الزمني والجودة والتكلفة والتقارير.',
 why3:'إشراف مدعوم بالتقنية',why3d:'أدوات رقمية تدعم وضوح المشروع ومتابعة المشتريات وسرعة اتخاذ القرار.',
 why4:'خبرة محلية في التنفيذ',why4d:'مشاريع في الرياض والمدينة المنورة وجدة مع فهم لمتطلبات التنفيذ المحلية.',
 why5:'محفظة مشاريع متنامية',why5d:'فرص متنامية في المشاريع السكنية والضيافة والتجديد والمشاريع التجارية.',
 why6:'جزء من مجموعة أوكتري',why6d:'العمل ضمن منظومة مجموعة أوكتري بما يدعم نمو سلاب المستمر وتنفيذ مشاريعها.',
 processHero:'مراحل العمل',processHeroSub:'من دراسة المتطلبات إلى التسليم النهائي',processTitle:'مراحل تنفيذ مشاريع سلاب',processIntro:'تعرّف على المراحل السبع التي نعتمدها لإدارة عملية التنفيذ المتكاملة.',processStages:'مراحل التنفيذ',stage:'المرحلة',prevStage:'المرحلة السابقة',nextStage:'المرحلة التالية',expand:'تكبير',
 processTeaser:'سبع مراحل. فريق واحد مسؤول.',processTeaserSub:'من أول اجتماع حتى التسليم، يمر كل مشروع لدى سلاب بالمسار المنظم نفسه.',
 p1:'الفهم',p1d:'تحديد الأهداف والمتطلبات الفنية والأولويات المالية وظروف الموقع والاحتياجات التشغيلية.',p2:'التصميم',p2d:'تحويل متطلبات المشروع إلى تصاميم ومواصفات معمارية وداخلية وفنية منسقة.',p3:'الاعتماد',p3d:'إكمال المراجعات والموافقات قبل بدء المشتريات والإنشاءات.',p4:'التخطيط',p4d:'تحديد النطاق والجدول والموارد والمشتريات واستراتيجية الموردين وضوابط المشروع.',p5:'التنفيذ',p5d:'تنسيق الأعمال الميدانية تحت إشراف منظم وإدارة للجودة.',p6:'الرقابة',p6d:'متابعة التقدم والعمالة والموارد والتكلفة والجداول والتقارير.',p7:'التسليم',p7d:'الفحص وإغلاق الملاحظات والتسليم وتجهيز المشروع للاستخدام.',
 tech:'التقنيات الداعمة للتنفيذ',tech1:'وضوح التكاليف والموارد',tech1d:'متابعة التكاليف وتوزيع الموارد لدعم قرارات أسرع وأدق.',tech2:'تقارير التقدم',tech2d:'تحديثات منتظمة لحالة المشاريع ونسب الإنجاز.',tech3:'إدارة رقمية للمشاريع',tech3d:'تنسيق المهام والجداول والموارد في نظام موحد عبر المشاريع القائمة.',tech4:'مراقبة العمالة بالذكاء الاصطناعي',tech4d:'متابعة لحظية للحضور والنشاط في الموقع بتقنيات الذكاء الاصطناعي.',
 contactHero:'تواصل معنا',contactHeroSub:'لنتحدث عن مشروعك القادم',getInTouch:'يسعدنا تواصلك',contactCopy:'سواء كنت تخطط لمشروع جديد أو تستعد لأعمال التشطيب، شاركنا فكرتك ومتطلباتك ليتواصل معك فريقنا.',phone:'الهاتف',locationOffice:'المملكة العربية السعودية',activeIn:'مشاريع في الرياض والمدينة المنورة وجدة',fullName:'الاسم الكامل',email:'البريد الإلكتروني',phoneField:'رقم الجوال',sector:'قطاع المشروع',servicesNeeded:'الخدمات المطلوبة',servicesHint:'يمكنك اختيار أكثر من خدمة.',errServices:'يرجى اختيار خدمة واحدة على الأقل.',projectLocation:'موقع المشروع (المدينة)',message:'وصف المشروع',messageHint:'النطاق والمساحة والتوقيت — ما يتوفر لديك حاليًا.',send:'إرسال الطلب',sending:'جارٍ الإرسال…',choose:'اختر القطاع',required:'إلزامي',
 consent:'أوافق على استخدام سلاب لهذه البيانات للرد على طلبي، وفق',consentLink:'إشعار الخصوصية',
 errRequired:'يرجى تعبئة هذا الحقل.',errEmail:'يرجى إدخال بريد إلكتروني صحيح.',errPhone:'يرجى إدخال رقم جوال صحيح (من 8 إلى 15 رقمًا).',errShort:'يرجى إضافة تفاصيل أكثر (12 حرفًا على الأقل).',errConsent:'يرجى الموافقة على إشعار الخصوصية.',errSummary:'يرجى تصحيح الحقول المحددة.',errTooFast:'تم الإرسال بسرعة كبيرة — يرجى مراجعة البيانات والإرسال مجددًا.',
 formNote:'الحقول المعلّمة بـ * إلزامية. تُستخدم بياناتك فقط للرد على هذا الطلب.',
 localNote:'هذا ملف معاينة محلي، لذلك لم يُرسل أي طلب. يرجى استخدام الموقع المنشور لإرسال طلبك، أو الاتصال بسلاب على الرقم الموضح.',sendSuccessTitle:'شكرًا لك، تم استلام طلبك.',sendSuccess:'سيراجع فريقنا تفاصيل مشروعك ويتواصل معك.',sendAnother:'إرسال طلب آخر',sendError:'تعذّر إرسال الطلب. يرجى المحاولة مجددًا أو الاتصال بالرقم الموضح.',
 privacyTitle:'إشعار الخصوصية',privacyDraft:'مسودة للمراجعة — يجب اعتماد هذا الإشعار من إدارة سلاب والإدارة القانونية قبل الإطلاق.',
 privacyBody:[
  ['البيانات التي نجمعها','عند إرسال طلب مشروع نجمع اسمك وبريدك الإلكتروني ورقم جوالك وقطاع المشروع وموقعه والوصف الذي تقدمه.'],
  ['سبب جمعها','نستخدم هذه البيانات فقط لمراجعة طلبك والرد عليه ومناقشة مشروعك معك.'],
  ['من يطّلع عليها','يستقبل الطلبات موظفو سلاب للمقاولات المسؤولون عن الرد على طلبات المشاريع، عبر مزود استضافة النماذج الخاص بالموقع.'],
  ['مدة الاحتفاظ','نحتفظ ببيانات الطلب للمدة اللازمة للرد وإدارة أي علاقة عمل تنتج عنه فقط، ما لم يتطلب النظام مدة أطول.'],
  ['حقوقك','يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها بالتواصل مع سلاب عبر رقم الهاتف في صفحة التواصل.']],
 quick:'روابط سريعة',contactLabel:'التواصل',rights:'جميع الحقوق محفوظة.',part:'جزء من مجموعة أوكتري',brandTag:'نصمم · ننفذ · نسلّم',learn:'اعرف المزيد',navMenu:'فتح قائمة التنقل',noData:'لا توجد مشاريع ضمن التصنيف المختار.',notFound:'تعذّر العثور على هذه الصفحة.',interiorBusiness:'إنشاءات وتنفيذ مشاريع متكاملة',sourcePhoto:'صور المشاريع: الملف التعريفي لسلاب 2026.'
 }
};

const metaDescriptions = {
  en: {
    home: 'SLAB Contracting — Saudi construction, design and fit-out company, part of Oaktree Group. Integrated project delivery from first brief to handover.',
    projects: 'Residential design, furniture and fit-out projects delivered by SLAB Contracting in Riyadh.',
    services: 'Fit-out & execution, design, interior fit-out, and project & contract management for hospitality, residential, commercial and institutional clients.',
    about: 'SLAB Contracting is a Saudi construction and fit-out company, part of Oaktree Group. Precision, control and value in every project.',
    process: 'The SLAB delivery process: Understand, Design, Approve, Plan, Execute, Control, Deliver.',
    contact: 'Start a project with SLAB Contracting. Tell us about your project and our team will review your enquiry.'
  },
  ar: {
    home: 'سلاب للمقاولات — شركة سعودية للإنشاءات والتصميم والتشطيبات، جزء من مجموعة أوكتري. تنفيذ متكامل من الفكرة إلى التسليم.',
    projects: 'مشاريع تصميم وأثاث وتشطيبات سكنية نفذتها سلاب للمقاولات في الرياض.',
    services: 'التشطيبات والتنفيذ، التصميم، التشطيبات الداخلية، وإدارة المشاريع والعقود لقطاعات الضيافة والسكني والتجاري والمؤسسي.',
    about: 'سلاب للمقاولات شركة سعودية للإنشاءات والتشطيبات، جزء من مجموعة أوكتري. الدقة والتحكم والقيمة في كل مشروع.',
    process: 'مراحل التنفيذ لدى سلاب: الفهم، التصميم، الاعتماد، التخطيط، التنفيذ، الرقابة، التسليم.',
    contact: 'ابدأ مشروعك مع سلاب للمقاولات. شاركنا تفاصيل مشروعك ليتواصل معك فريقنا.'
  }
};

/* ------------------------------------------------------------------ */
/* State & helpers                                                      */
/* ------------------------------------------------------------------ */

function initialLanguage() {
  try {
    const fromUrl = new URLSearchParams(location.search || '').get('lang');
    if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl;
  } catch (e) {}
  try { return localStorage.getItem('slab-lang') === 'ar' ? 'ar' : 'en'; } catch (e) { return 'en'; }
}

const state = {language: initialLanguage(), filter: 'all', step: 0, slide: 0, gallery: 0, projectTab: 'gallery', mobile: false, formStarted: 0};
const $app = document.getElementById('app');
const t = k => (phrases[state.language][k] ?? phrases.en[k] ?? k);
const isAR = () => state.language === 'ar';
const pname = p => isAR() ? p.ar : p.name;
const pclient = p => isAR() ? p.clientAr : p.client;
const href = s => `#/${s}`;
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const matches = q => !!(window.matchMedia && window.matchMedia(q).matches);
const reducedMotion = () => matches('(prefers-reduced-motion: reduce)');
const units = p => isAR() ? arUnits(p.units) : `${p.units} ${p.units === 1 ? 'unit' : 'units'}`;
// Arabic number agreement: 1 وحدة واحدة، 2 وحدتان، 3–10 وحدات، 11+ وحدة.
const arUnits = n => n === 1 ? 'وحدة واحدة' : n === 2 ? 'وحدتان' : n <= 10 ? `${n} وحدات` : `${n} وحدة`;
const joinList = items => {
  if (items.length < 2) return items.join('');
  const last = items[items.length - 1];
  return isAR() ? `${items.slice(0, -1).join('، ')} و${last}` : `${items.slice(0, -1).join(', ')} & ${last}`;
};
const sizes = p => joinList(p.sizes.map(s => `${s} ${isAR() ? 'م²' : 'm²'}`));
const img = (slug, n = 1, alt = '', attrs = 'loading="lazy" decoding="async"') => `<img src="${IMAGE(slug, n)}" alt="${esc(alt)}" ${attrs}>`;

// Inline SVG icons. Directional icons get .flip so they mirror in RTL.
const ICON = {
  arrow: '<svg class="icon flip" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  diag: '<svg class="icon flip" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  back: '<svg class="icon flip" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>',
  prev: '<svg class="icon flip" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
  next: '<svg class="icon flip" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>',
  menu: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18M3 16h18"/></svg>',
  expand: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  phone: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>',
  pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  group: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6"/></svg>',
  pause: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>',
  play: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>'
};


// SLAB logo as SVG, traced from the official colour logo supplied by SLAB: slab symbol in its brand colours,
// lettering outlined from the artwork (currentColor: navy #2b373e on light backgrounds, white over the hero).
// Replace with the official vector master when marketing provides it.
const LOGO = `<svg class="logo" viewBox="60 66 340 186" aria-hidden="true" focusable="false">
  <path class="logo-slab-top" d="M66.7 115 157 72h94v57l-91 36.7H66.7z"/>
  <path class="logo-slab-bottom" d="M66.7 208 160 174h91v45l-91 28H66.7z"/>
  <path class="logo-letters" fill-rule="evenodd" d=" M294.3 72.5L297.5 72.1L303.5 72.2L308.5 73.2L314.2 75.5L315.5 76.2L318.2 78.5L320.5 81.1L322.9 85.5L323.8 88.5L324.0 91.5L323.5 91.8L314.5 91.9L313.5 91.4L312.0 87.5L310.7 85.5L309.5 84.3L307.5 83.1L304.5 82.1L299.5 81.7L294.5 82.1L291.5 83.2L288.8 85.5L288.0 86.5L287.2 88.5L287.0 90.5L287.2 92.5L288.1 94.5L290.5 96.8L292.5 97.8L298.5 99.9L311.5 103.4L315.5 105.2L318.5 107.1L320.5 108.8L322.7 111.5L324.7 115.5L325.6 119.5L325.7 123.5L324.5 128.5L323.1 130.5L320.5 132.7L316.5 133.9L315.8 134.5L314.7 137.5L312.5 139.6L310.5 140.7L307.5 141.7L302.5 142.2L299.5 142.3L293.5 141.8L289.5 140.8L284.5 138.7L279.5 134.6L277.3 131.5L275.2 127.5L274.2 124.5L273.9 122.5L274.2 121.5L274.5 121.3L283.5 121.2L284.5 122.0L286.0 125.5L288.1 128.5L289.5 129.8L291.5 131.0L294.5 132.0L298.5 132.8L301.5 133.0L313.5 132.8L314.7 132.5L315.0 131.5L314.9 121.5L313.8 118.5L311.5 116.0L306.5 113.2L303.5 112.1L293.5 109.6L288.5 107.8L284.5 105.9L281.5 103.5L279.5 101.5L277.4 97.5L276.4 93.5L276.3 89.5L277.2 85.5L278.4 82.5L279.5 80.8L281.5 78.5L285.5 75.4L290.5 73.4ZM336.2 72.5L336.5 72.2L337.5 72.0L346.5 72.0L347.0 72.5L347.1 131.5L347.5 132.0L391.5 132.1L391.9 132.5L391.8 140.5L391.5 141.0L390.5 141.3L361.5 141.4L351.5 140.9L350.5 140.6L348.6 139.5L347.5 138.3L346.4 136.5L345.9 133.5L345.5 133.1L343.5 132.8L340.5 131.6L338.5 129.9L337.1 127.5L336.3 123.5ZM299.0 149.5L299.5 149.4L300.5 149.9L301.8 151.5L302.9 154.5L303.3 156.5L304.2 158.5L307.5 160.1L310.4 162.5L313.8 166.5L314.9 168.5L318.7 179.5L321.1 188.5L323.8 196.5L326.3 205.5L328.7 212.5L330.0 217.5L330.0 218.5L329.5 218.8L320.5 218.8L319.5 218.5L317.3 212.5L314.9 203.5L313.4 199.5L312.5 198.9L300.5 198.9L286.5 198.9L285.9 199.5L285.1 201.5L280.8 216.5L279.9 218.5L279.5 218.8L270.5 218.8L269.3 218.5L269.3 217.5L272.7 206.5L275.2 196.5L275.8 195.5L277.8 188.5L279.3 182.5L283.3 169.5L284.2 167.5L286.3 164.5L288.1 162.5L289.5 161.2L292.5 159.3L294.6 158.5L295.1 157.5L296.3 152.5L297.3 150.5ZM336.4 150.5L350.5 150.2L370.5 150.4L375.5 151.1L378.5 152.4L381.5 154.3L383.5 156.2L385.8 159.5L386.9 162.5L387.3 166.5L386.9 170.5L385.8 173.5L384.7 175.5L383.5 176.8L381.5 178.5L376.9 181.5L381.5 183.2L383.5 184.2L387.5 187.7L389.7 190.5L390.7 192.5L391.7 196.5L391.9 199.5L391.6 201.5L390.7 204.5L389.5 206.4L388.5 207.5L385.5 209.6L382.3 210.5L381.5 211.5L380.5 213.8L379.0 215.5L377.5 216.7L375.5 217.8L372.4 218.5L369.5 218.8L346.5 218.8L337.5 218.8L336.3 218.5L336.2 217.5L336.2 151.5ZM296.0 159.5L296.5 159.1L299.5 158.8L301.5 158.9L302.8 159.5L304.8 166.5L308.3 181.5L309.8 186.5L310.4 189.5L309.5 190.5L303.5 190.5L289.5 190.5L288.6 189.5L290.3 182.5L290.7 181.5L293.3 169.5ZM347.0 160.5L347.5 159.9L348.5 159.8L366.5 159.8L370.5 160.2L372.5 161.2L374.5 162.8L375.9 164.5L376.8 167.5L376.6 170.5L375.8 172.5L374.5 174.0L372.5 175.8L370.5 176.7L368.5 177.0L362.5 177.3L347.5 177.2L347.0 176.5L347.0 175.5ZM347.3 186.5L348.5 186.1L367.5 186.2L372.5 186.9L375.5 188.1L379.1 191.5L380.7 194.5L381.1 197.5L381.1 202.5L380.9 208.5L380.5 209.4L379.5 209.6L347.5 209.3L347.0 208.5L347.0 207.5L347.0 187.5ZM271.1 228.5L272.5 228.0L275.5 227.9L277.5 228.5L278.6 229.5L278.7 230.5L277.5 230.9L275.5 229.2L274.5 229.1L273.5 229.1L272.5 229.7L271.8 230.5L271.2 231.5L271.1 233.5L272.7 235.5L273.5 236.0L274.5 236.0L275.5 235.9L277.5 234.2L278.8 234.5L278.7 235.5L277.9 236.5L275.5 237.5L273.5 237.6L270.7 236.5L269.2 234.5L269.0 232.5L269.3 230.5ZM283.1 228.5L284.5 227.9L288.5 228.0L289.5 228.3L291.0 229.5L291.6 230.5L291.8 231.5L291.7 234.5L290.5 236.2L289.5 236.9L287.5 237.5L285.5 237.6L283.5 236.9L281.9 235.5L281.2 234.5L281.1 231.5L281.3 230.5L281.9 229.5ZM294.1 228.5L294.5 228.1L295.5 228.0L296.5 228.0L297.5 228.4L301.5 233.8L302.6 233.5L302.6 228.5L303.5 228.0L304.5 228.4L304.5 236.5L303.5 237.2L301.5 236.9L297.5 231.7L296.5 230.8L296.1 231.5L296.0 236.5L295.5 237.2L294.5 237.1L294.2 236.5ZM306.2 228.5L306.5 228.2L307.5 228.0L314.5 228.0L315.5 228.5L314.5 229.2L312.5 229.2L312.1 229.5L311.8 230.5L311.8 233.5L311.8 236.5L311.5 236.9L310.5 237.3L309.9 236.5L309.9 230.5L309.6 229.5L306.5 228.9ZM317.1 228.5L317.5 228.1L322.5 228.0L324.5 228.1L325.5 228.5L326.2 229.5L326.4 230.5L326.1 231.5L325.3 232.5L326.1 234.5L326.3 236.5L325.5 237.3L324.5 236.7L324.0 234.5L323.5 233.9L322.5 233.6L320.5 233.5L319.5 234.1L319.2 234.5L319.2 236.5L318.5 237.2L317.5 237.1L317.1 236.5ZM332.6 228.5L333.5 228.0L335.5 228.2L335.8 228.5L339.9 236.5L339.5 237.2L338.5 237.3L336.5 235.1L331.5 235.1L330.5 236.6L329.5 237.3L328.6 236.5L331.4 230.5ZM343.4 228.5L345.5 227.9L348.5 228.0L349.5 228.2L350.9 229.5L351.0 230.5L350.5 230.8L349.5 230.7L347.5 229.1L346.5 229.1L345.5 229.2L344.0 230.5L343.5 232.5L343.9 234.5L345.5 235.9L346.5 236.0L347.5 236.0L349.5 234.4L350.5 234.2L351.0 234.5L351.0 235.5L349.5 237.0L346.5 237.6L343.5 236.9L342.1 235.5L341.3 233.5L341.2 232.5L341.3 231.5L342.2 229.5ZM352.7 228.5L353.5 227.9L361.5 228.0L362.0 228.5L361.5 229.1L359.5 229.2L358.5 229.5L358.2 230.5L358.2 232.5L358.2 236.5L357.5 237.3L356.5 237.0L356.2 236.5L356.2 230.5L355.9 229.5L355.5 229.2L353.5 229.2ZM363.9 228.5L364.5 228.0L365.5 228.0L366.0 228.5L365.9 236.5L365.5 237.1L364.5 237.1L364.0 236.5ZM368.8 228.5L369.5 228.0L371.5 228.1L376.5 234.1L377.1 233.5L377.1 228.5L377.5 228.1L378.5 228.0L378.9 228.5L378.9 236.5L378.5 237.2L376.5 237.2L374.1 234.5L371.5 230.8L370.8 231.5L370.7 236.5L370.5 236.9L369.5 237.2L368.8 236.5ZM383.6 228.5L384.5 228.1L386.5 227.8L389.5 228.0L390.5 228.5L391.5 229.5L391.7 230.5L391.5 230.7L390.5 230.9L388.5 229.2L387.5 229.0L385.5 229.2L384.0 230.5L383.3 232.5L384.0 234.5L385.5 235.8L387.5 236.0L389.5 235.8L390.0 234.5L389.5 233.8L387.5 233.7L387.3 233.5L387.5 232.4L391.5 232.6L391.9 233.5L391.8 236.5L391.5 236.8L388.5 237.5L386.5 237.6L383.2 236.5L382.2 235.5L381.4 233.5L381.3 232.5L381.4 231.5L382.3 229.5ZM284.6 229.5L285.5 229.1L287.5 229.1L288.5 229.7L289.2 230.5L289.7 231.5L289.8 233.5L288.2 235.5L287.5 236.0L285.5 236.0L283.5 234.5L283.1 233.5L283.1 231.5L283.6 230.5ZM319.7 229.5L320.5 229.2L323.5 229.4L324.4 230.5L324.1 231.5L323.5 232.0L320.5 232.2L319.5 231.8L319.3 231.5L319.2 230.5ZM334.0 230.5L334.5 230.3L334.7 230.5L335.5 232.5L335.4 233.5L334.5 233.7L332.6 233.5L333.0 231.5L333.5 230.7Z"/>
</svg>`;

const navItems = [['projects', 'projects'], ['services', 'services'], ['about', 'about'], ['process', 'process'], ['contact', 'contact']];

function current() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  let parts;
  try { parts = decodeURIComponent(raw).split('/').filter(Boolean); } catch (e) { parts = []; }
  return {page: parts[0] || 'home', id: parts[1] || null};
}

/* ------------------------------------------------------------------ */
/* Shared components                                                    */
/* ------------------------------------------------------------------ */

function header(route) {
  const onHero = route.page === 'home';
  const links = navItems.map(([key, path]) => {
    const active = route.page === path;
    return `<a class="nav-link ${active ? 'active' : ''}" href="${href(path)}" ${active ? 'aria-current="page"' : ''}>${t(key)}</a>`;
  }).join('');
  return `<a class="skip-link" href="#main-content" data-action="skip">${t('skip')}</a>
<header class="site-header ${onHero ? 'on-hero' : ''}" id="site-header">
  <a class="brand" href="#/home" aria-label="${t('brandLabel')}">${LOGO}</a>
  <nav class="desktop-nav" aria-label="${isAR() ? 'التنقل الرئيسي' : 'Primary'}">${links}</nav>
  <div class="header-actions">
    <a class="outline-cta header-cta" href="#/contact">${t('start')}</a>
    <button class="lang-toggle" type="button" data-action="language" lang="${isAR() ? 'en' : 'ar'}" aria-label="${t('languageLabel')}">${t('language')}</button>
    <button class="menu-button" type="button" data-action="menu" aria-controls="mobile-menu" aria-expanded="false" aria-label="${t('navMenu')}"><span class="menu-lines" aria-hidden="true"></span></button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" hidden>
  <nav aria-label="${isAR() ? 'قائمة الجوال' : 'Mobile'}">
    ${[['home', 'home'], ...navItems].map(([key, path], i) => `<a class="mobile-link" style="--i:${i}" href="${href(path)}" ${route.page === path ? 'aria-current="page"' : ''}><span>${pad(i + 1)}</span>${t(key)}</a>`).join('')}
  </nav>
  <div class="mobile-menu-foot">
    <a class="dark-cta" href="#/contact">${t('start')} ${ICON.arrow}</a>
    <a class="mobile-phone" href="tel:${PHONE}" dir="ltr">${PHONE_DISPLAY}</a>
  </div>
</div>`;
}

function footer() {
  return `<footer class="site-footer"><div class="footer-top">
  <div class="footer-brand-wrap"><a class="footer-brand" href="#/home" aria-label="${t('brandLabel')}">${LOGO}</a><p class="footer-tag">${t('brandTag')}</p><p class="micro">${t('part')}</p></div>
  <div class="footer-col"><h2>${t('quick')}</h2>${navItems.slice(0, 4).map(([key, path]) => `<a href="${href(path)}">${t(key)}</a>`).join('')}</div>
  <div class="footer-col"><h2>${t('services')}</h2>${[1, 2, 3, 4].map(i => `<a href="#/services/${i}">${t('service' + i)}</a>`).join('')}</div>
  <div class="footer-col"><h2>${t('contactLabel')}</h2><a href="tel:${PHONE}"><span dir="ltr">${PHONE_DISPLAY}</span></a><span>${t('locationOffice')}</span><a href="#/contact">${t('start')}</a></div>
</div>
<div class="footer-bottom"><span>© 2026 SLAB Contracting. ${t('rights')}</span><span class="footer-legal"><a href="#/privacy">${t('privacy')}</a><span>${t('sourcePhoto')}</span></span></div></footer>`;
}

function projectCard(p, extra = '') {
  return `<article class="project-card ${extra}" data-reveal>
  <a href="${href('projects/' + p.id)}" data-cursor="${t('view')}">
    <div class="photo reveal-img">${img(p.id, 1, `${pname(p)} — ${t('residential')}`)}</div>
    <div class="card-end"><div><h3>${pname(p)}</h3><p class="micro">${t('riyadhShort')} · ${pclient(p)} · ${units(p)}</p></div><span class="arrow-mini">${ICON.diag}</span></div>
  </a></article>`;
}

function serviceCards() {
  return `<div class="service-grid">${[1, 2, 3, 4].map(i => {
    const [slug, n] = servicePhotos[i - 1];
    return `<a class="service-card" href="#/services/${i}" data-reveal style="--d:${(i - 1) * 80}ms" data-cursor="${t('view')}">
      <div class="photo reveal-img">${img(slug, n, '')}</div>
      <div class="card-end"><div><span class="card-num">${pad(i)}</span><h3>${t('service' + i)}</h3><p class="micro">${t('service' + i + 'desc')}</p></div><span class="arrow-mini">${ICON.diag}</span></div>
    </a>`;
  }).join('')}</div>`;
}

function cta() {
  return `<section class="cta-banner" aria-labelledby="cta-title"><div class="bg-image" data-parallax style="background-image:url('${HD('almajidiya130', 2)}')"></div>
  <div class="content" data-reveal><h2 id="cta-title">${t('bannerTitle').replace('\n', '<br>')}</h2><p>${t('bannerDesc')}</p>
  <a class="outline-cta light" href="#/contact">${t('start')} ${ICON.arrow}</a></div></section>`;
}

function interiorHero(title, sub, photo = 'soulhittin', index = 1) {
  return `<section class="interior-hero"><div class="bg" data-parallax style="background-image:url('${HD(photo, index)}')"></div>
  <div class="content"><h1 class="hero-title-anim">${title}</h1><p>${sub}</p></div></section>`;
}

function stats() {
  const items = [[125, '+', 'stats1'], [3, '', 'stats2'], [4, '', 'stats3'], [7, '', 'stats4']];
  return `<div class="stats-band" data-reveal>${items.map(([n, suffix, key]) =>
    `<div class="stat"><b><span data-count="${n}">${n}</span>${suffix}</b><span>${t(key)}</span></div>`).join('')}</div>`;
}

/* ------------------------------------------------------------------ */
/* Pages                                                                */
/* ------------------------------------------------------------------ */

// Home hero: SOUL Hittin film ("SOUL 4"). Landscape cut for wide screens, full portrait cut for portrait screens.
const HERO_VIDEO = {
  wide: {src: 'assets/video/soul4-desktop.mp4', poster: 'assets/video/soul4-desktop-poster.webp'},
  tall: {src: 'assets/video/soul4-mobile.mp4', poster: 'assets/video/soul4-mobile-poster.webp'}
};
function heroVideo() {
  const v = matches('(max-aspect-ratio: 1/1)') ? HERO_VIDEO.tall : HERO_VIDEO.wide;
  const motion = reducedMotion() ? '' : 'autoplay';
  return `<video class="hero-video" id="hero-video" ${motion} muted loop playsinline preload="auto" poster="${v.poster}" aria-hidden="true"><source src="${v.src}" type="video/mp4"></video>`;
}

function home() {
  const p = projects.find(x => x.id === 'soulhittin');
  return `<main class="page home-page" id="main-content" tabindex="-1">
<section class="hero" aria-label="${t('featured')}">
  <div class="hero-media" data-parallax-hero>${heroVideo()}</div>
  <div class="hero-shade"></div>
  <div class="container hero-content">
    <p class="hero-tagline">${t('heroTop')}</p>
    <h1 class="hero-heading"><span><span>${t('heroA')}</span></span><span><span>${t('heroB')}</span></span><span><span>${t('heroC')}</span></span></h1>
    <p class="hero-sub">${t('heroS')}</p>
    <div class="hero-bottom">
      <a href="#/projects" class="hero-link"><span class="round-arrow">${ICON.arrow}</span>${t('explore')}</a>
      <div class="hero-side">
        <a class="hero-caption" id="hero-caption" href="${href('projects/' + p.id)}"><small>${t('heroNow')}</small><span>${pname(p)}</span></a>
        <button type="button" class="hero-video-toggle" data-action="hero-video" aria-pressed="${reducedMotion()}" aria-label="${reducedMotion() ? t('playVideo') : t('pauseVideo')}">${reducedMotion() ? ICON.play : ICON.pause}</button>
      </div>
    </div>
  </div>
</section>
<section class="section-sm"><div class="container"><div class="section-head" data-reveal><div><h2 class="section-title">${t('ourServices')}</h2><p class="micro">${t('servicesSub')}</p></div><a class="text-link" href="#/services">${t('viewAll')} ${ICON.diag}</a></div>${serviceCards()}</div></section>
<section class="section-sm"><div class="container split-editorial">
  <div class="feature-image reveal-img" data-reveal><div class="parallax-inner" data-parallax>${img('ajlan11', 1, '')}</div></div>
  <div class="editorial-copy" data-reveal><span class="eyebrow">${t('part')}</span><h2 class="section-title">${t('creating')}</h2><p class="copy">${t('aboutHome')}</p><a class="text-link" href="#/about">${t('aboutSlab')} ${ICON.diag}</a></div>
</div></section>
<section class="section-sm"><div class="container"><div class="section-head" data-reveal><div><h2 class="section-title">${t('featured')}</h2><p class="micro">${t('featuredSub')}</p></div><a class="text-link" href="#/projects">${t('viewAll')} ${ICON.diag}</a></div>
  <div class="project-grid">${projects.slice(0, 4).map(p => projectCard(p)).join('')}</div></div></section>
<section class="section-sm process-teaser"><div class="container">
  <div class="section-head" data-reveal><div><h2 class="section-title">${t('processTeaser')}</h2><p class="micro">${t('processTeaserSub')}</p></div><a class="text-link" href="#/process">${t('process')} ${ICON.diag}</a></div>
  <ol class="teaser-steps" data-reveal>${Array.from({length: 7}, (_, i) => `<li><a href="#/process/${i + 1}"><span>${pad(i + 1)}</span>${t('p' + (i + 1))}</a></li>`).join('')}</ol>
</div></section>
<div class="container">${stats()}</div>
<div class="container cta-wrap">${cta()}</div>
</main>`;
}

function projectList() {
  const list = projects.filter(p => state.filter === 'all' || p.category === state.filter);
  const count = f => projects.filter(p => f === 'all' || p.category === f).length;
  return `<main class="page" id="main-content" tabindex="-1">${interiorHero(t('projectHero'), t('projectsTagline'), 'masharef', 3)}
<section class="section-sm"><div class="container">
  <div class="filters" role="group" aria-label="${t('filterLabel')}">${['all', 'aliyah', 'soul'].map(f =>
    `<button type="button" class="filter ${state.filter === f ? 'active' : ''}" data-action="filter" data-filter="${f}" aria-pressed="${state.filter === f}">${t(f)} <sup>${count(f)}</sup></button>`).join('')}
    <span class="results-count" id="results-count" aria-live="polite">${list.length} ${t('showing')}</span></div>
  <div class="project-grid listing" id="project-results">${projectResults(list)}</div>
</div></section>${cta()}</main>`;
}

function projectResults(list) {
  return list.length ? list.map(p => projectCard(p)).join('') : `<p>${t('noData')}</p>`;
}

function galleryMarkup(p) {
  const n = state.gallery + 1;
  return `<div class="gallery" data-gallery>
  <div class="gallery-frame" id="gallery-frame">
    <div class="gallery-backdrop" id="gallery-backdrop" style="background-image:url('${IMAGE(p.id, n)}')"></div>
    <button type="button" class="gallery-open" data-action="lightbox" aria-label="${t('openPhoto')}" data-cursor="${t('expand')}">
      <img id="gallery-main" src="${IMAGE(p.id, n)}" alt="${esc(`${pname(p)} — ${t('photo')} ${n} ${t('photoOf')} ${p.images}`)}" decoding="async">
    </button>
    <button type="button" class="gallery-control prev" data-action="gallery" data-move="-1" aria-label="${t('prevPhoto')}">${ICON.prev}</button>
    <button type="button" class="gallery-control next" data-action="gallery" data-move="1" aria-label="${t('nextPhoto')}">${ICON.next}</button>
    <div class="gallery-meta"><span id="gallery-count" aria-live="polite">${pad(n)} / ${pad(p.images)}</span><button type="button" data-action="lightbox" aria-label="${t('openPhoto')}">${ICON.expand}</button></div>
  </div>
  <div class="gallery-thumbs">${Array.from({length: p.images}, (_, i) =>
    `<button type="button" class="thumb ${state.gallery === i ? 'active' : ''}" data-action="gallery-index" data-index="${i}" aria-label="${t('photo')} ${i + 1}" aria-current="${state.gallery === i}">${img(p.id, i + 1, '')}</button>`).join('')}</div>
</div>`;
}

function detail(p) {
  const index = projects.indexOf(p);
  const next = projects[(index + 1) % projects.length];
  const prev = projects[(index - 1 + projects.length) % projects.length];
  if (state.gallery >= p.images) state.gallery = 0;
  const more = [2, 3, 4].map(k => projects[(index + k) % projects.length]);
  const tab = (key, label) => `<button type="button" role="tab" class="tab ${state.projectTab === key ? 'active' : ''}" id="tab-${key}" aria-controls="panel-${key}" aria-selected="${state.projectTab === key}" tabindex="${state.projectTab === key ? 0 : -1}" data-action="project-tab" data-tab="${key}">${label}</button>`;
  const meta = [[t('location'), t('riyadh')], [t('client'), pclient(p)], [t('type'), t('projectTitle')], [t('units'), p.units], [t('size'), sizes(p)], [t('scope'), t('projScope')]];
  return `<main class="page" id="main-content" tabindex="-1"><div class="container">
<div class="project-detail-head">
  <div>
    <nav class="breadcrumb" aria-label="${isAR() ? 'مسار التنقل' : 'Breadcrumb'}"><a href="#/projects">${ICON.back} ${t('back')}</a><span aria-hidden="true">/</span><span aria-current="page">${pname(p)}</span></nav>
    <h1 class="hero-title-anim">${pname(p)}</h1>
    <p class="copy lead">${t('projectLead')(p)}</p>
  </div>
  <dl class="project-meta">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
</div>
<div class="tabs" role="tablist" aria-label="${t('projectTabs')}">${tab('gallery', t('gallery'))}${tab('overview', t('overview'))}</div>
<div class="tab-panel" role="tabpanel" id="panel-gallery" aria-labelledby="tab-gallery" ${state.projectTab === 'gallery' ? '' : 'hidden'}>${galleryMarkup(p)}</div>
<div class="tab-panel overview-panel" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" tabindex="0" ${state.projectTab === 'overview' ? '' : 'hidden'}>
  <div><h2 class="section-title small">${pname(p)}</h2><p class="copy">${t('projectLead')(p)}</p><p class="copy">${t('projectOverview')}</p></div>
  <div><h3 class="eyebrow">${t('scope')}</h3><ul class="scope-list">${t('scopeItems').split('|').map((s, i) => `<li><span>${pad(i + 1)}</span>${s}</li>`).join('')}</ul>
  <a class="text-link" href="#/process">${t('seeProcess')} ${ICON.diag}</a></div>
</div>
<nav class="project-pager" aria-label="${t('projects')}">
  <a href="${href('projects/' + prev.id)}" class="pager-link prev"><small>${ICON.back} ${t('prevProject')}</small><span>${pname(prev)}</span></a>
  <a href="${href('projects/' + next.id)}" class="pager-link next"><small>${t('nextProject')} ${ICON.arrow}</small><span>${pname(next)}</span></a>
</nav>
<section class="more-projects"><div class="section-head"><h2 class="section-title">${t('similarProjects')}</h2><a class="text-link" href="#/projects">${t('viewAll')} ${ICON.diag}</a></div>
<div class="project-grid three">${more.map(x => projectCard(x)).join('')}</div></section>
</div>${cta()}</main>`;
}

function services() {
  return `<main class="page" id="main-content" tabindex="-1">${interiorHero(t('servicesHero'), t('servicesHeroSub'), 'nirvana12', 1)}
<section class="section"><div class="container"><div class="section-head" data-reveal><h2 class="section-title">${t('servicesIntro')}</h2></div>
<div class="service-rows">${[1, 2, 3, 4].map(i => {
  const [slug, n] = servicePhotos[i - 1];
  return `<article class="service-row" id="service-${i}" data-reveal>
    <div class="photo reveal-img"><div class="parallax-inner" data-parallax>${img(slug, n, '')}</div></div>
    <div class="service-copy"><span class="service-num">${pad(i)}</span><h2>${t('service' + i)}</h2><p>${t('serviceLong' + i)}</p></div>
  </article>`;
}).join('')}</div></div></section>
<section class="section-sm tinted"><div class="container"><div class="section-head" data-reveal><div><h2 class="section-title">${t('sectors')}</h2><p class="copy">${t('sectorsSub')}</p></div></div>
<div class="sector-grid">${['hospitality', 'residential', 'commercial', 'institutional'].map((k, i) => `<article class="sector-item" data-reveal style="--d:${i * 80}ms"><span>${pad(i + 1)}</span><h3>${t(k)}</h3><p>${t(k + 'Desc')}</p></article>`).join('')}</div></div></section>
<section class="section-sm"><div class="container"><div class="section-head" data-reveal><div><h2 class="section-title">${t('processTeaser')}</h2><p class="micro">${t('processTeaserSub')}</p></div><a class="text-link" href="#/process">${t('process')} ${ICON.diag}</a></div>
<ol class="teaser-steps" data-reveal>${Array.from({length: 7}, (_, i) => `<li><a href="#/process/${i + 1}"><span>${pad(i + 1)}</span>${t('p' + (i + 1))}</a></li>`).join('')}</ol></div></section>
${cta()}</main>`;
}

function about() {
  const sub = [['story', t('ourStory')], ['principles', t('principles')], ['why', t('why')]];
  return `<main class="page" id="main-content" tabindex="-1">${interiorHero(t('aboutHero'), t('aboutHeroSub'), 'almajidiya111', 3)}
<nav class="subnav" aria-label="${t('aboutNav')}"><div class="container">${sub.map(([id, label]) => `<a href="#about-${id}" data-action="scroll-to" data-target="about-${id}">${label}</a>`).join('')}</div></nav>
<section class="section" id="about-story"><div class="container about-feature">
  <div data-reveal><span class="eyebrow">${t('ourStory')}</span><h2 class="section-title">${t('storyTitle')}</h2><p class="copy">${t('storyCopy')}</p><p class="copy">${t('storyCopy2')}</p></div>
  <div class="photo reveal-img" data-reveal><div class="parallax-inner" data-parallax>${img('almughrizat', 1, '')}</div></div>
</div>
<div class="container"><div class="pillars">${[['delivery', 'deliveryDesc'], ['control', 'controlDesc'], ['ksa', 'ksaDesc']].map(([k, d], i) => `<article data-reveal style="--d:${i * 80}ms"><span class="eyebrow">${pad(i + 1)}</span><h3>${t(k)}</h3><p>${t(d)}</p></article>`).join('')}</div></div></section>
<div class="container">${stats()}</div>
<section class="section" id="about-principles"><div class="container"><div class="section-head" data-reveal><div><h2 class="section-title">${t('principles')}</h2><p class="copy narrow">${t('principlesLead')}</p></div></div>
<div class="principles">${['precision', 'controlPrinciple', 'value'].map((key, i) => `<article class="principle" data-reveal style="--d:${i * 90}ms"><span class="eyebrow">${pad(i + 1)}</span><h3>${t(key)}</h3><p>${t(key + 'Desc')}</p></article>`).join('')}</div></div></section>
<section class="section-sm tinted" id="about-why"><div class="container why-layout">
  <div class="why-intro" data-reveal><h2 class="section-title">${t('why')}</h2><p class="copy">${t('whyDesc')}</p><div class="feature-image reveal-img">${img('almajidiya70', 2, '')}</div></div>
  <ol class="why-list">${[1, 2, 3, 4, 5, 6].map(i => `<li data-reveal><span>${pad(i)}</span><div><h3>${t('why' + i)}</h3><p>${t('why' + i + 'd')}</p></div></li>`).join('')}</ol>
</div></section>
${cta()}</main>`;
}

function processPanel() {
  const st = state.step + 1;
  const v = processVisuals[state.step];
  return `<div class="photo is-${v.kind}"${v.kind === 'full' ? ` style="--bg:url('${v.src}')"` : ''}><img src="${v.src}" alt="${esc(t('p' + st))}" decoding="async"${v.pos ? ` style="object-position:${v.pos}"` : ''}></div>
  <div class="process-description"><span class="eyebrow">${t('stage')} ${pad(st)} / 07</span><h2>${t('p' + st)}</h2><p>${t('p' + st + 'd')}</p>
  <div class="process-navigation"><button type="button" data-action="step-move" data-move="-1" aria-label="${t('prevStage')}">${ICON.prev}</button><span>${pad(st)} / 07</span><button type="button" data-action="step-move" data-move="1" aria-label="${t('nextStage')}">${ICON.next}</button></div></div>`;
}

function process() {
  return `<main class="page" id="main-content" tabindex="-1"><section class="section-sm process-top"><div class="container">
<span class="eyebrow">${t('processHeroSub')}</span><h1 class="page-title hero-title-anim">${t('processTitle')}</h1><p class="copy">${t('processIntro')}</p>
<div class="process-track"><div class="process-progress" id="process-progress" style="--p:${state.step / 6}"></div>
<div class="process-steps" role="tablist" aria-label="${t('processStages')}">${Array.from({length: 7}, (_, i) =>
  `<button type="button" role="tab" class="process-step ${state.step === i ? 'active' : ''} ${i < state.step ? 'done' : ''}" id="step-${i}" aria-controls="process-panel" aria-selected="${state.step === i}" tabindex="${state.step === i ? 0 : -1}" data-action="step" data-index="${i}"><span class="step-circle">${pad(i + 1)}</span><strong>${t('p' + (i + 1))}</strong><small>${t('p' + (i + 1) + 'd')}</small></button>`).join('')}</div></div>
<div class="process-feature" id="process-panel" role="tabpanel" aria-labelledby="step-${state.step}" aria-live="polite">${processPanel()}</div>
</div></section>
<section class="section-sm tinted"><div class="container"><div class="section-head" data-reveal><h2 class="section-title">${t('tech')}</h2></div>
<div class="technology-grid">${[1, 2, 3, 4].map(i => `<article data-reveal style="--d:${(i - 1) * 80}ms"><span class="eyebrow">${pad(i)}</span><h3>${t('tech' + i)}</h3><p>${t('tech' + i + 'd')}</p></article>`).join('')}</div></div></section>
${cta()}</main>`;
}

function field(id, label, input, hint = '') {
  return `<div class="field ${id === 'project-location' || id === 'message' ? 'full' : ''}"><label for="${id}">${label} <span aria-hidden="true">*</span></label>${input}${hint ? `<small class="hint" id="${id}-hint">${hint}</small>` : ''}<small class="error" id="${id}-error" hidden></small></div>`;
}

function contact() {
  const sectors = ['residential', 'hospitality', 'commercial', 'institutional'];
  return `<main class="page" id="main-content" tabindex="-1">${interiorHero(t('contactHero'), t('contactHeroSub'), 'jawhara8', 1)}
<section class="container contact-layout">
<div class="contact-details" data-reveal><h2>${t('getInTouch')}</h2><p class="copy">${t('contactCopy')}</p>
  <ul class="contact-points">
    <li><a class="contact-point" href="tel:${PHONE}">${ICON.phone}<div><small>${t('phone')}</small><strong dir="ltr">${PHONE_DISPLAY}</strong></div></a></li>
    <li class="contact-point">${ICON.pin}<div><small>${t('locationOffice')}</small><strong>${t('activeIn')}</strong></div></li>
    <li class="contact-point">${ICON.group}<div><small>SLAB Contracting</small><strong>${t('part')}</strong></div></li>
  </ul></div>
<div class="form-wrap" data-reveal>
<form class="contact-form" id="lead-form" name="slab-project-enquiry" novalidate>
  <input type="hidden" name="language" value="${state.language}">
  <p class="visually-hidden" aria-hidden="true"><label>Leave this field empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
  <div class="form-alert" id="form-summary" role="alert" hidden></div>
  ${field('full-name', t('fullName'), `<input id="full-name" name="full-name" required autocomplete="name" minlength="2" maxlength="120" aria-describedby="full-name-error">`)}
  ${field('email', t('email'), `<input id="email" name="email" type="email" required autocomplete="email" maxlength="160" dir="ltr" aria-describedby="email-error">`)}
  ${field('phone', t('phoneField'), `<input id="phone" name="phone" type="tel" required autocomplete="tel" inputmode="tel" maxlength="20" dir="ltr" aria-describedby="phone-error">`)}
  ${field('project-type', t('sector'), `<select id="project-type" name="project-type" required aria-describedby="project-type-error"><option value="">${t('choose')}</option>${sectors.map(x => `<option value="${x}">${t(x)}</option>`).join('')}</select>`)}
  <fieldset class="field full service-picker" id="services-field" aria-describedby="services-hint services-error">
    <legend>${t('servicesNeeded')} <span aria-hidden="true">*</span></legend>
    <small class="hint" id="services-hint">${t('servicesHint')}</small>
    <div class="chips">${SERVICE_KEYS.map((key, i) => `<label class="chip"><input type="checkbox" name="services" value="${key}"><span>${ICON_CHECK}${t('service' + (i + 1))}</span></label>`).join('')}</div>
    <small class="error" id="services-error" hidden></small>
  </fieldset>
  ${field('project-location', t('projectLocation'), `<input id="project-location" name="project-location" required maxlength="120" autocomplete="address-level2" aria-describedby="project-location-error">`)}
  ${field('message', t('message'), `<textarea id="message" name="message" required minlength="12" maxlength="3000" aria-describedby="message-hint message-error"></textarea>`, t('messageHint'))}
  <div class="field full consent-field"><label class="check"><input type="checkbox" id="consent" name="consent" value="yes" required aria-describedby="consent-error"><span>${t('consent')} <a href="#/privacy">${t('consentLink')}</a>. <span aria-hidden="true">*</span></span></label><small class="error" id="consent-error" hidden></small></div>
  <div class="submit-row"><p class="form-note">${t('formNote')}</p><button class="dark-button" type="submit"><span class="btn-label">${t('send')}</span> ${ICON.arrow}</button></div>
  <div id="form-feedback" class="form-message" role="status" aria-live="polite" hidden></div>
</form></div>
</section></main>`;
}

function privacy() {
  return `<main class="page" id="main-content" tabindex="-1"><section class="section"><div class="container legal">
<h1 class="page-title">${t('privacyTitle')}</h1><p class="draft-banner">${t('privacyDraft')}</p>
${t('privacyBody').map(([h, p]) => `<h2>${h}</h2><p class="copy">${p}</p>`).join('')}
<a class="text-link" href="#/contact">${t('contact')} ${ICON.diag}</a></div></section></main>`;
}

function notfound() {
  return `<main class="page" id="main-content" tabindex="-1"><div class="container section"><h1 class="page-title">404</h1><p class="copy">${t('notFound')}</p><a class="text-link" href="#/home">${t('home')} ${ICON.diag}</a></div></main>`;
}

/* ------------------------------------------------------------------ */
/* Rendering & routing                                                  */
/* ------------------------------------------------------------------ */

function pageFor(r) {
  if (r.page === 'home') return home();
  if (r.page === 'projects') {
    const p = r.id && projects.find(x => x.id === r.id);
    return p ? detail(p) : (r.id ? notfound() : projectList());
  }
  if (r.page === 'services') return services();
  if (r.page === 'about') return about();
  if (r.page === 'process') {
    const n = Number(r.id);
    if (n >= 1 && n <= 7) state.step = n - 1;
    return process();
  }
  if (r.page === 'contact') return contact();
  if (r.page === 'privacy') return privacy();
  return notfound();
}

function updateMeta(r) {
  const root = document.documentElement;
  root.lang = state.language;
  root.dir = isAR() ? 'rtl' : 'ltr';
  const p = r.page === 'projects' && r.id ? projects.find(x => x.id === r.id) : null;
  const titleKey = {home: null, projects: 'projects', services: 'services', about: 'about', process: 'process', contact: 'contact', privacy: 'privacyTitle'}[r.page];
  const brand = isAR() ? 'سلاب للمقاولات' : 'SLAB Contracting';
  document.title = r.page === 'home' ? `${brand} | ${isAR() ? 'نصمم · ننفذ · نسلّم' : 'Design · Build · Deliver'}`
    : `${p ? pname(p) : (titleKey ? t(titleKey) : '404')} | ${brand}`;
  const desc = p ? t('projectLead')(p) : (metaDescriptions[state.language][r.page] || metaDescriptions[state.language].home);
  const tag = document.querySelector && document.querySelector('meta[name="description"]');
  if (tag) tag.setAttribute('content', desc);
}

function render({scrollTop = false, focusMain = false} = {}) {
  const r = current();
  updateMeta(r);
  const page = pageFor(r);
  $app.innerHTML = `<div class="site">${header(r)}${page}${footer()}</div>`;
  setMenu(false, {silent: true});
  afterRender(r);
  if (scrollTop) window.scrollTo({top: 0, behavior: 'auto'});
  if (focusMain) {
    const main = document.getElementById('main-content');
    if (main && main.focus) main.focus({preventScroll: true});
  }
}

function afterRender(r) {
  state.formStarted = 0;
  updateHeader();
  setReveal();
  setCounters();
  setParallax();
  if (r.page === 'services' && r.id) {
    const el = document.getElementById('service-' + r.id);
    if (el) requestFrame(() => el.scrollIntoView({behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start'}));
  }
  if (r.page === 'home') clearInterval(heroTimer);
  if (r.page === 'projects' && r.id) { const p = currentProject(); if (p) upgradeGallery(p, state.gallery + 1); }
}

const requestFrame = f => (window.requestAnimationFrame ? window.requestAnimationFrame(f) : setTimeout(f, 16));

let navigating = false;
function navigate() {
  state.projectTab = 'gallery';
  state.gallery = 0;
  state.step = 0;
  const main = document.getElementById('main-content');
  if (!main || reducedMotion() || navigating) { render({scrollTop: true, focusMain: true}); return; }
  navigating = true;
  main.classList.add('page-leave');
  setTimeout(() => { navigating = false; render({scrollTop: true, focusMain: true}); }, 220);
}

/* ------------------------------------------------------------------ */
/* Header, menu                                                         */
/* ------------------------------------------------------------------ */

let lastScroll = 0;
function updateHeader() {
  const h = document.getElementById('site-header');
  if (!h) return;
  const y = window.scrollY || 0;
  h.classList.toggle('scrolled', y > 60);
  h.classList.toggle('hide', !state.mobile && y > 500 && y > lastScroll + 4);
  if (y < lastScroll - 4 || y <= 500) h.classList.remove('hide');
  lastScroll = y;
}

function setMenu(open, {silent = false} = {}) {
  state.mobile = open;
  const menu = document.getElementById('mobile-menu');
  const btn = document.querySelector && document.querySelector('[data-action="menu"]');
  if (!menu || !btn) return;
  menu.hidden = !open;
  menu.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? t('closeMenu') : t('navMenu'));
  document.getElementById('site-header').classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (silent) return;
  if (open) { const first = menu.querySelector('a'); if (first) first.focus(); }
  else btn.focus();
}

/* ------------------------------------------------------------------ */
/* Motion: reveal, counters, parallax, hero, cursor                     */
/* ------------------------------------------------------------------ */

function setReveal() {
  const nodes = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reducedMotion()) { nodes.forEach(n => n.classList.add('visible')); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  }), {threshold: 0.08, rootMargin: '0px 0px -40px 0px'});
  nodes.forEach(n => observer.observe(n));
}

function setCounters() {
  const nodes = document.querySelectorAll('[data-count]');
  if (!('IntersectionObserver' in window) || reducedMotion()) return;
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    observer.unobserve(e.target);
    const el = e.target, end = Number(el.dataset.count), start = performance.now(), dur = 1400;
    const tick = now => {
      const k = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  }), {threshold: 0.5});
  nodes.forEach(n => observer.observe(n));
}

let parallaxNodes = [];
let parallaxQueued = false;
function setParallax() {
  parallaxNodes = reducedMotion() ? [] : Array.from(document.querySelectorAll('[data-parallax], [data-parallax-hero]'));
  runParallax();
}
function runParallax() {
  parallaxQueued = false;
  const vh = window.innerHeight || 800;
  parallaxNodes.forEach(el => {
    const box = el.parentElement.getBoundingClientRect();
    if (box.bottom < 0 || box.top > vh) return;
    if (el.hasAttribute('data-parallax-hero')) {
      el.style.transform = `translate3d(0, ${Math.min(window.scrollY, vh) * 0.15}px, 0)`;
    } else {
      const offset = ((box.top + box.height / 2) - vh / 2) / vh; // -1..1 around viewport centre
      el.style.transform = `translate3d(0, ${(offset * -22).toFixed(1)}px, 0) scale(1.05)`;
    }
  });
}

let heroTimer = null;
const HERO_DELAY = 7000;
function restartHeroTimer() {
  clearInterval(heroTimer);
  const hero = document.querySelector('.hero');
  if (hero) hero.style.setProperty('--hero-delay', `${HERO_DELAY}ms`);
  if (reducedMotion()) return;
  heroTimer = setInterval(() => {
    if (current().page !== 'home' || document.hidden || window.scrollY > 440 || heroPaused) return;
    showHero((state.slide + 1) % heroSlides.length);
  }, HERO_DELAY);
}
let heroPaused = false;

function showHero(i) {
  state.slide = i;
  document.querySelectorAll('.hero-image').forEach(el => el.classList.toggle('is-active', Number(el.dataset.slide) === i));
  document.querySelectorAll('[data-action="hero"]').forEach(b => {
    const active = Number(b.dataset.index) === i;
    b.classList.toggle('selected', active);
    b.setAttribute('aria-pressed', String(active));
  });
  const p = projects.find(x => x.id === heroSlides[i][0]);
  const cap = document.getElementById('hero-caption');
  if (cap && p) { cap.href = href('projects/' + p.id); cap.querySelector('span').textContent = pname(p); }
}

// Desktop-only "View" cursor label over project and service cards.
const cursor = document.createElement('div');
cursor.className = 'cursor-label';
cursor.setAttribute('aria-hidden', 'true');
if (document.body && document.body.appendChild) document.body.appendChild(cursor);
let cursorX = 0, cursorY = 0, cursorTX = 0, cursorTY = 0, cursorRunning = false;
function moveCursor() {
  cursorX += (cursorTX - cursorX) * (reducedMotion() ? 1 : 0.22);
  cursorY += (cursorTY - cursorY) * (reducedMotion() ? 1 : 0.22);
  cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
  if (Math.abs(cursorTX - cursorX) > 0.5 || Math.abs(cursorTY - cursorY) > 0.5) requestAnimationFrame(moveCursor);
  else cursorRunning = false;
}

/* ------------------------------------------------------------------ */
/* Gallery & lightbox                                                   */
/* ------------------------------------------------------------------ */

function currentProject() {
  const r = current();
  return r.page === 'projects' && r.id ? projects.find(x => x.id === r.id) : null;
}

// Show the 1200px image immediately, then swap in the large version once it has downloaded.
function upgradeGallery(p, n) {
  const hi = new Image();
  hi.onload = () => {
    const main = document.getElementById('gallery-main');
    if (main && state.gallery + 1 === n && currentProject() === p) main.src = hi.src;
  };
  hi.src = HD(p.id, n);
}

function setGallery(i) {
  const p = currentProject();
  if (!p) return;
  state.gallery = (i + p.images) % p.images;
  const n = state.gallery + 1;
  const main = document.getElementById('gallery-main');
  if (main) {
    main.classList.add('swap');
    const swap = () => {
      main.src = IMAGE(p.id, n);
      upgradeGallery(p, n);
      main.alt = `${pname(p)} — ${t('photo')} ${n} ${t('photoOf')} ${p.images}`;
      main.classList.remove('swap');
    };
    reducedMotion() ? swap() : setTimeout(swap, 160);
  }
  const bd = document.getElementById('gallery-backdrop');
  if (bd) bd.style.backgroundImage = `url('${IMAGE(p.id, n)}')`;
  const count = document.getElementById('gallery-count');
  if (count) count.textContent = `${pad(n)} / ${pad(p.images)}`;
  document.querySelectorAll('.thumb').forEach(b => {
    const on = Number(b.dataset.index) === state.gallery;
    b.classList.toggle('active', on);
    b.setAttribute('aria-current', String(on));
  });
  updateLightbox();
}

let lightbox = null;
function openLightbox() {
  const p = currentProject();
  if (!p) return;
  if (!lightbox) {
    lightbox = document.createElement('dialog');
    lightbox.className = 'lightbox';
    document.body.appendChild(lightbox);
    lightbox.addEventListener('click', e => {
      const b = e.target.closest('[data-lb]');
      if (b) { const a = b.dataset.lb; a === 'close' ? lightbox.close() : setGallery(state.gallery + Number(a)); }
      else if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener('keydown', e => {
      const d = arrowDelta(e.key);
      if (d) { e.preventDefault(); setGallery(state.gallery + d); }
    });
    lightbox.addEventListener('close', () => {
      document.body.style.overflow = '';
      const opener = document.querySelector('.gallery-open');
      if (opener) opener.focus();
    });
    addSwipe(lightbox, d => setGallery(state.gallery + d));
  }
  lightbox.setAttribute('aria-label', `${pname(p)} — ${t('gallery')}`);
  lightbox.dir = isAR() ? 'rtl' : 'ltr';
  lightbox.innerHTML = `<div class="lb-top"><span id="lb-count"></span><button type="button" data-lb="close" aria-label="${t('closePhoto')}">${ICON.close}</button></div>
  <figure><img id="lb-img" alt=""><figcaption id="lb-caption"></figcaption></figure>
  <button type="button" class="lb-nav prev" data-lb="-1" aria-label="${t('prevPhoto')}">${ICON.prev}</button>
  <button type="button" class="lb-nav next" data-lb="1" aria-label="${t('nextPhoto')}">${ICON.next}</button>`;
  updateLightbox();
  document.body.style.overflow = 'hidden';
  lightbox.showModal ? lightbox.showModal() : lightbox.setAttribute('open', '');
  lightbox.querySelector('[data-lb="close"]').focus();
}
function updateLightbox() {
  const p = currentProject();
  if (!lightbox || !lightbox.open || !p) return;
  const n = state.gallery + 1;
  const im = lightbox.querySelector('#lb-img');
  im.src = HD(p.id, n);
  im.alt = `${pname(p)} — ${t('photo')} ${n} ${t('photoOf')} ${p.images}`;
  lightbox.querySelector('#lb-count').textContent = `${pad(n)} / ${pad(p.images)}`;
  lightbox.querySelector('#lb-caption').textContent = pname(p);
}

// Left/right arrows follow reading direction: in RTL, ArrowLeft means "next".
function arrowDelta(key) {
  const d = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
  return isAR() ? -d : d;
}

function addSwipe(el, onSwipe) {
  let x0 = null, y0 = null;
  el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
  el.addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) onSwipe((dx < 0 ? 1 : -1) * (isAR() ? -1 : 1));
  });
}

/* ------------------------------------------------------------------ */
/* Partial updates (keep focus & scroll; no full re-render)             */
/* ------------------------------------------------------------------ */

function setFilter(f) {
  state.filter = f;
  const list = projects.filter(p => f === 'all' || p.category === f);
  document.querySelectorAll('.filter').forEach(b => {
    const on = b.dataset.filter === f;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  const grid = document.getElementById('project-results');
  grid.innerHTML = projectResults(list);
  document.getElementById('results-count').textContent = `${list.length} ${t('showing')}`;
  setReveal();
}

function setProjectTab(tab, focus) {
  state.projectTab = tab;
  document.querySelectorAll('[role="tab"][data-tab]').forEach(b => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
  });
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== 'panel-' + tab; });
}

function setStep(i, focus) {
  state.step = (i + 7) % 7;
  document.querySelectorAll('.process-step').forEach(b => {
    const k = Number(b.dataset.index), on = k === state.step;
    b.classList.toggle('active', on);
    b.classList.toggle('done', k < state.step);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) { b.focus(); b.scrollIntoView && b.scrollIntoView({block: 'nearest', inline: 'center', behavior: reducedMotion() ? 'auto' : 'smooth'}); }
  });
  const panel = document.getElementById('process-panel');
  panel.setAttribute('aria-labelledby', 'step-' + state.step);
  const prog = document.getElementById('process-progress');
  if (prog) prog.style.setProperty('--p', state.step / 6);
  const focusedNav = document.activeElement && document.activeElement.closest && document.activeElement.closest('.process-navigation');
  const move = focusedNav ? document.activeElement.dataset.move : null;
  panel.classList.remove('swap');
  void panel.offsetWidth;
  panel.innerHTML = processPanel();
  panel.classList.add('swap');
  if (move) panel.querySelector(`[data-move="${move}"]`).focus();
}

/* ------------------------------------------------------------------ */
/* Contact form                                                         */
/* ------------------------------------------------------------------ */

function validateField(el) {
  const v = (el.type === 'checkbox' ? (el.checked ? 'yes' : '') : el.value).trim();
  let msg = '';
  if (el.required && !v) msg = el.type === 'checkbox' ? t('errConsent') : t('errRequired');
  else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = t('errEmail');
  else if (el.type === 'tel' && !/^\+?[\d\s()-]{8,20}$/.test(v) || (el.type === 'tel' && (v.match(/\d/g) || []).length < 8)) msg = t('errPhone');
  else if (el.name === 'message' && v.length < 12) msg = t('errShort');
  else if (el.name === 'full-name' && v.length < 2) msg = t('errRequired');
  const err = document.getElementById(el.id + '-error');
  el.setAttribute('aria-invalid', String(!!msg));
  el.closest('.field').classList.toggle('invalid', !!msg);
  if (err) { err.textContent = msg; err.hidden = !msg; }
  return !msg;
}

// Services multi-select: at least one must be ticked.
const selectedServices = form => Array.from(form.querySelectorAll('input[name="services"]:checked')).map(c => c.value);
function validateServices(form) {
  const set = document.getElementById('services-field');
  const ok = selectedServices(form).length > 0;
  const err = document.getElementById('services-error');
  set.setAttribute('aria-invalid', String(!ok));
  set.classList.toggle('invalid', !ok);
  err.textContent = ok ? '' : t('errServices');
  err.hidden = ok;
  return ok;
}

async function submitForm(form) {
  const feedback = document.getElementById('form-feedback');
  const summary = document.getElementById('form-summary');
  const fields = Array.from(form.querySelectorAll('input[required], select[required], textarea[required]'));
  const invalid = fields.filter(f => !validateField(f));
  if (!validateServices(form)) invalid.push(form.querySelector('input[name="services"]'));
  // Focus the first problem in page order.
  invalid.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  feedback.hidden = true;
  if (invalid.length) {
    summary.textContent = t('errSummary');
    summary.hidden = false;
    invalid[0].focus();
    return;
  }
  summary.hidden = true;
  // Simple anti-spam: a hidden honeypot field bots tend to fill, and real people take a few seconds to fill the form.
  if (form.elements['bot-field'].value || (state.formStarted && Date.now() - state.formStarted < 1500)) {
    feedback.textContent = t('errTooFast');
    feedback.className = 'form-message error';
    feedback.hidden = false;
    return;
  }
  // Opened as a local file (review copy): don't send real enquiries.
  if (location.protocol === 'file:') {
    feedback.textContent = t('localNote');
    feedback.className = 'form-message';
    feedback.hidden = false;
    return;
  }
  const btn = form.querySelector('button[type="submit"]');
  const label = btn.querySelector('.btn-label');
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  label.textContent = t('sending');
  try {
    const v = name => form.elements[name].value.trim();
    const row = {
      full_name: v('full-name'), email: v('email'), phone: v('phone'), project_type: v('project-type'), services: selectedServices(form),
      project_location: v('project-location'), message: v('message'), consent: form.elements.consent.checked, language: state.language
    };
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/project_enquiries`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', apikey: SUPABASE_KEY, Prefer: 'return=minimal'},
      body: JSON.stringify(row)
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    // Success is shown only after the server accepted the submission.
    const wrap = form.parentElement;
    wrap.innerHTML = `<div class="form-success" tabindex="-1" role="status"><span class="success-mark" aria-hidden="true"></span><h2>${t('sendSuccessTitle')}</h2><p class="copy">${t('sendSuccess')}</p><button type="button" class="text-link" data-action="form-reset">${t('sendAnother')} ${ICON.diag}</button></div>`;
    wrap.firstElementChild.focus();
  } catch (err) {
    feedback.textContent = t('sendError');
    feedback.className = 'form-message error';
    feedback.hidden = false;
  } finally {
    if (btn.isConnected) { btn.disabled = false; btn.removeAttribute('aria-busy'); label.textContent = t('send'); }
  }
}

/* ------------------------------------------------------------------ */
/* Events                                                               */
/* ------------------------------------------------------------------ */

$app.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const act = btn.dataset.action;
  if (act === 'skip') {
    e.preventDefault();
    const main = document.getElementById('main-content');
    if (main) { main.focus(); main.scrollIntoView(); }
  } else if (act === 'language') {
    state.language = isAR() ? 'en' : 'ar';
    try { localStorage.setItem('slab-lang', state.language); } catch (err) {}
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    const toggle = document.querySelector('[data-action="language"]');
    if (toggle) toggle.focus();
  } else if (act === 'menu') setMenu(!state.mobile);
  else if (act === 'filter') setFilter(btn.dataset.filter);
  else if (act === 'step') setStep(Number(btn.dataset.index));
  else if (act === 'step-move') setStep(state.step + Number(btn.dataset.move));
  else if (act === 'gallery') setGallery(state.gallery + Number(btn.dataset.move));
  else if (act === 'gallery-index') setGallery(Number(btn.dataset.index));
  else if (act === 'lightbox') openLightbox();
  else if (act === 'project-tab') setProjectTab(btn.dataset.tab);
  else if (act === 'hero-video') {
    const v = document.getElementById('hero-video');
    if (!v) return;
    const pause = btn.getAttribute('aria-pressed') !== 'true'; // button state = intent (video may still be loading)
    pause ? v.pause() : v.play().catch(() => {});
    btn.setAttribute('aria-pressed', String(pause));
    btn.setAttribute('aria-label', pause ? t('playVideo') : t('pauseVideo'));
    btn.innerHTML = pause ? ICON.play : ICON.pause;
  }
  else if (act === 'scroll-to') {
    e.preventDefault();
    const el = document.getElementById(btn.dataset.target);
    if (el) { el.scrollIntoView({behavior: reducedMotion() ? 'auto' : 'smooth'}); el.setAttribute('tabindex', '-1'); el.focus({preventScroll: true}); }
  } else if (act === 'form-reset') render();
});

// If Supabase Storage is unreachable, fall back to the identical local copy in site/assets.
document.addEventListener('error', e => {
  const el = e.target;
  if (el && el.tagName === 'IMG' && el.src.startsWith(ASSET_BASE)) el.src = localAsset(el.src);
}, true);

// Same-page in-content anchors such as #main-content must not be treated as routes.
window.addEventListener('hashchange', e => {
  if (!/^#\//.test(location.hash) && location.hash !== '') {
    const target = document.getElementById(location.hash.slice(1));
    history.replaceState(null, '', e.oldURL && e.oldURL.includes('#') ? e.oldURL.slice(e.oldURL.indexOf('#')) : '#/home');
    if (target) target.scrollIntoView();
    return;
  }
  setMenu(false, {silent: true});
  navigate();
});

let scrollQueued = false;
window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestFrame(() => { scrollQueued = false; updateHeader(); runParallax(); });
}, {passive: true});
window.addEventListener('resize', () => requestFrame(runParallax), {passive: true});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.mobile) { setMenu(false); return; }
  const target = e.target;
  // Roving focus inside tab lists (project tabs and process stages).
  const tabBtn = target.closest && target.closest('[role="tab"]');
  if (tabBtn) {
    const list = Array.from(tabBtn.parentElement.querySelectorAll('[role="tab"]'));
    let i = list.indexOf(tabBtn), handled = true;
    const d = arrowDelta(e.key);
    if (d) i = (i + d + list.length) % list.length;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = list.length - 1;
    else handled = false;
    if (handled) {
      e.preventDefault();
      const b = list[i];
      if (b.dataset.tab) setProjectTab(b.dataset.tab, true); else setStep(Number(b.dataset.index), true);
    }
    return;
  }
  // Gallery arrows only while focus is inside the gallery.
  if (target.closest && target.closest('[data-gallery]')) {
    const d = arrowDelta(e.key);
    if (d) { e.preventDefault(); setGallery(state.gallery + d); }
  }
  // Keep Tab inside the open mobile menu (header toggle + menu links).
  if (e.key === 'Tab' && state.mobile) {
    const items = [document.querySelector('[data-action="menu"]'), ...document.querySelectorAll('#mobile-menu a')];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

$app.addEventListener('submit', e => {
  if (e.target.id !== 'lead-form') return;
  e.preventDefault();
  submitForm(e.target);
});
$app.addEventListener('focusin', e => {
  if (e.target.closest && e.target.closest('#lead-form') && !state.formStarted) state.formStarted = Date.now();
});
$app.addEventListener('focusout', e => {
  const el = e.target;
  if (el.closest && el.closest('#lead-form') && el.required && el.value !== '') validateField(el);
});
$app.addEventListener('input', e => {
  const el = e.target;
  if (el.getAttribute && el.getAttribute('aria-invalid') === 'true') validateField(el);
});
$app.addEventListener('change', e => {
  if (e.target.name === 'services') {
    if (document.getElementById('services-field').classList.contains('invalid')) validateServices(e.target.form);
    return;
  }
  if (e.target.id === 'consent' || e.target.tagName === 'SELECT') {
    if (e.target.getAttribute('aria-invalid') === 'true') validateField(e.target);
  }
});

// Gallery swipe on touch devices.
$app.addEventListener('pointerdown', e => {
  const frame = e.target.closest && e.target.closest('#gallery-frame');
  if (frame && !frame.dataset.swipe) { frame.dataset.swipe = '1'; addSwipe(frame, d => setGallery(state.gallery + d)); }
}, {capture: true});

// Hero: pause autoplay while hovered or focused.
$app.addEventListener('pointerover', e => {
  heroPaused = !!(e.target.closest && e.target.closest('.hero-bottom'));
  if (!matches('(pointer: fine)')) return;
  const card = e.target.closest && e.target.closest('[data-cursor]');
  cursor.textContent = card ? card.dataset.cursor : cursor.textContent;
  cursor.classList.toggle('show', !!card);
});
$app.addEventListener('pointermove', e => {
  if (!cursor.classList.contains('show')) return;
  cursorTX = e.clientX; cursorTY = e.clientY;
  if (!cursorRunning) { cursorRunning = true; requestAnimationFrame(moveCursor); }
});
document.addEventListener('pointerleave', () => cursor.classList.remove('show'));

render();
