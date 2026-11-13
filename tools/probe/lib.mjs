// Các bước dùng chung cho kịch bản thử nghiệm.
export const boot = { waitFor: () => !!(window.__game && document.querySelector('#menu [data-m=new]')), timeout: 60000 };
/** Vào ván mới, tắt hội thoại mở đầu, tắt tự hạ đồ hoạ, định nghĩa __fast và __proj. */
export const fresh = (min = 9 * 60) => ({ eval: (min) => {
  const g0 = window.__game; g0.newGame('anh'); g0.ui.closeDialog(); g0.mode = 'play'; g0.set.auto = false; g0.g.min = min;
  window.__fast = (on) => { g0.city.root.visible = !on; g0.renderer.setPixelRatio(on ? 0.3 : 1); return on; };
  window.__proj = (v) => { const q = g0.camera.position.clone().set(v.x, v.y, v.z).project(g0.camera); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; };
  return g0.mode; }, args: [min] });
/** Ván mới có sẵn tiền, đồ nghề, nguyên liệu và quầy đặt ở cổng công viên. */
export const rich = { eval: () => {
  const g0 = window.__game, g = g0.g, R = window.__R; g.cash = 3000000;
  for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi', 'chao']) R.buyGear(g, id);
  for (const [id, n] of [['banhtrang', 10], ['dauphong', 6], ['rauthom', 6], ['tuongot', 6], ['chanh', 6], ['bap', 10], ['hanhla', 6], ['dauan', 6], ['muoi', 6], ['khoailang', 10], ['tra', 8], ['da', 12], ['than', 3]]) window.__give(id, n, 'store');
  const sp = (g0.world.spots || []).find((s) => s.id === 'cv'); return { cash: g.cash, gear: Object.keys(g.gear), tier: g.stall.tier, hasSpot: !!sp };
} };
