---
title: 정렬 개념과 문제 패턴
description: 기본 정렬 말고 comparator를 커스텀해야 하는 문제, 정렬이 다른 알고리즘의 전처리로 쓰이는 패턴을 정리한다
date: 2026-07-31
updated:
category: cs
technology: [cpp]
tags: [sort, comparator, pattern-recognition]
type: study
status: evergreen
series:
projects:
related:
  - sort-comparator
aliases:
draft: false
---

## 한 줄 요약

정렬 문제의 진짜 난이도는 정렬 자체가 아니라 "무엇을 기준으로 정렬할지"를 설계하는 데 있다.

## 왜 (배경/문제 상황)

`sort(v.begin(), v.end())` 한 줄로 끝나는 문제는 거의 없다. 대부분은 "여러 조건을 동시에 만족하는 순서"를 정의하거나, 정렬해둔 다음 다른 알고리즘(투 포인터, 이분탐색 등)을 얹는 형태로 나온다. 그래서 "정렬 문제"를 만났을 때 확인할 건 comparator 설계와, 정렬 뒤에 뭘 더 해야 하는지 두 가지다.

## 본문

### 문제 신호 → 패턴 매칭

| 문제에서 이런 게 보이면 | 패턴 |
|---|---|
| "정렬했을 때 순서가 특이한 기준" (숫자 크기가 아니라 문자열 합친 결과 등) | 커스텀 comparator |
| "여러 조건 중 1순위, 2순위가 있다" | 다중 조건 정렬 |
| "정렬한 다음 앞뒤에서 좁혀나간다" | 정렬 + 투 포인터 |
| "정렬한 다음 누적값으로 위치를 찾는다" | 정렬 + 이분탐색/누적합 |

### 패턴 1. 다중 조건 정렬

가장 흔한 유형. "1순위가 같으면 2순위로 비교"하는 조건을 comparator에 그대로 옮긴다.

```cpp
// 점수 내림차순, 점수가 같으면 이름 오름차순
sort(v.begin(), v.end(), [](pair<int,string>& a, pair<int,string>& b) {
    if (a.first != b.first) return a.first > b.first;
    return a.second < b.second;
});
```

**설계 팁**: comparator를 짤 때 "1순위 조건이 다르면 그걸로 끝, 같으면 2순위로 넘어간다"는 if문 구조를 그대로 유지하면 실수가 줄어든다. 조건을 하나의 수식으로 합치려다 오히려 꼬이는 경우가 많다.

### 패턴 2. 값 자체가 아니라 "가공한 값" 기준 정렬

예: 숫자를 이어붙였을 때 가장 큰/작은 수를 만드는 유형. 숫자 크기가 아니라 "문자열로 이어붙인 결과"가 기준이다.

```cpp
// 이어붙였을 때 더 큰 쪽이 앞에 오도록 정렬
sort(nums.begin(), nums.end(), [](string& a, string& b) {
    return a + b > b + a;
});
```

`3`과 `30`을 비교할 때 숫자 크기(`30 > 3`)가 아니라 `"330"` vs `"303"`을 비교해서 정렬 기준을 정하는 게 핵심이다. 이런 문제는 "정렬 기준이 뭔지"부터 다시 정의해야 한다는 신호다.

### 패턴 3. 정렬 + 투 포인터

정렬해두면 "왼쪽에서 하나, 오른쪽에서 하나 잡고 좁혀나가는" 방식이 성립하는 경우가 많다. 예: "두 수의 합이 특정 값이 되는 조합 찾기".

```cpp
sort(v.begin(), v.end());
int left = 0, right = v.size() - 1;
while (left < right) {
    int sum = v[left] + v[right];
    if (sum == target) {
        // 찾음
        break;
    } else if (sum < target) {
        left++;
    } else {
        right--;
    }
}
```

정렬이 안 돼 있으면 이 방식 자체가 성립하지 않는다는 걸 기억해두면, "정렬부터 하고 시작해야겠다"는 판단이 빨라진다.

### 패턴 4. 정렬 + 이분탐색

정렬해둔 배열에서 특정 값의 위치나 조건을 만족하는 경계를 찾을 때. `lower_bound`/`upper_bound`를 바로 쓸 수 있게 된다.

```cpp
sort(v.begin(), v.end());
auto it = lower_bound(v.begin(), v.end(), target); // target 이상이 처음 나오는 위치
```

## 예제

"완주하지 못한 선수"류 문제를 정렬로 풀면(해시 대신): 참가자/완주자 배열을 각각 정렬한 뒤, 같은 인덱스끼리 비교하다가 다른 지점이 나오면 그게 답이다.

```cpp
string solution(vector<string> participant, vector<string> completion) {
    sort(participant.begin(), participant.end());
    sort(completion.begin(), completion.end());

    for (int i = 0; i < completion.size(); i++) {
        if (participant[i] != completion[i]) {
            return participant[i];
        }
    }
    return participant.back(); // 마지막 한 명이 완주 못한 경우
}
```

해시로 풀면 O(n), 정렬로 풀면 O(n log n)이라 해시가 더 빠르지만, 이렇게 "같은 문제를 정렬로도 풀 수 있다"는 걸 알아두면 접근법이 하나 더 늘어난다.

## 주의사항

- comparator에서 `<=`, `>=` 같은 비엄격 비교를 쓰면 정렬 중 정의되지 않은 동작이 날 수 있다. 항상 엄격한 비교(`<`, `>`)로 짠다.
- 문자열을 이어붙여 비교하는 패턴(패턴 2)에서 `a+b > b+a`를 반대로 쓰면 오름차순/내림차순이 뒤집힌다. 헷갈리면 예시 숫자 2개로 직접 검산한다.
- 정렬 후 원래 인덱스가 필요한 문제(예: "정렬 전 순서를 출력하라")라면, 값만 정렬하지 말고 `pair<값, 원래인덱스>`로 묶어서 정렬해야 한다.

## 참고자료

- [sort 커스텀 comparator](../../snippets/sort-comparator/) — comparator 문법 스니펫