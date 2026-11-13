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
