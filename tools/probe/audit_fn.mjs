// Các hàm chạy TRONG TRANG để soát hình học thành phố.
/** Gom tam giác của cả thành phố vào window.__tri (mảng số phẳng) + lưới băm 3D. */
export function collect() {
  const root = window.__game.city.root; root.updateMatrixWorld(true);
  const meshes = [], P = [], M = [], COL = [];
  root.traverse((m) => {
    if (!m.isMesh || !m.geometry || !m.geometry.attributes.position) return;
    if (m.name === 'festive' || m.name === 'roadblock') return;
    const g = m.geometry, pos = g.attributes.position.array, col = g.attributes.color ? g.attributes.color.array : null, idx = g.index ? g.index.array : null;
    const mi = meshes.length; meshes.push({ kind: m.name, chunk: m.parent ? m.parent.name : '' });
    const nT = (idx ? idx.length : pos.length / 3) / 3;
    for (let t = 0; t < nT; t++) {
      const a = idx ? idx[t * 3] : t * 3, b = idx ? idx[t * 3 + 1] : t * 3 + 1, c = idx ? idx[t * 3 + 2] : t * 3 + 2;
      P.push(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2], pos[c * 3], pos[c * 3 + 1], pos[c * 3 + 2]);
      M.push(mi);
      if (col) COL.push((col[a * 3] + col[b * 3] + col[c * 3]) / 3, (col[a * 3 + 1] + col[b * 3 + 1] + col[c * 3 + 1]) / 3, (col[a * 3 + 2] + col[b * 3 + 2] + col[c * 3 + 2]) / 3); else COL.push(1, 1, 1);
    }
  });
  const T = { P: new Float32Array(P), M: new Uint16Array(M), COL: new Float32Array(COL), meshes, n: M.length };
  window.__tri = T;
  const byKind = {}; for (let i = 0; i < T.n; i++) { const k = meshes[T.M[i]].kind; byKind[k] = (byKind[k] || 0) + 1; }
  return { tris: T.n, meshes: meshes.length, byKind };
}

