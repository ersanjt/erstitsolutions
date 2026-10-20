import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";

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
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
uniform float uPixel;
attribute float aSeed;
varying float vGlow;
varying float vDepth;
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
  vGlow = smoothstep(-0.2, 0.9, wave) ;
  vDepth = smoothstep(-3.0, 2.5, mv.z + 9.0);
}
`;

const fragment = /* glsl */ `
uniform vec3 uIon;
uniform vec3 uBlue;
uniform vec3 uWhite;
uniform float uScroll;
varying float vGlow;
varying float vDepth;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  vec3 col = mix(uBlue, uIon, vGlow);
  col = mix(col, uWhite, pow(vGlow, 6.0) * 0.6);
  float alpha = a * (0.38 + vGlow * 0.8) * (0.4 + vDepth * 0.6) * (1.0 - uScroll * 0.7);
  gl_FragColor = vec4(col, alpha);
}
`;

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
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new BufferAttribute(seed, 1));
  return g;
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
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new BufferAttribute(seed, 1));
  return g;
}

export function initCore(canvas) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uMouse: { value: new Vector2(0, 0) },
    uPixel: { value: dpr },
    uIon: { value: new Color("#c6ff3a") },
    uBlue: { value: new Color("#4d6bff") },
    uWhite: { value: new Color("#ffffff") },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const small = window.innerWidth < 760;
  const group = new Group();
  const core = new Points(sphere(small ? 9000 : 24000, 2.15), material);
  const orbit = new Points(ring(small ? 900 : 1800, 3.3), material);
  orbit.rotation.x = 1.15;
  orbit.rotation.z = 0.35;
  group.add(core, orbit);
  scene.add(group);

  const target = new Vector2(0, 0);
  window.addEventListener("pointermove", (e) => {
    target.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const narrow = w < 980;
    const rtl = document.documentElement.dir === "rtl";
    group.position.set(narrow ? 0 : (rtl ? -1 : 1) * 2.1, narrow ? 1.4 : 0.25, 0);
    group.scale.setScalar(narrow ? 0.82 : 1);
  };
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener("erst:lang", resize);
  resize();

  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);

  let last = performance.now();
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    uniforms.uTime.value += dt;
    uniforms.uMouse.value.lerp(target, 0.05);
    core.rotation.y += dt * 0.08;
    orbit.rotation.y -= dt * 0.12;
    group.rotation.x += (target.y * 0.18 - group.rotation.x) * 0.04;
    group.rotation.z += (-target.x * 0.08 - group.rotation.z) * 0.04;
    renderer.render(scene, camera);
  };
  requestAnimationFrame(tick);

  return {
    setScroll(p) {
      uniforms.uScroll.value = p;
    },
  };
}
