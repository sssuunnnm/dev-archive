---
title: Docker 심화 용어 정리
description: Registry/Repository/Tag, ENTRYPOINT vs CMD, bind mount vs volume 등 기초 글에서 다루지 않은 Docker 용어를 정리한다
date: 2026-09-07
updated:
category: infra
technology: [docker]
tags: [terminology, container-runtime]
type: reference
status: evergreen
series:
projects:
related: [docker-basics]
aliases:
draft: true
---

## 한 줄 요약

Docker를 쓰다 보면 자주 마주치지만 "이미지/컨테이너" 같은 기초 개념만으로는 설명이 안 되는 용어들 — Registry/Repository/Tag 구조, ENTRYPOINT/CMD 조합, 마운트 방식, 멀티스테이지 빌드 등을 모아 정리한다.

## Registry / Repository / Tag

세 단어가 계층 구조로 이어진다.

- **Registry**: 이미지를 저장하고 배포하는 서버. Docker Hub가 기본 Registry이고, AWS ECR/GitHub Container Registry처럼 직접 운영하는 Registry도 있다.
- **Repository**: Registry 안에서 같은 이미지의 여러 버전을 모아둔 이름 단위. `nginx`, `myapp` 같은 이름이 Repository다.
- **Tag**: Repository 안에서 특정 버전을 가리키는 라벨. `nginx:1.27`, `myapp:latest`처럼 콜론 뒤에 붙는다.

```bash
docker pull ghcr.io/myorg/myapp:1.2.0
# ghcr.io        → Registry (GitHub Container Registry)
# myorg/myapp    → Repository
# 1.2.0          → Tag
```

Registry 주소를 생략하면 Docker Hub를 기본값으로 사용하고, Tag를 생략하면 `latest`를 기본값으로 사용한다.

## ENTRYPOINT vs CMD

둘 다 컨테이너가 시작될 때 실행할 명령을 정의하지만 역할이 다르다.

| | 역할 | `docker run` 인자로 덮어쓰기 |
|---|---|---|
| `ENTRYPOINT` | 컨테이너의 "고정된 실행 파일" | 기본적으로 안 됨 (`--entrypoint` 옵션 필요) |
| `CMD` | `ENTRYPOINT`에 넘길 기본 인자, 또는 `ENTRYPOINT`가 없을 때의 기본 명령 | `docker run <image> <새 인자>`로 쉽게 덮어씀 |

```dockerfile
ENTRYPOINT ["node"]
CMD ["server.js"]
```

이렇게 정의하면 `docker run myapp`은 `node server.js`를 실행하고, `docker run myapp worker.js`는 `CMD`만 `worker.js`로 바뀌어 `node worker.js`를 실행한다. `ENTRYPOINT` 없이 `CMD`만 쓰면 실행 파일 자체를 매번 다시 지정해야 해서, "이 이미지는 항상 이 실행 파일로 뜬다"를 고정하고 싶을 때 `ENTRYPOINT` + `CMD` 조합을 쓴다.

## EXPOSE vs -p

`EXPOSE`는 `Dockerfile`에 적는 지시어이고, `-p`는 `docker run`에 주는 옵션이라 레이어가 다르다.

- **`EXPOSE`**: 이 컨테이너가 어떤 포트를 쓰는지 문서화하는 용도. 실제로 포트를 열어주지 않는다 — `docker run`만으로는 호스트에서 접근할 수 없다.
- **`-p 호스트포트:컨테이너포트`**: 실제로 호스트와 컨테이너 포트를 연결(포트 포워딩)한다. 이게 있어야 호스트에서 접근 가능하다.

```dockerfile
EXPOSE 3000
```

```bash
docker run -p 3000:3000 myapp   # 이 -p가 있어야 호스트 3000번으로 접근 가능
```

`EXPOSE`를 안 적어도 `-p`만 있으면 포트 매핑은 정상 동작한다. 다만 `EXPOSE`를 적어두면 `docker run -P`(대문자, 랜덤 호스트 포트 매핑)를 쓸 때 어떤 포트를 매핑할지 Docker가 참고하고, 이미지를 처음 보는 사람이 어떤 포트를 열어야 하는지 바로 알 수 있다는 문서화 이점이 있다.

