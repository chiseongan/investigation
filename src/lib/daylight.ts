// 하루의 빛깔: 하루 안의 위치 t(0 = 이른 아침, 1 = 저녁)에 따라 배경 위에 덮는 색을 정한다.
// 멈춰 있는 값만 계산하고, 화면에서는 투명도(opacity)로만 바꾼다.
type Stop = { t: number; rgb: [number, number, number]; a: number };

const STOPS: Stop[] = [
  { t: 0.0, rgb: [255, 217, 168], a: 0.24 }, // 이른 아침: 따뜻하고 옅은 빛
  { t: 0.2, rgb: [255, 240, 204], a: 0.1 },
  { t: 0.45, rgb: [255, 255, 255], a: 0.0 }, // 한낮: 그대로
  { t: 0.7, rgb: [255, 199, 122], a: 0.2 }, // 오후: 노란빛
  { t: 0.88, rgb: [120, 90, 140], a: 0.3 }, // 해 질 녘
  { t: 1.0, rgb: [38, 53, 107], a: 0.42 }, // 저녁
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function daylight(t: number): string {
  const x = clamp01(t);
  let i = 0;
  while (i < STOPS.length - 2 && x > STOPS[i + 1].t) i++;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const k = clamp01((x - a.t) / (b.t - a.t));
  const mix = (p: number, q: number) => p + (q - p) * k;
  const [r, g, bl] = [0, 1, 2].map((n) => Math.round(mix(a.rgb[n], b.rgb[n])));
  return `rgba(${r}, ${g}, ${bl}, ${mix(a.a, b.a).toFixed(3)})`;
}

/** 하루 안의 위치: 몇 번째 시간대(0부터)인지와 그 안의 진행(0~1)을 합쳐 0~1로. */
export function dayProgress(slotIndex: number, slotCount: number, within: number): number {
  return clamp01((slotIndex + clamp01(within)) / Math.max(1, slotCount));
}
