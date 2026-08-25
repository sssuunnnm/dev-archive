---
title: 가상화, 반가상화, 컨테이너 — 격리 기술 한눈에 정리
description: 완전가상화/반가상화/컨테이너가 무엇을 어떻게 격리하는지, 그리고 컨테이너를 가능하게 하는 리눅스 커널 기능과 런타임 계층을 정리한다
date: 2026-08-25
updated:
category: infra
technology: [docker, kubernetes]
tags: [virtualization, container-runtime, orchestration]
type: study
status: evergreen
series:
projects:
related:
aliases:
draft: true
---

## 한 줄 요약

가상화는 하드웨어를 흉내 내서 격리하고, 컨테이너는 하나의 커널 위에서 프로세스가 보는 자원만 격리한다 — 이 차이가 무거움/가벼움을 가른다.

## 왜 (배경/문제 상황)

[Docker 기초 글](../docker-basics/)에서 "OS 커널을 호스트와 공유하면서 프로세스 단위로 격리한다"고만 짚고 넘어갔는데, 이게 정확히 무슨 뜻인지, 가상 머신(VM)과는 뭐가 다른지는 따로 정리할 만하다. 인프라나 미들웨어 쪽 면접에서도 가상화 → 반가상화 → 컨테이너 순서로 격리 기술의 발전 과정을 묻는 경우가 흔하다.

## 본문

### 격리 수준으로 보는 스펙트럼

| 방식 | 격리 단위 | 게스트 OS | 특징 |
|---|---|---|---|
| 완전가상화 (Full Virtualization) | 하드웨어 전체 | 필요 (수정 없이 그대로 동작) | 하이퍼바이저가 하드웨어를 완전히 흉내 내서, 게스트 OS는 자신이 가상 환경 위에 있다는 걸 모른 채 동작한다 |
| 반가상화 (Paravirtualization) | 하드웨어 대부분 + 일부 API 위임 | 필요 (하이퍼바이저 인지하도록 수정) | 게스트 OS가 자신이 가상화된 환경임을 알고 하이퍼바이저 API를 직접 호출해서, 하드웨어를 흉내 내는 오버헤드를 줄인다 |
| 컨테이너 (OS-level Virtualization) | 커널 내 프로세스 자원 | 불필요 (호스트 커널 공유) | 별도 게스트 OS 없이, 커널 기능으로 프로세스가 보는 자원만 격리한다 |

완전가상화는 인텔 VT-x, AMD-V 같은 하드웨어 가상화 지원 덕분에 지금은 반가상화 없이도 오버헤드가 크게 줄었다. 그래서 "반가상화가 완전가상화보다 항상 빠르다"는 예전 통념은 지금 기준으로는 절대적이지 않다 — 다만 개념적으로 "게스트 OS가 가상화 사실을 아는가"라는 차이는 여전히 유효하다.

컨테이너는 엄밀히는 하드웨어를 흉내 내는 게 아니라 커널 자원을 격리하는 방식이라 전통적인 "가상화"와는 결이 다르지만, 격리 기술이라는 맥락에서 같이 비교되는 경우가 많다.

### 하이퍼바이저 Type 1 vs Type 2

- **Type 1 (bare-metal)**: 하드웨어 위에 하이퍼바이저가 직접 올라간다 (예: VMware ESXi, Xen). 호스트 OS를 거치지 않아 오버헤드가 적고, 서버·클라우드 환경에서 주로 쓴다.
- **Type 2 (hosted)**: 호스트 OS 위에서 일반 애플리케이션처럼 하이퍼바이저가 돈다 (예: VirtualBox, VMware Workstation). 개인 개발 환경에서 흔하다.

### 컨테이너를 가능하게 하는 리눅스 커널 기능

컨테이너는 특별한 하이퍼바이저가 아니라, 리눅스 커널에 원래 있는 기능 두 가지를 조합한 것에 가깝다.

- **네임스페이스(namespace)**: 프로세스가 보는 자원(PID, 네트워크, 마운트, 유저, 호스트명 등)을 격리한다. 컨테이너 안에서 `ps`를 치면 그 컨테이너 안의 프로세스만 보이는 이유가 이것이다.
- **cgroups(control groups)**: CPU, 메모리, 디스크 I/O 같은 자원 사용량에 상한을 건다. 컨테이너 하나가 호스트 자원을 독점하는 걸 막는다.

