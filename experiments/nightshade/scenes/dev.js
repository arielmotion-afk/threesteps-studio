// Dev helpers for the scene pages (sketch tooling only): call after a page has `stage` and `grab`.
// Dev helper: try mobile cameras for several scenes and post a contact sheet to the frame sink.
// tries: [[id, cam, overrides?], ...]
window.trySheet = async (tries, name) => {
  const cols = Math.min(4, tries.length), rows = Math.ceil(tries.length / cols), sh = document.createElement("canvas");
  sh.width = cols * 360; sh.height = rows * 640;
  const g = sh.getContext("2d"), cv = document.getElementById("stage");
  g.imageSmoothingEnabled = false; g.fillStyle = "#000"; g.fillRect(0, 0, sh.width, sh.height);
  for (let k = 0; k < tries.length; k++) {
    const [id, cam, extra] = tries[k], m = mobile(SCENES.find((s) => s.id === id), { ...(cam ? { cam } : {}), ...(extra || {}) });
    m.id = id + "_try" + Math.floor(Math.random() * 1e6);
    stage.show(m, m.bake(), { instant: true }); stage.drawAt(6);
    g.drawImage(cv, (k % cols) * 360, Math.floor(k / cols) * 640, 360, 640);
    g.fillStyle = "#ff0"; g.font = "14px monospace"; g.fillText(id, (k % cols) * 360 + 6, Math.floor(k / cols) * 640 + 16);
  }
  const b = await new Promise((r) => sh.toBlob(r));
  return (await fetch("http://127.0.0.1:8124/" + name, { method: "POST", body: b })).status;
};

// Dev helper: a contact sheet of existing scenes (by id), baked live, posted to the frame sink.
window.showSheet = async (ids, name, t = 6) => {
  const scenes = ids.map((id) => SCENES.find((s) => s.id === id)).filter(Boolean), [tw, th] = scenes[0].frame ? [360, 640] : [640, 360];
  const cols = Math.min(5, scenes.length), rows = Math.ceil(scenes.length / cols), sh = document.createElement("canvas");
  sh.width = cols * tw; sh.height = rows * th;
  const g = sh.getContext("2d"), cv = document.getElementById("stage");
  g.imageSmoothingEnabled = false;
  for (let k = 0; k < scenes.length; k++) {
    const s = scenes[k], data = await loadScene(s, location.pathname.includes("/ui/") ? "../scenes/baked/" : "baked/");
    stage.show(s, data, { instant: true }); stage.drawAt(t);
    g.drawImage(cv, (k % cols) * tw, Math.floor(k / cols) * th, tw, th);
    g.fillStyle = "#ff0"; g.font = "14px monospace"; g.fillText(s.id, (k % cols) * tw + 6, Math.floor(k / cols) * th + 16);
  }
  const b = await new Promise((r) => sh.toBlob(r));
  return (await fetch("http://127.0.0.1:8124/" + name, { method: "POST", body: b })).status;
};
