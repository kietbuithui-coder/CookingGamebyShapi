// ĐIỆN THOẠI ĐỜI 2005–2010 — dữ liệu thuần, dễ mở rộng.
// Ba mẫu máy bán ở tiệm Đồ Nghề Ba Tài. Càng đắt thì càng nhiều chức năng, pin cũng lâu hơn.

export type PhoneFeat = 'ledger' | 'contacts' | 'sms' | 'radio' | 'music' | 'wap';

export interface PhoneDef {
  id: string; name: string; brand: string; price: number; feats: PhoneFeat[];
  /** Dung lượng pin (giờ trong game dùng liên tục). */
  hours: number; desc: string; blurb: string;
}

export const PHONE_LIST: PhoneDef[] = [
  {
    id: 'cucgach', name: 'Cục gạch', brand: 'Nokia 1110i', price: 180000, hours: 54,
    feats: ['ledger', 'contacts', 'sms'],
    desc: 'Máy đen trắng, rơi xuống đường cũng không sao. Sổ thu chi, danh bạ, tin nhắn.',
    blurb: 'Cục gạch đây, pin ba ngày, đập đá cũng không bể. Chú mua thì chú bán 180.000₫.',
  },
  {
    id: 'napgap', name: 'Nắp gập', brand: 'Samsung E250', price: 520000, hours: 46,
    feats: ['ledger', 'contacts', 'sms', 'radio', 'music'],
    desc: 'Nắp gập màn hình màu, có đèn lồng, nghe nhạc và bắt radio FM.',
    blurb: 'Nắp gập màn hình màu, mở ra đóng vô nghe cái “tách” là sướng. Nghe nhạc, nghe radio đài Sài Gòn.',
  },
  {
    id: 'camung', name: 'Cảm ứng', brand: 'O2 Xphone', price: 1450000, hours: 40,
    feats: ['ledger', 'contacts', 'sms', 'radio', 'music', 'wap'],
    desc: 'Màn hình cảm ứng to, lướt web WAP chậm như rùa nhưng oai nhất xóm.',
    blurb: 'Cảm ứng xịn nhất tiệm. Lướt web WAP được, mà chậm — bấm một cái chờ một phút. Oai là chính.',
  },
];
export const PHONES: Record<string, PhoneDef> = Object.fromEntries(PHONE_LIST.map((p) => [p.id, p]));

export const FEAT_LABEL: Record<PhoneFeat, string> = {
  ledger: 'Sổ thu chi', contacts: 'Danh bạ', sms: 'Tin nhắn', radio: 'Radio FM', music: 'Nghe nhạc', wap: 'Lướt web',
};
