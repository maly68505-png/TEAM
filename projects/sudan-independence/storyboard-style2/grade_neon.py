import numpy as np
from PIL import Image
def grade(im):
    a=np.asarray(im.convert('RGB'),np.float32)/255
    lum=(a@np.array([.299,.587,.114]))[...,None]
    a=lum+(a-lum)*0.8
    a=np.clip((a-0.04)/0.9,0,1)**1.15                       # deep blacks, darker mids
    sh=np.clip(1-lum*1.8,0,1); mid=np.clip(1-abs(lum-0.45)*2.5,0,1); hi=np.clip((lum-0.5)*2.2,0,1)
    a=a+sh*np.array([-0.04,0.03,0.06])+mid*np.array([-0.03,0.02,0.04])+hi*np.array([0.07,0.01,-0.06])  # teal shadows/mids, orange highlights
    warm=(a[...,0:1]>a[...,2:3]+0.08).astype(np.float32)   # keep skin/reds rich red-orange
    a=a+warm*np.array([0.03,-0.01,-0.03])
    H,W=a.shape[:2]; y,x=np.mgrid[0:H,0:W]
    a=a*(1-0.35*(((x-W/2)/(W/2))**2+((y-H/2)/(H/2))**2)/2)[...,None]
    a+=np.random.default_rng(2).normal(0,0.015,a.shape)
    return Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8))
