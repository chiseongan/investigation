// 장소별 타일맵, 가구·인물 배치, 요일별 장면. 칸 좌표는 (c = 열, r = 행).
import type { CharId } from './characters';

export type SlotId = 'arrive' | 'break' | 'lunch' | 'pe' | 'chat';
/** 하루의 시간 순서. 지나간 시간대로는 돌아갈 수 없다. */
export const SLOT_ORDER: SlotId[] = ['arrive', 'break', 'lunch', 'pe', 'chat'];
export const SLOT_LABEL: Record<SlotId, string> = {
  arrive: '등교',
  break: '쉬는 시간',
  lunch: '점심',
  pe: '체육',
  chat: '방과 후 단톡방',
};

export interface Placed {
  id: string;
  sprite: string;
  c: number;
  r: number;
  label: string;
  /** npc: 말 걸기(!) / object: 살펴보기(반짝임) / prop: 장식(이동 불가) */
  kind: 'npc' | 'object' | 'prop';
  /** ink knot 이름. 없으면 상호작용 불가 */
  knot?: string;
  char?: CharId;
  /** 목격 장면: 말을 걸지 않고 지켜보는 인물들 (대화형 무대에 이 인물들이 서 있다) */
  cast?: CharId[];
}

export interface WallItem {
  side: 'left' | 'right';
  s1: number;
  s2: number;
  h1: number;
  h2: number;
  kind: 'window' | 'board' | 'clock' | 'notice' | 'door' | 'poster' | 'hoop';
}

export interface RoomDef {
  id: string;
  name: string;
  /** 바닥은 size × size 칸 (메신저 화면은 0) */
  size: number;
  floor?: [string, string];
  wall?: { left: string; right: string };
  walls: WallItem[];
  furniture: Placed[]; // 모든 장면 공통
}

export interface SceneDef {
  id: string;
  room: string;
  slot: SlotId;
  /** 'messenger' 면 쿼터뷰 대신 메신저 화면, knot 에서 시작 */
  kind?: 'iso' | 'messenger';
  knot?: string;
  start: { c: number; r: number };
  items: Placed[];
}

const prop = (id: string, sprite: string, c: number, r: number, label: string): Placed => ({ id, sprite, c, r, label, kind: 'prop' });
const npc = (sprite: CharId, c: number, r: number, label: string, knot: string, id = sprite): Placed => ({ id, sprite, char: sprite, c, r, label, kind: 'npc', knot });
/** 지나가며 목격하는 장면: 대화 상대 없이 일어나는 일을 본다 */
const watch = (id: string, c: number, r: number, label: string, knot: string, cast: CharId[]): Placed => ({ id, sprite: 'table', c, r, label, kind: 'object', knot, cast });
const kid = (id: string, sprite: 'kid1' | 'kid2', c: number, r: number): Placed => prop(id, sprite, c, r, '친구');

