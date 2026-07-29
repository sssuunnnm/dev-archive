---
title: OneStep 파헤치기 (1) - 실시간 위치 받기 (FusedLocationProviderClient)
description: FusedLocationProviderClient로 안드로이드에서 실시간 위치를 요청하고 받는 기본 흐름을 정리한다.
date: 2026-07-29
updated: 2026-07-29
category: development
technology: [android, kotlin]
tags: [location-tracking, permissions]
type: tutorial
status: evergreen
series:
  name: onestep-deep-dive
  order: 1
projects:
  - onestep
draft: false
---

## 한 줄 요약

`FusedLocationProviderClient`로 실시간 위치를 요청하고, 콜백으로 좌표를 받는 기본 흐름을 정리한다.

## 왜 (배경/문제 상황)

OneStep의 산책 챌린지는 사용자가 실제로 걷고 있는지, 목적지에 도착했는지를 판단해야 한다.
이걸 하려면 앱이 주기적으로 사용자의 현재 위치(위도/경도)를 받아와야 하는데, 안드로이드에서
가장 널리 쓰이는 방법이 Google Play Services가 제공하는 `FusedLocationProviderClient`다.
GPS 노이즈 처리나 도착 판정 같은 심화 내용에 들어가기 전에, 먼저 위치를 어떻게 받아오는지부터
확실히 짚고 넘어간다.

## 본문

### 1. 의존성 추가

```kotlin
// build.gradle.kts (app)
dependencies {
    implementation("com.google.android.gms:play-services-location:21.3.0")
}
```

### 2. 권한 선언

위치 권한은 앱 설치 시 자동으로 부여되지 않는, 런타임에 사용자 동의를 받아야 하는 위험 권한이다.

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

- `ACCESS_FINE_LOCATION`: GPS 기반 정밀 위치
- `ACCESS_COARSE_LOCATION`: 네트워크 기반 대략적 위치 (정밀 위치 없이도 최소한의 위치는 필요할 때)

### 3. 런타임 권한 요청

이미 권한이 있는 경우까지 매번 launcher를 호출할 필요는 없다. 먼저 권한 보유 여부를 확인하고,
없을 때만 요청하는 흐름이 실무에 더 가깝다.

```kotlin
fun hasLocationPermission(context: Context): Boolean {
    return ContextCompat.checkSelfPermission(
        context, Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
}
```

Compose 환경에서는 `rememberLauncherForActivityResult`로 권한 요청 결과를 받는다.

```kotlin
val context = LocalContext.current

val permissionLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.RequestMultiplePermissions()
) { permissions ->
    // FINE 권한이 없어도 COARSE 권한만으로 허용된 경우가 있으므로 둘 다 확인한다.
    val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
        permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
    if (granted) {
        // 위치 요청 시작
    }
}

LaunchedEffect(Unit) {
    if (hasLocationPermission(context)) {
        // 이미 권한이 있으면 바로 위치 요청 시작
    } else {
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
        )
    }
}
```

### 4. FusedLocationProviderClient로 위치 요청

```kotlin
val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

val locationRequest = LocationRequest.Builder(
    Priority.PRIORITY_HIGH_ACCURACY,
    3000L // 요청 주기 3초. 실제 호출 간격은 시스템/배터리 정책에 따라 달라질 수 있다.
).build()

val locationCallback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
        val location = result.lastLocation ?: return
        // location.latitude, location.longitude, location.accuracy 사용
    }
}
```

### 5. 위치 업데이트 시작/중지

```kotlin
@SuppressLint("MissingPermission")
fun startLocationUpdates() {
    fusedLocationClient.requestLocationUpdates(
        locationRequest,
        locationCallback,
        Looper.getMainLooper()
    )
}

fun stopLocationUpdates() {
    fusedLocationClient.removeLocationUpdates(locationCallback)
}
```

산책 시작 시점에 `startLocationUpdates()`를 호출하고, 산책 종료 시점에 `stopLocationUpdates()`를
호출해 불필요한 배터리 소모를 막는다.

### 6. 다른 방식은 없을까

여기서 쓴 `LocationCallback` + `requestLocationUpdates()` 조합이 유일한 방법은 아니다. 상황에 따라
아래 방식이 더 적합할 수 있다.

