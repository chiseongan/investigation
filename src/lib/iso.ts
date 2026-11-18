// 쿼터뷰(아이소메트릭) 투영, 깊이 정렬, 이동 가능 판정, 경로 탐색
// 방 크기 n×n 은 선택 사항(기본 6). n=6 이면 원래 기준(390×470, 원점 195,200)과 같다.
export const TILE_W = 60;
export const TILE_H = 30;
export const GRID = 6;
export const WALL_H = 130;
const ORIGIN_Y = 200;

export interface Cell {
  c: number;
  r: number;
}

/** n×n 방의 월드 크기와 원점 */
export function geom(n = GRID) {
  return { n, ox: n * (TILE_W / 2) + 15, oy: ORIGIN_Y, w: n * TILE_W + 30, h: ORIGIN_Y + n * TILE_H + 90 };
}

export const key = (c: number, r: number) => `${c},${r}`;

/** 칸 중심 좌표 */
export function cellCenter(c: number, r: number, n = GRID) {
  const g = geom(n);
  return { x: g.ox + (c - r) * (TILE_W / 2), y: g.oy + (c + r) * (TILE_H / 2) + TILE_H / 2 };
}

/** 월드 좌표 → 칸. 바닥 밖이면 null */
export function pointToCell(x: number, y: number, n = GRID): Cell | null {
  const g = geom(n);
  const u = (x - g.ox) / (TILE_W / 2); // c - r
  const v = (y - g.oy - TILE_H / 2) / (TILE_H / 2); // c + r
  const c = Math.round((u + v) / 2) || 0;
  const r = Math.round((v - u) / 2) || 0;
  if (c < 0 || r < 0 || c >= n || r >= n) return null;
  return { c, r };
}

/** z-index: 물건 2×(c+r), 인물 2×(c+r)+1 */
export const depthObject = (c: number, r: number) => 2 * (c + r);
export const depthActor = (c: number, r: number) => 2 * (c + r) + 1;

export function inBounds(c: number, r: number, n = GRID) {
  return c >= 0 && r >= 0 && c < n && r < n;
}

/** 4방향 BFS. blocked 는 "c,r" 문자열 집합. 반환 경로에는 시작 칸이 빠지고 목표 칸이 포함된다. */
export function findPath(start: Cell, goal: Cell, blocked: Set<string>, n = GRID): Cell[] | null {
  if (start.c === goal.c && start.r === goal.r) return [];
  if (blocked.has(key(goal.c, goal.r)) || !inBounds(goal.c, goal.r, n)) return null;
  const prev = new Map<string, Cell | null>([[key(start.c, start.r), null]]);
  const queue: Cell[] = [start];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi];
    for (const [dc, dr] of dirs) {
      const nx = { c: cur.c + dc, r: cur.r + dr };
      const k = key(nx.c, nx.r);
      if (!inBounds(nx.c, nx.r, n) || blocked.has(k) || prev.has(k)) continue;
      prev.set(k, cur);
      if (nx.c === goal.c && nx.r === goal.r) {
        const path: Cell[] = [];
        let p: Cell | null = nx;
        while (p && !(p.c === start.c && p.r === start.r)) {
          path.unshift(p);
          p = prev.get(key(p.c, p.r)) ?? null;
        }
        return path;
      }
      queue.push(nx);
    }
  }
  return null;
}

/** 바로 옆 칸(대각선 포함)인가 */
export function isAdjacent(a: Cell, b: Cell) {
  const dc = Math.abs(a.c - b.c);
  const dr = Math.abs(a.r - b.r);
  return (dc !== 0 || dr !== 0) && dc <= 1 && dr <= 1;
}

/** target 바로 옆의 갈 수 있는 칸 중 가장 가까운 칸 (이미 옆이면 현재 칸) */
export function nearestStandCell(target: Cell, from: Cell, blocked: Set<string>, n = GRID): Cell | null {
  if (isAdjacent(from, target)) return from;
  let best: Cell | null = null;
  let bestLen = Infinity;
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (dc === 0 && dr === 0) continue;
      const nb = { c: target.c + dc, r: target.r + dr };
      if (!inBounds(nb.c, nb.r, n) || blocked.has(key(nb.c, nb.r))) continue;
      const p = findPath(from, nb, blocked, n);
      if (p && p.length < bestLen) {
        best = nb;
        bestLen = p.length;
      }
    }
  }
  return best;
}

/** 벽면 사각형 꼭짓점. side 'right' = 행 0쪽 뒷벽, 'left' = 열 0쪽 뒷벽. s: 벽을 따라 칸 단위, h: 바닥에서 높이(px) */
export function wallQuad(side: 'left' | 'right', s1: number, s2: number, h1: number, h2: number, n = GRID): string {
  const g = geom(n);
  const sign = side === 'right' ? 1 : -1;
  const x = (s: number) => g.ox + sign * (TILE_W / 2) * s;
  const y = (s: number) => g.oy + (TILE_H / 2) * s;
  return [
    [x(s1), y(s1) - h2],
    [x(s2), y(s2) - h2],
    [x(s2), y(s2) - h1],
    [x(s1), y(s1) - h1],
  ]
    .map((p) => p.join(','))
    .join(' ');
}

/** 칸 마름모 꼭짓점 (SVG polygon points) */
export function tilePoints(c: number, r: number, n = GRID): string {
  const { x, y } = cellCenter(c, r, n);
  return `${x},${y - TILE_H / 2} ${x + TILE_W / 2},${y} ${x},${y + TILE_H / 2} ${x - TILE_W / 2},${y}`;
}

/** 카메라 이동 범위 제한: 월드가 뷰보다 크면 가장자리 여백(margin)까지만, 작으면 가운데 */
export function clampPan(t: number, view: number, world: number, zoom: number, margin = 80): number {
  const size = world * zoom;
  if (size + 2 * margin <= view) return (view - size) / 2;
  return Math.min(margin, Math.max(view - size - margin, t));
}