export const ROOMS: Record<string, RoomDef> = {
  classroom: {
    id: 'classroom',
    name: '교실',
    size: 10,
    walls: [
      { side: 'right', s1: 2.0, s2: 7.0, h1: 36, h2: 98, kind: 'board' },
      { side: 'right', s1: 7.8, s2: 8.7, h1: 92, h2: 114, kind: 'clock' },
      { side: 'left', s1: 1.0, s2: 3.0, h1: 40, h2: 102, kind: 'window' },
      { side: 'left', s1: 3.6, s2: 5.6, h1: 40, h2: 102, kind: 'window' },
      { side: 'left', s1: 6.2, s2: 8.2, h1: 40, h2: 102, kind: 'window' },
      { side: 'left', s1: 8.6, s2: 9.8, h1: 40, h2: 90, kind: 'notice' },
    ],
    furniture: [
      // 책상 3×3 (복도는 짝수 행·홀수 열)
      ...[2, 4, 6].flatMap((c) => [3, 5, 7].map((r) => prop(`desk_${c}_${r}`, 'desk', c, r, '책상'))),
      prop('podium', 'podium', 4, 0, '교탁'),
      prop('bin', 'bin', 9, 1, '쓰레기통'),
      prop('bin2', 'bin', 0, 9, '쓰레기통'),
    ],
  },
  hallway: {
    id: 'hallway',
    name: '복도',
    size: 8,
    floor: ['#E3DED2', '#EAE5DA'],
    wall: { left: '#D9D5CB', right: '#E7E3DA' },
    walls: [
      { side: 'right', s1: 3.4, s2: 4.6, h1: 0, h2: 88, kind: 'door' },
      { side: 'right', s1: 5.6, s2: 6.8, h1: 50, h2: 100, kind: 'poster' },
      { side: 'left', s1: 0.8, s2: 2.8, h1: 40, h2: 102, kind: 'window' },
      { side: 'left', s1: 3.6, s2: 5.6, h1: 40, h2: 102, kind: 'window' },
      { side: 'left', s1: 6.2, s2: 7.6, h1: 44, h2: 98, kind: 'notice' },
    ],
    furniture: [
      ...[1, 2, 3, 5, 6].map((c) => prop(`locker_${c}`, 'locker', c, 0, '사물함')),
      prop('bench1', 'bench', 6, 4, '벤치'),
      prop('bench2', 'bench', 6, 5, '벤치'),
      prop('plant', 'plant', 0, 7, '화분'),
    ],
  },
  cafeteria: {
    id: 'cafeteria',
    name: '급식실',
    size: 8,
    floor: ['#EADFC9', '#F1E8D5'],
    wall: { left: '#E3D9C4', right: '#EFE6D2' },
    walls: [
      { side: 'right', s1: 1.6, s2: 6.4, h1: 40, h2: 92, kind: 'notice' },
      { side: 'left', s1: 0.8, s2: 2.8, h1: 40, h2: 102, kind: 'window' },
      { side: 'left', s1: 3.6, s2: 5.6, h1: 40, h2: 102, kind: 'window' },
      { side: 'left', s1: 6.2, s2: 7.6, h1: 40, h2: 102, kind: 'clock' },
    ],
    furniture: [
      ...[2, 3, 4, 5].map((c) => prop(`counter_${c}`, 'counter', c, 0, '배식대')),
      ...[2, 5].flatMap((r) => [2, 3, 5, 6].map((c) => prop(`table_${c}_${r}`, 'longtable', c, r, '식탁'))),
    ],
  },
  gym: {
    id: 'gym',
    name: '체육관',
    size: 10,
    floor: ['#E4C79A', '#EBD0A5'],
    wall: { left: '#D6DCE8', right: '#E3E8F0' },
    walls: [
      { side: 'right', s1: 3.5, s2: 6.5, h1: 60, h2: 100, kind: 'hoop' },
      { side: 'left', s1: 1.0, s2: 3.5, h1: 50, h2: 104, kind: 'window' },
      { side: 'left', s1: 4.5, s2: 7.0, h1: 50, h2: 104, kind: 'window' },
      { side: 'right', s1: 8.0, s2: 9.4, h1: 50, h2: 96, kind: 'notice' },
    ],
    furniture: [
      prop('bench_1', 'bench', 0, 2, '벤치'),
      prop('bench_2', 'bench', 0, 3, '벤치'),
      prop('bench_3', 'bench', 0, 4, '벤치'),
      ...[5, 6].flatMap((c) => [5, 6].map((r) => prop(`mat_${c}_${r}`, 'mat', c, r, '매트'))),
    ],
  },
  counseling: {
    id: 'counseling',
    name: '상담실',
    size: 6,
    floor: ['#E6DCCB', '#EDE4D4'],
    wall: { left: '#DCD3C4', right: '#EAE2D4' },
    walls: [
      { side: 'right', s1: 1.0, s2: 3.0, h1: 46, h2: 96, kind: 'poster' },
      { side: 'left', s1: 1.0, s2: 3.0, h1: 40, h2: 100, kind: 'window' },
      { side: 'left', s1: 3.8, s2: 5.2, h1: 44, h2: 92, kind: 'notice' },
    ],
    furniture: [
      prop('sofa1', 'sofa', 4, 2, '소파'),
      prop('sofa2', 'sofa', 4, 3, '소파'),
      prop('desk', 'desk', 1, 1, '책상'),
      prop('plant', 'plant', 0, 5, '화분'),
    ],
  },
  chat: { id: 'chat', name: '단톡방', size: 0, walls: [], furniture: [] },
};

