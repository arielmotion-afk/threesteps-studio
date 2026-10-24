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
  const src = scene.bake.toString();
  for (let i = 0; i < src.length; i++) h = Math.imul(h ^ src.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}
let manifest = null;
const getManifest = (base) => (manifest ??= fetch(`${base}manifest.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

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
    .catch((e) => new Promise((res) => setTimeout(() => { console.warn(`${scene.id}: baking live (${e.message}); re-run bake.html`); res({ ...scene.bake(), from: "baked live" }); }, 0)));
  sceneCache.set(scene.id, p);
  return p;
}
