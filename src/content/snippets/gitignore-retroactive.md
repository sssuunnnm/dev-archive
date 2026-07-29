---
title: gitignore 뒤늦게 적용하기
command: git rm --cached -- "{file}"
description: 이미 커밋된 파일을 추적에서만 제외 (로컬 파일은 유지, .gitignore 추가 후 사용)
technology: [git]
tags: [gitignore]
---

폴더 전체를 제외하려면 `git rm -r --cached -- "{folder}"`.

`git rm --cached`는 인덱스만 바꾼다. `.gitignore`에 해당 경로를 추가한 뒤,
`git add .gitignore`와 커밋까지 해야 원격 저장소에서도 추적이 실제로 해제된다.