/** Tìm các cặp mặt đồng phẳng, cùng hướng, chồng lên nhau mà khác màu/khác vật liệu (nguồn gốc nhấp nháy). */
export function coplanar(opt) {
  const T = window.__tri, P = T.P, tol = opt.tol ?? 0.004, minArea = opt.minArea ?? 0.02, CELL = 2;
  const kinds = T.meshes.map((m) => m.kind);
  const skipKind = new Set(opt.skipKinds || []);
  // phân loại theo trục
  const AX = new Int8Array(T.n).fill(-1), SG = new Int8Array(T.n), D = new Float32Array(T.n);
  const buckets = new Map();
  for (let i = 0; i < T.n; i++) {
    if (skipKind.has(kinds[T.M[i]])) continue;
    const o = i * 9, ax = P[o], ay = P[o + 1], az = P[o + 2], bx = P[o + 3], by = P[o + 4], bz = P[o + 5], cx = P[o + 6], cy = P[o + 7], cz = P[o + 8];
    let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay), ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az), nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const l = Math.hypot(nx, ny, nz); if (l < 0.004) continue; nx /= l; ny /= l; nz /= l;
    let axis = -1, s = 0;
    if (Math.abs(nx) > 0.9995) { axis = 0; s = Math.sign(nx); } else if (Math.abs(ny) > 0.9995) { axis = 1; s = Math.sign(ny); } else if (Math.abs(nz) > 0.9995) { axis = 2; s = Math.sign(nz); }
    if (axis < 0) continue;
    AX[i] = axis; SG[i] = s; D[i] = P[o + axis];
    const key = axis + ':' + s + ':' + Math.round(D[i] / tol);
    let arr = buckets.get(key); if (!arr) buckets.set(key, arr = []); arr.push(i);
  }
  const uv = (i, k) => { const o = i * 9 + k * 3, a = AX[i]; return a === 0 ? [P[o + 2], P[o + 1]] : a === 1 ? [P[o], P[o + 2]] : [P[o], P[o + 1]]; };
  const area = (poly) => { let s = 0; for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]; s += x0 * y1 - x1 * y0; } return s / 2; };
  const clip = (subj, cl) => {            // Sutherland–Hodgman, cl ngược chiều kim đồng hồ
    let out = subj;
    for (let i = 0; i < cl.length && out.length; i++) {
      const [ax, ay] = cl[i], [bx, by] = cl[(i + 1) % cl.length], inp = out; out = [];
      const side = (p) => (bx - ax) * (p[1] - ay) - (by - ay) * (p[0] - ax);
      for (let j = 0; j < inp.length; j++) {
        const p = inp[j], q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q);
        if (sp >= 0) out.push(p);
        if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
      }
    }
    return out;
  };
  const found = new Map(); let pairs = 0;
  const seen = new Set();
  for (const [key, arr] of buckets) {
    const [a, s, q] = key.split(':'); const nb = buckets.get(a + ':' + s + ':' + (+q + 1));
    const all = nb ? arr.concat(nb) : arr; if (all.length < 2) continue;
    const grid = new Map();
    const polys = new Map();
    for (const i of all) {
      let p = [uv(i, 0), uv(i, 1), uv(i, 2)]; if (area(p) < 0) p = [p[0], p[2], p[1]]; polys.set(i, p);
      const x0 = Math.min(p[0][0], p[1][0], p[2][0]), x1 = Math.max(p[0][0], p[1][0], p[2][0]), y0 = Math.min(p[0][1], p[1][1], p[2][1]), y1 = Math.max(p[0][1], p[1][1], p[2][1]);
      if ((x1 - x0) * (y1 - y0) > 4000) { const k = 'big'; let g = grid.get(k); if (!g) grid.set(k, g = []); g.push(i); continue; }
      for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) for (let gy = Math.floor(y0 / CELL); gy <= Math.floor(y1 / CELL); gy++) { const k = gx + ',' + gy; let g = grid.get(k); if (!g) grid.set(k, g = []); g.push(i); }
    }
    const big = grid.get('big') || [];
    for (const [k, cell] of grid) {
      const list = k === 'big' ? cell : cell.concat(big);
      for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
        const i = list[x], j = list[y]; if (i === j) continue;
        if (Math.abs(D[i] - D[j]) > tol) continue;
        const mi = T.M[i], mj = T.M[j], ki = kinds[mi], kj = kinds[mj];
        const dc = Math.abs(T.COL[i * 3] - T.COL[j * 3]) + Math.abs(T.COL[i * 3 + 1] - T.COL[j * 3 + 1]) + Math.abs(T.COL[i * 3 + 2] - T.COL[j * 3 + 2]);
        const sameMat = ki === kj || ((ki === 'lit' || ki === 'detail') && (kj === 'lit' || kj === 'detail'));
        if (sameMat && dc < (opt.minColor ?? 0.04)) continue;
        const pk = i < j ? i * 4194304 + j : j * 4194304 + i; if (seen.has(pk)) continue; seen.add(pk);
        const ov = clip(polys.get(i), polys.get(j)); if (ov.length < 3) continue;
        const ar = Math.abs(area(ov)); if (ar < minArea) continue;
        pairs++;
        const cu = ov.reduce((s, p) => s + p[0], 0) / ov.length, cv = ov.reduce((s, p) => s + p[1], 0) / ov.length, d = D[i];
        const pos = AX[i] === 0 ? [d, cv, cu] : AX[i] === 1 ? [cu, d, cv] : [cu, cv, d];
        const gk = [T.meshes[mi].chunk, ki, T.meshes[mj].chunk, kj, 'xyz'[AX[i]] + (SG[i] > 0 ? '+' : '-')].join('|') + '|' + Math.round(pos[0] / 6) + ',' + Math.round(pos[2] / 6);
        let f = found.get(gk); if (!f) found.set(gk, f = { key: gk, area: 0, n: 0, pos: pos.map((v) => +v.toFixed(2)), gap: +Math.abs(D[i] - D[j]).toFixed(4), ci: [...T.COL.slice(i * 3, i * 3 + 3)].map((v) => +v.toFixed(2)), cj: [...T.COL.slice(j * 3, j * 3 + 3)].map((v) => +v.toFixed(2)), ymin: 1e9, ymax: -1e9 });
        f.area += ar; f.n++; f.ymin = Math.min(f.ymin, pos[1]); f.ymax = Math.max(f.ymax, pos[1]);
      }
    }
  }
  const list = [...found.values()].sort((a, b) => b.area - a.area);
  window.__cop = list;
  return { pairs, groups: list.length, totalArea: +list.reduce((s, f) => s + f.area, 0).toFixed(1) };
}

