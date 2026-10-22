from pathlib import Path
import fitz
from PIL import Image,ImageOps,ImageDraw
import io
root=Path('/mnt/data/SLAB_site')
D=fitz.open('/mnt/data/SLAB PROFILE 21.pdf')
projects={13:'almughrizat',14:'masharef',15:'nirvana12',16:'mkin30',17:'ajlan11',18:'ajlan37',19:'almajidiya116',20:'almajidiya111',21:'jawhara8',22:'ajlan19',23:'almajidiya70',24:'almajidiya130',26:'soulhittin'}
files=[]
for page_num,slug in projects.items():
 page=D[page_num-1]
 photos=[]
 for info in page.get_images(full=True):
  xref,w,h=info[0],info[2],info[3]
  if w<260 or h<245:continue
  rects=page.get_image_rects(xref)
  # Filter any bleed-through/cropped images that lie mainly off the current PDF page
  if not rects or max((r & page.rect).get_area()/max(1,r.get_area()) for r in rects)<.52:continue
  raw=D.extract_image(xref)
  try: im=Image.open(io.BytesIO(raw['image'])).convert('RGB')
  except:continue
  # exclusion low variance placeholder
  # skip repeated xrefs within the same page
  if xref in [r[0] for r in photos]:continue
  photos.append((xref,im))
 for i,(xref,img) in enumerate(photos[:4]):
  out=root/'assets'/f'{slug}_{i+1}.webp'
  if img.width>1600:img.thumbnail((1600,1200))
  img.save(out,quality=85,method=6)
  files.append((page_num,slug,i+1,str(out),xref))
print('files',len(files))
# representative contact sheet
thw,thh=200,142
sheet=Image.new('RGB',(thw*4, (len(projects)*1)*180),'#eee')
d=ImageDraw.Draw(sheet)
for ix,(page,slug) in enumerate(projects.items()):
 rec=[r for r in files if r[1]==slug]
 for j,r in enumerate(rec):
  img=Image.open(r[3]);img=ImageOps.fit(img,(thw-6,thh-4))
  x=j*thw;y=ix*180
  sheet.paste(img,(x,y+17))
  d.text((x+5,y),f'{slug} /{j+1}',fill='black')
sheet.save(root/'contact_sheet.jpg',quality=90)
print('size',sheet.size)
