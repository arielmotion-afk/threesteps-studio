// Fabric gradient: WebGL shot-silk folds.
// - Colourways change over time: each new one bleeds across the cloth like dye. Click or tap starts one from that point.
// - The light follows the cursor, so the sheen slides over the folds.
// - Dragging pulls the folds along with the pointer and leaves a wake that settles back.
// Mount: <div id="hero-fabric" [data-variant="rich"]><canvas id="hero-fabric-gl"></canvas></div>
(function(){
if(!document.getElementById('hero-fabric-gl'))return;

// Each colourway: shadow, warp colour, weft colour, highlight. Shot silk shows warp or weft depending on the fold angle.
const PALETTES = [
  ['#9C1F5C','#F0508A','#FFA07A','#FFF0E6'], // rose
  ['#0B3D7A','#1F86E0','#34D6C0','#EAFFFB'], // lagoon
  ['#A8320A','#F26A2E','#FFC53D','#FFF6DC'], // marigold
  ['#3A1FA0','#7457FF','#F28CFF','#FBF0FF'], // violet
  ['#0F5A3E','#23A06F','#C9F25A','#F7FFE6'], // moss
  ['#2B1680','#FF3D6E','#4F86FF','#FFEDF4'], // cherry and cobalt
];
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const PAL=PALETTES.map(p=>p.map(hex));

const canvas=document.getElementById('hero-fabric-gl');
const host=document.getElementById('hero-fabric')||canvas;
const gl=canvas.getContext('webgl',{premultipliedAlpha:false,antialias:false});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!gl)return;

const N=12; // wake points
const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const fs=`
precision highp float;
#define N ${N}
uniform vec2 uRes; uniform float uTime; uniform float uDepth;
uniform vec3 uMouse;          // xy in 0..1, z = presence
uniform vec4 uTrail[N];       // xy position, zw velocity (per second)
uniform float uTrailK[N];     // strength, fades with age
uniform vec3 uP[12];          // 3 colourways x 4 colours: base, front 1, front 2
uniform vec3 uF1, uF2;        // dye fronts: xy origin, z radius
// simplex noise (Ashima)
vec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}
float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
 vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
 vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
 vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;
 vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
 m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}
// height of the cloth at p (x scaled by aspect)
float H(vec2 p, float t, float ar){
  vec2 w=vec2(snoise(vec2(p.x*.35+t*.15, p.y*.25-t*.1)), snoise(vec2(p.x*.3-t*.12, p.y*.3+t*.08)));
  vec2 q=p+w*.35;
  // the pointer's wake drags the cloth along and presses it down
  // (averaged, not summed, so overlapping points can't fold the cloth over itself)
  float dent=0.; vec2 pull=vec2(0.);
  for(int i=0;i<N;i++){
    vec2 d=p-vec2(uTrail[i].x*ar,uTrail[i].y);
    float f=exp(-dot(d,d)*9.)*uTrailK[i];
    pull+=uTrail[i].zw*f;
    dent+=f;
  }
  q-=pull/(1.+dent)*vec2(ar,1.)*.14;
  vec2 dm=p-vec2(uMouse.x*ar,uMouse.y);
  dent+=exp(-dot(dm,dm)*14.)*uMouse.z*.35;
  float x=q.x/ar;
  float h=sin(x*9.4+t*1.1+sin(q.y*1.3+t*.6)*1.4)*.55;
  h+=sin(x*6.3-t*.8+q.y*1.7+sin(t*.4)*2.)*.25;
  h+=snoise(vec2(q.x*1.2, q.y*.9+t*.3))*.35;
  h+=snoise(vec2(q.x*3.1-t*.2, q.y*2.6+t*.25))*.07;
  return h-(1.-exp(-dent))*.5; // soft cap: never a flat plateau
}
vec3 shade(int k, float tone, float diff, float sheen){
  vec3 s,a,b,hi;
  if(k==0){s=uP[0];a=uP[1];b=uP[2];hi=uP[3];}
  else if(k==1){s=uP[4];a=uP[5];b=uP[6];hi=uP[7];}
  else{s=uP[8];a=uP[9];b=uP[10];hi=uP[11];}
  vec3 base=mix(a,b,tone);
  vec3 col=mix(s, base, smoothstep(.2,.9,diff));
  col=mix(col,hi,sheen);
  return col;
}
float front(vec3 f, vec2 p, float ar, float wob){
  float d=length(p-vec2(f.x*ar,f.y))+wob;
  return (1.-smoothstep(f.z-.14, f.z, d))*step(.001,f.z);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; float ar=uRes.x/uRes.y;
  vec2 p=vec2(uv.x*ar,uv.y);
  float t=uTime*.35, e=.01;
  float h=H(p,t,ar);
  float hx=H(p+vec2(e,0.),t,ar)-h, hy=H(p+vec2(0.,e),t,ar)-h;
  vec3 n=normalize(vec3(-hx/e*.32*uDepth, -hy/e*.32*uDepth, 1.));
  // light: drifts on its own, comes from the pointer when there is one
  vec2 lp=mix(vec2(.3+.25*sin(uTime*.13), .75+.15*cos(uTime*.1)), uMouse.xy, uMouse.z);
  vec3 Lp=normalize(vec3((lp-uv)*vec2(ar,1.), .45));
  vec3 L=normalize(mix(vec3(-.5,.6,.65), Lp, .3+.45*uMouse.z));
  float diff=dot(n,L)*.5+.5;
  diff*=.7+.3*smoothstep(-1.,.8,h); // valleys sit a little deeper
  float sheen=pow(clamp(dot(reflect(-L,n),vec3(0.,0.,1.)),0.,1.),5.)*.7;
  // shot silk: the fold angle decides warp or weft colour; large slow patches keep it from being regular
  float patch=snoise(p*.4+vec2(t*.05,-t*.04));
  float tone=clamp(.5+n.x*.6+n.y*.25+patch*.15, 0.,1.);
  float wob=snoise(p*1.8+t*.3)*.12+h*.05;
  float m1=front(uF1,p,ar,wob), m2=front(uF2,p,ar,wob);
  vec3 col=shade(0,tone,diff,sheen);
  if(m1>0.) col=mix(col, shade(1,tone,diff,sheen), m1);
  if(m2>0.) col=mix(col, shade(2,tone,diff,sheen), m2);
  // a thin wet edge where the dye is still spreading
  float rim=(m1*(1.-m1)*step(.001,uF1.z)+m2*(1.-m2)*step(.001,uF2.z))*4.;
  col=mix(col, col*.82, clamp(rim,0.,1.)*.35);
  col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/128.; // grain, hides banding
  gl_FragColor=vec4(col,1.);
}`;
function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s;}
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const U=n=>gl.getUniformLocation(pr,n);
const uRes=U('uRes'),uTime=U('uTime'),uMouse=U('uMouse'),uTrail=U('uTrail'),uTrailK=U('uTrailK'),uP=U('uP'),uF1=U('uF1'),uF2=U('uF2');
gl.uniform1f(U('uDepth'),host.dataset&&host.dataset.variant==='rich'?1.45:1.15);

