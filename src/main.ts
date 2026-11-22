import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });

// 실제로 보이는 높이(주소창 등을 뺀)를 --app-h 로 알려 준다. 100dvh 가 모자란 브라우저에서도 아래 여백·스크롤이 생기지 않게 한다.
function setAppHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight;
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
