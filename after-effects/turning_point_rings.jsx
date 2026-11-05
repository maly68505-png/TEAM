/*
 * Turning Point (Noqtet Tahawol) - "Rings & Dot" transition  (built on the real IN / OUT clips)
 * ---------------------------------------------------------------------------------------------
 *  - Lights go down on the theatre, the logo letters dim,
 *    but the logo's own rings + dot stay lit and glow.
 *  - Exactly on the cut, the rings burst outward (spin + expand) from the dot,
 *    the dot flares, and the inside of the rings opens as a spotlight onto the presenter.
 *
 * Needs (next to this script):
 *    assets/logo_rings.png   - the logo's rings, cut out at 3840x2160 (aligned to IN_1.mp4)
 *    assets/logo_dot.png     - the logo's dot, cut out at 3840x2160
 *
 * Run: After Effects > File > Scripts > Run Script File...  then pick IN_1.mp4 and OUT.mp4.
 * Comp length = IN + OUT, cut point unchanged, so it drops straight back into your edit.
 */
(function () {
    var FPS = 25, W = 3840, H = 2160;
    var DOT = [2218, 740];          // centre of the logo dot (measured on IN_1.mp4 @ 4K)
    var PRESENTER = [1920, 1000];   // spotlight lands here (move CTRL_PRESENTER to change)
    var INNER_R = 42;               // radius of the smallest ring (px @ 4K)

    // ---- timing in FRAMES (S0 = the cut is filled in after importing) ----
    var G0 = 1, G1 = 7;             // rings + dot light up
    var L1a = 4, L1b = 8;           // lights bank 1
    var L2a = 10, L2b = 18;         // lights bank 2
    var R1 = 21, ROT1 = -14;        // slow ring rotation before the burst
    var BURST = 24;                 // frames for the rings to fully open
    var TRAVEL = 16;                // frames for the spot to glide onto the presenter
    var SMAX = 7000;                // ring scale % at the end of the burst

    app.beginUndoGroup("Turning Point Rings Transition");
    var proj = app.project || app.newProject();
    var base = File($.fileName).parent;

    function f2t(f) { return f / FPS; }
    function imp(file) { try { return proj.importFile(new ImportOptions(file)); } catch (e) { return null; } }
    function pick(title) { var f = File.openDialog(title); return f ? imp(f) : null; }
    function dims(prop) {
        var t = prop.propertyValueType;
        return t === PropertyValueType.ThreeD ? 3 : (t === PropertyValueType.TwoD ? 2 : 1);
    }
    function setEase(prop, idx, inInf, outInf) {
        var n = dims(prop), a = [], b = [], j;
        for (j = 0; j < n; j++) { a.push(new KeyframeEase(0, inInf)); b.push(new KeyframeEase(0, outInf)); }
        try { prop.setTemporalEaseAtKey(idx, a, b); } catch (e) {}
    }
    function keys(prop, pairs, infl) {     // pairs: [frame, value]
        var i;
        for (i = 0; i < pairs.length; i++) prop.setValueAtTime(f2t(pairs[i][0]), pairs[i][1]);
        if (infl) for (i = 1; i <= prop.numKeys; i++) setEase(prop, i, infl, infl);
    }
    function glow(layer, radius, intensity) {
        try {
            var g = layer.Effects.addProperty("ADBE Glo2");
            try { g.property("Glow Radius").setValue(radius); } catch (e1) {}
            try { g.property("Glow Intensity").setValue(intensity); } catch (e2) {}
        } catch (e) {}
    }
    function warm(layer) {
        try { layer.Effects.addProperty("ADBE Fill").property("Color").setValue([1, 0.9, 0.72]); } catch (e) {}
    }

    // ---------- footage ----------
    var srcIn = pick("Select IN clip (logo)  - IN_1.mp4");
    var srcOut = pick("Select OUT clip (presenter) - OUT.mp4");
    var ringsItem = imp(new File(base.fsName + "/assets/logo_rings.png"));
    var dotItem = imp(new File(base.fsName + "/assets/logo_dot.png"));
    if (!ringsItem || !dotItem) alert("Couldn't find assets/logo_rings.png / logo_dot.png next to the script.\nKeep the 'assets' folder beside the .jsx.");

    var NA = srcIn ? Math.round(srcIn.duration * FPS) : 21;
    var NB = srcOut ? Math.round(srcOut.duration * FPS) : 37;
    var S0 = NA, S1 = S0 + BURST, TR = S0 + TRAVEL, N = NA + NB;

    var comp = proj.items.addComp("TurningPoint_Rings", W, H, 1, N / FPS, FPS);

    // IN (bottom) - frozen on its last frame after the cut so it can live under the spotlight
    var lIn = srcIn ? comp.layers.add(srcIn) : comp.layers.addSolid([0.45, 0.08, 0.08], "IN_PLACEHOLDER", W, H, 1);
    lIn.name = "IN_LOGO";
    if (srcIn) { try { lIn.timeRemapEnabled = true; } catch (e) {} }
    lIn.outPoint = comp.duration;

    // LIGHTS OUT
    var lights = comp.layers.addSolid([0, 0, 0], "LIGHTS_OUT", W, H, 1);
    keys(lights.transform.opacity, [[0, 0], [L1a, 0], [L1b, 45], [L2a, 45], [L2b, 94]], 60);

    // OUT - starts exactly at the cut
    var lOut = srcOut ? comp.layers.add(srcOut) : comp.layers.addSolid([0.12, 0.05, 0.03], "OUT_PLACEHOLDER", W, H, 1);
    lOut.name = "OUT_PRESENTER";
    lOut.startTime = f2t(S0);
    keys(lOut.transform.scale, [[S0, [108, 108]], [N - 1, [100, 100]]], 50);

    // SPOT MATTE - its radius follows the inner ring
    var matte = comp.layers.addSolid([1, 1, 1], "SPOT_MATTE", 200, 200, 1);
    var mk = matte.Masks.addProperty("ADBE Mask Atom");
    var k = 0.5523 * 100, sh = new Shape();
    sh.vertices = [[100, 0], [200, 100], [100, 200], [0, 100]];
    sh.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]];
    sh.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]];
    sh.closed = true;
    mk.property("ADBE Mask Shape").setValue(sh);
    mk.property("ADBE Mask Feather").setValue([70, 70]);
    matte.transform.position.expression = 'thisComp.layer("RINGS").transform.position';
    matte.transform.scale.expression =
        'var s = thisComp.layer("RINGS").transform.scale[0];\n' +
        'var v = time < ' + f2t(S0) + ' ? 0 : s * ' + (INNER_R * 0.85 / 100) + ';\n[v, v]';
    try { lOut.setTrackMatte(matte, TrackMatteType.ALPHA); }
    catch (e) { lOut.trackMatteType = TrackMatteType.ALPHA; }

    // shared position: sits on the logo dot, then glides onto the presenter after the cut
    var POS_EXPR =
        'var d = [' + DOT[0] + ', ' + DOT[1] + '];\n' +
        'var p = thisComp.layer("CTRL_PRESENTER").transform.position;\n' +
        'time < ' + f2t(S0) + ' ? d : ease(time, ' + f2t(S0) + ', ' + f2t(TR) + ', d, p);';

    // RINGS
    var rings = ringsItem ? comp.layers.add(ringsItem) : comp.layers.addSolid([1, 1, 1], "RINGS_MISSING", 10, 10, 1);
    rings.name = "RINGS";
    rings.transform.anchorPoint.setValue(DOT);
    rings.transform.position.expression = POS_EXPR;
    keys(rings.transform.scale, [[S0, [100, 100]], [S1, [SMAX, SMAX]]]);
    setEase(rings.transform.scale, 1, 33, 90);   // slow start ...
    setEase(rings.transform.scale, 2, 10, 33);   // ... accelerating burst
    keys(rings.transform.rotation, [[0, 0], [R1, ROT1], [S1, ROT1 - 40]], 50);
    keys(rings.transform.opacity, [[G0, 0], [G1, 100], [S0 + 4, 100], [S1, 0]], 50);
    warm(rings); glow(rings, 40, 1.4);

    // DOT
    var dot = dotItem ? comp.layers.add(dotItem) : comp.layers.addSolid([1, 1, 1], "DOT_MISSING", 10, 10, 1);
    dot.name = "DOT";
    dot.transform.anchorPoint.setValue(DOT);
    dot.transform.position.expression = POS_EXPR;
    keys(dot.transform.scale, [[G0, [100, 100]], [G1 - 1, [135, 135]], [G1 + 4, [100, 100]],
                               [S0, [100, 100]], [S0 + 6, [250, 250]]], 60);
    keys(dot.transform.opacity, [[G0, 0], [G1, 100], [S0, 100], [S0 + 6, 0]], 50);
    warm(dot); glow(dot, 80, 2);

    // CONTROL
    var nP = comp.layers.addNull(); nP.name = "CTRL_PRESENTER"; nP.transform.position.setValue(PRESENTER); nP.label = 9;

    var marks = [
        [G0, "SFX: soft shimmer - rings light up"],
        [L1a, "SFX: theatre light clunk #1"],
        [L2a, "SFX: light clunk #2 + hush"],
        [S0, "CUT - SFX: whoosh / ring burst"],
        [TR, "SFX: soft hit -> silence"]
    ];
    for (var i = 0; i < marks.length; i++) comp.markerProperty.setValueAtTime(f2t(marks[i][0]), new MarkerValue(marks[i][1]));

    comp.openInViewer();
    app.endUndoGroup();
})();
