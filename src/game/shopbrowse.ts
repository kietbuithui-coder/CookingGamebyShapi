// KHÁCH LỰA HÀNG Ở TIỆM NHỎ — người đi đường ghé tạp hoá / MiniMart, đi dọc kệ hàng thật trong tiệm,
// nhặt món này bỏ lại món kia, rồi ra quầy trả tiền. Người chơi đứng gần thì nghe họ nói giá, chê đắt,
// hoặc nhờ mình lấy giùm món trên kệ cao — mấy câu đó lấy đúng giá và đúng món tiệm đang bán.
import { ctx } from './ctx';
import type { Npc } from './npc';
import { ARCH, ArchDef } from '../data/people';
import { SHOPS } from '../data/shops';
import { INGS } from '../data/ingredients';
import { toast } from '../core/bus';
import { money, rnd } from '../core/util';
import { hourOf } from '../sim/state';
import { shopPrice } from '../sim/rules';
import { groundY } from '../world/layout';

/** Hai tiệm có khách vào lựa hàng: tạp hoá Cô Ba và MiniMart (đều là tiệm có kệ hàng thật trong nhà). */
const BROWSABLE = ['kiosk', 'mart'] as const;
/** Bao lâu thì có một khách ghé (giây), và tối đa bao nhiêu khách cùng lúc trong tiệm. */
const SPAWN_GAP = 26, MAX_BROWSERS = 2;
/** Đứng cách tiệm bao xa thì mới cho khách vào (mét). */
const NEAR_DIST = 26;

export interface Browser {
  n: Npc;
  shop: string;
  /** Điểm cần ghé theo thứ tự (kệ 1 → kệ 2 → quầy), đang ở điểm thứ `step`. */
  stops: [number, number][];
  step: number;
  /** Món định mua (id nguyên liệu) — chỉ để nói câu đúng món, không đụng vào kho thật. */
  pick: string;
  /** Đứng nói chuyện ở quầy bao lâu nữa (giây). */
  holdT: number;
}

/**
 * Khách đi lại trong tiệm nhỏ. Không bán gì cho họ (người chơi không phải chủ tiệm này) — mục đích là
 * làm tiệm có sự sống: có người lựa hàng, có tiếng trả giá, có người nhờ lấy đồ trên kệ cao.
 */
export class ShopBrowse {
  list: Browser[] = [];
  private t = 1.5;
  private cd = 8;

  reset() { for (const b of this.list) if (b.n.state !== 'gone') ctx.npcs.leave(b.n); this.list = []; this.t = 1.5; this.cd = 8; }

  update(dt: number) {
    const g = ctx.g;
    if (!g) return;
    this.t -= dt; this.cd -= dt;
    if (this.t > 0) { this.advance(dt); return; }
    this.t = 1.2;
    // chỉ chạy khi người chơi đứng gần một tiệm có kệ hàng
    const near = BROWSABLE.map((id) => ({ id, a: ctx.world.anchors['v_' + id] })).filter((x) => {
      const a = x.a; if (!a) return false;
      const d2 = (a.x - ctx.player.x) ** 2 + (a.z - ctx.player.z) ** 2;
      return d2 < NEAR_DIST * NEAR_DIST;
    })[0];
    if (!near) { if (this.list.length) this.reset(); return; }
    if (this.list.filter((b) => b.shop === near.id).length >= MAX_BROWSERS || this.cd > 0) { this.advance(dt); return; }
    this.cd = SPAWN_GAP;
    const h = hourOf(g), shop = SHOPS[near.id];
    if (h < shop.open[0] || h > shop.open[1]) { this.advance(dt); return; }
    this.spawn(near.id, shop.items.filter((id) => INGS[id]));
    this.advance(dt);
  }

