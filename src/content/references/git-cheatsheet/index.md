---
title: Git 명령어 치트시트
technology: [git]
tags: [version-control, branch, rebase, commit]
updated: 2026-07-29
---

## 기본 설정 / 초기화

| 명령어 | 설명 | 언제 쓰나 |
|---|---|---|
| `git init` | 현재 폴더를 Git 저장소로 초기화 | 새 프로젝트 시작할 때 |
| `git clone {url}` | 원격 저장소 복제 | 기존 저장소 로컬로 받아올 때 |
| `git config --global user.name "{name}"` | 전역 사용자 이름 설정 | 최초 세팅 시 |
| `git config --global user.email "{email}"` | 전역 이메일 설정 | 최초 세팅 시 |
| `git config --list` | 현재 설정 전체 확인 | 설정값 헷갈릴 때 |

## 상태 확인 / add / commit

| 명령어 | 설명 | 언제 쓰나 |
|---|---|---|
| `git status` | 변경 파일 상태 확인 | 커밋 전 습관적으로 |
| `git diff` | 스테이징 전 변경 내용 확인 | add 하기 전에 뭘 고쳤는지 볼 때 |
| `git diff --staged` | 스테이징된 변경 내용 확인 | commit 직전 최종 확인 |
| `git add {file}` | 특정 파일 스테이징 | 일부 파일만 커밋할 때 |
| `git add .` | 전체 변경 파일 스테이징 | 변경사항 전부 커밋할 때 |
| `git commit -m "{message}"` | 커밋 생성 | 작업 단위 완료 시 |
| `git commit --amend` | 직전 커밋 메시지/내용 수정 | push 전 오타·누락 파일 수정 |
| `git commit --amend --no-edit` | 메시지 변경 없이 직전 커밋에 파일만 추가 | 커밋 직후 파일 하나 빠뜨렸을 때 |
| `git log --oneline` | 커밋 이력을 한 줄씩 간단히 확인 | 전체 흐름 빠르게 훑을 때 |
| `git log --oneline --graph` | 한 줄 + 브랜치 그래프로 이력 확인 | 브랜치 병합 구조 파악할 때 |
| `git log -p {file}` | 파일별 커밋 diff까지 확인 | 특정 파일이 왜 바뀌었는지 추적할 때 |
| `git reflog` | HEAD 이동 이력(커밋 아닌 것 포함) 확인 | reset/rebase 잘못해서 커밋이 사라진 것 같을 때 |

## 브랜치

| 명령어 | 설명 | 언제 쓰나 |
|---|---|---|
| `git branch` | 로컬 브랜치 목록 확인 | 지금 어떤 브랜치들이 있는지 볼 때 |
| `git branch {name}` | 새 브랜치 생성 (전환은 안 함) | 브랜치만 미리 만들어둘 때 |
| `git checkout {name}` | 브랜치 전환 | 기존 방식, switch와 동일 목적 |
| `git switch {name}` | 브랜치 전환 (checkout보다 명확한 최신 명령) | 브랜치 전환만 할 때 (권장) |
| `git switch -c {name}` | 브랜치 생성 + 전환 동시 실행 | 새 작업 시작할 때 (권장) |
| `git checkout -b {name}` | 브랜치 생성 + 전환 동시 실행 (구버전 표기) | switch -c와 동일, 팀 컨벤션이 checkout일 때 |
| `git branch -d {name}` | 로컬 브랜치 삭제 (병합된 경우) | PR 머지 완료 후 정리 |
| `git branch -D {name}` | 로컬 브랜치 강제 삭제 | 병합 안 된 브랜치 버릴 때 |
| `git push origin --delete {name}` | 원격 브랜치 삭제 | 머지 후 원격 정리 |

## 원격 저장소 (remote / push / pull)

| 명령어 | 설명 | 언제 쓰나 |
|---|---|---|
| `git remote -v` | 연결된 원격 저장소 확인 | 원격 주소 헷갈릴 때 |
| `git remote add origin {url}` | 원격 저장소 연결 | 로컬 저장소를 원격에 처음 연결할 때 |
| `git push -u origin {branch}` | 브랜치 최초 push (이후 upstream 추적) | 새 브랜치 처음 push할 때 |
| `git push` | 현재 브랜치 push | 이미 upstream 연결된 브랜치 갱신 |
| `git push --force-with-lease` | 안전장치 있는 강제 push | amend/rebase 후 원격 갱신할 때 (권장) |
| `git push --force` | 강제 push (원격 이력 덮어씀) | 혼자 쓰는 브랜치에서만, 협업 브랜치는 지양 |
| `git pull` | 원격 변경사항 가져오기 + 병합 | 혼자 작업할 때 간단히 |
| `git fetch` | 원격 변경사항만 가져오기 (병합 X) | merge/rebase 전에 최신 상태 확인 |