export const SCENES: Record<string, SceneDef> = {
  // ---------- 월 ----------
  mon_arrive: {
    id: 'mon_arrive', room: 'classroom', slot: 'arrive', start: { c: 8, r: 9 },
    items: [
      npc('jiwoo', 2, 4, '지우', 'arrive_jiwoo'),
      npc('taeo', 5, 4, '태오', 'arrive_taeo'),
      npc('minjun', 6, 4, '민준', 'arrive_minjun'),
      watch('door', 9, 5, '교실 문 앞', 'arrive_watch_door', ['daeun', 'seoyeon']),
      npc('teacher', 6, 1, '담임 선생님', 'arrive_teacher'),
    ],
  },
  mon_break: {
    id: 'mon_break', room: 'classroom', slot: 'break', start: { c: 8, r: 9 },
    items: [
      npc('jiwoo', 1, 6, '지우', 'break_jiwoo'),
      npc('seoyeon', 3, 8, '서연', 'break_seoyeon'),
      npc('daeun', 7, 4, '다은', 'break_daeun'),
      npc('minjun', 8, 4, '민준', 'break_minjun'),
      npc('taeo', 5, 2, '태오', 'break_taeo_daily'),
    ],
  },
  mon_lunch: {
    id: 'mon_lunch', room: 'classroom', slot: 'lunch', start: { c: 8, r: 9 },
    items: [
      { id: 'corner', sprite: 'table', c: 0, r: 8, label: '구석 자리', kind: 'object', knot: 'lunch_corner', cast: ['jiwoo'] },
      npc('jiwoo', 1, 8, '지우', 'lunch_jiwoo'),
      npc('seoyeon', 5, 8, '서연', 'lunch_seoyeon'),
      npc('daeun', 3, 2, '다은', 'lunch_daeun_daily'),
      npc('minjun', 7, 4, '민준', 'lunch_minjun'),
      watch('tray', 9, 7, '식판 반납대', 'lunch_watch_tray', ['seoyeon', 'jiwoo']),
    ],
  },
  // ---------- 화 ----------
  tue_arrive: {
    id: 'tue_arrive', room: 'hallway', slot: 'arrive', start: { c: 6, r: 7 },
    items: [
      npc('taeo', 3, 3, '태오', 'tue_arrive_taeo'),
      npc('daeun', 4, 3, '다은', 'tue_arrive_daeun'),
      npc('doyun', 2, 5, '도윤', 'tue_arrive_doyun'),
      npc('teacher', 1, 3, '담임 선생님', 'tue_arrive_teacher'),
      kid('kid_a', 'kid1', 4, 6),
    ],
  },
  tue_break: {
    id: 'tue_break', room: 'classroom', slot: 'break', start: { c: 8, r: 9 },
    items: [
      npc('minjun', 7, 4, '민준', 'tue_break_minjun'),
      npc('jiwoo', 1, 6, '지우', 'tue_break_jiwoo'),
      npc('seoyeon', 3, 8, '서연', 'tue_break_seoyeon'),
      kid('kid_a', 'kid1', 8, 4),
      kid('kid_b', 'kid2', 7, 5),
      watch('win', 9, 3, '창가', 'tue_break_watch_window', ['doyun']),
    ],
  },
  tue_lunch: {
    id: 'tue_lunch', room: 'cafeteria', slot: 'lunch', start: { c: 7, r: 7 },
    items: [
      npc('jiwoo', 1, 5, '지우', 'tue_lunch_jiwoo'),
      npc('doyun', 4, 4, '도윤', 'tue_lunch_doyun'),
      npc('minjun', 4, 2, '민준', 'tue_lunch_minjun'),
      npc('taeo', 1, 2, '태오', 'tue_lunch_taeo_daily'),
      kid('kid_a', 'kid1', 7, 2),
      kid('kid_b', 'kid2', 7, 3),
    ],
  },
  tue_pe: {
    id: 'tue_pe', room: 'gym', slot: 'pe', start: { c: 8, r: 9 },
    items: [
      { id: 'bag', sprite: 'table', c: 0, r: 6, label: '체육복 가방', kind: 'object', knot: 'tue_pe_bag' },
      npc('jiwoo', 1, 5, '지우', 'tue_pe_jiwoo'),
      npc('seoyeon', 6, 3, '서연', 'tue_pe_seoyeon'),
      watch('ball', 8, 2, '공 주고받는 둘', 'tue_pe_watch_ball', ['minjun', 'taeo']),
      kid('kid_a', 'kid1', 7, 7),
      kid('kid_b', 'kid2', 8, 6),
    ],
  },
  // ---------- 수 ----------
  wed_break: {
    id: 'wed_break', room: 'hallway', slot: 'break', start: { c: 6, r: 7 },
    items: [
      npc('seoyeon', 3, 4, '서연', 'wed_break_seoyeon'),
      npc('doyun', 5, 2, '도윤', 'wed_break_doyun'),
      npc('taeo', 1, 3, '태오', 'wed_break_taeo_daily'),
      kid('kid_a', 'kid2', 2, 2),
    ],
  },
  wed_lunch: {
    id: 'wed_lunch', room: 'cafeteria', slot: 'lunch', start: { c: 7, r: 7 },
    items: [
      npc('doyun', 4, 4, '도윤', 'wed_lunch_doyun'),
      npc('seoyeon', 4, 6, '서연', 'wed_lunch_seoyeon'),
      npc('minjun', 4, 2, '민준', 'wed_lunch_minjun'),
      watch('phone', 1, 2, '급식 줄', 'wed_lunch_watch_phone', ['daeun']),
      kid('kid_a', 'kid1', 7, 2),
    ],
  },
  wed_chat: { id: 'wed_chat', room: 'chat', slot: 'chat', kind: 'messenger', knot: 'wed_chat', start: { c: 0, r: 0 }, items: [] },
  // ---------- 목 ----------
  thu_break: {
    id: 'thu_break', room: 'hallway', slot: 'break', start: { c: 6, r: 7 },
    items: [
      npc('seoyeon', 3, 4, '서연', 'thu_break_seoyeon'),
      npc('teacher', 5, 3, '담임 선생님', 'thu_break_teacher'),
      watch('alone', 1, 3, '복도 창가', 'thu_break_watch_alone', ['minjun']),
    ],
  },
  thu_lunch: {
    id: 'thu_lunch', room: 'cafeteria', slot: 'lunch', start: { c: 7, r: 7 },
    items: [
      npc('daeun', 1, 2, '다은', 'thu_lunch_daeun_daily'),
      npc('doyun', 4, 4, '도윤', 'thu_lunch_doyun'),
      npc('seoyeon', 4, 6, '서연', 'thu_lunch_seoyeon'),
    ],
  },
  thu_pe: {
    id: 'thu_pe', room: 'counseling', slot: 'pe', start: { c: 5, r: 5 },
    items: [npc('jiwoo', 3, 2, '지우', 'thu_pe_jiwoo')],
  },
  // ---------- 금 ----------
  fri_arrive: {
    id: 'fri_arrive', room: 'hallway', slot: 'arrive', start: { c: 6, r: 7 },
    items: [
      npc('teacher', 5, 3, '담임 선생님', 'fri_teacher'),
      npc('seoyeon', 3, 4, '서연', 'fri_seoyeon'),
      watch('locker', 1, 3, '사물함 앞', 'fri_arrive_watch_locker', ['doyun', 'jiwoo']),
    ],
  },
  fri_break: {
    id: 'fri_break', room: 'classroom', slot: 'break', start: { c: 8, r: 9 },
    items: [
      npc('minjun', 8, 4, '민준', 'fri_minjun'),
      npc('jiwoo', 1, 6, '지우', 'fri_jiwoo'),
      npc('taeo', 5, 2, '태오', 'fri_break_taeo_daily'),
    ],
  },
};

