---
title: 스택/큐 개념과 문제 패턴
description: 스택과 큐를 언제 골라 써야 하는지, 괄호 매칭/시뮬레이션 문제에서 반복되는 패턴을 정리한다
date: 2026-07-31
updated:
category: cs
technology: [cpp]
tags: [stack, queue, pattern-recognition]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

"방금 넣은 걸 먼저 꺼내야 하면" 스택, "먼저 넣은 걸 먼저 꺼내야 하면" 큐다.

## 왜 (배경/문제 상황)

스택/큐 자체는 API가 단순해서 어렵지 않은데, "이 문제가 스택 문제인지"를 알아채는 게 관건이다. 특히 괄호 매칭류, 시뮬레이션류가 반복되는 유형이라 신호만 잡으면 빠르게 풀린다.

## 본문

### 문제 신호 → 자료구조 매칭

| 문제에서 이런 게 보이면 | 자료구조 |
|---|---|
| "짝을 맞춰야 한다" (괄호, 태그 등) | 스택 |
| "가장 최근 것과 비교/제거" | 스택 |
| "순서대로 처리해야 한다" (대기열, 시뮬레이션) | 큐 |
| "일정 시간/순서마다 앞에서부터 하나씩 처리" | 큐 |

### 패턴 1. 괄호/짝 맞추기 (스택)

여는 것을 넣고, 닫는 게 나오면 스택 맨 위와 짝이 맞는지 확인한다.

```cpp
bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(') {
            st.push(c);
        } else if (c == ')') {
            if (st.empty()) return false; // 닫을 게 없는데 닫으려 함
            st.pop();
        }
    }
    return st.empty(); // 다 짝지어졌으면 비어있어야 함
}
```

여는 괄호가 여러 종류면(`(`, `{`, `[`), 닫는 괄호가 나올 때 스택 맨 위 문자와 정확히 짝이 맞는지까지 확인해야 한다.

### 패턴 2. 뒤에서 조건에 안 맞는 걸 계속 제거 (스택)

예: "숫자를 몇 개 지워서 가장 큰/작은 수를 만들어라" 유형.

```cpp
string solution(string number, int k) {
    stack<char> st;
    for (char c : number) {
        // 지울 기회(k)가 남아있고, 지금 넣을 숫자가 스택 맨 위보다 크면 스택 맨 위를 지운다
        while (!st.empty() && k > 0 && st.top() < c) {
            st.pop();
            k--;
        }
        st.push(c);
    }
    // k가 남았으면 뒤에서부터 마저 지운다
    string result(st.begin(), st.end());
    result.resize(result.size() - k);
    return result;
}
```

"지금 원소가 이전 원소보다 크면 이전 걸 지운다"는 조건이 나오면 스택 패턴을 의심한다.

### 패턴 3. 순서대로 처리하는 시뮬레이션 (큐)

예: "인쇄 대기열", "카드 뽑기" 같은 유형. 맨 앞을 꺼내서 조건 확인 후 다시 넣거나 처리한다.

```cpp
queue<int> q;
for (int x : arr) q.push(x);

while (!q.empty()) {
    int cur = q.front(); q.pop();
    if (/* 조건 */) {
        // 처리
    } else {
        q.push(cur); // 다시 뒤로 보냄
    }
}
```

## 예제

"기능개발" 유형(프로그래머스): 작업 진도를 큐에 순서대로 넣고, 앞에서부터 완료 여부를 확인하면서 같이 배포되는 묶음을 센다. "앞에서부터 순서대로, 먼저 온 게 먼저 처리된다"는 신호가 곧 큐 패턴이다.

```cpp
queue<int> q;
for (int p : progresses) q.push(p);

vector<int> answer;
while (!q.empty()) {
    int count = 0;
    int firstDay = /* 첫 작업이 완료되는 날 계산 */;
    while (!q.empty() && /* 현재 작업이 firstDay 안에 끝남 */) {
        q.pop();
        count++;
    }
    answer.push_back(count);
}
```

## 주의사항

- 스택이 비어있는 상태에서 `top()`이나 `pop()`을 호출하면 정의되지 않은 동작(런타임 에러)이 난다. 항상 `empty()` 체크를 먼저 한다.
- 큐에서 `front()`로 값을 본 다음 `pop()`을 깜빡하면 무한루프에 빠지기 쉽다.
- "스택으로 풀 수 있는 문제인데 재귀로 풀면 스택 오버플로우가 날 수도 있다"는 것도 알아두면 좋다 — 재귀 깊이가 깊어질 문제(예: 원소 수가 많은 괄호 문자열)는 스택 자료구조로 직접 푸는 게 안전하다.

## 참고자료

- 프로그래머스 "괄호 회전하기", "가장 큰 수" 유형 (스택)
- 프로그래머스 "기능개발", "프로세스" 유형 (큐)
