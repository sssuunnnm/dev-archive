---
title: OneStep 파헤치기 (2) - GPS는 왜 튀는가 (임계값 가드로 이상치 걸러내기)
description: GPS 원시 좌표가 튀는 이유를 살펴보고, 칼만 필터 대신 정확도·거리 임계값 가드로 이상치를 걸러낸 이유와 구현을 정리한다.
date: 2026-08-21
updated: 2026-08-22
category: development
technology: [android, kotlin]
tags: [location-tracking, gps-accuracy]
type: troubleshooting
status: evergreen
series:
  name: onestep-deep-dive
  order: 2
projects:
  - onestep
draft: false
---

## 한 줄 요약

GPS 원시 좌표가 튀는 원인을 정리하고, 칼만 필터 대신 정확도·거리 임계값 가드로 이상치를 걸러낸 이유와 구현을 정리한다.

## 왜 (배경/문제 상황)

1편에서 받은 위치는 원본(raw) 데이터라 오차와 노이즈가 그대로 섞여 있다고 언급했다. 실제로 산책 화면에서
좌표를 로그로 찍어보면, 사용자가 가만히 서 있어도 좌표가 순간적으로 수십 미터씩 튀는 경우가 있었다.
도착 판정 로직이 이 튄 좌표를 그대로 믿으면, 실제로는 도착하지 않았는데 도착으로 처리되거나(오탐), 반대로
실제 도착했는데도 계속 미도착으로 남는(누락) 오작동이 생긴다. 이 문제를 어떻게 다뤘는지 정리한다.

## 본문

### 1. GPS 좌표가 튀는 이유

- **Multipath**: 건물 벽이나 지형에 반사된 신호가 섞여 들어와, 실제보다 먼 거리를 이동한 것처럼 계산되는 현상.
- **도심 협곡(urban canyon)**: 고층 건물 사이에서는 일부 위성 신호가 가려져 확보되는 위성 수가 줄고, 그만큼 정확도가 급격히 떨어진다.
- **Cold start**: GPS 모듈이 막 켜진 직후에는 아직 충분한 위성 신호를 확보하지 못해 초기 좌표의 정확도가 낮다.
- `location.accuracy`는 "오차가 이 값 이내로 보장된다"는 값이 아니라, 실제 위치가 해당 반경(미터) 안에 있을 확률이 68% 수준이라는 신뢰구간 값이다. 즉 accuracy가 낮게(정확하게) 나온 순간에도, 드물게 크게 튀는 좌표가 섞여 들어올 수 있다.

### 2. 칼만 필터 vs 임계값 가드

칼만 필터는 이전 상태와 새 관측값을 가중 평균해 부드러운 궤적을 만들어내는 표준적인 노이즈 대응 기법이다.
하지만 OneStep의 산책 챌린지에서는 칼만 필터 대신 단순한 임계값 가드를 택했다.

- 목표가 "부드러운 궤적을 그리는 것"이 아니라 "도착 여부를 정확히 판정하는 것"이었다. 궤적이 살짝 삐뚤어도
  상관없지만, 순간이동 수준의 명백한 이상치가 도착 판정에 섞이면 안 된다 — 이 문제에 맞는 건 스무딩이
  아니라 이상치 제거였다.
- 타겟 사용자(고립·은둔 청년)의 실제 이동 반경이 좁아, 칼만 필터의 튜닝 비용(프로세스·관측 노이즈 공분산
  추정) 대비 얻는 이득이 크지 않았다. 반면 임계값 가드는 조정할 파라미터가 정확도·거리(속도) 두 가지뿐이라
  구현과 검증이 훨씬 빨랐다.

### 3. 임계값 가드 구현

가드는 두 단계로 구성했다.

**정확도 가드**: `location.accuracy` 값이 기준치보다 크면, 애초에 신뢰도가 낮은 값이므로 버린다.

```kotlin
private const val MAX_ACCURACY_METERS = 30f

fun isAccurate(location: Location): Boolean {
    return location.accuracy <= MAX_ACCURACY_METERS
}
```

