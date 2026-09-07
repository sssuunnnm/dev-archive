---
title: 그래프 문제 패턴 판별 가이드
description: 문제 설명과 입력 형태만 보고 인접리스트/인접행렬, BFS/DFS 중 뭘 써야 할지 빠르게 판단하는 법
date: 2026-07-31
updated:
category: coding-test
technology: [cpp]
tags: [graph, dfs, bfs, pattern-recognition]
type: tips
status: evergreen
series:
projects:
related:
  - graph-basics
aliases:
draft: true
---

## 한 줄 요약

그래프 문제는 "입력이 어떤 모양으로 주어지는가"와 "뭘 구하라고 하는가" 두 가지만 확인하면 거의 템플릿처럼 풀린다.

## 왜 (배경/문제 상황)

매번 문제를 처음부터 분석하면 시간이 오래 걸린다. 대신 입력 형태와 질문 형태를 몇 가지 패턴으로 나눠두면, 문제를 읽자마자 "아 이건 그거다"하고 템플릿을 꺼내 쓸 수 있다.

## 본문

### 1단계: 입력 형태로 자료구조 정하기

| 입력이 이렇게 주어지면 | 신호 키워드 | 쓸 자료구조 |
|---|---|---|
| `n`(노드 개수) + `edges`(간선 리스트) | "간선", "연결 정보", `[[1,2],[2,3]]` 형태 | 인접리스트로 변환 |
| `n x n` 관계 행렬 | "컴퓨터가 연결되어 있으면 1", "네트워크" | 인접행렬 그대로 or 인접리스트로 변환 |
| 2차원 격자(지도/미로) | "맵", "게임판", "이동", "벽" | 격자 자체를 그래프로 사용 |

**핵심**: 인접행렬로 주어져도 노드 수가 많으면(수백 이상) 인접리스트로 바꿔서 푸는 게 안전하다. 인접행렬은 간선 하나 확인은 O(1)이지만 전체 순회는 O(V²)라 노드가 많아지면 느려진다.

```cpp
// n x n 인접행렬 -> 인접리스트 변환 (자주 쓰는 전처리)
vector<vector<int>> matrixToList(vector<vector<int>>& matrix, int n) {
    vector<vector<int>> graph(n);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (matrix[i][j] == 1) {
                graph[i].push_back(j);
            }
        }
    }
    return graph;
}
```

### 2단계: 질문 형태로 알고리즘 정하기

| 질문이 이거면 | 쓸 알고리즘 | 이유 |
|---|---|---|
| "최단거리", "최소 이동 횟수", "최소 몇 번" | **BFS** | 가중치 없는 그래프에서 최단거리는 BFS만 보장 |
| "도달 가능한가", "갈 수 있는가" (여부만) | DFS or BFS 아무거나 | 방문 여부만 체크하면 되므로 속도 차이 없음 |
| "연결된 그룹/네트워크 개수" | 전체 노드 순회 + DFS/BFS | 방문 안 한 노드 만날 때마다 카운트 +1 |
| "모든 경로", "몇 가지 방법으로 갈 수 있나" | DFS (백트래킹) | 경로 자체를 다 나열해야 하므로 BFS로는 부적합 |

**판단 우선순위**: "최단거리"라는 단어가 보이면 무조건 BFS부터 떠올린다. 나머지는 DFS/BFS 아무거나 써도 되는 경우가 많다.

### 3단계: 마스터 템플릿

패턴만 파악되면 아래 뼈대에서 조건 부분만 문제에 맞게 바꾼다.

```cpp
// 범용 그래프 BFS 템플릿
vector<int> bfsTemplate(int start, int n, vector<vector<int>>& graph) {
    vector<bool> visited(n, false);
    vector<int> dist(n, -1); // -1 = 도달 못함

    queue<int> q;
    q.push(start);
    visited[start] = true;
    dist[start] = 0;

    while (!q.empty()) {
        int cur = q.front(); q.pop();
        for (int next : graph[cur]) {
            if (!visited[next]) {
                visited[next] = true;
                dist[next] = dist[cur] + 1;
                q.push(next);
            }
        }
    }
    return dist;
}
```

```cpp
// 범용 "연결 그룹 개수 세기" 템플릿
int countGroups(int n, vector<vector<int>>& graph) {
    vector<bool> visited(n, false);
    int groups = 0;

    for (int i = 0; i < n; i++) {
        if (visited[i]) continue;
        groups++;
        // 여기서부터 BFS/DFS로 같은 그룹 전부 방문 처리
        queue<int> q;
        q.push(i);
        visited[i] = true;
        while (!q.empty()) {
            int cur = q.front(); q.pop();
            for (int next : graph[cur]) {
                if (!visited[next]) {
                    visited[next] = true;
                    q.push(next);
                }
            }
        }
    }
    return groups;
}
```

## 예제

문제를 만나면 이 순서로 3초 안에 훑는다.

1. 입력에 `edges`가 리스트로 주어지나? → 인접리스트 빌드
2. 입력이 격자(2차원 배열)인가? → 격자를 그래프로 취급, `dx/dy` 방식으로 4방향 탐색
3. "최단"이라는 단어가 있나? → BFS
4. "개수", "그룹"이라는 단어가 있나? → 전체 순회 + `countGroups` 템플릿

## 주의사항

- 인접행렬을 매번 O(V²)로 순회하는 습관이 들면, 노드 수가 큰 문제에서 시간초과가 난다. 입력이 행렬이어도 일단 인접리스트로 바꾸는 걸 기본값으로 삼는다.
- "도달 가능한가"만 묻는데 굳이 BFS로 거리까지 계산하는 건 낭비는 아니지만, 코드가 길어지니 여부만 필요하면 `visited` 배열만으로 끝내도 된다.
- 격자 문제는 시작점 자체를 몇 칸으로 셀지(0부터 시작 vs 1부터 시작) 문제 조건을 꼭 확인한다. 여기서 답이 1씩 어긋나는 실수가 잦다.

## 참고자료

- [그래프/노드 기초 개념](../graph-basics/) — 인접리스트 만드는 법, DFS/BFS 기본 코드
