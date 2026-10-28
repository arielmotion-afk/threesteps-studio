// Scene loading: every scene is pre-baked into one image (baked/<id>.png), so opening a page
// only decodes a picture; the lighting and animation stay live in the shader. If a baked file
// is missing, the scene is baked in the browser instead (slow, but it still works).
//
// Packed image: 640 x 1080, opaque, three bands of 360 rows:
//   rows   0–359  bake R G B
//   rows 360–719  aux R G B
//   rows 720–1079 bake A, aux A, 0
// (Opaque bands, because browsers premultiply alpha when encoding and would ruin the data.)

// Which pages can follow each page in the story, for prefetching.
const NEXT = {
  guest_room_dusk: ["stairs_dark"],
  stairs_dark: ["reading_room"],
  reading_room: ["parlor_evening"],
  parlor_evening: ["parlor_fork"],
  parlor_fork: ["rival_room", "garden_night", "kitchen"],
  kitchen: ["parlor_fork"],
  rival_room: ["niece_room"],
  garden_night: ["niece_room"],
  niece_room: ["forest_night"],
  forest_night: ["folly_midnight"],
  folly_midnight: ["lawn_sunrise"],
  lawn_sunrise: [],
};

function packBake({ w, h, bake, aux }) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h * 3;
  const g = c.getContext("2d"), img = g.createImageData(w, h * 3), d = img.data, n = w * h;
  for (let i = 0; i < n; i++) {
    const s = i * 4;
    d[s] = bake[s]; d[s + 1] = bake[s + 1]; d[s + 2] = bake[s + 2]; d[s + 3] = 255;
    const m = (n + i) * 4; d[m] = aux[s]; d[m + 1] = aux[s + 1]; d[m + 2] = aux[s + 2]; d[m + 3] = 255;
    const l = (2 * n + i) * 4; d[l] = bake[s + 3]; d[l + 1] = aux[s + 3]; d[l + 2] = 0; d[l + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function unpackBake(d, w, h) {
  const n = w * h, bake = new Uint8Array(n * 4), aux = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const s = i * 4, m = (n + i) * 4, l = (2 * n + i) * 4;
    bake[s] = d[s]; bake[s + 1] = d[s + 1]; bake[s + 2] = d[s + 2]; bake[s + 3] = d[l];
    aux[s] = d[m]; aux[s + 1] = d[m + 1]; aux[s + 2] = d[m + 2]; aux[s + 3] = d[l + 1];
  }
  return { w, h, bake, aux };
}

// A fingerprint of the code that bakes a scene; the bake page records it in baked/manifest.json
// so a scene whose code changed since baking is rebuilt live instead of showing stale art.
// (It covers the scene's own bake code, not the shared helpers.)
function bakeKey(scene) {
  let h = 2166136261;
  const src = scene.bakeSrc || scene.bake.toString();
  for (let i = 0; i < src.length; i++) h = Math.imul(h ^ src.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}
let manifest = null;
const getManifest = (base) => (manifest ??= fetch(`${base}manifest.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

// Image scenes (scene.art): the picture is loaded before baking, from art/ next to baked/.
const artCache = new Map();
function loadArt(scene, base = "baked/") {
  if (!scene.art) return Promise.resolve();
  const url = base.replace(/baked\/$/, "art/") + scene.art;
  if (!artCache.has(url)) artCache.set(url, new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; }));
  return artCache.get(url).then((im) => { scene.artImage = im; });
}
// Bake an image scene on a w x h grid: the picture, scaled smoothly to the grid, goes into the bake
// RGB; fn(x, y, [r, g, b], o) (x, y in the 1280 x 720 frame, colours 0..255) sets o.A (bake alpha)
// and o.r, o.g, o.b, o.a (aux), all 0..1.
function bakeArt(scene, fn, w = 640, h = 360) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(scene.artImage, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, bake = new Uint8Array(w * h * 4), aux = new Uint8Array(w * h * 4), o = {};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    o.A = 0; o.r = 0; o.g = 0; o.b = 0; o.a = 0;
    fn(((x + 0.5) * RW) / w, ((y + 0.5) * RH) / h, [d[i], d[i + 1], d[i + 2]], o);
    bake[i] = d[i]; bake[i + 1] = d[i + 1]; bake[i + 2] = d[i + 2]; bake[i + 3] = clamp(o.A) * 255;
    aux[i] = clamp(o.r) * 255; aux[i + 1] = clamp(o.g) * 255; aux[i + 2] = clamp(o.b) * 255; aux[i + 3] = clamp(o.a) * 255;
  }
  return { w, h, bake, aux };
}

const sceneCache = new Map();
// Load a scene's baked data (cached). Resolves to { w, h, bake, aux, from: "file" | "baked" }.
function loadScene(scene, base = "baked/") {
  if (sceneCache.has(scene.id)) return sceneCache.get(scene.id);
  const p = getManifest(base)
    .then((m) => { if (m[scene.id] !== bakeKey(scene)) throw new Error("stale"); return fetch(`${base}${scene.id}.png?k=${m[scene.id]}`); })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
    .then((b) => createImageBitmap(b, { premultiplyAlpha: "none", colorSpaceConversion: "none" }))
    .then((bmp) => {
      const w = bmp.width, h = bmp.height / 3;
      const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(bmp, 0, 0);
      return { ...unpackBake(g.getImageData(0, 0, bmp.width, bmp.height).data, w, h), from: "file" };
    })
    .catch((e) => loadArt(scene, base).then(() => new Promise((res) => setTimeout(() => { console.warn(`${scene.id}: baking live (${e.message}); re-run bake.html`); res({ ...scene.bake(), from: "baked live" }); }, 0))));
  sceneCache.set(scene.id, p);
  return p;
}
