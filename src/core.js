const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const vertex = /* glsl */ `
precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
uniform float uPixel;
attribute vec3 position;
attribute float aSeed;
varying float vGlow;
varying float vDepth;
varying float vFade;
${NOISE}
void main(){
  vec3 p = position;
  vec3 n = normalize(position);
  float t = uTime * 0.22;
  float wave = snoise(n * 1.6 + vec3(t, t * 0.6, -t));
  float fine = snoise(n * 5.0 + vec3(-t * 1.4));
  float pull = smoothstep(0.0, 1.0, 1.0 - distance(n.xy, uMouse * 0.9));
  float disp = wave * 0.38 + fine * 0.06 + pull * 0.25;
  p += n * disp;
  p += n * uScroll * (1.6 + aSeed * 2.4);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = (1.2 + aSeed * 1.6 + max(wave, 0.0) * 2.2) * uPixel;
  gl_PointSize = size * (7.5 / -mv.z);
  vGlow = smoothstep(-0.2, 0.9, wave);
  vDepth = smoothstep(-3.0, 2.5, mv.z + 9.0);
  vFade = 1.0 - uScroll * 0.7;
}
`;

const fragment = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 uIon;
uniform vec3 uBlue;
uniform vec3 uWhite;
varying float vGlow;
varying float vDepth;
varying float vFade;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  vec3 col = mix(uBlue, uIon, vGlow);
  col = mix(col, uWhite, pow(vGlow, 6.0) * 0.6);
  float alpha = a * (0.38 + vGlow * 0.8) * (0.4 + vDepth * 0.6) * vFade;
  gl_FragColor = vec4(col, alpha);
}
`;

// Shader colours are written to the canvas as-is, so pass them in linear sRGB.
function linear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [16, 8, 0].map((shift) => {
    const c = ((n >> shift) & 255) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
}

function sphere(count, radius) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const jitter = 1 + (Math.random() - 0.5) * 0.04;
    pos[i * 3] = Math.cos(th) * r * radius * jitter;
    pos[i * 3 + 1] = y * radius * jitter;
    pos[i * 3 + 2] = Math.sin(th) * r * radius * jitter;
    seed[i] = Math.random();
  }
  return { pos, seed, count };
}

function ring(count, radius) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const spread = (Math.random() - 0.5) * 0.18;
    pos[i * 3] = Math.cos(a) * (radius + spread);
    pos[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
    pos[i * 3 + 2] = Math.sin(a) * (radius + spread);
    seed[i] = Math.random() * 0.5;
  }
  return { pos, seed, count };
}

// Column-major 4x4 matrices, same conventions as three.js (Euler order XYZ).
function compose(px, py, pz, rx, ry, rz, s) {
  const a = Math.cos(rx), b = Math.sin(rx);
  const c = Math.cos(ry), d = Math.sin(ry);
  const e = Math.cos(rz), f = Math.sin(rz);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  return new Float32Array([
    c * e * s, (af + be * d) * s, (bf - ae * d) * s, 0,
    -c * f * s, (ae - bf * d) * s, (be + af * d) * s, 0,
    d * s, -b * c * s, a * c * s, 0,
    px, py, pz, 1,
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan((fov * Math.PI) / 360);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "shader");
  return shader;
}

export function initCore(canvas, { still = false } = {}) {
  const attrs = { alpha: true, antialias: false, depth: false, premultipliedAlpha: true, powerPreference: "high-performance" };
  let gl = canvas.getContext("webgl", { ...attrs, failIfMajorPerformanceCaveat: true });
  if (!gl) {
    // Software WebGL renders every frame on the main thread; draw one still frame instead.
    gl = canvas.getContext("webgl", attrs);
    still = true;
  }
  if (!gl) return null;

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "program");
  gl.useProgram(program);

  const u = {};
  ["modelViewMatrix", "projectionMatrix", "uTime", "uScroll", "uMouse", "uPixel", "uIon", "uBlue", "uWhite"].forEach((name) => {
    u[name] = gl.getUniformLocation(program, name);
  });
  const aPosition = gl.getAttribLocation(program, "position");
  const aSeed = gl.getAttribLocation(program, "aSeed");

  const buffer = (data) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  };
  const upload = ({ pos, seed, count }) => ({ pos: buffer(pos), seed: buffer(seed), count });

  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const small = window.innerWidth < 760;
  const core = upload(sphere(small ? 9000 : 24000, 2.15));
  const orbit = upload(ring(small ? 900 : 1800, 3.3));

  gl.uniform1f(u.uPixel, dpr);
  gl.uniform3fv(u.uIon, linear("#c6ff3a"));
  gl.uniform3fv(u.uBlue, linear("#4d6bff"));
  gl.uniform3fv(u.uWhite, [1, 1, 1]);
  gl.enableVertexAttribArray(aPosition);
  gl.enableVertexAttribArray(aSeed);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  const view = compose(0, 0, -9, 0, 0, 0, 1);
  const group = { x: 0, y: 0, scale: 1, rx: 0, rz: 0 };
  let coreY = 0;
  let orbitY = 0;
  let time = 0;
  let scroll = 0;
  const mouse = [0, 0];
  const target = [0, 0];

  if (!still) {
    window.addEventListener("pointermove", (e) => {
      target[0] = (e.clientX / window.innerWidth) * 2 - 1;
      target[1] = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(u.projectionMatrix, false, perspective(35, w / h, 0.1, 100));
    // On narrow or portrait canvases a side-offset sphere falls outside the frustum, so stack it above the copy.
    const stacked = w < 980 || w / h < 1.1;
    const rtl = document.documentElement.dir === "rtl";
    group.x = stacked ? 0 : (rtl ? -1 : 1) * 2.1;
    group.y = stacked ? 1.4 : 0.25;
    group.scale = stacked ? 0.82 : 1;
    if (still) frame();
  };

  let lost = false;
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
  });

  const draw = (mesh, model) => {
    gl.uniformMatrix4fv(u.modelViewMatrix, false, multiply(view, model));
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.seed);
    gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, mesh.count);
  };

  function frame() {
    if (lost) return;
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uScroll, scroll);
    gl.uniform2f(u.uMouse, mouse[0], mouse[1]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const world = compose(group.x, group.y, 0, group.rx, 0, group.rz, group.scale);
    draw(core, multiply(world, compose(0, 0, 0, 0, coreY, 0, 1)));
    draw(orbit, multiply(world, compose(0, 0, 0, 1.15, orbitY, 0.35, 1)));
  }

  new ResizeObserver(resize).observe(canvas);
  document.addEventListener("erst:lang", resize);
  resize();

  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);

  let last = performance.now();
  const tick = (now) => {
    if (lost) return;
    requestAnimationFrame(tick);
    if (!visible || document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    mouse[0] += (target[0] - mouse[0]) * 0.05;
    mouse[1] += (target[1] - mouse[1]) * 0.05;
    coreY += dt * 0.08;
    orbitY -= dt * 0.12;
    group.rx += (target[1] * 0.18 - group.rx) * 0.04;
    group.rz += (-target[0] * 0.08 - group.rz) * 0.04;
    frame();
  };
  if (!still) requestAnimationFrame(tick);

  return {
    setScroll(p) {
      scroll = p;
    },
  };
}