  /** Gọi một người đi đường lại gần rồi cho vào tiệm theo lối cửa. */
  private spawn(shop: string, items: string[]) {
    const a = ctx.world.anchors['v_' + shop];
    if (!a) return;
    const arch: ArchDef = ARCH[rnd.pick(['hangrong', 'congnhan', 'phuhuynh', 'nguoigia', 'hocsinh', 'vanphong'] as const)];
    const n = ctx.npcs.spawnPed(a.x, a.z, 20, 46, arch);
    if (!n) return;
    const sp = a;
    // Đặt họ ngay trước cửa rồi đi bộ vào — không để họ lòi ra từ giữa kệ hàng.
    // (spawnPed chỉ bốc được nút đường ở vành xa nên phải dời lại, giống cách dựng người trông coi chi nhánh.)
    const dx = n.x - sp.x, dz = n.z - sp.z, dl = Math.hypot(dx, dz) || 1;
    n.x = sp.x + (dx / dl) * 2.6; n.z = sp.z + (dz / dl) * 2.6; n.y = groundY(n.x, n.z); n.rig.root.position.set(n.x, n.y, n.z);
    // ba điểm trong tiệm: hai đầu dãy kệ rồi ra quầy — đi bộ thật, không dịch chuyển tức thời
    const stops: [number, number][] = [[sp.x - 3.4, sp.z - 1.1], [sp.x + 3.2, sp.z - 1.4], [sp.x - 1.0, sp.z + 0.3]];
    n.kind = 'actor'; n.actor = 'browse'; n.state = 'walk'; n.timer = 1e9; n.greetT = 9999;
    const b: Browser = { n, shop, stops, step: 0, pick: items.length ? rnd.pick(items) : 'gao', holdT: 0 };
    this.list.push(b);
    ctx.npcs.goto(n, stops[0][0], stops[0][1], () => this.atStop(b));
  }

  private atStop(b: Browser) {
    const n = b.n;
    if (n.state === 'gone') return;
    b.step++;
    if (b.step >= b.stops.length) {
      // tới quầy: nói câu đúng món + đúng giá, đứng một chút rồi đi
      const ing = INGS[b.pick], shop = SHOPS[b.shop];
      // Giá nói ra là giá THẬT của tiệm hôm nay (cùng hàm giá mà quầy dùng), không phải con số viết sẵn.
      const price = shop ? shopPrice(ctx.g, shop, b.pick) : 0;
      const line = rnd.pick([
        `Cô ơi, ${ing?.name.toLowerCase() ?? 'món này'} nhiêu một ${ing?.unit ?? 'phần'} vậy?`,
        price ? `${ing?.name ?? 'Món này'} ${money(price)} hả cô? Đắt hơn tuần trước rồi.` : `${ing?.name ?? 'Món này'} còn tươi không cô?`,
        `Lấy cho con một ${ing?.unit ?? 'phần'} ${ing?.name.toLowerCase() ?? 'này'}, tính tiền luôn.`,
      ]);
      ctx.npcs.say(n, line, 3.4, 1);
      n.pose = 'idle'; n.state = 'stand'; n.timer = 7; b.holdT = 7;
      return;
    }
    const [x, z] = b.stops[b.step];
    ctx.npcs.goto(n, x, z, () => this.atStop(b));
  }

  /** Đứng ở quầy xong thì đi ra khỏi tiệm. */
  private advance(dt: number) {
    for (const b of this.list.slice()) {
      const n = b.n;
      if (n.state === 'gone') { this.list.splice(this.list.indexOf(b), 1); continue; }
      if (b.holdT > 0) {
        b.holdT -= dt;
        if (b.holdT <= 0) {
          // nói câu cảm ơn rồi rời tiệm như người đi đường bình thường
          ctx.npcs.say(n, rnd.pick(['Rồi, cô tính tiền giùm con.', 'Cảm ơn cô nghen.', 'Nhiêu đó đủ rồi cô.']), 2.4, 1);
          ctx.npcs.leave(n);
          this.list.splice(this.list.indexOf(b), 1);
        }
      }
    }
  }

  /**
   * Người chơi đứng cạnh một khách đang lựa hàng: thỉnh thoảng họ nhờ lấy giùm món trên kệ cao.
   * Trả về câu nhờ (hoặc null) để `acts` bày nút bấm — người chơi lấy giùm thì được uy tín nhẹ.
   */
  askNear(): { b: Browser; line: string } | null {
    const p = ctx.player;
    for (const b of this.list) {
      const n = b.n;
      if (n.state === 'gone' || n.data?.askedDay === ctx.g.day) continue;
      if ((n.x - p.x) ** 2 + (n.z - p.z) ** 2 > 2.6 * 2.6) continue;
      if (!rnd.chance(0.5)) continue;
      n.data = { ...(n.data ?? {}), askedDay: ctx.g.day };
      const ing = INGS[b.pick];
      return { b, line: `${ctx.g.ac === 'chị' ? 'Chị' : 'Anh'} ơi, lấy giùm tôi hộp ${ing?.name.toLowerCase() ?? 'này'} trên kệ cao với — tôi với không tới.` };
    }
    return null;
  }
}