export interface DayDef {
  id: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
  label: string;
  /** 시간대 선택지 → 장면 id */
  scenes: Partial<Record<SlotId, string>>;
}

export const DAYS: DayDef[] = [
  { id: 'mon', label: '월요일', scenes: { arrive: 'mon_arrive', break: 'mon_break', lunch: 'mon_lunch' } },
  { id: 'tue', label: '화요일', scenes: { arrive: 'tue_arrive', break: 'tue_break', lunch: 'tue_lunch', pe: 'tue_pe' } },
  { id: 'wed', label: '수요일', scenes: { break: 'wed_break', lunch: 'wed_lunch', chat: 'wed_chat' } },
  { id: 'thu', label: '목요일', scenes: { break: 'thu_break', lunch: 'thu_lunch', pe: 'thu_pe' } },
  { id: 'fri', label: '금요일', scenes: { arrive: 'fri_arrive', break: 'fri_break' } },
];

/** 오늘 아직 갈 수 있는 시간대: 이미 본 시간대와 그보다 이른 시간대는 지나간 것으로 본다. */
export function availableSlots(day: DayDef, used: SlotId[]): SlotId[] {
  const lastIdx = Math.max(-1, ...used.map((u) => SLOT_ORDER.indexOf(u)));
  // 앞 시간대를 탐색해야 다음 시간대가 열린다: 지금 열리는 시간대는 항상 하나뿐.
  const next = SLOT_ORDER.find((s) => s in day.scenes && SLOT_ORDER.indexOf(s) > lastIdx);
  return next ? [next] : [];
}
