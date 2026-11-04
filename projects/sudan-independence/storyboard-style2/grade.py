import numpy as np
from PIL import Image, ImageFilter
def grade(im):
    a=np.asarray(im.convert('RGB'),np.float32)/255
    lum=(a@np.array([.299,.587,.114]))[...,None]
    a=lum+(a-lum)*0.55                          # desaturate
    a=0.06+a*0.86                               # lift blacks, soft highlights
    a=a**1.08                                   # slightly darker mids
    sh=np.clip(1-lum*1.6,0,1); hi=np.clip((lum-0.55)*2,0,1)
    a=a+sh*np.array([-0.02,0.01,0.035])+hi*np.array([0.015,0.005,-0.015])   # teal shadows, neutral-warm highlights
    a=a*np.array([0.97,1.0,1.03])               # cool overall
    H,W=a.shape[:2]; y,x=np.mgrid[0:H,0:W]
    v=1-0.28*(((x-W/2)/(W/2))**2+((y-H/2)/(H/2))**2)/2; a=a*v[...,None]
    a+=np.random.default_rng(1).normal(0,0.012,a.shape)
    return Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8))
