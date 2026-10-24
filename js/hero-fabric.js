// Golden Strings (file name kept from when it was a fabric shader): WebGL prism light. Streaks of dispersed light, thin and broad, cross toward a soft glow.
// - The light drifts on its own. The streaks flutter like cords in a breeze; moving the cursor stirs a gust that sways them more,
//   then dies down. A string glows along its length while the cursor is over it.
// - Click or tap sends a soft wave outward that bends the streaks and shifts their colours as it passes. Now and then one comes by itself.
// Palette: data-palette="rose" (default), "periwinkle", "dusk", "gold" or "honey" on the mount.
// Mount: <div id="hero-fabric" [data-palette="..."]><canvas id="hero-fabric-gl"></canvas></div>
(function(){
if(!document.getElementById('hero-fabric-gl'))return;

// far/near: the ground away from and close to the light; glow: the light itself;
// spec: the five prism colours across a streak (optional; the default is pink, peach, pale yellow, aqua, lavender)
const PRISM=['#FF4DA8','#FF8F4D','#FFE64D','#40E0F2','#856BFF'];
const PALETTES={
  rose:       {far:'#B49CA6', near:'#DCC6C9', glow:'#FFF1E2'}, // dusty mauve
  periwinkle: {far:'#8F9BE6', near:'#BDB8F2', glow:'#F6F2FF'}, // soft blue-lilac
  dusk:       {far:'#17132A', near:'#3A2C52', glow:'#FFD9D0'}, // dark violet
  gold:       {far:'#15100A', near:'#3A2A16', glow:'#FFE7B0', spec:['#FFF07A','#FFC23D','#FF9A5C','#FF7A8A','#7FE3D0']}, // warm dark, yellow-led
  honey:      {far:'#D9C29A', near:'#F1E3C4', glow:'#FFF8E6', spec:['#FFE45C','#FFB02E','#FF8A4D','#FF6F8E','#5FD6C8']}, // warm light, yellow-led
};

const canvas=document.getElementById('hero-fabric-gl');
const host=document.getElementById('hero-fabric')||canvas;
const gl=canvas.getContext('webgl',{premultipliedAlpha:false,antialias:false});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!gl)return;

const M=8;           // waves in flight (extra clicks are ignored rather than cutting one short)
const KICK=.2;       // colour shift a wave carries
const WAVE=.3;       // how fast a wave spreads, per second
const S=10;          // streaks
const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const fs=`
precision highp float;
#define M ${M}
#define S ${S}
uniform vec2 uRes; uniform float uTime, uPhase;
uniform vec3 uMouse;      // xy in 0..1, z = presence
uniform vec2 uFocus;      // where the light comes in, 0..1
uniform vec3 uWind;       // gust from the cursor: xy direction (unit), z strength 0..1; dies down over a few seconds
uniform vec4 uWave[M];    // xy origin, age, amplitude
uniform vec3 uFar, uNear, uGlow;
uniform vec3 uSpec[5];    // prism colours across a streak
// simplex noise (Ashima)
vec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}
float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
 vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
 vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
 vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;
 vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
 m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}
float hash(float n){return fract(sin(n*127.1+.7)*43758.5453);}
vec3 screen(vec3 a, vec3 b){return 1.-(1.-a)*(1.-clamp(b,0.,1.));}
// prism colours (set per palette), blended round in a loop
vec3 spectrum(float x){
  x=fract(x)*5.; float f=smoothstep(0.,1.,fract(x)); float i=floor(x);
  vec3 a=uSpec[0], b=uSpec[1], c=uSpec[2], d=uSpec[3], e=uSpec[4];
  if(i<1.) return mix(a,b,f); if(i<2.) return mix(b,c,f); if(i<3.) return mix(c,d,f); if(i<4.) return mix(d,e,f); return mix(e,a,f);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; float ar=uRes.x/uRes.y;
  vec2 p=vec2(uv.x*ar,uv.y);
  float t=uTime*.25;
  vec2 q=p;
  vec2 dm=p-vec2(uMouse.x*ar,uMouse.y);
  float gust=uWind.z*exp(-dot(dm,dm)*1.2);   // the wind is strongest around the cursor, but broad
  // waves from clicks: a soft swell that bends the light as it passes, and shifts the colours behind it
  float ph=uPhase, wob=snoise(p*2.+t*.2)*.06;
  for(int i=0;i<M;i++){vec4 w=uWave[i]; if(w.w>0.){
    vec2 dc=p-vec2(w.x*ar,w.y); float dl=length(dc);
    float x=dl-w.z*${WAVE.toFixed(2)};
    q+=dc/max(dl,.001)*smoothstep(0.,.15,dl)*exp(-x*x*7.)*w.w/(1.+w.z*.5)*smoothstep(0.,.8,w.z); // grows in, never pops
    ph+=${KICK.toFixed(2)}*(1.-smoothstep(-.3,0.,x+.3+wob));}} // the colour edge starts at the click point
  q+=vec2(snoise(q*.5+vec2(t*.2,-t*.15)), snoise(q*.5+vec2(5.2,t*.17)))*.12;
  vec2 F=vec2(uFocus.x*ar,uFocus.y);
  float df=length(q-F);
  // base: lighter toward the light
  vec3 col=mix(uFar,uNear,exp(-df*df*1.3)*.85+snoise(p*.7+t*.1)*.08);
  // the cursor's spot in the same warped space, to tell which strings it is over
  vec2 mq=vec2(uMouse.x*ar,uMouse.y);
  mq+=vec2(snoise(mq*.5+vec2(t*.2,-t*.15)), snoise(mq*.5+vec2(5.2,t*.17)))*.12;
  // streaks: curved bands through the light, rainbow across their width, fading away from it
  for(int i=0;i<S;i++){
    float fi=float(i);
    float h1=hash(fi), h2=hash(fi+11.), h3=hash(fi+23.), h4=hash(fi+37.), h5=hash(fi+51.);
    float a=-.62+(h1-.5)*1.5+.07*sin(t*.4+fi*1.3);
    vec2 dir=vec2(cos(a),sin(a)), nrm=vec2(-dir.y,dir.x);
    bool thin=h4<.45;
    vec2 d=q-F;
    float along=dot(d,dir);
    float s=dot(d,nrm)+(h2-.5)*(thin? 1.4 : .7)*along*along+(h3-.5)*.55;
    // cords in the wind: a slow flutter that runs along each one; a gust makes it bigger and leans them downwind (thin ones move more)
    float flutter=(.006+.035*gust)*(thin? 1.6 : 1.);
    s+=flutter*sin(along*(4.+3.*h5)-uTime*(1.1+.5*h2)+fi*2.3);
    s+=.025*gust*dot(uWind.xy,nrm)*(thin? 1.5 : 1.);
    float w=thin? max(.003+.004*h5, 1.3/uRes.y) : .05+.11*h5; // thin ones never under ~a pixel, so they don't flicker
    float x=s/w;
    // a string glows along its whole length while the cursor is over it
    vec2 dmq=mq-F; float am=dot(dmq,dir);
    float sm=dot(dmq,nrm)+(h2-.5)*(thin? 1.4 : .7)*am*am+(h3-.5)*.55;
    float over=exp(-pow(sm/(w+.035),2.))*uMouse.z;
    float env=exp(-x*x)*exp(-sqrt(along*along+.01)*(.12+.3*h3));
    vec3 c=thin? mix(vec3(1.),spectrum(ph+fi*.17),.5) : spectrum(x*.42+ph+fi*.13);
    float k=env*(.7+.3*snoise(vec2(along*2.+fi*9.,t*.3)))*(1.+over*(thin? 1.6 : .9));
    if(thin) col=screen(col, c*k*.45);
    else { col=mix(col, c, k*(.45+.25*h2)); col=screen(col, vec3(k*.1)); } // tint, so the colour stays saturated; a little glow
  }
  // the light itself: a small warm core and a wide soft bloom
  col=screen(col, uGlow*(exp(-df*df*60.)*.3+exp(-df*df*4.)*.12));
  // a few warm dashes of light lying along the streaks
  vec2 d=q-F; float ang=atan(d.y,d.x);
  vec2 sg=vec2(ang/6.2831*160.+t*.15, df*16.);   // a whole number of cells per turn, wrapped, so there is no seam
  vec2 cell=floor(sg); cell.x=mod(cell.x,160.);
  float r1=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453), r2=fract(sin(dot(cell,vec2(269.5,183.3)))*43758.5453);
  vec2 sd=fract(sg)-.5-(vec2(r1,r2)-.5)*.4;
  float dash=exp(-sd.x*sd.x*14.-sd.y*sd.y*90.);
  float tw=.5+.5*sin(uTime*(.4+r2*.6)+r1*40.);
  col=screen(col, uGlow*step(.975,r2)*dash*tw*.55*exp(-df*.8));
  col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/160.; // grain, hides banding
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s;}
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const U=n=>gl.getUniformLocation(pr,n);
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const PAL=PALETTES[host.dataset.palette]||PALETTES.rose;
gl.uniform3fv(U('uSpec'),new Float32Array((PAL.spec||PRISM).flatMap(hex)));
gl.uniform3fv(U('uFar'),hex(PAL.far));gl.uniform3fv(U('uNear'),hex(PAL.near));gl.uniform3fv(U('uGlow'),hex(PAL.glow));
const uRes=U('uRes'),uTime=U('uTime'),uPhase=U('uPhase'),uMouse=U('uMouse'),uFocus=U('uFocus'),uWind=U('uWind'),uWave=U('uWave');

// ---- waves: a swell plus a colour shift that rides it outward; once it has crossed the surface it folds into the base phase ----
let phase=Math.random();
const waves=[];
const waveData=new Float32Array(M*4);
function aspect(){return canvas.width/Math.max(1,canvas.height);}
// a wave is retired only once its swell and colour edge are well past every corner, so nothing snaps
function reach(x,y){const ar=aspect();let m=0;for(const [cx,cy] of [[0,0],[1,0],[0,1],[1,1]])m=Math.max(m,Math.hypot((cx-x)*ar,cy-y));return m+1.2;}
function wave(x,y,amp){
  if(waves.length>=M)return; // never cut a wave short: that would make the colours jump
  waves.push({x,y,age:0,amp});
}
function stepWaves(dt){
  for(const w of waves)w.age+=dt;
  while(waves.length&&waves[0].age*WAVE>reach(waves[0].x,waves[0].y)){phase+=KICK;waves.shift();}
  waveData.fill(0);waves.forEach((w,i)=>waveData.set([w.x,w.y,w.age,w.amp],i*4));
}

// ---- pointer ----
const mouse={x:.5,y:.5,sx:.5,sy:.5,in:0,tin:0};
const focus={x:.62,y:.42};
const wind={x:1,y:0,e:0};
function local(e){const r=host.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:1-(e.clientY-r.top)/r.height,inside:e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};}
// entering the tile: start from where the cursor is, so it doesn't sweep in from the last spot
// outside the tile the cursor's spot stays where it left, so its glow fades in place
addEventListener('pointermove',e=>{const l=local(e);if(l.inside){if(!mouse.tin&&mouse.in<.02){mouse.sx=l.x;mouse.sy=l.y;}mouse.x=l.x;mouse.y=l.y;}mouse.tin=l.inside?1:0;},{passive:true});
document.addEventListener('pointerleave',()=>mouse.tin=0);
addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')mouse.tin=0;},{passive:true});
addEventListener('pointercancel',()=>mouse.tin=0,{passive:true});
host.addEventListener('pointerdown',e=>{const l=local(e);mouse.x=l.x;mouse.y=l.y;if(mouse.in<.02){mouse.sx=l.x;mouse.sy=l.y;}mouse.tin=1;wave(l.x,l.y,reduce?.02:.06);});
canvas.style.touchAction='pan-y'; // sideways drags stir the wind, vertical drags still scroll the page

function stepPointer(dt){
  const px=mouse.sx,py=mouse.sy,k=Math.min(1,dt*8);
  mouse.sx+=(mouse.x-mouse.sx)*k;mouse.sy+=(mouse.y-mouse.sy)*k;
  mouse.in+=(mouse.tin-mouse.in)*Math.min(1,dt*(mouse.tin?2:.8));
  // the light drifts on its own; the cursor moves it a little
  const ox=.62+.12*Math.sin(t*.07),oy=.42+.1*Math.cos(t*.05);
  const tx=ox+(mouse.sx-.5)*mouse.in*.2,ty=oy+(mouse.sy-.5)*mouse.in*.2,kf=Math.min(1,dt*1.2);
  focus.x+=(tx-focus.x)*kf;focus.y+=(ty-focus.y)*kf;
  // the wind: moving the cursor builds a gust (faster = stronger) that dies down over a few seconds; its direction turns slowly
  const vx=(mouse.sx-px)/Math.max(dt,1e-3),vy=(mouse.sy-py)/Math.max(dt,1e-3),sp=Math.hypot(vx,vy);
  wind.e=Math.min(1,wind.e*Math.exp(-dt*.7)+Math.min(sp,2)*dt*.9*mouse.in);
  if(sp>.05){const kd=Math.min(1,dt*2);wind.x+=(vx/sp-wind.x)*kd;wind.y+=(vy/sp-wind.y)*kd;const l=Math.hypot(wind.x,wind.y)||1;wind.x/=l;wind.y/=l;}
}

// render a bit under-res: it's soft anyway
function resize(){const dpr=Math.min(devicePixelRatio,1.5)*.75;
  canvas.width=Math.max(1,Math.round(canvas.clientWidth*dpr));canvas.height=Math.max(1,Math.round(canvas.clientHeight*dpr));gl.viewport(0,0,canvas.width,canvas.height);}
if(window.ResizeObserver)new ResizeObserver(resize).observe(canvas);else addEventListener('resize',resize);
resize();

let visible=true;new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(host);
let t=Math.random()*100,last=performance.now(),nextAuto=4;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(visible){
    t+=dt*(reduce?.4:1);
    phase+=dt*(reduce?.002:.006); // colours drift on their own
    nextAuto-=dt;if(nextAuto<0){nextAuto=reduce?20:9+Math.random()*4;wave(.15+Math.random()*.7,.15+Math.random()*.7,reduce?.01:.035);}
    stepPointer(dt);stepWaves(dt);
    gl.uniform2f(uRes,canvas.width,canvas.height);gl.uniform1f(uTime,t);gl.uniform1f(uPhase,phase%1000);
    gl.uniform3f(uMouse,mouse.sx,mouse.sy,mouse.in);gl.uniform2f(uFocus,focus.x,focus.y);
    gl.uniform3f(uWind,wind.x,wind.y,reduce?wind.e*.3:wind.e);
    gl.uniform4fv(uWave,waveData);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
