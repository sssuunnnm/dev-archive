---
title: 필드 하이딩과 정적/동적 바인딩
description: Parent ref = new Child() 패턴에서 필드와 메서드 접근 결과가 왜 다르게 나오는지, 정적/동적 바인딩 차이로 정리한다
date: 2026-09-22
updated:
category: development
technology: [java]
tags: [oop, binding]
type: study
status: evergreen
series:
projects:
related: [java-inheritance-basics]
aliases:
draft: false
---

## 한 줄 요약

인스턴스 메서드는 실제 객체 타입 기준으로 호출되지만(동적 바인딩), 필드와 `static` 메서드는 선언 타입 기준으로 결정된다(정적 바인딩) — 이 차이 때문에 `Parent ref = new Child()`에서 `ref.x`와 `ref.method()`의 결과가 다르게 나온다.

## 왜 (배경/문제 상황)

[자바 상속 기초](/development/java-inheritance-basics/)를 정리하다가, 부모-자식 클래스에 같은 이름의 필드가 있을 때 어떤 값이 나오는지 헷갈렸다. 메서드 오버라이딩과 비슷한 규칙일 거라 짐작했는데, 실제로는 필드와 메서드가 서로 다른 기준으로 결정된다는 걸 알고 정리한다.

## 본문

### 필드 하이딩이란

부모 클래스와 자식 클래스에 **같은 이름의 필드**가 있으면, 자식의 필드가 부모의 필드를 가린다. 이걸 **필드 하이딩**(Field Hiding)이라고 한다.

```java
class Parent {
    String x = "Parent";
}

class Child extends Parent {
    String x = "Child";  // 부모의 x를 가림
}
```

부모의 필드가 사라지는 게 아니라, 객체 하나 안에 같은 이름의 필드 두 개가 각자 존재하고, 자식의 필드가 부모의 필드를 가려서 안 보이게 만드는 것이다.

### 선언 타입 vs 실제 타입

```java
Parent ref = new Child();
//     ↑ 선언 타입: Parent     ↑ 실제 객체: Child

System.out.println(ref.x);   // "Parent"
```

`Parent ref = new Child();`에서 등호 왼쪽 `Parent`가 **선언 타입**이고, 등호 오른쪽 `new Child()`가 **실제 객체의 타입**이다. 필드에 접근할 때는 실제 객체가 무엇이든 상관없이 **선언 타입(등호 왼쪽) 기준**으로 결정된다. 그래서 `ref`가 실제로는 `Child` 객체를 가리켜도, `ref.x`는 `Parent`의 `x`인 `"Parent"`를 출력한다.

### 필드/static 메서드는 정적 바인딩, 인스턴스 메서드는 동적 바인딩

`ref.x`가 필드 접근인지 `ref.method()`가 메서드 호출인지는 괄호 유무로 이미 문법적으로 구분된다 — 컴파일러가 `ref`의 선언 타입(`Parent`) 안에서 그 이름의 필드/메서드를 찾아 확정한다. 갈리는 지점은 그다음이다: 필드는 여기서 확정된 내용을 실행 시점까지 그대로 쓰지만, 인스턴스 메서드는 실행될 때 실제 객체(`Child`)의 오버라이딩 여부를 한 번 더 확인한다.

[메서드 오버라이딩](https://docs.oracle.com/javase/tutorial/java/IandI/override.html)(자식이 부모의 메서드를 재정의하는 것)에서는 반대로 **실제 객체 타입** 기준으로 호출된다. 필드와 `static` 메서드만 선언 타입 기준이다.

| 구분 | 호출 기준 | 예시 |
|---|---|---|
| 인스턴스 메서드 (오버라이딩) | 실제 객체 타입 (등호 오른쪽) | `ref.method()` → `Child`의 `method()` |
| 필드 (하이딩) | 선언 타입 (등호 왼쪽) | `ref.x` → `Parent`의 `x` |
| `static` 메서드 | 선언 타입 (등호 왼쪽) | `ref.id()` → `Parent`의 `id()` |

같은 `ref`(`Parent ref = new Child();`)를 두고 필드에 접근할 때와 메서드를 호출할 때 어느 쪽 타입을 보는지 직접 토글해보면 차이가 더 분명해진다.

<div class="bindingdemo">
<style>
.bindingdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --dim: #f4f4f5;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .bindingdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; --dim: #27272a; }
.bindingdemo .toggle { display: flex; gap: 8px; margin-bottom: 16px; }
.bindingdemo .togbtn {
  flex: 1; background: var(--card2); color: var(--ink); border: 1px solid var(--line); border-radius: 8px;
  padding: 9px 12px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer;
}
.bindingdemo .togbtn[aria-pressed="true"] { background: var(--accent); color: var(--card); border-color: var(--accent); }
.bindingdemo .refline { text-align: center; font-family: monospace; font-size: 13px; color: var(--sub); margin-bottom: 14px; }
.bindingdemo .candidates { display: flex; gap: 10px; margin-bottom: 14px; }
.bindingdemo .cand { flex: 1; border-radius: 8px; padding: 10px; text-align: center; border: 2px solid var(--line); background: var(--card2); transition: all 0.15s; }
.bindingdemo .cand.picked { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--card)); }
.bindingdemo .cand.ignored { opacity: 0.4; }
.bindingdemo .cand .label { font-size: 11.5px; color: var(--sub); margin-bottom: 4px; }
.bindingdemo .cand .type { font-weight: 700; font-size: 14px; }
.bindingdemo .verdict { font-size: 11px; margin-top: 6px; color: var(--accent); font-weight: 700; }
.bindingdemo .result { border-radius: 8px; padding: 10px 12px; background: var(--card2); font-size: 13px; }
.bindingdemo .result b { color: var(--accent); }
</style>

