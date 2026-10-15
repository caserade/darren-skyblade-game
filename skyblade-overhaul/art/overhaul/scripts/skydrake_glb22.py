import json,struct,hashlib
import numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class GLB:
 def __init__(self,path):
  self.raw=bytearray(Path(path).read_bytes());n=struct.unpack_from('<I',self.raw,12)[0];self.g=json.loads(self.raw[20:20+n]);self.offset=28+n
 def accessor(self,i):
  a=self.g['accessors'][i];v=self.g['bufferViews'][a['bufferView']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],width),dtype=dt,buffer=self.raw,offset=self.offset+v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*dt.itemsize),dt.itemsize))
 def range(self,i):
  a=self.g['accessors'][i];v=self.g['bufferViews'][a['bufferView']];ar=self.accessor(i);return self.offset+v.get('byteOffset',0)+a.get('byteOffset',0),ar.strides[0],ar.shape[1]*ar.itemsize,len(ar)
 def sha(self):return hashlib.sha256(self.raw).hexdigest()
def smooth(t):t=np.clip(t,0,1);return t*t*(3-2*t)