## merge / rebase

| 명령어 | 설명 | 언제 쓰나 |
|---|---|---|
| `git merge {branch}` | 현재 브랜치에 다른 브랜치 병합 | 이력을 그대로 남기고 합칠 때 |
| `git rebase {branch}` | 현재 브랜치를 다른 브랜치 기준으로 재배치 | PR 올리기 전 히스토리 정리 |
| `git rebase -i HEAD~{n}` | 최근 n개 커밋 대화형 리베이스 (squash 등) | 자잘한 커밋을 하나로 합칠 때 |
| `git rebase --continue` | 충돌 해결 후 리베이스 계속 진행 | rebase 중 conflict 해결한 직후 |
| `git rebase --abort` | 리베이스 중단, 이전 상태로 복구 | rebase가 꼬였을 때 |

## stash

| 명령어 | 설명 | 언제 쓰나 |
|---|---|---|
| `git stash` | 현재 변경사항 임시 저장 | 급하게 브랜치 전환해야 할 때 |
| `git stash list` | 저장된 stash 목록 확인 | 뭘 저장해뒀는지 헷갈릴 때 |
| `git stash pop` | 가장 최근 stash 적용 + 목록에서 제거 | 원래 작업으로 돌아왔을 때 |
| `git stash apply` | stash 적용 (목록에는 유지) | 같은 stash를 여러 브랜치에 적용할 때 |
| `git stash drop` | 특정 stash 삭제 | 더 이상 필요 없는 stash 정리 |

## 되돌리기 (reset / revert / restore)

| 명령어 | 설명 | 언제 쓰나 |
|---|---|---|
| `git restore {file}` | 워킹 디렉토리 변경사항 되돌리기 (스테이징 전) | 파일 수정 취소하고 싶을 때 |
| `git restore --staged {file}` | 스테이징 취소 (변경 내용은 유지) | add 잘못 했을 때 |
| `git restore --source={commit} {file}` | 특정 커밋 시점의 파일 내용으로 복구 | 예전 버전 파일 하나만 되돌리고 싶을 때 |
| `git reset --soft HEAD~1` | 직전 커밋 취소, 변경사항은 스테이징 상태로 유지 | 커밋만 다시 하고 싶을 때 |
| `git reset --mixed HEAD~1` | 직전 커밋 취소, 변경사항은 워킹 디렉토리로 (기본값) | 스테이징부터 다시 정리하고 싶을 때 |
| `git reset --hard HEAD~1` | 직전 커밋 + 변경사항 전부 삭제 (주의) | 완전히 처음부터 다시 할 때 |
| `git revert {commit}` | 특정 커밋을 취소하는 새 커밋 생성 (이력 보존) | 이미 push된 커밋을 안전하게 되돌릴 때 |

## 자주 쓰는 워크플로우

### 새로운 기능 개발

```bash
git switch -c feature/login   # 브랜치 생성 + 전환
git add .                     # 변경사항 스테이징
git commit -m "feat: 로그인 기능 추가"
git push -u origin feature/login   # 최초 push
```

### 커밋 하나 빠뜨렸을 때 (push 전)

```bash
git add {빠뜨린 파일}
git commit --amend --no-edit   # 메시지 유지, 파일만 추가
git push -u origin {branch}    # 최초 push라면 -u, 아니면 push --force-with-lease
```

### PR 올리기 전 히스토리 정리

```bash
git fetch origin                  # 원격 최신 상태 확인
git rebase -i HEAD~3              # 최근 3개 커밋 squash
git push --force-with-lease       # rebase로 이력이 바뀌었으므로 강제 push 필요
```

### 작업 중 급하게 브랜치 전환해야 할 때

```bash
git stash              # 현재 변경사항 임시 저장
git switch main
# ... 급한 작업 처리 ...
git switch feature/login
git stash pop           # 저장해둔 변경사항 복구
```

### 커밋/리베이스를 잘못해서 되돌리고 싶을 때

```bash
git reflog                  # HEAD 이동 이력에서 원하는 시점 커밋 해시 찾기
git reset --hard {commit}   # 해당 시점으로 강제 복구
```

## 주의사항

- `git reset --hard`는 워킹 디렉토리 변경사항을 복구 불가능하게 삭제한다.
- `git rebase`는 이미 원격에 push된 공유 브랜치에서는 지양한다 (이력 충돌 유발).
- `git commit --amend`는 push 이전에만 사용한다. push 후 amend하면 강제 push가 필요해 협업 시 위험하다.
- 강제 push는 가능하면 `--force`보다 `--force-with-lease`를 사용한다 (남이 그 사이 push했으면 실패해서 덮어쓰기를 막아줌).

## 참고자료

- [Git 공식 문서](https://git-scm.com/doc)