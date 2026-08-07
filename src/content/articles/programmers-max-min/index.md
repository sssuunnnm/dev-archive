---
title: 최댓값과 최솟값
description: 공백 구분 문자열을 split+stoi로 숫자화한 뒤 최댓값/최솟값을 찾아 문자열로 합치는 문제를 정리한다
date: 2026-08-07
updated:
category: cs
technology: [cpp]
tags: [string, level-1]
type: troubleshooting
status: archive
series:
projects:
related:
aliases:
draft: false
---

## 한 줄 요약

문자열을 split→stoi로 숫자 배열로 만든 뒤, min/max로 찾아서 to_string으로 다시 합친다.

## 왜 (배경/문제 상황)

[최댓값과 최솟값](https://school.programmers.co.kr/learn/courses/30/lessons/12939) — 공백으로 구분된 숫자 문자열(`"1 2 3 4"`)에서 최댓값과 최솟값을 찾아 `"최솟값 최댓값"` 형태로 반환하는 문제.

## 원인 분석 → 해결 방법

**시도 1: 함수 호출 방식 오류**

```cpp
answer.split(s, ' '); // split을 answer(vector)의 멤버함수처럼 호출
```

`split`은 `vector`의 멤버함수가 아니라 직접 정의한 자유 함수라서, `객체.함수()` 형태가 아니라 `split(s, ' ')`처럼 그냥 이름으로 호출해야 한다.

**시도 2: 타입 불일치**

```cpp
vector<int> answer;
answer = split(s, ' '); // split은 vector<string>을 리턴하는데 vector<int>에 대입
```

`split`이 리턴하는 건 아직 텍스트 상태인 `vector<string>`이라, 숫자로 쓰려면 `stoi`로 변환하는 단계가 빠졌었다.

**시도 3: 리턴 타입 불일치**

```cpp
string solution(string s) {
    ...
    return answer; // answer가 vector<int>인데 solution은 string을 리턴해야 함
}
```

**최종 코드**

```cpp
string solution(string s) {
    vector<string> tmp = split(s, ' ');

    int min_n = 1e9;
    int max_n = -1e9;

    for (int i = 0; i < tmp.size(); i++) {
        min_n = min(min_n, stoi(tmp[i]));
        max_n = max(max_n, stoi(tmp[i]));
    }

    return to_string(min_n) + " " + to_string(max_n);
}
```

## 예제

4단계로 정리하면: (1) split으로 토큰화 → (2) stoi로 숫자 변환 → (3) min/max 갱신 → (4) to_string으로 합치기. `min_element`/`max_element`로도 동일하게 풀 수 있는데, 그 경우 iterator를 반환하므로 `*min_element(...)`처럼 역참조가 필요하다.

## 주의사항

- `min_n`/`max_n` 초기값을 문제 제약조건보다 여유 있게 잡아야 한다 (`1e9`, `-1e9`).
- `to_string(min_n) + ' ' + to_string(max_n)`처럼 `char`(`' '`)를 문자열 사이에 껴도 `string::operator+(char)`가 지원돼서 동작은 하지만, 의도를 더 명확히 하려면 `" "`(문자열 리터럴)을 쓰는 게 관례적이다.

## 참고자료

- [문자열 split](../../snippets/string-split-cpp/) — 토큰화 스니펫
- [문자열 숫자 변환](../../snippets/string-number-conversion/) — stoi/to_string 스니펫