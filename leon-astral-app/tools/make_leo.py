"""Ícone Leon Astral v11: arte celeste em traço fino (referência do Carlos) com a constelação de Leão no lugar do leão.
Regras: a constelação é só dourada; molduras e ornamentos em degradê dourado -> roxo."""
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageFont
import math, random
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def gradient(S, c_top=(251,227,187), c_mid=(243,198,143), c_bot=(150,110,245)):
    g=Image.new('RGB',(S,S)); p=g.load()
    for y in range(S):
        t=y/S
        if t<.42: k=t/.42; c=tuple(int(c_top[i]+(c_mid[i]-c_top[i])*k) for i in range(3))
        else: k=(t-.42)/.58; c=tuple(int(c_mid[i]+(c_bot[i]-c_mid[i])*k) for i in range(3))
        for x in range(S): p[x,y]=c
    return g

def sparkle(d, x, y, L, w, fill, thin=0.18):
    # estrela de 4 pontas (losango alongado)
    t=L*thin
    d.polygon([(x,y-L),(x+t,y-t),(x+L,y),(x+t,y+t),(x,y+L),(x-t,y+t),(x-L,y),(x-t,y-t)],fill=fill)

def star8(d,x,y,L,fill):
    sparkle(d,x,y,L,0,fill,0.16)
    l2=L*0.6; t=l2*0.16
    d.polygon([(x-l2*.7,y-l2*.7),(x+t*.0,y-t*1.2),(x+l2*.7,y-l2*.7),(x+t*1.2,y),(x+l2*.7,y+l2*.7),(x,y+t*1.2),(x-l2*.7,y+l2*.7),(x-t*1.2,y)],fill=fill)

