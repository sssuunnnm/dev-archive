---
title: Docker 기초 개념과 자주 쓰는 명령어
description: 컨테이너가 해결하는 문제와 이미지/컨테이너 개념, 실무에서 반복해서 쓰게 되는 docker 명령어를 정리한다
date: 2026-08-25
updated:
category: infra
technology: [docker]
tags: [container, cli]
type: tutorial
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

컨테이너는 애플리케이션과 실행 환경(라이브러리, 설정)을 통째로 패키징해서 "내 컴퓨터에서는 되는데" 문제를 없앤다.

## 왜 (배경/문제 상황)

로컬, 팀원 PC, 서버가 OS나 라이브러리 버전이 조금씩 달라서 "분명 로컬에서는 됐는데 서버에서 안 된다"는 문제가 반복된다. 가상 머신(VM)으로 환경을 통째로 맞추면 해결되긴 하지만 VM 하나마다 OS 전체를 띄워야 해서 무겁고 느리다. Docker는 프로세스 단위로 격리해서 VM보다 훨씬 가볍게 같은 문제를 해결한다. 단, "호스트 커널을 공유한다"는 건 Linux 호스트에서 Docker Engine을 직접 돌릴 때 얘기다 — macOS/Windows의 Docker Desktop은 내부적으로 경량 Linux VM을 하나 띄우고 그 안에서 컨테이너를 실행하므로, 이 경우 컨테이너는 호스트(macOS/Windows) 커널이 아니라 그 VM의 Linux 커널을 공유한다.

## 본문

### 이미지(Image)와 컨테이너(Container)

- **이미지**: 애플리케이션 실행에 필요한 파일과 설정을 읽기 전용으로 묶어둔 템플릿. 클래스에 비유할 수 있다.
- **컨테이너**: 이미지를 실제로 실행한 인스턴스. 같은 이미지로 컨테이너를 여러 개 띄울 수 있다.

이미지는 `Dockerfile`이라는 레시피로 정의한다.

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

`Dockerfile`의 명령은 위에서 아래 순서로 실행되면서 빌드 캐시가 적용되는데, 그중 `RUN`/`COPY`/`ADD`처럼 파일시스템을 바꾸는 명령만 새 레이어(layer)를 만든다 (`CMD`는 컨테이너 실행 시 기본 커맨드를 지정할 뿐 파일시스템을 바꾸지 않아서 레이어를 만들지 않는다). 그래서 자주 바뀌는 파일(`COPY . .`)은 뒤쪽에, 잘 안 바뀌는 의존성 설치(`package*.json` 복사 → `npm install`)는 앞쪽에 두면 코드만 바뀌었을 때 의존성 설치 레이어를 다시 안 돌려도 돼서 빌드가 빨라진다.

### 자주 쓰는 명령어

```bash
docker build -t myapp .              # Dockerfile로 이미지 빌드 (myapp이라는 이름 태그)
docker images                        # 로컬에 있는 이미지 목록
docker run -d -p 3000:3000 myapp     # 컨테이너 실행 (백그라운드 -d, 호스트 3000 → 컨테이너 3000 포트 매핑)
docker ps                            # 실행 중인 컨테이너 목록
docker logs -f <container>           # 컨테이너 로그를 실시간으로 확인
docker exec -it <container> sh       # 실행 중인 컨테이너 내부에 쉘로 접속
docker stop <container>              # 컨테이너 정지
docker rm <container>                # 정지된 컨테이너 삭제
docker rmi <image>                   # 이미지 삭제
```

`docker run`은 이미지가 로컬에 없으면 먼저 받아온 뒤, 그때마다 **새 컨테이너**를 만들어서 시작한다 (이미지가 이미 로컬에 있어도 마찬가지). 반면 `docker start`는 이미 만들어져서 정지된 컨테이너를 다시 시작하고, `docker stop`은 실행 중인 컨테이너를 정지만 시킨다 — 즉 `run`은 "새로 만들기", `start`/`stop`은 "기존 컨테이너를 껐다 켰다" 하는 것이다.

`-p 3000:3000`처럼 포트를 매핑하면 기본적으로 호스트의 모든 네트워크 인터페이스(`0.0.0.0`)에 바인딩된다. 로컬 테스트용으로 외부에 노출할 필요가 없다면 `-p 127.0.0.1:3000:3000`처럼 호스트 쪽 주소를 명시해서 로컬에서만 접근되게 하는 게 안전하다.

### 컨테이너는 기본적으로 임시(ephemeral)다

컨테이너를 삭제하면 그 안에 저장했던 파일도 같이 사라진다. 데이터베이스처럼 데이터를 유지해야 하는 경우 볼륨(volume)을 마운트해서 컨테이너 생명주기와 데이터를 분리한다.

```bash
docker run -d -v mydata:/var/lib/data myapp
```

`mydata`라는 볼륨이 호스트 쪽에 남아있기 때문에, 컨테이너를 지웠다가 다시 만들어도 `-v mydata:/var/lib/data`로 같은 볼륨을 연결하면 데이터가 그대로 남아있다.

### 여러 컨테이너를 함께 다루기 — docker compose

앱 하나에 DB, 캐시처럼 컨테이너가 여러 개 필요한 경우, 매번 `docker run`을 따로 치는 대신 `docker-compose.yml` 하나로 묶어서 관리한다.

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - dbdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  dbdata:
```

`depends_on`을 `- db`처럼 짧게 쓰면 컨테이너 시작 순서만 보장하고, DB가 실제로 연결을 받을 준비가 됐는지는 보장하지 않는다. 그래서 위처럼 `db`에 `healthcheck`를 걸고 `app`이 `condition: service_healthy`로 그 결과를 기다리게 해야, PostgreSQL이 뜨는 도중에 `app`이 먼저 연결을 시도해서 실패하는 상황을 줄일 수 있다 (그래도 앱 쪽에 연결 재시도 로직을 두는 게 더 안전하다).

`docker compose up -d`로 정의된 서비스를 한 번에 띄우고, `docker compose down`으로 한 번에 내린다.

## 예제

Node.js 앱을 컨테이너로 띄우는 전체 흐름은 대략 이렇다.

```bash
docker build -t myapp .              # 1. 이미지 빌드
docker run -d -p 3000:3000 myapp     # 2. 컨테이너 실행
docker ps                            # 3. 실행 확인
docker logs -f <container_id>        # 4. 로그로 정상 기동 확인
```

## 주의사항

- 배포용 이미지에 `latest` 태그만 쓰면 나중에 이미지가 갱신됐을 때 어떤 버전이 실제로 떠 있는지 추적하기 어렵다. 배포에는 구체적인 버전 태그나 다이제스트를 고정해서 쓰는 편이 안전하다.
- 컨테이너 안에서 기본적으로 root로 프로세스가 실행되는데, 컨테이너 탈출 취약점이 있을 경우 위험이 커진다. 가능하면 `Dockerfile`에 `USER` 지시어로 non-root 유저를 지정한다.
- `docker system prune`은 옵션 없이 실행하면 정지된 컨테이너, 사용하지 않는 네트워크, dangling 이미지(어떤 태그에도 안 걸린 이미지), 빌드 캐시만 정리하고 **볼륨은 지우지 않는다**. `-a`를 붙이면 사용 중이지 않은 이미지 전체가 대상이 되고, `--volumes`를 붙이면 사용하지 않는 익명 볼륨까지 포함된다 — 옵션마다 삭제 범위가 크게 달라지니 확인하지 않고 습관적으로 돌리지 않는다.

## 참고자료

- Docker 공식 문서(docs.docker.com)
