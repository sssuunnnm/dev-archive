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
| Merge Commit | 브랜치가 갈라지고 합류한 지점이 그래프로 남음 | 그대로 보존 | `git merge --no-ff feature` |
| Rebase | 일직선(linear)으로 재배치 | 커밋이 재작성됨(해시 변경) | `git rebase main` |
| Squash | 브랜치의 모든 커밋을 하나로 합침 | main에는 개별 커밋으로 기록되지 않음 | `git merge --squash feature` |

### Merge Commit

```bash
git checkout main
git merge --no-ff feature/login   # 병합 커밋이 하나 생기고, 두 브랜치의 이력이 그래프로 남는다
```

`--no-ff`(no fast-forward)를 꼭 붙여야 한다 — main이 feature를 분기한 뒤로 다른 커밋이 없었다면, `--no-ff` 없이는 그냥 fast-forward되면서 병합 커밋 자체가 안 생긴다.

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

main 히스토리가 "기능 단위 커밋 하나"로 깔끔해진다. 대신 feature 브랜치 안에서의 중간 작업 이력(어떤 순서로 무엇을 고쳤는지)은 main에 개별 커밋으로 남지 않는다 (feature 브랜치 자체를 지우지 않았다면 그 브랜치에서는 여전히 확인할 수 있다).

### 직접 살펴보기 — 같은 feature 브랜치, 다른 병합 방식

3개 커밋짜리 `feature` 브랜치를 각 방식으로 합쳤을 때 `main`의 히스토리가 어떻게 달라지는지 비교한다.

<div class="mergedemo">
<style>
.mergedemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --feat: #2f7d4f;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .mergedemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; --feat: #6fbf8b; }
.mergedemo .toggle { display: flex; gap: 8px; margin-bottom: 16px; }
.mergedemo .togbtn {
  flex: 1; background: var(--card2); color: var(--ink); border: 1px solid var(--line); border-radius: 8px;
  padding: 9px 10px; font-family: inherit; font-weight: 700; font-size: 12.5px; cursor: pointer;
}
.mergedemo .togbtn[aria-pressed="true"] { background: var(--accent); color: var(--card); border-color: var(--accent); }
.mergedemo .row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; min-height: 30px; }
.mergedemo .rowlabel { width: 52px; flex: none; font-size: 11px; color: var(--sub); }
.mergedemo .commit { border-radius: 6px; padding: 6px 9px; font-size: 12px; font-family: 'Fira Code', monospace; border: 1px solid var(--line); background: var(--card2); }
.mergedemo .commit.main { border-color: var(--accent); color: var(--accent); font-weight: 700; }
.mergedemo .commit.feature { border-color: var(--feat); color: var(--feat); font-weight: 700; }
.mergedemo .arrow { color: var(--sub); font-size: 12px; }
.mergedemo .note { margin-top: 10px; font-size: 12.5px; color: var(--sub); }
.mergedemo .note b { color: var(--ink); }
</style>

<div class="toggle">
  <button class="togbtn" id="md_merge" aria-pressed="true">Merge Commit</button>
  <button class="togbtn" id="md_rebase" aria-pressed="false">Rebase</button>
  <button class="togbtn" id="md_squash" aria-pressed="false">Squash</button>
</div>
<div id="md_graph" aria-live="polite"></div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('mergedemo')) return;
  const btns = { merge: root.querySelector('#md_merge'), rebase: root.querySelector('#md_rebase'), squash: root.querySelector('#md_squash') };
  const graphEl = root.querySelector('#md_graph');

  function commitEl(label, cls) { return `<span class="commit ${cls || ''}">${label}</span>`; }

  function renderMerge() {
    graphEl.innerHTML = `
      <div class="row"><span class="rowlabel">main</span>${commitEl('A', 'main')}<span class="arrow">→</span>${commitEl('B', 'main')}<span class="arrow">─────→</span>${commitEl('M(병합)', 'main')}</div>
      <div class="row"><span class="rowlabel">feature</span>${commitEl("A'", 'feature')}<span class="arrow">→</span>${commitEl("B'", 'feature')}<span class="arrow">→</span>${commitEl("C'", 'feature')}<span class="arrow">↗</span></div>
      <div class="note">feature 커밋(<b>A′, B′, C′</b>)이 원본 그대로 남고, 이를 합치는 병합 커밋(<b>M</b>) 하나가 main에 추가된다.</div>
    `;
  }
  function renderRebase() {
    graphEl.innerHTML = `
      <div class="row"><span class="rowlabel">main</span>${commitEl('A', 'main')}<span class="arrow">→</span>${commitEl('B', 'main')}<span class="arrow">→</span>${commitEl("A''", 'feature')}<span class="arrow">→</span>${commitEl("B''", 'feature')}<span class="arrow">→</span>${commitEl("C''", 'feature')}</div>
      <div class="note">feature 커밋들이 main 최신 위로 재배치되며 <b>새 해시(A″~C″)</b>를 받아 일직선으로 이어붙는다 — 별도 브랜치 줄이 남지 않는다.</div>
    `;
  }
  function renderSquash() {
    graphEl.innerHTML = `
      <div class="row"><span class="rowlabel">main</span>${commitEl('A', 'main')}<span class="arrow">→</span>${commitEl('B', 'main')}<span class="arrow">→</span>${commitEl('S', 'feature')}</div>
      <div class="note">feature의 커밋 3개(A′, B′, C′)는 main에 개별 커밋으로 남지 않고, 그 변경을 담은 커밋 <b>S</b> 하나만 main에 추가된다.</div>
    `;
  }
  function select(which) {
    Object.entries(btns).forEach(([k, b]) => b.setAttribute('aria-pressed', String(k === which)));
    ({ merge: renderMerge, rebase: renderRebase, squash: renderSquash })[which]();
  }
  btns.merge.addEventListener('click', () => select('merge'));
  btns.rebase.addEventListener('click', () => select('rebase'));
  btns.squash.addEventListener('click', () => select('squash'));
  select('merge');
})();
</script>