| 방식 | 언제 쓰나 |
|---|---|
| `LocationCallback` (이 글에서 쓴 방식) | 포그라운드에서 연속 추적, 구현이 비교적 간단 |
| `PendingIntent` 기반 요청 | 앱 프로세스가 죽어도 시스템이 인텐트로 위치를 전달해줘야 하는 백그라운드 추적 |
| `getCurrentLocation()` | 연속 추적이 아니라 지금 위치 딱 한 번만 필요할 때 |
| `com.google.android.gms.location.LocationListener` | 가용성 변경 감지나 배치 수신 없이, 단순한 위치 콜백만 필요할 때 (안드로이드 프레임워크의 `android.location.LocationListener`와는 다른 클래스이니 주의) |

산책처럼 오래 지속되는 추적이라면 `LocationCallback`으로 충분하지만, 앱이 백그라운드로 밀려나거나
종료된 상태에서도 위치를 계속 받아야 한다면 `PendingIntent` 기반 요청을 검토해야 한다.

## 예제

Compose 화면에서 위치를 받아 화면에 표시하는 최소 예제. 앞서 정의한 `hasLocationPermission()`으로
권한을 확인한 뒤에만 요청을 시작해, 권한 없이 호출해 `SecurityException`이 나는 상황을 막는다.

```kotlin
@SuppressLint("MissingPermission")
@Composable
fun WalkScreen(fusedLocationClient: FusedLocationProviderClient) {
    val context = LocalContext.current
    var currentLocation by remember { mutableStateOf<Location?>(null) }

    DisposableEffect(fusedLocationClient) {
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                currentLocation = result.lastLocation
            }
        }
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000L).build()

        if (hasLocationPermission(context)) {
            fusedLocationClient.requestLocationUpdates(request, callback, Looper.getMainLooper())
        }

        onDispose {
            fusedLocationClient.removeLocationUpdates(callback)
        }
    }

    Text("위도: ${currentLocation?.latitude}, 경도: ${currentLocation?.longitude}")
}
```

`@SuppressLint("MissingPermission")`는 함수 시그니처에 붙여 lint 경고만 억제하고, 실제 크래시 방지는
`hasLocationPermission(context)` 체크가 담당한다. `DisposableEffect`로 감싸서, 화면이 사라질 때
(`onDispose`) 위치 업데이트를 자동으로 정리한다.

## 주의사항

- `Priority.PRIORITY_HIGH_ACCURACY`는 GPS를 적극적으로 사용해 배터리 소모가 크다. 산책 중에만
  켜고, 종료 즉시 꺼야 한다. `intervalMillis`는 "이 정도 주기로 받고 싶다"는 희망 사항일 뿐이고,
  실제 콜백 빈도는 시스템이 조정한다 — 다른 앱이 이미 더 촘촘한 주기로 GPS를 켜놨다면 그 결과를
  묻어가며(piggyback) 더 자주 받을 수도 있고(배터리 이득), 시스템 정책상 우리가 원한 것보다 뜸하게
  올 수도 있다. `setMinUpdateIntervalMillis()`로 "최소 이 간격보다 짧게는 받지 않겠다"는 하한선을
  정해두면, 의도보다 과도하게 잦은 콜백으로 배터리를 더 쓰는 상황은 막을 수 있다.
- 권한 없이 `requestLocationUpdates()`를 호출하면 콜백이 조용히 안 불리는 게 아니라
  **`SecurityException`이 발생**한다. `@SuppressLint("MissingPermission")`은 이 예외 자체를 막아주는
  게 아니라 lint 경고만 억제하므로, 호출 전에 반드시 권한이 허용됐는지 확인하는 로직(또는 최소한
  권한 요청 콜백 내부에서만 호출)이 있어야 한다.
- 여기서 받은 위치는 원본(raw) 데이터라 오차와 노이즈가 그대로 섞여 있다. 이 오차를 어떻게
  다룰지는 다음 편(GPS는 왜 튀는가)에서 다룬다.

## 참고자료

- [Request location updates - Android Developers](https://developer.android.com/develop/sensors-and-location/location/request-updates)
- [FusedLocationProviderClient - Google Play services 레퍼런스](https://developers.google.com/android/reference/com/google/android/gms/location/FusedLocationProviderClient)
- [LocationRequest - Google Play services 레퍼런스](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest)
- [LocationCallback - Google Play services 레퍼런스](https://developers.google.com/android/reference/com/google/android/gms/location/LocationCallback)