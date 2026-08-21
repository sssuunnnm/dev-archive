---
title: 정적 사이트에서 "오늘"이 며칠씩 어긋난 이유
description: 홈 화면 미니 캘린더가 배포 시점에 멈춰있던 문제를 원인 분석하고, 빌드 타임 계산을 클라이언트 계산으로 옮겨 해결한 과정을 정리한다.
date: 2026-08-21
category: development
technology: [astro, typescript, github-actions]
tags: [timezone, static-site]
type: troubleshooting
status: archive
related: [why-i-started-this-blog]
draft: false
---

## 한 줄 요약

정적 사이트는 페이지를 "지금" 만드는 게 아니라 "빌드 시점에" 만들어 놓고 계속 그대로 보여준다. 그 사실을 잊고 홈 화면 미니 캘린더의 "오늘"을 서버(빌드 타임)에서 계산했더니, 며칠간 글을 안 쓰면 캘린더가 마지막 배포 시점에 멈춰버리는 문제가 있었다.

## 문제 상황

이 블로그 홈 화면에는 이번 달 글 작성 현황을 보여주는 미니 캘린더가 있다. 오늘 날짜 칸에는 테두리(ring)를 둘러서 "오늘"임을 표시한다.

그런데 며칠 글을 안 쓴 다음 사이트를 열어보니, 캘린더의 "오늘" 표시가 실제 날짜가 아니라 마지막으로 배포했던 날을 가리키고 있었다. 이번 달로 넘어온 지 얼마 안 됐을 때는 아예 지난달 달력이 그대로 보이기도 했다.

## 원인 분석

### 1. 정적 사이트는 "지금"을 모른다

이 사이트는 GitHub Pages에 정적 HTML로 배포된다. 배포 워크플로우는 `main`에 push할 때만 실행되고, 그 시점에 Astro가 모든 페이지를 한 번 렌더링해서 HTML 파일로 굳힌다.

문제의 컴포넌트는 이랬다.

```astro
---
// MiniCalendar.astro (수정 전)
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
// ...연도/월/오늘 여부를 여기서 전부 계산해서 HTML로 렌더링
---
```

이 `new Date()`는 **방문자가 페이지를 여는 시점이 아니라, 빌드 서버가 이 코드를 실행한 시점**의 시각이다. 즉 8/19에 배포했다면 8/19의 "오늘"이 HTML에 그대로 박제된다. 그 뒤로 재배포가 없으면 방문자가 8/21에 들어와도 캘린더는 여전히 8/19를 "오늘"이라고 우긴다.

이 프로젝트의 배포 워크플로우는 `push` 트리거만 있고 정기 리빌드(스케줄) 트리거가 없기 때문에, 글을 안 쓰는 날이 이어질수록 캘린더가 점점 더 과거에 머무르는 구조였다.

### 2. 로컬 타임존 getter와 UTC 메서드를 섞어 쓴 문제

여기에 별개의 함정이 하나 더 있었다. JS의 `Date` 객체는 같은 시각을 두 가지 방식으로 읽을 수 있다.

```javascript
const d = new Date('2026-08-21T00:00:00.000Z');

d.getFullYear();     // 실행 환경의 로컬 타임존 기준
d.getUTCFullYear();  // 항상 UTC 기준
d.toISOString();     // 항상 UTC 기준 문자열
```

이 블로그의 글 frontmatter에 쓰는 `date: 2026-08-21` 같은 값은 YAML 파서가 UTC 자정(`2026-08-21T00:00:00Z`)으로 해석한다. 그런데 캘린더는 `getFullYear()` / `getMonth()` / `getDate()`처럼 **로컬 타임존 기준 getter**로 날짜를 뽑고, 목록 페이지들은 `toISOString().slice(0, 10)`처럼 **UTC 기준**으로 날짜를 표시하고 있었다.

두 방식이 항상 같은 날짜를 가리키는 건 아니다. 빌드 서버(GitHub Actions 컨테이너)의 기본 타임존은 UTC인데, 만약 로컬 타임존이 UTC로 고정된 채였다면 이 프로젝트에서 문제는 없었을 것이다. 하지만 실제로는 이전에 빌드 워크플로우에 `TZ: Asia/Seoul` 환경 변수를 걸어둔 상태였다.

```yaml
# .github/workflows/deploy.yml
- uses: withastro/action@v3
  with:
    node-version: 22
  env:
    TZ: Asia/Seoul
```

이렇게 하면 로컬 타임존 getter가 KST(UTC+9) 기준으로 동작한다. UTC 자정을 KST로 바꾸면 같은 날 오전 9시가 되므로 이 프로젝트의 날짜 범위에서는 우연히 날짜가 밀리지 않았지만, 애초에 "로컬 getter"와 "UTC 메서드"를 같은 컴포넌트 안에서 섞어 쓴 것 자체가 타임존 설정에 따라 언제든 하루가 어긋날 수 있는 코드였다.

