// BẢNG BIỂU CẢM: mỗi cột trong atlas khuôn mặt (src/gfx/tex.ts) là một biểu cảm.
// Đặt ở lớp dữ liệu thuần để phần mô phỏng (rules) và UI dùng được mà không kéo theo three.js.
export const EXPR = {
  normal: 0, happy: 1, joy: 2, annoyed: 3, angry: 4, sad: 5, surprise: 6, blink: 7,
  smile: 8, wink: 9, sleepy: 10, pain: 11, fear: 12, smug: 13, savor: 14, pout: 15,
} as const;
export type ExprId = (typeof EXPR)[keyof typeof EXPR];
/** Tên tiếng Việt — dùng cho bảng tra cứu trong tài liệu và màn hình thử biểu cảm. */
export const EXPR_NAMES: Record<number, string> = {
  0: 'thường', 1: 'vui', 2: 'rất vui', 3: 'khó chịu', 4: 'giận', 5: 'buồn', 6: 'ngạc nhiên', 7: 'chớp mắt',
  8: 'cười mỉm', 9: 'nháy mắt', 10: 'buồn ngủ', 11: 'đau', 12: 'sợ', 13: 'khinh', 14: 'ăn ngon', 15: 'phồng má hờn',
};
