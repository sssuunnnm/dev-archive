---
title: GitHub Actions 워크플로우 기본 문법 정리
description: workflow yaml의 트리거/job/step 구조와 매트릭스 빌드, job 간 아티팩트 전달 같은 자주 쓰는 문법을 정리한다
date: 2026-09-14
updated:
category: infra
technology: [github-actions]
tags: [ci-cd, automation]
type: tutorial
status: evergreen
series:
projects:
related: [what-is-ci-cd]
aliases:
draft: true
---

## 한 줄 요약

GitHub Actions 워크플로우는 "언제(on) 실행할지"와 "무엇을(jobs) 할지"를 yaml로 선언하는 자동화 설정이고, job은 서로 독립된 러너에서 돌기 때문에 결과물을 주고받으려면 아티팩트를 명시적으로 업로드/다운로드해야 한다.

## 왜 (배경/문제 상황)

[CI/CD란 무엇인가](/infra/what-is-ci-cd/)에서 개념과 아주 기본적인 예시만 짚었는데, 실제로 워크플로우 파일을 작성하려면 트리거 종류, job 간 의존 관계, 여러 환경에서 동시에 테스트하는 매트릭스, job끼리 파일을 주고받는 방법 같은 문법을 더 알아야 한다. 이번 글에서 그 부분을 채운다.

## 본문

### 워크플로우 파일 위치

워크플로우는 저장소의 `.github/workflows/` 아래에 있는 `.yml` 파일 하나하나가 각각 독립된 워크플로우가 된다. 파일 이름은 자유롭게 지어도 되고, 파일 안의 `name` 값이 GitHub Actions 탭에 표시되는 이름이다.

### 트리거(on) — 언제 실행할지

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'    # 매일 UTC 자정
  workflow_dispatch:        # GitHub UI에서 수동으로 실행하는 버튼 생성
```

- **push**: 지정한 브랜치에 커밋이 push될 때.
- **pull_request**: 지정한 브랜치를 대상으로 PR이 열리거나 갱신될 때. `push`와 달리 PR을 만든 브랜치의 코드 기준으로 실행된다.
- **schedule**: cron 표현식으로 정기 실행. Git Hooks가 로컬 이벤트에 반응한다면, 이건 시간 자체가 트리거다.
- **workflow_dispatch**: 이벤트 없이 사람이 GitHub UI(또는 API)에서 버튼을 눌러 수동 실행. 배포처럼 사람이 타이밍을 결정해야 하는 작업에 쓴다.

여러 트리거를 동시에 등록할 수 있고, 각 트리거는 독립적으로 워크플로우를 실행시킨다.

### jobs와 steps

하나의 워크플로우는 여러 `job`으로 구성되고, 각 job은 `steps`라는 순차적인 작업 목록을 가진다.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4        # 저장소 코드를 러너에 내려받기
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
```

- **runs-on**: job이 실행될 러너(가상 머신) 종류. `ubuntu-latest`, `windows-latest`, `macos-latest` 등.
- **uses**: 다른 사람(또는 GitHub)이 이미 만들어둔 재사용 가능한 액션을 가져다 쓴다. 버전은 `@v4`처럼 태그로 고정한다.
- **run**: 셸 명령을 직접 실행한다.

기본적으로 같은 워크플로우 안의 job들은 **서로 병렬로** 실행된다. 순서를 강제하려면 `needs`로 의존 관계를 선언해야 한다 (앞선 CI/CD 글의 `needs: ci` 예시가 이 문법이다).

### 환경변수와 시크릿

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
    steps:
      - run: echo "배포 대상 $NODE_ENV"
      - run: curl -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" https://api.example.com/deploy
```

- **env**: 워크플로우, job, step 어느 단계에도 선언할 수 있는 일반 환경변수.
- **secrets**: 저장소 Settings에 등록해둔 민감 값(API 키, 토큰 등)을 `${{ secrets.이름 }}` 문법으로 참조한다. 로그에 그대로 찍히지 않도록 GitHub이 자동으로 마스킹 처리한다.

### 매트릭스 — 여러 조합을 한 번에 테스트

Node.js 버전 여러 개, OS 여러 개처럼 조합별로 같은 job을 반복 실행하고 싶을 때 `strategy.matrix`를 쓴다.

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

이 설정 하나로 Node 18/20/22 세 가지 버전 각각에 대해 동일한 job이 독립적으로 3번 실행된다. 여러 줄로 job을 복사-붙여넣기 하지 않아도 된다.

### job 간 아티팩트 전달

job은 각자 다른 러너(별도의 가상 머신)에서 실행되기 때문에 파일 시스템을 공유하지 않는다. 한 job에서 만든 빌드 결과물을 다른 job에서 쓰려면 아티팩트로 업로드하고 내려받아야 한다.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: echo "dist/ 안의 빌드 결과물로 배포 진행"
```

`build` job이 만든 `dist/` 폴더를 `build-output`이라는 이름으로 업로드하면, `needs: build`로 의존하는 `deploy` job에서 같은 이름으로 다시 내려받아 이어서 쓸 수 있다.

## 예제

앞의 조각들을 합치면, "여러 Node 버전으로 테스트 → 통과하면 빌드 → 빌드 결과물을 다음 job에 전달"까지 한 워크플로우로 구성할 수 있다.

```yaml
name: CI
on:
  push:
    branches: [main]

jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm install
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
```

`build` job은 `needs: test`로 걸려있어서, 매트릭스로 돌린 세 버전 테스트가 전부 통과해야만 실행된다.

## 주의사항

- 액션 버전을 `@main`이나 `@latest`처럼 고정하지 않은 채 쓰면, 그 액션이 나중에 예고 없이 바뀌었을 때 워크플로우가 갑자기 실패하거나 다르게 동작할 수 있다. `@v4`처럼 메이저 버전을, 더 엄격하게는 특정 커밋 SHA를 고정해서 쓰는 게 안전하다.
- `pull_request` 트리거로 실행되는 워크플로우는 기본적으로 `secrets`에 대한 접근이 제한된다(특히 fork에서 온 PR). 시크릿이 꼭 필요한 검증이라면 트리거 방식과 권한 설정을 먼저 확인해야 한다.
- 아티팩트는 기본 보관 기간이 지나면 자동 삭제된다 (저장소 설정에 따라 다르며, 기본값은 90일). 빌드 결과물을 오래 보관해야 하면 별도 스토리지(릴리스, 외부 스토리지 등)로 옮기는 과정이 필요하다.

## 참고자료

- [GitHub Actions 공식 문서 — Workflow syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions 공식 문서 — Storing and sharing data with workflow artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
