---
title: 발음 오류를 문장 위에 그리기 — Canvas와 getBoundingBox로 좌표 맞추기
description: Compose Canvas와 TextLayoutResult.getBoundingBox로 발음 오류를 문장 위에 화살표·곡선으로 그린 방법과, 이 렌더링이 서버 평가 없이는 완결되지 않는 이유를 정리한다.
date: 2026-08-22
updated: 2026-08-22
category: development
technology: [android, kotlin]
tags: [canvas, ui-rendering]
type: study
status: evergreen
series:
  name: shadoweng-deep-dive
  order: 3
projects:
  - shadoweng
draft: false
---

## 한 줄 요약

Compose `Canvas`와 `TextLayoutResult.getBoundingBox`로 발음 평가 결과(dragged/rushed/missed)를 문장 위에 화살표·곡선·하이라이트로 그린 방법을 정리하고, 이 렌더링이 실제로는 서버 쪽 평가 스텁 때문에 끝까지 이어지지 않는다는 한계도 함께 짚는다.

## 왜 (배경/문제 상황)

발음 평가 결과를 "72점"처럼 숫자로만 보여주면 사용자는 정확히 어디를 고쳐야 하는지 알기 어렵다. ShadowEng은 이 문제를 "단어별로 무엇이 잘못됐는지 문장 위에 직접 그려서 보여주기"로 풀었다. 그런데 Compose `Text`는 글자 하나하나가 화면 어디에 그려졌는지를 호출부에 그냥 알려주지 않는다 — 이 좌표를 직접 구해야 그 위에 화살표나 곡선을 겹쳐 그릴 수 있다.

## 본문

### 1. 평가 결과 → 시각 요소 매핑

`EvaluationAnnotationMapper.kt`가 서버가 내려주는 단어별 상태를 시각 요소 타입으로 변환한다.

| 상태 | 시각 요소 | 표현 |
|---|---|---|
| dragged (길게 끌었다) | `CURVE_LONG` | 완만한 물결 곡선 |
| rushed (급하게 지나갔다) | `CURVE_SHORT` | 짧은 V자 곡선 |
| missed (아예 빠졌다) | `HIGHLIGHT` | 배경 하이라이트 |
| good (문제 없음) | 없음 | 표시하지 않음 |

곡선·화살표(`CURVE_LONG`/`CURVE_SHORT`/`ARROW_UP`/`ARROW_DOWN`)는 `Canvas`에 `Path`로 직접 그리고, `HIGHLIGHT`는 Canvas가 아니라 `SpanStyle`의 배경색으로 처리한다. 같은 "표시"라도 구현 계층이 다르기 때문이다 — 하이라이트는 텍스트 배경일 뿐이라 `Text`의 표준 스타일링 기능으로 충분하지만, 곡선·화살표는 문장 흐름 위에 임의의 곡선을 그려야 해서 텍스트 API로는 표현할 수 없고 별도 캔버스가 필요하다.

### 2. Text는 글자 좌표를 모른다 — TextLayoutResult가 다리를 놓는다

`Text` composable은 "무엇을 그릴지"는 알지만, 그 결과가 화면 어디에 그려졌는지는 기본적으로 호출부에 넘겨주지 않는다. `onTextLayout` 콜백으로 받는 `TextLayoutResult`가 이 간극을 메운다.

```kotlin
var layoutResult by remember { mutableStateOf<TextLayoutResult?>(null) }

Text(
    text = sentence,
    onTextLayout = { layoutResult = it },
)
```

`TextLayoutResult.getBoundingBox(charIndex)`를 부르면 그 문자 인덱스가 화면 좌표계에서 차지하는 사각형(`Rect`)을 돌려준다. 어노테이션의 시작 글자와 끝 글자 각각에 이 함수를 불러 두 사각형을 얻으면, 그 사이에 곡선이나 화살표를 그릴 좌표 기준이 생긴다.

```kotlin
val startRect = layoutResult.getBoundingBox(annotation.startIndex)
val endRect = layoutResult.getBoundingBox(annotation.endIndex - 1)
val mid = (startRect.top + startRect.bottom) / 2
val centerX = (startRect.left + endRect.right) / 2
```

### 3. 그 위에 Canvas로 겹쳐 그리기

`Text` 위에 같은 크기의 `Canvas`를 겹쳐두고, 위에서 구한 좌표로 `Path`를 그린다.

