from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageFont
import random, math
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def grad_img(S, stops, angle_deg=90):
    """vertical-ish gradient RGB image; angle 90 = top->bottom"""
    g=Image.new('RGB',(S,S)); p=g.load()
    a=math.radians(angle_deg); dx,dy=math.cos(a),math.sin(a)
    for y in range(S):
        for x in range(S):
            t=((x/S-.5)*dx+(y/S-.5)*dy)+.5; t=min(1,max(0,t))
            for i in range(len(stops)-1):
                s0,c0=stops[i]; s1,c1=stops[i+1]
                if t<=s1:
                    k=(t-s0)/(s1-s0) if s1>s0 else 0
                    p[x,y]=tuple(int(c0[j]+(c1[j]-c0[j])*k) for j in range(3)); break
    return g

GOLDPURPLE=[(0,(255,232,190)),(0.4,(243,198,143)),(0.72,(200,150,220)),(1,(150,100,245))]

def make_lion(size_w=900):
    src0=Image.open('/home/claude/lion_clean.png').convert('RGBA')
    pad=int(src0.width*0.12); src=Image.new('RGBA',(src0.width+2*pad,src0.height+2*pad),(0,0,0,0)); src.paste(src0,(pad,pad))
    k=size_w/src.width; W,H=size_w,int(src.height*k)
    src=src.resize((W,H),Image.LANCZOS)
    A=src.split()[3]
    # interior mask: eroded + blurred alpha -> 0 at edges, 1 deep inside
    er=A.filter(ImageFilter.MinFilter(int(W*0.025)|1)).filter(ImageFilter.GaussianBlur(W*0.012))
    edge=ImageChops.subtract(A,er)                      # bright rim
    # base colours
    gold_hi=Image.new('RGB',(W,H),(255,226,150)); gold_lo=Image.new('RGB',(W,H),(196,128,44))
    # vertical warmth gradient
    vg=Image.new('L',(W,H)); vp=vg.load()
    for y in range(H):
        v=int(255*(1-0.45*y/H))
        for x in range(W): vp[x,y]=v
    body=Image.composite(gold_hi,gold_lo,ImageChops.multiply(vg,Image.eval(edge,lambda v:min(255,v*2+60))))
    lion=Image.new('RGBA',(W,H),(0,0,0,0))
    # interior translucent (sky shows through) + bright rim
    a_int=Image.eval(er,lambda v:int(v*0.42))
    a_rim=Image.eval(edge,lambda v:min(255,int(v*2.2)))
    alpha=ImageChops.lighter(a_int,a_rim); alpha=ImageChops.multiply(alpha,A)
    # keep face line-art crisp: original dark-ish pixels inside face stay
    lion=Image.merge('RGBA',(*body.split(),alpha))
    # starfield + constellations inside lion
    st=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(st); random.seed(5)
    for _ in range(int(W*H/500)):
        x,y=random.random()*W,random.random()*H; r=random.choice([.6,.8,1,1.3])*W/900
        d.ellipse((x-r,y-r,x+r,y+r),fill=(255,236,200,random.randint(120,255)))
    erp=er.load(); pts=[]
    tries=0
    while len(pts)<34 and tries<5000:
        tries+=1; x,y=random.random()*W,random.random()*H
        if erp[int(x),int(y)]>150 and abs(x-W/2)>W*0.13: pts.append((x,y))
    pts.sort(key=lambda p:(p[0]<W/2, p[1]))
    for side in (True,False):
        grp=[p for p in pts if (p[0]<W/2)==side]
        for i in range(len(grp)-1):
            if math.dist(grp[i],grp[i+1])<W*0.18:
                d.line((grp[i],grp[i+1]),fill=(255,220,160,150),width=max(1,int(W/600)))
    for x,y in pts:
        r=W*0.006; d.ellipse((x-r,y-r,x+r,y+r),fill=(255,245,220,255))
        L=W*0.018; d.line((x-L,y,x+L,y),fill=(255,240,210,200),width=max(1,int(W/700))); d.line((x,y-L,x,y+L),fill=(255,240,210,200),width=max(1,int(W/700)))
    st=Image.alpha_composite(st.filter(ImageFilter.GaussianBlur(W/500)),st)
    st.putalpha(ImageChops.multiply(st.split()[3],A))
    lion=Image.alpha_composite(lion,st)
    # leo glyph on forehead (gradient)
    f=ImageFont.truetype(FONT,int(W*0.11))
    gl=Image.new('L',(W,H),0); ImageDraw.Draw(gl).text((W/2,H*0.30),'♌',font=f,anchor='mm',fill=255)
    gcol=Image.new('RGB',(W,H),(255,226,170))
    glyph=Image.merge('RGBA',(*gcol.split(),gl))
    glow=glyph.filter(ImageFilter.GaussianBlur(W*0.012))
    lion=Image.alpha_composite(lion,glow); lion=Image.alpha_composite(lion,glyph)
    # overall glow halo
    halo=Image.new('RGBA',(W,H),(255,190,110,0)); halo.putalpha(Image.eval(A.filter(ImageFilter.GaussianBlur(W*0.03)),lambda v:int(v*0.30)))
    out=Image.alpha_composite(halo,lion)
    return out

