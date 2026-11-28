// HỘI THOẠI BĂNG ĐẢNG (lượt 71) — phần nối luật (`sim/gang.ts`) với màn hình.
//
// Tách khỏi `game/acts.ts` cho dễ đọc: `acts.talk()` chỉ cần một dòng `case` gọi vào đây. Mọi hàm nhận `host`
// (đối tượng có `D()` và `g`) để không phải import `Acts` (vòng import).
import { Game } from '../sim/state';
import { money } from '../core/util';
import { toast } from '../core/bus';
import { ctx } from './ctx';
import * as G from '../data/gang';
import { FIXED } from '../data/people';
import * as GG from '../sim/gang';

/** Câu mô tả ngắn dùng ngay trong nút hội thoại (“Băng Hẻm · bậc 2/6 …”). */
export const gangLine = (g: Game) => GG.gangLine(g);
import type { Npc } from './npc';

export interface Opt { t: string; sub?: string; off?: boolean; fn?: () => void; }
export interface TalkHost {
  g: Game;
  D(who: string, npc: Npc | undefined, text: string, opts: Opt[]): void;
}

/** Giọng của hai đại ca khi mở lời — khác nhau để hai phe không đọc như một người. */
const OPEN: Record<G.GangId, { none: string; member: string; other: string }> = {
  hem: {
    none: 'Đứng đây làm gì? Muốn vay thì nói, muốn theo tao thì phải có gan. Băng Hẻm này không nuôi người ăn không ngồi rồi.',
    member: 'Vô rồi thì lo làm việc. Việc trong sổ đó, làm xong tao trả tiền, uy tín lên thì tao cho lên bậc.',
    other: 'Mày đang theo băng Chợ Cá hả? Vậy thì đừng đứng lâu ở hẻm này.',
  },
  cho: {
    none: 'Sạp cá này nuôi cả chợ đó con. Muốn theo băng thì tối ghé, mà theo rồi thì đừng có phản.',
    member: 'Hàng về sớm, việc còn nhiều. Làm đủ thì bà cho lên, mà lỡ bị bắt thì bà không ra mặt đâu nghe chưa.',
    other: 'Con theo băng hẻm rồi hả? Vậy đừng mua bán gì ở sạp này nữa.',
  },
};

/**
 * Màn hình chính của một đại ca. Nội dung thay đổi theo: chưa theo băng / đang theo băng này / đang theo băng
 * kia — đúng ba tình huống người chơi có thể gặp, không có màn hình nào nói chuyện “chung chung”.
 */
