---
title: pair / tuple 다루기
command: pair<int,int> / tuple<int,int,int>
description: 좌표, (값,인덱스) 묶음 등 두 개 이상 값을 묶어 다룰 때 쓰는 법
technology: [cpp]
tags: [pair, tuple]
---

## pair 기본

```cpp
pair<int, int> p = {1, 2};
cout << p.first << " " << p.second;

// 벡터에 담아서 좌표/값 쌍으로 관리
vector<pair<int,int>> coords;
coords.push_back({1, 2});
coords.emplace_back(3, 4); // push_back보다 복사 한 번 덜 함
```

## pair 자동 비교

```cpp
// pair는 first 기준, 같으면 second 기준으로 기본 비교 연산자 지원
sort(coords.begin(), coords.end()); // first 오름차순, 같으면 second 오름차순
```

## tuple (3개 이상 묶을 때)

```cpp
tuple<int, int, int> t = {1, 2, 3};
cout << get<0>(t) << " " << get<1>(t) << " " << get<2>(t);

// 구조분해로 더 편하게
auto [a, b, c] = t;
```

## 구조분해 (C++17)

```cpp
pair<int, int> p = {1, 2};
auto [x, y] = p; // x=1, y=2
```

## 주의사항

`get<0>(t)`처럼 인덱스로 접근하면 값이 뭘 의미하는지 코드만 봐선 알기 어렵다. 값이 3개를 넘어가거나 의미가 헷갈리면 `struct`로 이름 붙여 관리하는 게 나중에 디버깅할 때 편하다.
