import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });

// 실제로 보이는 높이(주소창 등을 뺀)를 --app-h 로 알려 준다. 100dvh 가 모자란 브라우저에서도 아래 여백·스크롤이 생기지 않게 한다.
// 카카오톡 등 인앱 브라우저는 visualViewport 가 실제 보이는 영역보다 작게 나오는 경우가 있어,
// 화면을 가득 채우는 고정 요소(body 와 같은 방식)의 실제 높이와 비교해 큰 값을 쓴다.
const probe = document.createElement('div');
probe.setAttribute('aria-hidden', 'true');
probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100%;visibility:hidden;pointer-events:none';
document.body.appendChild(probe);
function setAppHeight() {
  const h = Math.max(
    window.visualViewport?.height ?? 0,
    window.innerHeight,
    probe.getBoundingClientRect().height,
    document.documentElement.clientHeight,
  );
  document.documentElement.style.setProperty('--app-h', `${Math.round(h)}px`);
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);
window.visualViewport?.addEventListener('resize', setAppHeight);

// 배포 빌드에서만 서비스 워커 등록 (오프라인 실행·홈 화면 추가). 개발 서버에서는 등록하지 않는다.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 등록에 실패해도 게임은 그대로 동작한다 */
    });
  });
}
