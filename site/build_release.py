from pathlib import Path
import re,base64,zipfile
root=Path('/mnt/data/SLAB_site')
out=Path('/mnt/data')
html=(root/'index.html').read_text()
css=(root/'styles.css').read_text()
js=(root/'app.js').read_text()
images={p.stem:'data:image/webp;base64,'+base64.b64encode(p.read_bytes()).decode() for p in sorted((root/'assets').glob('*.webp'))}
import json
image_map='const EMBEDDED_IMAGES='+json.dumps(images,separators=(',',':'))+';\n'
js_inline=js.replace("const IMAGE = (slug, i=1) => `assets/${slug}_${i}.webp`;", "const IMAGE = (slug, i=1) => EMBEDDED_IMAGES[`${slug}_${i}`] || '';",1)
assert js_inline!=js
svg=(root/'assets'/'favicon.svg').read_bytes()
html=html.replace('href="assets/favicon.svg"','href="data:image/svg+xml;base64,'+base64.b64encode(svg).decode()+'"')
html=html.replace('<link rel="stylesheet" href="styles.css" />', '<style>\n'+css+'\n</style>')
html=html.replace('<script src="app.js" defer></script>', '<script>\n'+image_map+js_inline+'\n</script>')
preview=out/'SLAB_website_preview.html'
preview.write_text(html)
files=[root/'index.html',root/'styles.css',root/'app.js',root/'README_AR.txt']+sorted((root/'assets').glob('*'))
zip_path=out/'SLAB_website.zip'
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for file in files:
  archive.write(file,arcname='SLAB_site/'+str(file.relative_to(root)))
print('preview_html',preview,len(html)//1024,'KB')
print('zip',zip_path,zip_path.stat().st_size//1024,'KB')
print('assets',len(images))