즉 컨테이너는 "네임스페이스로 다른 프로세스가 안 보이게 하고, cgroups로 자원을 많이 못 쓰게 묶어둔 일반 프로세스"에 가깝다 — 별도의 커널이 필요 없으니 VM보다 훨씬 가볍다.

### 컨테이너 런타임 계층

Docker 하나로 다 되는 것처럼 보이지만, 내부는 여러 계층으로 나뉘어 있고 각 계층이 표준화되어 있다.

- **OCI(Open Container Initiative)**: 컨테이너 이미지 포맷과 런타임 스펙을 표준화한 규격. 특정 도구에 종속되지 않게 만드는 게 목적이다.
- **runc**: OCI 스펙에 따라 실제로 네임스페이스·cgroups를 설정해서 컨테이너 프로세스를 띄우는 저수준 런타임.
- **containerd**: 이미지 다운로드, 컨테이너 생명주기 관리를 담당하는 상위 런타임. Docker 엔진도 내부적으로 containerd를 통해 컨테이너를 띄운다.
- **CRI(Container Runtime Interface)**: Kubernetes가 containerd, CRI-O 같은 다양한 컨테이너 런타임과 통신하기 위해 정의한 표준 인터페이스.

### 직접 살펴보기 — VM 방식 vs 컨테이너 방식 레이어 비교

같은 애플리케이션 3개를 띄운다고 할 때, VM 방식과 컨테이너 방식의 레이어 구조가 어떻게 다른지 비교한다.

<div class="vcdemo">
<style>
.vcdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --app: #2f7d4f;
  font-family: 'Pretendard', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: var(--card); margin: 24px 0;
}
.dark .vcdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; --app: #6fbf8b; }
.vcdemo .toggle { display: flex; gap: 8px; margin-bottom: 16px; }
.vcdemo .togbtn {
  flex: 1; background: var(--card2); color: var(--ink); border: 1px solid var(--line); border-radius: 8px;
  padding: 9px 12px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer;
}
.vcdemo .togbtn[aria-pressed="true"] { background: var(--accent); color: var(--card); border-color: var(--accent); }
.vcdemo .stack { display: flex; flex-direction: column-reverse; gap: 4px; }
.vcdemo .layer { border-radius: 6px; padding: 8px 10px; font-size: 12.5px; border: 1px solid var(--line); background: var(--card2); }
.vcdemo .layer.base { text-align: center; color: var(--sub); }
.vcdemo .apps { display: flex; gap: 6px; }
.vcdemo .unit { flex: 1; border-radius: 6px; padding: 6px; border: 1px dashed var(--line); text-align: center; }
.vcdemo .unit .app { background: var(--app); color: var(--card); border-radius: 4px; padding: 4px; font-size: 11.5px; font-weight: 700; }
.vcdemo .unit .guest { background: var(--card); color: var(--sub); border: 1px solid var(--line); border-radius: 4px; padding: 4px; font-size: 10.5px; margin-bottom: 3px; }
.vcdemo .summary { margin-top: 12px; font-size: 12.5px; color: var(--sub); }
.vcdemo .summary b { color: var(--ink); }
</style>

<div class="toggle">
  <button class="togbtn" id="vc_vm" aria-pressed="true">가상 머신 방식</button>
  <button class="togbtn" id="vc_ct" aria-pressed="false">컨테이너 방식</button>
