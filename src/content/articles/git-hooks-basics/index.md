---
title: Git Hooks로 커밋 전 자동 검사하기
description: pre-commit/commit-msg 등 Git Hooks 종류와, 로컬에서 커밋 전 자동 검사를 붙이는 기본 설정법을 정리한다
date: 2026-09-10
updated:
category: development
technology: [git]
tags: [automation, pre-commit]
type: tutorial
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

Git Hooks는 커밋·푸시 같은 Git 이벤트가 일어날 때 자동으로 실행되는 스크립트이고, `pre-commit` 훅에 린트나 테스트를 걸어두면 문제 있는 코드가 커밋되는 걸 사람이 매번 기억하지 않고도 막을 수 있다.

## 왜 (배경/문제 상황)

코드 스타일 검사나 테스트를 "커밋하기 전에 꼭 돌리자"고 팀 규칙으로 정해도, 사람이 매번 기억해서 수동으로 돌리는 방식은 결국 빠뜨리는 순간이 생긴다. CI에서 잡아도 되지만 그때는 이미 커밋도, 경우에 따라 푸시도 끝난 뒤라 되돌리는 비용이 더 크다. Git Hooks는 Git 이벤트 자체에 스크립트를 걸어서, 사람이 신경 쓰지 않아도 특정 시점에 자동으로 검사가 실행되게 한다.

## 본문

### Git Hooks란

모든 Git 저장소는 `.git/hooks/` 디렉토리를 갖고 있고, 여기에 정해진 이름의 실행 가능한 스크립트를 두면 해당 이벤트가 발생할 때 Git이 자동으로 그 스크립트를 실행한다. 새 저장소를 만들면 `.git/hooks/`에 `pre-commit.sample`처럼 `.sample` 확장자가 붙은 예시 파일들이 이미 들어있는데, 확장자를 떼고 실행 권한만 주면 바로 동작한다.

```bash
ls .git/hooks/                  # pre-commit.sample, commit-msg.sample 등 확인
mv .git/hooks/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit  # 실행 권한 부여 (없으면 Git이 무시한다)
```

### 자주 쓰는 훅 종류 (클라이언트 사이드)

로컬에서 개발자가 직접 겪는 훅은 대체로 이 세 가지다.

- **pre-commit**: `git commit` 실행 시, 커밋 메시지를 입력받기 전에 실행된다. 린트, 포맷 검사처럼 "코드 자체"를 검사하기 적합하다.
- **commit-msg**: 커밋 메시지가 이미 작성된 뒤 실행된다. 메시지 형식(`type: 설명` 같은 컨벤션)을 강제하기 적합하다.
- **pre-push**: `git push` 실행 시, 실제로 원격에 전송되기 전에 실행된다. 테스트처럼 시간이 좀 걸리더라도 커밋마다는 아니고 푸시할 때 한 번만 돌리고 싶은 검사에 적합하다.

이 외에도 서버 쪽에서 push를 받을 때 실행되는 `pre-receive`, `post-receive` 같은 훅도 있지만, 이건 저장소를 호스팅하는 서버(또는 GitHub Actions 같은 CI)의 영역이라 이 글에서는 다루지 않는다.

### pre-commit 훅 예제

훅 스크립트는 종료 코드(exit code)로 결과를 알린다. `0`이면 통과, `0`이 아니면 Git이 해당 동작(커밋)을 중단시킨다.

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "린트 검사 중..."
npm run lint

if [ $? -ne 0 ]; then
  echo "린트 실패 - 커밋이 중단되었습니다."
  exit 1
fi
```

`npm run lint`가 실패(0이 아닌 종료 코드)하면 스크립트가 `exit 1`로 끝나면서 커밋 자체가 만들어지지 않는다.

### commit-msg 훅 예제

`commit-msg` 훅은 인자로 커밋 메시지가 저장된 임시 파일 경로를 받는다.

```bash
#!/bin/sh
# .git/hooks/commit-msg

msg_file=$1
pattern="^(feat|fix|refactor|docs|chore|style): .+"

if ! grep -qE "$pattern" "$msg_file"; then
  echo "커밋 메시지는 'type: 설명' 형식이어야 합니다 (예: feat: 로그인 기능 추가)"
  exit 1
fi
```

정규식과 일치하지 않는 형식의 메시지로 커밋하려고 하면 훅이 막아준다.

### .git/hooks는 버전관리되지 않는다

`.git/` 디렉토리 자체는 Git이 저장소를 관리하는 내부 데이터라서 커밋 대상이 아니다. 즉 `.git/hooks/`에 스크립트를 직접 넣는 방식은 그 저장소를 새로 클론한 팀원에게는 전달되지 않는다. 팀 전체가 같은 훅을 쓰려면 훅 스크립트를 저장소 안의 일반 폴더(예: `.githooks/`)에 커밋해두고, `core.hooksPath` 설정으로 Git이 그 폴더를 보게 만드는 방법을 쓴다.

```bash
git config core.hooksPath .githooks
```

이렇게 설정하면 `.git/hooks/` 대신 저장소에 커밋된 `.githooks/` 안의 스크립트가 실행된다. 다만 이 설정 자체는 각자 로컬에서 한 번 실행해야 적용되므로, 팀원 전원이 클론 직후 이 명령을 실행하도록 안내하는 절차가 필요하다 (또는 husky 같은 도구를 쓰면 `npm install` 시 자동으로 이 설정까지 해준다).

### 훅 우회하기

급하게 훅을 건너뛰어야 할 때는 `--no-verify` 옵션으로 `pre-commit`, `commit-msg` 훅을 건너뛸 수 있다.

```bash
git commit --no-verify -m "긴급 수정"
```

훅이 막아주는 검사를 그대로 건너뛰는 옵션이라, 습관적으로 쓰면 훅을 걸어둔 의미가 없어진다.

## 예제

새로 클론한 저장소에 팀 공용 훅을 적용하는 전체 흐름은 이렇다.

```bash
git clone <repo-url>
cd <repo>
git config core.hooksPath .githooks   # 저장소에 커밋된 훅 폴더를 쓰도록 설정
chmod +x .githooks/*                  # 실행 권한 부여 (클론 시 실행 권한이 유지 안 될 수 있음)
git commit -m "wrong format"          # commit-msg 훅이 형식을 검사해서 막음
git commit -m "fix: 형식 맞춰 재시도"   # 통과
```

## 주의사항

- 훅 스크립트에 실행 권한(`chmod +x`)이 없으면 Git이 조용히 무시하고 넘어간다. "분명 훅을 만들었는데 안 걸린다"는 문제의 상당수가 이 실행 권한 누락이다.
- `pre-commit`에 무거운 작업(전체 테스트 스위트 등)을 걸면 커밋할 때마다 대기 시간이 길어져서 오히려 훅을 끄고 싶어지는 역효과가 난다. 무거운 검사는 `pre-push`나 CI로 미루고, `pre-commit`은 빠르게 끝나는 검사(린트, 변경된 파일만 대상으로 한 포맷 체크 등) 위주로 구성하는 편이 낫다.
- 훅은 어디까지나 로컬 방어선이다. `--no-verify`로 우회하거나 훅 설정 자체를 안 한 상태로도 푸시는 가능하므로, 정말 강제해야 하는 규칙(브랜치 보호, 필수 상태 검사 등)은 GitHub 같은 원격 저장소 쪽 설정이나 CI에도 동일하게 걸어둬야 한다.

## 참고자료

- [Git 공식 문서 — Customizing Git - Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
