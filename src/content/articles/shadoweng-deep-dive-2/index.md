---
title: 화면 하나에만 MVI를 쓴 이유 — 아키텍처를 섞어도 되는가
description: 대부분 화면은 MVVM으로 두고 게임 플레이 화면 하나에만 MVI를 도입한 이유를, 팀 상황과 함께 정리한다.
date: 2026-08-22
updated: 2026-08-22
category: development
technology: [android, kotlin]
tags: [mvi, mvvm, architecture]
type: study
status: evergreen
series:
  name: shadoweng-deep-dive
  order: 2
projects:
  - shadoweng
draft: false
---

## 한 줄 요약

앱 전체를 하나의 아키텍처로 통일하지 않고, 상태 흐름이 유독 복잡한 화면 하나에만 MVI를 도입한 이유와 판단 기준을 정리한다.

## 왜 (배경/문제 상황)

"우리 앱 아키텍처는 뭘로 통일할까?"는 프로젝트 초반에 흔히 나오는 질문이지만, 실제로 화면마다 요구되는 복잡도는 다르다. ShadowEng(영어 섀도잉 학습 앱)의 화면 20개 중 19개는 State 하나만 잘 관리하면 충분했다. 그런데 게임 플레이 화면 하나만은 카운트다운 → 녹음 → 평가 → 결과로 이어지는 다단계 흐름에, "평가가 끝나면 결과 화면으로 한 번만 이동한다" 같은 일회성 이벤트까지 섞여 있어서 기존 방식으로는 표현이 부족했다. 이 화면을 억지로 기존 패턴에 맞출지, 아니면 이 화면만 다른 패턴을 쓸지 판단해야 했다.

## 본문

### 1. 나머지 19개 화면: State + Event

대부분 화면은 `MutableStateFlow<XxxUiState>`로 화면 상태를 들고, 사용자 행동이나 서버 응답에 따라 상태를 갱신하는 방식으로 충분했다. 화면 이동처럼 "한 번만 실행돼야 하는 동작"은 별도 `MutableSharedFlow`로 분리했다.

```kotlin
data class ContentRegisterUiState(
    val url: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
)

class ContentRegisterViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ContentRegisterUiState())
    val uiState: StateFlow<ContentRegisterUiState> = _uiState.asStateFlow()

    private val _navigateToRange = MutableSharedFlow<String>()
    val navigateToRange: SharedFlow<String> = _navigateToRange.asSharedFlow()

    fun onUrlChanged(url: String) {
        _uiState.update { it.copy(url = url) }
    }

    fun onSubmit() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val videoId = registerContent(_uiState.value.url)
            _uiState.update { it.copy(isLoading = false) }
            _navigateToRange.emit(videoId)
        }
    }
}
```

이 정도 화면은 상태 하나, 이벤트 스트림 하나로 충분히 예측 가능하게 관리된다. 문제는 상태 전이 자체가 복잡한 화면을 만났을 때다.

### 2. 게임 플레이 화면이 유독 복잡했던 이유

게임 플레이 화면은 한 라운드 안에서 여러 단계를 거친다.

```text
대기 → [녹음 시작 인텐트] → 카운트다운(3,2,1) → 녹음 중 → 평가 중 → 결과 표시
                                                                      │
                                                        마지막 라운드면 결과 화면으로 이동(1회성)
```

이걸 State + SharedFlow 방식으로 그대로 옮기면 두 가지가 애매해진다.

- **"지금 사용자가 할 수 있는 행동이 뭔지"가 State 필드만 봐서는 안 드러난다.** `isRecording`, `isAnalyzing`, `countdown` 같은 불리언·nullable 필드가 늘어날수록, 이 조합이 정말 유효한 상태인지(예: `isRecording=true`이면서 동시에 `isAnalyzing=true`인 게 가능한 상태인지) 코드만 보고 판단하기 어려워진다.
- **사용자 행동(인텐트)과 그 결과로 발생하는 일회성 이벤트(효과)가 뒤섞인다.** "녹음 시작 버튼을 눌렀다"는 행동과 "평가가 끝나서 결과 화면으로 이동해야 한다"는 효과는 성격이 다른데, 둘 다 그냥 함수 호출과 `SharedFlow.emit()`으로 처리하면 뭐가 사용자 입력이고 뭐가 시스템 반응인지 코드에서 구분이 잘 안 된다.

