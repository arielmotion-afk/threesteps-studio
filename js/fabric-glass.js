// Fabric glass, a glowing glass marble filled with soft, grainy colour fields
// (after the client's gradient references: periwinkle, warm white, orange, navy).
// Two field layers at different depths drift past each other; the hero fabric's
// folds bend them and leave faint veins. Fresnel rim, inner glow, film grain.
//
//   const fg = FabricGlass(320, 'notch');  // square WebGL canvas, size in px; palette name optional
//   fg.render(time, energy);               // energy 0..1 swirls the fields harder (voice, thinking)
//   fg.canvas                              // put it in the page, or drawImage() it elsewhere
//
// Returns null when WebGL isn't available.
(function () {
  // ramp order: warm white · hot · warm mid · cool light · deepest · cool mid
  const PALETTES = {
    notch:  ['#F4EEE8', '#F25A1A', '#F79A62', '#7E97F7', '#081766', '#2C49E0'], // the client's references, pushed vivid
    marble: ['#FFF6F2', '#FF5C8A', '#FFB347', '#C9B6FF', '#2A0E3D', '#7C5CFF'], // rose / amber / lilac / plum
  };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uEnergy; uniform vec3 uC0,uC1,uC2,uC3,uC4,uC5;
vec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}
float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
 vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
 vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
 vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;
 vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
 m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}
// the hero's curtain folds (js/hero-fabric.js), used to bend the colour fields
float H(vec2 p,float t){
  vec2 w=vec2(snoise(vec2(p.x*.35+t*.15,p.y*.25-t*.1)),snoise(vec2(p.x*.3-t*.12,p.y*.3+t*.08)));
  vec2 q=p+w*.35; float h=0.;
  h+=sin(q.x*9.4+t*1.1+sin(q.y*1.3+t*.6)*1.4)*.55;
  h+=sin(q.x*6.3-t*.8+q.y*1.7+sin(t*.4)*2.)*.25;
  h+=snoise(vec2(q.x*1.2,q.y*.9+t*.3))*.35;
  return h;
}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
// one sweep through the references: navy → royal → periwinkle → warm white → peach → orange → burnt
vec3 ramp(float g){
  vec3 c=mix(uC4,uC5,smoothstep(-1.05,-.6,g));
  c=mix(c,uC3,smoothstep(-.62,-.22,g));
  c=mix(c,uC0,smoothstep(-.32,.04,g));
  c=mix(c,uC2,smoothstep(-.04,.34,g));
  c=mix(c,uC1,smoothstep(.18,.62,g));
  c=mix(c,uC1*vec3(.92,.78,.7),smoothstep(.7,1.05,g));
  return c;
}
// a soft field: a slowly turning sweep, bent by noise and the fabric folds
float field(vec2 q,float ang,float t,float seed){
  float g=dot(q,vec2(sin(ang),-cos(ang)))*1.15;   // sweep wide enough to reach orange and navy, soft enough to blend
  g+=snoise(q*.8+vec2(seed,t*.12))*(.45+uEnergy*.2);
  g+=H(q*.55+seed,t)*.11;
  return g;
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; vec2 c=uv*2.-1.; float r=length(c);
  float edge=smoothstep(1.,1.-3./uRes.x,r);
  if(edge<=0.){gl_FragColor=vec4(0.);return;}
  float z=sqrt(max(0.,1.-r*r));
  vec3 N=vec3(c,z), L=normalize(vec3(-.5,.6,.65));
  float t=uTime*.35;
  // glass ball lens: magnified middle, squeezed rim, plus a marble twist toward the centre
  vec2 q=c*(1.15-.35*z);
  q=rot((1.-r)*(1.1+uEnergy*.5))*q;
  // front and back layers turn opposite ways: depth through parallax
  float gf=field(q*1.05,t*.22+.4,t,1.3);
  float gb=field(rot(1.9)*q*.8,-t*.15+2.6,t*.8,7.1);
  // the back layer only shades the front (lighter / deeper), never mixes hues:
  // orange and blue averaging together is what turns muddy
  vec3 col=ramp(gf)*mix(.86,1.05,smoothstep(-.6,.6,gb));
  // vivid, but not blown out
  float lum=dot(col,vec3(.299,.587,.114));
  col=mix(vec3(lum),col,1.15)*.94;
  // 3D lighting that keeps colours pure: the shadow side deepens each hue into a
  // richer, darker version of itself (col*col) instead of mixing it toward grey
  float lam=dot(N,L)*.5+.5;
  vec3 deep=mix(col,col*col,.7);
  col=mix(deep,col,smoothstep(.05,.85,lam));
  // falloff toward the edge on the shadow side gives the volume
  col*=mix(.8,1.,mix(smoothstep(0.,.6,z),1.,smoothstep(.5,.95,lam)));
  // subsurface: a soft glow from inside, tinted by the field
  float core=smoothstep(.98,.2,r);
  col+=ramp(gf)*.07*core*core;
  // warm caustic low on the far side
  vec2 cd=c-vec2(.34,-.46); col+=uC2*exp(-dot(cd,cd)*7.)*.14;
  // glass: warm rim light on the lit side, cool bounce on the shadow side, a broad soft sheen
  float fres=pow(1.-z,2.6);
  col+=fres*smoothstep(.45,.95,lam)*.32*vec3(1.,.96,.92);
  col+=fres*(1.-lam)*.22*uC3;
  vec2 hl=c-vec2(-.36,.42); col+=exp(-dot(hl,hl)*4.5)*.08;
  // marble glows: two soft luminous strips that follow the fabric folds, mostly halo
  // with a faint core, screen-blended (they lighten, never burn) and faded before the rim
  float vs=1.-abs(sin(H(q*.9+4.,t)*.7));            // lower frequency: fewer strips
  float vs2=1.-abs(sin(H(rot(1.3)*q*.8+9.,t*.8)*.55+1.));
  float vfade=smoothstep(1.,.45,r);
  float g1=(pow(vs,9.)*.12+pow(vs,3.)*.07)*vfade;   // lower exponents: thicker strips
  float g2=(pow(vs2,10.)*.07+pow(vs2,3.5)*.035)*vfade;
  col=1.-(1.-col)*(1.-mix(uC0,ramp(gf+.35),.4)*g1);
  col=1.-(1.-col)*(1.-mix(uC0,uC3,.4)*g2);
  // soft shoulder: the brightest highlights roll off instead of clipping (no burnt patches)
  vec3 over=max(col-.8,0.);
  col=min(col,.8)+.2*(1.-exp(-over/.2));
  // film grain, like the references: fixed in place (re-rolling it per frame reads as static)
  float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  col+=(n-.5)*.05;
  float a=clamp(.82+.18*core,0.,.98)*edge;   // near-opaque: a see-through rim lets the page muddy the colour
  // premultiplied output: scaled edges blend with transparency, not with black (no grey fringe)
  gl_FragColor=vec4(clamp(col,0.,1.)*a,a);
}`;

  window.FabricGlass = function (size, paletteName) {
    const PALETTE = PALETTES[paletteName] || PALETTES.notch;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n);
    gl.viewport(0, 0, size, size); gl.uniform2f(U('uRes'), size, size);
    PALETTE.forEach((h, i) => gl.uniform3fv(U('uC' + i), hex(h)));
    const uTime = U('uTime'), uEnergy = U('uEnergy');
    gl.clearColor(0, 0, 0, 0);
    return {
      canvas,
      render(time, energy) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uTime, time); gl.uniform1f(uEnergy, energy || 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  };
}());