/** Dựng lưới băm 3D cho việc bắn tia (bỏ mặt đất, vạch kẻ, biển). */
export function buildGrid() {
  const T = window.__tri, P = T.P, CELL = 2, grid = new Map(), kinds = T.meshes.map((m) => m.kind);
  const key = (x, y, z) => (x + 600) + (z + 600) * 1200 + (y + 8) * 1440000;
  for (let i = 0; i < T.n; i++) {
    const k = kinds[T.M[i]]; if (k === 'sign' || k === 'marks' || k.startsWith('ground')) continue;
    const o = i * 9;
    const x0 = Math.floor(Math.min(P[o], P[o + 3], P[o + 6]) / CELL), x1 = Math.floor(Math.max(P[o], P[o + 3], P[o + 6]) / CELL);
    const y0 = Math.floor(Math.min(P[o + 1], P[o + 4], P[o + 7]) / CELL), y1 = Math.floor(Math.max(P[o + 1], P[o + 4], P[o + 7]) / CELL);
    const z0 = Math.floor(Math.min(P[o + 2], P[o + 5], P[o + 8]) / CELL), z1 = Math.floor(Math.max(P[o + 2], P[o + 5], P[o + 8]) / CELL);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) * (z1 - z0 + 1) > 4000) continue;     // tấm quá lớn (hiếm) — bỏ
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const kk = key(x, y, z); let a = grid.get(kk); if (!a) grid.set(kk, a = []); a.push(i); }
  }
  window.__grid = { grid, key, CELL };
  /** Bắn tia: trả về { t, tri } gần nhất trong [tmin, tmax], hoặc null. Tính cả hai mặt nếu both. */
  window.__ray = (ox, oy, oz, dx, dy, dz, tmax, both = false, tmin = 0.001) => {
    const seenT = new Set(); let best = null;
    const step = CELL * 0.5, n = Math.ceil(tmax / step);
    const cells = new Set();
    for (let s = 0; s <= n; s++) { const t = Math.min(tmax, s * step); const cx = Math.floor((ox + dx * t) / CELL), cy = Math.floor((oy + dy * t) / CELL), cz = Math.floor((oz + dz * t) / CELL); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) cells.add(key(cx + a, cy + b, cz + c)); }
    for (const kk of cells) { const arr = grid.get(kk); if (!arr) continue; for (const i of arr) {
      if (seenT.has(i)) continue; seenT.add(i);
      const o = i * 9, ax = P[o], ay = P[o + 1], az = P[o + 2], e1x = P[o + 3] - ax, e1y = P[o + 4] - ay, e1z = P[o + 5] - az, e2x = P[o + 6] - ax, e2y = P[o + 7] - ay, e2z = P[o + 8] - az;
      const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz;
      if (both ? Math.abs(det) < 1e-9 : det < 1e-9) continue;          // det > 0: tia đi vào mặt trước
      const inv = 1 / det, tx = ox - ax, ty = oy - ay, tz = oz - az, u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue;
      const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, v = (dx * qx + dy * qy + dz * qz) * inv; if (v < 0 || u + v > 1) continue;
      const t = (e2x * qx + e2y * qy + e2z * qz) * inv; if (t < tmin || t > tmax) continue;
      if (!best || t < best.t) best = { t, tri: i };
    } }
    return best;
  };
  return { cells: grid.size };
}

