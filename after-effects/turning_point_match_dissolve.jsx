/*
 * Turning Point (Noqtet Tahawol) - "Chandelier Match Dissolve" transition
 * ----------------------------------------------------------------------
 * Shot 1 slowly tilts/pushes up toward the chandelier, the logo melts away
 * with a focus pull, the chandelier flares, and we dissolve onto Shot 2
 * whose chandelier sits in the exact same spot, then settle on the presenter.
 *
 * Run: After Effects > File > Scripts > Run Script File...
 * Pick Shot 1 (logo) then Shot 2 (presenter). Cancel = placeholder.
 *
 * Fine-tune: change CH1 / CH2 below (chandelier position as a fraction
 * of each clip's width/height), or nudge each layer's Anchor Point.
 */
(function () {
    var FPS = 25, W = 1920, H = 1080, DUR = 6;
    var CH1 = [0.489, 0.133];   // chandelier in SHOT 1 (fraction of frame)
    var CH2 = [0.4925, 0.031];  // chandelier in SHOT 2 (fraction of frame)
    var PUSH = 1.15;            // extra zoom while matching

    // timing (seconds)
    var T_MOVE = 1.5;           // shot 1 starts tilting up
    var T_DISS = 2.6;           // dissolve starts
    var T_DISS_END = 3.6;       // dissolve done
    var T_SETTLE = 4.8;         // shot 2 settled on presenter

    app.beginUndoGroup("Turning Point Match Dissolve");
    var proj = app.project || app.newProject();
    var comp = proj.items.addComp("TurningPoint_MatchDissolve", W, H, 1, DUR, FPS);

    function importFootage(title) {
        var f = File.openDialog(title);
        if (!f) return null;
        try { return proj.importFile(new ImportOptions(f)); } catch (e) { alert("Couldn't import: " + f.name); return null; }
    }
    function dims(prop) {
        var t = prop.propertyValueType;
        if (t === PropertyValueType.ThreeD) return 3;
        if (t === PropertyValueType.TwoD) return 2;
        return 1;
    }
    function keys(prop, pairs, infl) {
        var i, j, arr, n;
        for (i = 0; i < pairs.length; i++) prop.setValueAtTime(pairs[i][0], pairs[i][1]);
        if (!infl) return;
        n = dims(prop);
        for (i = 1; i <= prop.numKeys; i++) {
            arr = [];
            for (j = 0; j < n; j++) arr.push(new KeyframeEase(0, infl));
            try { prop.setTemporalEaseAtKey(i, arr, arr); } catch (e) {}
        }
    }
    function addBlur(layer) {
        var fx = layer.Effects.addProperty("ADBE Gaussian Blur 2");
        try { fx.property("Repeat Edge Pixels").setValue(1); } catch (e) {}
        return fx.property(1);
    }
    // place a layer so its chandelier (anchor) sits where it naturally would at "fill" scale
    function setup(layer, item, ch) {
        var w = item ? item.width : W, h = item ? item.height : H;
        var b = Math.max(W / w, H / h) * 100;
        var a = [w * ch[0], h * ch[1]];
        layer.transform.anchorPoint.setValue(a);
        var natural = [W / 2 + (a[0] - w / 2) * b / 100, H / 2 + (a[1] - h / 2) * b / 100];
        return { base: b, natural: natural };
    }

    var src1 = importFootage("Select SHOT 1 (logo / bright theatre)");
    var src2 = importFootage("Select SHOT 2 (presenter / dark theatre)");

    // SHOT 1
    var s1 = src1 ? comp.layers.add(src1) : comp.layers.addSolid([0.45, 0.08, 0.08], "SHOT1_PLACEHOLDER", W, H, 1);
    s1.name = "SHOT1_LOGO";
    var g1 = setup(s1, src1, CH1);

    // SHOT 2 (on top, dissolves in)
    var s2 = src2 ? comp.layers.add(src2) : comp.layers.addSolid([0.12, 0.05, 0.03], "SHOT2_PLACEHOLDER", W, H, 1);
    s2.name = "SHOT2_PRESENTER";
    var g2 = setup(s2, src2, CH2);

    // the shared point both chandeliers meet at = shot 2's natural chandelier
    var MATCH = g2.natural;

    // Shot 1: hold, then tilt up + push toward the chandelier
    keys(s1.transform.position, [[T_MOVE, g1.natural], [T_DISS_END, MATCH]], 70);
    keys(s1.transform.scale, [[0, [g1.base, g1.base]], [T_MOVE, [g1.base * 1.03, g1.base * 1.03]],
                              [T_DISS_END, [g1.base * PUSH * 1.04, g1.base * PUSH * 1.04]]], 60);
    keys(addBlur(s1), [[T_DISS - 0.3, 0], [T_DISS_END, 18]], 60);

    // Shot 2: starts matched + zoomed + soft, settles on presenter
    s2.transform.position.setValue(MATCH);
    keys(s2.transform.scale, [[T_DISS, [g2.base * PUSH, g2.base * PUSH]], [T_SETTLE, [g2.base, g2.base]]], 75);
    keys(s2.transform.opacity, [[T_DISS, 0], [T_DISS_END, 100]], 50);
    keys(addBlur(s2), [[T_DISS, 18], [T_DISS_END + 0.4, 0]], 60);

    // CHANDELIER FLARE - bridges the two shots
    var fl = comp.layers.addShape();
    fl.name = "CHANDELIER_FLARE";
    var c = fl.property("ADBE Root Vectors Group");
    c.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([90, 90]);
    c.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 0.82, 0.55]);
    fl.transform.position.setValue(MATCH);
    try {
        var gb = fl.Effects.addProperty("ADBE Gaussian Blur 2"); gb.property(1).setValue(40);
        var gl = fl.Effects.addProperty("ADBE Glo2");
        try { gl.property("Glow Radius").setValue(120); } catch (e1) {}
        try { gl.property("Glow Intensity").setValue(1.2); } catch (e2) {}
    } catch (e) {}
    fl.blendingMode = BlendingMode.ADD;
    keys(fl.transform.opacity, [[0, 0], [T_DISS - 0.2, 0], [T_DISS + 0.5, 85], [T_DISS_END + 0.5, 0]], 50);
    keys(fl.transform.scale, [[T_DISS - 0.2, [60, 60]], [T_DISS + 0.5, [140, 140]], [T_DISS_END + 0.5, [90, 90]]], 50);

    var mk = [
        [T_MOVE, "SFX: low swell starts / camera drifts up"],
        [T_DISS, "SFX: shimmer / crystal chime (chandelier)"],
        [T_DISS_END, "SFX: swell resolves - room tone, silence"],
        [T_SETTLE, "Presenter starts talking"]
    ];
    for (var i = 0; i < mk.length; i++) comp.markerProperty.setValueAtTime(mk[i][0], new MarkerValue(mk[i][1]));

    comp.openInViewer();
    app.endUndoGroup();
})();
