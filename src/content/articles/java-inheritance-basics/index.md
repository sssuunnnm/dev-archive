---
title: 자바 상속 기초 - extends와 생성자 호출(super)
description: extends로 상속받은 뒤 부모 생성자를 언제 super(...)로 명시해야 하는지, 생성자 체이닝 순서를 정리한다
date: 2026-09-22
updated:
category: development
technology: [java]
tags: [oop, inheritance, constructor]
type: study
status: evergreen
series:
projects:
related: [java-field-hiding-binding]
aliases:
draft: true
---

## 한 줄 요약

`extends`로 부모의 필드·메서드를 물려받고, 부모 생성자는 `super(...)`로 호출한다 — 부모에 자식이 접근 가능한 기본 생성자(매개변수 없는 생성자)가 있으면 생략해도 되지만, 없으면 반드시 명시해야 한다.

## 왜 (배경/문제 상황)

정보처리기사 실기를 준비하다가 상속 관련 코드 실행 결과를 묻는 문제에서 자주 막혔다. 특히 `super(...)` 호출을 언제 생략할 수 있는지, 생성자가 여러 단계로 연결되면 실행 순서가 어떻게 되는지가 헷갈려서 정리한다.

## 본문

### 상속이란

**상속**(Inheritance)은 부모 클래스의 필드와 메서드를 자식 클래스가 그대로 물려받는 것이다.

```java
class Rectangle {
    int width, height;

    int getArea() {
        return width * height;
    }
}

class Square extends Rectangle {
    // width, height, getArea()를 따로 선언하지 않아도 그대로 쓸 수 있다
}
```

`Square`는 `Rectangle`을 상속받았기 때문에, 직접 선언하지 않아도 `width`, `height`, `getArea()`를 그대로 사용할 수 있다.

### super로 부모 생성자 호출하기

`super`는 부모 클래스를 가리키는 키워드다. `super(...)`처럼 괄호와 쓰면 부모 생성자를 호출하고, `super.x`처럼 점(`.`)과 쓰면 부모의 필드·메서드에 접근한다. `super(...)`를 쓸 때는 **반드시 생성자의 첫 줄**에 있어야 한다.

```java
class Rectangle {
    int width, height;

    Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }
}

class Square extends Rectangle {
    Square(int s) {
        super(s, s);  // 부모의 Rectangle(int, int) 생성자를 호출
    }
}
```

여기서 헷갈리는 부분은 "부모 생성자 호출을 꼭 명시해야 하는가"인데, 부모 클래스에 **자식이 접근 가능한 기본 생성자(매개변수 없는 생성자)가 있는지**에 따라 갈린다. "있는지"뿐 아니라 "접근 가능한지"도 조건이다 — 부모의 기본 생성자가 `private`이면 자식 클래스(다른 클래스)에서는 애초에 호출할 수 없어서, 있어도 없는 것과 같은 상태가 된다.

| 부모 클래스 상태 | super 필요 여부 | 이유 |
|---|---|---|
| 생성자를 아예 안 만듦 (컴파일러가 기본 생성자 자동 생성) | 생략 가능 | 컴파일러가 `super()`를 자동으로 호출 |
| 접근 가능한 기본 생성자를 직접 만듦 | 생략 가능 | 위와 동일 |
| 매개변수 있는 생성자만 만듦, 또는 기본 생성자가 있어도 접근 불가(`private` 등) | 반드시 명시 | 자동 호출할 수 있는 기본 생성자가 없음 |

위 예제의 `Rectangle`은 매개변수 생성자(`Rectangle(int, int)`)만 있고 기본 생성자가 없으므로, `Square`에서 `super(s, s)`를 반드시 써야 한다. 안 쓰면 컴파일 에러가 난다.

### 생성자 체이닝

하나의 생성자가 같은 클래스의 다른 생성자(`this(...)`)나 부모 생성자(`super(...)`)를 연쇄적으로 호출하는 걸 **생성자 체이닝**이라고 한다.

```java
class Shape {
    String type;

    Shape(String type) {
        this.type = type;
    }
}

class Rectangle extends Shape {
    int width, height;

    Rectangle() {
        this(10, 20);        // ① 같은 클래스의 다른 생성자 호출
    }

    Rectangle(int width, int height) {
        super("사각형");       // ② 부모 클래스의 생성자 호출
        this.width = width;
        this.height = height;
    }
}
```

`new Rectangle()`을 호출하면 `Rectangle()` → `this(10, 20)` → `super("사각형")` 순서로 연결되다가, 부모 생성자부터 먼저 끝내고 거슬러 내려오며 각 필드를 채운다.

`this()`로 다른 생성자를 계속 부르기만 할 수는 없다 (그러면 무한 루프가 된다). 그래서 체인의 끝에는 항상 부모 생성자를 호출하는 `super(...)`가 있는 생성자가 있고, 결과적으로 **부모 생성자가 항상 가장 먼저 실행**된다.

## 예제

`new Rectangle()`이 실행되는 순서를 단계별로 보면 이렇다.

```text
new Rectangle()
  → this(10, 20)          # 같은 클래스의 다른 생성자로 이동
    → super("사각형")       # 부모 생성자 호출, type = "사각형" 저장
  → width = 10, height = 20  # 부모 생성자가 끝난 뒤 자식 필드 채움
```

## 주의사항

- `super(...)`는 생성자의 첫 줄에만 올 수 있다. 다른 코드 뒤에 쓰면 컴파일 에러가 난다.
- 부모 클래스에 매개변수 생성자만 있고 접근 가능한 기본 생성자가 없는 상태에서 명시적인 `super(...)` 호출을 생략하면, "부모의 기본 생성자가 없다"는 컴파일 에러가 난다 — 시험에서 자주 나오는 함정이다.
- `this(...)`와 `super(...)`는 둘 다 생성자의 "첫 줄"이어야 해서, 한 생성자 안에 동시에 쓸 수 없다.

## 참고자료

- [Oracle Java Tutorials — Using the Keyword super](https://docs.oracle.com/javase/tutorial/java/IandI/super.html)
