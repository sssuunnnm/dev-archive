---
title: 완주하지 못한 선수
description: 참가자/완주자 명단을 해시로 비교해 완주 못한 선수를 찾는 문제, unordered_map 카운팅 원리를 정리한다
date: 2026-07-31
updated:
category: coding-test
technology: [cpp]
tags: [hash, level-1]
type: troubleshooting
status: archive
series:
projects:
related:
  - hash-basics
aliases:
draft: false
---

## 한 줄 요약

참가자는 +1, 완주자는 -1로 세서 남은 값이 있는 이름을 찾는 해시 빈도수 세기 문제.

## 왜 (배경/문제 상황)

[완주하지 못한 선수](https://school.programmers.co.kr/learn/courses/30/lessons/42576) — 참가자 명단과 완주자 명단이 주어질 때, 완주하지 못한 선수 1명을 찾는 문제. 동명이인이 있을 수 있어서 이름만으로 단순 비교하면 안 된다.

## 원인 분석 → 해결 방법

**막혔던 부분**: `unordered_map<string,int> cnt; cnt[s]++;` 코드가 왜 "존재 여부"를 증명하는지 헷갈렸음.

**해결**: `cnt[s]++`는 존재 증명이 아니라 **빈도수 누적**이다. `unordered_map::operator[]`는 key가 없으면 기본값(0)으로 새로 만든 뒤 그 값을 반환하는 특성이 있어서, 처음 나온 값은 `0→1`, 두 번째부터는 계속 누적된다.

이 특성을 이용해 참가자는 `+1`, 완주자는 `-1`로 누적하면, 끝났을 때 값이 양수로 남은 key가 곧 완주 못한 선수다.

```cpp
string solution(vector<string> participant, vector<string> completion) {
    unordered_map<string, int> cnt;
    for (string& p : participant) cnt[p]++;
    for (string& c : completion) cnt[c]--;

    for (auto& [name, count] : cnt) {
        if (count > 0) return name;
    }
    return "";
}
```

## 예제

동명이인이 있는 경우도 이 방식으로 정확히 처리된다. 이름이 3번 나왔는데 완주가 2번만 빠지면, 그 이름의 카운트가 1로 남아서 정확히 잡힌다.

## 주의사항

- `cnt[key]`로 "존재 확인"을 하면 안 된다 — 없던 key까지 0으로 새로 생성해버린다. 존재 여부만 필요하면 `find()`나 `count()`를 쓴다.
- `find(key)`는 존재하면 iterator, 없으면 `end()`를 반환하고 map을 건드리지 않는다. `count(key)`는 0 또는 1을 반환하며 역시 map을 안 건드린다.

## 참고자료

- [해시 개념과 문제 패턴](../hash-basics/) — 빈도수 세기 패턴 원본