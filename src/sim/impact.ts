// VA CHẠM XE CỘ & ĐÒN ĐÁNH — tính toán thuần cấp độ va chạm (nhẹ / trung bình / nặng),
// lực hất văng, thời gian ngã/choáng và mức hao tổn sức khoẻ – tinh thần – vệ sinh.
import { clamp } from '../core/util';
import { Game, STAT_MAX } from './state';

export type HitTier = 'light' | 'medium' | 'heavy';
export type VehicleKind = 'bicycle' | 'moto' | 'car' | 'truck';

export interface VehicleHitSpec {
  tier: HitTier;
  hpLoss: number;
  moodLoss: number;
  hygLoss: number;
  knockSpeed: number;
  liftVy: number;
  stunSec: number;
  fallSec: number;
  shake: number;
  flash: number;
  label: string;
}

export interface CombatHitSpec {
  hpLoss: number;
  moodLoss: number;
  knockSpeed: number;
  liftVy: number;
  stunSec: number;
  shake: number;
  flash: number;
}

/** Phân loại mức độ khi bị xe đụng dựa theo loại xe, tốc độ và va chạm trực diện hay quẹt sượt. */
export function classifyVehicleHit(kind: VehicleKind, speed: number, grazing: boolean): VehicleHitSpec {
  if (kind === 'bicycle' || (kind === 'moto' && grazing)) {
    return {
      tier: 'light',
      hpLoss: kind === 'bicycle' ? 4 : 6,
      moodLoss: 3,
      hygLoss: 3,
      knockSpeed: 4.8,
      liftVy: 1.7,
      stunSec: 0.25,
      fallSec: 0,
      shake: 0.28,
      flash: 0.35,
      label: kind === 'bicycle' ? 'Va quẹt nhẹ với xe đạp!' : 'Bị xe máy quẹt sượt qua người!',
    };
  }
  if (kind === 'moto' || ((kind === 'car' || kind === 'truck') && grazing && speed < 8)) {
    return {
      tier: 'medium',
      hpLoss: kind === 'moto' ? 14 : 18,
      moodLoss: 7,
      hygLoss: 9,
      knockSpeed: 8.6,
      liftVy: 3.1,
      stunSec: 0.55,
      fallSec: 0.4,
      shake: 0.58,
      flash: 0.65,
      label: kind === 'moto' ? 'Bị xe máy tông văng ra lề!' : 'Bị ô tô quẹt mạnh văng qua một bên!',
    };
  }
  const truck = kind === 'truck';
  return {
    tier: 'heavy',
    hpLoss: truck ? 38 : 30,
    moodLoss: truck ? 14 : 11,
    hygLoss: truck ? 18 : 14,
    knockSpeed: truck ? 14.0 : 12.2,
    liftVy: truck ? 5.0 : 4.4,
    stunSec: truck ? 1.25 : 1.05,
    fallSec: truck ? 1.25 : 1.05,
    shake: 1.0,
    flash: 0.95,
    label: truck ? 'BỊ XE TẢI TÔNG VĂNG NẶNG!' : 'BỊ Ô TÔ ĐỤNG MẠNH, NGÃ LĂN RA ĐƯỜNG!',
  };
}

/** Thông số văng & sát thương khi bị người khác đánh (hoặc người chơi đấm trúng NPC). */
export function combatHitSpec(attacker: 'gang' | 'rowdy' | 'ped' | 'player', heavy = false): CombatHitSpec {
  switch (attacker) {
    case 'gang':
      return { hpLoss: 14, moodLoss: 7, knockSpeed: 7.8, liftVy: 2.6, stunSec: 0.55, shake: 0.62, flash: 0.7 };
    case 'rowdy':
      return { hpLoss: 9, moodLoss: 5, knockSpeed: 6.4, liftVy: 2.1, stunSec: 0.42, shake: 0.45, flash: 0.5 };
    case 'ped':
      return { hpLoss: 6, moodLoss: 4, knockSpeed: 5.5, liftVy: 1.85, stunSec: 0.35, shake: 0.36, flash: 0.4 };
    case 'player':
      return { hpLoss: 0, moodLoss: 0, knockSpeed: heavy ? 7.4 : 5.2, liftVy: heavy ? 2.4 : 1.55, stunSec: heavy ? 0.85 : 0.45, shake: 0, flash: 0 };
  }
}

export function applyVehicleImpactToStats(g: Game, spec: VehicleHitSpec): { fainted: boolean } {
  g.st.health = clamp(g.st.health - spec.hpLoss, 0, STAT_MAX);
  g.st.mood = clamp(g.st.mood - spec.moodLoss, 0, STAT_MAX);
  g.st.hygiene = clamp(g.st.hygiene - spec.hygLoss, 0, STAT_MAX);
  return { fainted: g.st.health <= 0 };
}

export function applyCombatImpactToStats(g: Game, spec: CombatHitSpec): { fainted: boolean } {
  g.st.health = clamp(g.st.health - spec.hpLoss, 0, STAT_MAX);
  g.st.mood = clamp(g.st.mood - spec.moodLoss, 0, STAT_MAX);
  return { fainted: g.st.health <= 0 };
}