/** Liệt kê biển hiệu và mức bị che: theo pháp tuyến (vật chắn ngay trước mặt) và từ 3 vị trí người xem dưới đường. */
export function signs(opt = {}) {
  const T = window.__tri, P = T.P, ray = window.__ray, out = [];
  const kinds = T.meshes.map((m) => m.kind);
  for (let i = 0; i + 1 < T.n; i++) {
    if (kinds[T.M[i]] !== 'sign' || T.M[i + 1] !== T.M[i]) continue;
    // một biển = 2 tam giác liên tiếp (a,b,c) (a,c,d)
    const o = i * 9, a = [P[o], P[o + 1], P[o + 2]], b = [P[o + 3], P[o + 4], P[o + 5]], c = [P[o + 6], P[o + 7], P[o + 8]], d = [P[o + 15], P[o + 16], P[o + 17]];
    i++;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const w = Math.hypot(ux, uy, uz), h = Math.hypot(vx, vy, vz);
    if (w * h < (opt.minArea ?? 0.25)) continue;                          // bỏ nhãn giá, bảng nhỏ
    const cen = [a[0] + ux / 2 + vx / 2, a[1] + uy / 2 + vy / 2, a[2] + uz / 2 + vz / 2];
    const pts = []; for (const fu of [0.08, 0.3, 0.5, 0.7, 0.92]) for (const fv of [0.15, 0.5, 0.85]) pts.push([a[0] + ux * fu + vx * fv, a[1] + uy * fu + vy * fv, a[2] + uz * fu + vz * fv]);
    let bn = 0, minT = 1e9; const hitKinds = {};
    for (const p of pts) { const hit = ray(p[0] + nx * 0.004, p[1] + ny * 0.004, p[2] + nz * 0.004, nx, ny, nz, opt.front ?? 3, true); if (hit) { bn++; minT = Math.min(minT, hit.t); const m = T.meshes[T.M[hit.tri]]; hitKinds[m.kind] = (hitKinds[m.kind] || 0) + 1; } }
    // người xem: cách 9 m phía trước, mắt cao 1,6 m; thẳng mặt và lệch ±35°
    const views = []; const hl = Math.hypot(nx, nz) || 1, fx = nx / hl, fz = nz / hl, sx = -fz, sz = fx;
    for (const ang of [0, -35, 35]) { const r = ang * Math.PI / 180, dist = opt.dist ?? 9; const ex = cen[0] + (fx * Math.cos(r) + sx * Math.sin(r)) * dist, ez = cen[2] + (fz * Math.cos(r) + sz * Math.sin(r)) * dist, ey = 1.6;
      let blocked = 0; for (const p of pts) { const dx = ex - p[0], dy = ey - p[1], dz = ez - p[2], L = Math.hypot(dx, dy, dz); const hit = ray(p[0] + nx * 0.004, p[1] + ny * 0.004, p[2] + nz * 0.004, dx / L, dy / L, dz / L, L - 0.3, true); if (hit) blocked++; }
      views.push(Math.round(blocked / pts.length * 100)); }
    // có gì nằm SÁT PHÍA SAU không (biển lơ lửng thì không cần), và khoảng hở tới mặt sau
    const back = ray(cen[0] + nx * 0.004, cen[1] + ny * 0.004, cen[2] + nz * 0.004, -nx, -ny, -nz, 0.5, true);
    out.push({ pos: cen.map((v) => +v.toFixed(2)), n: [+nx.toFixed(2), +ny.toFixed(2), +nz.toFixed(2)], w: +w.toFixed(2), h: +h.toFixed(2), chunk: T.meshes[T.M[i]].chunk, front: Math.round(bn / pts.length * 100), minT: bn ? +minT.toFixed(3) : null, hitKinds, views, backGap: back ? +back.t.toFixed(4) : null });
  }
  window.__signs = out;
  return { signs: out.length, frontBlocked: out.filter((s) => s.front > 0).length, viewBlocked: out.filter((s) => s.views[0] > 0).length, sideBlocked: out.filter((s) => Math.max(s.views[1], s.views[2]) > 30).length };
}