// ---- colourways and dye fronts ----
// slots: [base, front 1, front 2]. A front grows from its origin until it covers the cloth, then becomes the base.
let palIdx=0;
const slots=[PAL[0],PAL[0],PAL[0]];
const fronts=[null,null]; // {x,y,r,speed}
const palData=new Float32Array(36);
let nextAuto=reduce?14:6;
function aspect(){return canvas.width/Math.max(1,canvas.height);}
function reach(x,y){const ar=aspect();let m=0;for(const [cx,cy] of [[0,0],[1,0],[0,1],[1,1]])m=Math.max(m,Math.hypot((cx-x)*ar,cy-y));return m+.35;}
function dye(x,y,speed){
  palIdx=(palIdx+1)%PAL.length;
  if(!fronts[0]){fronts[0]={x,y,r:0,speed};slots[1]=PAL[palIdx];}
  else if(!fronts[1]){fronts[1]={x,y,r:0,speed};slots[2]=PAL[palIdx];}
  else{ // both busy: settle the older one and shift
    slots[0]=slots[1];fronts[0]=fronts[1];slots[1]=slots[2];
    fronts[1]={x,y,r:0,speed};slots[2]=PAL[palIdx];
  }
}
function stepFronts(dt){
  for(let i=0;i<2;i++){const f=fronts[i];if(f)f.r+=f.speed*dt;}
  // the newest front covers everything: it becomes the base
  if(fronts[1]&&fronts[1].r>reach(fronts[1].x,fronts[1].y)){slots[0]=slots[1]=slots[2];fronts[0]=fronts[1]=null;}
  if(fronts[0]&&fronts[0].r>reach(fronts[0].x,fronts[0].y)){
    slots[0]=slots[1];
    if(fronts[1]){fronts[0]=fronts[1];slots[1]=slots[2];fronts[1]=null;}else fronts[0]=null;
  }
}