export function gangMenu(host: TalkHost, gangId: G.GangId, n: Npc | undefined) {
  const g = host.g, def = G.GANGS[gangId], mine = GG.gangOf(g), bye: Opt = { t: 'Thôi, con đi.' };
  const open = OPEN[gangId];
  if (mine && mine !== gangId) {
    host.D(n?.name ?? def.name, n, open.other, [
      { t: 'Con xin lỗi, con đi ngay.', fn: () => ctx.npcs.leave?.(n!) },
      bye,
    ]);
    return;
  }
  if (!mine) {
    const canPay = g.cash >= def.fee;
    host.D(n?.name ?? def.name, n, open.none, [
      {
        t: `Xin theo băng — lễ ${money(def.fee)}`,
        sub: canPay ? `${def.name} · làm việc để lên bậc, chia phần theo bậc` : `Còn thiếu ${money(def.fee - g.cash)}`,
        off: !canPay,
        fn: () => {
          const r = GG.joinGang(g, gangId);
          if (r === 'ok') { toast(`Đã theo ${def.name}. Mở sổ việc ở chỗ đại ca.`, 'good', 'skull', true); }
          else if (r === 'poor') toast('Không đủ tiền lễ.', 'warn', 'cash');
          gangMenu(host, gangId, n);
        },
      },
      {
        t: 'Băng này làm những gì?',
        fn: () => host.D(n?.name ?? def.name, n, `${def.name} giữ địa bàn ${def.turf === 'cho' ? 'Chợ Xóm Chiều' : 'Xóm Lao Động'}. Việc gồm: ${G.GANG_JOB_LIST.map((j) => j.name.toLowerCase()).join(', ')}. Hàng cấm thì có ${G.CONTRA_LIST.map((c) => c.name.toLowerCase()).join(', ')} — bị bắt là phạt nặng, ngồi buồng, mất uy tín với phố. Theo thì theo, đừng phản.`, [
          { t: 'Để con suy nghĩ.', fn: () => gangMenu(host, gangId, n) },
          bye,
        ]),
      },
      bye,
    ]);
    return;
  }
  // ── Đã ở trong băng này ──
  // Lượt 71 (sửa sau khi tự thử bằng probe): bản đầu nhồi cả 5 việc + 6 mục vào MỘT hộp thoại rồi cắt còn 7 nút,
  // nên hai mục quan trọng nhất — **hàng cấm** và **phe phái** — bị cắt mất mà không ai thấy. Nay chia nhóm:
  // hộp thoại chính chỉ còn 6 mục, việc làm nằm trong sổ việc riêng.
  const rank = GG.rankOf(g), left = G.GANG_JOB_LIST.filter((j) => GG.jobLeft(g, j.id) > 0 && GG.jobWhy(g, j.id).ok).length;
  const opts: Opt[] = [
    { t: 'Sổ việc hôm nay', sub: left > 0 ? `${left} việc làm được ngay · bậc ${rank.tier}/6, ăn chia ${Math.round(rank.cut * 100)}%` : 'Hôm nay hết ca rồi, mai quay lại', fn: () => jobMenu(host, gangId, n) },
    { t: 'Hàng cấm của băng', sub: GG.stockValue(g) > 0 ? `Kho đang giữ ${money(GG.stockValue(g))}` : `Bậc ${rank.tier} — mở được ${G.CONTRA_LIST.filter((c) => c.minTier <= rank.tier).length}/4 món`, fn: () => contrabandMenu(host, gangId, n) },
    { t: 'Xem băng đảng chi tiết', sub: `${def.name} · ${def.turf === 'cho' ? 'Chợ Xóm Chiều' : 'Xóm Lao Động'}`, fn: () => detailScreen(host, gangId, n) },
    { t: 'Phe phái: ai đang đối đầu ai', sub: `${def.name} ↔ ${G.GANGS[def.rival].name}`, fn: () => rivalScreen(host, gangId, n) },
  ];
  const pw = GG.promoteWhy(g);
  if (GG.promoteNeed(g)) opts.push({
    t: pw.ok ? `Xin lên bậc — ${pw.next.name}` : 'Xin lên bậc',
    sub: pw.ok ? `Ăn chia ${Math.round(pw.next.cut * 100)}% · ${pw.next.perk}` : pw.why,
    off: !pw.ok,
    fn: () => {
      const r = GG.promote(g);
      if (!r) return;
      toast(`Lên bậc: ${r.name}! ${r.perk}`, 'good', 'star', true);
      gangMenu(host, gangId, n);
    },
  });
  if (rank.tier >= 6) {
    const turf = GG.turfPay(g);
    opts.push({
      t: turf > 0 ? `Nhận tiền bảo kê hôm nay — ${money(turf)}` : 'Tiền bảo kê hôm nay nhận rồi',
      off: turf <= 0,
      fn: () => { const p = GG.claimTurf(g); if (p) { toast(`Nhận ${money(p)} tiền bảo kê góc chợ.`, 'good', 'skull'); gangMenu(host, gangId, n); } },
    });
  }
  opts.push({
    t: 'Con muốn rửa tay, ra băng',
    sub: `Mất toàn bộ ${Math.round(g.gang?.respect ?? 0)} uy tín trong băng`,
    fn: () => host.D(n?.name ?? def.name, n, 'Ra thì ra, mà ra rồi đừng quay lại đây làm ăn. Mày chắc chưa?', [
      { t: 'Con chắc. Rửa tay.', fn: () => { GG.leaveGang(g); toast('Đã ra băng. Băng giữ hộ bao nhiêu hàng cấm thì mất hết.', 'info', 'skull'); } },
      { t: 'Thôi, con ở lại.', fn: () => gangMenu(host, gangId, n) },
    ]),
  });
  host.D(n?.name ?? def.name, n, `${OPEN[gangId].member}\n${GG.gangLine(g)} · kho hàng cấm: ${GG.stockValue(g) > 0 ? money(GG.stockValue(g)) : 'chưa có gì'}.`, [...opts, bye]);
}

