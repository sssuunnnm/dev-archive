---
title: TypeScript 유틸리티 타입 정리
description: Partial/Pick/Omit/Record 등 자주 쓰는 TypeScript 유틸리티 타입의 동작과 쓰임새를 정리한다
date: 2026-09-12
updated:
category: development
technology: [typescript]
tags: [type-system]
type: reference
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

TypeScript 유틸리티 타입은 기존 타입을 변형해서 새 타입을 만드는 제네릭 도구이고, 대부분 매핑된 타입(mapped type)과 키 선택으로 동작한다.

## Partial\<T\> / Required\<T\>

`Partial<T>`는 `T`의 모든 속성을 선택적(optional)으로 바꾸고, `Required<T>`는 반대로 모든 속성을 필수로 바꾼다.

```typescript
interface User {
  id: string;
  name: string;
  email?: string;
}

type PartialUser = Partial<User>;
// { id?: string; name?: string; email?: string }

type RequiredUser = Required<User>;
// { id: string; name: string; email: string }
```

객체를 부분적으로만 업데이트하는 함수의 인자 타입(`function update(id: string, patch: Partial<User>)`)으로 자주 쓴다.

## Readonly\<T\>

`T`의 모든 속성을 읽기 전용으로 바꾼다. 한 번 만든 뒤 값이 바뀌면 안 되는 객체(설정값, 상수 데이터)에 쓴다.

```typescript
type ReadonlyUser = Readonly<User>;
// { readonly id: string; readonly name: string; readonly email?: string }

const u: ReadonlyUser = { id: '1', name: 'Kim' };
u.name = 'Lee'; // 컴파일 에러:읽기 전용 속성에는 할당할 수 없다
```

런타임에서 객체 변경을 실제로 막는 건 아니고(그건 `Object.freeze`의 역할), 컴파일 타임에 "이 코드에서는 바꾸면 안 된다"는 걸 타입 검사로 강제하는 것이다.

## Pick\<T, K\> / Omit\<T, K\>

`Pick<T, K>`는 `T`에서 키 `K`(문자열 리터럴 유니언)만 골라 새 타입을 만들고, `Omit<T, K>`는 반대로 `K`를 제외한 나머지로 새 타입을 만든다.

```typescript
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: string; name: string }

type UserWithoutEmail = Omit<User, 'email'>;
// { id: string; name: string }
```

API 응답 전체 타입에서 화면에 필요한 일부만 뽑거나(`Pick`), 민감한 필드만 제외한 타입을 만들 때(`Omit`) 쓴다.

## Record\<K, T\>

키 집합 `K`의 각 키가 전부 타입 `T`인 객체 타입을 만든다. 객체를 "타입이 정해진 맵"처럼 쓰고 싶을 때 유용하다.

```typescript
type Role = 'admin' | 'editor' | 'viewer';

const roleLabels: Record<Role, string> = {
  admin: '관리자',
  editor: '편집자',
  viewer: '조회자',
};
```

`Role`에 새 값을 추가하면 `roleLabels`에 해당 키를 안 채웠을 때 컴파일 에러가 나서, 라벨 매핑을 빠뜨리는 실수를 막아준다.

## Exclude\<T, U\> / Extract\<T, U\>

유니언 타입을 대상으로 동작한다. `Exclude<T, U>`는 `T`에서 `U`에 할당 가능한 멤버를 제거하고, `Extract<T, U>`는 반대로 `U`에 할당 가능한 멤버만 남긴다.

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';

type NotIdle = Exclude<Status, 'idle'>;
// 'loading' | 'success' | 'error'

type Finished = Extract<Status, 'success' | 'error'>;
// 'success' | 'error'
```

`Pick`/`Omit`이 객체의 속성(키) 단위로 걸러낸다면, `Exclude`/`Extract`는 유니언의 멤버(타입 자체) 단위로 걸러낸다는 차이가 있다.

## ReturnType\<T\> / Parameters\<T\>

함수 타입에서 반환 타입 또는 매개변수 타입을 추출한다. 함수 시그니처가 바뀔 때마다 관련 타입을 손으로 따라 고치지 않아도 되게 해준다.

```typescript
function createUser(name: string, age: number) {
  return { id: crypto.randomUUID(), name, age };
}

type CreateUserResult = ReturnType<typeof createUser>;
// { id: string; name: string; age: number }

type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number]
```

`createUser`의 반환 객체 구조가 바뀌어도 `CreateUserResult`가 자동으로 따라 바뀌어서, 함수와 타입이 따로 놀 일이 없다.

## 주의사항

- `Partial<T>`는 한 단계(얕게)만 선택적으로 만든다. 중첩 객체 속성까지 전부 선택적으로 만들고 싶으면 재귀적으로 매핑하는 커스텀 유틸리티 타입을 직접 만들어야 한다.
- `Pick`/`Omit`에 존재하지 않는 키를 넘기면, `Pick`은 즉시 컴파일 에러가 나지만 `Omit`은 타입 정의상 제약이 느슨해서 오타가 나도 에러 없이 조용히 무시되는 경우가 있다 (TypeScript 버전에 따라 동작이 다를 수 있어 실제 사용 중인 버전에서 확인하는 게 안전하다).
- 이 유틸리티 타입들은 전부 컴파일 타임에만 존재한다. 런타임에 `Partial`이나 `Pick` 같은 이름으로 참조할 수 있는 값은 없고, 트랜스파일 결과물에는 아무 흔적도 남지 않는다.

## 참고자료

- [TypeScript 공식 문서 — Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
