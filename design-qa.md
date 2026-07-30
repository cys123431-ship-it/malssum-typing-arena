# 활자 콘솔 디자인 QA

## 범위

- 새 시각 테마 `활자 콘솔`의 홈과 타자 연습 화면
- 라이트·다크 모드
- 데스크톱 `1440×1024`, 모바일 `390×844`, 최소 너비 `320px`
- 기존 테마 선택·저장·화면 회귀
- 실제 입력, 오타 판정, 구절 이동, 포커스 유지, 키보드 동작

## 디자인 원본

- 홈 라이트: `C:\Users\yosub\AppData\Local\Temp\codex-clipboard-a3a1505b-3a8e-4d58-8489-ba1fd4062175.png`
- 홈 다크: `C:\Users\yosub\AppData\Local\Temp\codex-clipboard-b2899953-46e6-4a35-825f-7336879c5a30.png`
- 연습 라이트: `C:\Users\yosub\AppData\Local\Temp\codex-clipboard-d5ae784d-26f0-4339-9a26-3e65aaade136.png`
- 연습 다크: `C:\Users\yosub\AppData\Local\Temp\codex-clipboard-78c1821a-e690-451c-b092-0244468651ee.png`

## 구현 캡처

- 홈: `qa-evidence/type-console/implementation-home-{light,dark}-{1440x1024,390x844}.png`
- 연습: `qa-evidence/type-console/implementation-practice-{light,dark}-{1440x1024,390x844}.png`
- 최소 너비: `qa-evidence/type-console/implementation-home-light-320x844.png`
- 기존 테마: `qa-evidence/type-console/regression-classic-{light,dark}-1440x1024.png`

## 원본과 구현의 동일 캔버스 비교

- 홈 데스크톱: `compare-home-{light,dark}-desktop.png`
- 연습 데스크톱: `compare-practice-{light,dark}-desktop.png`
- 홈 모바일: `compare-home-{light,dark}-mobile.png`
- 연습 모바일: `compare-practice-{light,dark}-mobile.png`
- 핵심 확대: `compare-focus-home-typography.png`, `compare-focus-practice-cursor.png`

위 파일은 모두 `qa-evidence/type-console/`에 있다. 원본과 구현을 같은 크기와 상태로 나란히 놓고 그리드, 타이포그래피, 컬러, 구분선, 커서 스테이지, 모바일 재배치를 확인했다.

## 시각 검토 결과

- 홈은 라임 진행 인덱스, 대형 헤드라인, 전폭 강조 밴드, 구절·명령 분할, 하단 데이터 티커를 원본의 시각 언어로 재현했다.
- 연습 화면은 현재 단어를 가장 크게 두고 다음 단어를 단계적으로 축소·감쇠하며, 현재 입력 위치에 라임 커서를 연결했다.
- 카드, 둥근 모서리, 그림자, 그라데이션, 유리 효과, 파티클을 새 테마에 사용하지 않았다.
- 원본과 다른 성경 위치·날짜·진행 숫자는 하드코딩하지 않고 현재 앱 데이터와 저장 상태를 사용한 의도적인 차이다.
- 데스크톱 상단의 테마 선택기는 원본에는 없지만 기존 테마 보존과 새 테마 선택이라는 필수 기능을 위해 추가했다.
- 초기 입력 상태에서는 커서가 첫 글자 앞에 있고, 입력에 따라 현재 글자 뒤로 이동한다. 이는 정적인 원본 캡처와 상태가 다른 정상 동작이다.

## 반응형·접근성·동작 확인