/** Sổ việc: mỗi việc một nút, hiện tiền thực nhận, số ca còn lại và lý do khi chưa làm được. */
export function jobMenu(host: TalkHost, gangId: G.GangId, n: Npc | undefined) {
  const g = host.g, def = G.GANGS[gangId], rank = GG.rankOf(g);
  const opts: Opt[] = G.GANG_JOB_LIST.map((j) => {
    const chk = GG.jobWhy(g, j.id), left = GG.jobLeft(g, j.id);
    const pay = Math.round((j.pay * (1 - rank.cut)) / 1000) * 1000;
    return {
      t: `Làm: ${j.name}`,
      sub: chk.ok ? `${money(pay)} · ${j.mins} phút · +${j.respect} uy tín · còn ${left} ca hôm nay` : chk.why,
      off: !chk.ok,
      fn: () => {
        const r = GG.doJob(g, j.id);
        if (!r) { toast('Không làm được việc này lúc này.', 'warn'); return; }
        toast(`Xong việc: ${money(r.pay)}${r.got ? ` + ${r.got.n} ${contraName(r.got.id)}` : ''}.`, 'good', 'cash');
        jobMenu(host, gangId, n);
      },
    };
  });
  host.D(n?.name ?? def.name, n, `Sổ việc hôm nay. Làm xong tao trả tiền, uy tín lên thì tao cho lên bậc. Bậc ${rank.tier}/6, phần băng ăn ${Math.round(rank.cut * 100)}%.`, [
    ...opts,
    { t: 'Quay lại', fn: () => gangMenu(host, gangId, n) },
  ]);
}


/**
 * “Xem băng đảng chi tiết”: một màn hình đủ sáu thứ — tên băng, đại ca, địa bàn, bậc + uy tín hiện tại, toàn bộ
 * sáu bậc kèm quyền lợi, và phe đối đầu. Người chơi không phải mò từng menu để biết mình sắp được gì.
 */
export function detailScreen(host: TalkHost, gangId: G.GangId, n: Npc | undefined) {
  const g = host.g, def = G.GANGS[gangId], rank = GG.rankOf(g), rival = G.GANGS[def.rival];
  const board = G.GANG_RANKS.map((r) => `${r.tier <= rank.tier ? '✔' : '·'} ${r.tier}. ${r.name} (${r.respect} uy tín) — ${r.perk}`).join('\n');
  const head = `${def.name}\nĐại ca: ${bossName(gangId)} · Địa bàn: ${def.turf === 'cho' ? 'Chợ Xóm Chiều, sạp cá và dãy hàng khô' : 'Xóm Lao Động, hẻm sau khu trọ'}\nĐối đầu: ${rival.name}\nBậc của mày: ${rank.tier}/6 ${rank.name} · uy tín ${Math.round(g.gang?.respect ?? 0)} · đã làm ${g.gang?.paid ?? 0} chuyến\nPhần băng ăn: ${Math.round(rank.cut * 100)}% tiền công\n\nSáu bậc:\n${board}`;
  host.D(n?.name ?? def.name, n, head, [
    { t: 'Kho hàng cấm đang giữ', sub: GG.stockValue(g) > 0 ? `${money(GG.stockValue(g))} · ${Object.entries(GG.stockOf(g)).map(([id, k]) => `${k} ${contraName(id)}`).join(', ')}` : 'Kho trống', fn: () => contrabandMenu(host, gangId, n) },
    { t: 'Bảng án phạt hàng cấm', sub: `${G.CONTRA_LIST.length} món · bị bắt là phạt tiền theo giá trị hàng, cộng giờ tù`, fn: () => host.D(n?.name ?? def.name, n, `Bị khám thấy hàng thì phạt theo giá trị hàng, cộng giờ tạm giữ, cộng mất sạch kho.\n${G.CONTRA_LIST.map((c) => `• ${c.name} (bậc ${c.minTier}+): mua ${money(c.buy)}, băng thu lại ${money(c.sell)} — bị bắt phạt chừng ${money(Math.round(c.sell * c.fineMul / 1000) * 1000)}/món và ${c.jail} giờ tù.`).join('\n')}`, [
      { t: 'Hiểu rồi.', fn: () => gangMenu(host, gangId, n) },
    ]) },
    { t: 'Quay lại sổ việc', fn: () => gangMenu(host, gangId, n) },
    { t: 'Thôi, con đi.' },
  ]);
}

