---
title: 힙(우선순위 큐) 개념과 문제 패턴
description: 힙을 언제 써야 하는지, "가장 크거나 작은 것을 계속 꺼내야 하는" 문제 패턴을 정리한다
date: 2026-07-31
updated:
category: cs
technology: [cpp]
tags: [heap, priority-queue, pattern-recognition]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

"정렬된 상태를 계속 유지하면서 최댓값/최솟값을 반복해서 꺼내야 하면" 힙을 쓴다.

## 왜 (배경/문제 상황)

매번 최댓값/최솟값을 찾으려고 배열을 정렬하면 O(n log n)이 반복되어 느리다. 힙(우선순위 큐)을 쓰면 삽입도 O(log n), 최댓값/최솟값 꺼내기도 O(log n)이라 "값을 넣었다 뺐다를 반복"하는 문제에 훨씬 유리하다.

## 본문

### 문제 신호 → 힙 쓸지 판단

| 문제에서 이런 게 보이면 | 신호 |
|---|---|
| "가장 큰/작은 것을 K개 뽑아라" | 힙 |
| "값을 계속 추가하면서 그때그때 최댓값/최솟값이 필요" | 힙 |
| "두 개를 합쳐서 다시 넣는 걸 반복" | 힙 |
| 그냥 한 번 정렬해서 끝나는 문제 | 정렬로 충분, 힙 불필요 |

**힙과 정렬의 차이**: 정렬은 "한 번에 다 정렬해두고 끝"이지만, 힙은 "중간에 값이 계속 추가/제거되면서 그때마다 최댓값/최솟값을 알아야 하는" 상황에 쓴다. 값 추가가 없다면 굳이 힙을 쓸 필요 없이 정렬 한 번이면 충분하다.

### C++에서 힙 사용법

```cpp
#include <queue>

// 최대 힙 (기본값)
priority_queue<int> maxHeap;
maxHeap.push(3);
maxHeap.push(1);
maxHeap.push(2);
cout << maxHeap.top(); // 3 (가장 큰 값)

// 최소 힙 (greater 사용)
priority_queue<int, vector<int>, greater<int>> minHeap;
minHeap.push(3);
minHeap.push(1);
cout << minHeap.top(); // 1 (가장 작은 값)
```

`priority_queue`는 기본이 최대 힙이라는 걸 기억한다. 최소 힙이 필요하면 `greater<int>`를 명시해야 한다.

### 패턴 1. K개 뽑기 (정렬보다 힙이 유리한 경우)

전체를 정렬하면 O(n log n)이지만, 힙으로 K개만 뽑으면 O(n log k)로 더 빠르다. 단, 코테 범위에서는 정렬로 풀어도 시간초과가 잘 안 나므로 "힙까지 안 써도 되는 경우"도 많다는 걸 감안한다.

```cpp
priority_queue<int, vector<int>, greater<int>> minHeap; // 최소 힙으로 "가장 작은 K개" 유지

for (int x : arr) {
    minHeap.push(x);
    if (minHeap.size() > k) {
        minHeap.pop(); // 힙 크기를 K로 유지 -> 가장 큰 값들이 남음 (상위 K개 관리 용도)
    }
}
```

### 패턴 2. 두 값을 합쳐서 다시 넣기 반복

예: "카드 합치기", "작업 최소 시간" 유형. 가장 작은 두 개를 계속 꺼내 합쳐서 다시 넣는다.

```cpp
priority_queue<int, vector<int>, greater<int>> minHeap;
for (int x : cards) minHeap.push(x);

long long totalCost = 0;
while (minHeap.size() > 1) {
    int a = minHeap.top(); minHeap.pop();
    int b = minHeap.top(); minHeap.pop();
    int merged = a + b;
    totalCost += merged;
    minHeap.push(merged);
}
```

## 예제

"디스크 컨트롤러" 유형(프로그래머스): 작업들을 요청 시간 순으로 정렬해두고, 현재 시각까지 요청된 작업들 중에서 "가장 짧은 작업"을 힙으로 골라 처리한다. "그때그때 조건을 만족하는 것 중 최선을 고른다"가 힙의 전형적인 신호다.

```cpp
priority_queue<int, vector<int>, greater<int>> available; // 처리 시간 기준 최소 힙

// 현재 시각까지 요청된 작업들을 힙에 넣고
// available.top()으로 가장 짧은 작업부터 처리
```

## 주의사항

- `priority_queue`는 기본이 최대 힙이다. 최소 힙이 필요한데 `greater<int>`를 빼먹으면 정반대 순서로 나온다.
- `pair`나 `vector`를 힙에 넣을 때는 어떤 필드 기준으로 비교할지 comparator를 직접 지정해야 하는 경우가 많다 (기본은 `first` 기준).
- 값 추가/삭제가 없는 "한 번 정렬하고 끝"인 문제에 힙을 쓰면 코드만 복잡해지고 이득이 없다. 힙이 필요한 상황인지(추가/삭제 반복 여부) 먼저 확인한다.

## 참고자료

- 프로그래머스 "디스크 컨트롤러", "이중우선순위큐" 유형
