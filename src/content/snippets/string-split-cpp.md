---
title: 문자열 split
command: istringstream + getline
description: C++엔 split()이 없어서 sstream으로 직접 토큰화한다
technology: [cpp]
tags: [string, parsing]
---

## 공백 기준 토큰화

```cpp
#include <sstream>
#include <vector>
#include <string>
using namespace std;

vector<string> split(string s) {
    istringstream iss(s);
    vector<string> result;
    string token;
    while (iss >> token) {
        result.push_back(token);
    }
    return result;
}
```

## 특정 구분자 기준 토큰화 (예: 쉼표)

```cpp
vector<string> split(string s, char delim) {
    istringstream iss(s);
    vector<string> result;
    string token;
    while (getline(iss, token, delim)) {
        result.push_back(token);
    }
    return result;
}
```

## 주의사항

구분자가 연속되면 빈 문자열 토큰이 그대로 들어간다. `a,,b`를 쉼표로 나누면 `a`, 빈 문자열, `b` 세 개가 나온다. 빈 토큰을 걸러야 하면 반환 직전에 `result.erase(remove(result.begin(), result.end(), ""), result.end())`로 제거한다.