/** “Phe phái”: hai băng, ai giữ đâu, và người chơi đang đứng ở đâu giữa hai bên. */
export function rivalScreen(host: TalkHost, gangId: G.GangId, n: Npc | undefined) {
  const g = host.g, def = G.GANGS[gangId], rival = G.GANGS[def.rival];
  const mine = GG.gangOf(g), tier = GG.rankOf(g).tier;
  const rel = !mine ? 'Mày chưa theo bên nào — cả hai bên đều có thể nhận mày, nhưng đứng giữa thì không ai tin.'
    : mine === gangId ? `Mày đang ở phe ${def.name}. Đi qua địa bàn ${rival.name} thì đừng lộ mặt; đàn em bên đó nhớ mặt người phe mình.`
    : `Mày đang ở phe ${rival.name} — phe này coi mày là người bên kia.`;
  const body = `${def.name} — đại ca ${bossName(gangId)}, giữ ${def.turf === 'cho' ? 'Chợ Xóm Chiều' : 'Xóm Lao Động'}.\n${rival.name} — đại ca ${bossName(def.rival)}, giữ ${rival.turf === 'cho' ? 'Chợ Xóm Chiều' : 'Xóm Lao Động'}.\n\nHai băng đối đầu nhau giành mối hàng và bến bãi. ${rel}${tier >= 5 ? '\nBậc của mày đủ cao để bên kia phải nể — nhưng cũng đủ cao để bị để ý.' : ''}`;
  host.D(n?.name ?? def.name, n, body, [
    { t: 'Quay lại', fn: () => gangMenu(host, gangId, n) },
    { t: 'Thôi, con đi.' },
  ]);
}

/** Tên đại ca theo mã nhân vật — đọc từ danh sách nhân vật cố định để không phải chép tay hai lần. */
function bossName(gangId: G.GangId) { return FIXED[G.GANGS[gangId].boss]?.name ?? G.GANGS[gangId].name; }

/** Màn hình mua/bán hàng cấm: mỗi món một nút mua, một nút bán, kèm mức phạt nếu bị bắt. */
export function contrabandMenu(host: TalkHost, gangId: G.GangId, n: Npc | undefined) {
  const g = host.g, def = G.GANGS[gangId], rank = GG.rankOf(g), bye: Opt = { t: 'Thôi, quay lại.' };
  const opts: Opt[] = [], stock = GG.stockOf(g);
  for (const c of G.CONTRA_LIST) {
    const locked = rank.tier < c.minTier, have = stock[c.id] ?? 0;
    opts.push({
      t: `Mua ${c.name} — ${money(c.buy)}`,
      sub: locked ? `Bậc ${c.minTier} trở lên mới được đụng món này` : `${c.desc} Bị bắt: phạt chừng ${money(Math.round(c.sell * c.fineMul / 1000) * 1000)}/món, +${c.jail} giờ tù.`,
      off: locked || g.cash < c.buy,
      fn: () => {
        const r = GG.buyContraband(g, c.id, 1);
        if (r === 'ok') toast(`Mua 1 ${c.name.toLowerCase()}. Băng giữ hộ trong kho.`, 'info', 'box');
        else if (r === 'poor') toast('Không đủ tiền.', 'warn', 'cash');
        else toast('Bậc của mày chưa đụng được món này.', 'warn', 'skull');
        contrabandMenu(host, gangId, n);
      },
    });
    if (have > 0) opts.push({
      t: `Bán lại 1 ${c.name} — ${money(c.sell)}`, sub: `Đang giữ ${have} · bán hết thì kho sạch`, 
      fn: () => { const r = GG.sellContraband(g, c.id, 1); if (r.ok) { toast(`Bán được ${money(r.got)}.`, 'good', 'cash'); } contrabandMenu(host, gangId, n); },
    });
  }
  host.D(n?.name ?? def.name, n, `Hàng của băng. Băng giữ hộ trong kho, mày không phải chở trong túi — mà bị khám kho là cả hai cùng mất.\nĐang giữ: ${GG.stockValue(g) > 0 ? `${money(GG.stockValue(g))} (${Object.entries(stock).map(([id, k]) => `${k} ${contraName(id)}`).join(', ')})` : 'chưa có gì'}.`, [...opts.slice(0, 8), bye]);
}

/** Tên món hàng cấm viết thường — hàm nhỏ cho câu chữ ở trên gọn. */
export const contraName = (id: string) => G.CONTRABAND[id]?.name.toLowerCase() ?? id;