def draw(S=1024, bg=True, seed=8):
    W=S; cx=cy=S/2
    img=Image.new('RGBA',(S,S),(11,14,23,255) if bg else (0,0,0,0))
    if bg:
        neb=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(neb)
        d.ellipse((S*.15,S*.2,S*.85,S*.9),fill=(90,50,180,60)); d.ellipse((S*.3,S*.05,S*.7,S*.45),fill=(243,198,143,28))
        img.alpha_composite(neb.filter(ImageFilter.GaussianBlur(S*.1)))
    # ---------- ornamentos (máscara) em degradê dourado->roxo ----------
    M=Image.new('L',(S,S),0); m=ImageDraw.Draw(M)
    lw=max(2,int(S*.0042)); thin=max(1,int(S*.0022))
    R=S*.33
    m.ellipse((cx-R,cy-R,cx+R,cy+R),outline=255,width=lw)                 # círculo principal
    m.ellipse((cx-R*1.035,cy-R*1.035,cx+R*1.035,cy+R*1.035),outline=150,width=thin)  # aro fino
    # arcos pontilhados laterais
    R2=S*.40
    for ang in [a for a in range(200,341,4)]+[a for a in range(20,161,4)]:
        if 70<ang<110 or 250<ang<290: continue
        a=math.radians(ang); x=cx+R2*math.cos(a); y=cy+R2*math.sin(a); r=S*.0028
        m.ellipse((x-r,y-r,x+r,y+r),fill=200)
    # arcos contínuos finos (esq/dir)
    m.arc((cx-S*.385,cy-S*.385,cx+S*.385,cy+S*.385),205,245,fill=210,width=thin)
    m.arc((cx-S*.385,cy-S*.385,cx+S*.385,cy+S*.385),295,335,fill=210,width=thin)
    # ornamento do topo: círculo duplo + haste até o círculo principal
    ty=cy-R-S*.085; r1,r2=S*.042,S*.018
    m.ellipse((cx-r1,ty-r1,cx+r1,ty+r1),outline=255,width=lw); m.ellipse((cx-r2,ty-r2,cx+r2,ty+r2),outline=255,width=thin)
    m.line((cx,ty-r1-S*.05,cx,ty-r1),fill=255,width=thin); m.line((cx,ty+r1,cx,cy-R),fill=255,width=thin)
    m.line((cx-S*.062,ty,cx-r1,ty),fill=200,width=thin); m.line((cx+r1,ty,cx+S*.062,ty),fill=200,width=thin)
    # ornamento de baixo
    by=cy+R+S*.08; m.ellipse((cx-r1*.85,by-r1*.85,cx+r1*.85,by+r1*.85),outline=255,width=lw); m.ellipse((cx-r2*.8,by-r2*.8,cx+r2*.8,by+r2*.8),fill=255)
    m.line((cx,cy+R,cx,by-r1*.85),fill=255,width=thin)
    for k in range(1,4):
        y=by+r1+S*.018*k; r=S*.004*(1.2-k*.25); m.ellipse((cx-r,y-r,cx+r,y+r),fill=220)
    # 12 signos em volta (degradê vem da máscara)
    fz=ImageFont.truetype(FONT,int(S*.052))
    glyphs='\u2648\u2649\u264A\u264B\u264C\u264D\u264E\u264F\u2650\u2651\u2652\u2653'
    for i,gch in enumerate(glyphs):
        a=math.radians(195+i*30); rr=S*.445
        m.text((cx+rr*math.cos(a),cy-rr*math.sin(a)),gch,font=fz,anchor='mm',fill=255)
    random.seed(seed)
    for _ in range(int(S*.14)):  # poeira estelar
        a=random.random()*2*math.pi; rr=S*(.36+random.random()*.12); x=cx+rr*math.cos(a); y=cy+rr*math.sin(a)
        if abs(x-cx)<S*.06 and (y<cy-R or y>cy+R): continue
        r=random.choice([.6,.9,1.2])*S/1024; m.ellipse((x-r,y-r,x+r,y+r),fill=random.randint(120,230))
    G=gradient(S)
    orn=Image.merge('RGBA',(*G.split(),M))
    img.alpha_composite(orn.filter(ImageFilter.GaussianBlur(S*.004))); img.alpha_composite(orn)
    # ---------- símbolo de Leão (dourado) ----------
    gold=Image.new('RGB',(S,S),(247,212,150))
    f=ImageFont.truetype(FONT,int(S*.50))
    gm=Image.new('L',(S,S),0); ImageDraw.Draw(gm).text((cx,cy+S*.01),'\u264C',font=f,anchor='mm',fill=255)
    gg=Image.new('RGB',(S,S)); gq=gg.load()
    for y in range(S):
        t=min(1,max(0,(y-S*.33)/(S*.34))); c=(int(255*(1-t)+236*t),int(236*(1-t)+184*t),int(196*(1-t)+108*t))
        for x in range(S): gq[x,y]=c
    sym=Image.merge('RGBA',(*gg.split(),gm))
    halo=Image.merge('RGBA',(*gold.split(),Image.eval(gm.filter(ImageFilter.GaussianBlur(S*.03)),lambda v:int(v*.55))))
    img.alpha_composite(halo); img.alpha_composite(sym.filter(ImageFilter.GaussianBlur(S*.004))); img.alpha_composite(sym)
    st=Image.new('RGBA',(S,S),(0,0,0,0)); sd=ImageDraw.Draw(st)
    for (x,y,L) in [(.66,.36,.035),(.34,.66,.025),(.63,.70,.018)]:
        sparkle(sd,S*x,S*y,S*L,0,(255,240,210,230),0.12); r=S*.005; sd.ellipse((S*x-r,S*y-r,S*x+r,S*y+r),fill=(255,255,255,255))
    img.alpha_composite(st.filter(ImageFilter.GaussianBlur(S*.006))); img.alpha_composite(st)
    # poeira dourada dentro do círculo (bem leve)
    dust=Image.new('RGBA',(S,S),(0,0,0,0)); dd=ImageDraw.Draw(dust)
    for _ in range(int(S*.12)):
        a=random.random()*2*math.pi; rr=R*.95*math.sqrt(random.random()); x=cx+rr*math.cos(a); y=cy+rr*math.sin(a)
        r=random.choice([.5,.7,1.0])*S/1024; dd.ellipse((x-r,y-r,x+r,y+r),fill=(255,230,180,random.randint(60,170)))
    img.alpha_composite(dust)
    return img

if __name__=='__main__':
    draw(1024).save('/home/claude/icon_v11_1024.png')
    draw(1024,bg=False).save('/home/claude/icon_v11_fg.png')