**속도(거리) 가드**: 정확도 기준을 통과해도, 직전 좌표와의 거리를 경과 시간으로 나눈 속도가 도보로는
불가능한 값이면 이상치로 간주해 버린다.

```kotlin
private const val MAX_WALKING_SPEED_MPS = 20_000f / 3600f // 시속 20km를 m/s로 환산

fun isPlausibleMove(previous: Location, current: Location): Boolean {
    val distanceMeters = previous.distanceTo(current)
    // Location.time은 시스템 시각이라 시계 보정으로 거꾸로 흐를 수 있다.
    // elapsedRealtimeNanos는 부팅 후 단조 증가하는 값이라 경과 시간 계산엔 이쪽을 써야 한다.
    val elapsedSeconds = (current.elapsedRealtimeNanos - previous.elapsedRealtimeNanos) / 1_000_000_000f
    if (elapsedSeconds <= 0f) return false

    val speedMps = distanceMeters / elapsedSeconds
    return speedMps <= MAX_WALKING_SPEED_MPS
}
```

두 가드를 모두 통과한 좌표만 "신뢰할 수 있는 현재 위치"로 갱신한다.

```kotlin
class LocationFilter {
    private var lastAccepted: Location? = null

    fun accept(location: Location): Location? {
        if (!isAccurate(location)) return null

        val previous = lastAccepted
        if (previous != null && !isPlausibleMove(previous, location)) {
            return null
        }

        lastAccepted = location
        return location
    }
}
```

`LocationCallback` 안에서 원시 좌표를 바로 상태에 반영하지 않고, 이 필터를 거친 값만 반영한다.

```kotlin
val locationFilter = LocationFilter()

val locationCallback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
        val raw = result.lastLocation ?: return
        val accepted = locationFilter.accept(raw) ?: return
        // accepted.latitude, accepted.longitude로 도착 판정 로직 수행
    }
}
```

### 4. 도착 판정에 가드가 필요했던 이유

도착 판정은 "현재 좌표와 목적지 좌표 사이 거리가 반경 R 이내인가"로 계산한다. 여기에 필터링되지 않은
원시 좌표를 그대로 쓰면, 실제로는 목적지 밖에 있는데 튄 좌표 하나가 반경 안으로 순간 진입해 도착 처리되는
오탐이 생긴다. 반대로 실제 도착 좌표가 튀어서 반경 밖으로 나가면 도착이 누락된다. 필터를 거친 좌표만
판정에 쓰면 이 두 오작동을 크게 줄일 수 있다.

### 5. 직접 눌러보기 — 필터링 전후 비교

아래 데모는 위 `isAccurate` + `isPlausibleMove` 가드를 그대로 재현한 것이다. 왼쪽은 필터를 거치지 않은 원시 좌표, 오른쪽은 두 가드를 통과한 좌표만 남긴 결과다. 같은 노이즈 데이터를 두 방식으로 그려 비교한다.

