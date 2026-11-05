/*
 * Turning Point (Noqtet Tahawol) - "Lights Down + Spotlight" transition
 * --------------------------------------------------------------------
 * Builds a ready-to-edit After Effects composition:
 *   1. Logo shot holds, slow push-in, the "dot" pulses.
 *   2. House lights go down in two stages (theatre switch feel).
 *   3. The dot becomes a spotlight that opens and travels onto the presenter.
 *
 * How to run:  After Effects > File > Scripts > Run Script File...
 * You'll be asked to pick Shot 1 (logo) and Shot 2 (presenter).
 * Cancel either dialog to get a placeholder you can replace later
 * (select placeholder layer, Alt/Option-drag footage onto it).
 *
 * Tweak positions by moving the nulls CTRL_DOT and CTRL_PRESENTER.
 */
(function () {
    var FPS = 25, W = 1920, H = 1080, DUR = 7;
    var DOT = [1120, 395];        // center of the small inner dot of the logo (measured from render)
    var PRESENTER = [960, 520];   // where the spotlight lands

    // --- timing (seconds) ---
    var T_PULSE = 1.4;            // dot pulse
    var T_LIGHTS1 = 2.0;          // first light bank off
    var T_LIGHTS2 = 2.48;         // second light bank off
    var T_SPOT = 3.0;             // spotlight starts opening
    var T_SPOT_END = 4.4;         // spotlight fully open
    var T_TRAVEL_END = 4.2;       // spotlight arrives at presenter

    app.beginUndoGroup("Turning Point Transition");

    var proj = app.project || app.newProject();
    var comp = proj.items.addComp("TurningPoint_Transition", W, H, 1, DUR, FPS);

    // ---------- helpers ----------
    function importFootage(title) {
        var f = File.openDialog(title);
        if (!f) return null;
        try { return proj.importFile(new ImportOptions(f)); } catch (e) { alert("Couldn't import: " + f.name); return null; }
    }
    function easeDims(prop) {
        var t = prop.propertyValueType;
        if (t === PropertyValueType.ThreeD) return 3;
        if (t === PropertyValueType.TwoD) return 2;
        return 1;
    }
    function easeKeys(prop, influence) {
        var n = easeDims(prop), i, j, arr;
        for (i = 1; i <= prop.numKeys; i++) {
            arr = [];
            for (j = 0; j < n; j++) arr.push(new KeyframeEase(0, influence));
            try { prop.setTemporalEaseAtKey(i, arr, arr); } catch (e) {}
        }
    }
    function keys(prop, pairs, influence) {
        for (var i = 0; i < pairs.length; i++) prop.setValueAtTime(pairs[i][0], pairs[i][1]);
        if (influence) easeKeys(prop, influence);
    }
    function ellipseShape(r, cx, cy) {
        var k = 0.5523 * r, s = new Shape();
        s.vertices    = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
        s.inTangents  = [[-k, 0], [0, -k], [k, 0], [0, k]];
        s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]];
        s.closed = true;
        return s;
    }
    function fillScale(item) {
        if (!item || !item.width) return 100;
        return Math.max(W / item.width, H / item.height) * 100;
    }
    function addGlow(layer, radius, intensity) {
        try {
            var g = layer.Effects.addProperty("ADBE Glo2");
            try { g.property("Glow Radius").setValue(radius); } catch (e1) {}
            try { g.property("Glow Intensity").setValue(intensity); } catch (e2) {}
        } catch (e) {}
    }

    // ---------- footage ----------
    var src1 = importFootage("Select SHOT 1 (logo / bright theatre)");
    var src2 = importFootage("Select SHOT 2 (presenter / dark theatre)");

    // SHOT 1 (bottom)
    var shot1 = src1 ? comp.layers.add(src1) : comp.layers.addSolid([0.45, 0.08, 0.08], "SHOT1_PLACEHOLDER", W, H, 1);
    shot1.name = "SHOT1_LOGO";
    var b1 = fillScale(src1);
    keys(shot1.transform.scale, [[0, [b1, b1]], [T_SPOT + 0.4, [b1 * 1.06, b1 * 1.06]]], 33);

    // LIGHTS OUT (black solid, two-stage dim)
    var lights = comp.layers.addSolid([0, 0, 0], "LIGHTS_OUT", W, H, 1);
    keys(lights.transform.opacity, [
        [0, 0],
        [T_LIGHTS1, 0], [T_LIGHTS1 + 0.2, 45],        // bank 1 clunk
        [T_LIGHTS2, 45], [T_LIGHTS2 + 0.52, 92]       // bank 2 fade
    ], 60);

    // SHOT 2
    var shot2 = src2 ? comp.layers.add(src2) : comp.layers.addSolid([0.12, 0.05, 0.03], "SHOT2_PLACEHOLDER", W, H, 1);
    shot2.name = "SHOT2_PRESENTER";
    var b2 = fillScale(src2);
    keys(shot2.transform.scale, [[T_SPOT, [b2 * 1.08, b2 * 1.08]], [DUR - 1, [b2, b2]]], 50);

    // SPOT MATTE (soft circle) - directly above SHOT 2
    var matte = comp.layers.addSolid([1, 1, 1], "SPOT_MATTE", 200, 200, 1);
    var m = matte.Masks.addProperty("ADBE Mask Atom");
    m.property("ADBE Mask Shape").setValue(ellipseShape(100, 100, 100));
    m.property("ADBE Mask Feather").setValue([30, 30]);
    matte.transform.position.expression =
        'var d = thisComp.layer("CTRL_DOT").transform.position;\n' +
        'var p = thisComp.layer("CTRL_PRESENTER").transform.position;\n' +
        'ease(time, ' + T_SPOT + ', ' + T_TRAVEL_END + ', d, p);';
    // scale 0 until the spot starts, otherwise the matte punches a dark hole through Shot 1
    keys(matte.transform.scale, [[0, [0, 0]], [T_SPOT - 0.12, [0, 0]], [T_SPOT, [18, 18]], [T_SPOT_END, [2200, 2200]]], 75);

    try { shot2.setTrackMatte(matte, TrackMatteType.ALPHA); }     // AE 2023+
    catch (e) { shot2.trackMatteType = TrackMatteType.ALPHA; }    // older AE (matte is directly above)

    // SPOT RING (glowing edge that follows the matte)
    var ring = comp.layers.addShape();
    ring.name = "SPOT_RING";
    var rc = ring.property("ADBE Root Vectors Group");
    rc.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([200, 200]);
    var st = rc.addProperty("ADBE Vector Graphic - Stroke");
    st.property("ADBE Vector Stroke Color").setValue([1, 0.86, 0.62]);
    st.property("ADBE Vector Stroke Width").expression = 'Math.min(300 / Math.max(thisLayer.transform.scale[0], 1), 15);';
    ring.transform.position.expression = 'thisComp.layer("SPOT_MATTE").transform.position';
    ring.transform.scale.expression = 'thisComp.layer("SPOT_MATTE").transform.scale';
    keys(ring.transform.opacity, [[0, 0], [T_SPOT - 0.01, 0], [T_SPOT, 100], [T_SPOT + 1.0, 0]], 40);
    addGlow(ring, 30, 1.5);
    ring.blendingMode = BlendingMode.ADD;

    // DOT GLOW (the "point" that survives the blackout)
    var dot = comp.layers.addShape();
    dot.name = "DOT_GLOW";
    var dc = dot.property("ADBE Root Vectors Group");
    dc.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([34, 34]);
    dc.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 0.95, 0.85]);
    dot.transform.position.expression = 'thisComp.layer("CTRL_DOT").transform.position';
    keys(dot.transform.scale, [
        [T_PULSE, [100, 100]], [T_PULSE + 0.2, [160, 160]], [T_PULSE + 0.48, [100, 100]],
        [T_SPOT - 0.2, [100, 100]], [T_SPOT, [130, 130]]
    ], 60);
    keys(dot.transform.opacity, [[0, 0], [T_PULSE - 0.2, 0], [T_PULSE, 100], [T_SPOT, 100], [T_SPOT + 0.2, 0]], 50);
    addGlow(dot, 40, 2);
    dot.blendingMode = BlendingMode.ADD;

    // CONTROL NULLS (move these to re-aim)
    var nP = comp.layers.addNull(); nP.name = "CTRL_PRESENTER"; nP.transform.position.setValue(PRESENTER);
    var nD = comp.layers.addNull(); nD.name = "CTRL_DOT"; nD.transform.position.setValue(DOT);
    nP.label = nD.label = 9;

    // SFX / timing markers
    var mk = [
        [T_PULSE, "SFX: soft pulse on the dot"],
        [T_LIGHTS1, "SFX: theatre light clunk #1 + audience hush"],
        [T_LIGHTS2, "SFX: light clunk #2"],
        [T_SPOT, "SFX: soft whoosh (spot opens)"],
        [T_TRAVEL_END, "SFX: soft hit -> silence"],
        [T_SPOT_END + 0.2, "Presenter starts talking"]
    ];
    for (var i = 0; i < mk.length; i++) comp.markerProperty.setValueAtTime(mk[i][0], new MarkerValue(mk[i][1]));

    comp.openInViewer();
    app.endUndoGroup();
})();