<div class="toggle">
  <button class="togbtn" id="bd_field" aria-pressed="true">필드 접근 (ref.x)</button>
  <button class="togbtn" id="bd_method" aria-pressed="false">메서드 호출 (ref.method())</button>
</div>
<div class="refline">Parent ref = new Child();</div>
<div id="bd_diagram" aria-live="polite"></div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('bindingdemo')) return;
  const fieldBtn = root.querySelector('#bd_field');
  const methodBtn = root.querySelector('#bd_method');
  const diagramEl = root.querySelector('#bd_diagram');

  function render(which) {
    const fieldPicked = which === 'field';
    diagramEl.innerHTML = `
      <div class="candidates">
        <div class="cand ${fieldPicked ? 'picked' : 'ignored'}">
          <div class="label">선언 타입 (등호 왼쪽)</div>
          <div class="type">Parent</div>
          ${fieldPicked ? '<div class="verdict">여기서 결정 (정적 바인딩)</div>' : ''}
        </div>
        <div class="cand ${fieldPicked ? 'ignored' : 'picked'}">
          <div class="label">실제 객체 (등호 오른쪽)</div>
          <div class="type">Child</div>
          ${fieldPicked ? '' : '<div class="verdict">여기서 결정 (동적 바인딩)</div>'}
        </div>
      </div>
      <div class="result">
        ${fieldPicked
          ? '<code>ref.x</code> → <b>"Parent"</b> — 필드는 선언 타입만 보고 컴파일 시점에 정해진다.'
          : '<code>ref.method()</code> → <b>Child의 method() 실행</b> — 인스턴스 메서드는 실행 시점에 실제 객체를 확인한다 (오버라이딩 적용).'}
      </div>
    `;
  }
  function select(which) {
    fieldBtn.setAttribute('aria-pressed', String(which === 'field'));
    methodBtn.setAttribute('aria-pressed', String(which === 'method'));
    render(which);
  }
  fieldBtn.addEventListener('click', () => select('field'));
  methodBtn.addEventListener('click', () => select('method'));
  select('field');
})();
</script>

이렇게 갈리는 이유는 **필드와 `static` 메서드는 애초에 오버라이딩 대상이 아니기 때문**이다. 인스턴스 필드도 인스턴스 메서드처럼 객체마다 따로 저장되지만(그래서 하이딩된 부모의 필드도 메모리 어딘가에 그대로 남아있다), Java는 필드 접근에는 가상 메서드 테이블 같은 동적 디스패치를 적용하지 않고 컴파일 시점에 선언 타입만 보고 어떤 필드를 가리킬지 정해버린다. `static` 메서드는 애초에 객체 없이도 호출 가능한 클래스 자체의 멤버라 같은 이유로 정적으로 결정된다.

- **인스턴스 메서드**: 오버라이딩 지원 → 실행할 때 실제 객체를 확인해서 호출(동적 바인딩)
- **필드**: 객체마다 저장되지만 오버라이딩 대상이 아님 → 컴파일 시점에 선언 타입만 보고 결정(정적 바인딩, 하이딩만 가능)
- **`static` 메서드**: 클래스 자체의 멤버라 객체 기준으로 결정할 이유가 없음 → 정적 바인딩

"바인딩"은 호출 코드와 실제 실행될 코드를 연결하는 것이고, 이걸 **언제** 연결하느냐가 정적/동적을 가른다.

| 구분 | 오버라이딩 지원 | 바인딩 시점 | 기준 |
|---|---|---|---|
| 인스턴스 메서드 | O | 실행 시점 (동적) | 실제 객체 |
| 필드 | X (하이딩만 가능) | 컴파일 시점 (정적) | 선언 타입 |
| `static` 메서드 | X (하이딩만 가능) | 컴파일 시점 (정적) | 선언 타입 |

필드와 `static` 메서드는 오버라이딩 대상이 아니라서 컴파일 시점에 선언 타입만 보고 결정할 수 있지만, 오버라이딩을 지원하는 인스턴스 메서드는 실제로 실행해봐야 어떤 객체인지 알 수 있다는 차이다.

## 예제

가려진 부모의 필드는 `super.x`로 접근할 수 있다.

```java
class Parent {
    String x = "Parent";
}

class Child extends Parent {
    String x = "Child";

    void printBoth() {
        System.out.println(this.x);    // "Child"
        System.out.println(super.x);   // "Parent"
    }
}
```

`this.x`는 현재 객체(선언 타입 `Child`)의 `x`이므로 `"Child"`, `super.x`는 명시적으로 부모의 필드를 가리키므로 `"Parent"`가 출력된다.

## 주의사항

- 이 글은 필드가 선언 타입 기준으로 결정된다는 규칙 자체를 정리한 것이고, 실무에서 부모-자식에 같은 이름의 필드를 두는 것 자체가 권장되는 패턴은 아니다. 어떤 필드가 쓰이는지 코드만 보고 헷갈리기 쉬워서, 실제 코드에서는 이름을 다르게 짓거나 캡슐화(private + getter)로 우회하는 편이 낫다.
- `Parent ref = new Child()`처럼 부모 타입 변수에 자식 객체를 담는 상황 자체(업캐스팅)는 다형성을 활용할 때 흔하다. 문제가 되는 건 그 상태에서 필드와 `static` 메서드에 직접 접근할 때뿐이라, 인스턴스 메서드 위주로 설계하면 이 함정을 피할 수 있다.

## 참고자료

- [Oracle Java Tutorials — Hiding Fields](https://docs.oracle.com/javase/tutorial/java/IandI/hidevariables.html)
