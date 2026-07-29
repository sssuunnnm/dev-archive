---
title: 문자열 숫자 변환
command: to_string / stoi / stol / stod
description: 문자열과 숫자 타입을 서로 변환하는 표준 함수 모음
technology: [cpp]
tags: [string, type-conversion]
---

## 숫자 → 문자열

```cpp
int n = 42;
string s = to_string(n);   // "42"

double d = 3.14;
string s2 = to_string(d);  // "3.140000" (소수점 자리수 주의)
```

## 문자열 → 숫자

```cpp
string s = "123";
int n = stoi(s);       // int
long l = stol(s);      // long
long long ll = stoll(s); // long long
double d = stod("3.14"); // double
```

## 주의사항

- `to_string(double)`은 소수점 이하 6자리까지 강제로 붙는다. 정밀도를 조절하려면 `stringstream` + `setprecision`을 쓴다.
- `stoi` 등은 변환 불가능한 문자열이 들어오면 예외(`invalid_argument`)를 던진다. 입력값이 항상 숫자라고 확신할 수 없으면 `try-catch`로 감싼다.
- 앞뒤 공백이 있어도 `stoi`는 앞쪽 공백은 무시하지만 뒤쪽에 숫자가 아닌 문자가 오면 거기까지만 변환한다 (`stoi("12ab")` → `12`).
