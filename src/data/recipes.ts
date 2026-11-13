// CÔNG THỨC — dữ liệu thuần, thêm món mới bằng cách thêm một mục vào RECIPE_LIST.
// Mỗi món gồm: nguyên liệu cho MỘT phần, các bước SƠ CHẾ (làm theo mẻ, ra `batch` phần "cốt")
// và các bước HOÀN THIỆN (làm khi có khách gọi, mỗi lần ra `serve` phần).
// 5 cơ chế nấu: cut (cắt thái) · fry (xào/chiên) · grill (nướng) · boil (nấu/ninh) · assemble (trình bày).

export type Look = 'nest' | 'mound' | 'slices' | 'chunks' | 'greens' | 'liquid' | 'drizzle' | 'sprinkle' | 'whole' | 'ice' | 'egg' | 'balls' | 'sticks' | 'patty';
export type Vessel = 'bowl' | 'plate' | 'box' | 'bread' | 'cup' | 'glass' | 'paper' | 'bun' | 'roll';
export type RecipeCat = 'com' | 'bunpho' | 'mi' | 'banhmi' | 'burger' | 'nuong' | 'xien' | 'chien' | 'haisan' | 'goi' | 'anvat' | 'che' | 'nuoc';
export const CAT_LABEL: Record<RecipeCat, string> = {
  com: 'Cơm', bunpho: 'Phở & Bún', mi: 'Mì xào', banhmi: 'Bánh mì', burger: 'Hamburger', nuong: 'Đồ nướng', xien: 'Xiên que', chien: 'Đồ chiên',
  haisan: 'Hải sản', goi: 'Gỏi cuốn', anvat: 'Ăn vặt', che: 'Chè', nuoc: 'Đồ uống',
};

export interface CutStep { t: 'cut'; ing: string; n: number; style: 'lát' | 'khúc' | 'sợi' | 'hạt lựu' | 'băm'; }
export interface FryStep { t: 'fry'; ings: string[]; secs: number; heat: number; toss: number; mode: 'xào' | 'chiên' | 'ốp la'; label?: string; }
export interface GrillStep { t: 'grill'; ing: string; secs: number; look?: 'skewer' | 'slab' | 'whole'; label?: string; }
export interface BoilStep { t: 'boil'; adds: string[]; secs: number; skim: number; mode: 'ninh' | 'luộc' | 'pha' | 'cơm'; label?: string; col: number; }
export interface Layer { ing: string; look: Look; col?: number; name?: string; }
export interface AssembleStep { t: 'assemble'; layers: Layer[]; }
export type Step = CutStep | FryStep | GrillStep | BoilStep | AssembleStep;
export const STEP_NAME: Record<Step['t'], string> = { cut: 'Cắt thái', fry: 'Xào chiên', grill: 'Nướng', boil: 'Nấu', assemble: 'Trình bày' };
export const STEP_TOOLS: Record<Step['t'], string[]> = { cut: ['daothot'], fry: ['chao', 'bep'], grill: ['vi', 'bep'], boil: ['noi', 'bep'], assemble: [] };

export interface RecipeDef {
  id: string; name: string; short: string; cat: RecipeCat; vessel: Vessel;
  ref: number;            // giá phổ biến ngoài thị trường
  elastic: number;        // độ nhạy giá: càng cao khách càng dễ bỏ đi khi tăng giá
  batch: number;          // số phần mỗi mẻ sơ chế
  serve: number;          // số phần ra mỗi lần hoàn thiện
  hold: number;           // phút giữ được độ ngon sau khi sơ chế
  pack: number;           // chi phí bao bì mỗi phần
  ings: Record<string, number>;   // nguyên liệu cho 1 phần
  fin: string[];          // nguyên liệu dùng ở bước hoàn thiện (còn lại dùng lúc sơ chế)
  prep: Step[]; finish: Step[];
  hot: number;            // +1 món nóng (hợp trời lạnh/mưa), -1 món mát (hợp trời nóng)
  meal: [number, number, number, number]; // độ hợp: sáng, trưa, chiều tối, khuya/ăn vặt
  fill: number;           // độ no (0–60)
  learn?: { from: string; cost: number; skill: number };  // học từ ai, giá bao nhiêu, cần tay nghề mấy
  desc: string;
}

const cut = (ing: string, style: CutStep['style'], n = 6): CutStep => ({ t: 'cut', ing, n, style });
const fry = (ings: string[], secs: number, mode: FryStep['mode'] = 'xào', toss = 3, heat = 0.68, label?: string): FryStep => ({ t: 'fry', ings, secs, heat, toss, mode, label });
const grill = (ing: string, secs = 9, look: GrillStep['look'] = 'whole', label?: string): GrillStep => ({ t: 'grill', ing, secs, look, label });
const boil = (adds: string[], secs: number, mode: BoilStep['mode'], col: number, skim = 0, label?: string): BoilStep => ({ t: 'boil', adds, secs, skim, mode, col, label });
const L = (ing: string, look: Look, col?: number, name?: string): Layer => ({ ing, look, col, name });
const asm = (...layers: Layer[]): AssembleStep => ({ t: 'assemble', layers });
const BROTH = 0xd9a85a, BROTH_RED = 0xd9603a, TEA = 0xb86a2a, COFFEE = 0x4a2a16, RICE = 0xfaf7f0;

