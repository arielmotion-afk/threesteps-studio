// Hero fabric gradient — WebGL curtain-like folds, cursor gust + click wave
(function(){
if(!document.getElementById('hero-fabric-gl'))return;

const PALETTES = [
  // Blush: site pink + peach + lilac + soft coral
  ['#FDF0F0','#FFC7C2','#E9D6FF','#FFDCA0','#F7A9B8'],
  // Sorbet: brighter, warmer
  ['#FFF3EC','#FF9E9E','#FFC977','#C9B6FF','#FF7FA8'],
  // Dusk: cooler, moodier but still light
  ['#F6EEF6','#C7B8F2','#9EC9F5','#F4B6C9','#B79BE8'],
];
// Rich: opt-in via <div id="hero-fabric" data-variant="rich">. Same folds as the hero, deeper shading,
// less white wash, a touch more saturation. The default (live homepage hero) is unchanged.
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);

const canvas=document.getElementById('hero-fabric-gl');
const gl=canvas.getContext('webgl',{premultipliedAlpha:false,antialias:false});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

if(gl){
const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const fs=`
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseAmt;
uniform vec3 uC0,uC1,uC2,uC3,uC4; uniform vec3 uRipple; // xy pos, z age
uniform float uBusy, uDepth, uWash, uSat; // variant controls: default 1,1,1,1
// simplex noise (Ashima)
vec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}
float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
 vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
 vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
 vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;
 vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
 m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}
// height field of a curtain: broad vertical folds that travel and sway
float H(vec2 p, float t, vec2 m, float amt, vec3 rip){
  float ar=uRes.x/uRes.y;
  // slow large warp so folds bend like fabric, not perfect stripes
  vec2 w=vec2(snoise(vec2(p.x*.35+t*.15, p.y*.25-t*.1)), snoise(vec2(p.x*.3-t*.12, p.y*.3+t*.08)));
  vec2 q=p+w*.35;
  float h=0.;
  float uvx=q.x/ar; // normalise to 0..1 so fold count is identical on any screen width
  h+=sin(uvx*9.4*uBusy + t*1.1 + sin(q.y*1.3+t*.6)*1.4)*.55;   // ~1.5 folds across width
  h+=sin(uvx*6.3*uBusy - t*.8  + q.y*1.7 + sin(t*.4)*2.)*.25;   // ~1 fold, slightly diagonal
  h+=snoise(vec2(q.x*1.2, q.y*.9+t*.3)*uBusy)*.35;               // billow
  h+=snoise(vec2(q.x*3.1-t*.2, q.y*2.6+t*.25))*.22*(uBusy-1.);    // dramatic only: small crumples
  // wind gust from cursor: a broad soft bulge
  vec2 d=p-m; h+=exp(-dot(d,d)*2.2)*1.1*amt;
  // click: a wide wave travelling outward
  vec2 rd=p-vec2(rip.x*ar,rip.y); float rr=length(rd);
  h+=sin(rr*5.-rip.z*4.)*exp(-rip.z*.9)*exp(-abs(rr-rip.z*.7)*2.5)*.7;
  return h;
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; float ar=uRes.x/uRes.y;
  vec2 p=vec2(uv.x*ar,uv.y);
  vec2 m=vec2(uMouse.x*ar,uMouse.y);
  float t=uTime*.35;
  float e=.01;
  float h=H(p,t,m,uMouseAmt,uRipple);
  float hx=H(p+vec2(e,0.),t,m,uMouseAmt,uRipple)-h;
  float hy=H(p+vec2(0.,e),t,m,uMouseAmt,uRipple)-h;
  vec3 n=normalize(vec3(-hx/e*.32*uDepth,-hy/e*.32*uDepth,1.));
  vec3 L=normalize(vec3(-.5,.6,.65));
  float diff=clamp(dot(n,L),0.,1.);
  float sheen=pow(clamp(dot(reflect(-L,n),vec3(0.,0.,1.)),0.,1.),6.);
  // base colour drifts across the fabric in huge soft regions
  float c1=smoothstep(-.8,.8,snoise(p*.35+vec2(t*.05,-t*.04)));
  float c2=smoothstep(-.8,.8,snoise(p*.3+vec2(5.1,-t*.05)));
  vec3 base=mix(uC1,uC2,c1);
  base=mix(base,uC3,c2*.35);
  // shading: shadows lean to the deeper accent, highlights to the light bg tone
  vec3 col=mix(mix(uC4,base,.3), base, smoothstep(.15,.95,diff));
  col=mix(col,uC0,sheen*.85);
  col=mix(col,uC0,.18*uWash);
  float calm=smoothstep(.9,.2,length((uv-vec2(.2,.6))*vec2(1.,1.4)));
  col=mix(col,uC0,calm*.25*uWash);
  float lum=dot(col,vec3(.299,.587,.114));
  col=clamp(mix(vec3(lum),col,uSat),0.,1.);
  gl_FragColor=vec4(col,1.);
}`;
function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s;}
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const U=n=>gl.getUniformLocation(pr,n);
const uRes=U('uRes'),uTime=U('uTime'),uMouse=U('uMouse'),uAmt=U('uMouseAmt'),uRip=U('uRipple'),uC=[0,1,2,3,4].map(i=>U('uC'+i));

const hostEl=document.getElementById('hero-fabric');
const RICH=hostEl&&hostEl.dataset.variant==='rich';
let cur=(RICH?PALETTES[1]:PALETTES[0]).map(hex), target=cur.map(c=>c.slice());
gl.useProgram(pr);
gl.uniform1f(U('uBusy'),1);gl.uniform1f(U('uDepth'),RICH?1.45:1);gl.uniform1f(U('uWash'),RICH?.5:1);gl.uniform1f(U('uSat'),RICH?1.2:1);
function setPalette(i){target=PALETTES[i].map(hex);}

const hero=document.getElementById('hero-fabric');
const mouse={x:.7,y:.5,tx:.7,ty:.5,amt:0,tamt:0};
addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;mouse.tx=x;mouse.ty=1-y;mouse.tamt=(y>=0&&y<=1)?1:0;});
document.addEventListener('pointerleave',()=>mouse.tamt=0);
let ripple={x:.5,y:.5,age:99};
addEventListener('pointerdown',e=>{const r=hero.getBoundingClientRect();ripple={x:(e.clientX-r.left)/r.width,y:1-(e.clientY-r.top)/r.height,age:0};});

function resize(){const dpr=Math.min(devicePixelRatio,1.5)*.75; // render a bit under-res: it's soft anyway
  canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);}
addEventListener('resize',resize);resize();

let visible=true;new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(hero);
let t=Math.random()*100,last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(visible){
    t+=dt*(reduce?.2:1);
    mouse.x+=(mouse.tx-mouse.x)*Math.min(1,dt*2.2);mouse.y+=(mouse.ty-mouse.y)*Math.min(1,dt*2.2);
    mouse.amt+=(mouse.tamt-mouse.amt)*Math.min(1,dt*1.5);
    ripple.age+=dt;
    cur=cur.map((c,i)=>c.map((v,j)=>v+(target[i][j]-v)*Math.min(1,dt*2)));
    gl.uniform2f(uRes,canvas.width,canvas.height);gl.uniform1f(uTime,t);
    gl.uniform2f(uMouse,mouse.x,mouse.y);gl.uniform1f(uAmt,reduce?0:mouse.amt);
    gl.uniform3f(uRip,ripple.x,ripple.y,reduce?99:ripple.age);
    cur.forEach((c,i)=>gl.uniform3f(uC[i],c[0],c[1],c[2]));
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
}

})();
