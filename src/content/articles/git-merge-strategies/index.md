---
title: Git 병합 전략 정리 (Merge Commit vs Rebase vs Squash)
description: 브랜치를 합칠 때 히스토리를 어떻게 남길지 정하는 세 가지 병합 전략의 차이와 각각의 트레이드오프를 정리한다
date: 2026-08-27
updated:
category: development
technology: [git]
tags: [merge, rebase, squash]
type: reference
status: evergreen
series:
projects:
related: [git-branching-strategies]
aliases:
draft: true
---

## 한 줄 요약

브랜치를 합칠 때 히스토리를 그래프로 그대로 남길지(Merge Commit), 일직선으로 펼지(Rebase), 커밋 하나로 뭉칠지(Squash)가 병합 전략이고, 이건 [브랜치 전략](../git-branching-strategies/)(Git Flow/Trunk-based)과는 별개의 선택이라 자유롭게 조합할 수 있다.

## 본문

### 세 가지 병합 방식 비교

| 방식 | 히스토리 모양 | 원본 커밋 | 대표 명령어 |
|---|---|---|---|
| Merge Commit | 브랜치가 갈라지고 합류한 지점이 그래프로 남음 | 그대로 보존 | `git merge feature` |
| Rebase | 일직선(linear)으로 재배치 | 커밋이 재작성됨(해시 변경) | `git rebase main` |
| Squash | 브랜치의 모든 커밋을 하나로 합침 | 개별 커밋은 사라짐 | `git merge --squash feature` |

### Merge Commit

```bash
git checkout main
git merge feature/login   # 병합 커밋이 하나 생기고, 두 브랜치의 이력이 그래프로 남는다
```

실제 작업 흐름(언제 브랜치가 갈라지고 합쳐졌는지)이 그대로 보존된다. 대신 feature 브랜치가 많아지면 `git log --graph`가 금방 복잡해진다.

### Rebase

```bash
git checkout feature/login
git rebase main            # feature의 커밋들을 main 최신 커밋 위로 재배치
git checkout main
git merge feature/login    # 재배치돼 있어서 fast-forward로 깔끔하게 합쳐짐
```

히스토리가 일직선이라 나중에 읽기 쉽다. 다만 rebase는 커밋 해시를 바꾸기 때문에, 이미 push해서 다른 사람이 pull한 브랜치를 rebase하면 서로의 히스토리가 어긋난다 — "이미 공유된 히스토리는 rebase하지 않는다"가 원칙이다.

### Squash

```bash
git checkout main
git merge --squash feature/login
git commit -m "feat: 로그인 기능 추가"   # feature의 모든 커밋이 하나로 합쳐짐
```

main 히스토리가 "기능 단위 커밋 하나"로 깔끔해진다. 대신 feature 브랜치 안에서의 중간 작업 이력(어떤 순서로 무엇을 고쳤는지)은 사라진다.

### 무엇을 고를까

- 작은 팀·개인 프로젝트에서 PR 단위로 깔끔한 히스토리를 원한다면 Squash가 흔한 선택이다.
- 큰 팀에서 각 커밋의 리뷰 이력이나 작성자별 작업 단위를 그대로 남기고 싶다면 Merge Commit.
- 히스토리를 일직선으로 유지하면서도 개별 커밋은 보존하고 싶다면 Rebase (단, 이미 공유된 브랜치엔 신중히).

GitHub PR의 "Merge" 버튼도 이 세 가지를 그대로 지원한다: "Create a merge commit", "Squash and merge", "Rebase and merge".

### 이 리포는 어떤 전략을 쓰나

`git log --merges`로 확인해보면 `Merge pull request #30 from ...`처럼 부모 커밋이 둘인 병합 커밋이 남아있다 — 즉 GitHub의 기본값인 **Merge Commit** 방식을 쓰고 있다. [브랜치 전략 글](../git-branching-strategies/)에서 짚었듯 브랜치 자체는 Trunk-based에 가깝게 짧게 쓰는데, 병합 방식은 Squash가 아니라 Merge Commit이라 각 PR이 그래프에 그대로 남는다.

## 예제

같은 3개 커밋짜리 feature 브랜치를 각각 다른 방식으로 합치면 `main`의 히스토리 모양이 이렇게 달라진다.

```text
Merge Commit:  main --- M(병합 커밋, 부모 2개)
                          \___ A - B - C (feature, 그대로 보존)

Rebase:        main --- A' - B' - C'   (재배치된 커밋, 일직선)

Squash:        main --- S(커밋 1개: "feat: 로그인 기능 추가")
```

## 주의사항

- Rebase는 이미 push되어 다른 사람이 내려받은 브랜치에는 하지 않는다. 커밋 해시가 바뀌기 때문에, 그 브랜치를 이미 pull한 사람과 히스토리가 어긋난다.
- Squash는 되돌릴(revert) 때 커밋 하나만 되돌리면 되니 오히려 간편할 수 있지만, 버그가 어느 중간 커밋에서 생겼는지 `git bisect`로 찾기는 더 어려워진다 (중간 커밋 자체가 없어지므로).
- 브랜치 전략과 병합 전략은 서로 독립적인 결정이라 자유롭게 조합할 수 있다 — 예를 들어 Trunk-based Development에 Squash를 같이 쓰는 조합도 흔하다.

## 참고자료

- git-scm.com (Git 공식 문서)
- [Git 브랜치 전략 정리 (Git Flow vs Trunk-based)](../git-branching-strategies/)
