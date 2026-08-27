---
title: Git 브랜치 전략 정리 (Git Flow vs Trunk-based)
description: Git Flow와 Trunk-based Development의 브랜치 구조 차이와 각각 어떤 팀/상황에 맞는지 비교 정리한다
date: 2026-08-27
updated:
category: development
technology: [git]
tags: [branching, workflow]
type: reference
status: evergreen
series:
projects:
related: [git-merge-strategies]
aliases:
draft: true
---

## 한 줄 요약

Git Flow는 브랜치를 세분화해서 릴리스를 체계적으로 관리하고, Trunk-based Development는 브랜치를 최소화해서 통합 속도와 배포 빈도를 높인다.

## 본문

### 두 전략 한눈에 비교

| 기준 | Git Flow | Trunk-based Development |
|---|---|---|
| 브랜치 구조 | `main`/`develop`/`feature`/`release`/`hotfix` 등 다수 | `main`(trunk) 중심, feature 브랜치는 짧게만 유지 |
| feature 브랜치 수명 | 길어질 수 있음 (기능 완성까지) | 짧게 (보통 하루~며칠 이내 merge) |
| 릴리스 관리 | `release` 브랜치로 별도 관리 | 태그 또는 feature flag로 관리 |
| 배포 빈도 | 릴리스 주기에 맞춰 (덜 빈번) | 지속적 배포에 적합 (빈번) |
| 병합 충돌 | feature 브랜치가 길어질수록 커짐 | 자주 합치므로 충돌이 작고 잦음 |
| 적합한 상황 | 릴리스 주기가 명확하고 여러 버전을 동시 지원해야 하는 경우 | CI/CD가 잘 갖춰져 있고 빠르게 배포하는 팀 |

### Git Flow 브랜치 구조

- `main`: 항상 배포 가능한 상태 (실제 프로덕션과 일치)
- `develop`: 다음 릴리스를 위한 통합 브랜치
- `feature/*`: 개별 기능 개발. `develop`에서 분기해서 `develop`으로 merge
- `release/*`: 릴리스 준비(버전 고정, 막바지 버그 수정). `develop`에서 분기해서 `main`과 `develop` 양쪽에 merge
- `hotfix/*`: 프로덕션 긴급 수정. `main`에서 분기해서 `main`과 `develop` 양쪽에 merge

```bash
git checkout -b feature/login develop   # develop에서 기능 브랜치 생성
# ... 작업 ...
git checkout develop
git merge feature/login                 # 완료되면 develop으로 병합
```

### Trunk-based Development 흐름

- 모든 개발자가 `main`(trunk) 하나를 기준으로 짧은 수명의 feature 브랜치를 만든다.
- 브랜치는 보통 하루~며칠 안에 `main`으로 merge한다.
- 아직 완성 안 된 기능은 브랜치를 오래 살려두는 대신, feature flag로 코드는 merge하되 기능은 꺼둔 채로 배포한다.

```bash
git checkout -b add-search main   # main에서 짧게 살 브랜치 생성
# ... 작업 (하루~며칠 내 완료) ...
git checkout main
git merge add-search               # 빠르게 다시 main으로 병합
```

### 이 리포는 어떤 전략에 가까운가

`CONVENTIONS.md` 5장의 워크플로우(작업 단위로 브랜치를 분리해서 매번 짧게 PR을 올리고 바로 merge)를 보면 Trunk-based Development에 더 가깝다. 다만 별도의 `release`/`hotfix` 브랜치는 안 쓰고, 대신 `draft: true`/`false`라는 frontmatter 메타데이터로 콘텐츠의 빌드·공개 시점을 조절한다. 이건 애플리케이션 코드의 동작을 런타임에 켜고 끄는 feature flag와 정확히 같은 개념은 아니지만, "merge는 됐지만 아직 실제로 노출은 안 된 상태를 별도로 관리한다"는 점에서는 비슷한 역할을 한다.

## 예제

같은 "기능 A"를 만든다고 할 때 브랜치 생명주기를 비교하면 이렇다.

```text
Git Flow:      develop → feature/A (길게 작업) → develop → release/1.2 → main
Trunk-based:   main → add-a (짧게 작업, 1~2일) → main (바로 병합, 필요하면 flag로 숨김)
```

## 주의사항

- Git Flow는 브랜치가 많아서, 팀 전체가 규칙을 지키지 않으면 금방 복잡해진다. 소규모 팀이나 개인 프로젝트에는 과할 수 있다.
- Trunk-based는 짧은 주기로 계속 merge하는 걸 전제로 하므로, CI가 빠르고 안정적이지 않으면(테스트가 느리거나 자주 깨지면) 오히려 `main`이 불안정해질 위험이 있다.
- 둘 다 "정답"이 아니라, 팀의 배포 주기·버전 지원 정책·CI/CD 성숙도에 따라 갈리는 트레이드오프다.
- 브랜치를 어떻게 나누는지(이 글)와, 합칠 때 히스토리를 어떻게 남기는지(merge commit/rebase/squash)는 서로 다른 결정이다. 후자는 [Git 병합 전략 글](../git-merge-strategies/)에서 따로 다룬다.

## 참고자료

- git-scm.com (Git 공식 문서)