def make_icon(S, lion, wheel=True):
    c=Image.new('RGBA',(S,S),(8,8,16,255))
    neb=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(neb)
    for (x0,y0,x1,y1,col) in [(-.25,-.15,.35,.4,(200,130,60,60)),(.7,-.15,1.25,.35,(200,130,60,50)),(-.25,.65,.35,1.25,(130,70,220,70)),(.65,.65,1.25,1.25,(124,58,237,65)),(.25,.25,.75,.75,(80,45,160,40))]:
        d.ellipse((S*x0,S*y0,S*x1,S*y1),fill=col)
    c.alpha_composite(neb.filter(ImageFilter.GaussianBlur(S*0.08)))
    random.seed(9); d=ImageDraw.Draw(c)
    for _ in range(int(S*0.7)):
        x,y=random.random()*S,random.random()*S; r=random.choice([.35,.5,.7,1.0])*S/1024
        col=random.choice([(255,225,170),(255,240,215),(200,175,255)])
        d.ellipse((x-r,y-r,x+r,y+r),fill=col+(random.randint(70,220),))
    cx=cy=S/2
    if wheel:
        mask=Image.new('L',(S,S),0); m=ImageDraw.Draw(mask)
        R1,R2,R3=S*0.47,S*0.40,S*0.355
        w=max(2,int(S*0.0045))
        for R in (R1,R2,R3): m.ellipse((cx-R,cy-R,cx+R,cy+R),outline=255,width=w)
        for i in range(12):
            a=math.radians(i*30+15); m.line((cx+R2*math.cos(a),cy+R2*math.sin(a),cx+R1*math.cos(a),cy+R1*math.sin(a)),fill=180,width=max(1,w//2))
        f=ImageFont.truetype(FONT,int(S*0.045))
        glyphs='♈♉♊♋♌♍♎♏♐♑♒♓'
        for i,gch in enumerate(glyphs):
            a=math.radians(180+i*30)  # aries at left, cancer at bottom
            Rm=(R1+R2)/2; x=cx+Rm*math.cos(a); y=cy-Rm*math.sin(a)
            m.text((x,y),gch,font=f,anchor='mm',fill=255)
        # outer thin orbit
        m.ellipse((cx-S*0.495,cy-S*0.495,cx+S*0.495,cy+S*0.495),outline=110,width=max(1,w//2))
        gp=grad_img(S,GOLDPURPLE,90)
        ring=Image.merge('RGBA',(*gp.split(),mask))
        c.alpha_composite(ring.filter(ImageFilter.GaussianBlur(S*0.006))); c.alpha_composite(ring)
        # 4 cardinal flares
        fl=Image.new('RGBA',(S,S),(0,0,0,0)); fd=ImageDraw.Draw(fl)
        for (x,y) in [(cx,cy-R1),(cx,cy+R1),(cx-R1,cy),(cx+R1,cy)]:
            for L,wd,al in [(S*0.07,max(2,S//400),230),(S*0.03,max(3,S//250),255)]:
                fd.line((x-L,y,x+L,y),fill=(255,236,200,al),width=wd); fd.line((x,y-L*1.3,x,y+L*1.3),fill=(255,236,200,al),width=wd)
            r=S*0.008; fd.ellipse((x-r,y-r,x+r,y+r),fill=(255,255,255,255))
        c.alpha_composite(fl.filter(ImageFilter.GaussianBlur(S*0.006))); c.alpha_composite(fl)
    lw=int(S*(0.74 if wheel else 0.95)); lh=int(lion.height*lw/lion.width)
    l=lion.resize((lw,lh),Image.LANCZOS)
    c.alpha_composite(l,(int(cx-lw/2),int(cy-lh/2+S*0.01)))
    return c

if __name__=='__main__':
    lion=make_lion(900); lion.save('/home/claude/lion_v8.png')
    for s in (1024,512): make_icon(s,lion).save(f'/home/claude/icon_v8_{s}.png')

def make_star_lion(size_w=900, seed=3):
    base=make_lion(size_w)                     # versão atual (rosto nítido)
    src0=Image.open('/home/claude/lion_clean.png').convert('RGBA')
    pad=int(src0.width*0.12); src=Image.new('RGBA',(src0.width+2*pad,src0.height+2*pad),(0,0,0,0)); src.paste(src0,(pad,pad))
    W,H=base.size; src=src.resize((W,H),Image.LANCZOS); A=src.split()[3]
    er=A.filter(ImageFilter.MinFilter(int(W*0.02)|1)).filter(ImageFilter.GaussianBlur(W*0.01))
    edge=ImageChops.subtract(A,er)
    # máscara do rosto (elipse central suave)
    face=Image.new('L',(W,H),0); fd=ImageDraw.Draw(face)
    fd.ellipse((W*0.36,H*0.40,W*0.64,H*0.76),fill=255)
    face=face.filter(ImageFilter.GaussianBlur(W*0.025))
    mane=ImageChops.multiply(A,Image.eval(face,lambda v:255-v))
    # rosto = versão atual recortada
    fa=ImageChops.multiply(base.split()[3],face); facel=base.copy(); facel.putalpha(fa)
    # névoa dourada bem leve para a juba ainda ler como forma
    haze=Image.new('RGBA',(W,H),(240,190,110,0)); haze.putalpha(Image.eval(mane,lambda v:int(v*0.06)))
    # estrelas que formam a juba
    st=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(st); random.seed(seed)
    mp=mane.load(); ep=edge.load()
    cols=[(255,236,190),(255,214,130),(255,246,225),(250,200,110)]
    n=0; tries=0; target=int(W*H/260)
    while n<target and tries<target*8:
        tries+=1; x,y=random.random()*W,random.random()*H
        m=mp[int(x),int(y)]
        if m<60: continue
        e=ep[int(x),int(y)]/255
        if random.random()>(0.15+0.85*min(1,e*1.8+0.1)): continue   # mais denso nas bordas das mechas
        r=(random.choice([.5,.7,.9,1.1,1.4])+e*1.6)*W/900
        a=int(min(255,(170+85*random.random())*(0.75+0.25*e))*m/255)
        d.ellipse((x-r,y-r,x+r,y+r),fill=random.choice(cols)+(a,)); n+=1
    # algumas estrelas grandes com brilho em cruz
    for _ in range(int(W*H/30000)):
        for _t in range(40):
            x,y=random.random()*W,random.random()*H
            if mp[int(x),int(y)]>200: break
        L=random.uniform(8,18)*W/900; w=max(1,int(W/650))
        d.line((x-L,y,x+L,y),fill=(255,244,220,230),width=w); d.line((x,y-L,x,y+L),fill=(255,244,220,230),width=w)
        r=2.2*W/900; d.ellipse((x-r,y-r,x+r,y+r),fill=(255,255,255,255))
    glow=st.filter(ImageFilter.GaussianBlur(W/320))
    stars=Image.alpha_composite(glow,st)
    out=Image.new('RGBA',(W,H),(0,0,0,0))
    halo=Image.new('RGBA',(W,H),(255,190,110,0)); halo.putalpha(Image.eval(A.filter(ImageFilter.GaussianBlur(W*0.035)),lambda v:int(v*0.22)))
    for layer in (halo,haze,stars,facel): out=Image.alpha_composite(out,layer)
    # símbolo de Leão na testa por cima
    f=ImageFont.truetype(FONT,int(W*0.10))
    gl=Image.new('L',(W,H),0); ImageDraw.Draw(gl).text((W/2,H*0.30),'♌',font=f,anchor='mm',fill=255)
    glyph=Image.merge('RGBA',(*Image.new('RGB',(W,H),(255,226,170)).split(),gl))
    out=Image.alpha_composite(out,glyph.filter(ImageFilter.GaussianBlur(W*0.01))); out=Image.alpha_composite(out,glyph)
    return out
