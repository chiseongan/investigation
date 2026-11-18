import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });

// 배포 빌드에서만 서비스 워커 등록 (오프라인 실행·홈 화면 추가). 개발 서버에서는 등록하지 않는다.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 등록에 실패해도 게임은 그대로 동작한다 */
    });
  });
}