## 해결 방법

핵심은 "오늘"과 "이번 달" 계산을 **빌드 시점(서버)이 아니라 방문자의 브라우저에서** 하도록 옮기는 것이다. 서버는 글 날짜 목록만 데이터로 내려주고, 화면을 그리는 시점의 판단은 클라이언트 스크립트가 맡는다.

```astro
---
// MiniCalendar.astro (수정 후)
const articles = await getCollection('articles', ({ data }) => isVisible(data.draft));
const postedDates = articles.map((post) => post.data.date.toISOString().slice(0, 10));
---

<div id="mini-calendar" data-posted-dates={JSON.stringify(postedDates)}>
  <p id="mini-calendar-month">&nbsp;</p>
  <div id="mini-calendar-grid"></div>
</div>

<script>
  const root = document.getElementById('mini-calendar');
  const postedDates = new Set(JSON.parse(root!.dataset.postedDates ?? '[]'));

  // 방문자의 기기 시간이 아니라, 블로그 글 날짜 기준(KST)으로 "오늘"을 계산한다
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  // format()이 반환하는 문자열의 순서/구분자는 로케일 "표시" 형식일 뿐 고정된 계약이 아니므로,
  // formatToParts()로 연/월/일 값을 각각 뽑아 YYYY-MM-DD로 직접 조립한다
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  const todayStr = `${part('year')}-${part('month')}-${part('day')}`;

  // 이후 todayStr 기준으로 그리드를 그린다
</script>
```

여기서 두 가지를 신경 썼다.

**타임존을 브라우저 로컬이 아니라 KST로 고정했다.** 방문자의 기기 타임존을 그대로 쓰면, 예를 들어 미국에서 접속한 사람에게는 "오늘"이 하루 다르게 보일 수 있다. 이 블로그의 글 날짜는 애초에 한국 시간 기준으로 기록되는 것이므로, 캘린더도 방문자 위치와 무관하게 항상 KST 기준으로 동작해야 frontmatter의 `date`와 어긋나지 않는다. `Intl.DateTimeFormat`의 `timeZone` 옵션을 명시하면 실행 환경(브라우저든 Node든)의 로컬 설정과 무관하게 원하는 타임존으로 고정할 수 있다.

**날짜 문자열은 `format()`이 아니라 `formatToParts()`로 조립했다.** `format()`이 반환하는 문자열은 사람이 읽기 좋은 "표시용" 형식이라, 특정 로케일(`en-CA`)을 쓰면 우연히 `YYYY-MM-DD` 순서로 나오긴 하지만 이건 그 로케일의 표시 관례일 뿐 코드가 기대도 되는 고정된 계약은 아니다. 날짜를 특정 형식의 문자열 키로 써야 한다면 `formatToParts()`로 연/월/일 값을 각각 뽑아 원하는 형식으로 직접 조립하는 편이 더 안전하다.

**요일·일수 계산은 UTC 기반 Date로만 했다.** `new Date(Date.UTC(year, month, 1)).getUTCDay()`처럼 UTC 생성자와 UTC getter를 짝지어 쓰면, 특정 연-월-일의 요일이 실행 환경 타임존에 전혀 영향받지 않는다. 로컬 생성자(`new Date(year, month, 1)`)와 로컬 getter를 쓰면 실행 환경 타임존에 따라 결과가 달라질 여지가 남는다.

## 정리

- 정적 사이트에서 "지금", "오늘"처럼 매 순간 달라지는 값은 빌드 타임이 아니라 클라이언트에서 계산해야 한다. 빌드 타임 계산은 다음 배포 전까지 그 값 그대로 박제된다.
- `Date`의 로컬 타임존 getter(`getFullYear` 등)와 UTC 메서드(`getUTCFullYear`, `toISOString` 등)를 한 로직 안에서 섞어 쓰지 않는다. 어느 쪽을 쓸지 정했으면 끝까지 한쪽으로 통일한다.
- 타임존이 결과에 영향을 주면 안 되는 로직(요일 계산 등)은 UTC 생성자·getter로, 특정 타임존 기준으로 "오늘"을 정의해야 하는 로직은 `Intl.DateTimeFormat`의 `timeZone` 옵션으로 명시적으로 고정한다.
- GitHub Actions에 `TZ` 환경 변수를 거는 방식은 빌드 시점 계산에는 도움이 되지만, 애초에 빌드 시점에만 계산하는 구조 자체가 문제라면 근본적인 해결책이 되지 못한다.
