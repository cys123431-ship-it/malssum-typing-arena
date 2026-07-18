# 말씀타자 디자인 QA

## 범위

- 홈 화면 라이트/다크: 데스크톱과 모바일
- 타자 입력 화면 라이트: 데스크톱과 모바일
- 기존 타자 입력 화면 다크: 시각 보존 확인
- 핵심 동작: 테마 전환, 연습 시작, 다른 구절, 입력창 자동 포커스

## 참고 이미지

- `C:\Users\yosub\AppData\Local\Temp\codex-clipboard-0e01e430-d226-4ccf-8d50-fa4f44dcf542.png` — 라이트 홈
- `C:\Users\yosub\AppData\Local\Temp\codex-clipboard-713bb84b-dee1-4b0e-b5de-354ea6b73620.png` — 다크 홈
- `C:\Users\yosub\AppData\Local\Temp\codex-clipboard-3383d3b7-1863-4209-986a-2e7a5b79bd06.png` — 라이트 타자

## 구현 캡처와 상태

- `qa-evidence/implementation-home-light-desktop.png` — 1112×1024 기준, 라이트 홈, 오늘 0/10
- `qa-evidence/implementation-home-light-mobile.png` — 403×1024, 라이트 홈, 오늘 0/10
- `qa-evidence/implementation-home-dark-desktop.png` — 1112×1024 기준, 다크 홈, 오늘 0/10
- `qa-evidence/implementation-home-dark-mobile.png` — 403×1024, 다크 홈, 오늘 0/10
- `qa-evidence/implementation-practice-light-desktop.png` — 1148×1024 기준, 라이트 타자, 1구간, 미입력
- `qa-evidence/implementation-practice-light-mobile.png` — 365×1024 기준, 라이트 타자, 1구간, 미입력
- `qa-evidence/implementation-practice-dark-desktop.png` — 1148×1024 기준, 기존 다크 타자, 1구간, 미입력

## 동일 캔버스 비교 증거

- 전체 구성: `qa-evidence/compare-home-light-full.png`
- 모바일 집중 비교: `qa-evidence/compare-home-light-mobile.png`
- 전체 구성: `qa-evidence/compare-home-dark-full.png`
- 모바일 집중 비교: `qa-evidence/compare-home-dark-mobile.png`
- 전체 구성: `qa-evidence/compare-practice-light-full.png`
- 모바일 집중 비교: `qa-evidence/compare-practice-light-mobile.png`

## 확인 결과

- 전체 구성: 세로형 사이드바/모바일 상단 탭, 본문 축, 날짜, 목표 진도, 하단 요약의 계층과 정렬이 참고 이미지와 일치한다.
- 제목과 본문 타이포그래피: 짙은 녹색/아이보리 대비, 명조 중심의 크기 계층, 줄 간격과 강조선이 유지된다.
- 1–10 진도: 데스크톱 세로형과 모바일 가로형, 타자 화면의 연결선과 활성 구간 표시가 모두 반응형으로 작동한다.
- CTA와 요약: 라이트/다크의 버튼 반전, 모바일 하단 진한 녹색 띠, 3분할 기록 요약을 확인했다.
- 타자 화면: 라이트 모드의 종이 질감, 세이지 미입력 글자, 현재 글자 밑줄과 짙은 녹색 강조가 참고 이미지와 일치한다.
- 다크 타자 화면: 기존 녹색 무대와 빛나는 물결 자산이 유지된다.
- 실제 성경 구절 길이에 따라 줄바꿈과 화면 높이는 달라지며, 이는 의도된 데이터 반응형 차이다.

## 기능 검증

- 홈의 라이트/다크 전환과 저장 상태를 확인했다.
- `이어서 연습하기`로 타자 화면 진입을 확인했다.
- `다른 구절` 선택 후 구절 변경과 입력창 포커스 유지 상태를 확인했다.
- 데스크톱/모바일 모두 타자 입력창이 활성 상태로 열리며 브라우저 오류 로그는 0건이었다.

## 심각도별 발견 사항

- P0: 없음
- P1: 없음
- P2: 없음

## 반복 수정 기록

1. 참고 이미지의 데스크톱/모바일 구조를 코드 기반 반응형 레이아웃으로 구현했다.
2. 모바일 라이트 타자 상단의 오늘 진도와 연속 일수 사이 간격 및 구분점을 보정했다.
3. 동일 캔버스 비교 후 라이트/다크 홈, 라이트 타자, 기존 다크 타자와 핵심 동작을 최종 확인했다.

final result: passed