### 3. MVI로 얻은 것: State/Intent/Effect 분리

이 화면 하나에는 State, Intent, Effect 세 가지를 명확히 분리한 MVI(Contract 패턴)를 도입했다.

```kotlin
// GamePlayContract.kt
data class GamePlayState(
    val level: Int = 1,
    val round: Int = 1,
    val hearts: Int = 3,
    val countdown: Int? = null,
    val isRecording: Boolean = false,
    val isAnalyzing: Boolean = false,
    val showRoundModal: Boolean = false,
)

sealed class GamePlayIntent {
    data object StartCountdown : GamePlayIntent()
    data object StopRecording : GamePlayIntent()
    data object RetryCountdown : GamePlayIntent()
    data class SetAudioPlaying(val isPlaying: Boolean) : GamePlayIntent()
}

sealed class GamePlayEffect {
    data class NavigateToResult(val finalResult: RoundResult) : GamePlayEffect()
    data object NavigateToLeaderboard : GamePlayEffect()
    data class ShowError(val message: String) : GamePlayEffect()
}
```

- **State**: 지금 화면이 어떤 모습이어야 하는지를 나타내는 단일 진실 공급원. "유효하지 않은 조합"을 최대한 줄이는 방향으로 필드를 설계한다.
- **Intent**: 사용자가 할 수 있는 행동을 sealed class로 못박아둔다. `when(intent)`로 처리하면 새 행동을 추가할 때 컴파일러가 빠진 분기를 알려준다.
- **Effect**: "한 번만 실행돼야 하는" 시스템 반응(화면 이동, 에러 토스트 등)만 따로 모은다. State에 섞이지 않으므로, 화면이 재구성돼도 이미 처리된 Effect가 중복 실행되지 않는다.

ViewModel은 `Channel<GamePlayEffect>`로 Effect를 흘려보내고, `onIntent()` 하나로 모든 사용자 행동을 받는다.

```kotlin
class GamePlayViewModel(
    private val savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val _state = MutableStateFlow(GamePlayState())
    val state: StateFlow<GamePlayState> = _state.asStateFlow()

    private val _effect = Channel<GamePlayEffect>(Channel.BUFFERED)
    val effect = _effect.receiveAsFlow()

    fun onIntent(intent: GamePlayIntent) {
        when (intent) {
            is GamePlayIntent.StartCountdown -> startCountdown()
            is GamePlayIntent.StopRecording -> stopRecordingAndEvaluate()
            is GamePlayIntent.RetryCountdown -> retryCountdown()
            is GamePlayIntent.SetAudioPlaying -> _state.update { it.copy(/* ... */) }
        }
    }

    private fun stopRecordingAndEvaluate() {
        viewModelScope.launch {
            _state.update { it.copy(isRecording = false, isAnalyzing = true) }
            val result = evaluate()
            _state.update { it.copy(isAnalyzing = false, showRoundModal = true) }
            if (result.isLastRound) {
                _effect.send(GamePlayEffect.NavigateToResult(result))
            }
        }
    }
}
```

`Channel`은 구독자가 없는 순간에도 이벤트를 버퍼에 담아뒀다가 나중에 전달하고(`Channel.BUFFERED`), `receiveAsFlow()`로 소비하면 한 번 처리된 Effect가 다시 재생되지 않는다. `SharedFlow`로도 비슷하게 흉내 낼 수는 있지만, "정확히 한 번만 소비돼야 한다"는 의도를 코드로 더 분명하게 드러내는 쪽은 `Channel`이다.

### 4. 왜 앱 전체에 MVI를 강제하지 않았는가

여기서 자연스러운 다음 질문은 "그럼 처음부터 앱 전체를 MVI로 만들지 그랬냐"다. 두 가지 이유로 그러지 않았다.

