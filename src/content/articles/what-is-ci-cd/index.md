---
title: CI/CD란 무엇인가
description: CI/CD의 개념과 각 단계가 실제로 무엇을 하는지 정리한다.
date: 2026-07-27
category: infra
technology:
  - github-actions
  - docker
tags:
  - ci-cd
  - deployment
type: study
status: evergreen
draft: false
---

## 한 줄 요약

CI/CD는 코드를 병합(Merge)하는 순간부터 실제 서비스에 반영되기까지의 과정을 자동화하는 것이다.

## 왜 공부했는가

`.github/workflows`에 배포 설정을 작성하면서 CI와 CD가 정확히 어디서부터 어디까지를 가리키는지 헷갈렸다. 개념을 명확히 정리하고, 이후 파이프라인을 설계할 때 기준으로 삼기 위해 정리한다.

## 본문

### CI (Continuous Integration, 지속적 통합)

여러 개발자가 작성한 코드를 자주, 자동으로 통합하고 검증하는 과정이다.

일반적으로 아래 순서로 이루어진다.

1. 코드를 원격 저장소(main 또는 feature 브랜치)에 push
2. 자동으로 빌드 실행
3. 테스트 코드 실행
4. 린트(lint), 정적 분석 등 코드 품질 검사

CI의 목적은 "코드가 저장소에 올라갈 때마다 문제가 없는지 자동으로 검증"하는 것이다. 사람이 매번 로컬에서 빌드/테스트를 돌려보지 않아도, 문제가 있으면 즉시 알 수 있다.

### CD (Continuous Delivery / Deployment, 지속적 전달/배포)

CI를 통과한 코드를 실제 환경에 반영하는 과정이다. CD는 두 가지로 나뉜다.

- **Continuous Delivery(지속적 전달)**: 배포 가능한 상태까지 자동으로 준비하되, 실제 배포는 사람이 최종 승인한다.
- **Continuous Deployment(지속적 배포)**: 승인 과정 없이 검증을 통과하면 자동으로 프로덕션까지 배포한다.

두 개념 모두 "CD"로 줄여 쓰기 때문에 문맥에 따라 구분해야 한다.

### 전체 흐름

```text
코드 작성 → push → [CI: 빌드 → 테스트 → 검사] → [CD: 빌드 아티팩트 생성 → 배포]
```

CI가 실패하면 그 뒤 단계(CD)는 진행되지 않는다. "품질 검증 없이는 배포도 없다"가 핵심 원칙이다.

## 예제

GitHub Actions 기반의 간단한 CI/CD 워크플로우 구조:

```yaml
name: CI/CD
on:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run build      # CI: 빌드
      - run: npm test           # CI: 테스트

  cd:
    needs: ci                   # CI 통과해야 실행됨
    runs-on: ubuntu-latest
    steps:
      - run: echo "여기서 실제 배포 로직 실행"
```

`needs: ci`로 CD job이 CI job의 성공 여부에 의존하게 만드는 것이 핵심이다.

> 위 예시는 개념 설명을 위한 의사 코드(pseudo-code)다. 실제로는 `ci` job에서 만든 빌드 결과물을 `cd` job에서 그대로 쓰려면 `actions/upload-artifact`로 업로드하고 `actions/download-artifact`로 내려받는 과정이 추가로 필요하다 (job이 서로 다른 러너에서 실행되기 때문에 파일 시스템이 공유되지 않는다).

## 주의사항

- CI만 있고 CD가 없는 경우도 흔하다. 배포는 여전히 수동으로 하되, 빌드/테스트만 자동화하는 팀도 많다. 두 개념을 항상 세트로 여길 필요는 없다.
- 테스트 코드가 없으면 CI의 효과가 크게 줄어든다. "빌드만 되는지" 확인하는 수준에 그치기 때문에, 테스트 커버리지가 어느 정도 뒷받침돼야 CI/CD의 이점이 커진다.
- 배포 자동화 전에는 롤백(이전 버전으로 되돌리기) 전략도 함께 고려해야 한다.