```kotlin
Box {
    Text(text = sentence, onTextLayout = { layoutResult = it })
    Canvas(modifier = Modifier.matchParentSize()) {
        annotations.forEach { ann ->
            val startRect = layoutResult?.getBoundingBox(ann.startIndex) ?: return@forEach
            val endRect = layoutResult?.getBoundingBox(ann.endIndex - 1) ?: return@forEach
            when (ann.type) {
                AnnotationType.CURVE_LONG -> drawLongCurve(startRect, endRect)
                AnnotationType.CURVE_SHORT -> drawShortCurve(startRect, endRect)
                else -> Unit
            }
        }
    }
}
```

`Canvas`는 `Text`가 실제로 어떤 글자를 그렸는지 전혀 모른다 — `TextLayoutResult`가 넘겨주는 좌표만 갖고 그 위에 도형을 그릴 뿐이다. 이 둘을 잇는 다리가 `getBoundingBox(charIndex)`다.

### 4. 직접 눌러보기 — 좌표를 구하는 과정 그대로 재현

아래 데모는 위 2·3번 과정을 그대로 애니메이션으로 옮긴 것이다. 어노테이션을 고르고 재생하면, `getBoundingBox(startIndex)`와 `getBoundingBox(endIndex-1)`로 두 사각형을 구하고 → 중점(`mid`)과 중심 X좌표(`centerX`)를 계산하고 → 그 좌표로 `Path`를 그리는 순서가 로그에 그대로 찍힌다.

