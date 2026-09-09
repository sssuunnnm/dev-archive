---
title: Kubernetes 핵심 오브젝트 정리 (Pod, Deployment, Service)
description: Pod/Deployment/Service가 각각 무엇을 담당하는지, 컨테이너 오케스트레이션에서 어떻게 조합되는지 정리한다
date: 2026-09-09
updated:
category: infra
technology: [kubernetes]
tags: [container-orchestration]
type: study
status: evergreen
series:
projects:
related: [virtualization-vs-containers]
aliases:
draft: true
---

## 한 줄 요약

Pod는 컨테이너를 실제로 띄우는 최소 단위, Deployment는 그 Pod가 몇 개 떠 있어야 하는지 선언하고 유지시켜주는 관리자, Service는 계속 바뀌는 Pod의 IP 대신 접근할 고정된 창구다 — 셋이 각자 다른 층의 문제를 맡는다.

## 왜 (배경/문제 상황)

컨테이너 하나만 띄운다면 `docker run` 한 줄로 충분하다. 하지만 트래픽이 늘어 컨테이너를 여러 개 띄우고, 그중 하나가 죽으면 자동으로 다시 띄우고, 새 버전을 배포할 때 트래픽이 끊기지 않게 하려면 사람이 이 모든 걸 수동으로 관리하기 어렵다. Kubernetes는 "이런 상태여야 한다(desired state)"를 오브젝트로 선언하면, 실제 상태를 거기에 맞게 계속 조정해주는 오케스트레이션 도구다. 그 선언의 단위가 되는 핵심 오브젝트 세 가지를 정리한다.

## 본문

### Pod — 배포의 최소 단위

Pod는 Kubernetes에서 컨테이너를 배포하는 가장 작은 단위다. 컨테이너 하나만 담을 수도 있고, 네트워크(같은 IP, 같은 포트 공간)와 스토리지를 공유해야 하는 컨테이너 여러 개를 한 Pod에 묶을 수도 있다.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  containers:
    - name: web-app
      image: myapp:1.0
      ports:
        - containerPort: 3000
```

Pod를 직접 만들면 이 Pod는 죽어도 아무도 다시 살려주지 않는다. 실무에서 Pod를 직접 다루는 경우는 드물고, 대부분 Deployment 같은 상위 오브젝트를 통해 간접적으로 만든다.

### Deployment — Pod를 몇 개 유지할지 선언

Deployment는 "이 이미지로 만든 Pod가 항상 N개 떠 있어야 한다"는 상태를 선언한다. 실제로는 Deployment가 ReplicaSet을 만들고, ReplicaSet이 Pod 개수를 맞추는 2단계 구조지만, 평소에는 Deployment만 직접 다루면 된다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: web-app
          image: myapp:1.0
          ports:
            - containerPort: 3000
```

`replicas: 3`을 선언하면 Kubernetes는 라벨(`app: web-app`)이 일치하는 Pod가 항상 3개가 되도록 유지한다. Pod 하나가 죽으면 자동으로 새 Pod를 만들어 개수를 다시 맞춘다.

배포 시에는 `image` 값만 바꿔서 같은 Deployment를 다시 적용하면, 새 Pod를 순차적으로 띄우고 기존 Pod를 순차적으로 종료하는 롤링 업데이트가 기본 동작이다. 한 번에 몇 개씩 교체할지는 `strategy.rollingUpdate`로 조절할 수 있다.

### Service — 계속 바뀌는 Pod에 고정된 창구를 붙이기

Pod는 재시작될 때마다 IP가 바뀐다. Deployment가 Pod 개수를 유지해줘도, "지금 살아있는 Pod들에게 어떻게 접근할지"는 별도 문제다. Service는 라벨 셀렉터로 대상 Pod들을 묶고, 그 앞에 고정된 IP와 이름을 제공한다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
  ports:
    - port: 80
      targetPort: 3000
