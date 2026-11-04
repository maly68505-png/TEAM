import numpy as np, os
from PIL import Image, ImageDraw, ImageFilter
from grade import grade
SRC='../storyboard/img'
ORDER=['red','white','black','green']
COL={'red':(196,30,44),'white':(244,240,232),'black':(18,18,20),'green':(0,128,62)}
def strip_layer(W,H,seed,colour):
    rng=np.random.default_rng(seed)
    y0=rng.uniform(.10,.20); y1=rng.uniform(.05,.14); amp=rng.uniform(.025,.05)
    N=260; u=np.linspace(0,1,N)
    x=-0.05+1.1*u; y=y0+(y1-y0)*u+amp*np.sin(u*np.pi*rng.uniform(1.2,2.2)+rng.uniform(0,3))
    SS=2; xy=np.stack([x*W*SS,y*H*SS],1)
    t=np.gradient(xy,axis=0); t/=np.linalg.norm(t,axis=1,keepdims=True)+1e-6; n=np.stack([-t[:,1],t[:,0]],1)
    w=SS*0.028*H*np.clip(np.minimum(u*5,(1-u)*5),0.04,1)**0.7*(0.85+0.15*np.cos(u*7))
    m=Image.new('L',(W*SS,H*SS),0); d=ImageDraw.Draw(m)
    for k in range(N-1):
        d.polygon([tuple(xy[k]+n[k]*w[k]/2),tuple(xy[k+1]+n[k+1]*w[k+1]/2),tuple(xy[k+1]-n[k+1]*w[k+1]/2),tuple(xy[k]-n[k]*w[k]/2)],fill=255)
    return np.asarray(m.resize((W,H),Image.LANCZOS),np.float32)/255
def comp(src_im,graded,seed,colour):
    W,H=graded.size; base=np.asarray(src_im.convert('RGB'),np.float32)
    r,g,b=base[...,0],base[...,1],base[...,2]; lum=base@np.array([.299,.587,.114])
    top=slice(0,H//2); skyish=((b>r+8)&(lum>80))[top].mean()
    if skyish>0.35:   # outdoor with sky: strip passes behind people/rock
        occ=Image.fromarray((((r>b+10)|(lum<60))*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
        vis=1-np.asarray(occ,np.float32)/255
    else: vis=np.ones((H,W),np.float32)
    a=(strip_layer(W,H,seed,colour)*vis)[...,None]
    out=np.asarray(graded,np.float32)
    c=np.array(COL[colour],np.float32)*np.array([0.95,1.0,1.03])   # sit the colour in the grade
    if colour in('black','white'):                                  # thin contrasting edge so it reads
        edge=np.asarray(Image.fromarray((a[...,0]*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)),np.float32)[...,None]/255-a
        ec=np.array([230,226,218] if colour=='black' else [40,44,52],np.float32)
        out=out*(1-edge*0.45)+ec*edge*0.45
    out=out*(1-a)+c*a
    glow=np.asarray(Image.fromarray((a[...,0]*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(40)),np.float32)[...,None]/255
    if colour!='black': out=out+glow*0.18*(c-out)
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8))
for sc in range(1,30):
    colour=ORDER[(sc-1)%4]
    for i,x in enumerate('abc'):
        f=f'{sc:02d}{x}.jpg'; im=Image.open(os.path.join(SRC,f)); g=grade(im)
        comp(im,g,sc*10+i,colour).save('img/'+f,quality=90)
print('done')
