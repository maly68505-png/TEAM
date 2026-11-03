---
name: cinematic-shot
description: Professional pipeline for producing ONE cinematic AI video shot with no physical distortion — brief → shot spec → hero still → still QC → animate (start/end frame) → motion QC → finish. Use whenever the user asks for a cinematic scene, shot, film-look clip, or any AI video that must look premium and not "cheap AI". This is the base skill every other video skill in this repo builds on.
---

# Cinematic Shot Pipeline (المشهد السينمائي الواحد)

> القاعدة الذهبية: **ممنوع نولّد فيديو من نص مباشرة.** كل لقطة تبدأ بصورة "هيرو" متراجعة ومعتمدة،
> وبعدين نحركها. ده اللي بيمنع التشوه ويقلل المحاولات من 10 لـ 2.

Golden rule: **never text-to-video for a final shot.** Lock the look as a still first,
QC it, then animate it. Stills are cheap and controllable; video retries are expensive.

---

## Stage 0 — Brief (ask only what is missing)

Collect, in one message, only what the user has not already given:

| Field | Example |
|---|---|
| Story beat (what happens, 1 sentence) | "Anchor turns from desk, studio wall dissolves into a neon city" |
| Duration | 5 s (default). Keep single shots 4–8 s; longer = more drift |
| Aspect | 16:9 / 9:16 / 21:9 |
| Subject | real person footage? generated character? product? |
| Mood / genre | noir, epic, documentary, sci-fi news |
| Reference | any image/video/frame the user likes |

Never start generating with an unclear beat. One shot = one action.

## Stage 1 — Shot Spec (write it before any prompt)

Fill this block and show it to the user for approval. It is the contract for the shot.

```
SHOT ID:        S01
BEAT:           <one action, one subject>
FRAMING:        <ECU / CU / MCU / MS / WS / EWS>
LENS:           <24mm wide | 35mm | 50mm | 85mm portrait | 135mm tele>
CAMERA MOVE:    <ONE move: static | slow dolly-in | dolly-out | truck left | crane up | orbit 30° | handheld subtle>
SPEED:          <slow | medium>   (default slow — fast moves warp)
SUBJECT ACTION: <one verb, physically plausible, with start & end pose>
LIGHT:          <key direction + quality + color temp, e.g. "soft key camera-left 45°, 3200K, cool rim from behind">
ATMOSPHERE:     <haze / dust / rain / none>
PALETTE:        <2–3 colors>
START FRAME:    <what the very first frame shows>
END FRAME:      <what the very last frame shows>  (optional but strongly recommended)
NEGATIVES:      <what must NOT happen>
```

## Stage 2 — Hero still (the start frame)

Generate the start frame as an image. Model routing:

| Need | Model (Higgsfield id) |
|---|---|
| Cinematic film still, dramatic light | `cinematic_studio_2_5` (up to 4K) or `soul_cinematic` |
| Must keep a real person's face / product exact (edit from reference) | `nano_banana_pro` or `seedream_v5_pro` with `image_references` |
| Environment / location plate only | `soul_location` |
| Consistent recurring character | `soul_cast` / Soul ID |

Still prompt template (order matters — subject first, camera last):

```
[SUBJECT + pose], [ACTION frozen at start], [WARDROBE/DETAIL],
[ENVIRONMENT], [LIGHT: direction, quality, temperature], [ATMOSPHERE],
shot on [LENS] , [FRAMING], [DEPTH OF FIELD], [FILM LOOK: e.g. "Kodak 5219 grain, anamorphic flare"],
photorealistic, natural skin texture, correct anatomy
```

Generate 2–4 variants in one call (`count`), pick the best, never "prompt-roulette" more than 2 rounds —
if round 2 fails, the **spec** is wrong, fix the spec, not the seed.

## Stage 3 — Still QC (gate — do not animate until it passes)

Check the chosen still and report PASS/FAIL per line:

- [ ] Hands: 5 fingers, natural joints, nothing fused to props
- [ ] Face: symmetric eyes, teeth normal, identity matches reference
- [ ] Text/logos: readable or absent (no gibberish signage)
- [ ] Perspective: horizon level, vertical lines straight, objects to scale
- [ ] Light logic: shadows match key direction; reflections match environment
- [ ] Contact: feet on floor, hands actually touch what they hold, no floating objects
- [ ] Composition leaves room for the planned camera move (e.g. space ahead for dolly-in)

Fix failures with an edit pass (`nano_banana_pro` / `seedream_v5_pro` instruction edit) instead of regenerating from zero.

## Stage 4 — Animate

Model routing for image-to-video:

| Situation | Model | Why |
|---|---|---|
| Premium cinematic hero shot | `cinematic_studio_video_4_0` (omni/start frame) or `cinematic_studio_3_0` | Best camera language & color |
| Need exact start AND end frame (transformations, reveals) | `kling_o3_flf`, `kling3_0`, `seedance_2_5`, `minimax_h3` | Supports start_image + end_image |
| Realistic human motion / faces / emotion | `kling3_0` (mode pro), `minimax_hailuo` | Strong physics |
| Keep identity across many references | `seedance_2_5` omni_reference, `kling_o3_image_reference` | Multi-reference |
| Extend a clip that already works | `seedance_2_5` mode `video_extension` | Continuity |

Motion prompt template — describe **only motion**, the still already holds the look:

```
Camera: [ONE move] [speed], [lens feel].
Subject: [one action from start pose to end pose], [timing: "over the full duration"].
Physics: [weight, cloth, hair, particles behaving naturally — e.g. "coat sways with momentum, dust drifts slowly"].
Keep: identity, wardrobe, lighting and background consistent; no morphing; no extra people.
```

Rules that kill distortion:
1. **One camera move + one subject action per shot.** Two simultaneous complex motions = warping.
2. **Slow > fast.** Speed comes later in the edit (speed ramp / frame cut), not from the model.
3. **Use an end frame** for any transformation or reveal — it forces the model to land correctly.
4. **Short durations** (5 s). Need 15 s? Make 3 shots and cut — that's how real films work.
5. Do not re-describe the scene in the motion prompt; contradictions with the still cause morphing.
6. Preflight cost with `get_cost: true` before 1080p/4K; draft at 480p/720p first when the model supports it (`seedance_2_5` `draft: true`).

## Stage 5 — Motion QC

Watch the full clip (use `video_analysis_create` when available) and check:

- [ ] No face/identity drift between first and last second
- [ ] No limb/finger morphing during movement
- [ ] Background stays rigid (walls don't breathe, lines don't bend)
- [ ] Object permanence: things don't appear/vanish
- [ ] Camera move matches spec, no unintended zoom/jitter
- [ ] Motion has weight (no floating/sliding feet)

FAIL → change ONE variable (shorter duration, slower move, add end frame, switch model) and retry once.
Log what changed.

## Stage 6 — Finish

1. `video_deflicker` if there is shimmer.
2. Upscale: `bytedance_video_upscale` (preset `aigc`, model_version `pro`) or `topaz_video` to 2160p.
3. Optional HDR: `topaz_hyperion_2_5`.
4. Grade & grain in the NLE (DaVinci/Premiere/AE): unify all shots with one LUT + subtle grain —
   shared grain and grade is what makes AI shots read as "filmed", not "generated".

## Output to the user (every shot)

```
S01 — <beat>
Spec: approved ✓
Still: <job id>  QC: 7/7
Video: <job id> model=<id> duration=<s>  QC: 6/6
Finish: <upscale job id>
Retries: <n> (what changed)
```
