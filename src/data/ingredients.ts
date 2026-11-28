// NGUYÊN LIỆU — thêm dòng mới vào bảng RAW là có ngay nguyên liệu mới (nhớ thêm vào một cửa hàng trong shops.ts).
// Cột: id, tên, nhóm, đơn vị, giá gốc (₫/đơn vị), kg/đơn vị, hạn dùng (giờ, ở nhiệt độ thường), cần giữ lạnh,
//      hình dạng 3D, màu chính, màu phụ, tác dụng khi ăn trực tiếp {h: đói, t: khát, m: tinh thần, hp: sức khoẻ, st: thể lực}.
export type Cat = 'meat' | 'seafood' | 'veg' | 'starch' | 'spice' | 'drink' | 'special' | 'other';
export type Shape = 'round' | 'long' | 'leafy' | 'head' | 'slab' | 'bird' | 'fish' | 'shrimp' | 'crab' | 'squid' | 'shell' | 'balls' | 'bag' | 'nest'
  | 'bottle' | 'jar' | 'can' | 'carton' | 'box' | 'egg' | 'block' | 'mushroom' | 'stack' | 'roll' | 'cubes' | 'coal' | 'gascan' | 'loaf' | 'corn'
  // Bánh sẵn của lượt 54 — mỗi loại một hình riêng, không dùng chung 'round'/'long' nữa:
  | 'baguette' | 'sesame' | 'choux'
  // Lượt 70b: khoai lang và xúc xích cũng tách khỏi 'long' — trước đây cả hai là MỘT khúc trụ tròn
  // y hệt củ cà rốt/cây sả nên nhìn không ra con gì.
  | 'sweetpotato' | 'sausage';
export interface Eat { h?: number; t?: number; m?: number; hp?: number; /** hồi thanh thể lực (thang 0–1, 0,3 = đầy thêm 30 %) */ st?: number; }
export interface IngDef {
  id: string; name: string; cat: Cat; unit: string; price: number; kg: number; shelf: number; cold: boolean;
  shape: Shape; c: number; c2: number; eat?: Eat;
}
export const CAT_NAME: Record<Cat, string> = { meat: 'Thịt', seafood: 'Hải sản', veg: 'Rau củ', starch: 'Tinh bột', spice: 'Gia vị', drink: 'Đồ uống', special: 'Đặc biệt', other: 'Khác' };