- `390×844`에서 진행 인덱스가 가로형으로 바뀌고 통계와 입력 명령 바가 화면 하단에서 접근 가능하다.
- `320×844`에서 `clientWidth = scrollWidth = 320`으로 가로 스크롤이 없다.
- 모바일 핵심 터치 대상은 브랜드 48px, 메뉴 44px, 이어서 연습 60px, 무작위 구절 44px 이상이다.
- 포커스 외곽선은 라임색으로 표시되며 `Tab`을 앱 단축키로 가로채지 않는다.
- 오타를 포함한 입력이 다음 글자로 진행되고 실제 정확도가 낮아지는 것을 확인했다.
- 다른 구절 선택 후에도 입력창 포커스가 유지되고 `Esc`로 홈 화면에 복귀한다.
- 기존 테마를 다시 선택하고 새로고침해도 기존 선택이 유지되며 기존 화면이 복원된다.
- 브라우저 콘솔 오류는 0건이다.

## 발견 및 수정 이력

1. 모바일에서 기존 헤더가 새 테마 헤더와 함께 노출되던 문제를 테마·화면 범위가 명확한 선택자로 수정했다.
2. 모바일 홈의 세로 높이와 티커 배치를 조정해 `390×844` 안에 핵심 동작을 배치했다.
3. 모바일 무작위 구절 동작 영역을 최소 44px로 보정했다.
4. 데스크톱 진행 인덱스의 큰 숫자와 `/ 10 오늘` 레이블이 잘리지 않도록 너비와 글자 크기를 보정했다.
5. 최종 비교에서 P0, P1, P2 수준의 미해결 시각 결함이 없음을 확인했다.

## 심각도별 미해결 항목

- P0: 없음
- P1: 없음
- P2: 없음

final result: passed

## Word Battle addendum — 2026-07-22

- Reference evidence: the user-provided GIF sequence was extracted frame-by-frame and reviewed as a timing and intensity reference, not copied as product art.
- Asset comparison: `qa-evidence/word-battle/effect-reference-asset-comparison.png` places the reference impact sequence beside the original enemy, impact, and projectile assets used by the implementation.
- Interaction wiring checked: correct input creates a hit event, wrong input creates a miss event and lowers accuracy, combo resets after an error, health and score use live typing state, and completion uses the existing progress persistence path.
- Responsive safeguards checked in source: desktop and mobile grids, 44px mobile controls, 320px rules, reduced-motion handling, and long-word scaling classes.
- Build, type check, lint, six source-level regression tests, archive validation, private deployment, and deployed-bundle asset/class checks passed.
- The private Sites sign-in gate prevented an automated post-deployment viewport screenshot without authorizing account access. No sign-in or access-policy change was made during QA.

Post-deployment viewport status: authenticated capture remains pending.

## 전투원 선택·전투 캐릭터 addendum — 2026-07-22

### Source visual truth

- User reference animation archive: `E:\예시.zip`
- Extracted reference contact sheets: `C:\Users\yosub\AppData\Local\Temp\typinggame-effect-reference-53ce7d9da9f14d178a6c484943ba8455\Internet_20260722_124321_{1,2,9,14}-frames.jpg`
- Generated fighter source comparison: `qa-evidence/word-battle/fighter-roster-assets.png`
- Source comparison pixels: `1800×1120`; no density normalization was needed for asset review.

### Intended implementation states

- Fighter chooser: light and dark, `1440×1024`, `390×844`, and minimum width `320px`
- Battle arena: selected fighter idle, correct-input attack, wrong-input recoil, and victory
- Persistence: selected fighter restored from `bible-typing-battle-fighter`

### Implementation evidence

- Browser-rendered screenshot: unavailable.
- Attempted CSS viewport: `1440×1024`, device scale factor `1`.
- The local production renderer was prepared and static assets were verified with HTTP 200 responses, but the browser security policy rejected the local preview URL before a same-state capture could be made.
- Browser console-error review and implementation pixel dimensions are therefore unavailable.
- Full-view comparison and focused-region comparison could not be completed without a browser-rendered implementation artifact.

### Findings

- [P1] Rendered implementation evidence is missing.
  - Location: fighter chooser and in-battle character placement.
  - Evidence: the six final transparent fighter assets and source references were opened and reviewed, while the local implementation URL was blocked by browser policy before capture.
  - Impact: code, build, and responsive rules pass, but character crop, text overlap, and mobile composition cannot be certified visually from a browser screenshot.
  - Fix: capture the chooser and battle at `1440×1024` and `390×844` from an accessible preview or deployment, then place each beside the reference/contact sheet and repeat the five-surface comparison.