```

이 Service는 `app: web-app` 라벨을 가진 모든 Pod를 대상으로 삼고, 클러스터 내부에서 `web-app` 이라는 이름으로 80번 포트에 접근하면 실제로는 살아있는 Pod 중 하나의 3000번 포트로 요청을 전달한다. 어떤 Pod가 죽고 새로 생겨도 Service 이름과 포트는 그대로이므로, 클라이언트(다른 Pod나 애플리케이션)는 Pod의 실제 IP를 몰라도 된다.

Service는 `type`에 따라 노출 범위가 다르다.

- **ClusterIP** (기본값): 클러스터 내부에서만 접근 가능.
- **NodePort**: 각 Node의 특정 포트로도 접근 가능하게 열어서, 클러스터 외부에서도 `노드IP:포트`로 접근할 수 있게 한다.
- **LoadBalancer**: 클라우드 제공자의 로드밸런서를 붙여 외부 트래픽을 받는다. 대부분의 클라우드 환경에서 외부 노출용으로 쓰는 방식이다.

### 세 오브젝트가 맞물리는 방식

- Deployment가 라벨을 붙여 Pod를 만들고 개수를 유지한다.
- Service가 같은 라벨을 셀렉터로 걸어서, 그 Pod들 앞에 고정된 접근 지점을 만든다.
- 요청은 Service 이름/IP로 들어와서 그 뒤에 있는 여러 Pod 중 하나로 분산된다.

라벨과 셀렉터로만 연결되기 때문에, Deployment와 Service는 서로 이름이나 참조를 직접 주고받지 않는다. 라벨이 일치하기만 하면 어떤 조합이든 자동으로 연결된다.

## 예제

`kubectl apply -f`로 Deployment와 Service를 같이 적용하면, 3개의 Pod가 뜨고 그 앞에 고정된 접근 지점이 생기는 흐름을 한 번에 볼 수 있다.

```bash
kubectl apply -f deployment.yaml     # Deployment 생성 -> Pod 3개 생성
kubectl apply -f service.yaml        # Service 생성 -> Pod들에 고정 접근 지점 부여
kubectl get pods                     # Pod 3개가 떠 있는지 확인
kubectl get service web-app          # Service에 할당된 ClusterIP 확인
kubectl delete pod <pod-name>        # Pod 하나를 강제로 삭제
kubectl get pods                     # 삭제된 Pod 대신 새 Pod가 자동으로 생겼는지 확인
```

마지막 두 줄이 Deployment의 핵심 동작이다. Pod를 강제로 지워도 Deployment가 즉시 새 Pod를 만들어 `replicas` 개수를 다시 맞춘다.

## 주의사항

- `selector`의 라벨이 Deployment의 `template.metadata.labels`와 정확히 일치해야 Service가 Pod를 찾는다. 라벨 오타는 배포는 성공하지만 트래픽이 아무 Pod에도 도달하지 않는, 원인 파악이 까다로운 문제로 이어진다.
- 롤링 업데이트 중에는 새 버전과 이전 버전 Pod가 동시에 떠서 같은 Service로 트래픽을 나눠 받는다. 새 이미지가 이전 버전과 호환되지 않는 응답을 내려주면, 배포 도중 일시적으로 클라이언트가 뒤섞인 버전의 응답을 받을 수 있다.
- Pod/Deployment/Service만으로는 설정 값(ConfigMap), 민감 정보(Secret), 영구 저장소(PersistentVolume) 같은 부분을 다루지 못한다. 이 글은 오브젝트 간의 기본 관계에 집중했고, 나머지는 별도로 다룰 만하다.

## 참고자료

- [Kubernetes 공식 문서 — Pods](https://kubernetes.io/docs/concepts/workloads/pods/)
- [Kubernetes 공식 문서 — Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes 공식 문서 — Service](https://kubernetes.io/docs/concepts/services-networking/service/)
- [가상화, 반가상화, 컨테이너 — 격리 기술 한눈에 정리](/infra/virtualization-vs-containers/) — 컨테이너 오케스트레이션이 왜 필요한지에 대한 배경