<div class="gpsdemo">
<style>
.gpsdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --bad: #dc2626; --good: #16a34a;
  font-family: 'Pretendard', system-ui, sans-serif;
  font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px;
  background: var(--card); margin: 24px 0;
}
.dark .gpsdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; }
.gpsdemo .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
@media (max-width: 640px) { .gpsdemo .grid { grid-template-columns: 1fr; } }
.gpsdemo .panel { background: var(--card2); border: 1px solid var(--line); border-radius: 10px; padding: 10px; }
.gpsdemo .panel .title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; font-weight: 700; }
.gpsdemo .panel .badge { padding: 1px 8px; font-size: 10px; border-radius: 999px; color: #fff; }
.gpsdemo .panel.raw .badge { background: var(--bad); }
.gpsdemo .panel.filtered .badge { background: var(--good); }
.gpsdemo canvas { display: block; width: 100%; height: 200px; border-radius: 6px; }
.gpsdemo .meter { margin-top: 8px; display: flex; gap: 10px; flex-wrap: wrap; font-size: 11.5px; color: var(--sub); }
.gpsdemo .meter b { color: var(--ink); }
.gpsdemo .controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
.gpsdemo .btn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.gpsdemo .btn.ghost { background: var(--card2); color: var(--ink); border: 1px solid var(--line); }
.gpsdemo .constants {
  font-family: 'Fira Code', ui-monospace, Menlo, Consolas, monospace; font-size: 11.5px;
  background: #0f1633; color: #9fb0e8; border-radius: 10px; padding: 12px 14px; line-height: 1.8;
}
.gpsdemo .constants b { color: #fff; }
</style>

<div class="grid">
  <div class="panel raw">
    <div class="title"><span>📡 원시 좌표</span><span class="badge">UNFILTERED</span></div>
    <canvas id="gps_raw"></canvas>
    <div class="meter"><span>수신: <b id="gps_raw_total">0</b></span><span>총거리: <b id="gps_raw_dist">0.0</b>m</span></div>
  </div>
  <div class="panel filtered">
    <div class="title"><span>✅ isAccurate + isPlausibleMove 통과</span><span class="badge">FILTERED</span></div>
    <canvas id="gps_flt"></canvas>
    <div class="meter"><span>채택: <b id="gps_flt_total">0</b></span><span>총거리: <b id="gps_flt_dist">0.0</b>m</span><span>정확도 탈락: <b id="gps_rej_acc">0</b></span><span>속도 탈락: <b id="gps_rej_speed">0</b></span></div>
  </div>
</div>

<div class="controls">
  <button class="btn" id="gps_play">▶ 산책 재현</button>
  <button class="btn ghost" id="gps_regen">🎲 노이즈 다시 뽑기</button>
</div>

<div class="constants">
  <b>MAX_ACCURACY_METERS</b> = 30f&nbsp;&nbsp;&nbsp;<b>MAX_WALKING_SPEED_MPS</b> = 20_000f / 3600f (≈5.56 m/s)
</div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('gpsdemo')) return;
  const MAX_ACCURACY = 30;
  const MAX_SPEED = 20000 / 3600; // m/s

  const rawCv = root.querySelector('#gps_raw');
  const fltCv = root.querySelector('#gps_flt');
  const rawCtx = rawCv.getContext('2d');
  const fltCtx = fltCv.getContext('2d');

  function fit(cv) {
    const ratio = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    cv.width = rect.width * ratio; cv.height = rect.height * ratio;
    cv.getContext('2d').scale(ratio, ratio);
    return { w: rect.width, h: rect.height };
  }
  let RAW_SIZE = fit(rawCv), FLT_SIZE = fit(fltCv);

  function genPath(size) {
    const pts = []; const N = 60, padX = 24, padY = 30;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = padX + t * (size.w - 2 * padX);
      const y = size.h / 2 + Math.sin(t * Math.PI * 1.8) * (size.h / 2 - padY) * 0.7;
      pts.push({ x, y, t: i * 1.2 }); // 1.2초 간격 샘플링 가정
    }
    return pts;
  }
  function addNoise(truePath) {
    return truePath.map((p) => {
      const r = Math.random();
      let accuracy, jitter;
      if (r < 0.15) { accuracy = 35 + Math.random() * 25; jitter = 18 + Math.random() * 20; } // 정확도 탈락 유도
      else if (r < 0.2) { accuracy = 8 + Math.random() * 5; jitter = 90 + Math.random() * 60; } // 속도 탈락 유도(텔레포트)
      else { accuracy = 3 + Math.random() * 8; jitter = Math.random() * 3; }
      const angle = Math.random() * Math.PI * 2;
      return { x: p.x + Math.cos(angle) * jitter, y: p.y + Math.sin(angle) * jitter, accuracy, t: p.t };
    });
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); } // 데모에서는 1px ≈ 1m로 간주

  let TRUE_PATH = genPath(RAW_SIZE);
  let NOISY = addNoise(TRUE_PATH);

  function drawGrid(ctx, size, dark) {
    ctx.clearRect(0, 0, size.w, size.h);
    ctx.fillStyle = dark ? '#27272a' : '#fff'; ctx.fillRect(0, 0, size.w, size.h);
    ctx.strokeStyle = dark ? '#374151' : '#e5e7eb'; ctx.lineWidth = 1;
    for (let x = 0; x < size.w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size.h); ctx.stroke(); }
    for (let y = 0; y < size.h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.w, y); ctx.stroke(); }
  }
  function ghost(ctx, dark) {
    ctx.strokeStyle = dark ? 'rgba(156,163,175,0.35)' : 'rgba(107,114,128,0.3)';
    ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]);
    ctx.beginPath();
    TRUE_PATH.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke(); ctx.setLineDash([]);
  }
  function isDark() { return document.documentElement.classList.contains('dark'); }
  function redraw() {
    const dark = isDark();
    drawGrid(rawCtx, RAW_SIZE, dark); ghost(rawCtx, dark);
    drawGrid(fltCtx, FLT_SIZE, dark); ghost(fltCtx, dark);
  }
  redraw();

  let playToken = 0;
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  async function play() {
    const my = ++playToken;
    redraw();
    const elRawTotal = root.querySelector('#gps_raw_total');
    const elRawDist = root.querySelector('#gps_raw_dist');
    const elFltTotal = root.querySelector('#gps_flt_total');
    const elFltDist = root.querySelector('#gps_flt_dist');
    const elRejAcc = root.querySelector('#gps_rej_acc');
    const elRejSpeed = root.querySelector('#gps_rej_speed');
    let rawCount = 0, rawDist = 0, fltCount = 0, fltDist = 0, rejAcc = 0, rejSpeed = 0;
    let prevRaw = null, lastAccepted = null;
    for (let i = 0; i < NOISY.length; i++) {
      if (my !== playToken) return;
      const p = NOISY[i];
      rawCount++;
      if (prevRaw) {
        rawDist += dist(prevRaw, p);
        rawCtx.strokeStyle = '#dc2626'; rawCtx.lineWidth = 1.8;
        rawCtx.beginPath(); rawCtx.moveTo(prevRaw.x, prevRaw.y); rawCtx.lineTo(p.x, p.y); rawCtx.stroke();
      }
      rawCtx.fillStyle = p.accuracy > MAX_ACCURACY ? '#dc2626' : '#f59e0b';
      rawCtx.beginPath(); rawCtx.arc(p.x, p.y, 3, 0, Math.PI * 2); rawCtx.fill();
      prevRaw = p;

      // isAccurate
      if (p.accuracy > MAX_ACCURACY) {
        rejAcc++;
        fltCtx.fillStyle = 'rgba(220,38,38,0.25)';
        fltCtx.beginPath(); fltCtx.arc(p.x, p.y, 2, 0, Math.PI * 2); fltCtx.fill();
      } else if (lastAccepted && (dist(lastAccepted, p) / (p.t - lastAccepted.t)) > MAX_SPEED) {
        // isPlausibleMove
        rejSpeed++;
        fltCtx.fillStyle = 'rgba(220,38,38,0.25)';
        fltCtx.beginPath(); fltCtx.arc(p.x, p.y, 2, 0, Math.PI * 2); fltCtx.fill();
      } else {
        fltCount++;
        if (lastAccepted) {
          fltDist += dist(lastAccepted, p);
          fltCtx.strokeStyle = '#16a34a'; fltCtx.lineWidth = 2;
          fltCtx.beginPath(); fltCtx.moveTo(lastAccepted.x, lastAccepted.y); fltCtx.lineTo(p.x, p.y); fltCtx.stroke();
        }
        fltCtx.fillStyle = '#16a34a';
        fltCtx.beginPath(); fltCtx.arc(p.x, p.y, 3, 0, Math.PI * 2); fltCtx.fill();
        lastAccepted = p;
      }
      elRawTotal.textContent = rawCount; elRawDist.textContent = rawDist.toFixed(1);
      elFltTotal.textContent = fltCount; elFltDist.textContent = fltDist.toFixed(1);
      elRejAcc.textContent = rejAcc; elRejSpeed.textContent = rejSpeed;
      await sleep(35);
    }
  }
  root.querySelector('#gps_play').addEventListener('click', play);
  root.querySelector('#gps_regen').addEventListener('click', () => {
    playToken++;
    RAW_SIZE = fit(rawCv); FLT_SIZE = fit(fltCv);
    TRUE_PATH = genPath(RAW_SIZE); NOISY = addNoise(TRUE_PATH);
    redraw();
    ['gps_raw_total', 'gps_flt_total', 'gps_rej_acc', 'gps_rej_speed'].forEach((id) => root.querySelector('#' + id).textContent = '0');
    ['gps_raw_dist', 'gps_flt_dist'].forEach((id) => root.querySelector('#' + id).textContent = '0.0');
  });
  window.addEventListener('resize', () => {
    playToken++;
    RAW_SIZE = fit(rawCv);
    FLT_SIZE = fit(fltCv);
    TRUE_PATH = genPath(RAW_SIZE);
    NOISY = addNoise(TRUE_PATH);
    redraw();
  });
})();
</script>