### Fidelity surfaces checked without browser rendering

- Fonts and typography: Korean sans and monospace roles, weights, truncation, and responsive sizes are defined in source; visual optical balance remains unverified.
- Spacing and layout: sharp split layout, divider grid, six-item desktop roster, mobile horizontal roster, 44px controls, and 320px constraints are defined; visible crop remains unverified.
- Colors and tokens: existing light/dark console tokens are preserved; per-fighter accents are restricted to identity and selection state.
- Image quality: all six WebP assets have transparent backgrounds, validated alpha bounds, correct aspect metadata, and compact file sizes. The roster contact sheet shows no obvious chroma halo.
- Copy and content: all six Korean names, roles, weapons, and taglines are app-specific and connected to the selected character state.

### Comparison history

- No visual iteration was possible because the first browser-rendered capture was blocked. No P0/P1/P2 design finding was marked resolved without visible post-fix evidence.

### Implementation checks completed

- TypeScript check passed.
- ESLint passed.
- Production build passed.
- Seven regression tests passed, including six-fighter persistence, battle-select routing, asset wiring, attack animation, mobile roster flow, and Tab-key preservation.

final result: blocked

## 전투 원근감·반동 모션 addendum — 2026-07-22

### 시각 원본과 비교 자료

- 동작·구도 원본: `E:\예시.zip`
- 대표 원본 프레임: `PS21112700215.jpg`
- 원본·구현 동일 캔버스 비교: `work/design-comparison-battle.jpg`
- 구현 캡처: `work/battle-depth-desktop.png`, `work/battle-depth-mobile.png`

### 구현·확인 결과

- 기존 좌우 대치 구도를 폐기하고 먼 중앙의 적, 전경의 후면 전투원, 원근감 있는 성소 전장으로 재구성했다.
- 6명의 전투원 모두 기존 외형과 무기를 유지한 전투용 후면 3/4 포즈를 연결했다.
- 평상시 전투원 호흡·무게 이동, 적 부유, 조준점 회전 모션을 추가했다.
- 정답 입력에는 전투원 반동, 총구 폭발, 원거리 탄도, 적 피격 폭발, 적 흔들림, 카메라 충격을 연결했다.
- `prefers-reduced-motion`에서는 장식·전투 애니메이션을 제거한다.
- 공개 Sites 화면에서 데스크톱 전투 구도와 모바일 `390×844`를 직접 캡처해 원본과 비교했다.
- `390px`에서 `scrollWidth = clientWidth = 390`, `320px`에서 `scrollWidth = clientWidth = 320`으로 가로 스크롤이 없음을 확인했다.
- 입력창은 전투 시작 직후 활성 상태이며 보스 체력, 플레이어 체력, 콤보, 타수, 정확도, 구절 큐, 작전 지도 동작이 기존 상태와 연결된다.

### 심각도별 미해결 항목

- P0: 없음
- P1: 없음
- P2: 없음

final result: passed

## 모바일 키보드 전투 가시성 addendum — 2026-07-30

### 시각 원본과 구현 증거

- Source visual truth: 사용자가 보고한 “쿼티 키보드가 올라오면 전투 장면이 사라지고 입력만 남는” 실제 모바일 사용 상태.
- Pre-fix production capture: `work/mobile-keyboard-before-public-v26.png`.
- Post-fix implementation capture: `work/mobile-keyboard-fire-local-v27.png`.
- Full-view before/after comparison: `work/mobile-keyboard-before-after-v27.png` (왼쪽: 기존 공개 화면, 오른쪽: 수정 화면).
- Viewport: CSS `390×430`, device scale factor `1`, PNG `390×430`. `430px` 높이는 `390×844` 기기에서 쿼티 키보드가 화면 아래를 차지한 뒤 남는 가시 영역을 재현한다.
- State: 말씀 전투 1단계, 입력창 포커스, 키보드 열림, 정답 한 글자 입력과 사격 효과 실행.

