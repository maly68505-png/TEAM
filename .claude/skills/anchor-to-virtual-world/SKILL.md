---
name: anchor-to-virtual-world
description: Hybrid real + AI pipeline for a presenter/anchor (a real filmed person) leaving the studio and entering a virtual world without looking like cheap AI. Keeps the real person's face and performance real, generates only the world and a short hidden transition beat, and integrates them with compositing. Two paths - existing footage, or a planned shoot (with a shooting checklist). Use whenever the user wants a real person to transition into, walk through, or appear inside a generated/virtual environment, or a studio-to-world reveal.
---

# Anchor → Virtual World (المذيع يخرج من الاستوديو لعالم افتراضي)

Reply in Egyptian Arabic; generator prompts in English.
Builds on `cinematic-shot` and obeys `look-style-system`, `scene-continuity`, `historical-accuracy-check`.

## The principle that separates premium from cheap

> **The face stays real. The world is AI. The transformation is short and hidden.**

Cheap AI = the whole clip regenerated, so the anchor's face, mouth and hands drift.
Premium = the real plate is kept for every frame where the anchor is readable; AI makes
(1) the world plate and (2) a 1–2 s transition beat, hidden inside a wipe / match cut / whip.
Compositing (matte, light, grain, camera match) glues them so the eye can't find the seam.

```
[REAL: anchor in studio]  ──wipe/match/whip──▶  [AI beat 1–2s]  ──▶  [REAL anchor matte + AI world plate]
   untouched plate                               hidden transform        composited, camera-matched
```

---

## Stage 0 — Intake (ask every project)

| Question | Decides |
|---|---|
| Footage already shot, or shooting for this? | **Path A** or **Path B** |
| The world: what is it, era, place (real or fictional)? | world cards; facts check if real |
| Colour reference + camera reference video | palette, camera move (no inventing) |
| Does the anchor talk inside the world? (lip-sync needed?) | keep real plate (never regenerate a talking face) |
| Final length + where it airs | number of shots (16:9 default) |

Then write `scene-continuity` cards: **anchor card** (from the footage, exact wardrobe), **studio location card**,
**world location card**, **time card** — the world's key light must be chosen to match the studio key direction
(or the move must motivate the change).

---

## Path A — Footage already exists

### A1. Plate analysis
Extract and inspect frames (`ffmpeg -i plate.mov -vf fps=2 frames/%04d.png`) and report:
- fps, resolution, shutter feel (motion blur), lens estimate, camera: locked / pan / handheld
- key light direction + hard/soft + colour temperature; fill/rim
- background type (green/blue screen, real set, LED wall), edge difficulty (flyaway hair, glasses, motion blur)
- usable transition moments: anchor turning, walking, raising a hand, passing behind something, a camera move

### A2. Pick the transition (never dissolve)