- **팀 상황**: 원래 6명 팀이었는데 1명이 중도 이탈해 5명으로 줄었고, 그중 4명이 비전공자(2명은 개발 경험이 거의 없는 상태)였다. State/Intent/Effect라는 새 개념을 팀 전체에 강제하면, 그 학습 비용이 일정 안에서 감당하기 어려웠다.
- **비용 대비 효과**: 나머지 19개 화면은 State + Event로도 충분히 예측 가능했다. 복잡하지 않은 화면까지 Intent/Effect로 감싸는 건 보일러플레이트만 늘릴 뿐, 실질적인 이득이 크지 않았다.

결국 "이 화면이 정말 그 복잡도를 감당할 만큼 복잡한가"를 기준으로 판단해, 게임 플레이 화면 하나에만 MVI를 적용했다. 아키텍처는 앱 전체에 하나로 통일해야 한다는 강박보다, 화면별 복잡도에 맞춰 패턴을 섞어 쓰는 쪽이 팀 상황에 더 맞았다.

### 5. 화면 재생성에도 진행 상태 지키기

게임 플레이 화면은 여러 단계를 거치는 만큼, 화면 회전이나 프로세스 재생성으로 중간에 상태가 날아가면 사용자 경험이 크게 나빠진다. 그래서 이 화면에서만 `SavedStateHandle`로 최소한의 값(`level`, `prevBest`, `hasAutoPlayed`)을 복원한다.

```kotlin
class GamePlayViewModel(
    private val savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private var hasAutoPlayed: Boolean = savedStateHandle["hasAutoPlayed"] ?: false
        set(value) {
            field = value
            savedStateHandle["hasAutoPlayed"] = value
        }
    // ...
}
```

앱 전체에서 `SavedStateHandle`을 쓰는 화면은 이 화면 하나뿐이다. 나머지 화면은 재생성돼도 다시 불러오는 비용이 크지 않아서, 굳이 모든 화면에 이 패턴을 적용하지 않았다.

## 예제

세 요소를 하나로 합치면, 이 화면의 데이터 흐름은 다음과 같다.

```text
UI → onIntent(Intent) → ViewModel → state.update { ... }  → UI가 State 구독해 다시 그림
                                   → effect.send(Effect)   → UI가 1회성으로 소비(화면 이동 등)
```

Compose 쪽에서는 State는 `collectAsStateWithLifecycle()`로, Effect는 `LaunchedEffect`로 각각 다르게 소비한다.

```kotlin
@Composable
fun GamePlayScreen(viewModel: GamePlayViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.effect.collect { effect ->
            when (effect) {
                is GamePlayEffect.NavigateToResult -> { /* 네비게이션 */ }
                is GamePlayEffect.NavigateToLeaderboard -> { /* 네비게이션 */ }
                is GamePlayEffect.ShowError -> { /* 스낵바 등 */ }
            }
        }
    }

    // state를 구독해 카운트다운/녹음 버튼/결과 모달 등을 그린다
}
```

State는 "지금 화면이 어떤 모습인지"를 계속 다시 그리는 데 쓰고, Effect는 "한 번 일어나고 끝나는 일"을 처리하는 데 쓴다 — 이 구분이 게임 플레이 화면처럼 다단계 흐름이 있는 곳에서 특히 유용하다.

## 주의사항

- 앱 안에 서로 다른 아키텍처 패턴이 공존하면, 새로 합류하는 팀원이 "이 화면은 왜 다르게 짜여 있지"라고 헷갈릴 수 있다. 어떤 기준으로 패턴을 나눴는지(이 글에서는 "다단계 흐름 + 일회성 이벤트 여부") 팀 안에 문서로 남겨두는 게 좋다.
- `Channel`은 기본적으로 하나의 구독자만 안전하게 소비하는 걸 전제로 한다. 여러 곳에서 동시에 `collect`하면 이벤트가 한쪽에만 전달될 수 있으므로, 화면(Composable) 하나당 하나의 수집 지점만 두는 걸 지켜야 한다.
- `SavedStateHandle`에 담는 값은 Bundle에 직렬화 가능한 타입이어야 한다. 복잡한 객체를 통째로 넣기보다는, 복원에 꼭 필요한 최소한의 값만 골라 담는 편이 안전하다.

## 참고자료

- [ViewModel의 상태와 이벤트 처리 - Android Developers](https://developer.android.com/topic/architecture/ui-layer)
- [Kotlin Channels - Kotlin 공식 문서](https://kotlinlang.org/docs/channels.html)