### 무엇을 고를까

정답이 정해진 문제는 아니고, 히스토리를 어떻게 읽고 싶은지에 대한 팀·개인의 취향에 가깝다. 실제로 고려되는 기준을 몇 가지 꼽으면:

- 커밋 하나하나의 리뷰 이력보다 "PR 단위로 깔끔한 로그"가 더 중요하다면 Squash를 선호할 수 있다.
- feature 브랜치 안에서 어떤 순서로 작업했는지 그 과정 자체를 남기고 싶다면 Merge Commit이 맞을 수 있다.
- 히스토리를 일직선으로 유지하면서도 개별 커밋은 보존하고 싶다면 Rebase를 고려할 수 있다 (단, 이미 공유된 브랜치엔 신중히).
- 이 외에도 팀 인원 수, 코드 리뷰 방식, `git bisect`/롤백을 얼마나 자주 하는지 등도 선택에 영향을 줄 수 있다 — 여기 나열한 게 전부는 아니다.

GitHub PR의 "Merge" 버튼도 이 세 가지를 그대로 지원한다: "Create a merge commit", "Squash and merge", "Rebase and merge".

### 이 리포는 어떤 전략을 쓰나

`git log --merges`로 확인해보면 `Merge pull request #30 from ...`처럼 부모 커밋이 둘인 병합 커밋이 여러 개 남아있다 — 적어도 그 PR들은 **Merge Commit** 방식으로 합쳐졌다는 뜻이다. 다만 `git log --merges`는 조회 범위 안에서 부모가 2개 이상인 커밋을 보여주는 것일 뿐, 저장소 전체의 "기본 병합 방식"을 증명해주지는 않는다 — 과거에 Merge Commit으로 합친 기록은 이후 다른 PR이 Rebase나 Squash로 합쳐지더라도 그대로 남아있기 때문이다. 실제로 리포에 설정된 기본 병합 방식은 GitHub 저장소의 **Settings → General → Pull Requests**에서 "Allow merge commits/Allow squash merging/Allow rebase merging" 항목을 직접 확인해야 정확하다. [브랜치 전략 글](../git-branching-strategies/)에서 짚었듯 브랜치 자체는 Trunk-based에 가깝게 짧게 쓰는데, 적어도 지금까지의 PR들은 Merge Commit으로 합쳐져서 각 PR이 그래프에 그대로 남아있다.

## 예제

특정 범위의 커밋 중 어떤 게 병합 커밋인지는 `git log`로 확인할 수 있다.

```bash
git log --oneline --graph --all                          # 브랜치까지 포함해서 그래프로 확인
git log --all --merges --format='%H %P %s'                # 조회 범위(전체 브랜치)를 명시하고, 병합 커밋의 해시·부모·메시지를 함께 확인
```

부모(`%P`)가 2개 이상 찍히는 커밋이 병합 커밋이다. 다만 이 결과는 "그 커밋이 병합 커밋이었다"는 사실만 알려줄 뿐, 저장소의 기본 병합 정책까지 알려주지는 않는다.

## 주의사항

- Rebase는 이미 push되어 다른 사람이 내려받은 브랜치에는 하지 않는다. 커밋 해시가 바뀌기 때문에, 그 브랜치를 이미 pull한 사람과 히스토리가 어긋난다.
- Squash는 되돌릴(revert) 때 커밋 하나만 되돌리면 되니 오히려 간편할 수 있지만, 버그가 어느 중간 커밋에서 생겼는지 `git bisect`로 찾기는 더 어려워진다 (중간 커밋 자체가 없어지므로).
- 브랜치 전략과 병합 전략은 서로 독립적인 결정이라 자유롭게 조합할 수 있다 — 예를 들어 Trunk-based Development에 Squash를 같이 쓰는 조합도 흔하다.

## 참고자료

- git-scm.com (Git 공식 문서)
- [Git 브랜치 전략 정리 (Git Flow vs Trunk-based)](../git-branching-strategies/)
