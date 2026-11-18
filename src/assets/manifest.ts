// 에셋 매니페스트: 캐릭터·물건의 이미지/스프라이트 시트/프레임 수/기준점(발 위치)을 한 곳에서 관리한다.
// 지금은 SVG 플레이스홀더를 가리킨다. 나중에 실사풍 WebP 스프라이트 시트로 교체할 때는
// 이 파일의 src, frames, fps, frameW/H, anchor 만 바꾸면 된다. (가로로 프레임을 나란히 붙인 시트)
import me from './placeholders/me.svg';
import jiwoo from './placeholders/jiwoo.svg';
import minjun from './placeholders/minjun.svg';
import seoyeon from './placeholders/seoyeon.svg';
import doyun from './placeholders/doyun.svg';
import teacher from './placeholders/teacher.svg';
import daeun from './placeholders/daeun.svg';
import taeo from './placeholders/taeo.svg';
import desk from './placeholders/desk.svg';
import podium from './placeholders/podium.svg';
import bin from './placeholders/bin.svg';
import table from './placeholders/table.svg';
import locker from './placeholders/locker.svg';
import bench from './placeholders/bench.svg';
import longtable from './placeholders/longtable.svg';
import counter from './placeholders/counter.svg';
import mat from './placeholders/mat.svg';
import sofa from './placeholders/sofa.svg';
import plant from './placeholders/plant.svg';
import kid1 from './placeholders/kid1.svg';
import kid2 from './placeholders/kid2.svg';

export type SpriteState = 'idle' | 'walk' | 'talk';

export interface Sheet {
  src: string;
  frames: number; // 가로로 나란히 붙은 프레임 수
  fps: number;
}

export interface SpriteDef {
  frameW: number;
  frameH: number;
  /** 발 위치(칸 중심에 놓일 점), 프레임 좌상단 기준 px */
  anchor: { x: number; y: number };
  sheets: Partial<Record<SpriteState, Sheet>> & { idle: Sheet };
}

const still = (src: string): Sheet => ({ src, frames: 1, fps: 1 });

const person = (src: string): SpriteDef => ({
  frameW: 48,
  frameH: 84,
  anchor: { x: 24, y: 80 },
  sheets: { idle: still(src), walk: still(src), talk: still(src) },
});

const prop = (src: string): SpriteDef => ({
  frameW: 60,
  frameH: 70,
  anchor: { x: 30, y: 50 },
  sheets: { idle: still(src) },
});

export const MANIFEST: Record<string, SpriteDef> = {
  me: person(me),
  jiwoo: person(jiwoo),
  minjun: person(minjun),
  seoyeon: person(seoyeon),
  doyun: person(doyun),
  teacher: person(teacher),
  daeun: person(daeun),
  taeo: person(taeo),
  desk: prop(desk),
  podium: prop(podium),
  bin: prop(bin),
  table: prop(table),
  locker: prop(locker),
  bench: prop(bench),
  longtable: prop(longtable),
  counter: prop(counter),
  mat: prop(mat),
  sofa: prop(sofa),
  plant: prop(plant),
  kid1: person(kid1),
  kid2: person(kid2),
};