// ---- pointer ----
const mouse={x:.5,y:.5,sx:.5,sy:.5,in:0,tin:0};
const trail=[];for(let i=0;i<N;i++)trail.push({x:-9,y:-9,vx:0,vy:0,age:99});
let ti=0,lastPush={x:-9,y:-9,t:0};
const trailData=new Float32Array(N*4),trailK=new Float32Array(N);
function local(e){const r=host.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:1-(e.clientY-r.top)/r.height,inside:e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};}
addEventListener('pointermove',e=>{const l=local(e);mouse.x=l.x;mouse.y=l.y;mouse.tin=l.inside?1:0;},{passive:true});
document.addEventListener('pointerleave',()=>mouse.tin=0);
addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')mouse.tin=0;},{passive:true});
addEventListener('pointercancel',()=>mouse.tin=0,{passive:true});
host.addEventListener('pointerdown',e=>{const l=local(e);mouse.x=mouse.sx=l.x;mouse.y=mouse.sy=l.y;mouse.tin=1;dye(l.x,l.y,reduce?.5:1.1);});
canvas.style.touchAction='pan-y'; // sideways drags pull the cloth, vertical drags still scroll the page

function stepTrail(dt,now){
  const px=mouse.sx,py=mouse.sy;
  const k=Math.min(1,dt*14);mouse.sx+=(mouse.x-mouse.sx)*k;mouse.sy+=(mouse.y-mouse.sy)*k;
  mouse.in+=(mouse.tin-mouse.in)*Math.min(1,dt*(mouse.tin?4:1.5));
  let vx=(mouse.sx-px)/Math.max(dt,1e-3),vy=(mouse.sy-py)/Math.max(dt,1e-3);
  const sp=Math.hypot(vx,vy),cap=2.5;if(sp>cap){vx*=cap/sp;vy*=cap/sp;}
  for(const p of trail)p.age+=dt;
  if(mouse.tin&&!reduce&&sp>.05&&(Math.hypot(mouse.sx-lastPush.x,mouse.sy-lastPush.y)>.03||now-lastPush.t>60)){
    trail[ti]={x:mouse.sx,y:mouse.sy,vx,vy,age:0,s:Math.min(1,sp/1.2)};ti=(ti+1)%N;
    lastPush={x:mouse.sx,y:mouse.sy,t:now};
  }
  for(let i=0;i<N;i++){const p=trail[i],f=Math.max(0,1-p.age/1.6);
    trailData.set([p.x,p.y,p.vx,p.vy],i*4);trailK[i]=f*f*(p.s||0);}
}

// render a bit under-res: it's soft anyway
function resize(){const dpr=Math.min(devicePixelRatio,1.5)*.75;
  canvas.width=Math.max(1,Math.round(canvas.clientWidth*dpr));canvas.height=Math.max(1,Math.round(canvas.clientHeight*dpr));gl.viewport(0,0,canvas.width,canvas.height);}
if(window.ResizeObserver)new ResizeObserver(resize).observe(canvas);else addEventListener('resize',resize);
resize();

let visible=true;new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(host);
let t=Math.random()*100,last=performance.now(),idle=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(visible){
    t+=dt*(reduce?.2:1);
    stepTrail(dt,now);
    stepFronts(dt);
    if(!fronts[0]&&!fronts[1]){idle+=dt;if(idle>nextAuto){idle=0;nextAuto=reduce?14:6;dye(Math.random(),Math.random(),reduce?.15:.32);}}else idle=0;
    slots.forEach((pal,i)=>pal.forEach((c,j)=>palData.set(c,(i*4+j)*3)));
    gl.uniform2f(uRes,canvas.width,canvas.height);gl.uniform1f(uTime,t);
    gl.uniform3f(uMouse,mouse.sx,mouse.sy,mouse.in);
    gl.uniform4fv(uTrail,trailData);gl.uniform1fv(uTrailK,trailK);
    gl.uniform3fv(uP,palData);
    const f1=fronts[0],f2=fronts[1];
    gl.uniform3f(uF1,f1?f1.x:0,f1?f1.y:0,f1?f1.r:0);
    gl.uniform3f(uF2,f2?f2.x:0,f2?f2.y:0,f2?f2.r:0);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
