---
name: cinematic-shot
description: Professional pipeline for producing ONE cinematic AI video shot with no physical distortion and no plastic AI look — brief → shot spec → hero still → still QC → animate (start/end frame) → motion QC → finish. Use whenever the user asks for a cinematic scene, shot, film-look clip, or any AI video that must look premium and not "cheap AI". Base skill that every other video skill in this repo builds on; it enforces look-style-system, scene-continuity and historical-accuracy-check.
---

# Cinematic Shot Pipeline (المشهد السينمائي الواحد)

> القاعدة الذهبية: **ممنوع نولّد فيديو من نص مباشرة.** كل لقطة تبدأ بصورة "هيرو" متراجعة ومعتمدة،
> وبعدين نحركها. ده اللي بيمنع التشوه ويقلل المحاولات.

Reply to the user in Egyptian Arabic; write generator prompts in English.

**This skill obeys the user's rule skills — read them first, they win on any conflict:**
- `look-style-system` — look (Depth/Edge/Grade/Detail), colours only from the project colour reference,
  no dissolves, **no plastic AI look (top priority)**, camera move copied from the user's reference video, no music.
- `scene-continuity` — character / location / time cards, no duplicate characters, fixed light direction.
- `historical-accuracy-check` — any real place, person, event, map, flag, uniform or date is verified first.

---

## Stage 0 — Project intake (every new project; inputs change each time)

Fixed default: **16:9**, 25 or 30 fps. Everything else is asked per project — never carried over:

| Input | Needed for |
|---|---|
| Story beat (1 sentence per shot) | the shot spec |
| **Colour reference** (image/frame) | palette — no colours in prompts or grade until it arrives |
| **Camera reference video** | camera move — never invent a move |
| Subject: real footage / generated character / product | which path / model |
| Any real places, people, events, eras | triggers `historical-accuracy-check` |

Ask for what is missing in one message. One shot = one action.

## Stage 1 — Cards + Shot Spec (contract for the shot, approve before generating)

1. Fill / reuse the `scene-continuity` cards (character, location, time).
2. Break down the camera reference video: move type, direction, speed & easing, start/end framing, lens feel, duration.
3. Write the spec:

```
SHOT ID:        S01
BEAT:           <one action, one subject>
CARDS:          <character card(s)> + <location card> + <time card>
FRAMING:        <ECU / CU / MCU / MS / WS>
LENS:           <e.g. 35mm / 50mm / 85mm, from the camera reference>
CAMERA MOVE:    <copied from the camera reference: type, direction, speed, easing>
SUBJECT ACTION: <one verb, physically plausible, with start pose and end pose>
LIGHT:          <from the time card: source, direction, hard/soft>  — low-key, 55–70% of frame dark
DEPTH:          <dark OOF foreground / sharp subject / glowing soft background + thin haze>
PALETTE:        <extracted from the colour reference only>
TRANSITION IN:  <match cut (shape/motion/action/position) | wipe by passing element | whip pan> — never dissolve
TRANSITION OUT: <same options; describe the exact last frame so the next shot can match it>
START FRAME:    <first frame>
END FRAME:      <last frame — required when TRANSITION OUT depends on it>
SFX:            <ambience bed + action sounds with timing — no music>
NEGATIVES:      <what must NOT happen>
```

## Stage 2 — Hero still (the start frame)

| Need | Model (Higgsfield id) |
|---|---|
| Cinematic film still, dramatic low-key light | `cinematic_studio_2_5` (4K) or `soul_cinematic` |
| Keep a real person's face / product exact (edit from reference) | `nano_banana_pro` or `seedream_v5_pro` with `image_references` |
| Environment / location plate only | `soul_location` |
| Recurring character identity | Soul ID / `soul_cast` + same reference image every shot |

Still prompt order (subject first, camera last):

```
[CHARACTER CARD prompt line, word for word], [start pose], 
[LOCATION CARD prompt line], [TIME CARD prompt line],
[look words from STYLE-SYSTEM.md §6], [palette from colour reference],
real skin pores, fine hair, fibres, dust, natural imperfection, macro texture detail,
[LENS], [FRAMING], 4K
AVOID: CGI, 3D render, plastic, waxy skin, airbrushed, over-smoothed, glossy, doll-like, uncanny,
chromatic aberration, oversharpening, duplicate people, garbled text
```

Generate 2–4 variants in one call (`count`). Max 2 rounds — if round 2 fails, the **spec** is wrong:
fix the spec, not the seed.

## Stage 3 — Still QC (gate — do not animate until it passes)

