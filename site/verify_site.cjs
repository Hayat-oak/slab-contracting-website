// Static runtime verification for the SLAB site. Usage: cd site && node verify_site.cjs
// Renders every route in EN and AR inside a minimal DOM mock, then checks output, assets and form wiring.
// For interaction tests in a real browser, open qa/selftest.html.
const fs = require('fs'), vm = require('vm'), path = require('path');

const stub = () => ({
  style: {}, className: '', dataset: {}, hidden: false,
  setAttribute() {}, getAttribute() { return null }, removeAttribute() {}, appendChild() {},
  addEventListener() {}, focus() {}, querySelector() { return null }, querySelectorAll() { return [] },
  classList: {toggle() {}, add() {}, remove() {}, contains() { return false }}
});
const app = Object.assign(stub(), {innerHTML: ''});
const loc = {hash: '#/home', search: '', protocol: 'file:', hostname: ''};
const context = {
  console, URLSearchParams, Date, Math, Number, String, Array, Object, Promise, setTimeout: () => 1, clearTimeout() {},
  setInterval: () => 1, clearInterval() {}, localStorage: {getItem: () => null, setItem() {}},
  history: {replaceState() {}}, location: loc, Image: function Image() {},
  document: {
    documentElement: {lang: '', dir: ''}, body: stub(), hidden: false,
    getElementById: id => (id === 'app' ? app : null), querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, createElement: stub
  },
  window: {scrollY: 0, innerHeight: 800, addEventListener() {}, scrollTo() {}}
};
context.window.location = loc;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'), context);

const errors = [];
const projects = vm.runInContext('projects', context);
const routes = ['home', 'projects', 'services', 'services/2', 'about', 'process', 'process/7', 'contact', 'privacy', ...projects.map(p => 'projects/' + p.id)];
let contactHtml = '';
for (const lang of ['en', 'ar']) {
  vm.runInContext(`state.language='${lang}'`, context);
  for (const route of routes) {
    loc.hash = '#/' + route;
    vm.runInContext('render()', context);
    const out = app.innerHTML;
    if (route === 'contact' && lang === 'en') contactHtml = out;
    if (!out.includes('<main')) errors.push(`Missing <main> ${lang} ${route}`);
    if ((out.match(/<h1[\s>]/g) || []).length !== 1) errors.push(`Expected one <h1> ${lang} ${route}`);
    if (/(>\s*undefined\s*<|>\s*null\s*<|\[object Object\]|NaN)/.test(out)) errors.push(`Unexpected undefined/null/NaN ${lang} ${route}`);
    // Photos are served from Supabase Storage; each must also exist as the local fallback copy in site/assets.
    const assetBase = vm.runInContext('ASSET_BASE', context);
    for (const m of out.matchAll(/(?:src="|url\(')([^"')]+\.(?:webp|svg|woff2))(?:"|')/g)) {
      const local = m[1].replace(assetBase, 'assets/');
      if (!local.startsWith('assets/')) { errors.push(`Unexpected asset host ${m[1]} (${lang} ${route})`); continue; }
      if (!fs.existsSync(path.join(__dirname, local))) errors.push(`Missing asset ${local} (${lang} ${route})`);
    }
    console.log(lang, route.padEnd(26), out.length, 'chars', 'imgs', (out.match(/<img/g) || []).length);
  }
}

// Gallery counts must match the photos on disk (catches the old ajlan11/ajlan19/almajidiya111 mismatch).
const files = fs.readdirSync(path.join(__dirname, 'assets'));
for (const p of projects) {
  const onDisk = files.filter(f => new RegExp(`^${p.id}_\\d+\\.webp$`).test(f)).length;
  if (onDisk !== p.images) errors.push(`${p.id}: images=${p.images} but ${onDisk} file(s) on disk`);
  // Gallery and lightbox load the large version, so every photo needs one in assets/hd.
  for (let i = 1; i <= p.images; i++) {
    if (!fs.existsSync(path.join(__dirname, 'assets', 'hd', `${p.id}_${i}.webp`))) errors.push(`Missing assets/hd/${p.id}_${i}.webp`);
  }
}
if (projects.length !== 13) errors.push(`Expected 13 projects, found ${projects.length}`);

// The enquiry form posts these fields to Supabase table project_enquiries (see submitForm in app.js).
const liveForm = contactHtml.slice(contactHtml.indexOf('<form'), contactHtml.indexOf('</form>'));
for (const n of ['full-name', 'email', 'phone', 'project-type', 'project-location', 'message', 'consent', 'bot-field']) {
  if (!liveForm.includes(`name="${n}"`)) errors.push(`Form field "${n}" missing from the contact form`);
}

if (errors.length) { console.error(errors); process.exit(1); }
console.log('All pages, assets, gallery counts and form fields passed static runtime verification');
