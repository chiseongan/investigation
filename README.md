# 잠입 수사: 2학년 2반의 일주일

학교폭력 예방 교육(4차시 중 4차시)을 위한 1인용 웹 게임입니다. 전학생으로 위장한 수사관이 월~목요일에 단서를 모으고 금요일에 최종 보고를 합니다. 휴대폰·태블릿에서 약 30분 동안 플레이하도록 만들었습니다.

> 등장하는 학교와 인물은 모두 가상입니다. 로그인과 개인정보 수집이 없습니다.

## 진행 상황
- 1단계: 뼈대 + 월요일 (완료)
- 2단계: 화~목요일, 장소 이동, 단톡방 메신저, 수사 보드 (완료)
- 3단계: 금요일 최종 보고, 엔딩 4개, 되감기, 조치 카드, 10년 타임라인, 회복 장면, 결과 코드 (완료)
- 4단계: 성능 점검, PWA(오프라인·홈 화면 추가), 이어하기, 배포, QR (코드 완료 · 실기기 점검 필요)

## 플레이 방식 두 가지
시작 화면(수사관 임명)에서 고릅니다. 대본·단서·엔딩은 같고 화면만 다릅니다.
- **탐색형**: 쿼터뷰 교실을 걸어 다니며 인물 옆에서 대화합니다.
- **대화형(비주얼노벨)**: 배경 위에 인물 그림이 서 있고, 인물을 눌러 대사창으로 대화합니다. 화면은 `src/components/VNScene.svelte`, 방식은 저장되어 이어하기에도 유지됩니다.

## 기술
Vite + TypeScript + Svelte 5, 대본은 Ink(inkjs)로 작성했습니다. 아이소메트릭 룸은 DOM과 CSS transform으로 그립니다. 배포 크기는 약 0.34MB(gzip 전)입니다.

## 실행
```bash
npm install
npm run dev      # 같은 와이파이의 휴대폰에서 http://<PC의 IPv4>:5173
npm test         # vitest
npm run check    # svelte-check
npm run build    # dist/ 생성 (서비스 워커 sw.js 포함)
npm run preview  # 빌드 결과 확인 (http://<PC의 IPv4>:4173)
```

대본은 `src/story/*.ink`, 방과 장면 배치는 `src/data/rooms.ts`, 단서는 `src/data/clues.ts`, 엔딩·판정은 `src/data/endings.ts`, 조치 카드는 `src/data/penalties.ts`에서 고칠 수 있습니다.

## 배포 (GitHub Pages)
1. 저장소 Settings → Pages → Source 를 **GitHub Actions** 로 선택합니다.
2. `main` 에 푸시하면 `.github/workflows/deploy.yml` 이 검사·테스트·빌드 후 배포합니다.
3. 주소: `https://<계정>.github.io/<저장소>/` (이 저장소는 `https://chiseongan.github.io/investigation/`)

## QR 코드
```bash
node scripts/make-qr.mjs                  # 기본 주소
node scripts/make-qr.mjs https://내주소/   # 다른 주소
```
`qr/qr.svg`, `qr/qr.png`, `qr/print.html` 이 만들어집니다. 인쇄하거나 슬라이드에 붙여 넣으세요.

## 구글폼 연결
`src/data/config.ts` 의 `GOOGLE_FORM.formId` 와 `entries` 를 실제 값으로 바꾸면 엔딩의 "설문 작성하기" 버튼이 나타납니다. 바꾸기 전에는 결과 코드만 보입니다.

## 개인정보와 저장
로그인·서버가 없고 아무것도 전송하지 않습니다. 새로고침 대비로 진행 상황을 브라우저 탭의 sessionStorage 에만 저장하며, 탭을 닫거나 "새 수사 시작"을 누르면 지워집니다. 서비스 워커는 게임 파일(코드·아이콘)만 캐시합니다.

## 수업 전 확인
- `src/data/penalties.ts` 의 조치 목록과 문구를 최신 법령·교육부 기준과 맞춰 보세요. 근거를 확인하지 못한 통계는 `verified: false` 이며 화면에 나오지 않습니다.
- 성능 점검 방법은 [docs/PERFORMANCE.md](docs/PERFORMANCE.md) 를 보세요.