### 발견·수정 이력

1. [P1] 기존 화면은 키보드 높이에서 입력창 하단이 잘리고 현재 단어가 가시 영역 밖으로 밀렸다.
   - 증거: pre-fix 캡처에서 전투장은 고정 높이를 유지하고 입력창은 뷰포트 아래로 잘린다.
   - 수정: `VisualViewport` 높이와 입력 포커스를 연결해 실제 키보드 열림 상태를 감지하고, 앱 높이를 남은 가시 영역에 고정했다.
2. [P1] 키보드가 열린 상태에서 전투 장면과 입력 단어를 동시에 볼 수 없었다.
   - 수정: 키보드 전용 압축 레이아웃에서 상단 명령 바, 전투장, 통계, 현재 단어, 입력창을 한 화면에 재배치했다.
   - Post-fix evidence: `work/mobile-keyboard-fire-local-v27.png`.
3. [P2] 브라우저의 입력창 자동 스크롤이 전투장을 화면 밖으로 밀 수 있었다.
   - 수정: 키보드가 열린 동안 전투 화면을 가시 뷰포트에 고정하고 문서 스크롤을 잠갔다.

### 다섯 가지 필수 표면 확인

- Fonts and typography: 현재 단어를 키보드 상태에서도 가장 큰 텍스트로 유지했고 다음 단어는 한 단계만 노출한다.
- Spacing and layout rhythm: `390×430`에서 전투장 `185px`, 입력 영역 `201px`로 분리되며 입력창 하단은 `425px`에 위치해 잘리지 않는다.
- Colors and visual tokens: 기존 전투 배경, 라임 커서, 체력 색상과 구분선을 그대로 유지한다.
- Image quality and asset fidelity: 캐릭터, 적, 전장, 총구와 탄도 자산의 비율 및 투명도를 변경하지 않았다.
- Copy and content: 보스 체력, 점수, 콤보, 타수, 정확도, 현재 단어와 입력값은 기존 실제 상태를 사용한다.

### 동작·접근성 확인

- `390×500`과 `390×430`에서 `scrollY = 0`, 입력창과 작전 지도 버튼이 모두 가시 영역 안에 있다.
- 키보드 상태에서 정답 한 글자를 입력하면 피해·점수·콤보와 사격 모션이 정상 실행된다.
- 입력창 포커스와 기존 문자 입력, 한글 조합, `Esc` 동작을 변경하지 않았다.
- 브라우저 콘솔 경고·오류는 0건이다.

### 심각도별 미해결 항목

- P0: 없음
- P1: 없음
- P2: 없음

final result: passed

## Battle firing-direction addendum — 2026-07-30

### Source truth and initial finding

- User-reported issue: the enemy was positioned on the left while the fighter's firing pose and gun barrel still pointed to the right.
- Pre-fix evidence: `work/battle-fire-public-v25-retry.png`.
- [P1] The tracer crossed toward the enemy, but the character pose contradicted the shot direction.

### Fix and post-fix evidence

- Mirrored the firing pose so the character and weapon physically face the left-side enemy.
- Reversed the horizontal recoil/settle motion to match a leftward shot.
- Re-aligned the muzzle flash, projectile origin, travel path, and impact with the mirrored barrel.
- Desktop muzzle evidence: `work/battle-fire-left-local-v26.png`.
- Desktop impact evidence: `work/battle-impact-left-local-v26.png`.
- Mobile evidence: `work/battle-fire-left-mobile-local-v26.png`, `work/battle-aim-left-mobile-local-v26.png`.

### Remaining visual findings

- P0: none
- P1: none
- P2: none

final result: passed

## 전투원 급회전·원거리 사격 모션 addendum — 2026-07-28

### 시각 원본과 구현 증거

