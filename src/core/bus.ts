// Kênh sự kiện toàn cục: tách logic mô phỏng khỏi giao diện và âm thanh.
import { Emitter } from './util';

export type ToastKind = 'info' | 'good' | 'bad' | 'warn' | 'event';
export interface Toast { text: string; kind?: ToastKind; icon?: string; long?: boolean; }
export const bus = new Emitter<{
  toast: Toast;
  sfx: string;
  cash: number;            // số tiền vừa thay đổi (hiện số bay)
  save: string;            // yêu cầu lưu game (lý do)
  event: { id: string; on: boolean };
  weather: string;
  day: number;             // sang ngày mới
  bankrupt: void;
  ui: string;              // yêu cầu vẽ lại HUD/màn hình
  quest: number;
}>();
export const toast = (text: string, kind: ToastKind = 'info', icon?: string, long = false) => bus.emit('toast', { text, kind, icon, long });
export const sfx = (name: string) => bus.emit('sfx', name);