export const RECIPE_LIST: RecipeDef[] = [
  // ───────── Khởi nghiệp: gần như không cần vốn ─────────
  { id: 'banh_trang_tron', name: 'Bánh tráng trộn', short: 'B.tráng trộn', cat: 'anvat', vessel: 'box', ref: 15000, elastic: 1.5, batch: 8, serve: 1, hold: 600, pack: 800,
    ings: { banhtrang: 0.15, dauphong: 0.1, rauthom: 0.1, tuongot: 0.03, chanh: 0.25 }, fin: ['dauphong', 'tuongot', 'chanh'],
    prep: [cut('banhtrang', 'sợi', 7), cut('rauthom', 'khúc', 5)],
    finish: [asm(L('banhtrang', 'nest', 0xf0dfb0), L('tuongot', 'drizzle'), L('dauphong', 'sprinkle'), L('rauthom', 'greens'), L('chanh', 'drizzle', 0xd9ec8a))],
    hot: 0, meal: [0.2, 0.6, 1, 1], fill: 22, desc: 'Món ăn vặt học trò, chỉ cần dao thớt.' },
  { id: 'bap_nuong', name: 'Bắp nướng mỡ hành', short: 'Bắp nướng', cat: 'nuong', vessel: 'paper', ref: 15000, elastic: 1.3, batch: 8, serve: 3, hold: 500, pack: 300,
    ings: { bap: 1, hanhla: 0.12, dauan: 0.01, muoi: 0.01 }, fin: ['bap', 'dauan', 'muoi'],
    prep: [cut('hanhla', 'khúc', 6)], finish: [grill('bap', 10, 'whole')],
    hot: 1, meal: [0.3, 0.4, 1, 1], fill: 28, desc: 'Thơm lừng góc phố những chiều mưa.' },
  { id: 'khoai_nuong', name: 'Khoai lang nướng', short: 'Khoai nướng', cat: 'nuong', vessel: 'paper', ref: 12000, elastic: 1.3, batch: 1, serve: 3, hold: 0, pack: 300,
    ings: { khoailang: 1 }, fin: ['khoailang'], prep: [], finish: [grill('khoailang', 11, 'whole')],
    hot: 1, meal: [0.6, 0.3, 0.9, 1], fill: 30, desc: 'Ngọt bùi, nướng than hồng.' },
  { id: 'tra_da', name: 'Trà đá', short: 'Trà đá', cat: 'nuoc', vessel: 'glass', ref: 5000, elastic: 2.2, batch: 12, serve: 1, hold: 480, pack: 300,
    ings: { tra: 0.04, da: 0.12 }, fin: ['da'],
    prep: [boil(['tra'], 14, 'pha', TEA, 0, 'Pha trà')], finish: [asm(L('da', 'ice'), L('@tra', 'liquid', TEA, 'Trà'))],
    hot: -1, meal: [0.6, 1, 0.8, 0.8], fill: 0, desc: 'Ly trà mát lạnh giá bình dân.' },
  // ───────── Bánh mì ─────────
  { id: 'banh_mi_trung', name: 'Bánh mì trứng ốp la', short: 'B.mì trứng', cat: 'banhmi', vessel: 'bread', ref: 17000, elastic: 1.4, batch: 8, serve: 1, hold: 360, pack: 500,
    ings: { banhmi: 1, trung: 1, dualeo: 0.2, rauthom: 0.08, tuongot: 0.02, dauan: 0.02, nuoctuong: 0.01 }, fin: ['banhmi', 'trung', 'tuongot', 'dauan', 'nuoctuong'],
    prep: [cut('dualeo', 'lát', 7), cut('rauthom', 'khúc', 4)],
    finish: [fry(['trung'], 9, 'ốp la', 1, 0.6), asm(L('@trung', 'egg', 0xfff3d0, 'Trứng'), L('dualeo', 'slices'), L('rauthom', 'greens'), L('tuongot', 'drizzle'))],
    hot: 0.3, meal: [1, 0.5, 0.5, 0.6], fill: 40, learn: { from: 'bakery', cost: 30000, skill: 0 }, desc: 'Bữa sáng nhanh gọn của dân lao động.' },
  { id: 'banh_mi_thit', name: 'Bánh mì thịt nướng', short: 'B.mì thịt', cat: 'banhmi', vessel: 'bread', ref: 22000, elastic: 1.3, batch: 8, serve: 2, hold: 300, pack: 500,
    ings: { banhmi: 1, heo: 0.5, dualeo: 0.2, rauthom: 0.08, pate: 0.04, tuongot: 0.02, nuocmam: 0.01, duong: 0.005, toi: 0.08 }, fin: ['banhmi', 'pate', 'tuongot'],
    prep: [cut('heo', 'lát', 7), cut('toi', 'băm', 8), cut('dualeo', 'lát', 7)],
    finish: [grill('heo', 8, 'skewer'), asm(L('pate', 'drizzle', 0x9a6a4e), L('@thit', 'slices', 0xa8552e, 'Thịt nướng'), L('dualeo', 'slices'), L('rauthom', 'greens'), L('tuongot', 'drizzle'))],
    hot: 0.3, meal: [1, 0.7, 0.6, 0.6], fill: 46, learn: { from: 'bakery', cost: 80000, skill: 1 }, desc: 'Thịt nướng thơm, pa-tê béo, dưa leo giòn.' },
  // ───────── Xiên & chiên ─────────
  { id: 'xien_nuong', name: 'Xiên que nướng', short: 'Xiên nướng', cat: 'xien', vessel: 'paper', ref: 10000, elastic: 1.6, batch: 10, serve: 4, hold: 400, pack: 300,
    ings: { cavien: 0.3, xucxich: 0.5, tuongot: 0.02 }, fin: ['tuongot'],
    prep: [cut('xucxich', 'khúc', 6)], finish: [grill('cavien', 7, 'skewer')],
    hot: 0.4, meal: [0.2, 0.5, 1, 1], fill: 18, learn: { from: 'm_thit', cost: 40000, skill: 0 }, desc: 'Cá viên, xúc xích xiên que — học sinh mê tít.' },
  { id: 'xuc_xich_nuong', name: 'Xúc xích nướng', short: 'Xúc xích', cat: 'xien', vessel: 'paper', ref: 12000, elastic: 1.5, batch: 1, serve: 4, hold: 0, pack: 300,
    ings: { xucxich: 1, tuongot: 0.02 }, fin: ['xucxich', 'tuongot'], prep: [], finish: [grill('xucxich', 6, 'whole')],
    hot: 0.3, meal: [0.3, 0.5, 1, 1], fill: 20, learn: { from: 'm_thit', cost: 30000, skill: 0 }, desc: 'Nướng căng bóng, chấm tương ớt.' },
  { id: 'ca_vien_chien', name: 'Cá viên chiên', short: 'Cá viên chiên', cat: 'chien', vessel: 'cup', ref: 15000, elastic: 1.5, batch: 1, serve: 2, hold: 0, pack: 500,
    ings: { cavien: 0.7, dauan: 0.04, tuongot: 0.03 }, fin: ['cavien', 'dauan', 'tuongot'], prep: [], finish: [fry(['cavien'], 10, 'chiên', 2, 0.75)],
    hot: 0.3, meal: [0.2, 0.5, 1, 1], fill: 24, learn: { from: 'mart', cost: 40000, skill: 0 }, desc: 'Vàng giòn, nóng hổi.' },
  { id: 'khoai_tay_chien', name: 'Khoai tây chiên', short: 'Khoai chiên', cat: 'chien', vessel: 'cup', ref: 20000, elastic: 1.4, batch: 6, serve: 2, hold: 400, pack: 500,
    ings: { khoaitay: 1.5, dauan: 0.06, muoi: 0.01, tuongot: 0.03 }, fin: ['dauan', 'muoi', 'tuongot'],
    prep: [cut('khoaitay', 'sợi', 8)], finish: [fry(['khoaitay'], 11, 'chiên', 2, 0.78)],
    hot: 0.2, meal: [0.2, 0.5, 1, 0.9], fill: 28, learn: { from: 'mart', cost: 50000, skill: 1 }, desc: 'Giòn rụm, rắc chút muối.' },
  // ───────── Cơm ─────────
  { id: 'com_chien_trung', name: 'Cơm chiên trứng', short: 'Cơm chiên', cat: 'com', vessel: 'plate', ref: 25000, elastic: 1.2, batch: 8, serve: 1, hold: 300, pack: 1000,
    ings: { gao: 0.14, trung: 1, carot: 0.2, hanhla: 0.12, dauan: 0.03, nuocmam: 0.015, toi: 0.08 }, fin: ['trung', 'dauan', 'nuocmam'],
    prep: [boil(['gao'], 16, 'cơm', RICE, 0, 'Nấu cơm'), cut('carot', 'hạt lựu', 8), cut('hanhla', 'khúc', 6), cut('toi', 'băm', 6)],
    finish: [fry(['gao', 'trung', 'carot', 'hanhla'], 12, 'xào', 4, 0.72)],
    hot: 0.4, meal: [0.5, 1, 0.9, 0.6], fill: 52, learn: { from: 'eatery', cost: 80000, skill: 1 }, desc: 'Hạt cơm tơi vàng, thơm tỏi phi.' },
  { id: 'com_suon', name: 'Cơm tấm sườn nướng', short: 'Cơm sườn', cat: 'com', vessel: 'plate', ref: 40000, elastic: 1.1, batch: 8, serve: 2, hold: 300, pack: 1000,
    ings: { gao: 0.15, suon: 1.0, dualeo: 0.25, cachua: 0.25, nuocmam: 0.03, duong: 0.01, toi: 0.08, hanhla: 0.1, dauan: 0.01 }, fin: ['nuocmam'],
    prep: [boil(['gao'], 16, 'cơm', RICE, 0, 'Nấu cơm'), cut('toi', 'băm', 6), cut('dualeo', 'lát', 7), cut('cachua', 'lát', 6), cut('hanhla', 'khúc', 6)],
    finish: [grill('suon', 10, 'slab'), asm(L('@com', 'mound', RICE, 'Cơm'), L('@suon', 'whole', 0xa8502a, 'Sườn'), L('dualeo', 'slices'), L('cachua', 'slices'), L('hanhla', 'greens'), L('nuocmam', 'drizzle', 0xc97a2a))],
    hot: 0.4, meal: [0.8, 1, 0.9, 0.5], fill: 58, learn: { from: 'eatery', cost: 150000, skill: 2 }, desc: 'Sườn ướp mật nướng than — linh hồn Sài Gòn.' },
  { id: 'com_thit_kho', name: 'Cơm thịt kho trứng', short: 'Cơm thịt kho', cat: 'com', vessel: 'plate', ref: 32000, elastic: 1.1, batch: 8, serve: 1, hold: 360, pack: 1000,
    ings: { gao: 0.15, bachi: 0.6, trung: 1, nuocmam: 0.03, duong: 0.015, nuocdua: 0.08, toi: 0.06, raumuong: 0.15 }, fin: [],
    prep: [boil(['gao'], 16, 'cơm', RICE, 0, 'Nấu cơm'), cut('bachi', 'khúc', 7), boil(['bachi', 'duong', 'nuocmam', 'nuocdua', 'trung'], 24, 'ninh', 0x9a5a2a, 2, 'Kho thịt'), fry(['raumuong', 'toi'], 9, 'xào', 3, 0.8, 'Xào rau')],
    finish: [asm(L('@com', 'mound', RICE, 'Cơm'), L('@thitkho', 'chunks', 0x9a5a2a, 'Thịt kho'), L('@trungkho', 'balls', 0xc98a4a, 'Trứng'), L('@rau', 'greens', 0x3f8a3a, 'Rau xào'))],
    hot: 0.4, meal: [0.5, 1, 0.9, 0.3], fill: 60, learn: { from: 'eatery', cost: 120000, skill: 2 }, desc: 'Cơm nhà mẹ nấu, béo ngậy nước cốt dừa.' },
  // ───────── Phở & bún ─────────
  { id: 'pho_bo', name: 'Phở bò', short: 'Phở bò', cat: 'bunpho', vessel: 'bowl', ref: 40000, elastic: 1.0, batch: 8, serve: 1, hold: 420, pack: 1200,
    ings: { banhpho: 0.2, bo: 0.6, hanhtay: 0.2, gung: 0.15, giavipho: 0.15, nuocmam: 0.03, hanhla: 0.1, rauthom: 0.08, chanh: 0.25 }, fin: ['banhpho', 'rauthom', 'chanh'],
    prep: [boil(['gung', 'hanhtay', 'giavipho', 'nuocmam'], 26, 'ninh', BROTH, 3, 'Ninh nước dùng'), cut('bo', 'lát', 8), cut('hanhla', 'khúc', 6)],
    finish: [asm(L('banhpho', 'nest', 0xf7f3ea), L('bo', 'slices', 0xc86a5a), L('@nuocdung', 'liquid', BROTH, 'Nước dùng'), L('hanhla', 'greens'), L('rauthom', 'greens'))],
    hot: 1, meal: [1, 0.8, 0.8, 0.7], fill: 55, learn: { from: 'eatery', cost: 250000, skill: 3 }, desc: 'Nước dùng trong, ngọt xương, thơm quế hồi.' },
  { id: 'bun_rieu', name: 'Bún riêu cua', short: 'Bún riêu', cat: 'bunpho', vessel: 'bowl', ref: 35000, elastic: 1.1, batch: 8, serve: 1, hold: 420, pack: 1200,
    ings: { bun: 0.2, cua: 0.3, cachua: 0.5, dauhu: 0.3, nuocmam: 0.03, hanhla: 0.1, raumuong: 0.1 }, fin: ['bun', 'raumuong'],
    prep: [cut('cachua', 'khúc', 6), boil(['cua', 'cachua', 'dauhu', 'nuocmam'], 24, 'ninh', BROTH_RED, 3, 'Nấu riêu'), cut('hanhla', 'khúc', 6)],
    finish: [asm(L('bun', 'nest', 0xfaf7f0), L('@rieu', 'chunks', 0xe0885a, 'Riêu cua'), L('@nuoc', 'liquid', BROTH_RED, 'Nước riêu'), L('hanhla', 'greens'), L('raumuong', 'greens'))],
    hot: 1, meal: [0.9, 0.9, 0.8, 0.5], fill: 52, learn: { from: 'm_haisan', cost: 200000, skill: 3 }, desc: 'Chua thanh cà chua, riêu cua béo.' },
  // ───────── Mì xào ─────────
  { id: 'mi_xao_bo', name: 'Mì xào bò', short: 'Mì xào bò', cat: 'mi', vessel: 'plate', ref: 35000, elastic: 1.1, batch: 6, serve: 1, hold: 300, pack: 1000,
    ings: { mi: 1.5, bo: 0.5, bapcai: 0.08, carot: 0.2, hanhtay: 0.2, nuoctuong: 0.03, dauan: 0.03, toi: 0.08 }, fin: ['mi', 'nuoctuong', 'dauan'],
    prep: [cut('bo', 'lát', 7), cut('bapcai', 'sợi', 7), cut('carot', 'sợi', 7), cut('hanhtay', 'lát', 5)],
    finish: [fry(['mi', 'bo', 'bapcai', 'carot'], 13, 'xào', 4, 0.8)],
    hot: 0.5, meal: [0.5, 1, 1, 0.8], fill: 54, learn: { from: 'eatery', cost: 150000, skill: 2 }, desc: 'Lửa lớn, đảo nhanh, thơm khói chảo.' },
  { id: 'mi_xao_hai_san', name: 'Mì xào hải sản', short: 'Mì hải sản', cat: 'mi', vessel: 'plate', ref: 45000, elastic: 1.0, batch: 6, serve: 1, hold: 240, pack: 1000,
    ings: { mi: 1.5, tom: 0.4, muc: 0.4, bapcai: 0.08, hanhtay: 0.2, nuoctuong: 0.03, dauan: 0.03, toi: 0.08 }, fin: ['mi', 'nuoctuong', 'dauan'],
    prep: [cut('muc', 'khúc', 7), cut('bapcai', 'sợi', 7), cut('hanhtay', 'lát', 5), cut('toi', 'băm', 6)],
    finish: [fry(['mi', 'tom', 'muc', 'bapcai'], 13, 'xào', 4, 0.8)],
    hot: 0.5, meal: [0.3, 1, 1, 0.8], fill: 54, learn: { from: 'm_haisan', cost: 220000, skill: 3 }, desc: 'Tôm mực tươi rói quyện sợi mì vàng.' },
  // ───────── Nướng & hải sản ─────────
  { id: 'ga_nuong_sa', name: 'Gà nướng sả', short: 'Gà nướng', cat: 'nuong', vessel: 'plate', ref: 35000, elastic: 1.1, batch: 6, serve: 3, hold: 300, pack: 800,
    ings: { ga: 1.5, sa: 1, toi: 0.08, nuocmam: 0.02, duong: 0.01, ot: 0.5 }, fin: [],
    prep: [cut('sa', 'băm', 8), cut('toi', 'băm', 6), cut('ga', 'khúc', 6)], finish: [grill('ga', 11, 'slab')],
    hot: 0.5, meal: [0.1, 0.8, 1, 0.9], fill: 44, learn: { from: 'm_thit', cost: 150000, skill: 2 }, desc: 'Da giòn, thịt mềm, dậy mùi sả.' },
  { id: 'tom_nuong', name: 'Tôm nướng muối ớt', short: 'Tôm nướng', cat: 'haisan', vessel: 'plate', ref: 50000, elastic: 0.9, batch: 6, serve: 3, hold: 300, pack: 800,
    ings: { tom: 1.2, muoi: 0.02, ot: 1, chanh: 0.5 }, fin: ['tom', 'chanh'],
    prep: [cut('ot', 'băm', 7)], finish: [grill('tom', 7, 'skewer')],
    hot: 0.4, meal: [0, 0.6, 1, 1], fill: 36, learn: { from: 'm_haisan', cost: 180000, skill: 2 }, desc: 'Tôm đỏ au, cay xé lưỡi.' },
  { id: 'ngheu_hap_sa', name: 'Nghêu hấp sả', short: 'Nghêu hấp', cat: 'haisan', vessel: 'bowl', ref: 45000, elastic: 1.0, batch: 6, serve: 1, hold: 400, pack: 1200,
    ings: { ngheu: 3, sa: 2, gung: 0.2, ot: 0.5, rauthom: 0.1 }, fin: ['ngheu', 'rauthom'],
    prep: [cut('sa', 'khúc', 6), cut('gung', 'lát', 6), cut('ot', 'khúc', 5)], finish: [boil(['sa', 'gung', 'ngheu', 'ot'], 13, 'luộc', 0xe6e0b8, 1, 'Hấp nghêu')],
    hot: 1, meal: [0, 0.5, 1, 1], fill: 34, learn: { from: 'm_haisan', cost: 160000, skill: 2 }, desc: 'Nước nghêu ngọt lịm, cay ấm gừng sả.' },
  // ───────── Gỏi cuốn & burger ─────────
  { id: 'goi_cuon', name: 'Gỏi cuốn tôm thịt', short: 'Gỏi cuốn', cat: 'goi', vessel: 'roll', ref: 25000, elastic: 1.2, batch: 8, serve: 1, hold: 240, pack: 600,
    ings: { banhtrang: 0.08, tom: 0.3, bachi: 0.3, bun: 0.06, xalach: 0.12, rauthom: 0.08, dauphong: 0.06, nuoctuong: 0.02 }, fin: ['banhtrang', 'bun', 'dauphong', 'nuoctuong'],
    prep: [boil(['bachi', 'tom'], 16, 'luộc', 0xe9e2c8, 1, 'Luộc tôm thịt'), cut('bachi', 'lát', 7), cut('xalach', 'sợi', 5)],
    finish: [asm(L('xalach', 'greens'), L('bun', 'nest', 0xfaf7f0), L('bachi', 'slices', 0xe6c9b8), L('@tom', 'whole', 0xf08a5a, 'Tôm'), L('rauthom', 'greens'))],
    hot: -0.6, meal: [0.3, 0.9, 0.8, 0.6], fill: 34, learn: { from: 'm_rau', cost: 100000, skill: 1 }, desc: 'Thanh mát, chấm tương đậu phộng.' },
  { id: 'hamburger', name: 'Hamburger bò phô mai', short: 'Hamburger', cat: 'burger', vessel: 'bun', ref: 50000, elastic: 1.0, batch: 6, serve: 1, hold: 300, pack: 1500,
    ings: { banhmi: 1, bo: 0.7, phomai: 0.08, xalach: 0.1, cachua: 0.3, hanhtay: 0.2, tuongot: 0.03, dauan: 0.02 }, fin: ['banhmi', 'phomai', 'tuongot', 'dauan'],
    prep: [cut('bo', 'băm', 9), cut('cachua', 'lát', 6), cut('hanhtay', 'lát', 5), cut('xalach', 'sợi', 4)],
    finish: [fry(['bo'], 11, 'ốp la', 1, 0.74, 'Áp chảo'), asm(L('xalach', 'greens'), L('@bo', 'patty', 0x6a3a22, 'Thịt bò'), L('phomai', 'slices', 0xf7c83a), L('cachua', 'slices'), L('tuongot', 'drizzle'))],
    hot: 0.2, meal: [0.3, 0.8, 1, 0.9], fill: 50, learn: { from: 'bakery', cost: 250000, skill: 3 }, desc: 'Món Tây giữa lòng phố Việt.' },
  // ───────── Chè & đồ uống ─────────
  { id: 'che_dau_xanh', name: 'Chè đậu xanh cốt dừa', short: 'Chè đậu xanh', cat: 'che', vessel: 'cup', ref: 15000, elastic: 1.5, batch: 10, serve: 1, hold: 480, pack: 500,
    ings: { dauxanh: 0.05, duong: 0.04, nuocdua: 0.1, da: 0.1 }, fin: ['nuocdua', 'da'],
    prep: [boil(['dauxanh', 'duong'], 22, 'ninh', 0xd9c86a, 2, 'Nấu chè')], finish: [asm(L('da', 'ice'), L('@che', 'liquid', 0xd9c86a, 'Chè'), L('nuocdua', 'drizzle', 0xffffff))],
    hot: -1, meal: [0.1, 0.7, 1, 0.8], fill: 20, learn: { from: 'm_giavi', cost: 60000, skill: 1 }, desc: 'Ngọt mát giải nhiệt ngày nắng.' },
  { id: 'ca_phe_sua', name: 'Cà phê sữa đá', short: 'Cà phê sữa', cat: 'nuoc', vessel: 'glass', ref: 18000, elastic: 1.4, batch: 10, serve: 1, hold: 400, pack: 500,
    ings: { caphe: 0.08, suadac: 0.08, da: 0.12 }, fin: ['suadac', 'da'],
    prep: [boil(['caphe'], 15, 'pha', COFFEE, 0, 'Pha cà phê')], finish: [asm(L('suadac', 'liquid', 0xf3e6c8, 'Sữa đặc'), L('@caphe', 'liquid', COFFEE, 'Cà phê'), L('da', 'ice'))],
    hot: -0.6, meal: [1, 0.8, 0.5, 0.4], fill: 4, learn: { from: 'm_giavi', cost: 70000, skill: 1 }, desc: 'Đậm đà, ngọt béo — tỉnh cả buổi.' },
  { id: 'tra_sua', name: 'Trà sữa trân châu', short: 'Trà sữa', cat: 'nuoc', vessel: 'cup', ref: 25000, elastic: 1.3, batch: 10, serve: 1, hold: 360, pack: 800,
    ings: { tra: 0.05, suatuoi: 0.15, duong: 0.03, tranchau: 0.08, da: 0.12 }, fin: ['suatuoi', 'da'],
    prep: [boil(['tranchau', 'duong', 'tra'], 20, 'ninh', 0xc9925a, 1, 'Nấu trà & trân châu')],
    finish: [asm(L('@tranchau', 'balls', 0x2a1a12, 'Trân châu'), L('da', 'ice'), L('@tra', 'liquid', 0xc9925a, 'Trà'), L('suatuoi', 'liquid', 0xf3e2c8, 'Sữa'))],
    hot: -0.8, meal: [0.2, 0.8, 1, 0.9], fill: 10, learn: { from: 'mart', cost: 150000, skill: 2 }, desc: 'Giới trẻ xếp hàng vì món này.' },
  { id: 'nuoc_cam', name: 'Nước cam vắt', short: 'Nước cam', cat: 'nuoc', vessel: 'glass', ref: 22000, elastic: 1.3, batch: 1, serve: 1, hold: 0, pack: 500,
    ings: { cam: 2, duong: 0.02, da: 0.1 }, fin: ['cam', 'duong', 'da'], prep: [],
    finish: [cut('cam', 'khúc', 3), asm(L('da', 'ice'), L('cam', 'liquid', 0xf5a02a, 'Nước cam'), L('duong', 'sprinkle', 0xffffff))],
    hot: -1, meal: [0.7, 0.8, 0.7, 0.4], fill: 6, learn: { from: 'm_cu', cost: 40000, skill: 0 }, desc: 'Cam tươi vắt tại chỗ.' },

  // ═════════ Lượt 3: bổ sung cho đủ 60 món — món bình dân Việt Nam, giá và tay nghề tăng dần ═════════
  { id: 'xoi_dau', name: 'Xôi đậu phộng', short: 'Xôi đậu', cat: 'com', vessel: 'box', ref: 18000, elastic: 1.2, batch: 10, serve: 2, hold: 420, pack: 500,
    ings: { nep: 0.35, dauphong: 0.08, muoi: 0.02, dauan: 0.02 }, fin: ['dauphong', 'muoi'],
    prep: [boil(['nep', 'dauphong'], 25, 'ninh', 0xf0e6c8, 1, 'Đồ xôi')],
    finish: [asm(L('@nep', 'mound', 0xf0e6c8, 'Xôi'), L('dauphong', 'sprinkle'), L('muoi', 'sprinkle', 0xffffff))],
    hot: 0.4, meal: [1, 0.6, 0.3, 0.4], fill: 40, learn: { from: 'm_kho', cost: 25000, skill: 0 }, desc: 'Gói lá chuối, ăn sáng cho chắc bụng.' },
  { id: 'banh_chuoi', name: 'Bánh chuối chiên', short: 'Chuối chiên', cat: 'chien', vessel: 'paper', ref: 12000, elastic: 1.3, batch: 8, serve: 2, hold: 300, pack: 300,
    ings: { chuoi: 0.5, botmi: 0.08, duong: 0.02, dauan: 0.03 }, fin: ['chuoi', 'botmi', 'duong'],
    prep: [cut('chuoi', 'lát', 5)], finish: [fry(['chuoi', 'botmi', 'duong'], 12, 'chiên', 2, 0.7, 'Chiên bánh chuối')],
    hot: 0.6, meal: [0.4, 0.5, 1, 0.9], fill: 20, learn: { from: 'm_cu', cost: 30000, skill: 0 }, desc: 'Vỏ giòn, chuối ngọt mềm — món xế chiều.' },
  { id: 'banh_trang_nuong', name: 'Bánh tráng nướng', short: 'B.tráng nướng', cat: 'nuong', vessel: 'paper', ref: 15000, elastic: 1.4, batch: 8, serve: 1, hold: 240, pack: 400,
    ings: { banhtrang: 0.35, trung: 0.5, rauthom: 0.06, tuongot: 0.03, dauan: 0.02 }, fin: ['banhtrang', 'trung'],
    prep: [cut('rauthom', 'khúc', 5)], finish: [grill('banhtrang', 8, 'slab', 'Nướng bánh tráng'), asm(L('@banhtrang', 'whole', 0xf0dfb0, 'Bánh'), L('trung', 'egg'), L('rauthom', 'greens'), L('tuongot', 'drizzle'))],
    hot: 0.6, meal: [0.3, 0.6, 1, 1], fill: 18, learn: { from: 'kiosk', cost: 35000, skill: 0 }, desc: '"Pizza Việt" của tụi học trò.' },
  { id: 'banh_bao', name: 'Bánh bao hấp', short: 'Bánh bao', cat: 'anvat', vessel: 'paper', ref: 16000, elastic: 1.2, batch: 8, serve: 2, hold: 300, pack: 400,
    ings: { botmi: 0.15, heo: 0.4, trung: 0.2, nam: 0.1, duong: 0.02, muoi: 0.01 }, fin: ['botmi', 'trung'],
    prep: [cut('nam', 'hạt lựu', 4)], finish: [boil(['botmi', 'heo', 'trung', 'nam'], 20, 'luộc', 0xf3ead6, 0, 'Hấp bánh bao')],
    hot: 0.5, meal: [1, 0.7, 0.5, 0.6], fill: 34, learn: { from: 'bakery', cost: 45000, skill: 0 }, desc: 'Nóng hổi, nhân thịt trứng cút.' },
  { id: 'banh_beo', name: 'Bánh bèo chén', short: 'Bánh bèo', cat: 'anvat', vessel: 'plate', ref: 16000, elastic: 1.3, batch: 10, serve: 4, hold: 200, pack: 400,
    ings: { gao: 0.15, tom: 0.3, hanhla: 0.05, nuocmam: 0.02, dauan: 0.01 }, fin: ['tom', 'hanhla', 'nuocmam'],
    prep: [boil(['gao'], 15, 'ninh', 0xf7f2e6, 0, 'Tráng bột')],
    finish: [asm(L('@gao', 'patty', 0xf7f2e6, 'Bánh'), L('tom', 'sprinkle', 0xe08a6a, 'Tôm chấy'), L('hanhla', 'greens'), L('nuocmam', 'drizzle'))],
    hot: 0.2, meal: [0.5, 0.7, 1, 0.9], fill: 22, learn: { from: 'eatery', cost: 55000, skill: 1 }, desc: 'Chén nhỏ xíu, rưới nước mắm ớt.' },
  { id: 'bot_chien', name: 'Bột chiên trứng', short: 'Bột chiên', cat: 'chien', vessel: 'plate', ref: 18000, elastic: 1.3, batch: 8, serve: 2, hold: 240, pack: 400,
    ings: { botmi: 0.12, trung: 0.5, hanhla: 0.05, dauan: 0.03, tuongot: 0.02 }, fin: ['botmi', 'trung'],
    prep: [], finish: [fry(['botmi', 'trung'], 10, 'chiên', 2, 0.68, 'Chiên bột'), asm(L('@botmi', 'chunks', 0xf0d9a0, 'Bột chiên'), L('trung', 'egg'), L('hanhla', 'greens'), L('tuongot', 'drizzle'))],
    hot: 0.5, meal: [0.3, 0.5, 1, 1], fill: 24, learn: { from: 'mart', cost: 50000, skill: 1 }, desc: 'Vàng giòn, chấm tương ớt.' },
  { id: 'banh_khot', name: 'Bánh khọt tôm', short: 'Bánh khọt', cat: 'chien', vessel: 'plate', ref: 18000, elastic: 1.3, batch: 10, serve: 4, hold: 200, pack: 400,
    ings: { botmi: 0.12, tom: 0.3, dauan: 0.04, hanhla: 0.05, nuocdua: 0.02 }, fin: ['botmi', 'tom'],
    prep: [cut('hanhla', 'khúc', 4)], finish: [fry(['botmi', 'tom'], 10, 'chiên', 2, 0.66, 'Đổ bánh khọt')],
    hot: 0.3, meal: [0.4, 0.7, 1, 0.9], fill: 22, learn: { from: 'eatery', cost: 60000, skill: 1 }, desc: 'Giòn rụm, cuốn rau sống chấm mắm.' },
  { id: 'banh_cuon', name: 'Bánh cuốn nóng', short: 'Bánh cuốn', cat: 'anvat', vessel: 'plate', ref: 20000, elastic: 1.3, batch: 8, serve: 3, hold: 180, pack: 400,
    ings: { banhpho: 0.4, heo: 0.3, nam: 0.1, hanhla: 0.05, nuocmam: 0.03 }, fin: ['banhpho', 'heo', 'nam'],
    prep: [cut('heo', 'băm', 6), cut('nam', 'sợi', 4)], finish: [boil(['banhpho', 'heo', 'nam'], 12, 'luộc', 0xfaf7f0, 0, 'Tráng bánh'), asm(L('@banhpho', 'slices', 0xfaf7f0, 'Bánh cuốn'), L('heo', 'sprinkle', 0xe58a8a), L('hanhla', 'greens'), L('nuocmam', 'drizzle'))],
    hot: 0.5, meal: [1, 0.7, 0.5, 0.5], fill: 30, learn: { from: 'eatery', cost: 65000, skill: 1 }, desc: 'Tráng mỏng tang, rắc hành phi.' },
  { id: 'banh_xeo', name: 'Bánh xèo', short: 'Bánh xèo', cat: 'chien', vessel: 'plate', ref: 20000, elastic: 1.25, batch: 6, serve: 2, hold: 200, pack: 500,
    ings: { botmi: 0.12, trung: 0.3, tom: 0.3, gia: 0.1, nuocdua: 0.03, dauan: 0.03 }, fin: ['botmi', 'trung', 'tom', 'gia'],
    prep: [], finish: [fry(['botmi', 'trung', 'tom', 'gia'], 14, 'chiên', 2, 0.7, 'Đổ bánh xèo')],
    hot: 0.4, meal: [0.4, 0.8, 1, 0.9], fill: 34, learn: { from: 'eatery', cost: 70000, skill: 1 }, desc: 'Vỏ giòn vàng, nhân tôm giá.' },
  { id: 'banh_mi_chao', name: 'Bánh mì chảo', short: 'B.mì chảo', cat: 'banhmi', vessel: 'plate', ref: 22000, elastic: 1.2, batch: 6, serve: 2, hold: 200, pack: 500,
    ings: { banhmi: 0.7, trung: 0.5, pate: 0.05, heo: 0.3, tuongot: 0.02, dauan: 0.02 }, fin: ['trung', 'heo'],
    prep: [cut('banhmi', 'khúc', 4)], finish: [fry(['trung', 'heo', 'pate'], 10, 'ốp la', 1, 0.62, 'Chiên chảo'), asm(L('heo', 'slices', 0xdf7a78, 'Thịt'), L('trung', 'egg'), L('pate', 'patty', 0xa86a4a, 'Pa-tê'), L('tuongot', 'drizzle'))],
    hot: 0.6, meal: [1, 0.7, 0.6, 0.6], fill: 38, learn: { from: 'eatery', cost: 75000, skill: 1 }, desc: 'Chảo gang nóng, bánh mì chấm trứng.' },
  { id: 'goi_xoai', name: 'Gỏi xoài tôm khô', short: 'Gỏi xoài', cat: 'goi', vessel: 'box', ref: 22000, elastic: 1.3, batch: 6, serve: 2, hold: 150, pack: 500,
    ings: { xoai: 0.8, tom: 0.2, rauthom: 0.06, dauphong: 0.1, nuocmam: 0.02, chanh: 0.2, duong: 0.02, ot: 0.02 }, fin: ['xoai', 'tom'],
    prep: [cut('xoai', 'sợi', 5)], finish: [asm(L('@xoai', 'nest', 0xc8d96a, 'Xoài bào'), L('tom', 'sprinkle', 0xe08a6a, 'Tôm khô'), L('rauthom', 'greens'), L('dauphong', 'sprinkle'), L('nuocmam', 'drizzle'))],
    hot: -0.7, meal: [0.3, 0.9, 0.8, 0.7], fill: 20, learn: { from: 'm_rau', cost: 60000, skill: 1 }, desc: 'Chua ngọt cay cay, món ăn vặt buổi chiều.' },
  { id: 'cha_gio', name: 'Chả giò chiên', short: 'Chả giò', cat: 'chien', vessel: 'plate', ref: 26000, elastic: 1.2, batch: 10, serve: 3, hold: 300, pack: 400,
    ings: { banhtrang: 0.4, heo: 0.4, carot: 0.15, rauthom: 0.06, trung: 0.2, dauan: 0.03 }, fin: ['banhtrang', 'heo'],
    prep: [cut('heo', 'băm', 6), cut('carot', 'sợi', 4)], finish: [fry(['banhtrang', 'heo', 'carot', 'trung'], 14, 'chiên', 2, 0.7, 'Chiên chả giò')],
    hot: 0.5, meal: [0.2, 0.7, 1, 0.9], fill: 26, learn: { from: 'm_trung', cost: 55000, skill: 1 }, desc: 'Cuốn chặt, chiên ngập dầu, chấm mắm chua ngọt.' },
  { id: 'xiu_mai', name: 'Xíu mại', short: 'Xíu mại', cat: 'anvat', vessel: 'plate', ref: 24000, elastic: 1.2, batch: 8, serve: 3, hold: 200, pack: 400,
    ings: { heo: 0.4, banhmi: 0.3, cachua: 0.2, hanhla: 0.04, nuocmam: 0.02 }, fin: ['heo', 'cachua'],
    prep: [cut('heo', 'băm', 6)], finish: [boil(['heo', 'cachua'], 15, 'ninh', 0xd9603a, 1, 'Hấp xíu mại')],
    hot: 0.5, meal: [0.8, 0.8, 0.6, 0.5], fill: 26, learn: { from: 'bakery', cost: 60000, skill: 1 }, desc: 'Viên thịt mềm, ăn với bánh mì.' },
  { id: 'ha_cao', name: 'Há cảo hấp', short: 'Há cảo', cat: 'anvat', vessel: 'plate', ref: 25000, elastic: 1.2, batch: 8, serve: 3, hold: 180, pack: 400,
    ings: { botmi: 0.12, heo: 0.3, tom: 0.25, hanhla: 0.04 }, fin: ['botmi', 'heo', 'tom'],
    prep: [cut('heo', 'băm', 5)], finish: [boil(['heo', 'tom'], 12, 'luộc', 0xf7f2e6, 0, 'Hấp há cảo'), asm(L('@heo', 'balls', 0xf7f2e6, 'Há cảo'), L('hanhla', 'greens'))],
    hot: 0.4, meal: [0.9, 0.7, 0.5, 0.5], fill: 24, learn: { from: 'bakery', cost: 65000, skill: 1 }, desc: 'Vỏ mỏng, nhân tôm thịt, chấm xì dầu.' },
  { id: 'sup_cua', name: 'Súp cua', short: 'Súp cua', cat: 'anvat', vessel: 'cup', ref: 26000, elastic: 1.3, batch: 8, serve: 3, hold: 200, pack: 400,
    ings: { cua: 0.3, trung: 0.3, botmi: 0.05, nam: 0.08, hanhla: 0.04, muoi: 0.01 }, fin: ['cua', 'trung'],
    prep: [cut('hanhla', 'khúc', 4)], finish: [boil(['cua', 'botmi', 'nam'], 18, 'ninh', 0xe0b070, 1, 'Nấu súp'), asm(L('@cua', 'liquid', 0xe0b070, 'Súp'), L('trung', 'egg'), L('hanhla', 'greens'), L('muoi', 'sprinkle', 0xffffff))],
    hot: 0.8, meal: [0.7, 0.6, 0.8, 1], fill: 20, learn: { from: 'm_haisan', cost: 70000, skill: 2 }, desc: 'Sánh mịn, ngọt thịt cua, ăn khuya rất hợp.' },
  { id: 'chao_long', name: 'Cháo lòng', short: 'Cháo lòng', cat: 'com', vessel: 'bowl', ref: 28000, elastic: 1.2, batch: 8, serve: 3, hold: 240, pack: 500,
    ings: { gao: 0.2, heo: 0.4, gio: 0.2, hanhla: 0.05, tieu: 0.01 }, fin: ['heo', 'gio'],
    prep: [cut('gio', 'lát', 4)], finish: [boil(['gao', 'heo', 'gio'], 25, 'ninh', 0xe8d2a8, 1, 'Ninh cháo'), asm(L('@gao', 'liquid', 0xe8d2a8, 'Cháo'), L('gio', 'slices', 0xe2b0a0, 'Lòng'), L('hanhla', 'greens'), L('tieu', 'sprinkle', 0x4a4038))],
    hot: 0.9, meal: [1, 0.6, 0.4, 0.9], fill: 34, learn: { from: 'm_thit', cost: 60000, skill: 2 }, desc: 'Nồi cháo sáng sớm, thêm đĩa lòng nóng.' },
  { id: 'bun_chao', name: 'Bún chả', short: 'Bún chả', cat: 'bunpho', vessel: 'bowl', ref: 28000, elastic: 1.2, batch: 6, serve: 2, hold: 200, pack: 500,
    ings: { bun: 0.25, bachi: 0.5, nuocmam: 0.05, duong: 0.02, toi: 0.02, ot: 0.02, rauthom: 0.06, carot: 0.1 }, fin: ['bachi'],
    prep: [cut('bachi', 'lát', 5)], finish: [grill('bachi', 10, 'slab', 'Nướng chả'), asm(L('@bachi', 'chunks', 0xc86a4a, 'Chả nướng'), L('bun', 'nest', 0xfaf7f0, 'Bún'), L('rauthom', 'greens'), L('nuocmam', 'drizzle'))],
    hot: 0.4, meal: [0.5, 1, 0.9, 0.6], fill: 42, learn: { from: 'eatery', cost: 90000, skill: 2 }, desc: 'Chả nướng than hoa, nước mắm chua ngọt.' },
  { id: 'bun_dau', name: 'Bún đậu mắm tôm', short: 'Bún đậu', cat: 'bunpho', vessel: 'plate', ref: 28000, elastic: 1.2, batch: 6, serve: 2, hold: 200, pack: 600,
    ings: { bun: 0.25, dauhu: 0.5, nuocmam: 0.06, ot: 0.03, rauthom: 0.06, dualeo: 0.15 }, fin: ['dauhu'],
    prep: [], finish: [fry(['dauhu'], 10, 'chiên', 2, 0.68, 'Chiên đậu'), asm(L('@dauhu', 'chunks', 0xe8c06a, 'Đậu chiên'), L('bun', 'nest', 0xfaf7f0, 'Bún'), L('rauthom', 'greens'), L('dualeo', 'slices', 0x9fd06a, 'Dưa leo'), L('nuocmam', 'drizzle', 0x9a5a22, 'Mắm tôm'))],
    hot: 0.3, meal: [0.5, 0.9, 1, 0.7], fill: 40, learn: { from: 'eatery', cost: 85000, skill: 2 }, desc: 'Mâm bún đậu, mắm tôm đánh bọt.' },
  { id: 'bun_thit_nuong', name: 'Bún thịt nướng', short: 'Bún thịt', cat: 'bunpho', vessel: 'bowl', ref: 30000, elastic: 1.2, batch: 6, serve: 2, hold: 200, pack: 550,
    ings: { bun: 0.25, heo: 0.4, sa: 0.03, nuocmam: 0.04, rauthom: 0.06, dauphong: 0.08, dualeo: 0.15, duong: 0.02 }, fin: ['heo'],
    prep: [cut('heo', 'lát', 5)], finish: [grill('heo', 10, 'slab', 'Nướng thịt'), asm(L('@heo', 'slices', 0xc86a4a, 'Thịt nướng'), L('bun', 'nest', 0xfaf7f0, 'Bún'), L('rauthom', 'greens'), L('dualeo', 'slices', 0x9fd06a), L('dauphong', 'sprinkle'), L('nuocmam', 'drizzle'))],
    hot: 0.3, meal: [0.4, 1, 0.9, 0.7], fill: 44, learn: { from: 'eatery', cost: 95000, skill: 2 }, desc: 'Thịt nướng sả thơm lừng, rắc đậu phộng.' },
  { id: 'nem_lui', name: 'Nem lụi', short: 'Nem lụi', cat: 'nuong', vessel: 'plate', ref: 30000, elastic: 1.25, batch: 8, serve: 3, hold: 240, pack: 450,
    ings: { heo: 0.5, sa: 0.08, nuocmam: 0.03, banhtrang: 0.4, rauthom: 0.06 }, fin: ['heo', 'sa'],
    prep: [], finish: [grill('heo', 12, 'skewer', 'Nướng nem lụi'), asm(L('@heo', 'sticks', 0xc86a4a, 'Nem lụi'), L('banhtrang', 'whole', 0xf0dfb0, 'Bánh tráng'), L('rauthom', 'greens'))],
    hot: 0.6, meal: [0.2, 0.7, 1, 0.8], fill: 30, learn: { from: 'm_thit', cost: 85000, skill: 2 }, desc: 'Xiên sả nướng, cuốn bánh tráng chấm mắm nêm.' },
  { id: 'oc_luoc', name: 'Ốc luộc sả', short: 'Ốc luộc', cat: 'haisan', vessel: 'bowl', ref: 30000, elastic: 1.3, batch: 4, serve: 2, hold: 200, pack: 500,
    ings: { so: 0.6, sa: 0.06, gung: 0.05, ot: 0.04, rauthom: 0.05 }, fin: ['so', 'sa'],
    prep: [], finish: [boil(['so', 'sa', 'gung'], 15, 'luộc', 0xd9c07a, 0, 'Luộc ốc')],
    hot: 0.4, meal: [0, 0.3, 0.8, 1], fill: 22, learn: { from: 'm_haisan', cost: 80000, skill: 2 }, desc: 'Ngồi vỉa hè, hút ốc, nói chuyện tới khuya.' },
  { id: 'canh_chua_ca', name: 'Canh chua cá', short: 'Canh chua', cat: 'haisan', vessel: 'bowl', ref: 32000, elastic: 1.15, batch: 6, serve: 3, hold: 200, pack: 500,
    ings: { ca: 0.5, cachua: 0.3, gia: 0.1, hanhla: 0.05, nuocmam: 0.03, gung: 0.02 }, fin: ['ca'],
    prep: [cut('ca', 'khúc', 4)], finish: [boil(['ca', 'cachua', 'gia', 'gung'], 22, 'ninh', 0xe07a4a, 1, 'Nấu canh chua')],
    hot: 0.8, meal: [0.3, 0.9, 1, 0.6], fill: 32, learn: { from: 'm_haisan', cost: 75000, skill: 2 }, desc: 'Chua thanh, cay nhẹ, ăn với cơm nóng.' },
  { id: 'hu_tieu', name: 'Hủ tiếu Nam Vang', short: 'Hủ tiếu', cat: 'bunpho', vessel: 'bowl', ref: 32000, elastic: 1.2, batch: 8, serve: 2, hold: 240, pack: 500,
    ings: { banhpho: 0.25, heo: 0.35, tom: 0.25, hanhla: 0.05, nuocmam: 0.03, giavipho: 0.01 }, fin: ['heo', 'tom'],
    prep: [cut('heo', 'lát', 4)], finish: [boil(['heo', 'tom', 'giavipho'], 25, 'ninh', 0xe8dcc0, 1, 'Ninh nước dùng'), asm(L('banhpho', 'nest', 0xfaf7f0, 'Hủ tiếu'), L('heo', 'slices', 0xe58a8a), L('tom', 'whole', 0xe08a6a), L('hanhla', 'greens'))],
    hot: 0.9, meal: [1, 0.8, 0.6, 0.7], fill: 46, learn: { from: 'eatery', cost: 100000, skill: 2 }, desc: 'Nước dùng trong, tôm thịt đầy ắp.' },
  { id: 'bun_moc', name: 'Bún mọc', short: 'Bún mọc', cat: 'bunpho', vessel: 'bowl', ref: 30000, elastic: 1.2, batch: 8, serve: 2, hold: 260, pack: 500,
    ings: { bun: 0.25, heo: 0.4, gio: 0.2, nam: 0.1, hanhtay: 0.05, nuocmam: 0.04 }, fin: ['heo', 'gio'],
    prep: [cut('gio', 'lát', 4)], finish: [boil(['heo', 'gio', 'nam', 'hanhtay'], 22, 'ninh', 0xe8d2a8, 1, 'Ninh nước dùng'), asm(L('bun', 'nest', 0xfaf7f0, 'Bún'), L('@heo', 'balls', 0xe8c0a0, 'Mọc'), L('gio', 'slices', 0xe2b0a0), L('hanhtay', 'greens'))],
    hot: 0.9, meal: [1, 0.8, 0.6, 0.6], fill: 44, learn: { from: 'eatery', cost: 95000, skill: 2 }, desc: 'Mọc viên dai mềm, nước dùng trong veo.' },
  { id: 'bun_bo_hue', name: 'Bún bò Huế', short: 'Bún bò', cat: 'bunpho', vessel: 'bowl', ref: 35000, elastic: 1.15, batch: 8, serve: 2, hold: 300, pack: 550,
    ings: { bun: 0.3, bo: 0.4, sa: 0.06, ot: 0.04, giavipho: 0.02, hanhtay: 0.05, nuocmam: 0.04 }, fin: ['bo'],
    prep: [cut('bo', 'lát', 4)], finish: [boil(['bo', 'sa', 'hanhtay', 'giavipho'], 28, 'ninh', 0xd9552a, 1, 'Ninh nước bún bò'), asm(L('bun', 'nest', 0xfaf7f0, 'Bún'), L('@bo', 'slices', 0xc84a3a, 'Bò'), L('hanhla', 'greens'), L('ot', 'sprinkle', 0xd9261e))],
    hot: 1, meal: [1, 0.8, 0.6, 0.6], fill: 48, learn: { from: 'eatery', cost: 130000, skill: 3 }, desc: 'Cay nồng mắm ruốc, sợi bún to tròn.' },
  { id: 'com_ga', name: 'Cơm gà Hội An', short: 'Cơm gà', cat: 'com', vessel: 'plate', ref: 36000, elastic: 1.15, batch: 6, serve: 2, hold: 240, pack: 550,
    ings: { gao: 0.25, ga: 0.5, dualeo: 0.12, nuocmam: 0.03, toi: 0.02, gung: 0.03 }, fin: ['ga'],
    prep: [cut('ga', 'lát', 5)], finish: [boil(['ga', 'gung'], 20, 'luộc', 0xe8d2a8, 1, 'Luộc gà'), asm(L('gao', 'mound', 0xf5d96a, 'Cơm nghệ'), L('@ga', 'slices', 0xf0e2c0, 'Gà xé'), L('dualeo', 'slices', 0x9fd06a), L('nuocmam', 'drizzle'))],
    hot: 0.4, meal: [0.5, 1, 0.9, 0.5], fill: 46, learn: { from: 'eatery', cost: 110000, skill: 3 }, desc: 'Cơm nghệ vàng ươm, gà xé trộn rau răm.' },
  { id: 'ga_ran', name: 'Gà rán giòn', short: 'Gà rán', cat: 'chien', vessel: 'box', ref: 38000, elastic: 1.2, batch: 8, serve: 2, hold: 240, pack: 600,
    ings: { ga: 0.6, botmi: 0.1, dauan: 0.06, muoi: 0.02, ot: 0.02 }, fin: ['ga'],
    prep: [], finish: [fry(['ga', 'botmi'], 15, 'chiên', 2, 0.72, 'Chiên gà')],
    hot: 0.7, meal: [0.3, 0.8, 1, 0.8], fill: 40, learn: { from: 'm_thit', cost: 120000, skill: 3 }, desc: 'Vỏ giòn rụm, thịt mọng nước.' },
  { id: 'com_chien_hai_san', name: 'Cơm chiên hải sản', short: 'Cơm hải sản', cat: 'com', vessel: 'plate', ref: 40000, elastic: 1.15, batch: 6, serve: 2, hold: 240, pack: 550,
    ings: { gao: 0.25, tom: 0.3, muc: 0.2, trung: 0.4, dauan: 0.03, hanhla: 0.04 }, fin: ['tom', 'muc', 'trung'],
    prep: [cut('muc', 'khúc', 4)], finish: [fry(['gao', 'tom', 'muc', 'trung'], 14, 'xào', 4, 0.7, 'Chiên cơm')],
    hot: 0.6, meal: [0.3, 1, 1, 0.7], fill: 48, learn: { from: 'eatery', cost: 140000, skill: 3 }, desc: 'Hạt cơm tơi, tôm mực chín tới.' },
  { id: 'pha_lau', name: 'Phá lấu', short: 'Phá lấu', cat: 'anvat', vessel: 'bowl', ref: 32000, elastic: 1.25, batch: 6, serve: 3, hold: 240, pack: 450,
    ings: { heo: 0.5, nuocdua: 0.1, giavipho: 0.02, ot: 0.03, toi: 0.02 }, fin: ['heo'],
    prep: [cut('heo', 'khúc', 5)], finish: [boil(['heo', 'nuocdua', 'giavipho'], 30, 'ninh', 0xa8642a, 1, 'Ninh phá lấu')],
    hot: 0.5, meal: [0, 0.4, 0.8, 1], fill: 28, learn: { from: 'm_thit', cost: 100000, skill: 3 }, desc: 'Nước cốt dừa sánh, ăn với bánh mì.' },
  { id: 'banh_canh_cua', name: 'Bánh canh cua', short: 'Bánh canh', cat: 'bunpho', vessel: 'bowl', ref: 45000, elastic: 1.15, batch: 6, serve: 2, hold: 240, pack: 600,
    ings: { bun: 0.3, cua: 0.4, tom: 0.2, hanhla: 0.05, nuocmam: 0.03 }, fin: ['cua', 'tom'],
    prep: [cut('hanhla', 'khúc', 4)], finish: [boil(['cua', 'tom'], 25, 'ninh', 0xd9703a, 1, 'Ninh nước cua'), asm(L('bun', 'nest', 0xe8dcc0, 'Bánh canh'), L('@cua', 'chunks', 0xd9552a, 'Gạch cua'), L('tom', 'whole', 0xe08a6a), L('hanhla', 'greens'))],
    hot: 0.9, meal: [1, 0.8, 0.7, 0.6], fill: 46, learn: { from: 'm_haisan', cost: 160000, skill: 3 }, desc: 'Sợi bánh canh dai, nước cua đỏ au.' },
  { id: 'lau_bo', name: 'Lẩu bò nhúng giấm', short: 'Lẩu bò', cat: 'nuong', vessel: 'bowl', ref: 80000, elastic: 1.1, batch: 4, serve: 2, hold: 240, pack: 800,
    ings: { bo: 0.6, raumuong: 0.3, bapcai: 0.2, nam: 0.15, sa: 0.05, giavipho: 0.02, bun: 0.2 }, fin: ['bo'],
    prep: [cut('bo', 'lát', 6), cut('raumuong', 'khúc', 5)], finish: [boil(['bo', 'sa', 'giavipho'], 20, 'ninh', 0xc8a44a, 1, 'Nấu lẩu')],
    hot: 1, meal: [0, 0.4, 1, 1], fill: 55, learn: { from: 'eatery', cost: 260000, skill: 4 }, desc: 'Nồi lẩu nghi ngút, nhúng thịt bò tái.' },
  { id: 'banh_flan', name: 'Bánh flan', short: 'Bánh flan', cat: 'che', vessel: 'cup', ref: 18000, elastic: 1.3, batch: 8, serve: 1, hold: 480, pack: 400,
    ings: { trung: 0.3, suatuoi: 0.15, duong: 0.05, caphe: 0.02 }, fin: ['trung'],
    prep: [], finish: [boil(['trung', 'suatuoi', 'duong'], 20, 'luộc', 0xe8c882, 1, 'Hấp flan'), asm(L('@trung', 'patty', 0xf0d9a0, 'Flan'), L('caphe', 'drizzle', 0x4a2a16, 'Cà phê'))],
    hot: -0.5, meal: [0.3, 0.6, 0.9, 1], fill: 16, learn: { from: 'mart', cost: 60000, skill: 1 }, desc: 'Mềm mịn, thơm cà phê, món tráng miệng quen thuộc.' },
  { id: 'che_thai', name: 'Chè Thái', short: 'Chè Thái', cat: 'che', vessel: 'glass', ref: 20000, elastic: 1.25, batch: 8, serve: 1, hold: 300, pack: 500,
    ings: { tranchau: 0.08, suatuoi: 0.15, duong: 0.04, da: 0.12, dauphong: 0.05 }, fin: ['suatuoi', 'da'],
    prep: [boil(['tranchau', 'duong'], 15, 'ninh', 0xc9925a, 1, 'Nấu trân châu')],
    finish: [asm(L('@tranchau', 'balls', 0x2a1a12, 'Trân châu'), L('da', 'ice'), L('suatuoi', 'liquid', 0xf3e2c8, 'Sữa'), L('dauphong', 'sprinkle'))],
    hot: -1, meal: [0.2, 0.8, 1, 0.9], fill: 18, learn: { from: 'm_giavi', cost: 70000, skill: 1 }, desc: 'Mát lạnh, đủ vị, bán chạy ngày nắng.' },
  { id: 'tra_chanh', name: 'Trà chanh', short: 'Trà chanh', cat: 'nuoc', vessel: 'glass', ref: 12000, elastic: 1.4, batch: 12, serve: 1, hold: 400, pack: 400,
    ings: { tra: 0.05, chanh: 0.4, duong: 0.03, da: 0.12 }, fin: ['chanh', 'da'],
    prep: [boil(['tra'], 10, 'pha', 0xb86a2a, 0, 'Pha trà')],
    finish: [asm(L('@tra', 'liquid', 0xb86a2a, 'Trà'), L('chanh', 'slices', 0xd9ec8a, 'Chanh'), L('da', 'ice'), L('duong', 'sprinkle', 0xffffff))],
    hot: -1, meal: [0.4, 0.9, 0.9, 0.6], fill: 6, learn: { from: 'm_giavi', cost: 30000, skill: 0 }, desc: 'Chua chua ngọt ngọt, quán nào cũng có.' },
];

export const RECIPES: Record<string, RecipeDef> = Object.fromEntries(RECIPE_LIST.map((r) => [r.id, r]));
export const START_RECIPES = ['banh_trang_tron', 'bap_nuong', 'khoai_nuong', 'tra_da'];

export function toolsFor(r: RecipeDef): string[] {
  const s = new Set<string>();
  for (const st of [...r.prep, ...r.finish]) for (const t of STEP_TOOLS[st.t]) s.add(t);
  return [...s];
}
/** Số lần dùng bếp (tốn nhiên liệu) cho mỗi phần ăn. */
export function fuelPerPortion(r: RecipeDef): number {
  const heat = (st: Step) => (st.t === 'cut' || st.t === 'assemble' ? 0 : 1);
  return r.prep.reduce((a, s) => a + heat(s), 0) / Math.max(1, r.batch) + r.finish.reduce((a, s) => a + heat(s), 0) / Math.max(1, r.serve);
}
