---
title: 2차원 벡터 초기화
command: vector<vector<int>>
description: 2차원 배열이 필요할 때 크기와 초기값을 한 번에 잡는 법
technology: [cpp]
tags: [vector, array]
---

## 크기 고정 + 초기값 지정

```cpp
// 3행 4열, 전부 0으로 초기화
vector<vector<int>> board(3, vector<int>(4, 0));

// 값 접근/수정
board[1][2] = 5;
```

## 입력받아서 채우기 (자주 쓰는 패턴)

```cpp
int n, m;
cin >> n >> m;
vector<vector<int>> board(n, vector<int>(m));
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        cin >> board[i][j];
    }
}
```

## 방문 체크 배열 (DFS/BFS에서 자주 씀)

```cpp
vector<vector<bool>> visited(n, vector<bool>(m, false));
```

## 주의사항

`vector<vector<int>> board(3, vector<int>(4))`처럼 안쪽 벡터 하나를 복사해서 채우는 방식이라, 안쪽 벡터가 포인터나 참조를 담고 있지 않은 이상 각 행이 독립적으로 복사된다. 즉 `board[0][0]`을 바꿔도 `board[1][0]`은 영향받지 않는다 (걱정 안 해도 됨).
