---
title: map / unordered_map 기본 사용법
command: unordered_map<string,int>
description: 빈도수 세기, key 존재 확인 등 해시 문제에서 매번 쓰는 패턴
technology: [cpp]
tags: [hash, map]
---

## 빈도수 세기 (해시 문제 기본 패턴)

```cpp
unordered_map<string, int> cnt;
for (string& s : words) {
    cnt[s]++;
}
```

## key 존재 확인

```cpp
// 잘못된 방법: cnt[key]로 확인하면 없던 key가 0으로 새로 생성됨
if (cnt.find("apple") != cnt.end()) {
    // 존재함
}

// count()로도 확인 가능 (0 또는 1 반환)
if (cnt.count("apple")) {
    // 존재함
}
```

## 순회

```cpp
for (auto& [key, value] : cnt) {
    cout << key << " " << value << "\n";
}
```

## map vs unordered_map

| | map | unordered_map |
|---|---|---|
| 내부구조 | 트리(정렬됨) | 해시테이블 |
| 순회 순서 | key 오름차순 | 순서 보장 안 됨 |
| 시간복잡도 | O(log n) | 평균 O(1), 최악 O(n) |

정렬이 필요 없고 속도가 중요하면 `unordered_map`, key 순서대로 순회해야 하면 `map`을 쓴다.

## 주의사항

`unordered_map`에 `string`을 key로 많이 쓰는 경우, 최악의 경우(해시 충돌)엔 `map`보다 느릴 수 있다. 웬만한 코테 범위에서는 체감되지 않으니 기본은 `unordered_map`으로 시작해도 된다.
