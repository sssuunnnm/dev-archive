---
title: 베스트앨범
description: 해시로 장르별 집계를 하고, 다중 조건 정렬로 최종 답을 구하는 해시+정렬 복합 문제를 정리한다
date: 2026-07-31
updated:
category: cs
technology: [cpp]
tags: [hash, sort, level-3]
type: troubleshooting
status: archive
series:
projects:
related:
  - hash-basics
  - sort-basics
  - pair-tuple-basics
aliases:
draft: false
---

## 한 줄 요약

장르별 총 재생수로 장르 순서를 정하고, 각 장르 안에서는 재생수 내림차순으로 최대 2곡을 뽑는 해시+정렬 복합 문제.

## 왜 (배경/문제 상황)

[베스트앨범](https://school.programmers.co.kr/learn/courses/30/lessons/42579) — 장르별 총 재생 횟수가 큰 순서로, 각 장르 안에서는 재생 횟수가 큰 순서로 최대 2곡씩 앨범에 수록하는 문제. `genres`와 `plays`가 인덱스로 짝지어진 별도 벡터로 주어진다.

## 원인 분석 → 해결 방법

**막혔던 부분 1: 장르와 재생수가 서로 다른 벡터에 있어서 어떻게 묶어야 할지 헷갈림**

`genres[i]`와 `plays[i]`가 같은 i번째 곡을 가리킨다는 게 암묵적 약속이다. `for (auto& g : genres)`처럼 range-based for로는 다른 배열과 짝을 맞출 방법이 없어서, 인덱스 기반 for로 순회해야 한다.

```cpp
for (int i = 0; i < genres.size(); i++) {
    string genre = genres[i];
    int play = plays[i];
}
```

**막혔던 부분 2: pair vs 구조체 선택**

값이 (재생수, 인덱스) 2개뿐이라 pair가 적합했고, `sort()`가 pair의 `first`→`second` 순서로 기본 비교를 지원해줘서 comparator 없이도 편하다는 걸 확인하고 pair로 결정.

**최종 코드**

```cpp
vector<int> solution(vector<string> genres, vector<int> plays) {
    unordered_map<string, int> genreTotal;                     // 장르별 총 재생수
    unordered_map<string, vector<pair<int,int>>> genreSongs;   // 장르별 {재생수, 인덱스}

    for (int i = 0; i < genres.size(); i++) {
        genreTotal[genres[i]] += plays[i];
        genreSongs[genres[i]].push_back({plays[i], i});
    }

    vector<pair<string,int>> genreOrder(genreTotal.begin(), genreTotal.end());
    sort(genreOrder.begin(), genreOrder.end(), [](auto& a, auto& b) {
        return a.second > b.second; // 총 재생수 내림차순
    });

    vector<int> answer;
    for (auto& [genre, total] : genreOrder) {
        auto& songs = genreSongs[genre];
        sort(songs.begin(), songs.end(), [](pair<int,int>& a, pair<int,int>& b) {
            if (a.first != b.first) return a.first > b.first; // 재생수 내림차순
            return a.second < b.second; // 같으면 인덱스 오름차순
        });

        for (int i = 0; i < songs.size() && i < 2; i++) {
            answer.push_back(songs[i].second); // 인덱스만 답에 추가
        }
    }
    return answer;
}
```

## 예제

`unordered_map`은 직접 정렬이 안 되므로, 정렬이 필요한 순간마다 `vector`로 옮겨서 정렬한다. 이 문제에서는 이 패턴이 두 번 나온다 — 장르 순서를 정할 때 한 번, 장르 안 곡 순서를 정할 때 한 번.

## 주의사항

- 답에는 재생수가 아니라 **인덱스**(`songs[i].second`)를 넣어야 한다. 재생수를 넣는 실수를 하기 쉽다.
- pair는 값이 2개이고 정렬 편의성이 필요할 때 유리하고, 구조체는 값이 3개 이상이거나 이름이 명확해야 읽기 편할 때 유리하다 — 상황에 따라 골라 쓴다.

## 참고자료

- [해시 개념과 문제 패턴](../hash-basics/) — 빈도수 세기(장르별 총 재생수 집계)
- [정렬 개념과 문제 패턴](../sort-basics/) — 다중 조건 정렬 패턴
- [pair / tuple 다루기](../../snippets/pair-tuple-basics/) — pair 기본 비교 연산자