- [ ] **No plastic look** — real texture, nothing waxy/over-smooth/drawn (fail = regenerate, never patch)
- [ ] Hands: 5 fingers, natural joints, nothing fused to props
- [ ] Face/identity matches the character card; **no character appears twice**
- [ ] Text/maps/signs readable and correct, or absent (add text in the edit instead)
- [ ] Perspective: horizon level, verticals straight, scale correct
- [ ] Light direction matches the time card; shadows/reflections consistent
- [ ] Contact: feet on floor, hands touch what they hold, nothing floating
- [ ] 3 depth layers, low-key (55–70% dark), clear vignette, no chromatic aberration
- [ ] Colours only from the colour reference
- [ ] Period details verified (if historical)
- [ ] Composition leaves room for the reference camera move

Fix small failures with an instruction edit (`nano_banana_pro` / `seedream_v5_pro`); plastic look = regenerate.

## Stage 4 — Animate

| Situation | Model | Why |
|---|---|---|
| Premium cinematic hero shot | `cinematic_studio_video_4_0` or `cinematic_studio_3_0` | Best camera language |
| Exact start AND end frame (reveals, transformations, match-cut landings) | `kling_o3_flf`, `kling3_0`, `kling4_0`, `seedance_2_5`, `minimax_h3` | start_image + end_image |
| Realistic human motion / faces / emotion | `kling3_0` (pro), `minimax_hailuo` | Strong physics |
| Copy camera motion from the user's reference video | `seedance_2_5` / `cinematic_studio_video_4_0` omni_reference with `video_references`; `kling4_0` reference-to-video | Motion from reference |
| Extend a clip that already works | `seedance_2_5` `video_extension` | Continuity |

Motion prompt — **only motion**; the still already holds the look:

```
Camera: [move from the reference: type, direction, speed, easing].
Subject: [one action from start pose to end pose] over the full duration.
Physics: [weight, cloth, hair, dust/haze behaving naturally].
Keep identity, wardrobe, lighting direction and background rigid and consistent; no morphing; no extra or duplicate people.
Sound: scene sound effects only, no music.
```

Pace & morph rules (learned from client feedback — slow AI motion and visible morphs read as "AI"):
- **Generate slow, cut fast.** Generate 3–5 s for stability, then in the edit use only the best 0.8–2 s, speed-ramp (1.5–3×), and add 180°/360° motion blur in post. Never show a full 5 s generated move at native speed.
- **A morph must never be seen happening.** Max 0.4–0.6 s, hidden inside fast motion (whip, crash push-in, speed ramp peak), an occluder (hand, page, dust, door) or a flash/darkness. If the viewer can watch the change, it is a cheap morph — replace it with a hard scale/shape match cut.
- **Prefer hard match cuts over morphs.** Two real-looking shots matched in shape, angle and light, cut on motion, beat any visible transformation.
- **Energy comes from the cut.** Cut on action, on the sound accent, and on the peak of camera speed — not at rest.

Rules that kill distortion:
1. One camera move + one subject action per shot.
2. Slow > fast. Speed and whip energy are made in the edit (720° blur whip), not by the model.
3. Use an end frame whenever the transition out depends on the last frame.
4. 4–8 s per shot; longer stories = more shots joined by match cuts / wipes.
5. Never re-describe the scene in the motion prompt — contradiction with the still causes morphing.
6. Audio: prefer `generate_audio` / `sound` **off** and build SFX separately; if native audio is used, reject any clip with music.
7. Preflight with `get_cost: true`; draft at 480p/720p first where supported (`seedance_2_5` `draft: true`), finalize only the approved take.

## Stage 5 — Motion QC

- [ ] No plastic look appearing during motion (skin smoothing, waxy shine)
- [ ] No identity drift first → last second; no duplicate characters
- [ ] No limb/finger morphing
- [ ] Background rigid — walls don't breathe, lines don't bend, props don't move
- [ ] Object permanence
- [ ] Camera move matches the reference video
- [ ] Motion has weight (no sliding feet)
- [ ] Last frame matches the planned TRANSITION OUT
- [ ] No music in the audio

FAIL → change ONE variable (shorter, slower, add end frame, other model) and retry once. Log what changed.

## Stage 6 — Finish

Follow the finishing stack in `look-style-system` exactly (clean-up → `tone_lowkey.cube` → project colours →
haze → bloom → vignette → unsharp on focus → fine grain → text). Before it:
1. `video_deflicker` if there is shimmer.
2. Upscale: `bytedance_video_upscale` (preset `aigc`, `model_version: pro`) or `topaz_video` 2160p.
   No denoise / skin smoothing in any upscaler setting.
3. Master ProRes 422 HQ; social H.264/H.265 20+ Mbps.

## Report per shot

```
S01 — <beat>
Spec ✓ | Cards ✓ | Facts ✓/n.a.
Still: <job id>  QC x/11
Video: <job id> model=<id> <s>s  QC x/9
Transition in/out: <type>
SFX: <list>
Finish: <upscale job id>
Retries: <n> (what changed)
```
