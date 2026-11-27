// GIỜ MỞ CỬA của những nơi không phải sạp bán nguyên liệu (sạp có giờ riêng trong `data/shops.ts`).
// Tách ra `data/` để `src/sim` đọc được mà không phải import cả `game/npc.ts` (tệp đó kéo theo three/DOM).
// `game/npc.ts` vẫn re-export `PLACE_HOURS` + `placeOpen` như cũ nên mọi call site không phải sửa.
export const PLACE_HOURS: Record<string, [number, number]> = { equip: [7, 20], bank: [8, 17], eatery: [6, 21.5], pawn: [8, 21], scrap: [6, 19], scrap2: [6, 19], dock: [4.5, 10], motel: [0, 24], hotel: [0, 24], tro: [6, 22], shark: [9, 24], hobo: [0, 24],
  canho: [6, 22], nharieng: [6, 22], cuahang: [6, 21],
  cafe: [0, 24],
  police: [0, 24],
  hospital: [0, 24],
  // nhân vật phụ: mỗi người chỉ ở chỗ của mình trong một quãng giờ nhất định
  net: [6, 23], net_bi: [16, 22], net_nhung: [18, 22.5],
  dua: [14.5, 18], dua_mai: [14.5, 18], dua_thao: [14.5, 18],
  tra_da: [5.5, 22], rap: [14.5, 23], sua_xe: [7, 19], hat_rong: [9, 21], danh_co: [6.5, 18.5], danh_giay: [6, 19.5],
  hot_toc: [7, 19], thoi_trang: [7.5, 20],
  // Chú Ba xe ôm: sáng sớm ra gầm cầu đứng, tối về nhà — trùng giờ trong `sim/xeom.ts`.
  chu_ba: [5, 22.5],
  // Lượt 69: hai chỗ bán nước mía. Giờ ở đây phải khớp `MIA_CART_HOURS`/`MIA_SHOP_HOURS` trong `sim/rules.ts`
  // (test canh) — chợ họp sáng tới chiều tối, quán trên phố mở tới 21h.
  mia_xe: [6, 18.5], mia_quan: [7, 21] };
/** Nơi không ghi giờ thì coi như mở cả ngày (bảng tin việc làm, chùa, công viên…). */
export const placeHours = (id: string): [number, number] | undefined => PLACE_HOURS[id];