<div class="cvdemo">
<style>
.cvdemo {
  --ink: #1c1917; --sub: #6b7280; --line: #e5e7eb; --card: #fafafa; --card2: #f4f4f5;
  --accent: #466b8f; --log-bg: #0f1633; --log-ink: #9fb0e8;
  font-family: 'Pretendard', system-ui, sans-serif;
  font-size: 14px; line-height: 1.6; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; padding: 20px;
  background: var(--card); margin: 24px 0;
}
.dark .cvdemo { --ink: #e5e7eb; --sub: #9ca3af; --line: #374151; --card: #18181b; --card2: #27272a; --accent: #8fadc7; }
.cvdemo .seg { display: inline-flex; background: var(--card2); border-radius: 10px; padding: 4px; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
.cvdemo .seg button { border: none; background: transparent; padding: 8px 14px; border-radius: 7px; font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; color: var(--sub); }
.cvdemo .seg button.on { background: var(--card); color: var(--accent); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.cvdemo .canvas-host { background: var(--card2); border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
.cvdemo canvas { display: block; width: 100%; height: 160px; }
.cvdemo .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.cvdemo .run-btn { background: var(--ink); color: var(--card); border: 0; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.cvdemo .log {
  font-family: 'Fira Code', ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px; background: var(--log-bg); color: var(--log-ink);
  border-radius: 10px; padding: 12px 14px; line-height: 1.75; min-height: 90px; white-space: pre-wrap;
}
.cvdemo .log b { color: #fff; }
</style>

<div class="seg" id="cv_seg">
  <button data-ann="curve" class="on">∿ dragged → CURVE_LONG</button>
  <button data-ann="v">∨ rushed → CURVE_SHORT</button>
  <button data-ann="hl">▮ missed → HIGHLIGHT</button>
</div>

<div class="canvas-host"><canvas id="cv_canvas"></canvas></div>

<div class="toolbar"><button class="run-btn" id="cv_run">▶ 좌표 구하기부터 다시 재생</button></div>

<div class="log" id="cv_log">// 재생하면 getBoundingBox 호출 순서가 여기 표시됩니다</div>
</div>

<script>
(function () {
  const root = document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('cvdemo')) return;
  const SENTENCE = 'She really loves singing in the rain.';
  const ANN = {
    curve: { word: 'really', color: '#8e5bff', label: 'CURVE_LONG (dragged)' },
    v: { word: 'rain', color: '#3a86ff', label: 'CURVE_SHORT (rushed)' },
    hl: { word: 'loves', color: '#fedf57', label: 'HIGHLIGHT (missed)' },
  };
  let current = 'curve';
  const canvas = root.querySelector('#cv_canvas');
  const ctx = canvas.getContext('2d');
  const logEl = root.querySelector('#cv_log');
  const isDark = () => document.documentElement.classList.contains('dark');

  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }
  function layoutText(text, fontPx, x0, y0, maxW) {
    ctx.font = fontPx + "px Pretendard, system-ui";
    ctx.textBaseline = 'alphabetic';
    const spaceW = ctx.measureText(' ').width;
    let x = x0, y = y0;
    const boxes = [];
    text.split(' ').forEach((word, wi, arr) => {
      const wordW = ctx.measureText(word).width;
      if (x + wordW > x0 + maxW && x !== x0) { x = x0; y += fontPx * 1.6; }
      let cx = x;
      for (const ch of word) {
        const chW = ctx.measureText(ch).width;
        boxes.push({ left: cx, right: cx + chW, top: y - fontPx * 0.85, bottom: y + fontPx * 0.18, ch });
        cx += chW;
      }
      if (wi !== arr.length - 1) { boxes.push({ left: cx, right: cx + spaceW, top: y - fontPx * 0.85, bottom: y + fontPx * 0.18, ch: ' ' }); x = cx + spaceW; }
      else x = cx;
    });
    return boxes;
  }
  function log(t) { logEl.innerHTML += (logEl.dataset.started ? '\n' : ''); logEl.dataset.started = '1'; logEl.innerHTML += t; }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function drawText(boxes, dark) {
    ctx.font = '20px Pretendard, system-ui';
    ctx.fillStyle = dark ? '#e5e7eb' : '#1c1917';
    boxes.forEach((b) => ctx.fillText(b.ch, b.left, b.bottom - 4));
  }
  function strokeRect(b, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.strokeRect(b.left - 1, b.top - 1, b.right - b.left + 2, b.bottom - b.top + 2);
    ctx.restore();
  }
  function indexOfWord(sentence, word) {
    const re = new RegExp('\\b' + word + '\\b');
    const m = re.exec(sentence);
    return m ? m.index : sentence.indexOf(word);
  }

  let runId = 0;
  async function play() {
    const my = ++runId;
    logEl.innerHTML = ''; logEl.dataset.started = '';
    const dark = isDark();
    const { w } = fit();
    ctx.clearRect(0, 0, w, 160);
    ctx.fillStyle = dark ? '#27272a' : '#f4f4f5'; ctx.fillRect(0, 0, w, 160);
    const boxes = layoutText(SENTENCE, 20, 20, 60, w - 40);
    drawText(boxes, dark);
    const ann = ANN[current];
    const startIndex = indexOfWord(SENTENCE, ann.word);
    const endIndex = startIndex + ann.word.length;
    log(`sentence.indexOf("${ann.word}") = ${startIndex}`);
    await wait(500); if (my !== runId) return;

    log(`startRect = layout.getBoundingBox(${startIndex})`);
    const startRect = boxes[startIndex];
    ctx.clearRect(0, 0, w, 160); ctx.fillStyle = dark ? '#27272a' : '#f4f4f5'; ctx.fillRect(0, 0, w, 160);
    drawText(boxes, dark); strokeRect(startRect, '#e53935');
    await wait(500); if (my !== runId) return;

    log(`endRect = layout.getBoundingBox(${endIndex - 1})`);
    const endRect = boxes[endIndex - 1];
    ctx.clearRect(0, 0, w, 160); ctx.fillStyle = dark ? '#27272a' : '#f4f4f5'; ctx.fillRect(0, 0, w, 160);
    drawText(boxes, dark); strokeRect(startRect, '#e53935'); strokeRect(endRect, '#3a86ff');
    await wait(500); if (my !== runId) return;

    const mid = (startRect.top + startRect.bottom) / 2;
    const centerX = (startRect.left + endRect.right) / 2;
    log(`mid = ${mid.toFixed(1)}, centerX = ${centerX.toFixed(1)}`);
    await wait(400); if (my !== runId) return;

    log(`<b>${ann.label}</b> Path 그리기 → 문장 위에 겹쳐 렌더`);
    ctx.clearRect(0, 0, w, 160); ctx.fillStyle = dark ? '#27272a' : '#f4f4f5'; ctx.fillRect(0, 0, w, 160);
    if (current === 'hl') {
      ctx.fillStyle = ann.color + '55';
      ctx.fillRect(startRect.left, startRect.top, endRect.right - startRect.left, startRect.bottom - startRect.top);
    }
    drawText(boxes, dark);
    if (current !== 'hl') {
      ctx.save(); ctx.strokeStyle = ann.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      const amp = current === 'curve' ? 7 : 5;
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = startRect.left + (endRect.right - startRect.left) * t;
        const y = mid + Math.sin(t * Math.PI * (current === 'curve' ? 2 : 1)) * amp;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.restore();
    }
  }

  root.querySelectorAll('#cv_seg button').forEach((b) => {
    b.addEventListener('click', () => {
      current = b.dataset.ann;
      root.querySelectorAll('#cv_seg button').forEach((x) => x.classList.toggle('on', x === b));
      play();
    });
  });
  root.querySelector('#cv_run').addEventListener('click', play);
  window.addEventListener('resize', () => play());
  play();
})();
</script>

### 5. 결함: 같은 단어가 두 번 나오면

어노테이션의 시작 위치는 `sentence.indexOf(word)`로 찾는데, 이 함수는 문장에서 **첫 번째로 일치하는 위치**만 돌려준다. 같은 단어가 문장에 두 번 이상 나오면, 서버가 두 번째 등장 위치를 가리켰더라도 화면에는 첫 번째 등장 위치에 곡선이 그려진다. Canvas 렌더링 로직 자체는 좌표만 정확하면 문제없이 동작하지만, 그 좌표를 찾는 단계에서 이미 잘못된 인덱스를 넘겨받으면 엉뚱한 곳에 그려진다 — 렌더링과 좌표 탐색은 별개 문제라는 걸 보여주는 사례다.

## 예제

세 요소를 하나로 합치면, 어노테이션 하나를 그리는 전체 흐름은 다음과 같다.

```kotlin
@Composable
fun AnnotatedSentenceView(sentence: String, annotations: List<Annotation>) {
    var layoutResult by remember { mutableStateOf<TextLayoutResult?>(null) }

    Box {
        Text(text = sentence, onTextLayout = { layoutResult = it })

        Canvas(modifier = Modifier.matchParentSize()) {
            val layout = layoutResult ?: return@Canvas
            annotations.forEach { ann ->
                val startRect = layout.getBoundingBox(ann.startIndex)
                val endRect = layout.getBoundingBox(ann.endIndex - 1)
                val mid = (startRect.top + startRect.bottom) / 2

                when (ann.type) {
                    AnnotationType.CURVE_LONG -> drawPath(
                        path = buildWaveCurve(startRect.left, endRect.right, mid, amplitude = 6f),
                        color = Color(0xFFFFB800),
                        style = Stroke(width = 3f),
                    )
                    AnnotationType.CURVE_SHORT -> drawPath(
                        path = buildVCurve(startRect.left, endRect.right, mid),
                        color = Color(0xFF1565C0),
                        style = Stroke(width = 3f),
                    )
                    else -> Unit // HIGHLIGHT는 Canvas가 아니라 SpanStyle에서 처리
                }
            }
        }
    }
}
```

## 주의사항

- 이 Canvas 시각화는 클라이언트 쪽에서는 완성돼 있지만, 이 스냅샷 기준으로 서버의 발음 평가 로직은 점수가 하드코딩된 스텁이었다(`EvaluationService.kt` — `// TODO: AI 분석 연동 시 실제 점수로 교체`). "화면에 정확히 그려지는가"와 "그 평가 결과 자체가 진짜인가"는 별개 문제이고, 이 글은 전자만 다룬다.
- `sentence.indexOf(word)`는 첫 번째 일치 위치만 찾으므로, 같은 단어가 문장에 반복되면 좌표가 어긋날 수 있다. 정확히 하려면 서버가 인덱스를 함께 내려주거나, 이전에 이미 매칭된 위치 이후부터 다시 탐색해야 한다.
- 하이라이트(`SpanStyle`)와 곡선·화살표(`Canvas`)는 같은 "시각 요소"로 뭉뚱그리기 쉽지만 구현 계층이 다르다. 텍스트 스타일링으로 충분한 것까지 Canvas로 옮기면 코드만 복잡해진다.
- `getBoundingBox`는 `TextLayoutResult`가 아직 준비되지 않은 첫 프레임에는 null일 수 있으므로, 항상 null 체크 후 사용해야 한다.

## 참고자료

- [Text layout - Jetpack Compose 공식 문서](https://developer.android.com/develop/ui/compose/text)
- [Canvas graphics - Jetpack Compose 공식 문서](https://developer.android.com/develop/ui/compose/graphics/draw/overview)
