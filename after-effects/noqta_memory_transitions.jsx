/*
 * Noqtet Tahawul - AI Memory Sequences : 4 transition options
 * ------------------------------------------------------------
 * Builds 4 ready comps from the SAME inputs so you can show them side by side:
 *   OPT_A_Memory_Theatre  - the memory is projected inside the theatre, camera flies into it and back out
 *   OPT_B_Film_Strip      - a strip of film frames slides in, we punch into one frame; exit = projector gate flicker
 *   OPT_C_Dot_Iris        - a sconce light becomes a dot, the dot opens as an iris on the memory and closes back
 *   OPT_D_Ink_Bleed       - an ink drop spreads over the guest and reveals the memory; exit = ink pulls back
 *
 * Run: After Effects > File > Scripts > Run Script File...
 * It asks for:
 *   1) GUEST clip (close-up of the guest talking)          - required
 *   2) WIDE stage shot (both chairs on stage)              - Cancel = uses the guest clip
 *   3) MEMORY images or AI videos (multi-select, in order) - Cancel = 3 placeholders
 * Replace anything later: select the layer inside MEMORY_SEQ, Alt/Option-drag new footage onto it.
 * Every option uses the shared precomp MEMORY_SEQ, so replacing a shot there updates all 4 options.
 */
(function () {
    var W = 1920, H = 1080, FPS = 25;
    var SHOT = 2.5;          // seconds per memory shot
    var PRE = 2.0;           // guest before the transition
    var POST = 2.0;          // guest after the transition
    var SCONCE = [1340, 170];// light behind the guest used by option C (move CTRL_DOT)
    var SCREEN = [960, 430]; // projection screen centre in the wide shot (option A)
    var SCREEN_SCALE = 36;   // projection size in % of frame (option A)

    app.beginUndoGroup("Noqta Memory Transitions");
    var proj = app.project || app.newProject();
    var folder = proj.items.addFolder("NOQTA_MEMORY_TRANSITIONS");

    // ---------- helpers ----------
    function imp(f) { try { var it = proj.importFile(new ImportOptions(f)); it.parentFolder = folder; return it; } catch (e) { return null; } }
    function pickOne(t) { var f = File.openDialog(t); return f ? imp(f) : null; }
    function pickMany(t) {
        var fs = File.openDialog(t, undefined, true); var out = [];
        if (!fs) return out;
        if (!(fs instanceof Array)) fs = [fs];
        for (var i = 0; i < fs.length; i++) { var it = imp(fs[i]); if (it) out.push(it); }
        return out;
    }
    function dims(p) { var t = p.propertyValueType; return t === PropertyValueType.ThreeD ? 3 : (t === PropertyValueType.TwoD ? 2 : 1); }
    function keys(p, pairs, infl) {
        var i, j, a, n;
        for (i = 0; i < pairs.length; i++) p.setValueAtTime(pairs[i][0], pairs[i][1]);
        if (!infl) return;
        n = dims(p);
        for (i = 1; i <= p.numKeys; i++) { a = []; for (j = 0; j < n; j++) a.push(new KeyframeEase(0, infl)); try { p.setTemporalEaseAtKey(i, a, a); } catch (e) {} }
    }
    function hold(p) { for (var i = 1; i <= p.numKeys; i++) try { p.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD); } catch (e) {} }
    function fill(item) { return item && item.width ? Math.max(W / item.width, H / item.height) * 100 : 100; }
    function addFx(layer, name) { try { return layer.Effects.addProperty(name); } catch (e) { return null; } }
    function setFx(fx, prop, v) { try { fx.property(prop).setValue(v); } catch (e) {} }
    function ellipse(r) {
        var k = 0.5523 * r, s = new Shape();
        s.vertices = [[0, -r], [r, 0], [0, r], [-r, 0]];
        s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]];
        s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]];
        s.closed = true; return s;
    }
    function circleMatte(comp, name, r, feather) {
        var m = comp.layers.addShape(); m.name = name;
        var g = m.property("ADBE Root Vectors Group");
        g.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([r * 2, r * 2]);
        g.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
        if (feather) { var b = addFx(m, "ADBE Gaussian Blur 2"); setFx(b, 1, feather); }
        return m;
    }
    function matte(layer, m) {
        try { layer.setTrackMatte(m, TrackMatteType.ALPHA); }
        catch (e) { layer.trackMatteType = TrackMatteType.ALPHA; }   // older AE: matte must sit directly above
    }
    function guestLayer(comp, item, name) {
        var l = item ? comp.layers.add(item) : comp.layers.addSolid([0.25, 0.08, 0.06], name + "_PLACEHOLDER", W, H, 1);
        l.name = name; var s = fill(item); l.transform.scale.setValue([s, s]);
        if (item && item.hasVideo && item.duration < comp.duration) { try { l.timeRemapEnabled = true; } catch (e) {} }
        l.outPoint = comp.duration; return l;
    }
    function marker(comp, t, txt) { comp.markerProperty.setValueAtTime(t, new MarkerValue(txt)); }

    // ---------- inputs ----------
    var guest = pickOne("1/3  Select the GUEST clip (close-up)");
    var wide = pickOne("2/3  Select the WIDE stage shot (Cancel = use guest clip)") || guest;
    var mem = pickMany("3/3  Select the MEMORY images / AI videos (multi-select, in order)");

    // ---------- shared MEMORY_SEQ precomp ----------
    var nShots = mem.length || 3;
    var MEMD = nShots * SHOT;
    var seq = proj.items.addComp("MEMORY_SEQ", W, H, 1, MEMD, FPS); seq.parentFolder = folder;
    for (var i = nShots - 1; i >= 0; i--) {
        var it = mem[i] || null;
        var L = it ? seq.layers.add(it) : seq.layers.addSolid([0.2 + 0.1 * i, 0.12, 0.07], "MEMORY_" + (i + 1) + "_PLACEHOLDER", W, H, 1);
        L.name = "MEMORY_" + (i + 1);
        L.startTime = i * SHOT; L.inPoint = i * SHOT; L.outPoint = (i + 1) * SHOT;
        var s = fill(it);
        keys(L.transform.scale, [[i * SHOT, [s, s]], [(i + 1) * SHOT, [s * 1.07, s * 1.07]]]);   // slow Ken Burns
        if (it && it.hasVideo && it.duration > 0 && it.duration < SHOT) { try { L.timeRemapEnabled = true; } catch (e) {} }
    }
    // film look + 2.39 letterbox + label
    var look = seq.layers.addSolid([0.5, 0.5, 0.5], "FILM_LOOK (grain)", W, H, 1);
    look.adjustmentLayer = true;
    var nz = addFx(look, "ADBE Noise"); setFx(nz, 1, 6);
    var cc = addFx(look, "ADBE Tint"); setFx(cc, 3, 18);
    var bar = Math.round((H - W / 2.39) / 2);
    var top = seq.layers.addSolid([0, 0, 0], "LETTERBOX_TOP", W, bar, 1); top.transform.position.setValue([W / 2, bar / 2]);
    var bot = seq.layers.addSolid([0, 0, 0], "LETTERBOX_BOTTOM", W, bar, 1); bot.transform.position.setValue([W / 2, H - bar / 2]);
    var lab = seq.layers.addText("مشهد تمثيلي");
    var td = lab.property("Source Text").value; td.fontSize = 26; td.fillColor = [0.95, 0.9, 0.82]; td.justification = ParagraphJustification.LEFT_JUSTIFY;
    lab.property("Source Text").setValue(td); lab.transform.position.setValue([60, H - bar - 30]); lab.transform.opacity.setValue(75);

    function seqLayer(comp, start, name) {
        var l = comp.layers.add(seq); l.name = name || "MEMORY_SEQ"; l.startTime = start; return l;
    }

    // =====================================================================
    // OPTION A : MEMORY THEATRE
    // =====================================================================
    (function () {
        var IN = PRE, ON = IN + 0.4, PUSH0 = IN + 1.0, PUSH1 = PUSH0 + 1.3;
        var OUT0 = ON + MEMD - 1.6, OUT1 = OUT0 + 1.3, BACK = OUT1 + 0.8, D = BACK + POST;
        var c = proj.items.addComp("OPT_A_Memory_Theatre", W, H, 1, D, FPS); c.parentFolder = folder;
        var g = guestLayer(c, guest, "GUEST"); g.inPoint = 0;
        var w = guestLayer(c, wide, "WIDE_STAGE"); w.startTime = 0; w.inPoint = IN; w.outPoint = BACK;
        var dim = c.layers.addSolid([0, 0, 0], "HOUSE_LIGHTS_DIM", W, H, 1); dim.inPoint = IN; dim.outPoint = BACK;
        keys(dim.transform.opacity, [[IN, 0], [ON + 0.6, 40], [OUT1, 40], [BACK, 0]], 50);
        var glow = seqLayer(c, ON, "PROJECTION_SPILL"); glow.outPoint = BACK;
        glow.transform.position.setValue(SCREEN); glow.transform.scale.setValue([SCREEN_SCALE * 1.15, SCREEN_SCALE * 1.15]);
        var gb = addFx(glow, "ADBE Gaussian Blur 2"); setFx(gb, 1, 120); glow.blendingMode = BlendingMode.ADD;
        keys(glow.transform.opacity, [[ON, 0], [ON + 0.6, 70], [OUT1, 70], [BACK, 0]], 50);
        var m = seqLayer(c, ON, "PROJECTION"); m.outPoint = BACK;
        m.transform.position.setValue(SCREEN); m.transform.scale.setValue([SCREEN_SCALE, SCREEN_SCALE]);
        keys(m.transform.opacity, [[ON, 0], [ON + 0.6, 100], [OUT1, 100], [BACK, 0]], 50);
        m.transform.opacity.expression = "value * (1 + 0.05*Math.sin(time*37) + 0.03*(random()-0.5))";   // projector flicker
        var cam = c.layers.addNull(); cam.name = "CAMERA_PUSH"; cam.transform.position.setValue(SCREEN); cam.inPoint = IN; cam.outPoint = BACK;
        w.parent = cam; dim.parent = cam; glow.parent = cam; m.parent = cam;
        var full = 100 * 100 / SCREEN_SCALE;
        keys(cam.transform.scale, [[PUSH0, [100, 100]], [PUSH1, [full, full]], [OUT0, [full, full]], [OUT1, [100, 100]]], 75);
        keys(cam.transform.position, [[PUSH0, SCREEN], [PUSH1, [W / 2, H / 2]], [OUT0, [W / 2, H / 2]], [OUT1, SCREEN]], 75);
        g.moveToBeginning(); g.inPoint = BACK;   // guest returns on top after the wide
        var g0 = guestLayer(c, guest, "GUEST_BEFORE"); g0.outPoint = IN; g0.moveToBeginning();
        marker(c, IN, "CUT to wide - SFX: film projector starts"); marker(c, PUSH0, "camera flies into the memory");
        marker(c, OUT0, "pull back - guest watches his own past"); marker(c, BACK, "CUT back to guest - room tone returns");
    })();

    // =====================================================================
    // OPTION B : FILM STRIP
    // =====================================================================
    (function () {
        var IN = PRE, SLIDE1 = IN + 1.2, PUNCH = SLIDE1 + 0.6, END = PUNCH + MEMD, D = END + 0.4 + POST;
        var FW = 520, FH = 292, GAP = 60, SH = FH + 120;
        var stripW = (FW + GAP) * (nShots + 4);
        var strip = proj.items.addComp("FILM_STRIP", stripW, SH, 1, D, FPS); strip.parentFolder = folder;
        strip.layers.addSolid([0.03, 0.025, 0.02], "STRIP_BASE", stripW, SH, 1);
        var holes = strip.layers.addShape(); holes.name = "SPROCKETS";
        var hg = holes.property("ADBE Root Vectors Group");
        var r1 = hg.addProperty("ADBE Vector Shape - Rect"); r1.property("ADBE Vector Rect Size").setValue([28, 20]); r1.property("ADBE Vector Rect Roundness").setValue(4);
        hg.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([0.85, 0.8, 0.7]);
        var rep = hg.addProperty("ADBE Vector Filter - Repeater"); rep.property("ADBE Vector Repeater Copies").setValue(Math.ceil(stripW / 60));
        rep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([60, 0]);
        holes.transform.position.setValue([30, 30]);
        var holes2 = holes.duplicate(); holes2.transform.position.setValue([30, SH - 30]);
        for (var k = 0; k < nShots + 4; k++) {
            var idx = k % nShots, it = mem[idx] || null;
            var f = it ? strip.layers.add(it) : strip.layers.addSolid([0.3, 0.15, 0.08], "FRAME_" + (k + 1), W, H, 1);
            f.name = "FRAME_" + (k + 1); var s = fill(it) * FW / W;
            f.transform.scale.setValue([s, s]); f.transform.position.setValue([GAP / 2 + FW / 2 + k * (FW + GAP), SH / 2]);
            var fm = f.Masks.addProperty("ADBE Mask Atom"); var sh = new Shape();
            var iw = (it ? it.width : W), ih = (it ? it.height : H), mw = FW / (s / 100), mh = FH / (s / 100);
            sh.vertices = [[(iw - mw) / 2, (ih - mh) / 2], [(iw + mw) / 2, (ih - mh) / 2], [(iw + mw) / 2, (ih + mh) / 2], [(iw - mw) / 2, (ih + mh) / 2]]; sh.closed = true;
            fm.property("ADBE Mask Shape").setValue(sh);
        }
        var c = proj.items.addComp("OPT_B_Film_Strip", W, H, 1, D, FPS); c.parentFolder = folder;
        var g = guestLayer(c, guest, "GUEST");
        var bl = addFx(g, "ADBE Gaussian Blur 2"); keys(bl.property(1), [[IN, 0], [IN + 0.6, 25], [PUNCH, 25], [END, 0]], 50);
        var dk = c.layers.addSolid([0, 0, 0], "DARKEN", W, H, 1); keys(dk.transform.opacity, [[IN, 0], [IN + 0.6, 55], [END, 55], [END + 0.4, 0]], 50);
        var st = c.layers.add(strip); st.name = "FILM_STRIP"; st.inPoint = IN; st.outPoint = PUNCH + 0.2;
        st.transform.rotation.setValue(-6);
        var target = GAP / 2 + FW / 2 + 2 * (FW + GAP);   // 3rd frame lands centre
        keys(st.transform.anchorPoint, [[IN, [target - 2600, SH / 2]], [SLIDE1, [target, SH / 2]]], 80);
        keys(st.transform.scale, [[SLIDE1, [100, 100]], [PUNCH, [100 * W / FW * 1.02, 100 * W / FW * 1.02]]], 85);
        keys(st.transform.rotation, [[SLIDE1, -6], [PUNCH, 0]], 85);
        var m = seqLayer(c, PUNCH - 2 * SHOT * 0 , "MEMORY_SEQ"); m.startTime = PUNCH; m.inPoint = PUNCH; m.outPoint = END;
        // projector gate flicker on exit
        var fl = c.layers.addSolid([1, 0.92, 0.8], "GATE_FLASH", W, H, 1); fl.blendingMode = BlendingMode.ADD; fl.inPoint = END - 0.3; fl.outPoint = END + 0.4;
        keys(fl.transform.opacity, [[END - 0.3, 0], [END - 0.2, 80], [END - 0.12, 0], [END - 0.04, 90], [END + 0.04, 0], [END + 0.12, 60], [END + 0.4, 0]]);
        hold(fl.transform.opacity);
        marker(c, IN, "SFX: film reel spins up"); marker(c, PUNCH, "punch into the frame"); marker(c, END, "projector gate flicker - back to guest");
    })();

    // =====================================================================
    // OPTION C : DOT IRIS  (brand)
    // =====================================================================
    (function () {
        var DOT0 = PRE - 0.5, IN = PRE, OPEN = IN + 0.6, CLOSE0 = IN + MEMD - 0.6, CLOSE1 = IN + MEMD, D = CLOSE1 + POST;
        var c = proj.items.addComp("OPT_C_Dot_Iris", W, H, 1, D, FPS); c.parentFolder = folder;
        var g = guestLayer(c, guest, "GUEST");
        var ctrl = c.layers.addNull(); ctrl.name = "CTRL_DOT"; ctrl.transform.position.setValue(SCONCE); ctrl.label = 9;
        var m = seqLayer(c, IN, "MEMORY_SEQ"); m.inPoint = IN; m.outPoint = CLOSE1;
        var mt = circleMatte(c, "IRIS_MATTE", 100, 25); mt.inPoint = IN; mt.outPoint = CLOSE1;
        mt.transform.position.expression = 'var d=thisComp.layer("CTRL_DOT").transform.position; ease(time,' + IN + ',' + OPEN + ',d,[' + W / 2 + ',' + H / 2 + '])' +
            ' + (time>' + CLOSE0 + ' ? ease(time,' + CLOSE0 + ',' + CLOSE1 + ',[0,0],d-[' + W / 2 + ',' + H / 2 + ']) : [0,0])';
        keys(mt.transform.scale, [[IN, [6, 6]], [OPEN, [1300, 1300]], [CLOSE0, [1300, 1300]], [CLOSE1, [6, 6]]], 85);
        mt.moveBefore(m); matte(m, mt);
        var dot = circleMatte(c, "DOT_GLOW", 14, 0); dot.blendingMode = BlendingMode.ADD;
        dot.transform.position.expression = 'thisComp.layer("CTRL_DOT").transform.position';
        var gl = addFx(dot, "ADBE Glo2"); setFx(gl, "Glow Radius", 60); setFx(gl, "Glow Intensity", 2);
        keys(dot.transform.opacity, [[DOT0, 0], [IN - 0.1, 100], [OPEN, 0], [CLOSE0 + 0.3, 0], [CLOSE1, 100], [CLOSE1 + 0.5, 0]], 50);
        keys(dot.transform.scale, [[DOT0, [60, 60]], [IN, [160, 160]], [CLOSE1, [160, 160]], [CLOSE1 + 0.5, [60, 60]]], 50);
        marker(c, DOT0, "sconce light becomes the dot - SFX soft tone"); marker(c, IN, "iris opens"); marker(c, CLOSE0, "iris closes back into the dot");
    })();

    // =====================================================================
    // OPTION D : INK BLEED
    // =====================================================================
    (function () {
        var IN = PRE, OPEN = IN + 1.1, CLOSE0 = IN + MEMD - 0.9, CLOSE1 = IN + MEMD, D = CLOSE1 + POST;
        var DROP = [W * 0.55, H * 0.45];
        var c = proj.items.addComp("OPT_D_Ink_Bleed", W, H, 1, D, FPS); c.parentFolder = folder;
        var g = guestLayer(c, guest, "GUEST");
        function inkShape(name, extra) {
            var s = c.layers.addSolid([1, 1, 1], name, W, H, 1);
            var mk = s.Masks.addProperty("ADBE Mask Atom");
            var e = ellipse(100); for (var v = 0; v < 4; v++) { e.vertices[v] = [e.vertices[v][0] + DROP[0], e.vertices[v][1] + DROP[1]]; }
            mk.property("ADBE Mask Shape").setValue(e);
            keys(mk.property("ADBE Mask Expansion"), [[IN, -95], [OPEN, 1500 + extra], [CLOSE0, 1500 + extra], [CLOSE1, -95]], 70);
            mk.property("ADBE Mask Feather").setValue([8, 8]);
            var re = addFx(s, "ADBE Roughen Edges"); setFx(re, "Border", 140); setFx(re, "Edge Sharpness", 1.4); setFx(re, "Fractal Influence", 1);
            setFx(re, "Scale", 120);
            try { re.property("Evolution").expression = "time*120"; } catch (x) {}
            s.inPoint = IN; s.outPoint = CLOSE1; return s;
        }
        var rim = inkShape("INK_RIM", 60); var rf = addFx(rim, "ADBE Fill"); setFx(rf, "Color", [0.02, 0.015, 0.012]);
        var m = seqLayer(c, IN, "MEMORY_SEQ"); m.inPoint = IN; m.outPoint = CLOSE1;
        var mt = inkShape("INK_MATTE", 0); mt.moveBefore(m); matte(m, mt);
        marker(c, IN, "SFX: ink drop / water drip"); marker(c, CLOSE0, "ink pulls back");
    })();

    alert("Done: 4 options in the project panel > NOQTA_MEMORY_TRANSITIONS.\nReplace shots inside MEMORY_SEQ (Alt/Option-drag) and all 4 options update.");
    app.endUndoGroup();
})();
