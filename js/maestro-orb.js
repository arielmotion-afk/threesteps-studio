/* Maestro orb: the launch orb drawn live in WebGL.
   Thin glowing strands wander around a ring, over a soft halo, with a dark centre.
   MaestroOrb(canvas, { scale, speed }) returns { set(opts), destroy() } */
(function () {
  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 res;uniform float t;uniform float R;uniform vec2 m;uniform float pulse;uniform vec2 cen;uniform float sq;uniform float ef;',
    'const float PI=3.14159265;',
    'float hash(float n){return fract(sin(n*127.1)*43758.5453);}',
    // colour around the ring: cream top left, peach top, pink bottom right, lilac bottom left
    'vec3 hue(float a){',
    '  vec3 cream=vec3(1.,.94,.84),peach=vec3(1.,.86,.74),pink=vec3(.93,.74,.86),lilac=vec3(.84,.8,.96);',
    '  float k=fract((a+PI)/(2.*PI)+.0);',
    // angle 0 is the right side, going counter-clockwise: right, top, left, bottom
    '  vec3 c=mix(cream,mix(pink,lilac,.45),smoothstep(.05,.25,k));',
    '  c=mix(c,pink,smoothstep(.3,.5,k));',
    '  c=mix(c,peach,smoothstep(.55,.72,k));',
    '  c=mix(c,cream,smoothstep(.75,.95,k));',
    '  return c;}',
    'void main(){',
    '  vec2 p=(gl_FragCoord.xy-cen)/R;p.y*=sq;',
    '  float L=length(p),A=atan(p.y,p.x);',
    '  float tt=t;',
    '  float ml=length(m);float pa=ml>.001?atan(m.y,m.x):0.;',
    '  float da=mod(A-pa+PI,2.*PI)-PI;float pull=.06*exp(-da*da*2.)*min(ml,1.2);',
    // the ring itself breathes and wobbles as a whole
    '  float base=1.+.035*sin(2.*A+tt*.3)+.025*sin(3.*A-tt*.22+1.)+.04*cos(2.*(A-.6))+pull+pulse*.03;',
    '  float I=0.,W=0.;',
    '  for(int i=0;i<10;i++){',
    '    float f=float(i),h1=hash(f+1.),h2=hash(f+7.),h3=hash(f+13.);',
    '    float r=base+(h1-.5)*.18',
    '      +.06*sin(2.*A+tt*(.2+h2*.35)+h3*6.28)',
    '      +.04*sin(3.*A-tt*(.15+h1*.3)+h2*6.28)',
    '      +.02*sin(6.*A+tt*(.3+h3*.4)+h1*6.28);',
    '    float d=L-r;',
    '    float s=mix(.0035,.011,h2);',
    '    float w=mix(.25,.9,h1)*smoothstep(-.2,1.,sin(A+h3*6.28+tt*(.15+.2*h2)));',
    '    I+=w*exp(-d*d/(s*s));',
    '  }',
    // broad glow band, mostly just outside the ring, much brighter on the upper left
    '  float side=pow(max(.5+.5*cos(A-2.25),0.),1.6);',
    '  float dIn=(L-base)/.12, dOut=(L-base)/.26;',
    '  float band=L<base?exp(-dIn*dIn):exp(-dOut*dOut);',
    '  float halo=band*(.4+1.4*side);',
    '  float outer=L>base?exp(-((L-base)/.8)*((L-base)/.8))*(.16+.42*side):0.;',
    '  vec3 hc=hue(A);',
    '  vec3 col=hc*(halo+outer)+mix(hc,vec3(1.),.7)*I*.85;',
    '  col=1.-exp(-col*1.35);',
    // dark centre, darker than the page, fading out toward the ring
    '  float dark=smoothstep(base-.02,base-.32,L)*.3;',
    '  float a=clamp(max(max(col.r,col.g),col.b),0.,1.);',
    '  a=max(a,dark);',
    '  vec2 uv=gl_FragCoord.xy/res;float e=ef>.5?smoothstep(0.,.14,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y))):smoothstep(0.,.25,1.-uv.y);',
    '  gl_FragColor=vec4(col*e,a*e);',
    '}'
  ].join('\n');

  function MaestroOrb(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['res', 't', 'R', 'm', 'pulse', 'cen', 'sq', 'ef'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

    var scale = opts.scale || .3, speed = opts.speed == null ? 1 : opts.speed, sq = opts.squash || 1, cen = opts.center || [.5, .5], byW = opts.radiusBy === 'width';
    var mx = 0, my = 0, tmx = 0, tmy = 0, pulse = 0, raf = 0, visible = true, t0 = performance.now(), dpr = 1;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function draw(now) {
      var t = reduce ? 4 : (now - t0) / 1000 * speed;
      mx += (tmx - mx) * .06; my += (tmy - my) * .06; pulse *= .96;
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.t, t);
      gl.uniform1f(U.R, (byW ? canvas.width : Math.min(canvas.width, canvas.height)) * scale);
      gl.uniform2f(U.cen, canvas.width * cen[0], canvas.height * (1 - cen[1]));
      gl.uniform1f(U.sq, sq);
      gl.uniform1f(U.ef, byW ? 0. : 1.);
      gl.uniform2f(U.m, mx, my);
      gl.uniform1f(U.pulse, pulse);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) { draw(now); if (visible && !reduce) raf = requestAnimationFrame(loop); }
    function move(e) {
      var r = canvas.getBoundingClientRect(), R = Math.min(r.width, r.height) * scale;
      tmx = (e.clientX - r.left - r.width / 2) / R; tmy = -(e.clientY - r.top - r.height / 2) / R;
    }
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(loop); });
    io.observe(canvas);
    var ro = new ResizeObserver(function () { size(); draw(performance.now()); }); ro.observe(canvas);
    addEventListener('pointermove', move, { passive: true });
    size(); raf = requestAnimationFrame(loop);
    return {
      set: function (o) { if (o.scale != null) scale = o.scale; if (o.speed != null) speed = o.speed; if (o.pulse) pulse = 1; if (reduce) draw(performance.now()); },
      destroy: function () { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); removeEventListener('pointermove', move); }
    };
  }
  window.MaestroOrb = MaestroOrb;

  /* Soft dust drifting off the ring, plus faint far stars. MaestroDust(canvas, { scale, count, stars }) */
  function MaestroDust(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d'), dpr = 1, W = 0, H = 0, R = 0, parts = [], stars = [], raf = 0, visible = true, last = performance.now();
    var scale = opts.scale || .3, count = (opts.count || 140) * 1.6, nStars = opts.stars == null ? 120 : opts.stars, sq = opts.squash || 1, cen = opts.center || [.5, .5], byW = opts.radiusBy === 'width';
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cols = [[255, 240, 221], [254, 215, 172], [253, 211, 197], [223, 189, 206], [200, 196, 245]];
    var sprite = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; }());
    var tinted = cols.map(function (c) { var t = document.createElement('canvas'); t.width = t.height = 64; var g = t.getContext('2d'); g.drawImage(sprite, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(' + c + ')'; g.fillRect(0, 0, 64, 64); return t; });
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function spawn(p, fresh) {
      var a = Math.random() * Math.PI * 2;
      // more dust leaves the bright upper-left side
      if (Math.random() < .45) a = rnd(1.3, 3.4);
      if (sq > 1) a = rnd(.12, Math.PI - .12);
      p.a = a; p.r = R * rnd(.92, 1.12); p.v = R * rnd(.02, .09); p.t = R * rnd(-.03, .03);
      p.life = rnd(5, 12); p.age = fresh ? rnd(0, p.life) : 0; p.s = rnd(.45, 1.25) * dpr;
      var k = (Math.cos(a - 2.3) + 1) / 2; p.c = k > .6 ? (Math.random() < .5 ? 0 : 1) : (Math.random() < .5 ? 3 : (Math.random() < .5 ? 2 : 4));
    }
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = canvas.width = Math.round(canvas.clientWidth * dpr); H = canvas.height = Math.round(canvas.clientHeight * dpr);
      R = (byW ? W : Math.min(W, H)) * scale;
      parts = []; for (var i = 0; i < count; i++) { var p = {}; spawn(p, true); parts.push(p); }
      stars = []; for (var j = 0; j < nStars; j++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: rnd(.4, 1.3) * dpr, a: rnd(.15, .6), tw: rnd(.3, 1.2), ph: rnd(0, 6.28) });
    }
    function draw(now) {
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      var cx = W * cen[0], cy = H * cen[1], t = now / 1000;
      stars.forEach(function (s) { ctx.globalAlpha = s.a * (.6 + .4 * Math.sin(t * s.tw + s.ph)); ctx.drawImage(tinted[0], s.x - s.s * 2, s.y - s.s * 2, s.s * 4, s.s * 4); });
      parts.forEach(function (p) {
        if (!reduce) { p.age += dt; p.r += p.v * dt; p.a += (p.t / p.r) * dt; if (p.age > p.life) spawn(p, false); }
        var k = p.age / p.life, al = Math.sin(Math.PI * k) * (1 - Math.max(0, (p.r - R) / (R * 1.4)));
        if (al <= 0) return;
        var x = cx + Math.cos(p.a) * p.r, y = cy - Math.sin(p.a) * p.r / sq, s = p.s * 4;
        ctx.globalAlpha = al * .55; ctx.drawImage(tinted[p.c], x - s / 2, y - s / 2, s, s);
      });
      ctx.globalAlpha = 1;
    }
    function loop(now) { draw(now); if (visible && !reduce) raf = requestAnimationFrame(loop); }
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; cancelAnimationFrame(raf); if (visible) { last = performance.now(); raf = requestAnimationFrame(loop); } });
    io.observe(canvas);
    var ro = new ResizeObserver(function () { size(); draw(performance.now()); }); ro.observe(canvas);
    size(); raf = requestAnimationFrame(loop);
    return { destroy: function () { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); } };
  }
  window.MaestroDust = MaestroDust;
}());