</div>
<div id="vc_diagram" aria-live="polite"></div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('vcdemo')) return;
  const vmBtn = root.querySelector('#vc_vm');
  const ctBtn = root.querySelector('#vc_ct');
  const diagramEl = root.querySelector('#vc_diagram');

  function renderVM() {
    diagramEl.innerHTML = `
      <div class="stack">
        <div class="layer base">Hardware</div>
        <div class="layer base">Host OS</div>
        <div class="layer base">Hypervisor</div>
        <div class="apps">
          <div class="unit"><div class="guest">Guest OS</div><div class="app">App</div></div>
          <div class="unit"><div class="guest">Guest OS</div><div class="app">App</div></div>
          <div class="unit"><div class="guest">Guest OS</div><div class="app">App</div></div>
        </div>
      </div>
      <div class="summary">앱 3개를 띄우려면 <b>Guest OS 3벌</b>이 함께 뜬다 — 앱 하나당 OS 하나가 추가 비용이다.</div>
    `;
  }
  function renderContainer() {
    diagramEl.innerHTML = `
      <div class="stack">
        <div class="layer base">Hardware</div>
        <div class="layer base">Host OS</div>
        <div class="layer base">Container Runtime</div>
        <div class="apps">
          <div class="unit"><div class="app">App</div></div>
          <div class="unit"><div class="app">App</div></div>
          <div class="unit"><div class="app">App</div></div>
        </div>
      </div>
      <div class="summary">앱 3개가 <b>Host OS 커널 하나</b>를 공유한다 — Guest OS가 없어서 그만큼 가볍다.</div>
    `;
  }
  function select(which) {
    vmBtn.setAttribute('aria-pressed', String(which === 'vm'));
    ctBtn.setAttribute('aria-pressed', String(which === 'ct'));
    which === 'vm' ? renderVM() : renderContainer();
  }
  vmBtn.addEventListener('click', () => select('vm'));
  ctBtn.addEventListener('click', () => select('ct'));
  select('vm');
})();
</script>

### 왜 오케스트레이션(Kubernetes)이 필요한가

컨테이너 하나 띄우는 건 `docker run` 한 줄로 충분하지만, 컨테이너가 수십~수백 개가 되면 "어느 서버에 배치할지, 죽으면 다시 띄울지, 트래픽을 어떻게 분산할지"를 사람이 수동으로 관리하기 어렵다. Kubernetes는 "이런 상태여야 한다(desired state)"를 선언하면 실제 상태를 그에 맞게 계속 조정해주는 오케스트레이션 도구다.

- **Pod**: Kubernetes에서 배포하는 최소 단위. 컨테이너 하나, 또는 네트워크·스토리지를 공유하는 여러 컨테이너의 묶음.
- **Node**: Pod가 실제로 실행되는 서버(물리 머신 또는 VM).
- **Control Plane**: 클러스터 전체의 원하는 상태를 관리하고, 실제 상태가 거기서 벗어나면 조정하는 역할.

Kubernetes 오브젝트(Deployment, Service 등)나 실제 운영 디테일은 이 글의 범위를 벗어나서, 필요하면 별도 글로 다룰 만하다.

## 예제

같은 애플리케이션을 "완전가상화 VM 위"와 "컨테이너"로 각각 띄운다고 하면, 실행 경로는 이렇게 대비된다.

```text
VM:      Hardware → Hypervisor → Guest OS → App
컨테이너: Hardware → Host OS → Container Runtime(containerd) → runc → App
```

VM은 앱까지 도달하기 전에 완전한 OS 하나를 더 거치고, 컨테이너는 호스트 커널 위에서 곧바로 프로세스로 실행된다.

## 주의사항

- "컨테이너는 가상화가 아니다"라는 주장과 "컨테이너도 가상화의 한 형태(OS-level virtualization)다"라는 주장이 둘 다 쓰인다. 무엇을 "가상화"의 정의로 삼느냐에 따른 용어 차이이지, 컨테이너가 커널을 공유한다는 사실 자체는 달라지지 않는다.
- 커널을 공유한다는 건 격리 수준이 VM보다 약하다는 뜻이기도 하다. 컨테이너 격리를 뚫는 취약점(커널 취약점 등)은 같은 호스트의 다른 컨테이너나 호스트 자체에 영향을 줄 수 있어서, VM만큼의 격리가 필요한 멀티테넌시 환경에서는 추가 보안 계층(gVisor 같은 sandboxed 런타임 등)을 고려하기도 한다.
- 여기서 다룬 반가상화/완전가상화 비교는 개념 이해를 위한 단순화이고, 실제 하이퍼바이저들은 하드웨어 가상화 지원과 반가상화 드라이버를 섞어 쓰는 하이브리드 방식을 쓰는 경우가 많다.

## 참고자료

- Docker 공식 문서(docs.docker.com), Kubernetes 공식 문서(kubernetes.io) — 개념 정의 확인용
- [Docker 기초 개념과 자주 쓰는 명령어](../docker-basics/)