| Transition | When | How it is built |
|---|---|---|
| **Wipe by passing element** | anchor walks / camera trucks | real foreground (pillar, camera, crew, the anchor's own body crossing lens) covers frame → cut → world revealed behind same element |
| **Position match cut** | anchor static or turning | anchor stays on the same spot in frame; studio frame cuts to world frame with identical anchor pose |
| **Action match cut** | anchor does a gesture (snap, swipe, opens a door, touches screen) | cut on the peak of the action; action continues in the world |
| **Whip pan** | energetic piece | real whip out of studio, 720° blur, cut in blur, whip lands in world |
| **Studio deconstruction (AI beat)** | hero moment | start_image = real frame, end_image = same frame with world; 1–2 s AI transform, then cut back to real-matte comp |

### A3. Make the world end frame (keep the anchor identical)
Take the exact real frame at the transition point and edit only the environment:
- Model: `nano_banana_pro` or `seedream_v5_pro` (`is_inpaint` where useful), `image_references` = the real frame.
- Prompt: `Keep the person exactly as in the reference — same face, pose, wardrobe, framing, size and position. Replace only the environment with: [WORLD CARD line]. Key light from [studio key direction], [quality]. [look words]. [palette]. AVOID: [plastic list], changing the person.`
- QC with `cinematic-shot` Stage 3 + compare the face crop side by side with the real frame — any drift = reject.

### A4. World plate (background for the composite)
Generate the world as a **clean plate with no person**, same lens/height/angle as the real camera:
- still: `soul_location` / `cinematic_studio_2_5` (4K) → animate subtle life (haze, particles, lights) with
  `cinematic_studio_video_4_0` / `kling3_0`, camera **locked** or **matching the plate's move** (camera reference).
- For a moving real camera: track the plate (AE 3D Camera Tracker / Mocha / SynthEyes), then either
  (a) project the still world plate onto 3D cards in AE, or (b) generate the world with the same move via
  `seedance_2_5` / `cinematic_studio_video_4_0` omni_reference using the real plate as `video_references`.

### A5. The AI transition beat (only if chosen)
- start_image = real frame, end_image = A3 world frame, 2–4 s, `kling_o3_flf` / `kling4_0` / `seedance_2_5`.
- Motion prompt: `The studio environment transforms into [world]: [how — panels fold away / walls dissolve into particles / light sweeps across]. The person stays perfectly still and unchanged. Camera: [reference move].`
  (Visual transform inside one shot is allowed; the **edit** between shots is never a dissolve.)
- In the edit use only the middle part where the transform happens; cut into real plate before the anchor's face can drift.

### A6. Isolate the real anchor
- Green/blue screen → Keylight + spill suppress + edge refine.
- Real set → `video_background_remover` as a first matte, then refine in AE (Roto Brush 3, Refine Soft Matte on hair).
- Keep hands, hair and motion-blurred edges — garbage matte the body, soft matte the hair.

### A7. Composite integration (this is where "not AI" is earned)
- [ ] **Light match**: world key comes from the same direction as the plate's key; add rim on the anchor in the world's light colour if the world has a strong backlight
- [ ] **Light wrap** 5–15 px from the world onto the anchor edges
- [ ] **Black & white points match** (anchor blacks = world blacks), then `tone_lowkey.cube` over the whole comp
- [ ] **Contact**: shadow / reflection under the feet or on the desk; ambient occlusion where the body meets surfaces
- [ ] **Depth**: world defocus matches the lens (anchor sharp, world falls off); haze layer between anchor and far world
- [ ] **Camera**: same shake/move on both layers; same motion blur (180°)
- [ ] **Grain**: one grain over the final comp (not separate grains per layer)
- [ ] **Edge**: no green fringe, no halo, no chattering matte
- [ ] **Scale & eye line**: horizon of the world at the plate's camera height

---

## Path B — Shooting for this (send this checklist before the shoot)

**Camera**
- 4K, 25 or 30 fps, 180° shutter, log/flat profile, same lens all day; write down focal length, sensor, camera height, tilt
- Locked tripod for comp shots; if moving, use a slider/dolly (repeatable) and place tracking markers off the anchor
- Shoot the **camera reference move** for real — the AI world will copy it
- 3–5 s **clean plate** (empty set) for every setup

**Background**
- Green/blue screen evenly lit (±1/3 stop), anchor ≥ 2 m from it to kill spill. No green/blue wardrobe, no shiny jewelry, controlled flyaway hair
- Or plain dark backdrop + AI matte for low-key looks (less spill, matches the low-key style)

**Light** (decide the world first, then light the anchor for it)
- Key direction and hardness = the world's main light source (from the time card)
- Low-key: one strong key, little fill, a rim/back light in the world's light colour
- Neutral white balance; colours come from the colour reference in post

**Performance**
- At the transition point the anchor **holds the pose 1 s** (clean start frame for AI)
- Plan the match action (turn, step, gesture) and shoot it 3 times at the same speed
- If the anchor walks "into" the world: mark the floor, walk on the spot or on a treadmill-free path parallel to the screen
- Record clean scene sound only (no music); room tone 30 s

**Space for graphics**
- Leave negative space on one side of frame (for `graphics-around-talent` later); keep head room consistent

Then continue with Path A from A1.

---

## QC before delivery
- [ ] The anchor's face/mouth/hands are from the real plate in every readable frame
- [ ] Transitions: wipe / match cut / whip only — no dissolve
- [ ] No plastic look anywhere (world included)
- [ ] Light direction consistent across studio → transition → world
- [ ] Comp checklist A7 all passed
- [ ] Colours only from the colour reference; LUT + finishing stack from `look-style-system`
- [ ] Sound: studio room tone → world ambience + action SFX, no music
- [ ] If the world is a real place/era: `historical-accuracy-check` passed

## Report
```
Path: A/B | Transition: <type> | Shots: n
Anchor card ✓  World card ✓  Time card ✓  Facts ✓/n.a.
World end frame: <job id>  face-match ✓
World plate: <job id>  camera: locked/tracked
AI beat: <job id> (frames used: x–y)
Comp checklist: x/9
SFX: <list>
```