## Bind Mount vs Volume

둘 다 컨테이너 밖에 데이터를 두는 방법이지만 관리 주체가 다르다.

| | 저장 위치 | 관리 주체 | 용도 |
|---|---|---|---|
| **Bind Mount** | 호스트의 특정 경로를 그대로 지정 | 사용자가 직접 경로 관리 | 로컬 개발 중 소스 코드 실시간 반영 |
| **Volume** | Docker가 관리하는 전용 저장 영역 (`/var/lib/docker/volumes/...`) | Docker가 관리 | DB 데이터 등 컨테이너 생명주기와 분리해서 영구 보관 |

```bash
docker run -v $(pwd)/src:/app/src myapp        # bind mount: 호스트 경로를 직접 지정
docker run -v mydata:/var/lib/data myapp       # volume: Docker가 mydata라는 이름으로 관리
```

Bind mount는 호스트 파일시스템 경로에 그대로 의존하기 때문에 환경(로컬 PC마다 경로가 다름)에 따라 깨지기 쉽고, Volume은 `docker volume ls`, `docker volume rm` 같은 명령으로 Docker가 위치를 추상화해서 관리해준다. 그래서 로컬 개발 중 코드 변경을 즉시 반영하고 싶을 땐 bind mount를, 운영 환경에서 데이터를 안전하게 유지하고 싶을 땐 volume을 쓴다.

## Multi-stage Build

`Dockerfile` 안에 `FROM`을 여러 번 써서 빌드 단계와 실행 단계를 분리하는 방법이다. 빌드에만 필요한 도구(컴파일러, devDependencies)를 최종 이미지에서 빼서 이미지 용량을 줄이는 게 목적이다.

```dockerfile
# 1단계: 빌드 전용 이미지 (devDependencies 포함, 용량 큼)
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 실행 전용 이미지 (빌드 결과물만 복사, 용량 작음)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --production
CMD ["node", "dist/main.js"]
```

`COPY --from=builder`로 이전 단계의 결과물만 골라 가져오고, 최종 이미지에는 `builder` 단계에서 쓴 컴파일러나 devDependencies가 전혀 남지 않는다. 결과적으로 최종 이미지 용량이 크게 줄어든다.

## dockerd

`dockerd`는 Docker Engine의 데몬(백그라운드 프로세스) 이름이다. 이미지 빌드, 컨테이너 실행, 네트워크/볼륨 관리를 실제로 수행하는 주체이고, 우리가 평소에 치는 `docker` 명령어(CLI)는 이 `dockerd`에게 요청을 보내는 클라이언트일 뿐이다.

```text
docker CLI  --(API 요청)-->  dockerd(데몬)  --> 이미지 빌드/컨테이너 실행/네트워크·볼륨 관리
```

`docker ps`가 잘 안 될 때 `dockerd`가 실행 중인지부터 확인하는 이유가 여기 있다 — CLI는 명령을 그대로 실행하는 게 아니라 데몬에게 위임만 하기 때문에, 데몬이 죽어있으면 어떤 `docker` 명령도 응답하지 않는다.

## .dockerignore

`.gitignore`와 같은 문법으로, 이미지 빌드 시 빌드 컨텍스트(`docker build .`의 `.`)에 포함시키지 않을 파일/폴더를 지정한다.

```text
node_modules
.git
.env
*.log
```

`.dockerignore`가 없으면 `COPY . .` 같은 명령이 `node_modules`, `.git` 같은 불필요하거나 민감한 파일까지 그대로 이미지 안에 복사해버릴 수 있다. 빌드 컨텍스트 자체도 커져서 `docker build` 시작 시 이 컨텍스트를 데몬에 전송하는 시간이 늘어난다. 이미지 용량 최적화와 민감 정보(`.env` 등) 유출 방지 두 가지 이유로 항상 챙겨두는 게 안전하다.

## 참고자료

- Docker 공식 문서(docs.docker.com)
- [Docker 기초 개념과 자주 쓰는 명령어](../docker-basics/)