type Row = [string, string, Cat, string, number, number, number, 0 | 1, Shape, number, number?, Eat?];
const F = 99999; // không hỏng
const RAW: Row[] = [
  // ── Thịt (đơn vị lạng = 100 g)
  // Lượt 41b: người chơi xin "tăng thời gian thịt hỏng, ít nhất 1–2 ngày".
  // Thịt tươi phải giữ lạnh nên hỏng nhanh gấp 2,6 lần rau củ; con số dưới đây chọn sao cho ĐỂ TRONG QUẦY KHÔNG TỦ
  // vẫn được đúng 2 ngày (heo/bò 48 giờ, gà vịt 44 giờ, hải sản 40 giờ) — trước đây chỉ 3,5–5 giờ.
  // Có tủ đá/tủ đông thì lâu hơn nhiều lần; nắng gắt vẫn hao nhanh hơn.
  ['heo', 'Thịt heo nạc', 'meat', 'lạng', 13000, 0.1, 140, 1, 'slab', 0xe58a8a, 0xf7ddd0],
  ['bachi', 'Ba chỉ', 'meat', 'lạng', 15000, 0.1, 140, 1, 'slab', 0xdf7a78, 0xfbeadf],
  ['suon', 'Sườn heo', 'meat', 'lạng', 17000, 0.1, 140, 1, 'slab', 0xd66f6a, 0xf3e6d2],
  ['bo', 'Thịt bò', 'meat', 'lạng', 26000, 0.1, 140, 1, 'slab', 0xb23a3a, 0xe9cdbf],
  ['ga', 'Thịt gà', 'meat', 'lạng', 9000, 0.1, 128, 1, 'bird', 0xf2d2a9, 0xe9b98a],
  ['vit', 'Thịt vịt', 'meat', 'lạng', 9500, 0.1, 128, 1, 'bird', 0xe6c090, 0xd9a673],
  // Đồ nguội chế biến sẵn (xúc xích, giò, chả, đậu hũ) cũng ×2 hạn dùng — để trong quầy đỡ mất oan.
  ['xucxich', 'Xúc xích', 'meat', 'cây', 5000, 0.05, 120, 1, 'sausage', 0xc8523e, 0xa83c2c],
  ['gio', 'Giò lụa', 'meat', 'lạng', 18000, 0.1, 80, 1, 'roll', 0xf0e2cf, 0x4f8a3f],
  ['pate', 'Pa-tê', 'meat', 'hộp', 25000, 0.2, 96, 1, 'can', 0x9a6a4e, 0xe9c23a],
  // ── Hải sản
  ['tom', 'Tôm', 'seafood', 'lạng', 22000, 0.1, 116, 1, 'shrimp', 0xf08a5a, 0xf7c4a0],
  ['cua', 'Cua đồng', 'seafood', 'con', 32000, 0.3, 116, 1, 'crab', 0xc8442c, 0xe8825a],
  ['muc', 'Mực', 'seafood', 'lạng', 24000, 0.1, 116, 1, 'squid', 0xf3e6e0, 0xd9a0b0],
  ['ca', 'Cá phi lê', 'seafood', 'lạng', 11000, 0.1, 116, 1, 'fish', 0x9fb8c8, 0xe9eef2],
  ['ngheu', 'Nghêu', 'seafood', 'lạng', 5000, 0.1, 116, 1, 'shell', 0xe9dcc0, 0xc9b28a],
  ['so', 'Sò điệp', 'seafood', 'lạng', 12000, 0.1, 116, 1, 'shell', 0xd9a88a, 0xf3d9c0],
  ['cavien', 'Cá viên', 'seafood', 'lạng', 9000, 0.1, 72, 1, 'balls', 0xf0e6d0, 0xe2c9a0],
  ['chaca', 'Chả cá', 'seafood', 'lạng', 12000, 0.1, 60, 1, 'block', 0xe0b070, 0xc98f4a],
  // ── Rau củ
  // Lượt 41: rau củ bán ở chợ để được lâu gấp 3–3,5 lần (người chơi xin tăng 200–300 %).
  // Giữ nguyên khoai tây / khoai lang / hành tây / tỏi / gừng / sả — nhóm này vốn đã rất bền.
  ['carot', 'Cà rốt', 'veg', 'củ', 3000, 0.12, 360, 0, 'long', 0xf0802a, 0x4f9a3f],
  ['khoaitay', 'Khoai tây', 'veg', 'củ', 4000, 0.15, 300, 0, 'round', 0xc9a36a, 0xb08a52],
  ['khoailang', 'Khoai lang', 'veg', 'củ', 5000, 0.2, 300, 0, 'sweetpotato', 0xa8527a, 0xe8973a],
  ['hanhtay', 'Hành tây', 'veg', 'củ', 4000, 0.15, 300, 0, 'round', 0xe9d7b0, 0xc9a86a],
  ['toi', 'Tỏi', 'veg', 'củ', 3000, 0.04, 600, 0, 'round', 0xf3efe6, 0xd9cdb8],
  ['cachua', 'Cà chua', 'veg', 'quả', 3000, 0.1, 216, 0, 'round', 0xe23b2e, 0x4f9a3f],
  ['bapcai', 'Bắp cải', 'veg', 'cây', 12000, 0.8, 360, 0, 'head', 0xb9d98a, 0xe6f0c0],
  ['raumuong', 'Rau muống', 'veg', 'bó', 6000, 0.3, 105, 0, 'leafy', 0x3f9a3f, 0x6fbf5a],
  ['dualeo', 'Dưa leo', 'veg', 'quả', 3000, 0.15, 216, 0, 'long', 0x4f9a3f, 0x3a7a2f],
  ['ot', 'Ớt', 'veg', 'trái', 1000, 0.01, 360, 0, 'long', 0xd92b1e, 0x3f8a2f],
  ['chanh', 'Chanh', 'veg', 'quả', 2000, 0.05, 450, 0, 'round', 0x7fbf3f, 0x5f9f2f],
  ['rauthom', 'Rau thơm', 'veg', 'bó', 4000, 0.1, 84, 0, 'leafy', 0x4fae4f, 0x7fd06a],
  ['hanhla', 'Hành lá', 'veg', 'bó', 3000, 0.1, 126, 0, 'leafy', 0x5fb85a, 0xf3f3e6],
  ['gia', 'Giá đỗ', 'veg', 'bịch', 4000, 0.2, 84, 0, 'nest', 0xf5f2e2, 0xe6dfc0],
  ['bap', 'Bắp', 'veg', 'trái', 5000, 0.25, 216, 0, 'corn', 0xf5d040, 0x8fc060],
  ['xalach', 'Xà lách', 'veg', 'cây', 6000, 0.2, 105, 0, 'head', 0x8fd06a, 0xc9eca0],
  ['xoai', 'Xoài xanh', 'veg', 'quả', 9000, 0.3, 140, 0, 'round', 0xc8d96a, 0xa8bf4a, { h: 8, m: 1 }],
  ['chuoi', 'Chuối', 'veg', 'nải', 8000, 0.4, 210, 0, 'long', 0xf5d94a, 0xd9b83a, { h: 12, t: 3, m: 2 }],
  ['gung', 'Gừng', 'veg', 'củ', 3000, 0.05, 600, 0, 'round', 0xd9b870, 0xc09a52],
  ['sa', 'Sả', 'veg', 'cây', 1500, 0.03, 200, 0, 'long', 0xc9d98a, 0xf0eccf],
  // ── Tinh bột
  ['gao', 'Gạo', 'starch', 'kg', 18000, 1, F, 0, 'bag', 0xf3f0e6, 0x2f8fd5],
  ['nep', 'Gạo nếp', 'starch', 'kg', 26000, 1, F, 0, 'bag', 0xf7f3ea, 0xd9463c],
  ['mi', 'Mì vàng', 'starch', 'vắt', 2500, 0.08, 2000, 0, 'nest', 0xf2cf5a, 0xe0b53a],
  // Bánh phở & bún tươi cũng tăng 100% thời gian để hỏng (30 → 60 giờ, 26 → 52 giờ) — đồng bộ với bánh mì.
  ['banhpho', 'Bánh phở', 'starch', 'kg', 16000, 1, 60, 0, 'nest', 0xf7f3ea, 0xe9e2d0],
  ['bun', 'Bún tươi', 'starch', 'kg', 12000, 1, 52, 0, 'nest', 0xfaf7f0, 0xece6d6],
  // Bánh mì nay để được 44 giờ (22 × 2): mua chiều nay, sáng mai vẫn bán được — trước đây qua một ngày là bỏ.
  ['banhmi', 'Bánh mì', 'starch', 'ổ', 3500, 0.1, 44, 0, 'loaf', 0xd9a05a, 0xf0d9a0, { h: 26, m: 1 }],
  // ── Bánh bán sẵn ở Tiệm bánh Anh Bảo (lượt 54). Người chơi: “bánh no và vui vẻ tuỳ giá” —
  // cột tác dụng đặt theo đúng giá gốc: cứ 1.000₫ ≈ 1,6 no và 0,5 vui (làm tròn). Nhờ vậy bánh đắt
  // thật sự no hơn và vui hơn, không phải cùng một ổ bánh mà gắn giá khác. Vui cộng thêm phần “món
  // quà tuổi thơ” cho hai món vặt, để món rẻ vẫn có chỗ đứng chứ không chỉ là bản thu nhỏ của món đắt.
  ['banhmique', 'Bánh mì que pa-tê', 'starch', 'cây', 5000, 0.05, 30, 0, 'baguette', 0xc98a4a, 0xf3dcb0, { h: 8, m: 3 }],
  ['banhtieu', 'Bánh tiêu', 'starch', 'cái', 7000, 0.06, 26, 0, 'sesame', 0xd99b3c, 0xfaf3dc, { h: 11, m: 4 }],
  ['banhbao', 'Bánh bao nhân thịt', 'starch', 'cái', 12000, 0.15, 30, 0, 'round', 0xf7f3ea, 0xe9dcc0, { h: 19, m: 6 }],
  ['banhsu', 'Bánh su kem', 'starch', 'cái', 15000, 0.08, 24, 1, 'choux', 0xdb9b52, 0xfaf0dc, { h: 24, m: 8 }],
  ['banhbonglan', 'Bánh bông lan', 'starch', 'ổ', 25000, 0.25, 40, 0, 'round', 0xf3d98a, 0xe9c46a, { h: 40, m: 13 }],
  ['botmi', 'Bột mì', 'starch', 'kg', 17000, 1, F, 0, 'bag', 0xf0ead8, 0xf0a92e],
  ['banhtrang', 'Bánh tráng', 'starch', 'xấp', 15000, 0.3, F, 0, 'stack', 0xf3ead0, 0xe0d2a8],
  // ── Gia vị
  ['muoi', 'Muối', 'spice', 'gói', 5000, 0.5, F, 0, 'bag', 0xf7f7f7, 0x5f8fd0],
  ['duong', 'Đường', 'spice', 'kg', 22000, 1, F, 0, 'bag', 0xfaf5e8, 0x3fae5a],
  ['tieu', 'Tiêu xay', 'spice', 'hũ', 15000, 0.1, F, 0, 'jar', 0x4a4038, 0xc8523e],
  ['nuocmam', 'Nước mắm', 'spice', 'chai', 30000, 0.7, F, 0, 'bottle', 0x9a5a22, 0xd92b1e],
  ['nuoctuong', 'Nước tương', 'spice', 'chai', 18000, 0.6, F, 0, 'bottle', 0x2a1a12, 0xe9c23a],
  ['tuongot', 'Tương ớt', 'spice', 'chai', 15000, 0.5, F, 0, 'bottle', 0xd9361e, 0x3fae5a],
  ['dauan', 'Dầu ăn', 'spice', 'chai', 45000, 1, F, 0, 'bottle', 0xf0c83a, 0xf7e08a],
  ['giam', 'Giấm', 'spice', 'chai', 12000, 0.6, F, 0, 'bottle', 0xf0ecd0, 0x8fbf5a],
  ['giavipho', 'Gia vị phở', 'spice', 'gói', 12000, 0.05, F, 0, 'box', 0x8a5a3a, 0xe9c23a],
  // ── Đồ uống
  ['nuocloc', 'Nước suối', 'drink', 'chai', 5000, 0.5, F, 0, 'bottle', 0xa8dcf2, 0x2f8fd5, { t: 40 }],
  ['tra', 'Trà khô', 'drink', 'gói', 20000, 0.2, F, 0, 'box', 0x4f7a3f, 0xe9c23a],
  ['caphe', 'Cà phê bột', 'drink', 'gói', 45000, 0.25, F, 0, 'bag', 0x5a3a26, 0xd9a05a],
  ['suatuoi', 'Sữa tươi', 'drink', 'hộp', 32000, 1, 96, 1, 'carton', 0xf7f7ff, 0x2f8fd5],
  ['suadac', 'Sữa đặc', 'drink', 'lon', 24000, 0.4, F, 0, 'can', 0xf3ead0, 0x2f6fb5],
  ['nuocngot', 'Nước ngọt', 'drink', 'lon', 8000, 0.35, F, 0, 'can', 0xd9261e, 0xf7f7f7, { t: 30, m: 3 }],
  // Nước tăng lực nhãn Shapi (lượt 54): +30 % thanh thể lực uống là có liền, 9.000₫/lon — lon rẻ nhất trong quầy,
  // nên uống được nhiều, và vẫn đỡ khát như nước ngọt. Muốn chạy dai thì phải trả tiền.
  ['shapi', 'Nước tăng lực Shapi', 'drink', 'lon', 9000, 0.35, F, 0, 'can', 0xf5c531, 0xd9261e, { t: 30, m: 4, st: 0.3 }],
  ['cam', 'Cam', 'drink', 'quả', 6000, 0.2, 200, 0, 'round', 0xf59a2a, 0xe07f1a, { t: 15, h: 6, m: 1 }],
  // Lượt 69: cây mía — bán theo cây ở sạp củ quả và ở vựa đầu mối. Ép một ly cần khoảng 1/4 cây.
  // Để được lâu như củ quả nên không cần tủ lạnh; ăn sống thì chỉ đỡ khát chứ không no.
  ['mia', 'Cây mía', 'drink', 'cây', 12000, 1.2, 480, 0, 'long', 0x9fb84a, 0x7a9a2f, { t: 8 }],
  ['da', 'Đá viên', 'drink', 'bịch', 5000, 1, 9, 1, 'cubes', 0xd0ecf7, 0xffffff],
  // ── Đặc biệt
  ['phomai', 'Phô mai', 'special', 'gói', 60000, 0.2, 300, 1, 'block', 0xf7c83a, 0xf0a92e],
  ['bolat', 'Bơ lạt', 'special', 'khối', 45000, 0.2, 300, 1, 'block', 0xf7e08a, 0xe9c23a],
  ['trungca', 'Trứng cá', 'special', 'hũ', 120000, 0.1, 150, 1, 'jar', 0xf0702a, 0x2a2a2e],
  ['nam', 'Nấm rơm', 'special', 'hộp', 14000, 0.2, 48, 1, 'mushroom', 0xe9dcc8, 0xb09a80],
  ['trung', 'Trứng gà', 'special', 'quả', 3000, 0.06, 300, 0, 'egg', 0xf0d9b8, 0xe6c49a],
  ['dauhu', 'Đậu hũ', 'special', 'miếng', 4000, 0.2, 72, 1, 'block', 0xfaf5e6, 0xece2c8],
  ['dauxanh', 'Đậu xanh', 'special', 'kg', 42000, 1, F, 0, 'bag', 0xe2e6b0, 0x4f9a3f],
  ['nuocdua', 'Nước cốt dừa', 'special', 'lon', 20000, 0.4, F, 0, 'can', 0xf7f7f0, 0x3fae5a],
  ['tranchau', 'Trân châu', 'special', 'gói', 30000, 0.5, F, 0, 'bag', 0x2a1a12, 0xe86f9a],
  ['dauphong', 'Đậu phộng rang', 'special', 'gói', 12000, 0.2, F, 0, 'bag', 0xd9a06a, 0xb5653c],
  // ── Nhiên liệu & khác
  ['than', 'Than củi', 'other', 'bao', 15000, 2, F, 0, 'coal', 0x2a2a2e, 0x8a5a3a],
  ['gas', 'Bình gas mini', 'other', 'bình', 25000, 0.4, F, 0, 'gascan', 0xd9361e, 0xf7f7f7],
  ['thuoc', 'Thuốc cảm', 'other', 'vỉ', 15000, 0.02, F, 0, 'box', 0xffffff, 0x2f8fd5, { hp: 30 }],
];

export const INGS: Record<string, IngDef> = {};
export const ING_LIST: IngDef[] = RAW.map(([id, name, cat, unit, price, kg, shelf, cold, shape, c, c2, eat]) =>
  (INGS[id] = { id, name, cat, unit, price, kg, shelf: shelf < 9000 ? Math.round(shelf * 1.2 * 10) / 10 : shelf, cold: !!cold, shape, c, c2: c2 ?? c, eat }));