## 예제

전체 흐름을 하나로 합치면 다음과 같다.

```kotlin
class WalkLocationManager(
    private val destination: Location,
    private val arrivalRadiusMeters: Float,
) {
    private val filter = LocationFilter()
    private var hasArrived = false

    fun onNewLocation(raw: Location): Boolean {
        val accepted = filter.accept(raw) ?: return false
        val isWithinRadius = accepted.distanceTo(destination) <= arrivalRadiusMeters
        if (!isWithinRadius || hasArrived) return false

        hasArrived = true
        return true
    }
}
```

`onNewLocation()`이 `true`를 반환하는 시점에 도착 처리 로직(챌린지 완료 API 호출 등)을 실행한다. `hasArrived` 없이 반경 안 여부만 반환하면, 도착 반경 안에서 잡히는 좌표마다 매번 `true`가 나와 완료 API가 중복 호출된다.

## 주의사항

- 정확도·속도 임계값은 실측 로그로 튜닝해야 한다. 이 글의 30m·시속 20km는 예시 값이니, 서비스의
  사용자 이동 패턴(도보/자전거/차량)에 맞게 조정해야 한다.
- 가드를 통과하지 못한 좌표를 계속 버리기만 하면, 사용자가 실외로 나가 정확도가 급격히 개선되는
  상황에서도 `lastAccepted`가 오래된 값에 머물러 있을 수 있다. 일정 시간(예: 10초) 이상 새 좌표를 받지
  못하면 가드를 완화하는 등의 예외 처리가 실무에서는 추가로 필요하다.
- `hasArrived` 플래그는 클라이언트가 재시작되면 초기화된다. 완료 API 쪽에도 idempotency key나
  "이미 완료된 챌린지는 재요청을 무시" 같은 방어 로직을 둬야, 클라이언트만 믿고 중복 보상을
  지급하는 일을 막을 수 있다.
- 이 가드는 "명백한 이상치 제거"만 담당할 뿐 궤적을 부드럽게 만들어주지는 않는다. 지도에 이동 경로를
  시각적으로 예쁘게 그려야 하는 서비스라면 칼만 필터나 이동평균 같은 스무딩 기법이 별도로 필요하다.

## 참고자료

- [Location - Android Developers 레퍼런스](https://developer.android.com/reference/android/location/Location) (`getAccuracy()` 항목에 68% 신뢰구간 정의가 나와 있다)
- [Location.distanceTo - Android Developers 레퍼런스](https://developer.android.com/reference/android/location/Location#distanceTo(android.location.Location))
