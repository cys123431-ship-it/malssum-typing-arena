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
