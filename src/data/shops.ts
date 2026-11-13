// NHÀ CUNG CẤP — mỗi cửa hàng là một không gian thật trong thành phố; hàng bày ở các "ô" để người chơi tự tay lấy.
// priceMul: hệ số giá so với giá gốc. fresh: độ tươi lúc mua [thấp, cao]. q: chất lượng hàng (0–1).
// haggle: độ dễ mặc cả (0 = không). bulk: số đơn vị mỗi lần lấy. cold: tủ lạnh/tủ mát của cửa hàng (ô phải mở cửa tủ).
export interface ShopDef {
  id: string; name: string; vendor: string; vendorLook: number; open: [number, number]; priceMul: number; fresh: [number, number]; q: number;
  haggle: number; bulk?: number; card?: boolean; items: string[]; coldFrom?: number; lateSale?: boolean; say: string;
}
export const SHOP_LIST: ShopDef[] = [
  { id: 'm_rau', name: 'Sạp rau Cô Bảy', vendor: 'Cô Bảy', vendorLook: 4, open: [5, 18], priceMul: 1, fresh: [88, 100], q: 0.92, haggle: 0.6, lateSale: true,
    items: ['cachua', 'bapcai', 'raumuong', 'dualeo', 'ot', 'chanh', 'rauthom', 'hanhla', 'gia', 'xalach'], say: 'Rau mới hái sáng nay đó con!' },
  { id: 'm_cu', name: 'Sạp củ quả Chú Mười', vendor: 'Chú Mười', vendorLook: 7, open: [5, 18], priceMul: 1, fresh: [90, 100], q: 0.9, haggle: 0.5, lateSale: true,
    items: ['carot', 'khoaitay', 'khoailang', 'hanhtay', 'toi', 'gung', 'sa', 'bap', 'cam'], say: 'Củ quả Đà Lạt, lựa đi con.' },
  { id: 'm_thit', name: 'Sạp thịt Anh Tư', vendor: 'Anh Tư', vendorLook: 0, open: [5, 17], priceMul: 1, fresh: [86, 100], q: 0.93, haggle: 0.35, lateSale: true,
    items: ['heo', 'bachi', 'suon', 'bo', 'ga', 'vit'], say: 'Thịt nóng mới mổ, lấy gì em?' },
  { id: 'm_haisan', name: 'Hải sản Chị Năm', vendor: 'Chị Năm', vendorLook: 1, open: [5, 16], priceMul: 1, fresh: [84, 100], q: 0.92, haggle: 0.4, lateSale: true,
    items: ['tom', 'cua', 'muc', 'ca', 'ngheu', 'so'], say: 'Tôm cá còn nhảy tanh tách nè!' },
  { id: 'm_kho', name: 'Gạo – Bún Bà Hai', vendor: 'Bà Hai', vendorLook: 4, open: [5, 18], priceMul: 1, fresh: [92, 100], q: 0.9, haggle: 0.3,
    items: ['gao', 'nep', 'mi', 'banhpho', 'bun', 'botmi', 'banhtrang', 'dauxanh', 'dauphong'], say: 'Gạo thơm, bún mới ra lò nghen.' },
  { id: 'm_giavi', name: 'Gia vị Cô Út', vendor: 'Cô Út', vendorLook: 1, open: [5, 18], priceMul: 1, fresh: [100, 100], q: 0.9, haggle: 0.3,
    items: ['muoi', 'duong', 'tieu', 'nuocmam', 'nuoctuong', 'tuongot', 'dauan', 'giam', 'giavipho'], say: 'Mắm muối đủ cả, thiếu gì cứ hỏi.' },
  { id: 'm_trung', name: 'Trứng – Giò chả Dì Sáu', vendor: 'Dì Sáu', vendorLook: 4, open: [5, 18], priceMul: 1, fresh: [88, 100], q: 0.92, haggle: 0.45, lateSale: true,
    items: ['trung', 'dauhu', 'gio', 'chaca', 'nam'], say: 'Trứng gà ta, giò chả nhà làm.' },
  { id: 'mart', name: 'MiniMart 24h', vendor: 'Bé Na', vendorLook: 1, open: [6, 22.5], priceMul: 1.18, fresh: [90, 96], q: 0.96, haggle: 0, card: true, coldFrom: 14,
    items: ['nuocloc', 'nuocngot', 'tra', 'caphe', 'suadac', 'nuocdua', 'tranchau', 'duong', 'muoi', 'dauan', 'tuongot', 'nuoctuong', 'mi', 'botmi',
      'suatuoi', 'xucxich', 'cavien', 'pate', 'phomai', 'bolat', 'trungca', 'da'], say: 'Dạ, em chào anh chị ạ.' },
  { id: 'kiosk', name: 'Tạp hoá Cô Ba', vendor: 'Cô Ba', vendorLook: 4, open: [5.5, 23], priceMul: 1.12, fresh: [72, 90], q: 0.8, haggle: 0.2,
    items: ['trung', 'mi', 'nuocmam', 'duong', 'muoi', 'dauan', 'tuongot', 'da', 'nuocloc', 'nuocngot', 'than', 'gas'], say: 'Mua gì đó con? Thiếu thì cô ghi sổ.' },
  { id: 'bakery', name: 'Lò bánh mì Anh Bảo', vendor: 'Anh Bảo', vendorLook: 0, open: [5, 20], priceMul: 1, fresh: [90, 100], q: 0.95, haggle: 0,
    items: ['banhmi'], say: 'Bánh mì nóng giòn đây!' },
  { id: 'wholesale', name: 'Vựa đầu mối Tám Lúa', vendor: 'Chú Tám', vendorLook: 7, open: [3, 9], priceMul: 0.78, fresh: [85, 98], q: 0.86, haggle: 0.25, bulk: 10,
    items: ['gao', 'nep', 'duong', 'dauan', 'heo', 'ga', 'tom', 'bun', 'banhpho', 'da', 'than'], say: 'Bán sỉ thôi nghe, mười ký trở lên.' },
  { id: 'pharmacy', name: 'Nhà thuốc An Tâm', vendor: 'Cô Dược', vendorLook: 5, open: [7, 21], priceMul: 1, fresh: [100, 100], q: 1, haggle: 0, card: true,
    items: ['thuoc'], say: 'Em bị sao? Uống thuốc rồi nghỉ ngơi nhé.' },
];
export const SHOPS: Record<string, ShopDef> = Object.fromEntries(SHOP_LIST.map((s) => [s.id, s]));