- Source visual truth: `C:\Users\yosub\AppData\Local\Temp\malssum-battle-reference-20260722\analysis-sheets\contact-1.jpg`
- Reference motion sequence: 정면 대기 → 적 방향으로 급회전 → 후면 조준 유지 → 정면 복귀
- Desktop implementation: `work/battle-turn-idle-local-v2.png`, `work/battle-fire-paused-360ms-local.png`, `work/battle-fire-paused-600ms-local.png`
- Mobile implementation: `work/battle-fire-mobile-full-390x844-local-v2.png`
- Combined comparison: `work/battle-motion-reference-vs-implementation.jpg`
- Desktop viewport and implementation pixels: CSS `1280×720`, device scale factor `1`, PNG `1280×720`
- Mobile viewport and implementation pixels: CSS `390×844`, device scale factor `1`, full-page PNG `390×844`
- Density normalization: source contact sheet and browser captures were scaled with aspect ratio preserved only for the combined comparison sheet. Motion pose and timing order were compared; the reference portrait stage and the app's landscape battle arena were not treated as an identical layout target.

### 발견·수정 이력

1. [P1] 기존 전투원은 처음부터 적을 향한 후면 조준 자세여서 예시의 급회전이 보이지 않았다.
   - 수정: 정면 캐릭터 자산과 후면 조준 자산을 같은 슬롯에 겹치고, 3D 회전과 교차 전환으로 `960ms`의 정면 대기 → 회전 → 조준 → 반동 → 복귀 동작을 연결했다.
   - Post-fix evidence: `work/battle-turn-idle-local-v2.png`와 `work/battle-fire-paused-360ms-local.png`.
2. [P1] 총구와 적이 거의 붙어 탄환 이동이 짧고 정적으로 보였다.
   - 수정: 전투원을 오른쪽 전경, 적을 왼쪽 원경으로 분리하고 탄환 이동 시간을 `430ms`로 늘렸다. 총구 섬광 뒤에 긴 대각선 탄도가 이동하고 도착 시 피격 폭발·적 흔들림·카메라 반동이 이어지도록 시점을 분리했다.
   - Post-fix evidence: `work/battle-fire-paused-600ms-local.png`.
3. [P2] 모바일에서 왼쪽 점수판이 원거리 적과 피격 효과를 가렸다.
   - 수정: `390px` 전투 화면에서 점수판을 오른쪽으로 옮겨 적·탄도·충돌점을 노출했다.
   - Post-fix evidence: `work/battle-fire-mobile-full-390x844-local-v2.png`.

### 다섯 가지 필수 표면 확인

- Fonts and typography: 기존 전투 UI 글꼴, 굵기, 수치 위계를 유지했고 모션 변경으로 글자 잘림이나 재배치가 생기지 않았다.
- Spacing and layout rhythm: 데스크톱과 모바일 모두 전경 전투원과 원경 적 사이에 명확한 사격 거리가 생겼다. 모바일 `scrollWidth = clientWidth = 390`.
- Colors and visual tokens: 기존 전투 색과 라임 조준점을 유지했다. 새 색·그라데이션·패널을 추가하지 않았다.
- Image quality and asset fidelity: 기존 정면/후면 투명 WebP와 기존 투명 총구·탄도·피격 자산만 사용했다. 사각 배경이나 투명도 테두리가 없다.
- Copy and content: 보스 체력, 점수, 콤보, 타수, 정확도와 현재 구절은 기존 실제 상태를 그대로 사용한다.

### 동작·접근성 확인

- 정답 입력 한 글자가 실제 피해, 점수, 콤보와 함께 새 모션을 시작한다.
- 빠른 다음 입력은 최신 피드백 키로 애니메이션을 다시 시작한다.
- `prefers-reduced-motion`에서는 전투원 회전, 총구, 탄도, 피격 애니메이션이 제거된다.
- 데스크톱과 `390×844`에서 입력창, 작전 지도, 체력, 통계가 계속 접근 가능하다.
- 브라우저 콘솔 오류는 0건이다.

### 심각도별 미해결 항목

- P0: 없음
- P1: 없음
- P2: 없음

final result: passed
