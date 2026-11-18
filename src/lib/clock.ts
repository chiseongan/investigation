// 하루 타이머. requestAnimationFrame 기반, 일시정지 가능. setInterval 사용 금지.
export type FrameListener = (frac: number, remainSec: number) => void;

export class DayClock {
  elapsed = 0; // 초
  private paused = true;
  private raf = 0;
  private last = 0;
  private listeners = new Set<FrameListener>();
  private ended = false;

  constructor(
    public duration: number,
    private onEnd: () => void,
  ) {}

  onFrame(fn: FrameListener) {
    this.listeners.add(fn);
    fn(this.frac, this.remain);
    return () => this.listeners.delete(fn);
  }

  get frac() {
    return Math.min(1, this.elapsed / this.duration);
  }
  get remain() {
    return Math.max(0, Math.ceil(this.duration - this.elapsed));
  }

  setPaused(p: boolean) {
    if (this.ended || p === this.paused) return;
    this.paused = p;
    if (!p) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.loop);
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  stop() {
    this.ended = true;
    this.paused = true;
    cancelAnimationFrame(this.raf);
    this.listeners.clear();
  }

  private loop = (t: number) => {
    if (this.paused || this.ended) return;
    if (this.last) {
      // 탭이 숨겨졌다 돌아온 경우 등 큰 값은 잘라서 시간이 한꺼번에 사라지지 않게 한다
      this.elapsed += Math.min(0.1, (t - this.last) / 1000);
    }
    this.last = t;
    for (const fn of this.listeners) fn(this.frac, this.remain);
    if (this.elapsed >= this.duration) {
      this.ended = true;
      this.onEnd();
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };
}
