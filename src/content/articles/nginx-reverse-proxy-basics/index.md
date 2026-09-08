---
title: Nginx 리버스 프록시 기본 개념
description: Nginx가 요청을 뒤에 있는 서버로 어떻게 넘기는지, 기본 설정 문법과 로드밸런싱 방식을 정리한다
date: 2026-09-08
updated:
category: infra
technology: [nginx]
tags: [reverse-proxy, load-balancing]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

리버스 프록시는 클라이언트 대신 서버 쪽에 서서 요청을 받아 뒤에 있는 실제 서버로 넘겨주는 중개자이고, Nginx는 이 역할을 `proxy_pass` 한 줄로 설정할 수 있다.

## 왜 (배경/문제 상황)

애플리케이션 서버(Node.js, Spring 등)를 인터넷에 직접 노출하면 정적 파일 서빙, HTTPS 처리, 여러 서버로의 요청 분산 같은 걸 애플리케이션 코드가 전부 떠안아야 한다. 이런 역할을 애플리케이션 앞단의 별도 계층으로 분리하면 애플리케이션은 비즈니스 로직에만 집중할 수 있는데, 이 앞단 계층 역할을 하는 게 리버스 프록시고 Nginx가 가장 널리 쓰인다.

## 본문

### 포워드 프록시 vs 리버스 프록시

- **포워드 프록시**: 클라이언트 쪽에 서서, 클라이언트가 어디로 요청을 보내는지를 서버가 모르게 감춘다 (사내망에서 외부 접속을 대리하는 경우 등).
- **리버스 프록시**: 서버 쪽에 서서, 클라이언트가 실제로 어떤 서버가 요청을 처리하는지 모르게 감춘다. 클라이언트는 항상 리버스 프록시 주소로만 요청을 보낸다.

같은 "프록시"라는 이름이지만 누구를 대신하느냐가 반대다. 이 글에서 다루는 건 후자다.

### 기본 설정: proxy_pass

Nginx는 `server` 블록으로 하나의 가상 호스트를 정의하고, 그 안의 `location` 블록으로 경로별 처리 방식을 정한다.

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

`80`번 포트로 들어온 요청을 전부 로컬 `3000`번 포트에서 떠 있는 애플리케이션 서버로 넘긴다. 클라이언트 입장에서는 Nginx가 응답하는 것처럼 보이지만, 실제 처리는 뒤에 있는 서버가 한다.

### 헤더 전달: proxy_set_header

`proxy_pass`만 쓰면 뒤에 있는 서버는 요청이 Nginx에서 왔다고만 인식하고, 원래 클라이언트의 IP나 프로토콜 정보를 알 수 없다. 그래서 헤더를 명시적으로 전달해야 한다.

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

- `Host`: 클라이언트가 원래 요청한 도메인. 안 넘기면 애플리케이션이 가상 호스팅이나 리다이렉트 URL을 잘못 만들 수 있다.
- `X-Real-IP`, `X-Forwarded-For`: 클라이언트의 실제 IP. 로그 기록이나 접근 제어에서 필요하다.
- `X-Forwarded-Proto`: 클라이언트가 HTTP로 왔는지 HTTPS로 왔는지. Nginx에서 HTTPS를 종료(TLS termination)하고 뒤로는 HTTP로 넘기는 구성이 흔한데, 이 헤더가 없으면 애플리케이션이 항상 HTTP로 온 걸로 착각한다.

### 여러 서버로 분산: upstream과 로드밸런싱

서버가 여러 대면 `upstream` 블록에 묶어두고 `proxy_pass`가 그 이름을 가리키게 한다.

```nginx
upstream app_servers {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;

    location / {
        proxy_pass http://app_servers;
    }
}
```

기본 분산 방식은 **라운드로빈**(요청을 순서대로 돌아가며 배정)이다. 상황에 따라 다른 방식을 쓸 수 있다.

```nginx
upstream app_servers {
    least_conn;                  # 현재 연결이 가장 적은 서버로 우선 배정
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}
```

- `least_conn`: 서버마다 처리 시간 편차가 큰 경우, 단순히 순서대로 도는 라운드로빈보다 실제 부하를 더 고르게 분산한다.
- `ip_hash`: 같은 클라이언트 IP는 항상 같은 서버로 보낸다. 서버가 요청 간 상태를 세션에 들고 있는(sticky session) 구성에서 필요하다.

`server` 라인에 `weight`를 주면 서버별로 받는 비중도 조절할 수 있다 (`server 127.0.0.1:3000 weight=3;`처럼 스펙이 더 좋은 서버에 더 많은 요청을 보내는 식).

## 예제

정적 파일은 Nginx가 직접 서빙하고, API 요청만 애플리케이션 서버로 넘기는 구성은 실무에서 자주 쓰인다.

```nginx
server {
    listen 80;
    server_name example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/example.com;
        try_files $uri $uri/ /index.html;
    }
}
```

`/api/`로 시작하는 요청은 애플리케이션 서버로, 나머지는 `/var/www/example.com`에 있는 정적 파일로 처리한다. 정적 파일까지 애플리케이션 서버가 서빙하지 않아도 되니 애플리케이션 쪽 부하가 줄어든다.

## 주의사항

- `location` 블록이 여러 개 겹칠 수 있는 경로를 지정하면 어떤 블록이 실제로 매칭되는지 순서/우선순위 규칙(정확 일치 → 접두사 매칭 등)을 헷갈리기 쉽다. 경로가 겹치는 설정을 추가할 때는 실제로 어느 `location`이 처리하는지 `curl`로 직접 확인하는 습관을 들이는 게 안전하다.
- 업스트림 서버 하나가 죽어도 Nginx는 기본적으로 몇 차례 실패를 겪은 뒤에야 그 서버를 제외한다 (`max_fails`, `fail_timeout`으로 조절 가능). 죽은 서버로 요청이 계속 흘러가 응답 지연이 누적될 수 있다는 걸 감안해야 한다.
- 설정 파일을 고친 뒤 바로 재시작하지 않는다. `nginx -t`로 문법 오류부터 확인하고, 문제 없으면 `nginx -s reload`로 무중단 반영한다.

## 참고자료

- [Nginx 공식 문서 — Reverse Proxy](https://nginx.org/en/docs/beginners_guide.html#proxy)
- [Nginx 공식 문서 — HTTP Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
