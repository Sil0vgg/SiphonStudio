// ==UserScript==
// @name         Siphon Studio
// @namespace    http://tampermonkey.net/
// @version      29.0
// @description  Siphon Studio for Pianoverse: zero-lag room play, Siphon/Siphon Dev tags + cursor labels, favicon, site animations, dock, library, logger.
// @author       Sil0v
// @icon         https://raw.githubusercontent.com/Sil0vgg/SiphonStudio/main/SSW.png
// @match        https://pianoverse.net/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      bitmidi.com
// @connect      vgmusic.com
// @connect      www.vgmusic.com
// @connect      cdn.jsdelivr.net
// @connect      data.jsdelivr.com
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @connect      ntfy.sh
// @connect      *
// @require      https://cdn.jsdelivr.net/npm/@tonejs/midi@2.0.28/build/Midi.js
// ==/UserScript==

(function () {
    'use strict';
    const PW = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    if (PW.__siphonStudio || PW.__pvxMidiStudio) return;
    PW.__siphonStudio = true;
    PW.__pvxMidiStudio = true;

    /* =====================================================================
     * 0. CONSTANTS & HELPERS
     * ===================================================================== */
    const VERSION = '29.0';
    const APP = 'Siphon Studio';
    const appTitle = (extra) => extra ? (extra + ' · v' + VERSION) : (APP + ' v' + VERSION);
    const SIPHON_LOGO = 'data:image/png;base64,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';
    const LS_KEY = 'siphon.settings.v24';
    const LS_OLD = 'pvx.settings.v23';
    const LS_OLD2 = 'pvx.settings.v22';
    const LS_VER = 'siphon.version.seen';
    const LS_TUT = 'siphon.tutorial.v1';
    const UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/Sil0vgg/SiphonStudio/main/main/VERSION';
    const DOWNLOAD_URL = 'https://github.com/Sil0vgg/SiphonStudio';
    const nativeRAF = PW.requestAnimationFrame;
    const nativeCAF = PW.cancelAnimationFrame;
    const origRAF = nativeRAF.bind(PW);
    const MIN_NOTE = 21, MAX_NOTE = 108, WHITE_COUNT = 52;
    const LOOK_MS = 120, TICK_MS = 20;

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const tag = (x) => Object.prototype.toString.call(x);
    const fmtTime = (s) => {
        s = Math.max(0, s || 0);
        const m = Math.floor(s / 60), r = Math.floor(s % 60);
        return m + ':' + (r < 10 ? '0' : '') + r;
    };
    const fmtInt = (n) => Number(n).toLocaleString('en-US');
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const el = (tag, cls, html) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    };
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = (p) => NOTE_NAMES[p % 12] + (Math.floor(p / 12) - 1);
    const fmtAgo = (ts) => {
        const d = (Date.now() - ts) / 1000;
        if (d < 60) return 'just now';
        if (d < 3600) return Math.floor(d / 60) + ' min ago';
        if (d < 86400) return Math.floor(d / 3600) + ' h ago';
        return Math.floor(d / 86400) + ' d ago';
    };

    const bus = {
        h: {},
        on(e, f) { (this.h[e] || (this.h[e] = [])).push(f); },
        emit(e, ...a) { (this.h[e] || []).forEach((f) => { try { f(...a); } catch (err) { console.error('[PVX]', err); } }); },
    };

    const disposers = [];
    function listen(target, type, fn, opts) {
        target.addEventListener(type, fn, opts);
        disposers.push(() => target.removeEventListener(type, fn, opts));
    }

    function parseHex(hex) {
        if (typeof hex !== 'string') return null;
        let c = hex.trim().replace('#', '');
        if (c.length === 3) c = c.split('').map((x) => x + x).join('');
        if (!/^[0-9a-f]{6}$/i.test(c)) return null;
        const n = parseInt(c, 16);
        return [n >> 16, (n >> 8) & 255, n & 255];
    }
    const rgbStr = (r, g, b) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    function hsl(h, s, l) {
        s /= 100; l /= 100;
        const k = (n) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [f(0) * 255, f(8) * 255, f(4) * 255];
    }

    /* =====================================================================
     * 1. SETTINGS
     * ===================================================================== */
    const DEFAULTS = {
        ui: {
            remember: true, startMin: false, restorePort: true, port: '',
            notifications: true, animations: true, shortcuts: true, lobbyWarn: true,
            theme: 'graphite', accentMode: 'player', accent: '#B8A6E8', scale: 100, compact: false, showInfo: true, opacity: 100, ver: 0, showNps: true,
        },
        win: { x: -1, y: -1, w: 780, h: 480, min: false },
        play: {
            speed: 1, rewind: 5, forward: 5, lead: 0, onEnd: 'stop',
            velScale: 100, velFixed: 0, velMax: 127, minVel: 0, maxNps: 0,
            transpose: 0, minNote: 21, maxNote: 108, oor: 'drop', loop: false,
        },
        click: { target: 'site', vel: 0 },
        hz: {
            on: false, preset: 'natural', strength: 100,
            timing: 12, drift: 6, driftPeriod: 8, bias: 0,
            roll: 8, rollDir: 'up', melody: 6, hand: 8, split: 60,
            vel: 10, accent: 5, dyn: 100, velMin: 1, velMax: 127,
            len: 8, gate: 100, minLen: 30,
            pedal: 'off', repedal: 60,
            dropPct: 0, wrongPct: 0,
            seed: true, seedValue: 1, varyLoop: false,
        },
        viz: { notes: true, window: 2.0, kbHeight: 56, colorMode: 'accent', velocity: false, grid: true, beats: true, measures: true, opacity: 100, labels: 'c', liveKeys: false, liveKeysAlways: false, octaves: true },
        logger: { on: false, window: 8, hideMidi: true, me: true, others: true, minVel: 0, colors: 'user', fade: false, legend: true },
        rec: { source: 'all', waitFirst: true, perUser: true, pedal: true, minVel: 0, maxMin: 0, autoLoad: true, autoSave: true, minNotes: 1 },
        lib: { keep: 30, maxMB: 40, store: true, pinKeep: true },
        dock: { on: false, window: 3, bgAlpha: 70, midi: true, liveKeys: false, collapseHud: true, labels: true },
        perf: { quality: 'balanced', scale: 100, fps: 0, reduced: false, auto: true, stats: false, mode: false, blackMidi: false, fpsMode: 'full', graph: false, smart: true, hudPlay: true },
        site: {
            noBlur: false, noTransitions: false, hideNotes: false, hideCursors: false, fpsCap: 0,
            hideSystemMsgs: false, chatFont: 100, hideUserList: false, hideChatHeader: false, hideNotifications: false,
            hideCursorNames: false, cursorScale: 100, cursorOpacity: 100, hideHeader: false, hideToolbar: false,
            keyLabels: 'site', leaveWarn: false, noShadows: false,
        },
        shop: { tab: 'bitmidi', q: '', repos: '', autoplay: false, autoClose: false, sort: 'default', queueRepeat: false, queueShuffle: false },
        presence: { color1: '#6B5CAD', color2: '#B8A6E8', showCursor: true, showServerCursor: true },
        skin: { siteTheme: true, freezeCursor: false, hdr: false, bypassConcert: false, antiAfk: true },
    };

    function deepMerge(def, src) {
        const out = {};
        for (const k in def) {
            const dv = def[k], sv = src && src[k];
            if (dv && typeof dv === 'object') out[k] = deepMerge(dv, sv && typeof sv === 'object' ? sv : {});
            else out[k] = (typeof sv === typeof dv && !(typeof sv === 'number' && !isFinite(sv))) ? sv : dv;
        }
        return out;
    }

    const HZ_KEYS = ['timing', 'drift', 'driftPeriod', 'bias', 'roll', 'rollDir', 'melody', 'hand', 'split', 'vel', 'accent', 'dyn', 'velMin', 'velMax', 'len', 'gate', 'minLen', 'pedal', 'repedal', 'dropPct', 'wrongPct'];
    const HZ_BASE = { driftPeriod: 8, bias: 0, split: 60, velMin: 1, velMax: 127, minLen: 30, repedal: 60, dropPct: 0, wrongPct: 0, pedal: 'off', dyn: 100, gate: 100, rollDir: 'up' };
    const HZ_PRESETS = {
        subtle: { ...HZ_BASE, timing: 5, drift: 2, roll: 3, melody: 2, hand: 3, vel: 5, accent: 2, len: 4 },
        natural: { ...HZ_BASE, timing: 12, drift: 6, roll: 8, melody: 6, hand: 8, vel: 10, accent: 5, len: 8 },
        expressive: { ...HZ_BASE, timing: 14, drift: 14, driftPeriod: 6, bias: -2, roll: 14, melody: 10, hand: 12, vel: 12, accent: 9, dyn: 115, len: 10, gate: 92, pedal: 'measure', repedal: 70 },
        loose: { ...HZ_BASE, timing: 26, drift: 16, driftPeriod: 5, roll: 16, rollDir: 'random', melody: 8, hand: 15, vel: 16, accent: 6, len: 14 },
        sloppy: { ...HZ_BASE, timing: 40, drift: 25, driftPeriod: 4, roll: 24, rollDir: 'random', melody: 5, hand: 20, vel: 24, accent: 4, dyn: 90, len: 20, gate: 105, dropPct: 0.5, wrongPct: 0.5 },
    };

    let S;
    try { S = deepMerge(DEFAULTS, JSON.parse(localStorage.getItem(LS_KEY) || localStorage.getItem(LS_OLD) || localStorage.getItem(LS_OLD2) || '{}')); }
    catch (e) { S = deepMerge(DEFAULTS, {}); }
    if (HZ_PRESETS[S.hz.preset]) Object.assign(S.hz, HZ_PRESETS[S.hz.preset]);
    if (S.ui.ver < 26) { S.viz.liveKeys = true; S.logger.fade = false; S.logger.hideMidi = true; S.ui.ver = 26; }
    let saveTimer = 0;
    function saveSettings() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }, 250);
    }
    const getP = (k) => k.split('.').reduce((o, x) => o[x], S);
    const setP = (k, v) => { const a = k.split('.'); const l = a.pop(); a.reduce((o, x) => o[x], S)[l] = v; };

    /* =====================================================================
     * 2. NETWORK HOOK (decodes Pianoverse protobuf frames)
     * ===================================================================== */
    const net = { me: { id: '', name: 'Me', color: '' }, room: '', ws: null };
    const playGate = { playing: false };
    const dec = new TextDecoder();
    const ME_ID = () => net.me.id || '__me';

    function pbFields(b, s, e) {
        s = s || 0; e = e == null ? b.length : e;
        const out = [];
        let p = s;
        while (p < e) {
            let tag = 0, sh = 0, c;
            do { c = b[p++]; tag += (c & 127) * Math.pow(2, sh); sh += 7; } while ((c & 128) && p < e);
            const f = Math.floor(tag / 8), w = tag & 7;
            if (w === 0) {
                let v = 0; sh = 0;
                do { c = b[p++]; v += (c & 127) * Math.pow(2, sh); sh += 7; } while ((c & 128) && p < e);
                out.push({ f, w, v });
            } else if (w === 2) {
                let len = 0; sh = 0;
                do { c = b[p++]; len += (c & 127) * Math.pow(2, sh); sh += 7; } while ((c & 128) && p < e);
                out.push({ f, w, s: p, e: p + len }); p += len;
            } else if (w === 5) { out.push({ f, w, s: p, e: p + 4 }); p += 4; }
            else if (w === 1) { out.push({ f, w, s: p, e: p + 8 }); p += 8; }
            else break;
        }
        return out;
    }
    const pbStr = (b, f) => dec.decode(b.subarray(f.s, f.e));
    function pbKV(b, f) {
        const o = {};
        for (const x of pbFields(b, f.s, f.e)) { if (x.w === 0) o[x.f] = x.v; else if (x.w === 2) o[x.f] = pbStr(b, x); }
        return o;
    }

    /* user registry (never deleted, so history keeps names/colors) */
    const uMap = new Map(), uList = [];
    const PCOLS = Array.from({ length: 12 }, (_, i) => hsl(i * 30, 62, 68));
    function refreshRGB(e, idx) {
        let rgb = parseHex(e.color);
        if (!rgb) rgb = PCOLS[(idx * 5) % 12];
        if (lum(rgb) < 0.28) rgb = mix(rgb, [255, 255, 255], 0.45);
        e.rgb = rgb;
    }
    function userEntry(id) {
        let i = uMap.get(id);
        if (i === undefined) {
            i = uList.length;
            const e = { id, name: id === '__me' ? 'Me' : 'Player', color: '', me: id === net.me.id || id === '__me', rgb: null };
            uList.push(e); uMap.set(id, i); refreshRGB(e, i);
        }
        return i;
    }
    function updateUser(u, isMe) {
        const id = isMe ? ME_ID() : u.id;
        const i = userEntry(id), e = uList[i];
        if (u.name) e.name = u.name;
        if (u.color !== undefined) e.color = u.color;
        e.me = isMe || id === net.me.id;
        refreshRGB(e, i);
    }

    function onServerMsg(b) {
        let fs;
        try { fs = pbFields(b); } catch (e) { return; }
        for (const f of fs) {
            if (f.w !== 2) continue;
            switch (f.f) {
                case 2: {
                    const u = {};
                    for (const x of pbFields(b, f.s, f.e)) { if (x.f === 1) u.id = pbStr(b, x); else if (x.f === 2) u.name = pbStr(b, x); else if (x.f === 3) u.color = pbStr(b, x); }
                    if (u.id) net.me.id = u.id;
                    if (u.name) net.me.name = u.name;
                    if (u.color) net.me.color = u.color;
                    uList.forEach((e) => { e.me = e.id === net.me.id || e.id === '__me'; });
                    updateUser(u, true);
                    bus.emit('me');
                    break;
                }
                case 7: {
                    const w = pbFields(b, f.s, f.e).find((x) => x.f === 1 && x.w === 2);
                    net.room = w ? pbStr(b, w) : '';
                    liveReleaseAll();
                    bus.emit('room');
                    break;
                }
                case 9: { const o = pbKV(b, f); if (o[1] && o[1] !== net.me.id) liveEvent(o[1], o[2], o[3] || 0, true, 'ws'); break; }
                case 10: { const o = pbKV(b, f); if (o[1] && o[1] !== net.me.id) liveEvent(o[1], o[2], 0, false, 'ws'); break; }
                case 11: { const o = pbKV(b, f); if (o[1] && o[1] !== net.me.id) recPedal(o[1], o[2] === 1); break; }
                case 12: case 13: {
                    const u = {};
                    for (const x of pbFields(b, f.s, f.e)) { if (x.f === 1) u.id = pbStr(b, x); else if (x.f === 2) u.name = pbStr(b, x); else if (x.f === 3) u.color = pbStr(b, x); }
                    if (!u.id) break;
                    if (u.id === net.me.id) { if (u.name) net.me.name = u.name; if (u.color) net.me.color = u.color; updateUser(u, true); }
                    else updateUser(u, false);
                    bus.emit('roster');
                    break;
                }
                case 14: { liveReleaseUser(pbStr(b, f)); bus.emit('roster'); break; }
            }
        }
    }
    let lastClientMusic = false;
    function onClientMsg(b) {
        lastClientMusic = false;
        let fs;
        try { fs = pbFields(b); } catch (e) { return; }
        let ev = 0;
        for (const f of fs) if (f.f === 1 && f.w === 0) ev = f.v;
        for (const f of fs) {
            if (f.w !== 2) continue;
            if (f.f === 11) { const o = pbKV(b, f); liveEvent(ME_ID(), o[2], o[3] || 0, true, 'out'); lastClientMusic = true; }
            else if (f.f === 12) { const o = pbKV(b, f); liveEvent(ME_ID(), o[2], 0, false, 'out'); lastClientMusic = true; }
        }
        if (ev === 11 || ev === 12 || ev === 13) lastClientMusic = true;
        if (ev === 11) { const f = fs.find((x) => x.f === 13 && x.w === 0); recPedal(ME_ID(), !!(f && f.v)); }
    }

    const NativeWS = PW.WebSocket;
    function hookSocket(ws) {
        net.ws = ws;
        ws.addEventListener('message', (ev) => {
            const d = ev.data;
            if (tag(d) === '[object ArrayBuffer]') onServerMsg(new Uint8Array(d));
            else if (tag(d) === '[object Blob]') d.arrayBuffer().then((x) => onServerMsg(new Uint8Array(x)));
        });
        ws.addEventListener('close', () => liveReleaseAll());
        const os = ws.send;
        ws.send = function (d) {
            try {
                let bytes = null;
                if (tag(d) === '[object ArrayBuffer]') bytes = new Uint8Array(d);
                else if (ArrayBuffer.isView(d)) bytes = new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
                if (bytes) {
                    onClientMsg(bytes);
                    // Freeze cursor: only allow packets that onClientMsg marked as music
                    if (S.skin && S.skin.freezeCursor && playGate.playing && !lastClientMusic) {
                        return; // swallow cursor / chat / presence / etc.
                    }
                }
            } catch (e) { /* never break the site */ }
            return os.call(this, d);
        };
    }
    function PatchedWS(url, protocols) {
        const ws = protocols === undefined ? new NativeWS(url) : new NativeWS(url, protocols);
        try { if (/pianoverse/i.test(String(url))) hookSocket(ws); } catch (e) { /* ignore */ }
        return ws;
    }
    PatchedWS.prototype = NativeWS.prototype;
    Object.setPrototypeOf(PatchedWS, NativeWS);
    PW.WebSocket = PatchedWS;

    /* =====================================================================
     * 3. LIVE NOTE STORE (used by logger, dock key lighting and recorder)
     * ===================================================================== */
    const LIVE_CAP = 16384;
    const live = {
        t0: new Float64Array(LIVE_CAP), t1: new Float64Array(LIVE_CAP),
        key: new Uint8Array(LIVE_CAP), vel: new Uint8Array(LIVE_CAP), usr: new Uint16Array(LIVE_CAP),
        head: 0, count: 0,
    };
    const openNotes = new Map();           // userIdx*128+key -> ring index
    const liveKeyUsr = new Int16Array(128).fill(-1);
    const lastWsOn = new Float64Array(128);
    let liveHeld = 0, animUntil = 0;
    let liveTickPending = false;
    function scheduleLiveTick() {
        // Batch note events into a single rAF — the old path emitted livetick per note
        // and forced continuous full redraws for many seconds (huge FPS drops).
        if (liveTickPending) return;
        liveTickPending = true;
        (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16))(() => {
            liveTickPending = false;
            bus.emit('livetick');
        });
    }

    function liveEvent(uid, key, vel, on, src) {
        key = key | 0;
        if (key < 0 || key > 127) return;
        const now = performance.now();
        const ui = userEntry(uid);
        const isMe = uList[ui].me;
        // PERF: other players' notes only enter the live pipeline when Logger or Rec needs them.
        // Room activity was forcing continuous full redraws before.
        if (!isMe && !S.logger.on && !rec.on) return;
        const mk = ui * 128 + key;
        if (src !== 'dom' && on) lastWsOn[key] = now;
        if (on) {
            const old = openNotes.get(mk);
            if (old !== undefined) { live.t1[old] = now; openNotes.delete(mk); liveHeld--; }
            const idx = live.head;
            live.t0[idx] = now; live.t1[idx] = -1; live.key[idx] = key; live.vel[idx] = vel; live.usr[idx] = ui;
            live.head = (live.head + 1) % LIVE_CAP;
            if (live.count < LIVE_CAP) live.count++;
            openNotes.set(mk, idx); liveHeld++;
            liveKeyUsr[key] = ui;
            uList[ui].count = (uList[ui].count || 0) + 1; uList[ui].last = Date.now();
        } else {
            const idx = openNotes.get(mk);
            if (idx !== undefined) { live.t1[idx] = now; openNotes.delete(mk); liveHeld--; }
            if (liveKeyUsr[key] === ui) liveKeyUsr[key] = -1;
        }
        if (S.logger.on) animUntil = now + (S.logger.window + 0.35) * 1000;
        else animUntil = now + 100;
        recFeed(uid, key, vel, on, now, isMe);
        if (S.logger.on || isMe || rec.on) scheduleLiveTick();
    }
    function liveReleaseUser(uid) {
        const ui = uMap.get(uid);
        if (ui === undefined) return;
        const now = performance.now();
        for (const [mk, idx] of Array.from(openNotes)) {
            if ((mk >> 7) === ui) { live.t1[idx] = now; openNotes.delete(mk); liveHeld--; const k = mk & 127; if (liveKeyUsr[k] === ui) liveKeyUsr[k] = -1; }
        }
        scheduleLiveTick();
    }
    function liveReleaseAll() {
        const now = performance.now();
        for (const idx of openNotes.values()) live.t1[idx] = now;
        openNotes.clear(); liveHeld = 0; liveKeyUsr.fill(-1);
        scheduleLiveTick();
    }
    function liveClear() { live.head = 0; live.count = 0; openNotes.clear(); liveHeld = 0; liveKeyUsr.fill(-1); scheduleLiveTick(); }

    /* =====================================================================
     * 4. RECORDER
     * ===================================================================== */
    const rec = { on: false, t0: null, ev: [], users: new Map(), count: 0, room: '', started: 0 };
    let lastRec = null;
    function recAllowed(isMe) {
        const s = S.rec.source;
        return !(s === 'others' && isMe) && !(s === 'me' && !isMe);
    }
    function recStart() {
        rec.on = true; rec.ev = []; rec.users.clear(); rec.count = 0;
        rec.t0 = S.rec.waitFirst ? null : performance.now();
        rec.started = Date.now(); rec.room = net.room;
        bus.emit('rec');
    }
    function recFeed(uid, key, vel, on, now, isMe) {
        if (!rec.on || !recAllowed(isMe)) return;
        if (on && vel < S.rec.minVel) return;
        if (rec.t0 === null) { if (!on) return; rec.t0 = now; }
        rec.users.set(uid, uList[userEntry(uid)].name);
        rec.ev.push({ t: (now - rec.t0) / 1000, k: key, v: vel, on, u: uid });
        if (on) { rec.count++; bus.emit('recnote'); }
    }
    function recPedal(uid, en) {
        if (!rec.on || !S.rec.pedal || rec.t0 === null) return;
        if (!recAllowed(uList[userEntry(uid)].me)) return;
        rec.users.set(uid, uList[userEntry(uid)].name);
        rec.ev.push({ t: (performance.now() - rec.t0) / 1000, u: uid, ped: en ? 1 : 0 });
    }
    function recBuild() {
        const ev = rec.ev;
        const open = new Map(), notes = [];
        let last = 0;
        for (const e of ev) {
            if (e.t > last) last = e.t;
            if (e.ped !== undefined) continue;
            const key = e.u + ':' + e.k;
            const o = open.get(key);
            if (e.on) {
                if (o) notes.push({ ...o, d: Math.max(0.03, e.t - o.t) });
                open.set(key, { u: e.u, k: e.k, v: e.v, t: e.t });
            } else if (o) { notes.push({ ...o, d: Math.max(0.03, e.t - o.t) }); open.delete(key); }
        }
        for (const o of open.values()) notes.push({ ...o, d: Math.max(0.03, last - o.t) });
        if (notes.length < S.rec.minNotes || typeof Midi === 'undefined') return null;
        notes.sort((a, b) => a.t - b.t);
        const midi = new Midi();
        try { midi.header.setTempo(120); } catch (e) { /* default */ }
        const tracks = new Map();
        const getTrack = (u) => {
            const tid = S.rec.perUser ? u : 'all';
            let t = tracks.get(tid);
            if (!t) { t = midi.addTrack(); t.name = S.rec.perUser ? (rec.users.get(u) || 'Player') : 'Recording'; tracks.set(tid, t); }
            return t;
        };
        for (const n of notes) getTrack(n.u).addNote({ midi: n.k, time: n.t, duration: n.d, velocity: clamp(n.v / 127, 0.01, 1) });
        for (const e of ev) if (e.ped !== undefined) { try { getTrack(e.u).addCC({ number: 64, value: e.ped ? 1 : 0, time: e.t }); } catch (x) { /* ignore */ } }
        const arr = midi.toArray();
        const d = new Date(rec.started);
        const p2 = (n) => (n < 10 ? '0' : '') + n;
        const name = `Recording ${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}.${p2(d.getMinutes())}${rec.room ? ' - ' + rec.room : ''}.mid`;
        return { name, buf: arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength), notes: notes.length, duration: last, tracks: tracks.size, users: tracks.size };
    }
    function recStopBuild() {
        const wasOn = rec.on;
        rec.on = false;
        const r = wasOn ? recBuild() : null;
        rec.ev = [];
        bus.emit('rec');
        return r;
    }
    function download(name, buf) {
        const blob = new Blob([buf], { type: 'audio/midi' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }

    /* =====================================================================
     * 5. LIBRARY (IndexedDB, recently played)
     * ===================================================================== */
    /* ---- cross-origin helper: Tampermonkey's GM_xmlhttpRequest is not blocked by CORS ---- */
    const gmReq = (typeof GM_xmlhttpRequest === 'function') ? GM_xmlhttpRequest
        : (typeof GM !== 'undefined' && GM && typeof GM.xmlHttpRequest === 'function') ? GM.xmlHttpRequest : null;
    function httpReq(url, type) {
        return new Promise((resolve, reject) => {
            const bin = type === 'buffer';
            if (gmReq) {
                try {
                    gmReq({
                        method: 'GET', url, responseType: bin ? 'arraybuffer' : 'text', timeout: 30000,
                        onload: (r) => { if (r.status >= 200 && r.status < 300) resolve({ data: r.response, url: r.finalUrl || url }); else reject(new Error('HTTP ' + r.status)); },
                        onerror: () => reject(new Error('network error')),
                        ontimeout: () => reject(new Error('timed out')),
                    });
                } catch (e) { reject(e); }
            } else {
                fetch(url).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return bin ? r.arrayBuffer() : r.text(); }).then((d) => resolve({ data: d, url }), reject);
            }
        });
    }
    const trackTr = new Int8Array(256);

    const DB = {
        p: null,
        open() {
            if (this.p) return this.p;
            this.p = new Promise((res, rej) => {
                try {
                    const rq = indexedDB.open('pvx-studio', 1);
                    rq.onupgradeneeded = () => { const d = rq.result; d.createObjectStore('meta', { keyPath: 'id' }); d.createObjectStore('data'); };
                    rq.onsuccess = () => res(rq.result);
                    rq.onerror = () => rej(rq.error);
                } catch (e) { rej(e); }
            });
            return this.p;
        },
        async all() { const d = await this.open(); return new Promise((res, rej) => { const rq = d.transaction('meta').objectStore('meta').getAll(); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); }); },
        async get(id) { const d = await this.open(); return new Promise((res, rej) => { const rq = d.transaction('data').objectStore('data').get(id); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); }); },
        async put(meta, buf) {
            const d = await this.open();
            return new Promise((res, rej) => {
                const tx = d.transaction(['meta', 'data'], 'readwrite');
                tx.objectStore('meta').put(meta);
                if (buf) tx.objectStore('data').put(buf, meta.id);
                tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
            });
        },
        async del(id) {
            const d = await this.open();
            return new Promise((res, rej) => {
                const tx = d.transaction(['meta', 'data'], 'readwrite');
                tx.objectStore('meta').delete(id); tx.objectStore('data').delete(id);
                tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
            });
        },
        async clear() {
            const d = await this.open();
            return new Promise((res, rej) => {
                const tx = d.transaction(['meta', 'data'], 'readwrite');
                tx.objectStore('meta').clear(); tx.objectStore('data').clear();
                tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
            });
        },
    };
    let libItems = [];
    DB.all().then((a) => { libItems = a || []; bus.emit('lib'); }).catch(() => { /* IndexedDB unavailable */ });

    async function libUpsert(meta, buf) {
        const ex = libItems.find((x) => x.id === meta.id);
        const m = Object.assign({ added: Date.now(), plays: 0, pinned: false }, ex || {}, meta);
        m.played = Date.now();
        m.plays = (ex ? ex.plays : 0) + 1;
        const keep = !!(buf && S.lib.store && buf.byteLength <= S.lib.maxMB * 1048576);
        m.noData = !keep && !(ex && !ex.noData);
        if (ex) libItems[libItems.indexOf(ex)] = m; else libItems.push(m);
        try { await DB.put(m, keep ? buf : null); } catch (e) { m.noData = true; }
        await libPrune();
        bus.emit('lib');
    }
    async function libPrune() {
        const cand = libItems.filter((x) => !(S.lib.pinKeep && x.pinned)).sort((a, b) => b.played - a.played);
        const extra = cand.slice(Math.max(1, S.lib.keep));
        for (const x of extra) { libItems.splice(libItems.indexOf(x), 1); try { await DB.del(x.id); } catch (e) { /* ignore */ } }
    }

    /* =====================================================================
     * 6. PURE SCHEDULER MATH
     * ===================================================================== */
    const h01 = (i, salt, seed) => {
        let x = (Math.imul(i + 1, 374761393) + Math.imul(salt + 1, 668265263) + Math.imul(seed + 1, 2246822519)) | 0;
        x = Math.imul(x ^ (x >>> 13), 1274126177);
        x ^= x >>> 16;
        return (x >>> 0) / 4294967296;
    };
    const gz = (i, salt, seed) => (h01(i, 100 + salt * 3, seed) + h01(i, 101 + salt * 3, seed) + h01(i, 102 + salt * 3, seed) - 1.5) / 1.5;
    function drift(t, seed) {
        const per = Math.max(0.5, S.hz.driftPeriod), u = t / per, i0 = Math.floor(u), f = u - i0;
        const a = h01(i0, 500, seed) * 2 - 1, b = h01(i0 + 1, 500, seed) * 2 - 1;
        return a + (b - a) * f * f * (3 - 2 * f);
    }
    function mapPitch(p, t) {
        const pl = S.play;
        let q = p + pl.transpose + (t === undefined ? 0 : trackTr[t]);
        if (q >= pl.minNote && q <= pl.maxNote) return q;
        if (pl.oor === 'fold' && pl.maxNote - pl.minNote >= 11) {
            while (q < pl.minNote) q += 12;
            while (q > pl.maxNote) q -= 12;
            return q;
        }
        return -1;
    }

    /* =====================================================================
     * 7. UI (starts when the DOM is ready)
     * ===================================================================== */
    function startUI() {
        const ICON = {
            play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
            pause: '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
            stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none"/>',
            back: '<path d="M11 6l-6 6 6 6M19 6l-6 6 6 6"/>',
            fwd: '<path d="M13 6l6 6-6 6M5 6l6 6-6 6"/>',
            loop: '<path d="M17 3l3 3-3 3"/><path d="M4 12V10a4 4 0 0 1 4-4h12"/><path d="M7 21l-3-3 3-3"/><path d="M20 12v2a4 4 0 0 1-4 4H4"/>',
            open: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
            sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
            min: '<path d="M6 12h12"/>', restore: '<path d="M6 15l6-6 6 6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
            ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
            info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
            warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
            err: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
            clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
            chev: '<path d="M6 9l6 6 6-6"/>',
            dl: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
            trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
            star: '<path d="M12 4l2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.8 5.4-.7z"/>',
            heart: '<path d="M12 19s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 9c0 5.6-7 10-7 10z"/>',
            ext: '<path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/>',
            plus: '<path d="M12 5v14M5 12h14"/>',
            dice: '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><path d="M9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01"/>',
            up: '<path d="M6 15l6-6 6 6"/>',
            down: '<path d="M6 9l6 6 6-6"/>',
            lib: '<path d="M4 5h4v14H4zM10 5h4v14h-4z"/><path d="M16.5 6l3.5 1-3 12-3.5-1z"/>',
        };
        const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

        /* ---------- theme ---------- */
        const DARK = { tx: '#F5F5F7', tx2: '#A1A1AA', tx3: '#71717A', keyW: '#2A2A2E', keyB: '#0B0B0C', keyBEdge: '#2F2F34' };
        const LIGHT = { tx: '#18181B', tx2: '#52525B', tx3: '#8A8A94', keyW: '#E6E6EC', keyB: '#1B1B1F', keyBEdge: '#38383E', light: true };
        const T = (label, o, base) => Object.assign({ label }, base || DARK, o);
        const THEMES = {
            graphite: T('Graphite', { bg: '#0B0B0C', bg2: '#111113', panel: '#171719', elev: '#1D1D20', line: '#29292D' }),
            midnight: T('Midnight', { bg: '#0A0B0E', bg2: '#0F1115', panel: '#14161B', elev: '#1A1D23', line: '#262A32', ac: '#7AA2F7' }),
            oled: T('OLED black', { bg: '#000000', bg2: '#050506', panel: '#0C0C0E', elev: '#151518', line: '#222226' }),
            ember: T('Ember', { bg: '#0F0C0B', bg2: '#151110', panel: '#1B1614', elev: '#241D1A', line: '#322925', ac: '#F2A65A' }),
            ocean: T('Ocean', { bg: '#070C12', bg2: '#0C121A', panel: '#121A24', elev: '#1A2430', line: '#253242', ac: '#5CC8FF' }),
            forest: T('Forest', { bg: '#0A0F0C', bg2: '#0F1612', panel: '#151E19', elev: '#1C2820', line: '#2A3A30', ac: '#7BD88F' }),
            rose: T('Rose', { bg: '#120C10', bg2: '#1A1218', panel: '#221820', elev: '#2C202A', line: '#3A2C38', ac: '#F28CB1' }),
            cyber: T('Cyber', { bg: '#05080F', bg2: '#0A101A', panel: '#101820', elev: '#182028', line: '#243040', ac: '#00E5FF' }),
            lavender: T('Lavender', { bg: '#0E0C14', bg2: '#14121C', panel: '#1A1824', elev: '#221F2E', line: '#302C40', ac: '#B8A6E8' }),
            slate: T('Slate', { bg: '#0C0E12', bg2: '#12151A', panel: '#181C22', elev: '#20242C', line: '#2C323C' }),
            nord: T('Nord', { bg: '#242933', bg2: '#2A303C', panel: '#303746', elev: '#394155', line: '#434C5E', ac: '#88C0D0' }),
            dracula: T('Dracula', { bg: '#1E1F29', bg2: '#242633', panel: '#2B2D3C', elev: '#343746', line: '#44475A', ac: '#BD93F9' }),
            mocha: T('Mocha', { bg: '#14110F', bg2: '#1B1714', panel: '#231E1A', elev: '#2D2722', line: '#3B332C', ac: '#D9A877' }),
            plum: T('Plum', { bg: '#120A14', bg2: '#190F1C', panel: '#211426', elev: '#2B1B31', line: '#3A2643', ac: '#D58BE8' }),
            paper: T('Paper (light)', { bg: '#F6F6F8', bg2: '#ECECF0', panel: '#FFFFFF', elev: '#E6E6EC', line: '#D2D2DA', ac: '#5B5BD6' }, LIGHT),
            snow: T('Snow (light)', { bg: '#F2F6FA', bg2: '#E8EEF4', panel: '#FFFFFF', elev: '#DFE7EF', line: '#C9D5E0', ac: '#2F80ED' }, LIGHT),
            sand: T('Sand (light)', { bg: '#F7F3EC', bg2: '#EEE8DD', panel: '#FFFDF8', elev: '#E8E0D1', line: '#D6CCB9', ac: '#C2703D' }, LIGHT),
        };
        const C = {};
        const PAL = ['#8FB8E8', '#E8A6A6', '#A6E8B8', '#E8D6A6', '#C4A6E8', '#A6E0E8', '#E8A6D0', '#B8C4A0'].map(parseHex);

        function extractUserColor() {
            const u = document.querySelector('pv-user');
            if (u) { const c = u.style.getPropertyValue('--user-color'); if (c && parseHex(c.trim())) return c.trim(); }
            return net.me.color && parseHex(net.me.color) ? net.me.color : null;
        }
        function resolveAccent() {
            const th = THEMES[S.ui.theme] || THEMES.graphite;
            let rgb = null;
            if (S.ui.accentMode === 'player') rgb = parseHex(extractUserColor());
            else if (S.ui.accentMode === 'theme') rgb = parseHex(th.ac || '');
            if (!rgb) rgb = parseHex(S.ui.accent) || parseHex('#B8A6E8');
            if (!th.light && lum(rgb) < 0.28) rgb = mix(rgb, [255, 255, 255], 0.4);
            if (th.light && lum(rgb) > 0.72) rgb = mix(rgb, [0, 0, 0], 0.4);
            return rgb;
        }

        /* ---------- styles ---------- */
        const CSS = `
.pvx,.pvx *{box-sizing:border-box}
.pvx{--hh:3.4em;--rh:2.9em;position:fixed;z-index:2147483000;display:flex;flex-direction:column;background:var(--bg);color:var(--tx);border:1px solid var(--line);border-radius:8px;box-shadow:0 10px 28px rgba(0,0,0,.45);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,system-ui,sans-serif;line-height:1.35;overflow:hidden;user-select:none;-webkit-user-select:none;transition:height .18s cubic-bezier(.2,.8,.2,1);animation:pvx-in .22s ease-out}
.pvx.pvx-compact{--hh:2.9em;--rh:2.5em}
.pvx.pvx-hidden{display:none}
.pvx.pvx-resizing,.pvx.pvx-dragging{transition:none}
.pvx.pvx-calm,.pvx.pvx-calm *{transition:none!important;animation:none!important}
@keyframes pvx-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pvx-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes pvx-blink{50%{opacity:.25}}
.pvx svg{width:1.35em;height:1.35em;flex:none;display:block}
.pvx button,.pvx select,.pvx input{font:inherit;color:inherit}
.pvx button:focus-visible,.pvx select:focus-visible{outline:1px solid var(--ac);outline-offset:1px}
.pvx-head{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:.8em;height:var(--hh);flex:none;padding:0 .7em;background:var(--bg2);border-bottom:1px solid var(--line);cursor:grab;touch-action:none}
.pvx-dragging .pvx-head{cursor:grabbing}
.pvx-ident{display:flex;align-items:center;gap:.7em;min-width:0}
.pvx-dot{width:.55em;height:.55em;border-radius:50%;background:var(--tx3);flex:none}
.pvx-dot.ok{background:#6FBF8B}.pvx-dot.bad{background:#D9777A}
.pvx-titles{min-width:0;display:flex;flex-direction:column}
.pvx-title{font-weight:600;font-size:1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pvx-sub{font-size:.82em;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pvx-transport{display:flex;align-items:center;gap:.25em}
.pvx-wc{display:flex;align-items:center;justify-content:flex-end;gap:.15em;min-width:0}
.pvx-hmt{display:none;font:.85em ui-monospace,Menlo,Consolas,monospace;color:var(--tx2);margin-right:.5em;font-variant-numeric:tabular-nums}
.pvx-min .pvx-hmt{display:block}
.pvx-btn{display:inline-flex;align-items:center;justify-content:center;width:2.3em;height:2.3em;padding:0;background:transparent;border:1px solid transparent;border-radius:6px;color:var(--tx2);cursor:pointer;transition:background .12s,color .12s,transform .08s}
.pvx-btn:hover:not(:disabled){background:var(--elev);color:var(--tx)}
.pvx-btn:active:not(:disabled){transform:scale(.94)}
.pvx-btn:disabled{opacity:.35;cursor:default}
.pvx-btn.on{color:var(--ac);background:rgba(var(--ac-rgb),.14)}
.pvx-btn.primary{background:var(--tx);color:var(--bg);width:2.6em;border-radius:6px}
.pvx-btn.primary:hover:not(:disabled){opacity:.88}
.pvx-btn.primary:disabled{background:var(--elev);color:var(--tx3)}
.pvx-hair{position:absolute;left:0;right:0;bottom:-1px;height:2px;background:transparent;pointer-events:none}
.pvx-hair i{display:block;height:100%;width:100%;background:var(--ac);transform-origin:left;transform:scaleX(0)}
.pvx-toolbar{display:flex;align-items:center;gap:.8em;height:var(--rh);flex:none;padding:0 .8em;background:var(--bg);border-bottom:1px solid var(--line)}
.pvx-tb2{display:flex;align-items:center;flex-wrap:wrap;gap:.5em;flex:none;padding:.4em .8em;background:var(--bg);border-bottom:1px solid var(--line)}
.pvx-t{font:.9em ui-monospace,Menlo,Consolas,monospace;color:var(--tx2);font-variant-numeric:tabular-nums;min-width:3em}
.pvx-t.r{color:var(--tx3);text-align:left}
.pvx-tl{position:relative;flex:1;height:100%;min-width:80px;display:flex;align-items:center;cursor:pointer;touch-action:none}
.pvx-tl-track{position:relative;width:100%;height:.3em;background:var(--line);border-radius:2px}
.pvx-tl-region{position:absolute;top:-.1em;bottom:-.1em;display:none;background:rgba(var(--ac-rgb),.28);border-left:1px solid var(--ac);border-right:1px solid var(--ac)}
.pvx-tl-fill{position:absolute;inset:0;transform-origin:left;transform:scaleX(0);background:var(--ac);border-radius:2px}
.pvx-tl-thumb{position:absolute;top:50%;left:0;width:.85em;height:.85em;margin:-.425em 0 0 -.425em;border-radius:50%;background:var(--tx);transform:scale(0);transition:transform .12s}
.pvx-tl:hover .pvx-tl-thumb,.pvx-tl.drag .pvx-tl-thumb{transform:scale(1)}
.pvx-tl-tip{position:absolute;bottom:calc(50% + .9em);left:0;transform:translateX(-50%);padding:.15em .5em;background:var(--elev);border:1px solid var(--line);border-radius:4px;font:.85em ui-monospace,Menlo,Consolas,monospace;color:var(--tx);pointer-events:none;display:none;white-space:nowrap}
.pvx-tl:hover .pvx-tl-tip,.pvx-tl.drag .pvx-tl-tip{display:block}
.pvx-sel{appearance:none;-webkit-appearance:none;background:var(--panel) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23A1A1AA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right .45em center/.9em;border:1px solid var(--line);border-radius:6px;padding:.3em 1.7em .3em .6em;color:var(--tx);cursor:pointer;outline:none;max-width:11em;text-overflow:ellipsis;transition:border-color .12s}
.pvx-sel:hover{border-color:#3a3a40}
.pvx-sel option{background:var(--panel);color:var(--tx)}
.pvx-chip{display:inline-flex;align-items:center;gap:.45em;height:2em;padding:0 .7em;background:var(--panel);border:1px solid var(--line);border-radius:6px;color:var(--tx2);cursor:pointer;transition:background .12s,color .12s,border-color .12s;white-space:nowrap}
.pvx-chip svg{width:1.1em;height:1.1em}
.pvx-chip:hover{background:var(--elev);color:var(--tx)}
.pvx-chip i{width:.5em;height:.5em;border-radius:50%;background:var(--tx3)}
.pvx-chip.on{color:var(--tx);border-color:rgba(var(--ac-rgb),.6)}
.pvx-chip.on i{background:var(--ac)}
.pvx-chip.rec i{background:#D9777A}
.pvx-chip.rec.on{border-color:#D9777A}
.pvx-chip.rec.on i{background:#E5484D;animation:pvx-blink 1s infinite}
.pvx-seg{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.pvx-seg button{height:2em;min-width:2em;padding:0 .5em;background:var(--panel);border:0;color:var(--tx2);cursor:pointer;font-weight:600;font-size:.9em}
.pvx-seg button+button{border-left:1px solid var(--line)}
.pvx-seg button:hover{background:var(--elev);color:var(--tx)}
.pvx-seg button.on{color:var(--ac);background:rgba(var(--ac-rgb),.14)}
.pvx-stage{position:relative;flex:1;min-height:0;background:var(--bg2)}
.pvx-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.pvx-empty{position:absolute;inset:0 0 auto 0;bottom:var(--kb,56px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.8em;color:var(--tx3);text-align:center;padding:1em;pointer-events:none}
.pvx-empty button{pointer-events:auto}
.pvx-empty.hide{display:none}
.pvx-empty b{color:var(--tx2);font-weight:500}
.pvx-cta{display:inline-flex;align-items:center;gap:.5em;height:2.3em;padding:0 1em;background:var(--tx);color:var(--bg);border:0;border-radius:6px;font-weight:600;cursor:pointer;transition:background .12s,transform .08s}
.pvx-cta:hover{opacity:.88}.pvx-cta:active{transform:scale(.97)}
.pvx-drop{position:absolute;inset:.5em;border:1px dashed var(--ac);border-radius:6px;background:var(--bg);display:none;align-items:center;justify-content:center;color:var(--tx);z-index:4}
.pvx-drop.show{display:flex}
.pvx-stats{position:absolute;top:.5em;left:.5em;padding:.3em .55em;background:var(--panel);border:1px solid var(--line);border-radius:4px;font:.82em/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--tx2);white-space:pre;pointer-events:none;display:none}
.pvx-info{display:flex;align-items:center;gap:1.1em;height:2em;flex:none;padding:0 .8em;border-top:1px solid var(--line);background:var(--bg);color:var(--tx3);font-size:.88em;white-space:nowrap;overflow:hidden}
.pvx-info b{color:var(--tx2);font-weight:500}
.pvx-min .pvx-toolbar,.pvx-min .pvx-tb2,.pvx-min .pvx-stage,.pvx-min .pvx-info,.pvx-min .pvx-grip,.pvx-min .pvx-pop{display:none!important}
.pvx-nostage .pvx-stage,.pvx-nostage .pvx-info,.pvx-nostage .pvx-grip{display:none}
.pvx-grip{position:absolute;right:0;bottom:0;width:1.1em;height:1.1em;cursor:nwse-resize;touch-action:none;z-index:3;background:linear-gradient(135deg,transparent 55%,var(--tx3) 55%,var(--tx3) 62%,transparent 62%,transparent 72%,var(--tx3) 72%,var(--tx3) 79%,transparent 79%);opacity:.6}
.pvx-grip:hover{opacity:1}
.pvx-pop{position:absolute;z-index:8;display:none;flex-direction:column;width:26em;max-width:calc(100% - 1em);max-height:68%;background:var(--panel);border:1px solid var(--line);border-radius:8px;box-shadow:0 12px 30px rgba(0,0,0,.55);overflow:hidden}
.pvx-pop.open{display:flex;animation:pvx-fade .14s ease-out}
.pvx-pop-h{display:flex;align-items:center;gap:.4em;padding:.5em .6em;border-bottom:1px solid var(--line);flex:none}
.pvx-pop-h .sp{flex:1}
.pvx-pop-list{overflow:auto;flex:1;min-height:3em}
.pvx-pop-list::-webkit-scrollbar{width:8px}.pvx-pop-list::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px}
.pvx-item{display:flex;align-items:center;gap:.6em;padding:.5em .7em;cursor:pointer;border-bottom:1px solid var(--line)}
.pvx-item:hover{background:var(--elev)}
.pvx-item.cur{box-shadow:inset 2px 0 0 var(--ac)}
.pvx-item .nm{flex:1;min-width:0}
.pvx-item .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pvx-item .m{font-size:.85em;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pvx-ia{display:flex;gap:.1em;flex:none}
.pvx-ia .pvx-btn{width:1.9em;height:1.9em}
.pvx-ia .pvx-btn svg{width:1.1em;height:1.1em}
.pvx-ia .pvx-btn.pin{color:#E3C56F}
.pvx-emptyl{padding:1.2em;color:var(--tx3);text-align:center;font-size:.92em}
.pvx-set{position:absolute;inset:0;z-index:6;display:none;flex-direction:column;background:var(--bg)}
.pvx-set.open{display:flex;animation:pvx-fade .16s ease-out}
.pvx-sethead{display:flex;align-items:center;justify-content:space-between;height:var(--hh);flex:none;padding:0 .8em 0 1em;background:var(--bg2);border-bottom:1px solid var(--line);font-weight:600}
.pvx-setbody{flex:1;min-height:0;display:grid;grid-template-columns:11em 1fr}
.pvx-nav{display:flex;flex-direction:column;gap:.1em;padding:.7em;border-right:1px solid var(--line);background:var(--bg2);overflow:auto}
.pvx-nav button{display:block;width:100%;text-align:left;padding:.5em .7em;background:transparent;border:0;border-radius:6px;color:var(--tx2);cursor:pointer;transition:background .12s,color .12s}
.pvx-nav button:hover{background:var(--panel);color:var(--tx)}
.pvx-nav button.on{background:var(--elev);color:var(--tx);box-shadow:inset 2px 0 0 var(--ac)}
.pvx-pane{overflow:auto;padding:.4em 1.2em 1.2em}
.pvx-pane::-webkit-scrollbar{width:8px}.pvx-pane::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px}
.pvx-sec{display:none}.pvx-sec.on{display:block}
.pvx-sec h4{margin:1.2em 0 .2em;font-size:.82em;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--tx3)}
.pvx-row{display:flex;align-items:center;justify-content:space-between;gap:1em;padding:.65em 0;border-bottom:1px solid var(--line)}
.pvx-lab{min-width:0}
.pvx-hint{font-size:.85em;color:var(--tx3);margin-top:.1em}
.pvx-note{padding:.8em 0;color:var(--tx3);font-size:.9em;border-bottom:1px solid var(--line)}
.pvx-note kbd{font:.9em ui-monospace,Menlo,Consolas,monospace;padding:.05em .35em;border:1px solid var(--line);border-radius:4px;background:var(--panel);color:var(--tx2)}
.pvx-ctl{display:flex;align-items:center;gap:.7em;flex:none}
.pvx-val{min-width:4.2em;text-align:right;font:.9em ui-monospace,Menlo,Consolas,monospace;color:var(--tx2);font-variant-numeric:tabular-nums}
.pvx-sw{position:relative;width:2.3em;height:1.3em;flex:none;padding:0;border:0;border-radius:1em;background:var(--line);cursor:pointer;transition:background .15s}
.pvx-sw::after{content:"";position:absolute;top:.15em;left:.15em;width:1em;height:1em;border-radius:50%;background:var(--tx);transition:transform .15s}
.pvx-sw.on{background:var(--ac)}.pvx-sw.on::after{transform:translateX(1em);background:var(--bg)}
.pvx-range{-webkit-appearance:none;appearance:none;width:11em;height:.3em;border-radius:2px;outline:none;cursor:pointer;background:linear-gradient(to right,var(--ac) var(--f,0%),var(--line) var(--f,0%))}
.pvx-range::-webkit-slider-thumb{-webkit-appearance:none;width:.9em;height:.9em;border-radius:50%;background:var(--tx);border:0;transition:transform .12s}
.pvx-range::-webkit-slider-thumb:hover{transform:scale(1.2)}
.pvx-range::-moz-range-thumb{width:.9em;height:.9em;border-radius:50%;background:var(--tx);border:0}
.pvx-color{width:2.4em;height:1.7em;padding:0;border:1px solid var(--line);border-radius:6px;background:var(--panel);cursor:pointer}
.pvx-color:disabled{opacity:.4;cursor:default}
.pvx-act{padding:.4em .85em;background:var(--panel);border:1px solid var(--line);border-radius:6px;cursor:pointer;color:var(--tx);transition:background .12s,transform .08s}
.pvx-act:hover{background:var(--elev)}.pvx-act:active{transform:scale(.97)}
.pvx-act.warn{color:#E0B4B6}
.pvx-act.on{color:var(--ac);border-color:var(--ac)}
.pvx-input{background:var(--elev);border:1px solid var(--line);border-radius:6px;padding:.4em .7em;color:var(--tx);outline:none;min-width:0;user-select:text;-webkit-user-select:text}
.pvx-input:focus{border-color:var(--ac)}
.pvx-drawer{z-index:2147482999;width:20em;height:28em;max-height:calc(100vh - 16px);border-radius:8px 0 0 8px;transform:translateX(var(--slide,0px));opacity:0;pointer-events:none;animation:none;transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .26s ease;box-shadow:-12px 12px 30px rgba(0,0,0,.45);font-size:12px}
.pvx-drawer .pvx-item{padding:.35em .55em;gap:.4em}
.pvx-drawer .pvx-item .t{font-size:12px}
.pvx-drawer .pvx-item .m{font-size:10px}
.pvx-drawer .pvx-dr-h{height:2.4em;font-size:12px;padding:0 .4em 0 .7em}
.pvx-drawer .pvx-dr-tabs{padding:.4em .45em 0}
.pvx-drawer .pvx-dr-tabs .pvx-seg button{height:1.7em;font-size:.85em}
.pvx-drawer .pvx-dr-bar{padding:.4em .45em}
.pvx-drawer .pvx-input{font-size:12px;padding:.3em .5em}
.pvx-drawer .pvx-dr-chips{padding:0 .45em .4em}
.pvx-drawer .pvx-dr-chips button{height:1.55em;font-size:.8em;padding:0 .5em}
.pvx-drawer .pvx-dr-f{font-size:10px;padding:.3em .55em}
.pvx-drawer .pvx-btn{width:1.7em;height:1.7em}
.pvx-drawer .pvx-btn svg{width:1em;height:1em}
.pvx-drawer .pvx-emptyl{font-size:11px;padding:.8em}
.pvx-loader{
  position:fixed;inset:0;z-index:2147483640;display:none;align-items:center;justify-content:center;
  background:rgba(8,8,10,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
}
.pvx-loader.show{display:flex}
.pvx-loader-card{
  width:min(340px,90vw);padding:1.1em 1.25em;border-radius:12px;
  background:#171719;border:1px solid #29292D;color:#F5F5F7;
  box-shadow:0 16px 40px rgba(0,0,0,.5);
}
.pvx-loader-card .t{font-weight:600;font-size:13px;margin-bottom:.35em}
.pvx-loader-card .s{font-size:11px;color:#A1A1AA;margin-bottom:.7em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pvx-loader-bar{height:6px;border-radius:999px;background:#29292D;overflow:hidden}
.pvx-loader-bar>i{display:block;height:100%;width:0%;background:linear-gradient(90deg,var(--ac,#B8A6E8),#E8E4F5);border-radius:999px;transition:width .15s ease}
.pvx-loader-pct{margin-top:.45em;font:11px ui-monospace,Menlo,Consolas,monospace;color:#A1A1AA;text-align:right}

.pvx-drawer.right{border-radius:0 8px 8px 0;box-shadow:12px 12px 30px rgba(0,0,0,.45)}
.pvx-drawer.open{transform:none;opacity:1;pointer-events:auto}
.pvx-drawer.pvx-calm{transition:none!important}
.pvx-dr-h{display:flex;align-items:center;gap:.6em;height:3em;flex:none;padding:0 .5em 0 1em;background:var(--bg2);border-bottom:1px solid var(--line);font-weight:600}
.pvx-dr-h .sub{flex:1;min-width:0;font-weight:400;color:var(--tx3);font-size:.85em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pvx-dr-tabs{padding:.55em .6em 0;flex:none}
.pvx-dr-tabs .pvx-seg{display:flex;width:100%}
.pvx-dr-tabs .pvx-seg button{flex:1;padding:0 .2em}
.pvx-dr-bar{display:flex;gap:.4em;padding:.55em .6em;flex:none;align-items:center}
.pvx-dr-bar .pvx-input{flex:1}
.pvx-dr-chips{display:flex;gap:.35em;flex-wrap:wrap;padding:0 .6em .55em;flex:none}
.pvx-dr-chips button{height:1.8em;padding:0 .65em;border-radius:1em;background:var(--panel);border:1px solid var(--line);color:var(--tx2);cursor:pointer;font-size:.9em}
.pvx-dr-chips button:hover{color:var(--tx);background:var(--elev)}
.pvx-dr-list{flex:1;min-height:0;overflow:auto;border-top:1px solid var(--line)}
.pvx-dr-list::-webkit-scrollbar{width:8px}.pvx-dr-list::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px}
.pvx-dr-url{display:flex;gap:.4em;padding:.5em .6em;border-top:1px solid var(--line);flex:none}
.pvx-dr-url .pvx-input{flex:1}
.pvx-dr-f{padding:.4em .8em;border-top:1px solid var(--line);color:var(--tx3);font-size:.82em;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pvx-dr-qh{display:flex;gap:.4em;padding:.6em .7em;border-bottom:1px solid var(--line);flex-wrap:wrap}
.pvx-spin{width:1.1em;height:1.1em;border:2px solid var(--line);border-top-color:var(--ac);border-radius:50%;animation:pvx-spin .8s linear infinite;margin:0 auto .6em}
@keyframes pvx-spin{to{transform:rotate(360deg)}}
.pvx-ia .pvx-btn.fav{color:#E5707F}
.pvx-qn{width:1.6em;text-align:center;color:var(--tx3);font:.85em ui-monospace,Menlo,Consolas,monospace;flex:none}
.pvx-dock{position:fixed;z-index:40;display:none;pointer-events:none}
html.pvx-dock-on pv-keys{opacity:0!important}
html.pvx-dock-on pv-canvas .bg-canvas,html.pvx-dock-on pv-canvas .fg-canvas,html.pvx-dock-on pv-canvas pv-note{visibility:hidden!important}
/* Dock mode: hide the floating Studio completely; controls live in the player list sidebar */
html.pvx-dock-on #pvx-root{display:none!important}
html.pvx-dock-on #pvx-drawer:not(.pvx-dock-lib){display:none!important}
.pvx-dockbar{display:flex;flex-direction:column;height:100%;min-height:0;background:linear-gradient(180deg,var(--bg2,#111113) 0%,var(--bg,#0B0B0C) 42%);color:var(--tx,#F5F5F7);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,system-ui,sans-serif;font-size:12px;overflow:hidden;border-radius:12px;border:1px solid var(--line,#29292D);border-left:3px solid var(--ac,#B8A6E8);box-shadow:0 12px 40px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.04)}
.pvx-dockbar .pvx-db-head{display:flex;align-items:center;gap:.45em;padding:.55em .65em;border-bottom:1px solid var(--line,#29292D);background:var(--panel,#171719);flex:none}
.pvx-dockbar .pvx-db-dot{width:.55em;height:.55em;border-radius:50%;background:var(--ac);box-shadow:0 0 8px var(--ac);flex:none}
.pvx-dockbar .pvx-db-title{font-weight:600;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:1.02em}
.pvx-dockbar .pvx-db-sub{font-size:.78em;color:var(--tx3,#71717A);margin-top:.05em}
.pvx-dockbar .pvx-db-transport{display:flex;align-items:center;gap:.2em;padding:.45em .55em;border-bottom:1px solid var(--line,#29292D);background:rgba(0,0,0,.18);flex:none}
.pvx-dockbar .pvx-db-time{font:11px ui-monospace,Menlo,Consolas,monospace;color:var(--tx2,#A1A1AA);min-width:5.2em;text-align:center;font-variant-numeric:tabular-nums;margin-left:auto;padding:.15em .4em;background:var(--elev,#1D1D20);border-radius:4px;border:1px solid var(--line)}
.pvx-dockbar .pvx-db-chips{display:flex;flex-wrap:wrap;gap:.35em;padding:.5em .55em;border-bottom:1px solid var(--line,#29292D);flex:none}
.pvx-dockbar .pvx-db-chips .pvx-chip{height:1.85em;font-size:.88em;padding:0 .65em;background:var(--panel,#171719);border:1px solid var(--line,#29292D);border-radius:6px;color:var(--tx2,#A1A1AA);cursor:pointer;transition:background .12s,color .12s,border-color .12s,box-shadow .12s;display:inline-flex;align-items:center;gap:.35em}
.pvx-dockbar .pvx-db-chips .pvx-chip:hover{background:var(--elev,#1D1D20);color:var(--tx);border-color:#3a3a40}
.pvx-dockbar .pvx-db-chips .pvx-chip.on{color:var(--tx);border-color:rgba(var(--ac-rgb),0.7);background:rgba(var(--ac-rgb),0.18);box-shadow:0 0 0 1px rgba(var(--ac-rgb),0.25),inset 0 0 12px rgba(var(--ac-rgb),0.08)}
.pvx-dockbar .pvx-db-chips .pvx-chip.on i{background:var(--ac);box-shadow:0 0 6px var(--ac)}
.pvx-dockbar .pvx-db-chips .pvx-chip.rec.on{border-color:#E5484D;background:rgba(229,72,77,.18);color:#F5B0B2;box-shadow:0 0 0 1px rgba(229,72,77,.35)}
.pvx-dockbar .pvx-db-chips .pvx-chip.rec.on i{background:#E5484D;box-shadow:0 0 6px #E5484D;animation:pvx-blink 1s infinite}
.pvx-dockbar .pvx-db-chips .pvx-chip i{width:.45em;height:.45em;border-radius:50%;background:var(--tx3);flex:none}
.pvx-dockbar .pvx-db-chips .pvx-chip svg{width:1.05em;height:1.05em}
.pvx-dockbar .pvx-db-lib{flex:1;min-height:0;display:none;flex-direction:column;overflow:hidden;background:var(--bg)}
.pvx-dockbar .pvx-db-lib.open{display:flex}
.pvx-dockbar .pvx-db-lib .pvx-dr-list{flex:1;min-height:0;overflow:auto}
.pvx-dockbar .pvx-btn{width:2em;height:2em;border-radius:6px;color:var(--tx2);border:1px solid transparent}
.pvx-dockbar .pvx-btn:hover:not(:disabled){background:var(--elev);color:var(--tx);border-color:var(--line)}
.pvx-dockbar .pvx-btn.primary{width:2.35em;background:var(--tx);color:var(--bg);border-color:transparent}
.pvx-dockbar .pvx-btn.primary:hover:not(:disabled){opacity:.9}
.pvx-dockbar .pvx-btn svg{width:1.2em;height:1.2em}
.pvx-dockbar .pvx-db-status{padding:.35em .65em;font-size:.8em;color:var(--tx3);border-top:1px solid var(--line);flex:none;background:var(--bg2)}
.pvx-dockbar .pvx-db-status b{color:var(--tx2);font-weight:500}
/* Hide the real player list while our overlay covers the sidebar */
html.pvx-dock-users-hidden pv-users,
html.pvx-dock-users-hidden .chat pv-users,
html.pvx-dock-on pv-users{visibility:hidden!important;pointer-events:none!important}
html.pvx-dock-on .chat{position:relative}
/* ========== Full Siphon Studio site theme (always on) ========== */
html.pvx-siphon,
html.pvx-siphon body{
  background:var(--pvx-bg,#0B0B0C)!important;
  color:var(--pvx-tx,#F5F5F7)!important;
}
html.pvx-siphon body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,system-ui,sans-serif!important}
/* Header */
html.pvx-siphon pv-header{
  background:linear-gradient(180deg,var(--pvx-panel,#171719) 0%,var(--pvx-bg2,#111113) 100%)!important;
  border-bottom:1px solid var(--pvx-line,#29292D)!important;
  box-shadow:0 1px 0 rgba(255,255,255,.03)!important;
  display:flex!important;align-items:center!important;gap:.5em!important;
}
html.pvx-siphon pv-header .title{font-size:0!important;position:relative}
html.pvx-siphon pv-header .title::after{content:'Siphon Studio v29.0';font-size:15px;font-weight:600;letter-spacing:.03em;color:var(--pvx-tx,#F5F5F7)}
html.pvx-siphon pv-header .pianoverse svg{display:none!important}
html.pvx-siphon pv-header .left,html.pvx-siphon pv-header .right{align-items:center;display:flex;gap:.4em}
html.pvx-siphon pv-header button,
html.pvx-siphon pv-header .btn,
html.pvx-siphon pv-header a{
  background:var(--pvx-elev,#1D1D20)!important;color:var(--pvx-tx2,#A1A1AA)!important;border:1px solid var(--pvx-line,#29292D)!important;border-radius:8px!important;
}
html.pvx-siphon pv-header button:hover,
html.pvx-siphon pv-header .btn:hover{color:var(--pvx-tx,#F5F5F7)!important;border-color:#3a3a40!important}
/* FPS chip in header */
#pvx-fps{
  font:11px ui-monospace,Menlo,Consolas,monospace;color:var(--pvx-tx2,#A1A1AA);
  background:var(--pvx-elev,#1D1D20);border:1px solid var(--pvx-line,#29292D);
  border-radius:6px;padding:.2em .55em;margin-left:.35em;white-space:nowrap;
  letter-spacing:.02em;user-select:none;
}
#pvx-fps b{color:var(--ac,#B8A6E8);font-weight:600}
#pvx-hdr-toggles{display:inline-flex;align-items:center;gap:4px;margin-left:6px}
.pvx-hdr-tog{
  font:10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  color:var(--pvx-tx2,#A1A1AA);background:var(--pvx-elev,#1D1D20);
  border:1px solid var(--pvx-line,#29292D);border-radius:6px;
  padding:3px 7px;cursor:pointer;user-select:none;letter-spacing:.02em;
  transition:background .12s,color .12s,border-color .12s;
}
.pvx-hdr-tog:hover{color:var(--pvx-tx,#F5F5F7);border-color:#3a3a40}
.pvx-hdr-tog.on{color:var(--pvx-tx,#F5F5F7);border-color:rgba(var(--ac-rgb,184,166,232),.7);background:rgba(var(--ac-rgb,184,166,232),.16)}
.pvx-hdr-tog.perf.on{border-color:#6FBF8B;background:rgba(111,191,139,.15);color:#B6E6C5}
.pvx-hdr-tog#pvx-tog-freeze.on{border-color:#D8B25E;background:rgba(216,178,94,.16);color:#E8D7A0}
.pvx-hdr-tog#pvx-tog-cursor.on{border-color:#7EB6FF;background:rgba(126,182,255,.16);color:#B7D6FF}
.pvx-hdr-tog#pvx-tog-bm.on{border-color:#FF6B8A;background:rgba(255,107,138,.16);color:#FFB3C3}
/* Boot splash */
#pvx-boot{
  position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(120% 100% at 50% 0%,#1a1630 0%,#0a0a10 55%,#07070c 100%);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#EDE9F7;
  transition:opacity .55s ease,visibility .55s ease;
}
#pvx-boot.done{opacity:0;visibility:hidden;pointer-events:none}
.pvx-boot-card{width:min(380px,calc(100vw - 36px));text-align:center;padding:28px 24px 22px}
.pvx-boot-logo{
  width:72px;height:72px;border-radius:20px;margin:0 auto 18px;display:block;
  box-shadow:0 12px 40px rgba(107,92,173,.45),0 0 0 1px rgba(184,166,232,.25);
  opacity:1;
}
@keyframes pvx-boot-pulse{
  0%,100%{opacity:1}
  50%{opacity:.88}
}
.pvx-boot-title{font-size:22px;font-weight:700;letter-spacing:-.02em;margin:0 0 4px}
.pvx-boot-sub{font-size:13px;color:#9b97ad;margin:0 0 18px}
.pvx-boot-bar{
  height:4px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin:0 8px 12px;
}
.pvx-boot-bar>i{
  display:block;height:100%;width:0%;border-radius:inherit;
  background:linear-gradient(90deg,#6B5CAD,#B8A6E8,#E8D7FF);
  box-shadow:0 0 12px rgba(184,166,232,.6);
  transition:width .25s ease;
}
.pvx-boot-stage{font-size:12px;color:#B8A6E8;letter-spacing:.06em;text-transform:uppercase;min-height:1.2em}
.pvx-boot-ring{
  width:56px;height:56px;margin:0 auto 16px;border-radius:50%;
  border:2px solid rgba(184,166,232,.2);border-top-color:#B8A6E8;
  animation:pvx-boot-spin .9s linear infinite;
}
@keyframes pvx-boot-spin{to{transform:rotate(360deg)}}
/* Skin transition overlay — staged checklist */
#pvx-skin-fx{
  position:fixed;inset:0;z-index:2147483645;pointer-events:none;opacity:0;
  background:rgba(6,6,12,.55);
  backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px);
  transition:opacity .25s ease, backdrop-filter .45s ease;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
}
#pvx-skin-fx.on{opacity:1;pointer-events:auto;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
#pvx-skin-fx .wave{
  position:absolute;inset:-30%;
  background:
    radial-gradient(circle at 30% 20%, rgba(184,166,232,.28), transparent 40%),
    radial-gradient(circle at 70% 80%, rgba(107,92,173,.22), transparent 45%),
    conic-gradient(from 0deg, transparent, rgba(184,166,232,.1), transparent 35%);
  animation:pvx-boot-spin 3.2s linear infinite;opacity:.9;
}
#pvx-skin-fx .core{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:min(420px,calc(100vw - 32px));
  background:linear-gradient(165deg,#161622ee,#0e0e16f2);
  border:1px solid rgba(184,166,232,.28);
  border-radius:18px;padding:22px 22px 18px;
  box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 50px rgba(107,92,173,.2);
  color:#F0ECFA;
}
#pvx-skin-fx .ring{
  width:54px;height:54px;margin:0 auto 12px;border-radius:50%;
  border:2px solid rgba(184,166,232,.22);
  border-top-color:#B8A6E8;border-right-color:#6B5CAD;
  animation:pvx-boot-spin .65s linear infinite;
  box-shadow:0 0 28px rgba(107,92,173,.4);
}
#pvx-skin-fx .lbl{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;text-align:center}
#pvx-skin-fx .sub{font-size:12.5px;color:#B8A6E8;margin-top:6px;text-align:center;min-height:1.3em}
#pvx-skin-fx .steps{margin:16px 0 8px;display:flex;flex-direction:column;gap:8px}
#pvx-skin-fx .step{
  display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);
  font-size:13px;color:#9a97a8;transition:background .2s,color .2s,border-color .2s;
}
#pvx-skin-fx .step .dot{
  width:18px;height:18px;border-radius:50%;flex:none;
  border:2px solid rgba(184,166,232,.3);display:grid;place-items:center;
  font-size:10px;color:transparent;
}
#pvx-skin-fx .step.active{color:#EDE9F7;background:rgba(184,166,232,.1);border-color:rgba(184,166,232,.28)}
#pvx-skin-fx .step.active .dot{border-color:#B8A6E8;box-shadow:0 0 10px rgba(184,166,232,.5);animation:pvx-boot-pulse 1s ease-in-out infinite}
#pvx-skin-fx .step.done{color:#c8e6d0}
#pvx-skin-fx .step.done .dot{background:#6FBF8B;border-color:#6FBF8B;color:#0b0b10;content:'✓'}
#pvx-skin-fx .step.done .dot::after{content:'✓';font-weight:700}
#pvx-skin-fx .bar{height:3px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:10px}
#pvx-skin-fx .bar>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#6B5CAD,#B8A6E8);transition:width .35s ease}
/* Tutorial */
#pvx-tut{
  position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;
  background:rgba(5,5,10,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#EDE9F7;
}
.pvx-tut-card{
  width:min(520px,calc(100vw - 28px));max-height:min(86vh,700px);
  display:flex;flex-direction:column;border-radius:18px;overflow:hidden;
  background:linear-gradient(165deg,#15151f,#0c0c14);
  border:1px solid rgba(184,166,232,.28);
  box-shadow:0 28px 80px rgba(0,0,0,.6);
}
.pvx-tut-head{padding:18px 20px 12px;border-bottom:1px solid rgba(255,255,255,.06);background:radial-gradient(100% 80% at 0% 0%,rgba(184,166,232,.15),transparent 55%)}
.pvx-tut-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#B8A6E8;font-weight:600}
.pvx-tut-title{font-size:20px;font-weight:700;margin:4px 0 0;letter-spacing:-.02em}
.pvx-tut-body{padding:16px 20px;overflow:auto;flex:1;font-size:14px;line-height:1.55;color:#c9c5d6}
.pvx-tut-body ul{margin:10px 0 0;padding-left:1.15em}
.pvx-tut-body li{margin:.35em 0}
.pvx-tut-body kbd{font:11px ui-monospace,Menlo,monospace;background:rgba(255,255,255,.08);padding:1px 6px;border-radius:4px}
.pvx-tut-dots{display:flex;gap:6px;justify-content:center;padding:4px 0 10px}
.pvx-tut-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.15)}
.pvx-tut-dots i.on{background:#B8A6E8;box-shadow:0 0 8px rgba(184,166,232,.6)}
.pvx-tut-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 16px 16px;border-top:1px solid rgba(255,255,255,.06)}
.pvx-tut-foot .pvx-upd-btn{border:0;cursor:pointer;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:600;font-family:inherit}
.pvx-tut-foot .ghost{background:rgba(255,255,255,.06);color:#d8d5e4}
.pvx-tut-foot .primary{background:linear-gradient(135deg,#6B5CAD,#B8A6E8);color:#0b0b10}
.pvx-tut-foot .warn{background:rgba(216,178,94,.12);color:#F5E6A3;border:1px solid rgba(216,178,94,.28)}
.pvx-tut-skip-warn{
  position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.55);
}
.pvx-tut-skip-warn .box{
  width:min(360px,calc(100vw - 32px));background:#16161f;border:1px solid rgba(216,178,94,.35);
  border-radius:14px;padding:18px;color:#F0ECFA;box-shadow:0 20px 50px rgba(0,0,0,.5);
}
/* Visual tour spotlight */
#pvx-tour{position:fixed;inset:0;z-index:2147483646;pointer-events:none}
#pvx-tour .shade{
  position:absolute;inset:0;background:rgba(0,0,0,.58);
  transition:clip-path .28s ease, background .28s ease;
}
#pvx-tour .ring{
  position:absolute;border:2px solid #B8A6E8;border-radius:10px;
  box-shadow:0 0 0 1px rgba(0,0,0,.4),0 0 0 6px rgba(184,166,232,.15);
  pointer-events:none;transition:all .28s ease;
}
#pvx-tour .tip{
  position:absolute;max-width:min(320px,calc(100vw - 24px));
  background:#14141c;border:1px solid rgba(255,255,255,.1);border-radius:12px;
  padding:14px 14px 12px;color:#E8E6F0;pointer-events:auto;
  box-shadow:0 16px 40px rgba(0,0,0,.5);font:13.5px/1.45 ui-sans-serif,system-ui,sans-serif;
  transition:opacity .2s ease, transform .28s ease;
}
#pvx-tour .tip h3{margin:0 0 6px;font-size:14px;font-weight:650;letter-spacing:-.01em}
#pvx-tour .tip p{margin:0;color:#a8a5b5;font-size:13px;line-height:1.45}
#pvx-tour .tip .nav{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}
#pvx-tour .tip button{
  border:0;cursor:pointer;border-radius:8px;padding:7px 12px;font:12.5px/1 system-ui,sans-serif;font-weight:600;
}
#pvx-tour .tip .g{background:rgba(255,255,255,.07);color:#d4d1de}
#pvx-tour .tip .p{background:#E8E6F0;color:#111}
#pvx-tour .tip .s{background:transparent;color:#9a97a8;text-decoration:underline;padding-left:4px}
#pvx-tour .stepn{font-size:11px;color:#8b8899;margin-bottom:4px;letter-spacing:.04em}



/* Dock mode: organize top bar */
html.pvx-dock-on pv-header .left{order:1;flex:1;min-width:0}
html.pvx-dock-on pv-header .right{order:3}
html.pvx-dock-on #pvx-fps{order:2;margin-left:auto;margin-right:.5em}
html.pvx-dock-on pv-header .pianoverse{display:flex;align-items:center;gap:.4em}
/* Main stage / piano area */
html.pvx-siphon main.app,
html.pvx-siphon .app,
html.pvx-siphon pv-piano,
html.pvx-siphon .stage{
  background:var(--pvx-bg,#0B0B0C)!important;
}
html.pvx-siphon pv-canvas{border-radius:10px;overflow:hidden}
html.pvx-siphon pv-keys{border-radius:0 0 10px 10px}
/* Toolbar under piano */
html.pvx-siphon pv-toolbar,
html.pvx-siphon pv-toolbar .toolbar{
  background:var(--pvx-bg2,#111113)!important;
  border-top:1px solid var(--pvx-line,#29292D)!important;
  color:var(--pvx-tx2,#A1A1AA)!important;
}
html.pvx-siphon pv-toolbar button,
html.pvx-siphon pv-toolbar .btn{
  background:var(--pvx-panel,#171719)!important;color:var(--pvx-tx2,#A1A1AA)!important;border:1px solid var(--pvx-line,#29292D)!important;border-radius:7px!important;
}
html.pvx-siphon pv-toolbar button:hover{color:var(--pvx-tx,#F5F5F7)!important}
/* Chat column */
html.pvx-siphon .chat{
  background:var(--pvx-bg2,#111113)!important;
  border-left:1px solid var(--pvx-line,#29292D)!important;
}
html.pvx-siphon pv-chat{
  background:var(--pvx-bg,#0B0B0C)!important;
  color:var(--pvx-tx2,#A1A1AA)!important;
  opacity:1;filter:none;
  border-radius:0;
}
html.pvx-siphon pv-chat .message,
html.pvx-siphon pv-chat .msg{
  background:var(--pvx-panel,#171719)!important;
  border:1px solid var(--pvx-line,#29292D)!important;
  border-radius:8px!important;
  color:var(--pvx-tx,#F5F5F7)!important;
}
html.pvx-siphon pv-chat input,
html.pvx-siphon pv-chat textarea,
html.pvx-siphon .chat input{
  background:var(--pvx-panel,#171719)!important;color:var(--pvx-tx,#F5F5F7)!important;border:1px solid var(--pvx-line,#29292D)!important;border-radius:8px!important;
}
/* Rooms / lists / misc panels */
html.pvx-siphon pv-rooms,
html.pvx-siphon .rooms,
html.pvx-siphon .panel,
html.pvx-siphon .sidebar{
  background:var(--pvx-bg2,#111113)!important;color:var(--pvx-tx,#F5F5F7)!important;border-color:var(--pvx-line,#29292D)!important;
}
html.pvx-siphon a{color:var(--ac,#B8A6E8)}
html.pvx-siphon a:hover{filter:brightness(1.15)}
/* Scrollbars */
html.pvx-siphon *::-webkit-scrollbar{width:8px;height:8px}
html.pvx-siphon *::-webkit-scrollbar-track{background:var(--pvx-bg2,#111113)}
html.pvx-siphon *::-webkit-scrollbar-thumb{background:var(--pvx-line,#29292D);border-radius:4px}
html.pvx-siphon *::-webkit-scrollbar-thumb:hover{background:#3a3a40}
/* Dock bar polish */
html.pvx-dock-on #pvx-dockbar{
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border-radius:12px!important;
}
/* Dock-embedded library polish */
.pvx-dockbar .pvx-dock-lib{display:flex!important;flex-direction:column;height:100%;min-height:0;background:var(--bg)!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;opacity:1!important;pointer-events:auto!important}
.pvx-dockbar .pvx-dock-lib .pvx-dr-h{background:var(--panel);border-bottom:1px solid var(--line)}
.pvx-dockbar .pvx-dock-lib .pvx-dr-tabs{padding:.4em .5em 0}
.pvx-dockbar .pvx-dock-lib .pvx-dr-bar{padding:.4em .5em}
.pvx-dockbar .pvx-dock-lib .pvx-dr-list{flex:1;min-height:0;overflow:auto}
.pvx-dockbar .pvx-dock-lib .pvx-item{padding:.45em .55em}
.pvx-dockbar .pvx-dock-lib .pvx-dr-f{display:none}
/* Site motion / custom animations */
html.pvx-siphon pv-header,
html.pvx-siphon .chat,
html.pvx-siphon pv-toolbar,
html.pvx-siphon pv-chat .message,
html.pvx-siphon pv-chat .msg,
html.pvx-siphon #pvx-dockbar,
html.pvx-siphon .pvx-chip,
html.pvx-siphon .pvx-btn{
  transition: background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease, opacity .18s ease, transform .12s ease;
}
html.pvx-siphon pv-chat .message,
html.pvx-siphon pv-chat .msg{
  animation: pvx-msg-in .2s ease-out;
}
@keyframes pvx-msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
html.pvx-siphon pv-header button:hover,
html.pvx-siphon pv-toolbar button:hover{
  transform:translateY(-1px);
}
html.pvx-siphon #pvx-fps{
  transition: border-color .2s, color .2s;
}
/* list tags: no forced size animation */
/* Site branding logo */

img.pvx-siphon-logo{width:28px;height:28px;object-fit:contain;border-radius:50%;display:block;flex:none}
pv-header .pvx-siphon-logo{margin-right:8px}
/* Siphon user badge (matches site DEV/ME tags) */
/* Player-list Siphon tag: only recolor — keep site tag layout untouched */
pv-user .badges .tag.siphon{
  background:linear-gradient(135deg,var(--siphon-c1,#6B5CAD),var(--siphon-c2,#B8A6E8))!important;
  color:#0B0B0C!important;
}
pv-user .badges .tag.siphon.dev{
  background:linear-gradient(135deg,#C9A227,#F5E6A3)!important;
  color:#1a1400!important;
}
.siphon-cursor-label{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:rgba(20,20,24,.92)!important;
  color:#E8E4F5!important;
  border:1px solid rgba(184,166,232,.55)!important;
  font-weight:600!important;
  font-size:10px!important;
  letter-spacing:.08em!important;
  text-transform:uppercase!important;
  padding:3px 8px!important;
  border-radius:999px!important;
  line-height:1!important;
  height:18px!important;
  box-sizing:border-box!important;
  margin-left:6px!important;
  margin-top:8px!important;
  transform:translateY(6px)!important;
  pointer-events:none!important;
  white-space:nowrap!important;
  box-shadow:0 4px 14px rgba(0,0,0,.45)!important;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif!important;
  vertical-align:middle!important;
  gap:0!important;
  position:relative!important;
  z-index:2!important;
}
/* Own server cursor visibility is controlled by presence.showServerCursor */
html.pvx-siphon pv-cursor.pvx-my-cursor.pvx-hide-own{
  display:none!important;
  visibility:hidden!important;
  opacity:0!important;
}
.siphon-cursor-label::before{
  content:""!important;
  width:6px!important;height:6px!important;border-radius:50%!important;
  background:var(--siphon-c2,#B8A6E8)!important;
  box-shadow:0 0 6px var(--siphon-c2,#B8A6E8)!important;
  margin-right:6px!important;
  flex:none!important;
  display:inline-block!important;
}
.siphon-cursor-label.dev{
  border-color:rgba(245,230,163,.55)!important;
  color:#F5E6A3!important;
  background:rgba(20,20,24,.92)!important;
}
.siphon-cursor-label.dev::before{
  background:#F5E6A3!important;
  box-shadow:0 0 6px #F5E6A3!important;
}
pv-cursor.siphon-cursor-mark{
  outline:none!important;
}
/* Own server cursor: visible by default; can be hidden via presence.showServerCursor */
html.pvx-siphon pv-cursor.pvx-my-cursor{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:none!important;
}
/* Synthetic mirror of YOUR server cursor (site never draws your own pv-cursor) */
#pvx-server-cursor{
  position:fixed;z-index:2147483644;display:none;align-items:center;gap:6px;
  pointer-events:none!important;transform:translate(-2px,-2px);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
}
#pvx-server-cursor .dot{
  width:12px;height:12px;border-radius:50%;
  background:var(--user-color,#B8A6E8);
  box-shadow:0 0 0 2px rgba(0,0,0,.45),0 0 12px color-mix(in srgb, var(--user-color,#B8A6E8) 55%, transparent);
  flex:none;
}
#pvx-server-cursor .badge{
  background:rgba(20,20,24,.92);color:#E8E4F5;
  border:1px solid rgba(255,255,255,.12);
  font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;
  max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
#pvx-server-cursor .siphon-cursor-label{margin-top:0!important;transform:translateY(2px)!important}
#pvx-cursor-tag{
  position:fixed;
  z-index:2147483645;
  display:none;
  align-items:center;
  justify-content:center;
  background:rgba(20,20,24,.92);
  color:#E8E4F5;
  border:1px solid rgba(184,166,232,.55);
  font-weight:600;
  font-size:10px;
  letter-spacing:.08em;
  text-transform:uppercase;
  padding:3px 8px;
  border-radius:999px;
  line-height:1;
  height:18px;
  box-sizing:border-box;
  pointer-events:none;
  white-space:nowrap;
  box-shadow:0 4px 14px rgba(0,0,0,.45);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  transform:translate(18px, 22px);
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
}
#pvx-cursor-tag::before{
  content:"";
  width:6px;height:6px;border-radius:50%;
  background:var(--siphon-c2,#B8A6E8);
  box-shadow:0 0 6px var(--siphon-c2,#B8A6E8);
  margin-right:6px;
  flex:none;
}
#pvx-cursor-tag.dev{
  border-color:rgba(245,230,163,.55);
  color:#F5E6A3;
}
#pvx-cursor-tag.dev::before{
  background:#F5E6A3;
  box-shadow:0 0 6px #F5E6A3;
}

/* HDR look */
html.pvx-hdr{
  filter:contrast(1.08) saturate(1.18) brightness(1.04);
}
html.pvx-hdr #pvx-root,
html.pvx-hdr #pvx-dockbar,
html.pvx-hdr #pvx-drawer,
html.pvx-hdr #pvx-cursor-tag{
  filter:none;
}
html.pvx-hdr pv-header{
  box-shadow:0 0 24px rgba(var(--ac-rgb,184,166,232),.12)!important;
}
html.pvx-hdr #pvx-dockbar{
  box-shadow:0 12px 40px rgba(0,0,0,.55),0 0 28px rgba(var(--ac-rgb,184,166,232),.15)!important;
}
html.pvx-hdr .pvx-chip.on,
html.pvx-hdr .pvx-btn.on{
  box-shadow:0 0 12px rgba(var(--ac-rgb,184,166,232),.25);
}


/* ===== What's New / Update modal ===== */
.pvx-upd-overlay{
  position:fixed;inset:0;z-index:2147483646;
  display:flex;align-items:center;justify-content:center;
  background:rgba(4,5,10,.72);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  animation:pvx-upd-fade .28s ease-out;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,sans-serif;
}
@keyframes pvx-upd-fade{from{opacity:0}to{opacity:1}}
@keyframes pvx-upd-pop{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
.pvx-upd-card{
  width:min(560px,calc(100vw - 28px));
  max-height:min(82vh,720px);
  display:flex;flex-direction:column;
  background:linear-gradient(165deg,#14151c 0%,#0e0f16 55%,#12131a 100%);
  border:1px solid rgba(184,166,232,.28);
  border-radius:18px;
  box-shadow:0 28px 80px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04) inset,0 0 60px rgba(107,92,173,.18);
  overflow:hidden;
  animation:pvx-upd-pop .34s cubic-bezier(.2,.8,.2,1);
  color:#E8E6F0;
}
.pvx-upd-head{
  display:flex;align-items:flex-start;gap:14px;
  padding:20px 22px 14px;
  border-bottom:1px solid rgba(255,255,255,.06);
  background:radial-gradient(120% 80% at 10% -20%,rgba(184,166,232,.16),transparent 55%);
  flex:none;
}
.pvx-upd-logo{
  width:48px;height:48px;border-radius:14px;object-fit:contain;
  box-shadow:0 6px 20px rgba(0,0,0,.4);flex:none;
  background:#0b0b10;
}
.pvx-upd-head-txt{flex:1;min-width:0}
.pvx-upd-kicker{
  font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:#B8A6E8;font-weight:600;margin-bottom:4px;
}
.pvx-upd-title{font-size:20px;font-weight:700;letter-spacing:-.02em;line-height:1.2;margin:0}
.pvx-upd-sub{font-size:13px;color:#9a97a8;margin-top:4px;line-height:1.4}
.pvx-upd-x{
  width:32px;height:32px;border-radius:10px;border:0;cursor:pointer;
  background:rgba(255,255,255,.05);color:#c8c6d4;
  display:grid;place-items:center;flex:none;
  transition:background .15s,color .15s;
}
.pvx-upd-x:hover{background:rgba(255,255,255,.1);color:#fff}
.pvx-upd-body{
  flex:1;min-height:0;overflow:auto;padding:8px 8px 8px 14px;
  scrollbar-width:thin;scrollbar-color:rgba(184,166,232,.35) transparent;
}
.pvx-upd-body::-webkit-scrollbar{width:8px}
.pvx-upd-body::-webkit-scrollbar-thumb{background:rgba(184,166,232,.3);border-radius:8px}
.pvx-upd-sec{padding:12px 10px 4px}
.pvx-upd-sec h3{
  margin:0 0 8px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  color:#B8A6E8;font-weight:700;
}
.pvx-upd-sec ul{margin:0;padding:0 0 8px 0;list-style:none}
.pvx-upd-sec li{
  position:relative;padding:7px 8px 7px 22px;font-size:13.5px;line-height:1.45;color:#d5d2e0;
  border-radius:8px;
}
.pvx-upd-sec li::before{
  content:"";position:absolute;left:6px;top:14px;width:7px;height:7px;border-radius:50%;
  background:linear-gradient(135deg,#6B5CAD,#B8A6E8);
  box-shadow:0 0 8px rgba(184,166,232,.5);
}
.pvx-upd-sec li strong{color:#f0edf8;font-weight:600}
.pvx-upd-sec li em{color:#B8A6E8;font-style:normal;font-weight:600}
.pvx-upd-note{
  margin:6px 10px 12px;padding:12px 14px;border-radius:12px;
  background:rgba(184,166,232,.08);border:1px solid rgba(184,166,232,.18);
  font-size:13px;line-height:1.5;color:#c4c0d4;
}
.pvx-upd-note b{color:#E8E4F5}
.pvx-upd-foot{
  flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  padding:14px 18px 16px;border-top:1px solid rgba(255,255,255,.06);
  background:rgba(0,0,0,.2);
}
.pvx-upd-ver{font-size:12px;color:#8b8899;font-variant-numeric:tabular-nums}
.pvx-upd-actions{display:flex;gap:8px;flex-wrap:wrap}
.pvx-upd-btn{
  border:0;cursor:pointer;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:600;
  font-family:inherit;transition:transform .12s,background .15s,box-shadow .15s;
}
.pvx-upd-btn:active{transform:scale(.97)}
.pvx-upd-btn.primary{
  background:linear-gradient(135deg,#6B5CAD,#B8A6E8);color:#0b0b10;
  box-shadow:0 6px 18px rgba(107,92,173,.35);
}
.pvx-upd-btn.primary:hover{box-shadow:0 8px 22px rgba(107,92,173,.5)}
.pvx-upd-btn.ghost{
  background:rgba(255,255,255,.06);color:#d8d5e4;border:1px solid rgba(255,255,255,.08);
}
.pvx-upd-btn.ghost:hover{background:rgba(255,255,255,.1)}
.pvx-upd-btn.warn{
  background:rgba(216,178,94,.12);color:#F5E6A3;border:1px solid rgba(216,178,94,.28);
}

.pvx-toasts{position:fixed;left:16px;bottom:16px;z-index:2147483600;display:flex;flex-direction:column;gap:6px;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,system-ui,sans-serif}
.pvx-toast{display:flex;align-items:center;gap:.65em;max-width:22em;padding:.6em .85em;background:#171719;color:#F5F5F7;border:1px solid #29292D;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.4);animation:pvx-tin .18s ease-out}
.pvx-toast svg{width:1.3em;height:1.3em;flex:none}
.pvx-toast.success svg{color:#6FBF8B}.pvx-toast.warn svg{color:#D8B25E}.pvx-toast.error svg{color:#D9777A}.pvx-toast.info svg{color:#A1A1AA}
.pvx-toast.out{opacity:0;transform:translateY(6px);transition:opacity .18s,transform .18s}
.pvx-toasts.pvx-calm .pvx-toast{animation:none}.pvx-toasts.pvx-calm .pvx-toast.out{transition:none}
@keyframes pvx-tin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
`;
        const styleEl = document.createElement('style');
        styleEl.id = 'pvx-style'; styleEl.textContent = CSS;
        document.head.appendChild(styleEl);
        const perfStyleEl = document.createElement('style');
        perfStyleEl.id = 'pvx-style-v29';
        perfStyleEl.textContent = `
/* ===== v29: containment, cheaper effects, new motion ===== */
.pvx{contain:layout paint}
.pvx-stage{contain:layout paint}
.pvx-drawer{contain:layout paint}
#pvx-dockbar{contain:layout paint}
.pvx-tl-fill,.pvx-hair i{will-change:transform}
@keyframes pvx-in{from{opacity:0;transform:translateY(14px) scale(.975)}to{opacity:1;transform:none}}
.pvx{animation:pvx-in .38s cubic-bezier(.16,1,.3,1)}
@keyframes pvx-fade{from{opacity:0;transform:translateY(6px) scale(.985)}to{opacity:1;transform:none}}
@keyframes pvx-msg-in{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes pvx-tin{from{opacity:0;transform:translateX(-14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes pvx-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.5}}
.pvx-toast{animation:pvx-tin .28s cubic-bezier(.16,1,.3,1)}
.pvx-playing .pvx-dot.ok{animation:pvx-pulse 1.3s ease-in-out infinite}
.pvx-btn.primary{transition:transform .14s cubic-bezier(.3,1.6,.5,1),opacity .12s}
.pvx-btn.primary:active:not(:disabled){transform:scale(.9)}
.pvx-chip{transition:background .14s,color .14s,border-color .14s,transform .12s cubic-bezier(.3,1.6,.5,1)}
.pvx-chip:active{transform:scale(.95)}
/* expensive full-page effects removed / narrowed */
#pvx-dockbar,html.pvx-dock-on #pvx-dockbar,#pvx-cursor-tag,.pvx-upd-overlay,#pvx-tut,.pvx-loader,#pvx-skin-fx,#pvx-skin-fx.on{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
.pvx-upd-overlay{background:rgba(4,5,10,.88)}
#pvx-tut{background:rgba(5,5,10,.86)}
#pvx-skin-fx{background:rgba(6,6,12,.8)}
#pvx-skin-fx .wave{display:none}
html.pvx-hdr{filter:none!important}
html.pvx-hdr pv-canvas,html.pvx-hdr #pvx-dock{filter:contrast(1.08) saturate(1.18)}
/* cursor chips move by transform only (no layout) */
#pvx-cursor-tag{left:0;top:0;will-change:transform}
#pvx-server-cursor{left:0;top:0;will-change:transform}
/* FPS chip + graph */
#pvx-fps{font-variant-numeric:tabular-nums;min-width:5.2em;text-align:center;transition:border-color .25s}
#pvx-fps.ok b{color:#6FBF8B}
#pvx-fps.warn{border-color:rgba(216,178,94,.55)}
#pvx-fps.warn b{color:#D8B25E}
#pvx-fps.bad{border-color:rgba(229,112,127,.6)}
#pvx-fps.bad b{color:#E5707F}
#pvx-fpsgraph{position:fixed;top:50px;right:12px;z-index:2147483200;pointer-events:none;width:240px;height:56px;border:1px solid var(--pvx-line,#29292D);border-radius:6px;display:none}
/* ===== new boot splash ===== */
#pvx-boot2{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#07070c;color:#EDE9F7;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,sans-serif;overflow:hidden;transition:opacity .55s ease,transform .55s cubic-bezier(.16,1,.3,1),visibility .55s}
#pvx-boot2.done{opacity:0;transform:scale(1.04);visibility:hidden;pointer-events:none}
#pvx-boot2 .bg span{position:absolute;width:70vmax;height:70vmax;border-radius:50%;will-change:transform}
#pvx-boot2 .o1{left:-20vmax;top:-30vmax;background:radial-gradient(circle,rgba(107,92,173,.5),transparent 62%);animation:pvx-drift1 9s ease-in-out infinite alternate}
#pvx-boot2 .o2{right:-25vmax;bottom:-35vmax;background:radial-gradient(circle,rgba(184,166,232,.32),transparent 62%);animation:pvx-drift2 11s ease-in-out infinite alternate}
@keyframes pvx-drift1{to{transform:translate3d(12vmax,8vmax,0) scale(1.15)}}
@keyframes pvx-drift2{to{transform:translate3d(-10vmax,-8vmax,0) scale(1.1)}}
#pvx-boot2 .card{position:relative;width:min(400px,calc(100vw - 36px));padding:30px 26px 24px;text-align:center;border-radius:22px;background:rgba(16,16,24,.78);border:1px solid rgba(184,166,232,.2);box-shadow:0 30px 80px rgba(0,0,0,.55);animation:pvx-boot-rise .7s cubic-bezier(.16,1,.3,1) both}
@keyframes pvx-boot-rise{from{opacity:0;transform:translateY(22px) scale(.96)}to{opacity:1;transform:none}}
#pvx-boot2 .logo{position:relative;width:84px;height:84px;margin:0 auto 16px}
#pvx-boot2 .logo img{width:100%;height:100%;border-radius:22px;display:block;object-fit:contain;position:relative;z-index:1;box-shadow:0 10px 36px rgba(107,92,173,.5)}
#pvx-boot2 .logo .ring{position:absolute;inset:-8px;border-radius:28px;border:2px solid rgba(184,166,232,.5);animation:pvx-ring 1.8s ease-out infinite}
@keyframes pvx-ring{0%{transform:scale(.9);opacity:.8}100%{transform:scale(1.28);opacity:0}}
#pvx-boot2 h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.02em}
#pvx-boot2 h1 b{background:linear-gradient(90deg,#B8A6E8,#E8D7FF);-webkit-background-clip:text;background-clip:text;color:transparent}
#pvx-boot2 .ver{margin:4px 0 18px;font-size:12.5px;color:#9b97ad}
#pvx-boot2 .keys{display:flex;gap:4px;justify-content:center;height:34px;margin:0 0 18px}
#pvx-boot2 .keys i{width:16px;height:100%;border-radius:3px 3px 6px 6px;background:linear-gradient(180deg,#E8E0FF,#B8A6E8);opacity:.3;animation:pvx-key 1.5s ease-in-out infinite;animation-delay:calc(var(--i) * 80ms)}
@keyframes pvx-key{0%,70%,100%{opacity:.3;transform:translateY(0)}18%{opacity:1;transform:translateY(3px)}}
#pvx-boot2 .bar{height:5px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
#pvx-boot2 .bar i{display:block;height:100%;width:100%;transform-origin:left;transform:scaleX(0);background:linear-gradient(90deg,#6B5CAD,#B8A6E8,#E8D7FF)}
#pvx-boot2 .row{display:flex;justify-content:space-between;margin-top:10px;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#B8A6E8}
#pvx-boot2 .pct{font-variant-numeric:tabular-nums;color:#9b97ad}
@media (prefers-reduced-motion:reduce){#pvx-boot2 *{animation:none!important}}
/* ===== MIDI loading card ===== */
.pvx-loader{background:rgba(6,6,10,.72)}
.pvx-loader.show .pvx-loader-card{animation:pvx-boot-rise .35s cubic-bezier(.16,1,.3,1)}
.pvx-loader-card{position:relative;overflow:hidden;width:min(380px,90vw);padding:18px 20px 16px;border-radius:16px;background:linear-gradient(165deg,#181822,#101017);border:1px solid rgba(184,166,232,.22);box-shadow:0 24px 60px rgba(0,0,0,.6)}
.pvx-loader-card::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,var(--ac,#B8A6E8),transparent);animation:pvx-sweep 1.3s ease-in-out infinite}
@keyframes pvx-sweep{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.pvx-loader-card .t{font-size:14px;letter-spacing:.02em}
.pvx-loader-bar{height:7px;background:rgba(255,255,255,.08)}
.pvx-loader-bar>i{position:relative;overflow:hidden}
.pvx-loader-bar>i::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);animation:pvx-sweep 1s linear infinite}
`;
        document.head.appendChild(perfStyleEl);

        const boot = { el: null, bar: null, lbl: null, pct: null, target: 0, cur: 0, raf: 0, t0: performance.now(), closing: false };
        (function mountBoot() {
            const d = document.createElement('div');
            d.id = 'pvx-boot2';
            let keys = '';
            for (let i = 0; i < 14; i++) keys += '<i style="--i:' + i + '"></i>';
            d.innerHTML = '<div class="bg"><span class="o1"></span><span class="o2"></span></div>' +
                '<div class="card"><div class="logo"><i class="ring"></i><img alt="" src="' + SIPHON_LOGO + '"></div>' +
                '<h1>Siphon <b>Studio</b></h1><p class="ver">v' + VERSION + ' \u00b7 zero-lag piano toolkit</p>' +
                '<div class="keys">' + keys + '</div><div class="bar"><i></i></div>' +
                '<div class="row"><span class="lbl">Starting</span><span class="pct">0%</span></div></div>';
            (document.body || document.documentElement).appendChild(d);
            boot.el = d; boot.bar = d.querySelector('.bar i'); boot.lbl = d.querySelector('.lbl'); boot.pct = d.querySelector('.pct');
            setTimeout(() => bootClose(true), 7000);
        })();
        function bootPaint() {
            boot.raf = 0;
            if (!boot.el) return;
            boot.cur += (boot.target - boot.cur) * 0.16;
            if (boot.target - boot.cur < 0.4) boot.cur = boot.target;
            boot.bar.style.transform = 'scaleX(' + (boot.cur / 100) + ')';
            boot.pct.textContent = Math.round(boot.cur) + '%';
            if (boot.cur < boot.target) boot.raf = origRAF(bootPaint);
            else if (boot.target >= 100) bootClose(false);
        }
        function bootStep(p, label) {
            if (!boot.el) return;
            if (p > boot.target) boot.target = p;
            if (label) boot.lbl.textContent = label;
            if (!boot.raf) boot.raf = origRAF(bootPaint);
        }
        function bootDone() { bootStep(100, 'Ready'); }
        function bootClose(force) {
            if (!boot.el || boot.closing) return;
            const wait = Math.max(0, 1000 - (performance.now() - boot.t0));
            if (!force && wait > 0) { setTimeout(() => bootClose(false), wait); return; }
            boot.closing = true;
            const e = boot.el;
            e.classList.add('done');
            setTimeout(() => { try { e.remove(); } catch (x) { /* gone */ } boot.el = null; }, 700);
        }
        bootStep(12, 'Hooking room socket');

        const siteStyle = document.createElement('style');
        siteStyle.id = 'pvx-site-style';
        document.head.appendChild(siteStyle);

        /* ---------- DOM ---------- */
        // ---- Boot splash (shown immediately) ----
        (function showBootSplash() { return;
            if (document.getElementById('pvx-boot')) return;
            const boot = document.createElement('div');
            boot.id = 'pvx-boot';
            boot.innerHTML = `
              <div class="pvx-boot-card">
                <div class="pvx-boot-ring"></div>
                <img class="pvx-boot-logo" alt="" src="${SIPHON_LOGO}" />
                <h1 class="pvx-boot-title">Siphon Studio</h1>
                <p class="pvx-boot-sub">v${VERSION} · warming up</p>
                <div class="pvx-boot-bar"><i data-bar></i></div>
                <div class="pvx-boot-stage" data-stage>Initializing</div>
              </div>`;
            (document.body || document.documentElement).appendChild(boot);
            const bar = boot.querySelector('[data-bar]');
            const stage = boot.querySelector('[data-stage]');
            const steps = [
                [12, 'Hooking room socket'],
                [28, 'Loading settings'],
                [48, 'Building studio UI'],
                [68, 'MIDI ports'],
                [84, 'Presence + skin'],
                [100, 'Ready'],
            ];
            let i = 0;
            const tick = () => {
                if (!boot.isConnected) return;
                if (i >= steps.length) {
                    setTimeout(() => boot.classList.add('done'), 280);
                    setTimeout(() => { try { boot.remove(); } catch (e) {} }, 900);
                    return;
                }
                const [pct, label] = steps[i++];
                if (bar) bar.style.width = pct + '%';
                if (stage) stage.textContent = label;
                setTimeout(tick, 160 + (i * 40));
            };
            setTimeout(tick, 80);
            // Safety: always dismiss
            setTimeout(() => {
                if (boot.isConnected) {
                    boot.classList.add('done');
                    setTimeout(() => { try { boot.remove(); } catch (e) {} }, 700);
                }
            }, 4500);
        })();

        const root = el('div', 'pvx');
        root.id = 'pvx-root';
        root.innerHTML = `
<div class="pvx-head" data-drag>
  <div class="pvx-ident">
    <span class="pvx-dot" data-r="dot"></span>
    <div class="pvx-titles"><div class="pvx-title" data-r="title">Siphon Studio v29.0</div><div class="pvx-sub" data-r="sub">No output</div></div>
  </div>
  <div class="pvx-transport">
    <button class="pvx-btn" data-r="back" title="Rewind (Alt+Left)">${svg('back')}</button>
    <button class="pvx-btn primary" data-r="play" title="Play / Pause (Alt+P)">${svg('play')}</button>
    <button class="pvx-btn" data-r="fwd" title="Fast-forward (Alt+Right)">${svg('fwd')}</button>
    <button class="pvx-btn" data-r="stop" title="Stop (Alt+S)">${svg('stop')}</button>
    <button class="pvx-btn" data-r="loop" title="Loop (Alt+L)">${svg('loop')}</button>
  </div>
  <div class="pvx-wc">
    <span class="pvx-hmt" data-r="hmt">0:00 / 0:00</span>
    <button class="pvx-btn" data-r="open" title="Open MIDI file (Alt+F)">${svg('open')}</button>
    <button class="pvx-btn" data-r="unload" title="Unload MIDI (Alt+U)">${svg('trash')}</button>
    <button class="pvx-btn" data-r="gear" title="Settings">${svg('sliders')}</button>
    <button class="pvx-btn" data-r="min" title="Minimize (Alt+M)">${svg('min')}</button>
    <button class="pvx-btn" data-r="close" title="Hide (Alt+O to reopen)">${svg('close')}</button>
  </div>
  <div class="pvx-hair"><i data-r="hair"></i></div>
</div>
<div class="pvx-toolbar">
  <span class="pvx-t" data-r="cur">0:00</span>
  <div class="pvx-tl" data-r="tl" role="slider" aria-label="Seek" tabindex="-1">
    <div class="pvx-tl-track"><div class="pvx-tl-region" data-r="region"></div><div class="pvx-tl-fill" data-r="fill"></div><div class="pvx-tl-thumb" data-r="thumb"></div></div>
    <div class="pvx-tl-tip" data-r="tip">0:00</div>
  </div>
  <span class="pvx-t r" data-r="dur">0:00</span>
  <div class="pvx-seg" title="Loop region: set A / B at the playhead. Click A+B again to clear."><button data-r="la">A</button><button data-r="lb">B</button></div>
  <select class="pvx-sel" data-r="speed" title="Playback speed"></select>
</div>
<div class="pvx-tb2">
  <button class="pvx-chip" data-r="recent" title="Recently played">${svg('clock')}Recent${svg('chev')}</button>
  <button class="pvx-chip" data-r="library" title="Online library: BitMidi, game music, GitHub, favorites, queue (Alt+B)">${svg('lib')}Library</button>
  <button class="pvx-chip rec" data-r="rec" title="Record notes (Alt+R)"><i></i><span data-r="rectxt">Record</span></button>
  <button class="pvx-chip" data-r="lg" title="Logger: live notes rise from the keyboard (Alt+G)"><i></i>Logger</button>
  <button class="pvx-chip" data-r="dk" title="Replace the site piano with the Studio piano (Alt+D)"><i></i>Dock</button>
  <button class="pvx-chip" data-r="hz" title="Humanize (Alt+H). Right-click for settings"><i></i>Humanize</button>
  <button class="pvx-chip" data-r="panic" title="Panic: release every note and the pedal (Alt+X)">Panic</button>
  <select class="pvx-sel" data-r="port" title="MIDI output"></select>
</div>
<div class="pvx-stage" data-r="stage">
  <canvas data-r="cv"></canvas>
  <div class="pvx-empty" data-r="empty"><div><b>Open a MIDI file to begin</b><br>drop a file · Alt+F · or browse the library</div><div style="display:flex;gap:.5em;flex-wrap:wrap;justify-content:center"><button class="pvx-cta" data-r="open2">${svg('open')}Open MIDI</button><button class="pvx-cta" data-r="library2" style="background:var(--panel);color:var(--tx);border:1px solid var(--line)">${svg('lib')}Library</button></div></div>
  <div class="pvx-stats" data-r="stats"></div>
  <div class="pvx-drop" data-r="drop">Drop MIDI file to load</div>
</div>
<div class="pvx-info" data-r="info"></div>
<div class="pvx-grip" data-r="grip"></div>
<div class="pvx-pop" data-r="pop">
  <div class="pvx-pop-h" data-r="poptabs">
    <div class="pvx-seg"><button data-tab="all">All</button><button data-tab="file">Files</button><button data-tab="rec">Recordings</button><button data-tab="pin">Pinned</button></div>
    <span class="sp"></span>
    <button class="pvx-act warn" data-r="popclear">Clear</button>
  </div>
  <div class="pvx-pop-list" data-r="poplist"></div>
</div>
<div class="pvx-set" data-r="set">
  <div class="pvx-sethead"><span>Settings</span><input class="pvx-input" data-r="setq" placeholder="Search settings…" style="flex:1;max-width:16em;margin:0 .8em"><button class="pvx-btn" data-r="setclose" title="Close settings">${svg('close')}</button></div>
  <div class="pvx-setbody"><div class="pvx-nav" data-r="nav"></div><div class="pvx-pane" data-r="pane"></div></div>
</div>
<input type="file" accept=".mid,.midi,audio/midi" style="display:none" data-r="file">
`;
        document.body.appendChild(root);
        const toastBox = el('div', 'pvx-toasts');
        document.body.appendChild(toastBox);
        const dockCv = el('canvas', 'pvx-dock');
        dockCv.id = 'pvx-dock';
        document.body.appendChild(dockCv);
        const dctx = dockCv.getContext('2d');
        const drawer = el('div', 'pvx pvx-drawer');
        drawer.id = 'pvx-drawer';
        drawer.innerHTML = `
<div class="pvx-dr-h"><span>Library</span><span class="sub" data-d="status"></span><button class="pvx-btn" data-d="close" title="Close (Alt+B)">${svg('close')}</button></div>
<div class="pvx-dr-tabs" data-d="tabs"><div class="pvx-seg"><button data-tab="bitmidi">BitMidi</button><button data-tab="vgm">Games</button><button data-tab="repo">GitHub</button><button data-tab="fav">Favorites</button><button data-tab="queue">Queue</button></div></div>
<div class="pvx-dr-bar">
  <input class="pvx-input" data-d="q" placeholder="Search…" spellcheck="false">
  <select class="pvx-sel" data-d="sel" style="max-width:9em"></select>
  <button class="pvx-act" data-d="go">Search</button>
  <button class="pvx-btn" data-d="sort" title="Sort A to Z">A–Z</button>
  <button class="pvx-btn" data-d="rand" title="Random BitMidi song">${svg('dice')}</button>
</div>
<div class="pvx-dr-chips" data-d="chips"></div>
<div class="pvx-dr-list" data-d="list"></div>
<div class="pvx-dr-url"><input class="pvx-input" data-d="url" placeholder="Paste a direct .mid link…" spellcheck="false"><button class="pvx-act" data-d="urlgo">Load</button></div>
<div class="pvx-dr-f" data-d="foot">Songs are hosted by their sources and belong to their authors. Nothing is mirrored; files download only when you click.</div>
`;
        document.body.appendChild(drawer);

        /* ---------- Dock sidebar controls (replaces pv-users when docked) ---------- */
        const dockBar = el('div', 'pvx-dockbar');
        dockBar.id = 'pvx-dockbar';
        dockBar.innerHTML = `
<div class="pvx-db-head">
  <span class="pvx-db-dot" data-db="dot"></span>
  <div style="flex:1;min-width:0">
    <div class="pvx-db-title" data-db="title">Siphon Studio v29.0</div>
    <div class="pvx-db-sub" data-db="sub">Docked · click Undock to restore</div>
  </div>
  <button class="pvx-btn" data-db="undock" title="Undock (restore Studio + player list)">${svg('close')}</button>
</div>
<div class="pvx-db-transport">
  <button class="pvx-btn" data-db="open" title="Open MIDI file">${svg('open')}</button>
  <button class="pvx-btn" data-db="back" title="Rewind">${svg('back')}</button>
  <button class="pvx-btn primary" data-db="play" title="Play / Pause">${svg('play')}</button>
  <button class="pvx-btn" data-db="fwd" title="Fast-forward">${svg('fwd')}</button>
  <button class="pvx-btn" data-db="stop" title="Stop">${svg('stop')}</button>
  <span class="pvx-db-time" data-db="time">0:00 / 0:00</span>
</div>
<div class="pvx-db-chips">
  <button class="pvx-chip" data-db="library" title="Online library">${svg('lib')}Library</button>
  <button class="pvx-chip rec" data-db="rec" title="Record"><i></i>Record</button>
  <button class="pvx-chip" data-db="hz" title="Humanize"><i></i>Humanize</button>
  <button class="pvx-chip" data-db="logger" title="Logger — live notes rising from keys"><i></i>Logger</button>
  <button class="pvx-chip" data-db="loop" title="Loop"><i></i>Loop</button>
  <button class="pvx-chip" data-db="panic" title="Panic — release all notes">Panic</button>
</div>
<div class="pvx-db-lib" data-db="libhost"></div>
<div class="pvx-db-status" data-db="status">Ready</div>
`;
        const DB = {};
        dockBar.querySelectorAll('[data-db]').forEach((n) => { DB[n.dataset.db] = n; });
        let dockLibOpen = false;

        const R = {};
        root.querySelectorAll('[data-r]').forEach((n) => { R[n.dataset.r] = n; });
        const ctx = R.cv.getContext('2d', { alpha: false, desynchronized: true });

        function toast(msg, type = 'info', ms = 3200) {
            if (!S.ui.notifications && type !== 'error') return;
            while (toastBox.children.length >= 4) toastBox.firstChild.remove();
            const t = el('div', 'pvx-toast ' + type, `${svg(type === 'success' ? 'ok' : type === 'warn' ? 'warn' : type === 'error' ? 'err' : 'info')}<span>${esc(msg)}</span>`);
            toastBox.appendChild(t);
            setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 220); }, ms);
        }

        /* ---------- apply theme / layout / site mods ---------- */
        function applyTheme() {
            const th = THEMES[S.ui.theme] || THEMES.graphite;
            const ac = resolveAccent();
            const vars = {
                '--bg': th.bg, '--bg2': th.bg2, '--panel': th.panel, '--elev': th.elev, '--line': th.line,
                '--tx': th.tx, '--tx2': th.tx2, '--tx3': th.tx3,
                '--ac': rgbStr(...ac), '--ac-rgb': ac.map(Math.round).join(','),
            };
            // Studio chrome
            for (const k in vars) { root.style.setProperty(k, vars[k]); toastBox.style.setProperty(k, vars[k]); drawer.style.setProperty(k, vars[k]); }
            // Full-site theme vars (so chat/header follow accent + theme colors)
            const siteVars = {
                '--pvx-bg': th.bg, '--pvx-bg2': th.bg2, '--pvx-panel': th.panel, '--pvx-elev': th.elev, '--pvx-line': th.line,
                '--pvx-tx': th.tx, '--pvx-tx2': th.tx2, '--pvx-tx3': th.tx3,
                '--ac': rgbStr(...ac), '--ac-rgb': ac.map(Math.round).join(','),
            };
            const html = document.documentElement;
            applySiteThemeClass();
            for (const k in siteVars) html.style.setProperty(k, siteVars[k]);
            if (typeof applyThemeToDockBar === 'function') applyThemeToDockBar();
            const b2 = parseHex(th.bg2);
            C.bg = th.bg; C.bg2 = th.bg2; C.line = th.line;
            C.bg2a = (a) => `rgba(${b2[0]},${b2[1]},${b2[2]},${a})`;
            C.accentRGB = ac; C.accent = rgbStr(...ac);
            C.accentDark = rgbStr(...mix(ac, [0, 0, 0], 0.4));
            C.keyW = th.keyW; C.keyB = th.keyB; C.keyBEdge = th.keyBEdge; C.tx2 = th.tx2; C.tx3 = th.tx3;
            C.palLight = PAL.map((c) => rgbStr(...c)); C.palDark = PAL.map((c) => rgbStr(...mix(c, [0, 0, 0], 0.4)));
            C.pcLight = PCOLS.map((c) => rgbStr(...c)); C.pcDark = PCOLS.map((c) => rgbStr(...mix(c, [0, 0, 0], 0.4)));
            C.grid = th.light ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.045)'; C.gridStrong = th.light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.10)'; C.oct = th.light ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.035)';
            requestRender();
        }
        function applyLayoutPrefs() {
            root.style.fontSize = (12 * S.ui.scale / 100) + 'px';
            toastBox.style.fontSize = (12 * S.ui.scale / 100) + 'px';
            drawer.style.fontSize = (12 * S.ui.scale / 100) + 'px';
            root.style.opacity = String(S.ui.opacity / 100);
            root.classList.toggle('pvx-compact', S.ui.compact);
            const calm = !S.ui.animations || S.perf.reduced || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
            root.classList.toggle('pvx-calm', calm);
            toastBox.classList.toggle('pvx-calm', calm);
            drawer.classList.toggle('pvx-calm', calm);
            R.info.style.display = S.ui.showInfo ? '' : 'none';
            R.stats.style.display = S.perf.stats ? 'block' : 'none';
            applyWindow();
            resizeCanvas();
        }

        let siteCapMs = 0;
        const rafLast = new WeakMap();
        function applyKeyLabels() {
            const m = S.site.keyLabels;
            let on;
            if (m === 'on') on = true;
            else if (m === 'off') on = false;
            else {
                let arr = [];
                try { arr = JSON.parse(localStorage.getItem('settings') || '[]'); } catch (e) { arr = []; }
                on = !!new Map(Array.isArray(arr) ? arr : []).get('showLabels');
            }
            document.querySelectorAll('pv-keys [data-key]').forEach((k) => k.classList.toggle('show-label', on));
        }
        function applySiteMods() {
            const o = S.site;
            let css = '';
            if (o.noBlur) css += '*,*::before,*::after{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}';
            if (o.noTransitions) css += 'pv-keys *,.app *,dialog *,button{transition:none!important}';
            if (o.noShadows) css += 'pv-note,.app *,dialog{box-shadow:none!important;text-shadow:none!important}';
            // NOTE: notes are removed by the site on animationend, so they are hidden (visibility) rather than display:none / animation:none
            if (o.hideNotes) css += 'pv-note{visibility:hidden!important}pv-note.released{animation-duration:.05s!important}.fg-canvas{display:none!important}';
            if (o.hideCursors) css += 'pv-cursor{display:none!important}';
            if (o.hideCursorNames) css += 'pv-cursor .badge{display:none!important}';
            if (o.cursorScale !== 100) css += `pv-cursor{scale:${o.cursorScale / 100}!important;transform-origin:top left}`;
            if (o.cursorOpacity !== 100) css += `pv-cursor{opacity:${o.cursorOpacity / 100}!important}`;
            if (o.hideSystemMsgs) css += 'pv-chat li.system{display:none!important}';
            if (o.chatFont !== 100) css += `pv-chat .message,pv-chat .system{font-size:${o.chatFont}%!important}`;
            if (o.hideUserList) css += 'pv-chat-header .users{display:none!important}';
            if (o.hideChatHeader) css += 'pv-chat-header{display:none!important}';
            if (o.hideNotifications) css += '#notifications{display:none!important}';
            if (o.hideHeader) css += 'pv-header{display:none!important}';
            if (o.hideToolbar) css += 'pv-toolbar .toolbar{display:none!important}';
            // Concert-mode UI unlock: site adds .disabled to keys for non-hosts
            if (S.skin && S.skin.bypassConcert) {
                css += 'pv-keys [data-key].disabled{pointer-events:auto!important;opacity:1!important;filter:none!important;cursor:pointer!important}';
                css += 'pv-keys [data-key].disabled::after{display:none!important}';
            }
            // During dense playback, kill site note cascade / effects as hard as possible
            if (P && P.playing && song && song.n > 20000) {
                css += 'pv-note,.fg-canvas{visibility:hidden!important;display:none!important;animation:none!important}';
                css += 'body.no-blur,body{--blur:0!important}';
            }
            if (siteStyle.textContent !== css) siteStyle.textContent = css;
            siteCapMs = o.fpsCap > 0 ? 1000 / o.fpsCap : 0;
            if (siteCapMs) {
                PW.requestAnimationFrame = function (cb) {
                    if (!siteCapMs) return origRAF(cb);
                    return origRAF(function wrap(ts) {
                        const last = rafLast.get(cb) || 0;
                        if (ts - last < siteCapMs - 2) { origRAF(wrap); return; }
                        rafLast.set(cb, ts);
                        cb(ts);
                    });
                };
            } else if (PW.requestAnimationFrame !== nativeRAF) PW.requestAnimationFrame = nativeRAF;
            applyKeyLabels();
        }
        function writeSiteSettings(patch) {
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem('settings') || '[]'); } catch (e) { arr = []; }
            const m = new Map(Array.isArray(arr) ? arr : []);
            for (const k in patch) m.set(k, patch[k]);
            localStorage.setItem('settings', JSON.stringify(Array.from(m)));
        }
        function siteSettingsPreset(kind) {
            if (kind === 'balanced') writeSiteSettings({ showEffects: false, showBlur: false, polyphony: 32 });
            else if (kind === 'max') writeSiteSettings({ showEffects: false, showBlur: false, polyphony: 16, reverb: false, showCursors: false, showLabels: false });
            else writeSiteSettings({ showEffects: true, showBlur: true, polyphony: 64, showCursors: true });
            toast('Site settings saved. Reloading…', 'info', 1200);
            setTimeout(() => location.reload(), 600);
        }

        /* =================================================================
         * SONG MODEL
         * ================================================================= */
        let song = null;
        const trackMute = new Uint8Array(256);
        let soloTrack = -1;
        const trackOff = (t) => (soloTrack >= 0 ? t !== soloTrack : trackMute[t] === 1);

        function buildSong(midi, name) {
            let n = 0;
            for (const tr of midi.tracks) n += tr.notes.length;
            let st = new Float64Array(n), du = new Float32Array(n), pi = new Uint8Array(n), ve = new Uint8Array(n), tk = new Uint8Array(n);
            let k = 0, trackCount = 0;
            const tracks = [];
            midi.tracks.forEach((track, ti) => {
                if (track.notes.length) trackCount++;
                tracks.push({ idx: ti & 255, name: track.name || ('Track ' + (ti + 1)), notes: track.notes.length, inst: (track.instrument && track.instrument.name) || '' });
                for (const nt of track.notes) {
                    st[k] = nt.time; du[k] = nt.duration;
                    pi[k] = clamp(nt.midi | 0, 0, 127);
                    ve[k] = clamp(Math.round(nt.velocity * 127), 1, 127);
                    tk[k] = ti & 255;
                    k++;
                }
            });
            let sorted = true;
            for (let i = 1; i < n; i++) { if (st[i] < st[i - 1]) { sorted = false; break; } }
            if (!sorted) {
                const idx = new Uint32Array(n);
                for (let i = 0; i < n; i++) idx[i] = i;
                idx.sort((a, b) => st[a] - st[b]);
                const st2 = new Float64Array(n), du2 = new Float32Array(n), pi2 = new Uint8Array(n), ve2 = new Uint8Array(n), tk2 = new Uint8Array(n);
                for (let i = 0; i < n; i++) { const j = idx[i]; st2[i] = st[j]; du2[i] = du[j]; pi2[i] = pi[j]; ve2[i] = ve[j]; tk2[i] = tk[j]; }
                st = st2; du = du2; pi = pi2; ve = ve2; tk = tk2;
            }
            const endMax = new Float64Array(n);
            let em = 0;
            for (let i = 0; i < n; i++) { const e = st[i] + du[i]; if (e > em) em = e; endMax[i] = em; }
            const duration = Math.max(midi.duration || 0, em);

            const ppq = midi.header.ppq || 480;
            let tempos = (midi.header.tempos || []).map((t) => ({ ticks: t.ticks, bpm: t.bpm })).filter((t) => t.bpm > 0);
            if (!tempos.length) tempos = [{ ticks: 0, bpm: 120 }];
            tempos.sort((a, b) => a.ticks - b.ticks);
            if (tempos[0].ticks > 0) tempos.unshift({ ticks: 0, bpm: tempos[0].bpm });
            const tSec = [0];
            for (let i = 1; i < tempos.length; i++) tSec.push(tSec[i - 1] + (tempos[i].ticks - tempos[i - 1].ticks) / ppq * 60 / tempos[i - 1].bpm);
            const t2s = (ticks) => {
                let lo = 0, hi = tempos.length - 1;
                while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (tempos[mid].ticks <= ticks) lo = mid; else hi = mid - 1; }
                return tSec[lo] + (ticks - tempos[lo].ticks) / ppq * 60 / tempos[lo].bpm;
            };
            let sigs = (midi.header.timeSignatures || []).map((s) => ({ ticks: s.ticks, n: s.timeSignature[0], d: s.timeSignature[1] }));
            if (!sigs.length) sigs = [{ ticks: 0, n: 4, d: 4 }];
            sigs.sort((a, b) => a.ticks - b.ticks);
            if (sigs[0].ticks > 0) sigs.unshift({ ticks: 0, n: sigs[0].n, d: sigs[0].d });
            const bt = [], bm = [];
            outer: for (let si = 0; si < sigs.length; si++) {
                const sg = sigs[si], next = si + 1 < sigs.length ? sigs[si + 1].ticks : Infinity;
                const beatTicks = ppq * 4 / sg.d;
                for (let b = 0; ; b++) {
                    const tick = sg.ticks + b * beatTicks;
                    if (tick >= next) break;
                    const t = t2s(tick);
                    if (t > duration + 0.01 || bt.length > 150000) break outer;
                    bt.push(t); bm.push(b % sg.n === 0 ? 1 : 0);
                }
            }
            const bpmFirst = tempos[0].bpm;
            return {
                name, n, st, du, pi, ve, tk, endMax, duration, trackCount, tracks,
                beatT: Float64Array.from(bt), beatM: Uint8Array.from(bm),
                bpm: bpmFirst, tempoVaries: tempos.some((t) => Math.abs(t.bpm - bpmFirst) > 0.01), sig: sigs[0].n + '/' + sigs[0].d, id: null,
            };
        }
        const lowerBoundStart = (s, t) => { let lo = 0, hi = s.n; while (lo < hi) { const m = (lo + hi) >> 1; if (s.st[m] < t) lo = m + 1; else hi = m; } return lo; };
        const upperBoundStart = (s, t) => { let lo = 0, hi = s.n; while (lo < hi) { const m = (lo + hi) >> 1; if (s.st[m] <= t) lo = m + 1; else hi = m; } return lo; };
        const firstEndAtLeast = (s, t) => { let lo = 0, hi = s.n; while (lo < hi) { const m = (lo + hi) >> 1; if (s.endMax[m] < t) lo = m + 1; else hi = m; } return lo; };
        const lowerBoundArr = (a, t) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < t) lo = m + 1; else hi = m; } return lo; };

        /* =================================================================
         * MIDI OUTPUT
         * ================================================================= */
        let midiAccess = null, out = null, sounding = false, flushTimer = 0;
        const active = new Uint32Array(128);

        function sendRaw(a, b, c, ts) {
            if (!out) return;
            try { if (ts) out.send([a, b, c], ts); else out.send([a, b, c]); } catch (e) { /* port closed */ }
        }
        function releaseAll() {
            hN = 0;
            const had = sounding;
            active.fill(0);
            sounding = false;
            if (out) {
                for (let p = 0; p < 128; p++) sendRaw(0x80, p, 0);
                for (let ch = 0; ch < 16; ch++) { sendRaw(0xB0 | ch, 64, 0); sendRaw(0xB0 | ch, 123, 0); sendRaw(0xB0 | ch, 120, 0); }
                try { if (out.clear) out.clear(); } catch (e) { /* unsupported */ }
            }
            clearTimeout(flushTimer);
            if (had && out) {
                const port = out;
                flushTimer = setTimeout(() => {
                    if (out !== port) return;
                    for (let p = 0; p < 128; p++) if (!active[p]) sendRaw(0x80, p, 0);
                    sendRaw(0xB0, 64, 0);
                }, LOOK_MS + 60);
            }
        }
        function refreshPorts(announce) {
            const outs = midiAccess ? Array.from(midiAccess.outputs.values()).filter((o) => o.state !== 'disconnected') : [];
            const prev = out;
            if (prev && !outs.some((o) => o.id === prev.id)) {
                releaseAll(); out = null;
                if (P.playing) pausePlayback();
                toast('MIDI output disconnected: ' + prev.name, 'error');
            }
            let chosen = out ? outs.find((o) => o.id === out.id) : null;
            if (!chosen && S.ui.restorePort && S.ui.port) chosen = outs.find((o) => o.name === S.ui.port);
            if (!chosen) chosen = outs.find((o) => /loopbe|loopmidi|virtual/i.test(o.name));
            if (!chosen) chosen = outs[0] || null;
            if (chosen !== out) { out = chosen; if (out && announce) toast('MIDI output: ' + out.name, 'success'); }
            R.port.innerHTML = '';
            if (!outs.length) { R.port.appendChild(new Option('No MIDI output', '')); R.port.disabled = true; }
            else {
                R.port.disabled = false;
                outs.forEach((o) => { const op = new Option(o.name, o.id); op.selected = !!(out && out.id === o.id); R.port.appendChild(op); });
            }
            updateStatus();
        }
        function updateStatus() {
            const ok = !!(out && out.state !== 'disconnected');
            R.dot.className = 'pvx-dot ' + (ok ? 'ok' : (midiAccess ? 'bad' : ''));
            R.sub.textContent = ok ? out.name : (midiAccess ? 'No MIDI output' : 'MIDI unavailable');
        }
        function initMidi() {
            if (!navigator.requestMIDIAccess) { toast('Web MIDI is not supported in this browser', 'error'); updateStatus(); return; }
            navigator.requestMIDIAccess({ sysex: false }).then((acc) => {
                midiAccess = acc;
                acc.onstatechange = () => refreshPorts(true);
                refreshPorts(false);
            }).catch(() => { midiAccess = null; updateStatus(); toast('MIDI access was denied or failed', 'error'); });
        }
        listen(R.port, 'change', () => {
            if (!midiAccess) return;
            const o = midiAccess.outputs.get(R.port.value);
            if (!o) return;
            const pos = curPos(), was = P.playing;
            releaseAll();
            out = o;
            S.ui.port = o.name; saveSettings();
            updateStatus();
            toast('MIDI output: ' + o.name, 'success');
            if (was) startAt(pos);
        });

        /* =================================================================
         * SCHEDULER
         * ================================================================= */
        const P = { playing: false, pos: 0, offset: 0, wall: 0, start: 0, pass: 0 };
        let nextIdx = 0, pedIdx = 0, nbBucket = -1, nbCount = 0, sessionSeed = 1, npsCount = 0, curNps = 0;
        let regionA = null, regionB = null;
        const chord = { start: -1, min: 0, max: 0, size: 1 };
        let hT = new Float64Array(4096), hP = new Uint8Array(4096), hI = new Uint32Array(4096), hN = 0;
        function hPush(t, p, id) {
            if (hN === hT.length) {
                const nT = new Float64Array(hN * 2), nP = new Uint8Array(hN * 2), nI = new Uint32Array(hN * 2);
                nT.set(hT); nP.set(hP); nI.set(hI); hT = nT; hP = nP; hI = nI;
            }
            let i = hN++;
            while (i > 0) {
                const par = (i - 1) >> 1;
                if (hT[par] <= t) break;
                hT[i] = hT[par]; hP[i] = hP[par]; hI[i] = hI[par];
                i = par;
            }
            hT[i] = t; hP[i] = p; hI[i] = id;
        }
        function hPop() {
            const lt = hT[--hN], lp = hP[hN], li = hI[hN];
            let i = 0;
            while (true) {
                let c = 2 * i + 1;
                if (c >= hN) break;
                if (c + 1 < hN && hT[c + 1] < hT[c]) c++;
                if (hT[c] >= lt) break;
                hT[i] = hT[c]; hP[i] = hP[c]; hI[i] = hI[c];
                i = c;
            }
            hT[i] = lt; hP[i] = lp; hI[i] = li;
        }

        const regionOn = () => S.play.loop && regionA != null && regionB != null && regionB > regionA + 0.05;
        const hzSeed = () => (S.hz.seed ? S.hz.seedValue + (S.hz.varyLoop ? P.pass * 7919 : 0) : sessionSeed);

        function curPos() {
            if (!song) return 0;
            if (!P.playing) return P.pos;
            return clamp(P.offset + (performance.now() - P.wall) * S.play.speed / 1000, P.start, song.duration);
        }
        function beginChord(i) {
            const s = song, st0 = s.st[i];
            let mn = 255, mx = 0, n = 0;
            for (let j = i; j < s.n && n < 64 && s.st[j] - st0 <= 0.012; j++) { const q = s.pi[j]; if (q < mn) mn = q; if (q > mx) mx = q; n++; }
            chord.start = st0; chord.min = mn; chord.max = mx; chord.size = n;
        }

        function scheduleNote(i, now) {
            const s = song, sp = S.play.speed, pl = S.play, hz = S.hz;
            if (trackOff(s.tk[i])) return;
            const origP = s.pi[i], stt = s.st[i];
            let vel = s.ve[i];
            if (vel < pl.minVel) return;
            let p = mapPitch(origP, s.tk[i]);
            if (p < 0) return;
            if (pl.maxNps > 0) {
                const b = (stt * 10) | 0;
                if (b !== nbBucket) { nbBucket = b; nbCount = 0; }
                if (++nbCount > pl.maxNps / 10) return;
            }
            vel = pl.velFixed > 0 ? pl.velFixed : vel * pl.velScale / 100;
            let delay = 0, lenScale = 1, minLen = 3;
            if (hz.on) {
                const k = hz.strength / 100, seed = hzSeed();
                if (chord.start < 0 || stt - chord.start > 0.012) beginChord(i);
                if (hz.dropPct > 0 && h01(i, 9, seed) * 100 < hz.dropPct * k) return;
                let d = gz(i, 1, seed) * hz.timing + drift(stt, seed) * hz.drift + hz.bias;
                if (chord.size > 1) {
                    const pr = chord.max > chord.min ? (origP - chord.min) / (chord.max - chord.min) : 0.5;
                    if (hz.roll > 0) {
                        const dir = hz.rollDir;
                        const f = dir === 'up' ? pr : dir === 'down' ? 1 - pr : dir === 'out' ? Math.abs(pr - 0.5) * 2 : h01(i, 5, seed);
                        d += f * hz.roll;
                    }
                    if (origP === chord.max) { d -= hz.melody; vel += hz.accent * k; } else vel -= hz.accent * 0.4 * k;
                }
                if (origP < hz.split) d += hz.hand;
                delay = d * k;
                vel = 64 + (vel - 64) * (1 + (hz.dyn / 100 - 1) * k) + gz(i, 2, seed) * hz.vel * k;
                vel = clamp(vel, hz.velMin, hz.velMax);
                lenScale = Math.max(0.3, 1 + gz(i, 3, seed) * hz.len / 100 * k) * (1 + (hz.gate / 100 - 1) * k);
                minLen = Math.max(3, hz.minLen);
                if (hz.wrongPct > 0 && h01(i, 10, seed) * 100 < hz.wrongPct * k) {
                    const q = p + (h01(i, 11, seed) < 0.5 ? -1 : 1) * (h01(i, 12, seed) < 0.3 ? 2 : 1);
                    if (q < pl.minNote || q > pl.maxNote) return;
                    p = q;
                }
            }
            vel = Math.min(vel, pl.velMax);
            let onWall = P.wall + (stt - P.offset) / sp * 1000 + delay;
            if (onWall < now) onWall = now;
            const v = clamp(Math.round(vel), 1, 127);
            const offWall = onWall + Math.max(minLen, s.du[i] * 1000 * lenScale / sp);
            if (active[p] !== 0) sendRaw(0x80, p, 0, Math.max(now, onWall - 1));
            sendRaw(0x90, p, v, onWall);
            active[p] = i + 1;
            sounding = true;
            hPush(offWall, p, i + 1);
            npsCount++;
        }

        function tick() {
            if (!P.playing || !song) return;
            const now = performance.now();
            const s = song, sp = S.play.speed;
            const pos = P.offset + (now - P.wall) * sp / 1000;
            const look = (!usingWorker && document.hidden) ? 1100 : ((S.perf.blackMidi || (song && song.n > 50000)) ? 60 : LOOK_MS);
            const horizon = pos + look * sp / 1000;
            const rOn = regionOn();
            const limit = rOn ? regionB : Infinity;

            while (nextIdx < s.n && s.st[nextIdx] <= horizon && s.st[nextIdx] < limit) scheduleNote(nextIdx++, now);

            if (S.hz.on && S.hz.pedal !== 'off') {
                while (pedIdx < s.beatT.length && s.beatT[pedIdx] <= horizon) {
                    const bt = s.beatT[pedIdx];
                    if (S.hz.pedal === 'beat' || s.beatM[pedIdx]) {
                        const tw = Math.max(now, P.wall + (bt - P.offset) / sp * 1000);
                        if (bt > P.start + 0.05) { sendRaw(0xB0, 64, 0, tw); sendRaw(0xB0, 64, 127, tw + S.hz.repedal); sounding = true; }
                    }
                    pedIdx++;
                }
            }

            const hw = now + look;
            while (hN > 0 && hT[0] <= hw) {
                const t = hT[0], p = hP[0], id = hI[0];
                hPop();
                if (active[p] === id) { sendRaw(0x80, p, 0, Math.max(t, now)); active[p] = 0; }
            }

            if (rOn && pos >= regionB) { P.pass++; startAt(regionA); return; }
            const finished = nextIdx >= s.n && pos >= s.duration && (hN === 0 || pos >= s.duration + 3);
            if (finished || pos >= s.duration + 3) onSongEnd();
        }
        function onSongEnd() {
            if (S.play.loop) { P.pass++; startAt(regionOn() ? regionA : 0); return; }
            stopPlayback();
            if (S.play.onEnd === 'next') advanceQueue(false);
            else if (S.play.onEnd === 'random') advanceQueue(true);
            else if (S.play.onEnd === 'queue') queueNext();
        }

        let worker = null, usingWorker = false, intervalId = 0, workerUrl = null;
        try {
            workerUrl = URL.createObjectURL(new Blob(['let id=0;onmessage=e=>{clearInterval(id);if(e.data>0)id=setInterval(()=>postMessage(0),e.data)}'], { type: 'text/javascript' }));
            worker = new Worker(workerUrl);
            usingWorker = true;
            worker.onmessage = tick;
            worker.onerror = () => { usingWorker = false; worker = null; if (P.playing) startTimer(); };
        } catch (e) { worker = null; usingWorker = false; }
        function startTimer() { stopTimer(); const ms = (S.perf.blackMidi || (song && song.n > 40000)) ? 32 : TICK_MS; if (worker) worker.postMessage(ms); else intervalId = setInterval(tick, ms); }
        function stopTimer() { if (worker) worker.postMessage(0); clearInterval(intervalId); intervalId = 0; }

        function lobbyCheck() {
            if (!S.ui.lobbyWarn) return;
            const room = new URLSearchParams(location.search).get('r');
            if (!room) toast('You are in the Lobby. Pianoverse rules ask that autoplayers are used in other rooms.', 'warn', 6000);
        }
        function startAt(position, lead) {
            if (!song) return;
            lead = lead || 0;
            releaseAll();
            const sp = S.play.speed;
            P.start = clamp(position, 0, song.duration);
            P.offset = P.start - lead * sp;
            P.wall = performance.now();
            nextIdx = lowerBoundStart(song, P.start);
            pedIdx = lowerBoundArr(song.beatT, P.start);
            chord.start = -1; nbBucket = -1; nbCount = 0;
            sessionSeed = (Math.random() * 1e9) | 0;
            if (!out) toast('No MIDI output selected. Playback will be silent.', 'warn');
            if (S.hz.on && S.hz.pedal !== 'off') { sendRaw(0xB0, 64, 127, P.wall + lead * 1000); sounding = true; }
            P.playing = true; playGate.playing = true;
            // Soften visuals for dense MIDIs so playback stays smooth
            if (S.perf.auto && song && song.n > 3000) {
                autoFactor = Math.min(autoFactor, song.n > 100000 ? 0.08 : song.n > 50000 ? 0.12 : song.n > 30000 ? 0.18 : song.n > 15000 ? 0.28 : song.n > 8000 ? 0.4 : song.n > 4000 ? 0.55 : 0.7);
            }
            // Black-MIDI: force thin visuals + optional density limit so the tab stays responsive
            if (song && song.n > 60000) {
                if (!S.play.maxNps || S.play.maxNps > 12000) {
                    // soft suggest only via toast once per song id
                    if (S.perf._bmToast !== song.n) {
                        S.perf._bmToast = song.n;
                        toast('Black MIDI detected (' + fmtInt(song.n) + ' notes) — extreme visual culling on', 'warn', 4200);
                    }
                }
                autoFactor = Math.min(autoFactor, 0.12);
            }
            startTimer();
            try { applySiteMods(); } catch (e) {}
            updateTransportUI();
            requestRender();
        }
        let lastLobbyWarn = 0;
        function playPause() {
            if (!song) { R.file.click(); return; }
            if (P.playing) { pausePlayback(); return; }
            if (P.pos >= song.duration - 0.01) P.pos = 0;
            if (Date.now() - lastLobbyWarn > 30000) { lastLobbyWarn = Date.now(); lobbyCheck(); }
            if (S.play.lead > 0) toast(`Starting in ${S.play.lead} s…`, 'info', Math.max(1200, S.play.lead * 1000));
            startAt(P.pos, S.play.lead);
        }
        function restoreSitePlaySoft() {
            if (!S.perf._sitePlayPrev) return;
            try {
                const p = S.perf._sitePlayPrev;
                const patch = {};
                if (p.showEffects !== undefined) patch.showEffects = p.showEffects;
                if (p.showBlur !== undefined) patch.showBlur = p.showBlur;
                if (p.polyphony !== undefined) patch.polyphony = p.polyphony;
                if (Object.keys(patch).length) writeSiteSettings(patch);
            } catch (e) { /* ignore */ }
            S.perf._sitePlayPrev = null;
        }
        function pausePlayback() {
            if (!P.playing) return;
            P.pos = curPos(); P.playing = false; playGate.playing = false;
            stopTimer(); releaseAll(); updateTransportUI(); requestRender();
        }
        function stopPlayback() {
            P.playing = false; playGate.playing = false;
            stopTimer(); releaseAll();
            P.pos = 0;
            updateTransportUI(); updateTimeUI(0, true); requestRender();
        }
        function unloadSong() {
            if (!song) { toast('No MIDI loaded', 'info', 1400); return; }
            stopPlayback();
            song = null; curItemId = null;
            trackMute.fill(0); soloTrack = -1; trackTr.fill(0);
            regionA = regionB = null; P.pos = 0; P.pass = 0;
            R.title.textContent = appTitle(); R.title.title = '';
            R.dur.textContent = '0:00';
            R.empty.classList.remove('hide');
            updateRegionUI(); updateInfo(); updateTransportUI(); updateTimeUI(0, true); renderTracks(); requestRender();
            if (drawer.classList.contains('open')) drRender();
            toast('MIDI unloaded', 'info', 1500);
        }
        function panic() {
            releaseAll();
            siteRelease();
            liveReleaseAll();
            toast('All notes released', 'info', 1400);
        }
        function seekTo(sec) {
            if (!song) return;
            sec = clamp(sec, 0, song.duration);
            if (P.playing) startAt(sec);
            else { P.pos = sec; releaseAll(); updateTimeUI(sec, true); requestRender(); }
        }

        /* =================================================================
         * FILE LOADING / LIBRARY
         * ================================================================= */
        let loaderEl = null;
        function ensureLoader() {
            if (loaderEl && loaderEl.isConnected) return loaderEl;
            loaderEl = document.createElement('div');
            loaderEl.className = 'pvx-loader';
            loaderEl.innerHTML = '<div class="pvx-loader-card"><div class="t">Loading MIDI</div><div class="s" data-s></div><div class="pvx-loader-bar"><i data-b></i></div><div class="pvx-loader-pct" data-p>0%</div></div>';
            document.body.appendChild(loaderEl);
            return loaderEl;
        }
        function showLoader(name, pct, stage) {
            const el = ensureLoader();
            el.classList.add('show');
            const s = el.querySelector('[data-s]');
            const b = el.querySelector('[data-b]');
            const p = el.querySelector('[data-p]');
            if (s) s.textContent = (stage ? stage + ' · ' : '') + (name || '');
            const v = Math.max(0, Math.min(100, pct | 0));
            if (b) b.style.width = v + '%';
            if (p) p.textContent = v + '%';
        }
        function hideLoader() {
            if (loaderEl) loaderEl.classList.remove('show');
        }
        function yieldUI() { return new Promise((r) => setTimeout(r, 0)); }

        async function buildSongAsync(midi, name, onProg) {
            // Count notes first
            let n = 0;
            for (const tr of midi.tracks) n += tr.notes.length;
            if (onProg) onProg(8, 'Reading tracks');
            await yieldUI();

            let st = new Float64Array(n), du = new Float32Array(n), pi = new Uint8Array(n), ve = new Uint8Array(n), tk = new Uint8Array(n);
            let k = 0, trackCount = 0;
            const tracks = [];
            const chunk = Math.max(2000, Math.floor(n / 20) || 2000);
            for (let ti = 0; ti < midi.tracks.length; ti++) {
                const track = midi.tracks[ti];
                if (track.notes.length) trackCount++;
                tracks.push({ idx: ti & 255, name: track.name || ('Track ' + (ti + 1)), notes: track.notes.length, inst: (track.instrument && track.instrument.name) || '' });
                for (let ni = 0; ni < track.notes.length; ni++) {
                    const nt = track.notes[ni];
                    st[k] = nt.time; du[k] = nt.duration;
                    pi[k] = clamp(nt.midi | 0, 0, 127);
                    ve[k] = clamp(Math.round(nt.velocity * 127), 1, 127);
                    tk[k] = ti & 255;
                    k++;
                    if ((k % chunk) === 0) {
                        if (onProg) onProg(8 + Math.floor(50 * k / Math.max(1, n)), 'Packing notes');
                        await yieldUI();
                    }
                }
            }
            if (onProg) onProg(60, 'Sorting');
            await yieldUI();

            let sorted = true;
            for (let i = 1; i < n; i++) { if (st[i] < st[i - 1]) { sorted = false; break; } }
            if (!sorted) {
                const idx = new Uint32Array(n);
                for (let i = 0; i < n; i++) idx[i] = i;
                // chunked sort still uses native sort once (fast); yield before/after
                idx.sort((a, b) => st[a] - st[b]);
                await yieldUI();
                const st2 = new Float64Array(n), du2 = new Float32Array(n), pi2 = new Uint8Array(n), ve2 = new Uint8Array(n), tk2 = new Uint8Array(n);
                for (let i = 0; i < n; i++) {
                    const j = idx[i];
                    st2[i] = st[j]; du2[i] = du[j]; pi2[i] = pi[j]; ve2[i] = ve[j]; tk2[i] = tk[j];
                    if ((i % chunk) === 0) { if (onProg) onProg(60 + Math.floor(15 * i / Math.max(1, n)), 'Sorting'); await yieldUI(); }
                }
                st = st2; du = du2; pi = pi2; ve = ve2; tk = tk2;
            }
            if (onProg) onProg(78, 'Indexing');
            await yieldUI();

            const endMax = new Float64Array(n);
            let em = 0;
            for (let i = 0; i < n; i++) {
                const e = st[i] + du[i];
                if (e > em) em = e;
                endMax[i] = em;
                if ((i % chunk) === 0) await yieldUI();
            }
            const duration = Math.max(midi.duration || 0, em);

            // Rest of buildSong (tempo / beats) — reuse original by calling buildSong on a lightweight path
            // For beats we still need the original logic; call synchronous tail via temporary midi-like shell
            if (onProg) onProg(88, 'Timing map');
            await yieldUI();

            // Use existing buildSong for header/tempo/beat data but avoid double note pack if possible.
            // Simplest reliable path: run original buildSong after yielding parse.
            const songObj = buildSong(midi, name);
            if (onProg) onProg(100, 'Done');
            return songObj;
        }

        async function loadBuffer(buf, name, o) {
            o = o || {};
            if (typeof Midi === 'undefined') { toast('MIDI parser library failed to load', 'error'); return false; }
            stopPlayback();
            R.title.textContent = 'Loading ' + name + '…';
            const sizeHint = (buf && buf.byteLength) || o.size || 0;
            const heavy = sizeHint > 400000 || (o.notes && o.notes > 8000);
            try {
                if (heavy) showLoader(name, 2, 'Starting');
                else await new Promise((r) => setTimeout(r, 10));

                if (heavy) showLoader(name, 12, 'Parsing file');
                await yieldUI();
                let midi = new Midi(buf);
                if (heavy) showLoader(name, 28, 'Building song');

                let built;
                if (heavy) {
                    // Yield between parse and build so UI can paint the loader
                    await yieldUI();
                    showLoader(name, 40, 'Processing notes');
                    await yieldUI();
                    built = buildSong(midi, name);
                    showLoader(name, 92, 'Finalizing');
                    await yieldUI();
                } else {
                    built = buildSong(midi, name);
                }
                midi = null;
                song = built;
                song.id = o.id || null;
                trackMute.fill(0); soloTrack = -1; trackTr.fill(0);
                regionA = regionB = null; P.pos = 0; P.pass = 0;
                R.title.textContent = appTitle(name); R.title.title = name;
                R.dur.textContent = fmtTime(song.duration);
                R.empty.classList.add('hide');
                updateRegionUI(); updateInfo(); updateTransportUI(); updateTimeUI(0, true); renderTracks(); requestRender();
                hideLoader();
                toast(`Loaded ${name} · ${fmtInt(song.n)} notes`, 'success');
                if (o.id && o.libWrite !== false) {
                    libUpsert({ id: o.id, name, kind: o.kind || 'file', size: o.size || (buf ? buf.byteLength : 0), notes: song.n, duration: song.duration, tracks: song.trackCount, bpm: Math.round(song.bpm) }, o.fromLib ? null : buf);
                }
                return true;
            } catch (err) {
                console.error('[PVX]', err);
                hideLoader();
                song = null;
                R.title.textContent = appTitle(); R.title.title = '';
                R.empty.classList.remove('hide');
                updateTransportUI(); updateInfo(); renderTracks(); requestRender();
                toast('Could not read that MIDI file', 'error');
                return false;
            }
        }
        async function loadFile(file) {
            if (!file) return;
            const buf = await file.arrayBuffer();
            await loadBuffer(buf, file.name, { id: `f|${file.name}|${file.size}|${file.lastModified}`, kind: 'file', size: file.size });
            R.file.value = '';
        }
        async function loadFromLib(id) {
            const it = libItems.find((x) => x.id === id);
            if (!it) return false;
            if (it.noData) { toast('That file was too large to cache. Open it again from disk.', 'warn', 4000); R.file.click(); return false; }
            let buf = null;
            try { buf = await DB.get(id); } catch (e) { /* ignore */ }
            if (!buf) { toast('Cached data missing. Open the file again.', 'warn'); return false; }
            return loadBuffer(buf, it.name, { id, kind: it.kind, fromLib: true, size: it.size });
        }
        function queueOrder() { return libItems.filter((x) => !x.noData).sort((a, b) => b.added - a.added); }
        function advanceQueue(random) {
            const q = queueOrder();
            if (!q.length) return;
            const cur = song ? q.findIndex((x) => x.id === song.id) : -1;
            let nxt;
            if (random && q.length > 1) { do { nxt = Math.floor(Math.random() * q.length); } while (nxt === cur); }
            else nxt = (cur + 1) % q.length;
            loadFromLib(q[nxt].id).then(() => { if (song) startAt(0, 0.4); });
        }

        listen(R.file, 'change', () => loadFile(R.file.files[0]));
        R.open.onclick = R.open2.onclick = () => R.file.click();
        R.unload.onclick = unloadSong;
        R.panic.onclick = () => panic();
        let dragDepth = 0;
        listen(root, 'dragenter', (e) => { e.preventDefault(); dragDepth++; R.drop.classList.add('show'); });
        listen(root, 'dragover', (e) => e.preventDefault());
        listen(root, 'dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; R.drop.classList.remove('show'); } });
        listen(root, 'drop', (e) => {
            e.preventDefault(); dragDepth = 0; R.drop.classList.remove('show');
            const f = Array.from(e.dataTransfer.files || []).find((x) => /\.midi?$/i.test(x.name));
            if (f) loadFile(f); else toast('Drop a .mid or .midi file', 'warn');
        });

        /* ---------- recent popover ---------- */
        let popTab = 'all';
        function renderPop() {
            R.poptabs.querySelectorAll('button[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === popTab));
            let items = libItems.slice().sort((a, b) => b.played - a.played);
            if (popTab === 'file') items = items.filter((x) => x.kind !== 'rec');
            else if (popTab === 'rec') items = items.filter((x) => x.kind === 'rec');
            else if (popTab === 'pin') items = items.filter((x) => x.pinned);
            R.poplist.innerHTML = '';
            if (!items.length) { R.poplist.appendChild(el('div', 'pvx-emptyl', 'Nothing here yet. Files you open and recordings you make show up here.')); return; }
            items.forEach((it) => {
                const row = el('div', 'pvx-item' + (song && song.id === it.id ? ' cur' : ''));
                row.title = it.noData ? 'Not cached (too large). Click to pick the file again.' : 'Click to load';
                row.innerHTML = `<div class="nm"><div class="t">${esc(it.name)}</div><div class="m">${fmtInt(it.notes || 0)} notes · ${fmtTime(it.duration)} · ${it.kind === 'rec' ? 'recording' : it.kind === 'shop' ? 'library' : 'file'} · ${fmtAgo(it.played)}${it.plays > 1 ? ' · ×' + it.plays : ''}${it.noData ? ' · not cached' : ''}</div></div>`;
                const acts = el('div', 'pvx-ia');
                const pin = el('button', 'pvx-btn' + (it.pinned ? ' pin' : ''), svg('star')); pin.title = it.pinned ? 'Unpin' : 'Pin (kept when pruning)';
                pin.onclick = (e) => { e.stopPropagation(); it.pinned = !it.pinned; DB.put(it, null).catch(() => {}); renderPop(); };
                acts.appendChild(pin);
                if (!it.noData) {
                    const dl = el('button', 'pvx-btn', svg('dl')); dl.title = 'Download .mid';
                    dl.onclick = async (e) => { e.stopPropagation(); const b = await DB.get(it.id).catch(() => null); if (b) download(/\.midi?$/i.test(it.name) ? it.name : it.name + '.mid', b); };
                    acts.appendChild(dl);
                }
                const del = el('button', 'pvx-btn', svg('trash')); del.title = 'Remove from history';
                del.onclick = (e) => { e.stopPropagation(); libItems.splice(libItems.indexOf(it), 1); DB.del(it.id).catch(() => {}); renderPop(); };
                acts.appendChild(del);
                row.appendChild(acts);
                row.onclick = () => { closePop(); loadFromLib(it.id); };
                R.poplist.appendChild(row);
            });
        }
        function openPop() {
            R.pop.classList.add('open');
            renderPop();
            const rr = R.recent.getBoundingClientRect(), br = root.getBoundingClientRect();
            const w = R.pop.offsetWidth;
            R.pop.style.left = clamp(rr.left - br.left, 8, Math.max(8, br.width - w - 8)) + 'px';
            R.pop.style.top = (rr.bottom - br.top + 4) + 'px';
        }
        function closePop() { R.pop.classList.remove('open'); }
        R.recent.onclick = () => (R.pop.classList.contains('open') ? closePop() : openPop());
        R.poptabs.querySelectorAll('button[data-tab]').forEach((b) => { b.onclick = () => { popTab = b.dataset.tab; renderPop(); }; });
        let clearArmed = 0;
        R.popclear.onclick = async () => {
            if (!clearArmed) { clearArmed = 1; R.popclear.textContent = 'Sure?'; setTimeout(() => { clearArmed = 0; R.popclear.textContent = 'Clear'; }, 2500); return; }
            clearArmed = 0; R.popclear.textContent = 'Clear';
            const keep = libItems.filter((x) => x.pinned && S.lib.pinKeep);
            for (const x of libItems.filter((y) => !keep.includes(y))) await DB.del(x.id).catch(() => {});
            libItems = keep; renderPop();
        };
        listen(document, 'pointerdown', (e) => { if (R.pop.classList.contains('open') && !R.pop.contains(e.target) && !R.recent.contains(e.target)) closePop(); }, true);
        bus.on('lib', () => { if (R.pop.classList.contains('open')) renderPop(); });

        /* ---------- recording UI ---------- */
        let recTimer = 0;
        function updateRecUI() {
            R.rec.classList.toggle('on', rec.on);
            if (!rec.on) { R.rectxt.textContent = 'Record'; return; }
            if (rec.t0 === null) { R.rectxt.textContent = 'Armed…'; return; }
            R.rectxt.textContent = `${fmtTime((performance.now() - rec.t0) / 1000)} · ${fmtInt(rec.count)}`;
        }
        bus.on('rec', () => {
            updateRecUI();
            clearInterval(recTimer);
            if (rec.on) {
                recTimer = setInterval(() => {
                    updateRecUI();
                    if (S.rec.maxMin > 0 && rec.t0 !== null && (performance.now() - rec.t0) / 60000 >= S.rec.maxMin) finishRecording();
                }, 250);
            }
        });
        function toggleRecord() {
            if (rec.on) finishRecording();
            else { recStart(); toast('Recording' + (S.rec.waitFirst ? ' armed. Starts at the first note.' : ' started.'), 'info', 2200); }
        }
        async function finishRecording() {
            const r = recStopBuild();
            if (!r) { toast('Nothing recorded', 'warn'); return; }
            lastRec = r;
            toast(`Recorded ${fmtInt(r.notes)} notes · ${fmtTime(r.duration)}`, 'success');
            const id = 'r|' + Date.now();
            if (S.rec.autoLoad) await loadBuffer(r.buf.slice(0), r.name, { id, kind: 'rec', size: r.buf.byteLength, libWrite: S.rec.autoSave });
            else if (S.rec.autoSave) await libUpsert({ id, name: r.name, kind: 'rec', size: r.buf.byteLength, notes: r.notes, duration: r.duration, tracks: r.tracks }, r.buf);
            if (S.rec.autoLoad && S.rec.autoSave === false) { /* loaded only */ }
        }
        R.rec.onclick = toggleRecord;

        /* =================================================================
         * UI STATE
         * ================================================================= */
        function updateTransportUI() {
            const has = !!song;
            R.play.innerHTML = svg(P.playing ? 'pause' : 'play');
            R.play.title = (P.playing ? 'Pause' : 'Play') + ' (Alt+P)';
            R.play.disabled = !has;
            root.classList.toggle('pvx-playing', P.playing);
            R.stop.disabled = R.back.disabled = R.fwd.disabled = !has;
            R.unload.disabled = !has;
            R.la.disabled = R.lb.disabled = !has;
            R.loop.classList.toggle('on', S.play.loop);
            R.hz.classList.toggle('on', S.hz.on);
            R.lg.classList.toggle('on', S.logger.on);
            R.dk.classList.toggle('on', S.dock.on);
            R.library.classList.toggle('on', drawer.classList.contains('open') || dockLibOpen);
            R.la.classList.toggle('on', regionA != null);
            R.lb.classList.toggle('on', regionB != null);
            updateDockBarUI();
        }
        function updateInfo() {
            if (!song) { R.info.innerHTML = '<span>No file loaded</span>'; return; }
            const bpm = Math.round(song.bpm * 10) / 10 + (song.tempoVaries ? ' (varies)' : '');
            R.info.innerHTML = `<span><b>${fmtInt(song.n)}</b> notes</span><span><b>${song.trackCount}</b> tracks</span><span><b>${bpm}</b> BPM</span><span><b>${song.sig}</b></span><span><b>${fmtTime(song.duration)}</b> long</span>${S.ui.showNps ? '<span class="nps"></span>' : ''}`;
        }
        let lastSec = -1;
        function updateTimeUI(pos, force) {
            const d = song ? song.duration : 0;
            const f = d ? clamp(pos / d, 0, 1) : 0;
            R.fill.style.transform = `scaleX(${f})`;
            R.hair.style.transform = `scaleX(${f})`;
            R.thumb.style.left = (f * 100) + '%';
            const sec = pos | 0;
            if (force || sec !== lastSec) {
                lastSec = sec;
                R.cur.textContent = fmtTime(pos);
                R.hmt.textContent = fmtTime(pos) + ' / ' + fmtTime(d);
                if (S.dock.on && DB.time) DB.time.textContent = fmtTime(pos) + ' / ' + fmtTime(d);
            }
        }
        function updateRegionUI() {
            if (!song || regionA == null) { R.region.style.display = 'none'; updateTransportUI(); return; }
            const b = regionB != null ? regionB : song.duration;
            R.region.style.display = 'block';
            R.region.style.left = (regionA / song.duration * 100) + '%';
            R.region.style.width = (Math.max(0, b - regionA) / song.duration * 100) + '%';
            updateTransportUI();
        }

        [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].forEach((v) => R.speed.appendChild(new Option(v + 'x', v)));
        function syncSpeedSelect() {
            if (!Array.from(R.speed.options).some((o) => +o.value === S.play.speed)) R.speed.appendChild(new Option(S.play.speed + 'x', S.play.speed));
            R.speed.value = String(S.play.speed);
        }
        listen(R.speed, 'change', () => changeSetting('play.speed', parseFloat(R.speed.value)));

        R.play.onclick = playPause;
        R.stop.onclick = stopPlayback;
        R.back.onclick = () => seekTo(curPos() - S.play.rewind);
        R.fwd.onclick = () => seekTo(curPos() + S.play.forward);
        R.loop.onclick = toggleLoop;
        R.hz.onclick = toggleHumanize;
        R.lg.onclick = toggleLogger;
        R.dk.onclick = toggleDock;
        listen(R.hz, 'contextmenu', (e) => { e.preventDefault(); openSettings('hz'); });
        listen(R.lg, 'contextmenu', (e) => { e.preventDefault(); openSettings('logger'); });
        listen(R.dk, 'contextmenu', (e) => { e.preventDefault(); openSettings('dock'); });
        listen(R.rec, 'contextmenu', (e) => { e.preventDefault(); openSettings('record'); });
        function toggleLoop() { changeSetting('play.loop', !S.play.loop); toast(S.play.loop ? 'Loop on' : 'Loop off', 'info', 1400); }
        function toggleHumanize() { changeSetting('hz.on', !S.hz.on); toast(S.hz.on ? 'Humanize on' : 'Humanize off', 'info', 1400); }
        function toggleLogger() { changeSetting('logger.on', !S.logger.on); toast(S.logger.on ? 'Logger on: live notes rise from the keys' : 'Logger off', 'info', 1800); }
        function toggleDock() { changeSetting('dock.on', !S.dock.on); toast(S.dock.on ? 'Piano replaced by the Studio dock' : 'Site piano restored', 'info', 1800); }
        R.la.onclick = () => {
            if (!song) return;
            if (regionA != null && regionB != null) regionA = regionB = null; else regionA = curPos();
            if (regionB != null && regionB <= regionA) regionB = null;
            updateRegionUI();
        };
        R.lb.onclick = () => {
            if (!song) return;
            const p = curPos();
            if (regionA == null) regionA = 0;
            if (p > regionA + 0.05) regionB = p;
            updateRegionUI();
            if (regionB != null && !S.play.loop) changeSetting('play.loop', true);
        };

        let tlDrag = false, tlWasPlaying = false;
        function tlPos(e) { const r = R.tl.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1) * (song ? song.duration : 0); }
        listen(R.tl, 'pointerdown', (e) => {
            if (!song) return;
            tlDrag = true; tlWasPlaying = P.playing;
            R.tl.setPointerCapture(e.pointerId);
            R.tl.classList.add('drag');
            if (P.playing) pausePlayback();
            seekTo(tlPos(e));
        });
        listen(R.tl, 'pointermove', (e) => {
            if (!song) return;
            const r = R.tl.getBoundingClientRect();
            const f = clamp((e.clientX - r.left) / r.width, 0, 1);
            R.tip.style.left = (f * 100) + '%';
            R.tip.textContent = fmtTime(f * song.duration);
            if (tlDrag) seekTo(tlPos(e));
        });
        const tlEnd = (e) => {
            if (!tlDrag) return;
            tlDrag = false;
            R.tl.classList.remove('drag');
            try { R.tl.releasePointerCapture(e.pointerId); } catch (x) { /* released */ }
            if (tlWasPlaying) startAt(P.pos);
        };
        listen(R.tl, 'pointerup', tlEnd);
        listen(R.tl, 'pointercancel', tlEnd);

        /* =================================================================
         * WINDOW MANAGEMENT
         * ================================================================= */
        function minSize() { const k = S.ui.scale / 100; return { w: Math.round(540 * k), h: Math.round(300 * k) }; }
        function headerPx() { return R.min.closest('.pvx-head').offsetHeight + 2; }
        function applyWindow() {
            const ms = minSize();
            const w = clamp(S.win.w, ms.w, Math.max(ms.w, innerWidth - 16));
            const h = clamp(S.win.h, ms.h, Math.max(ms.h, innerHeight - 16));
            let x = S.win.x, y = S.win.y;
            if (x < 0 || y < 0) { x = innerWidth - w - 24; y = innerHeight - h - 24; }
            x = clamp(x, 120 - w, innerWidth - 120);
            y = clamp(y, 0, innerHeight - 40);
            root.style.left = x + 'px'; root.style.top = y + 'px';
            root.style.width = w + 'px';
            const nostage = root.classList.contains('pvx-nostage');
            root.style.height = S.win.min ? headerPx() + 'px' : (nostage ? 'auto' : h + 'px');
            root.classList.toggle('pvx-min', S.win.min);
            R.min.innerHTML = svg(S.win.min ? 'restore' : 'min');
            R.min.title = (S.win.min ? 'Restore' : 'Minimize') + ' (Alt+M)';
            S.win.x = x; S.win.y = y; S.win.w = w; S.win.h = h;
            layoutDrawer();
        }
        function persistWindow() { if (S.ui.remember) saveSettings(); }
        function toggleMinimize() {
            S.win.min = !S.win.min;
            applyWindow();
            if (S.win.min) closePop();
            if (!S.win.min) setTimeout(() => { resizeCanvas(); requestRender(); }, 200);
            persistWindow();
        }
        R.min.onclick = toggleMinimize;
        function hideWindow() { pausePlayback(); closePop(); root.classList.add('pvx-hidden'); toast('HUD hidden. Press Alt+O to reopen.', 'info', 2600); }
        function showWindow() { root.classList.remove('pvx-hidden'); resizeCanvas(); requestRender(); }
        R.close.onclick = hideWindow;

        (function () {
            const head = root.querySelector('[data-drag]');
            let drag = null;
            listen(head, 'pointerdown', (e) => {
                if (e.button !== 0 || e.target.closest('button,input,select')) return;
                drag = { dx: e.clientX - root.offsetLeft, dy: e.clientY - root.offsetTop };
                head.setPointerCapture(e.pointerId);
                root.classList.add('pvx-dragging');
            });
            listen(head, 'pointermove', (e) => { if (!drag) return; S.win.x = e.clientX - drag.dx; S.win.y = e.clientY - drag.dy; applyWindow(); });
            const end = (e) => {
                if (!drag) return;
                drag = null; root.classList.remove('pvx-dragging');
                try { head.releasePointerCapture(e.pointerId); } catch (x) { /* released */ }
                persistWindow();
            };
            listen(head, 'pointerup', end);
            listen(head, 'pointercancel', end);
            listen(head, 'dblclick', (e) => { if (!e.target.closest('button,input,select')) toggleMinimize(); });
        })();
        (function () {
            let rs = null;
            listen(R.grip, 'pointerdown', (e) => {
                if (e.button !== 0) return;
                rs = { x: e.clientX, y: e.clientY, w: root.offsetWidth, h: root.offsetHeight };
                R.grip.setPointerCapture(e.pointerId);
                root.classList.add('pvx-resizing');
            });
            listen(R.grip, 'pointermove', (e) => { if (!rs) return; S.win.w = rs.w + (e.clientX - rs.x); S.win.h = rs.h + (e.clientY - rs.y); applyWindow(); });
            const end = (e) => {
                if (!rs) return;
                rs = null; root.classList.remove('pvx-resizing');
                try { R.grip.releasePointerCapture(e.pointerId); } catch (x) { /* released */ }
                persistWindow();
            };
            listen(R.grip, 'pointerup', end);
            listen(R.grip, 'pointercancel', end);
        })();
        let winRaf = 0;
        listen(window, 'resize', () => { if (winRaf) return; winRaf = origRAF(() => { winRaf = 0; applyWindow(); dockLayout(); }); });

        /* =================================================================
         * RENDERER (shared by the HUD and the dock)
         * ================================================================= */
        const IS_BLACK = new Uint8Array(128);
        for (let p = 0; p < 128; p++) IS_BLACK[p] = [1, 3, 6, 8, 10].includes(p % 12) ? 1 : 0;
        const vp = (p) => (p < MIN_NOTE ? MIN_NOTE : p > MAX_NOTE ? MAX_NOTE : p);
        const WI = new Int16Array(128);
        for (let p = 0; p < 128; p++) { let c = 0; for (let m = MIN_NOTE; m < vp(p); m++) if (!IS_BLACK[m]) c++; WI[p] = c; }
        function makeGeom(w) {
            const g = { kx: new Float32Array(128), kw: new Float32Array(128) };
            const ww = w / WHITE_COUNT, bw = ww * 0.62;
            for (let p = 0; p < 128; p++) {
                const q = vp(p);
                if (!IS_BLACK[q]) { g.kx[p] = WI[q] * ww; g.kw[p] = ww; }
                else { g.kx[p] = WI[q] * ww - bw / 2; g.kw[p] = bw; }
            }
            return g;
        }
        let gH = makeGeom(100), gD = makeGeom(100);
        function effDpr() {
            const cap = S.perf.quality === 'high' ? 2 : S.perf.quality === 'balanced' ? 1.25 : 1;
            return clamp((window.devicePixelRatio || 1) * S.perf.scale / 100, 0.5, cap * (S.perf.scale > 100 ? 2 : 1));
        }
        let vw = 0, vh = 0, dpr = 1;
        function resizeCanvas() {
            vw = Math.floor(R.stage.clientWidth); vh = Math.floor(R.stage.clientHeight);
            if (vw < 4 || vh < 4) return;
            dpr = effDpr();
            R.cv.width = Math.max(1, Math.round(vw * dpr));
            R.cv.height = Math.max(1, Math.round(vh * dpr));
            R.stage.style.setProperty('--kb', Math.min(S.viz.kbHeight, vh * 0.5) + 'px');
            gH = makeGeom(vw);
            requestRender();
        }
        const ro = new ResizeObserver(() => resizeCanvas());
        ro.observe(R.stage);

        const ALPHA = [0.42, 0.6, 0.8, 1];
        const VALPHA = [0.7, 0.82, 0.92, 1];
        const mBuckets = new Array(96).fill(null);
        const actBuf = new Uint8Array(128);
        const LB = new Map();
        let fpsEma = 60, fpsAvg = 60, renderMs = 0, visCount = 0, drawnCount = 0, autoFactor = 1, lastAutoCheck = 0, renderEma = 0;
        let dirty = true, rafId = 0, lastFrame = 0, statsT = 0, dockT = 0;
        let fpsDisplay = 60, fpsRing = [], fpsLastUi = 0;
        const maxDrawBase = () => (S.perf.quality === 'high' ? 220000 : S.perf.quality === 'balanced' ? 90000 : 35000);
        const WHITE_LETTER = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' };

        function drawLive(c, g, fallH) {
            const L = S.logger, now = performance.now(), lw = L.window, sc = fallH / lw, cut = now - lw * 1000;
            const kx = g.kx, kw = g.kw;
            LB.clear();
            const seen = new Set();
            for (let n = 0, i = live.head - 1; n < live.count; n++, i--) {
                const idx = (i + LIVE_CAP) % LIVE_CAP;
                const t0 = live.t0[idx], open = live.t1[idx] < 0, t1 = open ? now : live.t1[idx];
                if (t1 < cut) { if (t0 < cut - 30000) break; continue; }
                const ui = live.usr[idx], u = uList[ui];
                if (u.me ? !L.me : !L.others) continue;
                if (live.vel[idx] < L.minVel) continue;
                const key = live.key[idx];
                let yb = fallH - (now - t1) / 1000 * sc, yt = fallH - (now - t0) / 1000 * sc;
                if (yt < 0) yt = 0;
                if (yb > fallH) yb = fallH;
                let hh = yb - yt;
                if (hh < 1.5) { hh = 1.5; yt = yb - hh; }
                const blk = IS_BLACK[key];
                const lvl = L.fade ? Math.min(3, Math.floor((1 - clamp((now - t0) / (lw * 1000), 0, 1)) * 3.99)) : 3;
                const bk = ui * 8 + lvl * 2 + blk;
                let path = LB.get(bk);
                if (!path) { path = new Path2D(); LB.set(bk, path); }
                path.rect(kx[key] + 0.5, yt, kw[key] - 1, hh);
                seen.add(ui);
            }
            for (const [bk, path] of LB) {
                const ui = bk >> 3, lvl = (bk >> 1) & 3, blk = bk & 1;
                const col = L.colors === 'accent' ? C.accentRGB : uList[ui].rgb;
                c.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${ALPHA[lvl]})`;
                c.fill(path);
            }
            return seen;
        }

        function drawScene(c, w, h, kb, g, o) {
            const kx = g.kx, kw = g.kw, fallH = h - kb;
            const pos = curPos(), win = o.win, scaleY = fallH / win;
            c.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
            if (o.transparent) {
                c.clearRect(0, 0, w, h);
                c.fillStyle = C.bg2a(o.bgAlpha); c.fillRect(0, 0, w, fallH);
                c.fillStyle = C.bg; c.fillRect(0, fallH, w, kb);
            } else {
                c.fillStyle = C.bg2; c.fillRect(0, 0, w, fallH);
                c.fillStyle = C.bg; c.fillRect(0, fallH, w, kb);
            }
            if (S.viz.octaves) { c.fillStyle = C.oct; for (let p = 24; p <= MAX_NOTE; p += 12) c.fillRect(Math.round(kx[p]), 0, 1, fallH); }

            const act = actBuf; act.fill(0);
            visCount = 0; drawnCount = 0;
            const showMidi = !!(song && song.n && o.midi && S.viz.notes);
            if (showMidi && !o.thin && !P.playing && S.viz.grid && (S.viz.beats || S.viz.measures) && song.beatT.length > 1) {
                const bt = song.beatT, bm = song.beatM;
                let k = Math.max(0, lowerBoundArr(bt, pos) - 1);
                const spb = k + 1 < bt.length ? (bt[k + 1] - bt[k]) * scaleY : 999;
                const showBeats = S.viz.beats && spb >= 5;
                let pathB = null, pathM = null;
                for (; k < bt.length && bt[k] <= pos + win; k++) {
                    const y = Math.round(fallH - (bt[k] - pos) * scaleY) + 0.5;
                    if (y > fallH || y < 0) continue;
                    if (bm[k]) { if (S.viz.measures) (pathM || (pathM = new Path2D())).rect(0, y, w, 1); }
                    else if (showBeats) (pathB || (pathB = new Path2D())).rect(0, y, w, 1);
                }
                if (pathB) { c.fillStyle = C.grid; c.fill(pathB); }
                if (pathM) { c.fillStyle = C.gridStrong; c.fill(pathM); }
            }
            let colorMode = S.viz.colorMode;
            if (song && song.n) {
                const s = song;
                const lo = firstEndAtLeast(s, pos);
                const hi = showMidi ? upperBoundStart(s, pos + win) : upperBoundStart(s, pos);
                visCount = Math.max(0, hi - lo);
                let maxDraw = Math.max(1200, Math.floor(maxDrawBase() * autoFactor));
                // Black-MIDI path: almost no individual note rects — keep the main thread free
                const nNotes = song ? song.n : 0;
                const black = !!(S.perf.blackMidi) || nNotes > 80000 || (P.playing && nNotes > 25000 && autoFactor < 0.35);
                if (black && (o.thin || P.playing || S.perf.blackMidi)) {
                    maxDraw = S.perf.blackMidi ? 120 : (S.perf.mode ? 400 : 900);
                } else if (o.thin || P.playing) {
                    if (S.perf.mode) maxDraw = Math.min(maxDraw, 2500);
                    else if (nNotes > 40000) maxDraw = Math.min(maxDraw, 3200);
                    else if (nNotes > 20000) maxDraw = Math.min(maxDraw, 5000);
                    else if (nNotes > 8000) maxDraw = Math.min(maxDraw, 7000);
                    else maxDraw = Math.min(maxDraw, 9000);
                }
                const stride = visCount > maxDraw ? Math.ceil(visCount / maxDraw) : 1;
                const trackMode = colorMode === 'track', pitchMode = colorMode === 'pitch', velMode = S.viz.velocity;
                if (showMidi) for (let b = 0; b < 96; b++) mBuckets[b] = null;
                let sk = 0;
                for (let i = lo; i < hi; i++) {
                    const stt = s.st[i], e = stt + s.du[i];
                    if (e < pos) continue;
                    if (trackOff(s.tk[i])) continue;
                    const p = mapPitch(s.pi[i], s.tk[i]);
                    if (p < 0) continue;
                    if (stt <= pos) act[p] = 1;
                    if (!showMidi) continue;
                    if (stride > 1) { if (++sk < stride) continue; sk = 0; }
                    let yb = fallH - (stt - pos) * scaleY, yt = fallH - (e - pos) * scaleY;
                    if (yb > fallH) yb = fallH;
                    if (yt < 0) yt = 0;
                    let hh = yb - yt;
                    if (hh < 1.2) { hh = 1.2; yt = yb - hh; } else if (hh > 2.5) hh -= 0.6;
                    const blk = IS_BLACK[p];
                    const ci = trackMode ? (s.tk[i] & 7) : pitchMode ? (p % 12) : 0;
                    const bi = (((ci * 4) + (velMode ? (s.ve[i] >> 5) : 3)) << 1) | blk;
                    const path = mBuckets[bi] || (mBuckets[bi] = new Path2D());
                    path.rect(kx[p] + 0.5, yt, kw[p] - 1, hh);
                    drawnCount++;
                }
                if (showMidi) {
                    const mop = S.viz.opacity / 100;
                    for (let bi = 0; bi < 96; bi++) {
                        const path = mBuckets[bi];
                        if (!path) continue;
                        const blk = bi & 1, vb = (bi >> 1) & 3, ci = bi >> 3;
                        c.globalAlpha = VALPHA[vb] * mop;
                        c.fillStyle = trackMode ? C.palLight[ci] : pitchMode ? C.pcLight[ci] : C.accent;
                        c.fill(path);
                    }
                    c.globalAlpha = 1;
                }
            }

            let seen = null;
            if (S.logger.on) seen = drawLive(c, g, fallH);

            c.fillStyle = C.line; c.fillRect(0, fallH, w, 1);

            if (S.logger.on && S.logger.legend && seen && seen.size && w > 320) {
                c.font = '11px -apple-system,"Segoe UI",sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
                let y = 12;
                for (const ui of Array.from(seen).slice(0, 8)) {
                    const u = uList[ui], col = S.logger.colors === 'accent' ? C.accentRGB : u.rgb;
                    const label = u.me ? u.name + ' (you)' : u.name;
                    c.fillStyle = C.tx2; c.fillText(label, w - 20, y);
                    c.fillStyle = rgbStr(...col); c.beginPath(); c.arc(w - 10, y, 3.5, 0, 6.2832); c.fill();
                    y += 15;
                }
                c.textBaseline = 'alphabetic';
            }

            // keyboard
            const ww = w / WHITE_COUNT;
            const lk = o.liveKeys;
            c.fillStyle = C.keyW;
            for (let p = MIN_NOTE; p <= MAX_NOTE; p++) if (!IS_BLACK[p] && !act[p] && !(lk && liveKeyUsr[p] >= 0)) c.fillRect(kx[p] + 0.5, fallH + 1, ww - 1, kb - 1);
            for (let p = MIN_NOTE; p <= MAX_NOTE; p++) {
                if (IS_BLACK[p]) continue;
                const u = lk ? liveKeyUsr[p] : -1;
                if (u >= 0) c.fillStyle = rgbStr(...uList[u].rgb);
                else if (act[p]) c.fillStyle = C.accent;
                else continue;
                c.fillRect(kx[p] + 0.5, fallH + 1, ww - 1, kb - 1);
            }
            const lab = o.labels;
            if (lab !== 'off' && kb >= 34 && ww > 9) {
                c.font = '9px -apple-system,"Segoe UI",sans-serif'; c.textAlign = 'center';
                c.fillStyle = C.tx3;
                for (let p = MIN_NOTE; p <= MAX_NOTE; p++) {
                    if (IS_BLACK[p]) continue;
                    const isC = p % 12 === 0;
                    if (lab === 'c' && !isC) continue;
                    if (lab === 'all' && ww < 14 && !isC) continue;
                    const u = lk ? liveKeyUsr[p] : -1;
                    if (act[p] || u >= 0) continue;
                    c.fillText(isC ? 'C' + (p / 12 - 1) : WHITE_LETTER[p % 12], kx[p] + ww / 2, h - 5);
                }
            }
            const bh = kb * 0.62;
            for (let p = MIN_NOTE; p <= MAX_NOTE; p++) {
                if (!IS_BLACK[p]) continue;
                const u = lk ? liveKeyUsr[p] : -1;
                const lit = u >= 0 || act[p];
                const col = u >= 0 ? uList[u].rgb : null;
                c.fillStyle = u >= 0 ? rgbStr(...mix(col, [0, 0, 0], 0.12)) : act[p] ? C.accent : C.keyB;
                c.fillRect(kx[p], fallH + 1, kw[p], bh);
                c.fillStyle = lit ? (u >= 0 ? rgbStr(...col) : C.accent) : C.keyBEdge;
                c.fillRect(kx[p], fallH + bh, kw[p], 1);
            }
        }

        let hudFrameSkip = 0;
        function renderHud() {
            // Skip expensive HUD canvas work when docked/hidden/minimized
            if (vw < 4 || vh < 4 || S.win.min || S.dock.on || root.classList.contains('pvx-hidden') || root.classList.contains('pvx-nostage') || (P.playing && !S.perf.hudPlay)) return;
            // Unminimized + playing was the lag source — half-rate + thinner scene
            if (P.playing || S.perf.blackMidi) {
                if (S.perf.blackMidi) {
                    hudFrameSkip = (hudFrameSkip + 1) % 4;
                    if (hudFrameSkip) return;
                } else {
                    const dense = song && song.n > 10000;
                    hudFrameSkip = (hudFrameSkip + 1) % (dense || renderEma > 12 ? 3 : 2);
                    if (hudFrameSkip) return;
                }
            }
            const t0 = performance.now();
            const kb = Math.min(S.viz.kbHeight, vh * 0.5);
            const dprUse = P.playing ? Math.min(dpr, 1.25) : dpr;
            drawScene(ctx, vw, vh, kb, gH, {
                dpr: dprUse,
                transparent: false,
                win: S.viz.window,
                midi: !(S.logger.on && S.logger.hideMidi),
                liveKeys: false,
                labels: P.playing ? 'off' : S.viz.labels,
                thin: !!P.playing,
            });
            renderMs = performance.now() - t0;
            renderEma = renderEma * 0.9 + renderMs * 0.1;
        }
        let dockFrameSkip = 0;
        function renderDock() {
            if (!S.dock.on || dockCv.style.display !== 'block' || dW < 4 || dH < 4) return;
            if (!P.playing && !S.logger.on && !song) return;
            // While playing: 1/2 rate normal, 1/3 rate on dense / high render cost
            if (P.playing || S.perf.blackMidi) {
                const heavy = S.perf.blackMidi || (song && song.n > 12000) || renderEma > 10 || S.perf.mode;
                dockFrameSkip = (dockFrameSkip + 1) % (S.perf.blackMidi ? 4 : heavy ? 3 : 2);
                if (dockFrameSkip) return;
            }
            const dense = !!(song && song.n > 10000);
            const dprUse = Math.min(dDpr, (S.perf.mode || dense || P.playing) ? 1 : dDpr);
            const showMidi = S.dock.midi && !!song;
            const labels = (!P.playing && S.dock.labels) ? 'all' : 'off';
            drawScene(dctx, dW, dH, dKb, gD, {
                dpr: dprUse,
                transparent: true,
                bgAlpha: S.dock.bgAlpha / 100,
                win: S.dock.window,
                midi: showMidi,
                liveKeys: false,
                labels,
                thin: P.playing || dense || S.perf.mode,
            });
        }

        function requestRender() {
            dirty = true;
            if (!rafId) rafId = origRAF(frame);
            else if (typeof rafId === 'number' && rafId > 0) {
                // was an idle timeout — promote to immediate frame
                try { clearTimeout(rafId); } catch (e) {}
                rafId = origRAF(frame);
            }
        }
        function updateFpsChipLegacy() {
            const fpsEl = document.getElementById('pvx-fps');
            if (!fpsEl) return;
            const shown = (P.playing || dirty) ? fpsDisplay : fpsDisplay;
            fpsEl.innerHTML = `<b>${shown}</b> FPS`;
            fpsEl.title = `ema ${fpsEma.toFixed(0)} · avg ${fpsAvg.toFixed(0)} · draw ${renderMs.toFixed(1)} ms · q ${(autoFactor * 100) | 0}%` + (S.perf.blackMidi ? ' · BLACK' : '');
        }
        function frame(ts) {
            rafId = 0;
            if (document.hidden) {
                rafId = setTimeout(() => { rafId = 0; if (!document.hidden) requestRender(); }, 1000);
                return;
            }
            const minI = S.perf.fps > 0 ? 1000 / S.perf.fps - 1.5 : 0;
            const nowFrame = performance.now();
            const liveAnim = S.logger.on && (nowFrame < animUntil || liveHeld > 0);
            const need = P.playing || dirty || liveAnim;
            if (minI && need && ts - lastFrame < minI) {
                rafId = origRAF(frame);
                return;
            }
            if (!need) {
                // Idle: park the loop; FPS chip holds last reading
                updateFpsChip();
                rafId = setTimeout(() => { rafId = 0; if (dirty || P.playing) requestRender(); }, 250);
                return;
            }
            lastFrame = ts;

            // FPS from frames that actually did work (draw or play)
            const wallNow = performance.now();
            fpsRing.push(wallNow);
            while (fpsRing.length > 2 && wallNow - fpsRing[0] > 1000) fpsRing.shift();
            if (fpsRing.length >= 2) {
                const span = fpsRing[fpsRing.length - 1] - fpsRing[0];
                if (span > 0) {
                    const inst = (fpsRing.length - 1) * 1000 / span;
                    fpsDisplay = Math.round(Math.min(240, Math.max(0, inst)));
                    fpsEma = fpsEma * 0.75 + fpsDisplay * 0.25;
                    fpsAvg = fpsAvg * 0.9 + fpsDisplay * 0.1;
                }
            }
            updateFpsChip();

            if (P.playing) updateTimeUI(curPos(), false);
            if (S.dock.on && ts - dockT > 900) { dockT = ts; dockLayout(); }

            if (need) {
                dirty = false;
                const t0 = performance.now();
                renderHud();
                // Skip dock redraw some frames when already under load
                if (!(P.playing && renderEma > 12 && (fpsDisplay & 1))) renderDock();
                renderMs = performance.now() - t0;
                renderEma = renderEma * 0.82 + renderMs * 0.18;
            }

            if (S.perf.auto && P.playing && ts - lastAutoCheck > 500) {
                lastAutoCheck = ts;
                const black = song && song.n > 40000;
                if (renderEma > 18 || (black && renderEma > 10)) autoFactor = Math.max(0.04, autoFactor * 0.5);
                else if (renderEma > 14) autoFactor = Math.max(0.06, autoFactor * 0.65);
                else if (renderEma > 10) autoFactor = Math.max(0.1, autoFactor * 0.8);
                else if (renderEma < 4 && autoFactor < 1 && !black) autoFactor = Math.min(1, autoFactor * 1.18);
                else if (renderEma < 6 && autoFactor < 1) autoFactor = Math.min(1, autoFactor * 1.05);
            }
            if (!S.perf.auto) autoFactor = 1;

            if (ts - statsT > 500) {
                statsT = ts;
                if (S.perf.stats) {
                    R.stats.textContent =
                        `FPS ${fpsDisplay} (ema ${fpsEma.toFixed(0)}) · render ${renderMs.toFixed(1)} ms
` +
                        `notes ${fmtInt(song ? song.n : 0)} · visible ${fmtInt(visCount)} · drawn ${fmtInt(drawnCount)}
` +
                        `${P.playing ? 'playing' : 'idle'} · scheduler ${usingWorker ? 'worker' : 'timer'} · pending offs ${hN}` +
                        (autoFactor < 1 ? ` · auto ${(autoFactor * 100) | 0}%` : '') +
                        (S.perf.blackMidi ? ' · BLACK' : '') +
                        `
live ${live.count} · held ${liveHeld} · users ${uList.length}${rec.on ? ' · REC ' + rec.count : ''}`;
                }
            }

            if (need) rafId = origRAF(frame);
            else rafId = setTimeout(() => { rafId = 0; if (dirty || P.playing) requestRender(); }, 250);
        }
        // livetick is already rAF-batched in scheduleLiveTick
        bus.on('livetick', () => { requestRender(); });

        /* =================================================================
         * DOCK (replaces the site's piano visuals)
         * ================================================================= */
        let dW = 0, dH = 0, dKb = 56, dDpr = 1;
        function dockFind() {
            const keys = document.querySelector('pv-keys');
            if (!keys) return null;
            const kr = keys.getBoundingClientRect();
            if (kr.width < 80 || kr.height < 10) return null;
            const tb = document.querySelector('pv-toolbar .toolbar') || document.querySelector('pv-toolbar');
            let top;
            const tbr = tb && tb.getBoundingClientRect();
            if (tbr && tbr.height > 0) top = tbr.bottom;
            else { const bg = document.querySelector('pv-canvas .bg-canvas'); top = bg ? bg.getBoundingClientRect().top : kr.top - 300; }
            top = Math.min(top, kr.top - 60);
            return { left: kr.left, top, width: kr.width, height: kr.bottom - top, kb: kr.height };
        }
        function dockLayout() {
            if (!S.dock.on) { dockCv.style.display = 'none'; return; }
            const r = dockFind();
            if (!r) { dockCv.style.display = 'none'; return; }
            dockCv.style.display = 'block';
            const L = Math.round(r.left), T = Math.round(r.top), W = Math.round(r.width), H = Math.round(r.height);
            dockCv.style.left = L + 'px'; dockCv.style.top = T + 'px';
            dockCv.style.width = W + 'px'; dockCv.style.height = H + 'px';
            const kb = Math.min(Math.round(r.kb), Math.floor(H * 0.7));
            if (W !== dW || H !== dH || kb !== dKb) {
                dW = W; dH = H; dKb = kb; dDpr = effDpr();
                dockCv.width = Math.max(1, Math.round(W * dDpr)); dockCv.height = Math.max(1, Math.round(H * dDpr));
                gD = makeGeom(W);
                requestRender();
            }
        }
        function findChatSidebar() {
            return document.querySelector('.chat') || document.querySelector('pv-users') || document.querySelector('main.app .chat');
        }
        function positionDockBar() {
            const side = findChatSidebar();
            const pad = 8;
            if (!side) {
                dockBar.style.cssText = `position:fixed;left:${pad}px;top:56px;width:280px;height:calc(100vh - 64px);z-index:2147483500;display:flex;border-radius:12px;`;
                return;
            }
            const r = side.getBoundingClientRect();
            if (r.width < 40 || r.height < 40) return;
            const left = Math.round(r.left + pad);
            const top = Math.round(r.top + pad);
            const w = Math.max(180, Math.round(r.width - pad * 2));
            const h = Math.max(200, Math.round(r.height - pad * 2));
            dockBar.style.cssText = `position:fixed;left:${left}px;top:${top}px;width:${w}px;height:${h}px;z-index:2147483500;display:flex;border-radius:12px;`;
        }
        function mountDockBar() {
            if (dockBar.parentNode !== document.body) document.body.appendChild(dockBar);
            dockBar.style.display = 'flex';
            positionDockBar();
            applyThemeToDockBar();
            // hide original player list visually (do not destroy site DOM)
            document.documentElement.classList.add('pvx-dock-users-hidden');
        }
        function unmountDockBar() {
            dockBar.style.display = 'none';
            if (dockBar.parentNode) dockBar.parentNode.removeChild(dockBar);
            document.documentElement.classList.remove('pvx-dock-users-hidden');
            // restore drawer to normal floating behavior on body
            drawer.classList.remove('pvx-dock-lib', 'open');
            drawer.style.cssText = '';
            dockLibOpen = false;
            if (DB.libhost) DB.libhost.classList.remove('open');
            if (drawer.parentNode && drawer.parentNode !== document.body) {
                drawer.parentNode.removeChild(drawer);
            }
            if (!document.body.contains(drawer)) document.body.appendChild(drawer);
        }
        function applyThemeToDockBar() {
            try {
                const th = THEMES[S.ui.theme] || THEMES.graphite;
                const ac = resolveAccent();
                const vars = {
                    '--bg': th.bg, '--bg2': th.bg2, '--panel': th.panel, '--elev': th.elev, '--line': th.line,
                    '--tx': th.tx, '--tx2': th.tx2, '--tx3': th.tx3,
                    '--ac': rgbStr(...ac), '--ac-rgb': ac.map(Math.round).join(','),
                };
                for (const k in vars) dockBar.style.setProperty(k, vars[k]);
            } catch (e) { /* theme not ready */ }
        }
        function updateDockBarUI() {
            if (!S.dock.on || !DB.title) return;
            try {
                DB.title.textContent = song ? appTitle(song.name) : appTitle();
                DB.title.title = song ? song.name : '';
                const pos = curPos();
                const dur = song ? song.duration : 0;
                DB.time.textContent = fmtTime(pos) + ' / ' + fmtTime(dur);
                DB.play.innerHTML = P.playing ? svg('pause') : svg('play');
                DB.rec.classList.toggle('on', rec.on);
                DB.hz.classList.toggle('on', S.hz.on);
                if (DB.logger) DB.logger.classList.toggle('on', S.logger.on);
                DB.library.classList.toggle('on', dockLibOpen);
                if (DB.loop) DB.loop.classList.toggle('on', S.play.loop);
                // status line + accent dot
                let st = 'Ready';
                if (P.playing) st = 'Playing';
                else if (song) st = 'Loaded · paused';
                if (rec.on) st += ' · Recording';
                if (S.hz.on) st += ' · Humanize';
                if (S.logger.on) st += ' · Logger';
                if (dockLibOpen) st += ' · Library open';
                if (DB.status) DB.status.innerHTML = st.replace(/ · /g, ' · <b>').replace(/^([^·]+)/, '<b>$1</b>');
                if (DB.sub) DB.sub.textContent = song ? (P.playing ? 'Playing' : 'Paused') + (S.hz.on ? ' · Hz' : '') + (S.logger.on ? ' · Log' : '') : 'Docked · open a MIDI or Library';
                if (DB.dot) {
                    DB.dot.style.background = P.playing ? '#6FBF8B' : (rec.on ? '#E5484D' : 'var(--ac)');
                    DB.dot.style.boxShadow = P.playing ? '0 0 8px #6FBF8B' : (rec.on ? '0 0 8px #E5484D' : '0 0 8px var(--ac)');
                }
            } catch (e) { /* ignore */ }
        }
        function toggleDockLibrary(force) {
            if (!S.dock.on) {
                toggleDrawer(force);
                return;
            }
            const open = force !== undefined ? force : !dockLibOpen;
            dockLibOpen = open;
            DB.libhost.classList.toggle('open', open);
            // show library inside the dock bar host area
            if (open) {
                // ensure drawer is inside libhost and styled as embedded
                if (drawer.parentNode !== DB.libhost) {
                    if (drawer.parentNode) drawer.parentNode.removeChild(drawer);
                    DB.libhost.appendChild(drawer);
                }
                drawer.classList.add('pvx-dock-lib');
                drawer.style.cssText = 'position:static;width:100%;height:100%;max-height:none;transform:none;opacity:1;pointer-events:auto;border-radius:0;box-shadow:none;display:flex;flex-direction:column;';
                drawer.classList.add('open');
                if (!dr.inited) {
                    dr.inited = true;
                    drTab(['bitmidi', 'vgm', 'repo', 'fav', 'queue'].includes(S.shop.tab) ? S.shop.tab : 'bitmidi');
                } else {
                    drRender();
                }
            } else {
                drawer.classList.remove('open');
                drawer.style.display = 'none';
            }
            updateDockBarUI();
        }
        function applyDock() {
            document.documentElement.classList.toggle('pvx-dock-on', S.dock.on);
            root.classList.toggle('pvx-nostage', S.dock.on);
            if (S.dock.on) {
                root.classList.add('pvx-hidden');
                mountDockBar();
                // reposition if layout changes
                if (!window.__pvxDockPos) {
                    window.__pvxDockPos = setInterval(() => {
                        if (!S.dock.on) { clearInterval(window.__pvxDockPos); window.__pvxDockPos = null; return; }
                        positionDockBar();
                    }, 800);
                }
            } else {
                if (window.__pvxDockPos) { clearInterval(window.__pvxDockPos); window.__pvxDockPos = null; }
                unmountDockBar();
                root.classList.remove('pvx-hidden');
            }
            dW = dH = 0;
            dockLayout();
            applyWindow();
            resizeCanvas();
            updateTransportUI();
            updateDockBarUI();
            requestRender();
        }

        // Wire dock bar buttons
        DB.undock.onclick = () => { changeSetting('dock.on', false); toast('Studio restored', 'info', 1600); };
        DB.open.onclick = () => { try { R.file.click(); } catch (e) {} };
        DB.play.onclick = () => { try { playPause(); } catch (e) {} };
        DB.stop.onclick = () => { try { stopPlayback(); } catch (e) {} };
        DB.back.onclick = () => { try { if (song) seekTo(curPos() - S.play.rewind); } catch (e) {} };
        DB.fwd.onclick = () => { try { if (song) seekTo(curPos() + S.play.forward); } catch (e) {} };
        DB.library.onclick = () => { try { toggleDockLibrary(); } catch (e) {} };
        DB.rec.onclick = () => { try { toggleRecord(); } catch (e) {} };
        DB.hz.onclick = () => { try { toggleHumanize(); } catch (e) {} };
        if (DB.logger) DB.logger.onclick = () => { try { toggleLogger(); } catch (e) {} };
        DB.loop.onclick = () => { try { toggleLoop(); } catch (e) {} };
        DB.panic.onclick = () => { try { panic(); } catch (e) {} };

        /* =================================================================
         * CLICKING THE STUDIO PIANO PLAYS PIANOVERSE
         * ================================================================= */
        function sitePress(key, vel) {
            const k = document.querySelector('pv-keys [data-key="' + key + '"]');
            if (!k) return false;
            const r = k.getBoundingClientRect();
            const y = r.top + clamp(vel / 127, 0, 1) * Math.max(1, r.height - 1);
            k.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: r.left + r.width / 2, clientY: y }));
            return true;
        }
        const siteRelease = () => document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
        function clickPress(key, vel) {
            const t = S.click.target;
            if (t !== 'midi' && !sitePress(key, vel)) toast('Pianoverse piano not found', 'error');
            if (t !== 'site') sendRaw(0x90, key, vel);
        }
        function clickRelease(key) {
            const t = S.click.target;
            if (t !== 'midi') siteRelease();
            if (t !== 'site') sendRaw(0x80, key, 0);
        }
        function keyAt(x, y, w, h, kb, g) {
            if (y < h - kb) return { key: -1 };
            const yy = y - (h - kb), bh = kb * 0.62;
            let key = -1;
            if (yy < bh) { for (let p = MIN_NOTE; p <= MAX_NOTE; p++) if (IS_BLACK[p] && x >= g.kx[p] && x < g.kx[p] + g.kw[p]) { key = p; break; } }
            if (key < 0) for (let p = MIN_NOTE; p <= MAX_NOTE; p++) if (!IS_BLACK[p] && x >= g.kx[p] && x < g.kx[p] + g.kw[p]) { key = p; break; }
            return { key, frac: clamp(yy / kb, 0, 1) };
        }
        let heldKey = -1;
        const clickVel = (frac) => (S.click.vel > 0 ? S.click.vel : Math.round(25 + frac * 100));
        listen(R.cv, 'pointerdown', (e) => {
            if (e.button !== 0) return;
            const r = R.cv.getBoundingClientRect();
            const kb = Math.min(S.viz.kbHeight, vh * 0.5);
            const hit = keyAt(e.clientX - r.left, e.clientY - r.top, vw, vh, kb, gH);
            if (hit.key < 0) return;
            R.cv.setPointerCapture(e.pointerId);
            heldKey = hit.key;
            clickPress(hit.key, clickVel(hit.frac));
        });
        listen(R.cv, 'pointermove', (e) => {
            if (heldKey < 0) return;
            const r = R.cv.getBoundingClientRect();
            const kb = Math.min(S.viz.kbHeight, vh * 0.5);
            const hit = keyAt(e.clientX - r.left, e.clientY - r.top, vw, vh, kb, gH);
            if (hit.key >= 0 && hit.key !== heldKey) { clickRelease(heldKey); heldKey = hit.key; clickPress(hit.key, clickVel(hit.frac)); }
        });
        const clickEnd = (e) => {
            if (heldKey < 0) return;
            clickRelease(heldKey); heldKey = -1;
            try { R.cv.releasePointerCapture(e.pointerId); } catch (x) { /* released */ }
        };
        listen(R.cv, 'pointerup', clickEnd);
        listen(R.cv, 'pointercancel', clickEnd);

        /* ---------- fallback: capture my own notes when the site does not send them (alone in a room) ---------- */
        const domOn = new Uint8Array(128), domOwn = new Uint8Array(128);
        function colorMatchesMe(bg) {
            const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg);
            const me = parseHex(net.me.color);
            if (!m || !me) return true;
            return Math.abs(+m[1] - me[0]) < 3 && Math.abs(+m[2] - me[1]) < 3 && Math.abs(+m[3] - me[2]) < 3;
        }
        let keyObserver = null;
        let keyObsQueued = false, keyObsMuts = [];
        function startKeyObserver() {
            const keys = document.querySelector('pv-keys');
            if (!keys) { setTimeout(startKeyObserver, 1000); return; }
            keyObserver = new MutationObserver((muts) => {
                // Batch attribute storms from multiplayer note flashes
                if (!S.logger.on && !rec.on) { keyObsMuts.length = 0; return; }
                if (keyObsMuts.length > 4000) keyObsMuts.length = 0;
                for (let i = 0; i < muts.length; i++) keyObsMuts.push(muts[i]);
                if (keyObsQueued) return;
                keyObsQueued = true;
                requestAnimationFrame(() => {
                    keyObsQueued = false;
                    const batch = keyObsMuts; keyObsMuts = [];
                    for (const m of batch) {
                        const t = m.target;
                        if (!t.dataset || !t.dataset.key) continue;
                        const key = +t.dataset.key, bg = t.style.backgroundColor, on = !!bg;
                        if (on === !!domOn[key]) continue;
                        domOn[key] = on ? 1 : 0;
                        if (on) {
                            if (performance.now() - lastWsOn[key] < 250 || !colorMatchesMe(bg)) continue;
                            domOwn[key] = 1;
                            liveEvent(ME_ID(), key, 80, true, 'dom');
                        } else if (domOwn[key]) { domOwn[key] = 0; liveEvent(ME_ID(), key, 0, false, 'dom'); }
                    }
                });
            });
            keyObserver.observe(keys, { attributes: true, attributeFilter: ['style'], subtree: true });
        }

        /* =================================================================
         * SETTINGS PANEL
         * ================================================================= */
        /* =================================================================
         * ONLINE LIBRARY DRAWER (slides out of the Studio)
         * ================================================================= */
        const DQ = {};
        drawer.querySelectorAll('[data-d]').forEach((n) => { DQ[n.dataset.d] = n; });
        const readJSON = (k) => { try { const a = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
        const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
        let favs = readJSON('siphon.favs'), queue = readJSON('siphon.queue'), qPos = -1, curItemId = null;
        const dr = { tab: 'bitmidi', items: [], loading: false, msg: '', limit: 60, token: 0, bmPage: 0, bmQuery: '', bmMore: false, bmFallback: false, bmPop: null, vgSel: '', repoSel: '', vgCache: new Map(), repoCache: new Map(), inited: false };
        const BMBASE = 'https://bitmidi.com';
        const VGM = [
            ['Piano only', 'https://vgmusic.com/music/other/miscellaneous/piano/'],
            ['NES', 'https://vgmusic.com/music/console/nintendo/nes/'],
            ['SNES', 'https://vgmusic.com/music/console/nintendo/snes/'],
            ['Game Boy', 'https://vgmusic.com/music/console/nintendo/gameboy/'],
            ['Nintendo 64', 'https://vgmusic.com/music/console/nintendo/n64/'],
            ['Game Boy Advance', 'https://vgmusic.com/music/console/nintendo/gba/'],
            ['GameCube', 'https://vgmusic.com/music/console/nintendo/gamecube/'],
            ['Wii', 'https://vgmusic.com/music/console/nintendo/wii/'],
            ['Genesis', 'https://vgmusic.com/music/console/sega/genesis/'],
            ['Master System', 'https://vgmusic.com/music/console/sega/master/'],
            ['Dreamcast', 'https://vgmusic.com/music/console/sega/dreamcast/'],
            ['PlayStation', 'https://vgmusic.com/music/console/sony/ps1/'],
            ['PlayStation 2', 'https://vgmusic.com/music/console/sony/ps2/'],
            ['PC / Windows', 'https://vgmusic.com/music/computer/microsoft/windows/'],
            ['Arcade', 'https://vgmusic.com/music/other/miscellaneous/arcade/'],
            ['Medleys', 'https://vgmusic.com/music/other/miscellaneous/medley/'],
            ['Anime', 'https://vgmusic.com/music/other/miscellaneous/anime/'],
            ['Movie & TV', 'https://vgmusic.com/music/other/miscellaneous/movie/'],
        ];
        const BM_CHIPS = ['Zelda', 'Mario', 'Pokemon', 'Final Fantasy', 'Anime', 'Beethoven', 'Chopin', 'Disney', 'Queen', 'Piano', 'Jazz', 'Christmas', 'Undertale', 'Hollow Knight', 'Persona', 'Kingdom Hearts'];
        const slim = (it) => ({ id: it.id, title: it.title, artist: it.artist || '', src: it.src, page: it.page || '', url: it.url || '', slug: it.slug || '', repo: it.repo || '' });
        const isFav = (id) => favs.some((f) => f.id === id);
        function toggleFav(it) {
            const i = favs.findIndex((f) => f.id === it.id);
            if (i >= 0) favs.splice(i, 1); else favs.unshift(slim(it));
            writeJSON('siphon.favs', favs);
        }
        function queueAdd(it) {
            if (queue.some((q) => q.id === it.id)) { toast('Already in the queue', 'info', 1400); return; }
            queue.push(slim(it)); writeJSON('siphon.queue', queue);
            toast('Added to queue: ' + cleanTitle(it.title), 'success', 1600);
            if (dr.tab === 'queue') drRender();
        }
        const cleanTitle = (t) => String(t || '').replace(/\s+/g, ' ').trim().replace(/\.midi?$/i, '');
        const itemFile = (it) => (cleanTitle(it.title).replace(/[\\/:*?"<>|]+/g, '') || 'song') + '.mid';

        /* ----- source parsers ----- */
        function parseBitmidi(html, base) {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const out = [], seen = new Set();
            doc.querySelectorAll('a[href]').forEach((a) => {
                let u;
                try { u = new URL(a.getAttribute('href'), base); } catch (e) { return; }
                if (!/(^|\.)bitmidi\.com$/.test(u.hostname)) return;
                const m = /^\/([^\/]+-mid)$/.exec(u.pathname);
                if (!m || seen.has(m[1])) return;
                const t = cleanTitle(a.getAttribute('title') || a.textContent);
                if (!t) return;
                seen.add(m[1]);
                out.push({ id: 'bm|' + m[1], title: t, artist: '', src: 'bitmidi', slug: m[1], page: BMBASE + '/' + m[1] });
            });
            return out;
        }
        function bmFindDownload(html, base) {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const a = Array.from(doc.querySelectorAll('a[href]')).find((x) => /\.midi?$/i.test((x.getAttribute('href') || '').split('?')[0]));
            if (!a) return '';
            try { return new URL(a.getAttribute('href'), base).href; } catch (e) { return ''; }
        }
        async function bmFetch(q, page) {
            const url = q ? `${BMBASE}/search?q=${encodeURIComponent(q)}${page ? '&page=' + page : ''}` : `${BMBASE}/${page ? '?page=' + page : ''}`;
            const r = await httpReq(url, 'text');
            return parseBitmidi(r.data, r.url || url);
        }
        async function bmPopularAll() {
            if (dr.bmPop) return dr.bmPop;
            let all = [];
            for (let p = 0; p < 5; p++) { try { all = all.concat(await bmFetch('', p)); } catch (e) { break; } }
            const seen = new Set();
            dr.bmPop = all.filter((x) => !seen.has(x.id) && seen.add(x.id));
            return dr.bmPop;
        }
        function parseVgm(html, base) {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const out = [];
            let game = '';
            doc.querySelectorAll('tr').forEach((tr) => {
                if (tr.querySelector('tr')) return;
                const a = Array.from(tr.querySelectorAll('a[href]')).find((x) => /\.mid$/i.test((x.getAttribute('href') || '').split('?')[0]));
                const first = tr.cells && tr.cells[0];
                if (a) {
                    if (first && !first.querySelector('a')) { const g = first.textContent.replace(/\s+/g, ' ').trim(); if (g && g.length < 140) game = g; }
                    let u;
                    try { u = new URL(a.getAttribute('href'), base).href; } catch (e) { return; }
                    out.push({ id: 'vg|' + u, title: cleanTitle(a.textContent), artist: game, src: 'vgm', url: u, page: base });
                } else {
                    const t = tr.textContent.replace(/\s+/g, ' ').trim();
                    if (t && t.length < 140 && !/SONG TITLE|FILE SIZE|SEQUENCED/i.test(t) && tr.cells && tr.cells.length <= 2) game = t;
                }
            });
            return out;
        }
        function parseRepoSpec(line) {
            const m = /^\s*(?:https?:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:@([\w.\/-]+))?\s*$/.exec(line);
            return m ? { owner: m[1], repo: m[2], branch: m[3] || '' } : null;
        }
        const repoList = () => S.shop.repos.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).map((s) => ({ raw: s, spec: parseRepoSpec(s) })).filter((x) => x.spec);
        async function repoFetch(spec) {
            const branches = spec.branch ? [spec.branch] : ['main', 'master'];
            let lastErr = null;
            for (let bi = 0; bi < branches.length; bi++) {
                const br = branches[bi];
                try {
                    let files = [];
                    try {
                        const j = JSON.parse((await httpReq(`https://data.jsdelivr.com/v1/packages/gh/${spec.owner}/${spec.repo}@${br}?structure=flat`, 'text')).data);
                        files = (j.files || []).map((f) => String(f.name).replace(/^\//, ''));
                    } catch (e) {
                        const j = JSON.parse((await httpReq(`https://api.github.com/repos/${spec.owner}/${spec.repo}/git/trees/${br}?recursive=1`, 'text')).data);
                        files = (j.tree || []).filter((x) => x.type === 'blob').map((x) => x.path);
                    }
                    const mids = files.filter((p) => /\.midi?$/i.test(p));
                    if (!mids.length && bi < branches.length - 1) continue;
                    return mids.map((p) => {
                        const parts = p.split('/');
                        const name = parts.pop().replace(/\.midi?$/i, '').replace(/_+/g, ' ');
                        const enc = p.split('/').map(encodeURIComponent).join('/');
                        return { id: `gh|${spec.owner}/${spec.repo}@${br}/${p}`, title: name, artist: parts.join(' / '), src: 'repo', repo: `${spec.owner}/${spec.repo}`, page: `https://github.com/${spec.owner}/${spec.repo}/blob/${br}/${enc}`, url: `https://cdn.jsdelivr.net/gh/${spec.owner}/${spec.repo}@${br}/${enc}` };
                    });
                } catch (e) { lastErr = e; }
            }
            throw lastErr || new Error('no MIDI files found');
        }

        /* ----- loading ----- */
        async function itemBuffer(it) {
            let url = it.url;
            if (it.src === 'bitmidi' && !url) {
                const r = await httpReq(it.page, 'text');
                url = bmFindDownload(r.data, r.url || it.page);
                if (!url) throw new Error('download link not found');
                it.url = url;
            }
            if (!url) throw new Error('no file URL');
            const r = await httpReq(url, 'buffer');
            if (!r.data || !r.data.byteLength) throw new Error('empty file');
            return r.data;
        }
        async function shopLoad(it) {
            const title = cleanTitle(it.title);
            toast('Downloading ' + title + '…', 'info', 1800);
            try {
                showLoader(title, 5, 'Downloading');
                const buf = await itemBuffer(it);
                showLoader(title, 30, 'Download complete');
                await yieldUI();
                return await loadBuffer(buf, itemFile(it), { id: 's|' + it.id, kind: 'shop', size: buf.byteLength });
            } catch (e) {
                console.error('[PVX]', e);
                hideLoader();
                toast('Could not download that MIDI (' + ((e && e.message) || 'error') + ')', 'error', 4000);
                return false;
            }
        }
        async function shopDownload(it) {
            try { const buf = await itemBuffer(it); download(itemFile(it), buf); }
            catch (e) { toast('Download failed (' + ((e && e.message) || 'error') + ')', 'error', 3500); }
        }
        async function loadItem(it, o) {
            o = o || {};
            const ok = it.src === 'lib' ? await loadFromLib(it.id) : await shopLoad(it);
            if (ok) {
                curItemId = it.id;
                if (o.play || S.shop.autoplay) setTimeout(() => { if (song && !P.playing) playPause(); }, 150);
                if (S.shop.autoClose) toggleDrawer(false);
                drRender();
            }
            return ok;
        }
        function queuePlayAt(i) { if (i < 0 || i >= queue.length) return Promise.resolve(false); qPos = i; return loadItem(queue[i], { play: true }); }
        function queueNext() {
            if (!queue.length) { toast('The queue is empty', 'info', 1400); return; }
            let n;
            if (S.shop.queueShuffle && queue.length > 1) { do { n = Math.floor(Math.random() * queue.length); } while (n === qPos); }
            else n = qPos + 1;
            if (n >= queue.length) { if (S.shop.queueRepeat) n = 0; else { toast('End of the queue', 'info', 1400); return; } }
            queuePlayAt(n);
        }
        function queuePrev() {
            if (!queue.length) return;
            queuePlayAt(qPos <= 0 ? (S.shop.queueRepeat ? queue.length - 1 : 0) : qPos - 1);
        }

        /* ----- rendering ----- */
        const drStatus = (t) => { DQ.status.textContent = t; };
        function drItems() {
            let items = dr.items;
            const q = DQ.q.value.trim().toLowerCase();
            if (dr.tab !== 'bitmidi' && q) items = items.filter((x) => (x.title + ' ' + x.artist).toLowerCase().includes(q));
            if (S.shop.sort === 'az' && dr.tab !== 'bitmidi') items = items.slice().sort((a, b) => a.title.localeCompare(b.title));
            return items;
        }
        function drRow(it, extra) {
            const row = el('div', 'pvx-item' + (curItemId === it.id ? ' cur' : ''));
            const label = it.src === 'bitmidi' ? 'BitMidi' : it.src === 'vgm' ? 'VGMusic' : it.src === 'repo' ? it.repo : 'History';
            row.innerHTML = `${extra && extra.n ? `<span class="pvx-qn">${extra.n}</span>` : ''}<div class="nm"><div class="t">${esc(cleanTitle(it.title))}</div><div class="m">${esc([label, it.artist].filter(Boolean).join(' · '))}</div></div>`;
            const acts = el('div', 'pvx-ia');
            const mk = (icon, title, fn, cls) => { const b = el('button', 'pvx-btn' + (cls ? ' ' + cls : ''), svg(icon)); b.title = title; b.onclick = (e) => { e.stopPropagation(); fn(b); }; acts.appendChild(b); return b; };
            if (extra && extra.queue) {
                mk('up', 'Move up', () => { const i = extra.i; if (i > 0) { [queue[i - 1], queue[i]] = [queue[i], queue[i - 1]]; if (qPos === i) qPos--; else if (qPos === i - 1) qPos++; writeJSON('siphon.queue', queue); drRender(); } });
                mk('down', 'Move down', () => { const i = extra.i; if (i < queue.length - 1) { [queue[i + 1], queue[i]] = [queue[i], queue[i + 1]]; if (qPos === i) qPos++; else if (qPos === i + 1) qPos--; writeJSON('siphon.queue', queue); drRender(); } });
                mk('close', 'Remove from queue', () => { queue.splice(extra.i, 1); if (qPos >= extra.i) qPos--; writeJSON('siphon.queue', queue); drRender(); });
                row.onclick = () => queuePlayAt(extra.i);
                row.appendChild(acts);
                return row;
            }
            mk('play', 'Load song (never auto-plays)', () => loadItem(it, { play: false }));
            mk('plus', 'Add to queue', () => queueAdd(it));
            mk('heart', isFav(it.id) ? 'Remove favorite' : 'Favorite', (b) => { toggleFav(it); b.classList.toggle('fav', isFav(it.id)); if (dr.tab === 'fav') { dr.items = favs.slice(); drRender(); drStatus(favs.length + ' favorites'); } }, isFav(it.id) ? 'fav' : '');
            if (it.src !== 'lib') mk('dl', 'Download .mid', () => shopDownload(it));
            if (it.page) mk('ext', 'Open the source page', () => window.open(it.page, '_blank', 'noopener'));
            row.appendChild(acts);
            row.onclick = () => loadItem(it);
            return row;
        }
        function drRenderQueue() {
            const head = el('div', 'pvx-dr-qh');
            const mkb = (txt, cls, fn) => { const b = el('button', 'pvx-act' + (cls ? ' ' + cls : ''), txt); b.onclick = fn; head.appendChild(b); };
            mkb('Shuffle', S.shop.queueShuffle ? 'on' : '', () => { changeSetting('shop.queueShuffle', !S.shop.queueShuffle); drRender(); });
            mkb('Repeat', S.shop.queueRepeat ? 'on' : '', () => { changeSetting('shop.queueRepeat', !S.shop.queueRepeat); drRender(); });
            mkb('Play', '', () => queuePlayAt(0));
            mkb('Clear', 'warn', () => { queue = []; qPos = -1; writeJSON('siphon.queue', queue); drRender(); drStatus('0 in queue'); });
            DQ.list.appendChild(head);
            if (!queue.length) { DQ.list.appendChild(el('div', 'pvx-emptyl', 'The queue is empty. Tap + on any song to add it, then set Settings → Playback → "When a song ends" to "Play the queue" so it advances by itself.')); return; }
            queue.forEach((it, i) => DQ.list.appendChild(drRow(it, { queue: true, i, n: i + 1 })));
        }
        function drRender() {
            DQ.list.innerHTML = '';
            if (dr.tab === 'queue') { drRenderQueue(); return; }
            const items = drItems();
            if (!items.length) { DQ.list.appendChild(el('div', 'pvx-emptyl', dr.loading ? '<div class="pvx-spin"></div>Loading…' : esc(dr.msg || 'No results.'))); return; }
            items.slice(0, dr.limit).forEach((it) => DQ.list.appendChild(drRow(it)));
            if (items.length > dr.limit) {
                const b = el('button', 'pvx-act', `Show more (${items.length - dr.limit} left)`);
                b.style.cssText = 'margin:.6em;width:calc(100% - 1.2em)';
                b.onclick = () => { dr.limit += 80; drRender(); };
                DQ.list.appendChild(b);
            }
            if (dr.tab === 'bitmidi' && dr.bmMore && !dr.loading) {
                const b = el('button', 'pvx-act', 'Load more from BitMidi');
                b.style.cssText = 'margin:.6em;width:calc(100% - 1.2em)';
                b.onclick = () => drBitmidi(false);
                DQ.list.appendChild(b);
            }
        }

        /* ----- tabs ----- */
        async function drBitmidi(reset) {
            const tk = ++dr.token;
            if (reset) { dr.items = []; dr.bmPage = 0; dr.bmFallback = false; dr.bmQuery = DQ.q.value.trim(); S.shop.q = dr.bmQuery; saveSettings(); } else dr.bmPage++;
            dr.loading = true; dr.msg = ''; drRender(); drStatus('Loading BitMidi…');
            try {
                let res = await bmFetch(dr.bmQuery, dr.bmPage);
                if (!res.length && dr.bmQuery && dr.bmPage === 0) {
                    const pop = await bmPopularAll();
                    const words = dr.bmQuery.toLowerCase().split(/\s+/).filter(Boolean);
                    res = pop.filter((x) => words.every((w) => x.title.toLowerCase().includes(w)));
                    dr.bmFallback = true;
                    dr.msg = 'BitMidi live search returned nothing. No matches in its popular list either.';
                }
                if (tk !== dr.token) return;
                const have = new Set(dr.items.map((x) => x.id));
                const add = res.filter((x) => !have.has(x.id));
                dr.items = dr.items.concat(add);
                dr.bmMore = add.length > 0 && !dr.bmFallback;
                if (!dr.msg) dr.msg = 'No results on BitMidi.';
                drStatus(`BitMidi · ${dr.items.length} shown${dr.bmQuery ? ' for "' + dr.bmQuery + '"' : ' · popular'}${dr.bmFallback ? ' (popular list)' : ''}`);
            } catch (e) {
                if (tk !== dr.token) return;
                dr.msg = 'Could not reach BitMidi (' + ((e && e.message) || 'error') + '). Check that Tampermonkey allowed the request.';
                drStatus('BitMidi unavailable');
            }
            dr.loading = false; drRender();
        }
        async function drVgm() {
            const tk = ++dr.token;
            const url = dr.vgSel || VGM[0][1];
            if (dr.vgCache.has(url)) { dr.items = dr.vgCache.get(url); dr.loading = false; drRender(); drStatus(`VGMusic · ${dr.items.length} files · © their authors`); return; }
            dr.items = []; dr.loading = true; drRender(); drStatus('Loading VGMusic listing…');
            try {
                const r = await httpReq(url, 'text');
                const list = parseVgm(r.data, url);
                dr.vgCache.set(url, list);
                if (tk !== dr.token) return;
                dr.items = list; dr.msg = 'No MIDI files found on that page.';
                drStatus(`VGMusic · ${list.length} files · © their authors`);
            } catch (e) {
                if (tk !== dr.token) return;
                dr.msg = 'Could not load that VGMusic page (' + ((e && e.message) || 'error') + ').';
                drStatus('VGMusic unavailable');
            }
            dr.loading = false; drRender();
        }
        async function drRepo() {
            const tk = ++dr.token;
            const rl = repoList();
            if (!rl.length) { dr.items = []; dr.loading = false; dr.msg = 'No repos yet. Pick "+ Add repo…" and enter owner/repo (or owner/repo@branch) for any public GitHub repo that contains .mid files.'; drRender(); drStatus('GitHub'); return; }
            const cur = rl.find((r) => r.raw === dr.repoSel) || rl[0];
            dr.repoSel = cur.raw;
            if (dr.repoCache.has(cur.raw)) { dr.items = dr.repoCache.get(cur.raw); dr.loading = false; drRender(); drStatus(`${cur.raw} · ${dr.items.length} files · via jsDelivr`); return; }
            dr.items = []; dr.loading = true; drRender(); drStatus('Reading ' + cur.raw + '…');
            try {
                const list = await repoFetch(cur.spec);
                dr.repoCache.set(cur.raw, list);
                if (tk !== dr.token) return;
                dr.items = list; dr.msg = 'No .mid files found in that repo.';
                drStatus(`${cur.raw} · ${list.length} files · via jsDelivr`);
            } catch (e) {
                if (tk !== dr.token) return;
                dr.msg = 'Could not read that repo (' + ((e && e.message) || 'error') + '). Check the name and that it is public.';
                drStatus('GitHub unavailable');
            }
            dr.loading = false; drRender();
        }
        function drFillSel() {
            DQ.sel.innerHTML = '';
            if (dr.tab === 'vgm') { VGM.forEach((v) => DQ.sel.appendChild(new Option(v[0], v[1]))); DQ.sel.value = dr.vgSel || VGM[0][1]; }
            else {
                const rl = repoList();
                rl.forEach((r) => DQ.sel.appendChild(new Option(r.raw, r.raw)));
                DQ.sel.appendChild(new Option('+ Add repo…', '__add'));
                if (!dr.repoSel && rl.length) dr.repoSel = rl[0].raw;
                DQ.sel.value = dr.repoSel || '__add';
            }
        }
        function drTab(tab) {
            dr.tab = tab; dr.limit = 60; S.shop.tab = tab; saveSettings();
            DQ.tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
            const local = tab === 'vgm' || tab === 'repo';
            DQ.sel.style.display = local ? '' : 'none';
            DQ.go.style.display = tab === 'bitmidi' ? '' : 'none';
            DQ.rand.style.display = tab === 'bitmidi' ? '' : 'none';
            DQ.sort.style.display = (local || tab === 'fav') ? '' : 'none';
            DQ.q.style.display = tab === 'queue' ? 'none' : '';
            DQ.chips.style.display = tab === 'bitmidi' ? '' : 'none';
            DQ.q.placeholder = tab === 'bitmidi' ? 'Search BitMidi (zelda, chopin, queen…)' : 'Filter this list…';
            DQ.q.value = tab === 'bitmidi' ? (S.shop.q || '') : '';
            if (tab === 'bitmidi') drBitmidi(true);
            else if (tab === 'vgm') { drFillSel(); drVgm(); }
            else if (tab === 'repo') { drFillSel(); drRepo(); }
            else if (tab === 'fav') { dr.items = favs.slice(); dr.msg = 'No favorites yet. Tap the heart on any song.'; drRender(); drStatus(favs.length + ' favorites'); }
            else { dr.items = []; drRender(); drStatus(queue.length + ' in queue'); }
        }
        function drAddRepo() {
            const v = prompt('Public GitHub repo that contains .mid files\n(owner/repo or owner/repo@branch):');
            if (!v) { drFillSel(); return; }
            if (!parseRepoSpec(v)) { toast('That does not look like owner/repo', 'warn'); drFillSel(); return; }
            const cur = repoList().map((x) => x.raw);
            if (!cur.includes(v.trim())) cur.push(v.trim());
            changeSetting('shop.repos', cur.join(', '));
            dr.repoSel = v.trim(); dr.repoCache.delete(v.trim());
            drFillSel(); drRepo();
        }
        async function drRandom() {
            toast('Finding a random song…', 'info', 1500);
            try {
                const r = await httpReq(BMBASE + '/random', 'text');
                const url = bmFindDownload(r.data, r.url);
                if (!url) throw new Error('no download link');
                const doc = new DOMParser().parseFromString(r.data, 'text/html');
                const h = doc.querySelector('h1');
                const slug = new URL(r.url).pathname.replace(/^\//, '');
                await loadItem({ id: 'bm|' + slug, title: cleanTitle(h ? h.textContent : 'Random MIDI'), artist: '', src: 'bitmidi', slug, page: r.url, url }, { play: S.shop.autoplay });
            } catch (e) { toast('Random pick failed (' + ((e && e.message) || 'error') + ')', 'error', 3000); }
        }
        async function drUrlLoad() {
            let u = DQ.url.value.trim();
            if (!u) return;
            if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
            try {
                toast('Downloading…', 'info', 1500);
                const r = await httpReq(u, 'buffer');
                let name = '';
                try { name = decodeURIComponent(u.split('?')[0].split('/').pop() || ''); } catch (e) { name = ''; }
                if (!name) name = 'online.mid';
                if (!/\.midi?$/i.test(name)) name += '.mid';
                await loadBuffer(r.data, name, { id: 'u|' + u.slice(0, 160), kind: 'shop', size: r.data.byteLength });
            } catch (e) { toast('Could not load that link (' + ((e && e.message) || 'error') + ')', 'error', 4000); }
        }

        /* ----- slide-out placement ----- */
        function layoutDrawer() {
            const r = root.getBoundingClientRect();
            const k = S.ui.scale / 100;
            let w = Math.round(Math.min(390 * k, innerWidth - 16));
            const leftRoom = r.left - 6, rightRoom = innerWidth - r.right - 6;
            let side = 'left';
            if (leftRoom >= w) side = 'left';
            else if (rightRoom >= w) side = 'right';
            else { side = leftRoom >= rightRoom ? 'left' : 'right'; w = Math.max(260, Math.floor(Math.max(leftRoom, rightRoom))); }
            const h = Math.min(innerHeight - 16, Math.max(r.height, Math.round(430 * k)));
            const top = clamp(r.top, 8, Math.max(8, innerHeight - h - 8));
            let left = side === 'left' ? r.left - w : r.right;
            left = clamp(left, 0, Math.max(0, innerWidth - w));
            drawer.style.width = w + 'px'; drawer.style.height = h + 'px';
            drawer.style.top = top + 'px'; drawer.style.left = left + 'px';
            drawer.classList.toggle('right', side === 'right');
            drawer.style.setProperty('--slide', (side === 'left' ? w : -w) + 'px');
        }
        function toggleDrawer(force) {
            // When docked, library lives inside the player-list sidebar
            if (S.dock.on) {
                toggleDockLibrary(force);
                return;
            }
            const open = force !== undefined ? force : !drawer.classList.contains('open');
            layoutDrawer();
            drawer.classList.toggle('open', open);
            R.library.classList.toggle('on', open);
            if (open) {
                if (!dr.inited) { dr.inited = true; drTab(['bitmidi', 'vgm', 'repo', 'fav', 'queue'].includes(S.shop.tab) ? S.shop.tab : 'bitmidi'); }
                else drRender();
                setTimeout(() => { if (drawer.classList.contains('open') && DQ.q.style.display !== 'none') DQ.q.focus(); }, 340);
            }
        }
        R.library.onclick = () => toggleDrawer();
        R.library2.onclick = () => toggleDrawer(true);
        DQ.close.onclick = () => toggleDrawer(false);
        DQ.tabs.querySelectorAll('button').forEach((b) => { b.onclick = () => drTab(b.dataset.tab); });
        DQ.go.onclick = () => drBitmidi(true);
        DQ.rand.onclick = drRandom;
        DQ.sort.onclick = () => { S.shop.sort = S.shop.sort === 'az' ? 'default' : 'az'; DQ.sort.classList.toggle('on', S.shop.sort === 'az'); saveSettings(); drRender(); };
        DQ.sort.classList.toggle('on', S.shop.sort === 'az');
        DQ.sel.onchange = () => {
            if (dr.tab === 'vgm') { dr.vgSel = DQ.sel.value; drVgm(); }
            else if (DQ.sel.value === '__add') drAddRepo();
            else { dr.repoSel = DQ.sel.value; drRepo(); }
        };
        DQ.q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && dr.tab === 'bitmidi') { e.preventDefault(); drBitmidi(true); } });
        DQ.q.addEventListener('input', () => { if (dr.tab !== 'bitmidi') { dr.limit = 60; drRender(); } });
        DQ.urlgo.onclick = drUrlLoad;
        DQ.url.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); drUrlLoad(); } });
        BM_CHIPS.forEach((c) => { const b = el('button', '', esc(c)); b.onclick = () => { DQ.q.value = c; drBitmidi(true); }; DQ.chips.appendChild(b); });
        // typing in our fields must never reach the site's piano key handlers
        [root, drawer].forEach((c) => ['keydown', 'keyup', 'keypress'].forEach((ev) => c.addEventListener(ev, (e) => {
            if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'range') e.stopPropagation();
        })));

        /* ----- live Pianoverse controls + saved settings ----- */
        const siteQ = (s) => document.querySelector(s);
        const siteVolume = {
            get: () => { const i = siteQ('pv-header pv-slider input'); return i ? +i.value : 100; },
            set: (v) => { const i = siteQ('pv-header pv-slider input'); if (!i) return; i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); },
        };
        const siteToggle = (cls) => ({
            get: () => { const b = siteQ('pv-toolbar .' + cls); return !!(b && b.classList.contains('active')); },
            set: (v) => { const b = siteQ('pv-toolbar .' + cls); if (b && !!b.classList.contains('active') !== v) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 })); },
        });
        const siteWheel = (cls) => {
            const get = () => { const v = siteQ('pv-toolbar .' + cls + ' .value'); const n = v ? parseInt(v.textContent, 10) : NaN; return isFinite(n) ? n : 0; };
            return {
                get,
                set: (t) => {
                    const b = siteQ('pv-toolbar .' + cls);
                    if (!b) return;
                    const d = Math.round(t) - get();
                    for (let i = 0; i < Math.abs(d) && i < 140; i++) b.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: d > 0 ? -1 : 1 }));
                },
            };
        };
        const siteChat = {
            get: () => { const a = siteQ('main.app'); return !!a && !a.classList.contains('no-chat'); },
            set: (v) => { const a = siteQ('main.app'), b = siteQ('pv-toolbar .button.chat'); if (a && b && (!a.classList.contains('no-chat')) !== v) b.click(); },
        };
        let SD = {};
        function loadSD() {
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem('settings') || '[]'); } catch (e) { arr = []; }
            SD = {};
            if (Array.isArray(arr)) arr.forEach((p) => { if (Array.isArray(p)) SD[p[0]] = p[1]; });
        }
        const sdItem = (t, k, def, extra) => Object.assign({ t, get: () => (SD[k] === undefined ? def : SD[k]), set: (v) => { SD[k] = v; } }, extra);
        function applySD() { writeSiteSettings(SD); toast('Saved. Reloading Pianoverse…', 'info', 1200); setTimeout(() => location.reload(), 600); }
        let playersTimer = 0;

        const pct = (v) => v + '%';
        const ms = (v) => v + ' ms';
        const pm = (u) => (v) => (v > 0 ? '+' : '') + v + u;
        const OFF = (u) => (v) => (v === 0 ? 'Off' : v + (u || ''));
        const SCHEMA = [
            { id: 'general', label: 'General', items: [
                { t: 'toggle', k: 'ui.remember', label: 'Remember window position and size' },
                { t: 'toggle', k: 'ui.startMin', label: 'Start minimized' },
                { t: 'toggle', k: 'ui.restorePort', label: 'Restore previous MIDI output' },
                { t: 'toggle', k: 'ui.notifications', label: 'Notifications', hint: 'Errors are always shown' },
                { t: 'toggle', k: 'ui.animations', label: 'Interface animations' },
                { t: 'toggle', k: 'ui.shortcuts', label: 'Keyboard shortcuts', hint: 'Alt-based, so they never collide with Pianoverse piano keys' },
                { t: 'toggle', k: 'ui.lobbyWarn', label: 'Warn when playing in the Lobby', hint: 'Pianoverse rules: no autoplayers in the Lobby' },
                { t: 'note', html: 'Shortcuts (all with <kbd>Alt</kbd>): <kbd>P</kbd> play/pause · <kbd>S</kbd> stop · <kbd>F</kbd> open file · <kbd>U</kbd> unload · <kbd>B</kbd> library · <kbd>←</kbd>/<kbd>→</kbd> seek · <kbd>↑</kbd>/<kbd>↓</kbd> speed · <kbd>.</kbd>/<kbd>,</kbd> next/previous in queue · <kbd>L</kbd> loop · <kbd>H</kbd> humanize · <kbd>R</kbd> record · <kbd>G</kbd> logger · <kbd>D</kbd> dock · <kbd>X</kbd> panic · <kbd>M</kbd> minimize · <kbd>O</kbd> show/hide' },
                { t: 'button', label: 'Reset window position', text: 'Reset', run: () => { S.win.x = S.win.y = -1; S.win.w = DEFAULTS.win.w; S.win.h = DEFAULTS.win.h; S.win.min = false; applyWindow(); resizeCanvas(); saveSettings(); } },
                { t: 'button', label: 'Export settings', hint: 'Copies every Siphon setting to the clipboard as JSON', text: 'Copy', run: () => { try { navigator.clipboard.writeText(JSON.stringify(S, null, 2)); toast('Settings copied to the clipboard', 'success'); } catch (e) { toast('Clipboard blocked', 'error'); } } },
                { t: 'button', label: 'Import settings', hint: 'Paste JSON you exported earlier', text: 'Paste…', run: () => { const t = prompt('Paste exported Siphon settings JSON:'); if (!t) return; try { S = deepMerge(DEFAULTS, JSON.parse(t)); applyAll(); syncSettingsUI(); saveSettings(); toast('Settings imported', 'success'); } catch (e) { toast('That is not valid settings JSON', 'error'); } } },
                { t: 'button', label: 'Restore all defaults', hint: 'Resets every setting in this panel', text: 'Restore defaults', confirm: true, warn: true, run: () => { S = deepMerge(DEFAULTS, {}); Object.assign(S.hz, HZ_PRESETS.natural); applyAll(); syncSettingsUI(); saveSettings(); toast('Settings restored to defaults', 'success'); } },
                { t: 'note', html: 'Siphon Studio <b>' + VERSION + '</b> · changelog opens automatically after each update.' },
                { t: 'button', label: "What's new", hint: 'Open the full changelog modal', text: 'Show changelog', run: () => { showWhatsNew({ force: true }); } },
                { t: 'button', label: 'Show tutorial', hint: 'Replay the first-run walkthrough', text: 'Tutorial', run: () => { showTutorial({ force: true }); } },
            ] },
            { id: 'appearance', label: 'Appearance', items: [
                { t: 'select', k: 'ui.theme', label: 'Theme', opts: Object.keys(THEMES).map((k) => [k, THEMES[k].label]) },
                { t: 'select', k: 'ui.accentMode', label: 'Accent color', opts: [['player', 'My Pianoverse color'], ['theme', 'Theme color'], ['custom', 'Custom color']] },
                { t: 'color', k: 'ui.accent', label: 'Custom accent', dis: () => S.ui.accentMode !== 'custom' },
                { t: 'slider', k: 'ui.scale', label: 'Interface scale', min: 80, max: 130, step: 5, fmt: pct },
                { t: 'slider', k: 'ui.opacity', label: 'Window opacity', min: 40, max: 100, step: 5, fmt: pct },
                { t: 'toggle', k: 'ui.compact', label: 'Compact mode' },
                { t: 'toggle', k: 'ui.showInfo', label: 'Show file info bar' },
                { t: 'toggle', k: 'ui.showNps', label: 'Show live notes per second', hint: 'In the info bar while playing' },
            ] },
            { id: 'playback', label: 'Playback', items: [
                { t: 'head', label: 'Transport' },
                { t: 'slider', k: 'play.speed', label: 'Playback speed', min: 0.25, max: 2, step: 0.05, fmt: (v) => v.toFixed(2) + 'x' },
                { t: 'slider', k: 'play.rewind', label: 'Rewind interval', min: 1, max: 30, step: 1, fmt: (v) => v + ' s' },
                { t: 'slider', k: 'play.forward', label: 'Fast-forward interval', min: 1, max: 30, step: 1, fmt: (v) => v + ' s' },
                { t: 'slider', k: 'play.lead', label: 'Start delay', hint: 'Count-in before playback begins', min: 0, max: 10, step: 1, fmt: OFF(' s') },
                { t: 'select', k: 'play.onEnd', label: 'When a song ends', opts: [['stop', 'Stop'], ['queue', 'Play the queue'], ['next', 'Play next from history'], ['random', 'Play random from history']], hint: 'Ignored while Loop is on' },
                { t: 'head', label: 'Notes and dynamics' },
                { t: 'slider', k: 'play.transpose', label: 'Transpose', min: -24, max: 24, step: 1, fmt: pm(' st') },
                { t: 'slider', k: 'play.minNote', label: 'Lowest note played', min: 21, max: 108, step: 1, fmt: noteName },
                { t: 'slider', k: 'play.maxNote', label: 'Highest note played', min: 21, max: 108, step: 1, fmt: noteName },
                { t: 'select', k: 'play.oor', label: 'Notes outside that range', opts: [['drop', 'Drop them'], ['fold', 'Fold by octaves']] },
                { t: 'slider', k: 'play.velScale', label: 'Velocity scaling', min: 25, max: 150, step: 5, fmt: pct },
                { t: 'slider', k: 'play.velFixed', label: 'Fixed velocity', hint: 'Every note uses this velocity (0 = off)', min: 0, max: 127, step: 1, fmt: OFF() },
                { t: 'slider', k: 'play.velMax', label: 'Velocity ceiling', min: 20, max: 127, step: 1, fmt: (v) => v },
                { t: 'slider', k: 'play.minVel', label: 'Ignore notes below velocity', hint: 'Cuts very quiet notes in dense files', min: 0, max: 60, step: 1, fmt: OFF() },
                { t: 'slider', k: 'play.maxNps', label: 'Density limiter', hint: 'Max notes per second sent to the site (0 = off). Protects Pianoverse from overload', min: 0, max: 20000, step: 250, fmt: (v) => (v === 0 ? 'Off' : fmtInt(v) + '/s') },
                { t: 'head', label: 'Clicking the Studio piano' },
                { t: 'select', k: 'click.target', label: 'Clicked keys play on', opts: [['site', 'Pianoverse'], ['midi', 'MIDI output'], ['both', 'Both']] },
                { t: 'slider', k: 'click.vel', label: 'Click velocity', hint: 'Auto uses where you click on the key', min: 0, max: 127, step: 1, fmt: (v) => (v === 0 ? 'Auto' : v) },
            ] },
            { id: 'hz', label: 'Humanize', items: [
                { t: 'toggle', k: 'hz.on', label: 'Humanize playback', hint: 'Natural variation applied only to what is sent to your MIDI output' },
                { t: 'select', k: 'hz.preset', label: 'Preset', opts: [['subtle', 'Subtle'], ['natural', 'Natural'], ['expressive', 'Expressive'], ['loose', 'Loose'], ['sloppy', 'Sloppy'], ['custom', 'Custom']] },
                { t: 'slider', k: 'hz.strength', label: 'Overall strength', hint: 'Scales every effect below', min: 0, max: 200, step: 5, fmt: pct },
                { t: 'head', label: 'Timing' },
                { t: 'slider', k: 'hz.timing', label: 'Random timing', hint: 'Independent early/late offset per note', min: 0, max: 60, step: 1, fmt: (v) => '±' + v + ' ms' },
                { t: 'slider', k: 'hz.drift', label: 'Tempo drift', hint: 'Slow wandering of the whole feel, like rubato', min: 0, max: 40, step: 1, fmt: (v) => '±' + v + ' ms' },
                { t: 'slider', k: 'hz.driftPeriod', label: 'Drift speed', hint: 'Seconds per wander (lower = faster)', min: 1, max: 30, step: 1, fmt: (v) => v + ' s' },
                { t: 'slider', k: 'hz.bias', label: 'Push / lay back', hint: 'Negative plays ahead of the beat, positive behind', min: -30, max: 30, step: 1, fmt: pm(' ms') },
                { t: 'slider', k: 'hz.roll', label: 'Chord roll', hint: 'Total spread of a chord, like fingers landing in turn', min: 0, max: 60, step: 1, fmt: ms },
                { t: 'select', k: 'hz.rollDir', label: 'Roll direction', opts: [['up', 'Low to high'], ['down', 'High to low'], ['out', 'Outside in'], ['random', 'Random']] },
                { t: 'slider', k: 'hz.melody', label: 'Melody lead', hint: 'Top note of a chord lands slightly early', min: 0, max: 30, step: 1, fmt: ms },
                { t: 'slider', k: 'hz.hand', label: 'Left-hand lag', hint: 'Notes below the split land slightly late', min: 0, max: 40, step: 1, fmt: ms },
                { t: 'slider', k: 'hz.split', label: 'Hand split point', min: 36, max: 84, step: 1, fmt: noteName },
                { t: 'head', label: 'Dynamics' },
                { t: 'slider', k: 'hz.vel', label: 'Random velocity', min: 0, max: 40, step: 1, fmt: (v) => '±' + v },
                { t: 'slider', k: 'hz.accent', label: 'Melody emphasis', hint: 'Top notes louder, inner notes softer', min: 0, max: 25, step: 1, fmt: (v) => v },
                { t: 'slider', k: 'hz.dyn', label: 'Dynamic range', hint: 'Below 100 flattens, above 100 exaggerates', min: 50, max: 160, step: 5, fmt: pct },
                { t: 'slider', k: 'hz.velMin', label: 'Velocity floor', min: 1, max: 100, step: 1, fmt: (v) => v },
                { t: 'slider', k: 'hz.velMax', label: 'Velocity ceiling', min: 40, max: 127, step: 1, fmt: (v) => v },
                { t: 'head', label: 'Note length' },
                { t: 'slider', k: 'hz.len', label: 'Random length', min: 0, max: 40, step: 1, fmt: (v) => '±' + v + '%' },
                { t: 'slider', k: 'hz.gate', label: 'Legato / staccato', hint: 'Below 100 shortens every note, above 100 lengthens', min: 50, max: 150, step: 5, fmt: pct },
                { t: 'slider', k: 'hz.minLen', label: 'Minimum length', min: 3, max: 200, step: 1, fmt: ms },
                { t: 'head', label: 'Pedal' },
                { t: 'select', k: 'hz.pedal', label: 'Auto sustain pedal', opts: [['off', 'Off'], ['measure', 'Re-pedal each measure'], ['beat', 'Re-pedal each beat']], hint: 'Sends pedal changes to your MIDI output' },
                { t: 'slider', k: 'hz.repedal', label: 'Pedal lift time', hint: 'How long the pedal is up during a re-pedal', min: 20, max: 250, step: 5, fmt: ms },
                { t: 'head', label: 'Slips' },
                { t: 'slider', k: 'hz.dropPct', label: 'Missed notes', min: 0, max: 5, step: 0.1, fmt: (v) => v.toFixed(1) + '%' },
                { t: 'slider', k: 'hz.wrongPct', label: 'Wrong notes', hint: 'Plays a neighbouring key instead', min: 0, max: 5, step: 0.1, fmt: (v) => v.toFixed(1) + '%' },
                { t: 'head', label: 'Randomness' },
                { t: 'toggle', k: 'hz.seed', label: 'Repeatable randomness', hint: 'The same file plays the same way every time' },
                { t: 'toggle', k: 'hz.varyLoop', label: 'Vary on every loop', hint: 'Each pass of a loop gets a fresh pattern' },
                { t: 'button', label: 'Re-roll variation', hint: 'Pick a new repeatable pattern', text: 'Re-roll', run: () => { S.hz.seedValue = (Math.random() * 1e6) | 0; saveSettings(); toast('New humanize pattern', 'info', 1400); } },
                { t: 'note', html: 'The visualizer always shows the original timing. With Humanize off, playback is sample-accurate.' },
            ] },
            { id: 'record', label: 'Recording', items: [
                { t: 'note', html: 'Recording captures notes seen by the site: other players via the network, and your own notes. <kbd>Alt</kbd>+<kbd>R</kbd> starts and stops. Right-click the Record chip to open this page.' },
                { t: 'select', k: 'rec.source', label: 'Record', opts: [['all', 'Everyone'], ['others', 'Other players only'], ['me', 'Only me']], hint: 'If your Studio output loops back into Pianoverse, "Everyone" and "Only me" include that playback' },
                { t: 'toggle', k: 'rec.waitFirst', label: 'Start at the first note', hint: 'No leading silence in the file' },
                { t: 'toggle', k: 'rec.perUser', label: 'One MIDI track per player' },
                { t: 'toggle', k: 'rec.pedal', label: 'Record sustain pedal' },
                { t: 'slider', k: 'rec.minVel', label: 'Ignore notes below velocity', min: 0, max: 60, step: 1, fmt: OFF() },
                { t: 'slider', k: 'rec.minNotes', label: 'Discard recordings shorter than', min: 1, max: 100, step: 1, fmt: (v) => v + ' notes' },
                { t: 'slider', k: 'rec.maxMin', label: 'Auto-stop after', min: 0, max: 60, step: 1, fmt: OFF(' min') },
                { t: 'toggle', k: 'rec.autoSave', label: 'Save recordings to history' },
                { t: 'toggle', k: 'rec.autoLoad', label: 'Load into the player when stopped' },
                { t: 'button', label: 'Start / stop recording', text: 'Toggle', run: toggleRecord },
                { t: 'button', label: 'Download last recording', text: 'Download .mid', run: () => { if (lastRec) download(lastRec.name, lastRec.buf); else toast('No recording yet', 'warn'); } },
            ] },
            { id: 'logger', label: 'Logger', items: [
                { t: 'note', html: 'Logger mode draws the notes other players (and you) press as bars that <b>rise</b> from the keyboard, like a scrolling history, and lights the keys they press. By default it hides the loaded MIDI while it is on. Toggle with <kbd>Alt</kbd>+<kbd>G</kbd>.' },
                { t: 'toggle', k: 'logger.on', label: 'Logger mode' },
                { t: 'slider', k: 'logger.window', label: 'History length', hint: 'Seconds of history visible above the keys', min: 2, max: 30, step: 1, fmt: (v) => v + ' s' },
                { t: 'toggle', k: 'logger.others', label: 'Show other players' },
                { t: 'toggle', k: 'logger.me', label: 'Show my notes' },
                { t: 'slider', k: 'logger.minVel', label: 'Hide notes below velocity', min: 0, max: 100, step: 1, fmt: OFF() },
                { t: 'select', k: 'logger.colors', label: 'Note colors', opts: [['user', 'Each player\'s color'], ['accent', 'Accent']] },
                { t: 'toggle', k: 'logger.fade', label: 'Fade older notes' },
                { t: 'toggle', k: 'logger.legend', label: 'Show player legend' },
                { t: 'toggle', k: 'logger.hideMidi', label: 'Hide the loaded MIDI while Logger is on', hint: 'Turn off to draw both at once' },
                { t: 'button', label: 'Clear logger history', text: 'Clear', run: liveClear },
            ] },
            { id: 'dock', label: 'Piano Replace', items: [
                { t: 'note', html: 'Dock mode hides the site\'s piano visuals and draws the Studio keyboard and notes in their place. The site\'s real keys stay underneath, so clicking the dock still plays Pianoverse. Toggle with <kbd>Alt</kbd>+<kbd>D</kbd>.' },
                { t: 'toggle', k: 'dock.on', label: 'Replace the site piano + take over player list', hint: 'Hides the entire Studio window. Transport, Library, Record, Humanize and Panic appear in the player-list sidebar. Library opens inside that same sidebar. Undock restores everything.' },
                { t: 'toggle', k: 'dock.collapseHud', label: 'Collapse the HUD to controls only', hint: 'Legacy option; full dock mode already hides the whole Studio. Kept for compatibility.' },
                { t: 'slider', k: 'dock.window', label: 'Falling-note window', min: 0.5, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) + ' s' },
                { t: 'slider', k: 'dock.bgAlpha', label: 'Background opacity', hint: 'Lower shows more of the page behind', min: 0, max: 100, step: 5, fmt: pct },
                { t: 'toggle', k: 'dock.midi', label: 'Show loaded MIDI notes' },
                { t: 'toggle', k: 'dock.liveKeys', label: 'Light keys when players press them' },
                { t: 'toggle', k: 'dock.labels', label: 'Key labels' },
            ] },
            { id: 'presence', label: 'Siphon Tag', items: [
                { t: 'note', html: 'Cursor chip follows your mouse. List badges keep the site layout. Customize chip accent colors below. Presence refreshes on join/leave and every ~15s.' },
                { t: 'color', k: 'presence.color1', label: 'Chip accent start' },
                { t: 'color', k: 'presence.color2', label: 'Chip accent end' },
                { t: 'toggle', k: 'presence.showCursor', label: 'Show floating cursor chip' },
                { t: 'toggle', k: 'presence.showServerCursor', label: 'Show my live server cursor', hint: 'Pianoverse never draws your own cursor locally — Siphon mirrors it so you can see what others see.' },
            ] },
            { id: 'skin', label: 'Look', items: [
                { t: 'toggle', k: 'skin.siteTheme', label: 'Siphon site skin' },
                { t: 'toggle', k: 'skin.hdr', label: 'HDR look', hint: 'Higher contrast, saturation, and soft accent glow' },
                { t: 'toggle', k: 'skin.freezeCursor', label: 'Freeze cursor while MIDI plays', hint: 'Others will not see your cursor move during playback' },
                { t: 'toggle', k: 'skin.bypassConcert', label: 'Unlock concert-mode keys (UI)', hint: 'Removes the disabled lock on the piano when you are not host. Room broadcast may still be host-only on the server.' },
                { t: 'toggle', k: 'skin.antiAfk', label: 'Anti-AFK while MIDI plays', hint: 'Keeps a tiny cursor pulse so the site does not mark you idle during long files' },
            ] },
            { id: 'viz', label: 'Visualization', items: [
                { t: 'toggle', k: 'viz.notes', label: 'Falling notes' },
                { t: 'slider', k: 'viz.window', label: 'Visible time window', hint: 'Seconds of notes shown above the keyboard', min: 0.5, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) + ' s' },
                { t: 'slider', k: 'viz.kbHeight', label: 'Keyboard height', min: 28, max: 120, step: 2, fmt: (v) => v + ' px' },
                { t: 'select', k: 'viz.colorMode', label: 'Note colors', opts: [['accent', 'Accent'], ['track', 'By track'], ['pitch', 'By pitch class']] },
                { t: 'slider', k: 'viz.opacity', label: 'Note opacity', min: 30, max: 100, step: 5, fmt: pct },
                { t: 'toggle', k: 'viz.velocity', label: 'Velocity visualization', hint: 'Louder notes are brighter' },
                { t: 'select', k: 'viz.labels', label: 'Key labels', opts: [['off', 'Off'], ['c', 'C keys only'], ['all', 'All white keys']] },
                { t: 'toggle', k: 'viz.liveKeys', label: 'Light keys when players press them', hint: 'Used while Logger is on' },
                { t: 'toggle', k: 'viz.liveKeysAlways', label: 'Light player keys even when Logger is off' },
                { t: 'toggle', k: 'viz.octaves', label: 'Octave guides' },
                { t: 'toggle', k: 'viz.grid', label: 'Timing grid' },
                { t: 'toggle', k: 'viz.beats', label: 'Beat markers' },
                { t: 'toggle', k: 'viz.measures', label: 'Measure markers' },
            ] },
            { id: 'library', label: 'History', items: [
                { t: 'note', html: 'Opened files and recordings are remembered in your browser (IndexedDB) so you can reload them from the Recent menu.' },
                { t: 'toggle', k: 'lib.store', label: 'Cache file contents', hint: 'Off keeps only a name list, and you must reopen files from disk' },
                { t: 'slider', k: 'lib.maxMB', label: 'Largest file to cache', min: 1, max: 200, step: 1, fmt: (v) => v + ' MB' },
                { t: 'slider', k: 'lib.keep', label: 'Items to keep', min: 5, max: 100, step: 1, fmt: (v) => v },
                { t: 'toggle', k: 'lib.pinKeep', label: 'Never prune pinned items' },
                { t: 'button', label: 'Clear history', hint: 'Removes everything except pinned items', text: 'Clear', confirm: true, warn: true, run: () => { R.popclear.onclick(); R.popclear.onclick(); toast('History cleared', 'success'); } },
            ] },
            { id: 'tracks', label: 'Tracks', custom: true },
            { id: 'players', label: 'Players', custom: true },
            { id: 'shop', label: 'Online Library', items: [
                { t: 'note', html: 'Open the library with <kbd>Alt</kbd>+<kbd>B</kbd> or the Library chip. It slides out from the side of the Studio.' },
                { t: 'text', k: 'shop.repos', label: 'GitHub repos', hint: 'Comma separated: owner/repo or owner/repo@branch. Public repos with .mid files only', ph: 'owner/repo, owner/repo@branch' },
                { t: 'toggle', k: 'shop.autoplay', label: 'Play right after loading from library', hint: 'Off by default. Library "play" button never auto-starts; only this toggle or the main Play button does.' },
                { t: 'toggle', k: 'shop.autoClose', label: 'Close the library after loading' },
                { t: 'toggle', k: 'shop.queueShuffle', label: 'Shuffle the queue' },
                { t: 'toggle', k: 'shop.queueRepeat', label: 'Repeat the queue' },
                { t: 'select', k: 'shop.sort', label: 'Sort lists', opts: [['default', 'Source order'], ['az', 'A to Z']] },
                { t: 'button', label: 'Clear favorites', text: 'Clear', confirm: true, warn: true, run: () => { favs = []; writeJSON('siphon.favs', favs); if (dr.tab === 'fav') drTab('fav'); toast('Favorites cleared', 'success'); } },
                { t: 'button', label: 'Clear queue', text: 'Clear', confirm: true, warn: true, run: () => { queue = []; qPos = -1; writeJSON('siphon.queue', queue); if (dr.tab === 'queue') drRender(); toast('Queue cleared', 'success'); } },
                { t: 'button', label: 'Open the library now', text: 'Open', run: () => toggleDrawer(true) },
            ] },
            { id: 'pianoverse', label: 'Pianoverse', items: [
                { t: 'note', html: '<b>Live controls</b> change the site immediately. <b>Saved settings</b> are Pianoverse\'s own stored options and take effect after a reload.' },
                { t: 'head', label: 'Live controls' },
                Object.assign({ t: 'slider', label: 'Site volume', min: 0, max: 100, step: 1, fmt: pct }, siteVolume),
                Object.assign({ t: 'toggle', label: 'Sustain' }, siteToggle('sustain')),
                Object.assign({ t: 'toggle', label: 'Reverb' }, siteToggle('reverb')),
                Object.assign({ t: 'slider', label: 'Piano velocity', min: 0, max: 127, step: 1, fmt: (v) => v }, siteWheel('velocity')),
                Object.assign({ t: 'slider', label: 'Piano transpose', min: -36, max: 36, step: 1, fmt: pm(' st') }, siteWheel('transpose')),
                Object.assign({ t: 'toggle', label: 'Chat panel' }, siteChat),
                { t: 'head', label: 'Saved settings (apply on reload)' },
                sdItem('select', 'theme', 'carbon', { label: 'Site theme', opts: [['carbon', 'Carbon'], ['crimson', 'Crimson'], ['forest', 'Forest'], ['violet', 'Violet'], ['cream', 'Cream'], ['sage', 'Sage'], ['rose', 'Rose'], ['slate', 'Slate']] }),
                sdItem('select', 'sound', 'salamander', { label: 'Piano sound', opts: [['grand', 'Grand Piano'], ['salamander', 'Salamander Piano'], ['soft', 'Soft Piano'], ['electric', 'Electric Piano'], ['darkcfx', 'Dark CFX']] }),
                sdItem('select', 'polyphony', 64, { label: 'Polyphony', num: true, opts: [['4', '4'], ['8', '8'], ['16', '16'], ['32', '32'], ['64', '64'], ['128', '128'], ['256', '256']] }),
                sdItem('slider', 'tuning', 440, { label: 'Tuning', min: 392, max: 532, step: 1, fmt: (v) => v + ' Hz' }),
                sdItem('select', 'velocityCurve', 'linear', { label: 'MIDI velocity curve', opts: [['softer', 'Softer'], ['soft', 'Soft'], ['linear', 'Default'], ['hard', 'Hard'], ['harder', 'Harder']] }),
                sdItem('select', 'keyboardLayout', 'pianoverse', { label: 'Computer keyboard layout', opts: [['pianoverse', 'Pianoverse'], ['virtualpiano', 'Virtual Piano'], ['flstudio', 'FL Studio'], ['multiplayerpiano', 'MPP'], ['everyonepiano', 'EOP']] }),
                sdItem('toggle', 'passThrough', false, { label: 'MIDI pass-through', hint: 'Send your own notes to MIDI out' }),
                sdItem('toggle', 'randomVelocity', false, { label: 'Randomize velocity' }),
                sdItem('slider', 'velocityRange', 25, { label: 'Velocity range', min: 0, max: 127, step: 1, fmt: (v) => v }),
                sdItem('slider', 'velocityChange', 25, { label: 'Velocity change', min: 0, max: 127, step: 1, fmt: (v) => v }),
                sdItem('toggle', 'showEffects', true, { label: 'Piano animations' }),
                sdItem('toggle', 'showBlur', true, { label: 'Blur effects' }),
                sdItem('toggle', 'showCursors', true, { label: 'Cursors' }),
                sdItem('toggle', 'showLabels', false, { label: 'Key labels' }),
                { t: 'button', label: 'Apply saved settings', hint: 'Writes them to Pianoverse and reloads the page', text: 'Apply and reload', confirm: true, run: applySD },
            ] },
            { id: 'perf', label: 'Performance', items: [
                { t: 'select', k: 'perf.quality', label: 'Rendering quality', opts: [['high', 'High'], ['balanced', 'Balanced'], ['low', 'Performance']] },
                { t: 'slider', k: 'perf.scale', label: 'Canvas scale', min: 50, max: 200, step: 10, fmt: pct },
                { t: 'select', k: 'perf.fps', label: 'HUD frame rate cap', opts: [['30', '30 FPS'], ['60', '60 FPS'], ['120', '120 FPS'], ['0', 'Unlimited']], num: true },
                { t: 'toggle', k: 'perf.blackMidi', label: 'Black MIDI mode', hint: 'Max culling: hide piano-roll notes, kill site cascade, density limit, low canvas scale. Header: Black' },
                { t: 'toggle', k: 'perf.auto', label: 'Auto-reduce quality under load', hint: 'Thins drawn notes on dense passages if rendering gets slow' },
                { t: 'toggle', k: 'perf.reduced', label: 'Reduced motion' },
                { t: 'toggle', k: 'perf.stats', label: 'Show performance statistics' },
                { t: 'select', k: 'perf.fpsMode', label: 'Header FPS counter', hint: 'Real page frame rate, measured independently of Studio', opts: [['full', 'FPS + frame time'], ['fps', 'FPS only'], ['off', 'Hidden']] },
                { t: 'toggle', k: 'perf.graph', label: 'Frame-time graph', hint: 'Last 120 frames under the header. Green = on budget, red = dropped' },
                { t: 'toggle', k: 'perf.smart', label: 'Smart governor', hint: 'Auto-enables Performance mode when FPS drops while playing, restores afterwards' },
                { t: 'toggle', k: 'perf.hudPlay', label: 'Draw Studio piano roll while playing', hint: 'Turn off for the lightest possible playback (sound is unaffected)' },
                { t: 'button', label: 'Copy performance report', hint: 'FPS, 1% low, worst frame, long tasks, draw cost', text: 'Copy', run: () => perfReport() },
            ] },
            { id: 'site', label: 'Site', items: [
                { t: 'note', html: 'These tweak the Pianoverse page itself. Live options apply immediately; the buttons below change Pianoverse\'s own saved settings and reload the page.' },
                { t: 'toggle', k: 'site.noBlur', label: 'Disable blur effects', hint: 'Removes backdrop blur everywhere on the site' },
                { t: 'toggle', k: 'site.noTransitions', label: 'Disable UI transitions' },
                { t: 'toggle', k: 'site.noShadows', label: 'Disable shadows and glow', hint: 'Flatter and faster' },
                { t: 'toggle', k: 'site.hideNotes', label: 'Hide flying notes and particles', hint: 'Skips painting them; the site still cleans them up normally' },
                { t: 'toggle', k: 'site.hideCursors', label: 'Hide other players\' cursors' },
                { t: 'select', k: 'site.fpsCap', label: 'Cap site animation rate', hint: 'Limits the site\'s own render loop', opts: [['0', 'Off'], ['30', '30 FPS'], ['45', '45 FPS'], ['60', '60 FPS']], num: true },
                { t: 'head', label: 'Chat' },
                { t: 'toggle', k: 'site.hideSystemMsgs', label: 'Hide join / leave messages' },
                { t: 'slider', k: 'site.chatFont', label: 'Chat text size', min: 70, max: 160, step: 5, fmt: pct },
                { t: 'toggle', k: 'site.hideUserList', label: 'Hide the player list' },
                { t: 'toggle', k: 'site.hideChatHeader', label: 'Hide the chat header' },
                { t: 'toggle', k: 'site.hideNotifications', label: 'Hide site pop-up notifications' },
                { t: 'head', label: 'Cursors' },
                { t: 'toggle', k: 'site.hideCursorNames', label: 'Hide cursor name tags' },
                { t: 'slider', k: 'site.cursorScale', label: 'Cursor size', min: 50, max: 200, step: 10, fmt: pct },
                { t: 'slider', k: 'site.cursorOpacity', label: 'Cursor opacity', min: 10, max: 100, step: 5, fmt: pct },
                { t: 'head', label: 'Layout' },
                { t: 'toggle', k: 'site.hideHeader', label: 'Hide the site header bar' },
                { t: 'toggle', k: 'site.hideToolbar', label: 'Hide the piano toolbar' },
                { t: 'select', k: 'site.keyLabels', label: 'Piano key labels', opts: [['site', 'Follow the site setting'], ['on', 'Always show'], ['off', 'Always hide']] },
                { t: 'head', label: 'Safety' },
                { t: 'toggle', k: 'site.leaveWarn', label: 'Warn before closing the tab', hint: 'Only while playing or recording' },
                { t: 'head', label: 'Presets (reload the page)' },
                { t: 'button', label: 'Optimize site settings: Balanced', hint: 'Effects off, blur off, polyphony 32', text: 'Apply and reload', confirm: true, run: () => siteSettingsPreset('balanced') },
                { t: 'button', label: 'Optimize site settings: Maximum', hint: 'Also reverb off, cursors off, polyphony 16', text: 'Apply and reload', confirm: true, run: () => siteSettingsPreset('max') },
                { t: 'button', label: 'Restore Pianoverse defaults', text: 'Restore and reload', confirm: true, warn: true, run: () => siteSettingsPreset('restore') },
            ] },
        ];

        SCHEMA.forEach((sec) => (sec.items || []).forEach((it) => {
            if (it.t === 'slider' && it.k) setP(it.k, clamp(Number(getP(it.k)) || 0, it.min, it.max));
        }));
        if (!THEMES[S.ui.theme]) S.ui.theme = 'graphite';
        if (!['accent', 'track', 'pitch'].includes(S.viz.colorMode)) S.viz.colorMode = 'accent';
        if (!['high', 'balanced', 'low'].includes(S.perf.quality)) S.perf.quality = 'balanced';
        if (![0, 30, 60, 120, 144, 240].includes(S.perf.fps)) S.perf.fps = 0;
        if (![0, 30, 45, 60].includes(S.site.fpsCap)) S.site.fpsCap = 0;
        if (!['site', 'on', 'off'].includes(S.site.keyLabels)) S.site.keyLabels = 'site';
        if (!['stop', 'queue', 'next', 'random'].includes(S.play.onEnd)) S.play.onEnd = 'stop';
        if (!['accent', 'track', 'pitch'].includes(S.viz.colorMode)) S.viz.colorMode = 'accent';
        if (!['player', 'theme', 'custom'].includes(S.ui.accentMode)) S.ui.accentMode = 'player';
        if (!parseHex(S.ui.accent)) S.ui.accent = DEFAULTS.ui.accent;
        if (S.play.minNote > S.play.maxNote) { S.play.minNote = 21; S.play.maxNote = 108; }

        const controls = [];
        let tracksPane = null;
        const customPanes = {};
        function buildSettings() {
            SCHEMA.forEach((sec, si) => {
                const nb = el('button', si === 0 ? 'on' : '', esc(sec.label));
                nb.dataset.sec = sec.id;
                nb.onclick = () => openSettings(sec.id);
                R.nav.appendChild(nb);
                const pane = el('div', 'pvx-sec' + (si === 0 ? ' on' : ''));
                pane.dataset.sec = sec.id;
                if (sec.custom) { customPanes[sec.id] = pane; if (sec.id === 'tracks') tracksPane = pane; }
                else sec.items.forEach((it) => pane.appendChild(makeControl(it)));
                R.pane.appendChild(pane);
            });
        }
        function makeControl(it) {
            if (it.t === 'note') return el('div', 'pvx-note', it.html);
            if (it.t === 'head') return el('h4', '', esc(it.label));
            const gv = it.get || (() => getP(it.k));
            const sv = it.set ? ((v) => { it.set(v); syncSettingsUI(); }) : ((v) => changeSetting(it.k, v));
            const row = el('div', 'pvx-row');
            row.dataset.q = (it.label + ' ' + (it.hint || '')).toLowerCase();
            row.appendChild(el('div', 'pvx-lab', `<div>${esc(it.label)}</div>${it.hint ? `<div class="pvx-hint">${esc(it.hint)}</div>` : ''}`));
            const ctl = el('div', 'pvx-ctl');
            let refresh = () => {};
            if (it.t === 'toggle') {
                const b = el('button', 'pvx-sw'); b.setAttribute('role', 'switch');
                b.onclick = () => sv(!gv());
                ctl.appendChild(b);
                refresh = () => { const v = !!gv(); b.classList.toggle('on', v); b.setAttribute('aria-checked', v); };
            } else if (it.t === 'slider') {
                const val = el('span', 'pvx-val');
                const r = el('input', 'pvx-range'); r.type = 'range'; r.min = it.min; r.max = it.max; r.step = it.step;
                r.oninput = () => sv(parseFloat(r.value));
                ctl.append(r, val);
                refresh = () => {
                    const v = gv();
                    r.value = v; val.textContent = it.fmt ? it.fmt(v) : v;
                    r.style.setProperty('--f', ((v - it.min) / (it.max - it.min) * 100) + '%');
                };
            } else if (it.t === 'select') {
                const s = el('select', 'pvx-sel');
                it.opts.forEach((o) => s.appendChild(new Option(o[1], o[0])));
                s.onchange = () => sv(it.num ? Number(s.value) : s.value);
                ctl.appendChild(s);
                refresh = () => { s.value = String(gv()); };
            } else if (it.t === 'color') {
                const c = el('input', 'pvx-color'); c.type = 'color';
                c.oninput = () => sv(c.value);
                ctl.appendChild(c);
                refresh = () => { c.value = gv(); c.disabled = !!(it.dis && it.dis()); };
            } else if (it.t === 'text') {
                const i = el('input', 'pvx-input'); i.type = 'text'; i.placeholder = it.ph || ''; i.style.width = '14em'; i.spellcheck = false;
                i.onchange = () => sv(i.value);
                ctl.appendChild(i);
                refresh = () => { if (document.activeElement !== i) i.value = gv(); };
            } else if (it.t === 'button') {
                const b = el('button', 'pvx-act' + (it.warn ? ' warn' : ''), esc(it.text));
                let timer = 0, armed = false;
                b.onclick = () => {
                    if (it.confirm && !armed) {
                        armed = true; b.textContent = 'Click again to confirm';
                        timer = setTimeout(() => { armed = false; b.textContent = it.text; }, 3000);
                        return;
                    }
                    clearTimeout(timer); armed = false; b.textContent = it.text;
                    it.run();
                };
                ctl.appendChild(b);
            }
            row.appendChild(ctl);
            controls.push(refresh);
            refresh();
            return row;
        }
        function syncSettingsUI() { controls.forEach((f) => { try { f(); } catch (e) { /* site control not ready */ } }); }

        function renderTracks() {
            if (!tracksPane) return;
            tracksPane.innerHTML = '';
            if (!song || !song.tracks.length) { tracksPane.appendChild(el('div', 'pvx-note', 'Load a MIDI file to see its tracks.')); return; }
            tracksPane.appendChild(el('div', 'pvx-note', 'Every track is played on the one Pianoverse piano. Switch tracks off, solo one, or shift a track by semitones. This affects playback and the visualizer.'));
            song.tracks.forEach((t) => {
                if (!t.notes) return;
                const row = el('div', 'pvx-row');
                row.appendChild(el('div', 'pvx-lab', `<div>${esc(t.name)}</div><div class="pvx-hint">${fmtInt(t.notes)} notes${t.inst ? ' · ' + esc(t.inst) : ''}</div>`));
                const ctl = el('div', 'pvx-ctl');
                const change = () => { if (P.playing) startAt(curPos()); requestRender(); renderTracks(); };
                const stp = (txt, d) => { const b = el('button', 'pvx-act', txt); b.style.padding = '.2em .6em'; b.title = 'Transpose this track'; b.onclick = () => { trackTr[t.idx] = clamp(trackTr[t.idx] + d, -36, 36); change(); }; return b; };
                const trv = el('span', 'pvx-val', (trackTr[t.idx] > 0 ? '+' : '') + trackTr[t.idx] + ' st'); trv.style.minWidth = '3.6em';
                const solo = el('button', 'pvx-act' + (soloTrack === t.idx ? ' on' : ''), 'Solo');
                const sw = el('button', 'pvx-sw' + (trackMute[t.idx] ? '' : ' on')); sw.title = 'Track enabled';
                solo.onclick = () => { soloTrack = soloTrack === t.idx ? -1 : t.idx; change(); };
                sw.onclick = () => { trackMute[t.idx] = trackMute[t.idx] ? 0 : 1; change(); };
                ctl.append(stp('−', -1), trv, stp('+', 1), solo, sw);
                row.appendChild(ctl); tracksPane.appendChild(row);
            });
        }
        function renderPlayers() {
            const pane = customPanes.players;
            if (!pane) return;
            pane.innerHTML = '';
            pane.appendChild(el('div', 'pvx-note', 'Players seen by Siphon this session, with the notes each pressed. Counts start when the page loads.'));
            const list = uList.map((u, i) => ({ u, i })).filter((x) => x.u.count || x.u.me).sort((a, b) => (b.u.count || 0) - (a.u.count || 0));
            if (!list.length) { pane.appendChild(el('div', 'pvx-note', 'Nobody has played a note yet.')); return; }
            list.forEach(({ u }) => {
                const row = el('div', 'pvx-row');
                const col = u.rgb || [160, 160, 170];
                row.appendChild(el('div', 'pvx-lab', `<div style="display:flex;align-items:center;gap:.6em"><i style="width:.8em;height:.8em;border-radius:50%;background:${rgbStr(...col)};flex:none"></i>${esc(u.name)}${u.me ? ' (you)' : ''}</div><div class="pvx-hint">${u.last ? 'last played ' + fmtAgo(u.last) : 'no notes yet'}</div>`));
                row.appendChild(el('div', 'pvx-val', fmtInt(u.count || 0) + ' notes'));
                pane.appendChild(row);
            });
            const rb = el('button', 'pvx-act', 'Reset counts'); rb.style.marginTop = '.8em';
            rb.onclick = () => { uList.forEach((u) => { u.count = 0; }); renderPlayers(); };
            pane.appendChild(rb);
        }
        let curSec = 'general';
        function filterSettings(q) {
            q = q.trim().toLowerCase();
            R.pane.querySelectorAll('.pvx-sec').forEach((s) => {
                if (!q) {
                    s.style.display = '';
                    s.classList.toggle('on', s.dataset.sec === curSec);
                    s.querySelectorAll('.pvx-row,.pvx-note,h4').forEach((r) => { r.style.display = ''; });
                    return;
                }
                s.classList.add('on');
                let any = false;
                s.querySelectorAll('.pvx-row').forEach((r) => { const m = (r.dataset.q || '').includes(q); r.style.display = m ? '' : 'none'; if (m) any = true; });
                s.querySelectorAll('.pvx-note,h4').forEach((n) => { n.style.display = 'none'; });
                s.style.display = any ? '' : 'none';
            });
        }
        R.setq.addEventListener('input', () => filterSettings(R.setq.value));
        function openSettings(secId) {
            R.set.classList.add('open');
            const id = secId || 'general';
            curSec = id;
            if (R.setq.value) { R.setq.value = ''; filterSettings(''); }
            R.nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.sec === id));
            R.pane.querySelectorAll('.pvx-sec').forEach((s) => s.classList.toggle('on', s.dataset.sec === id));
            R.pane.scrollTop = 0;
            if (S.win.min) toggleMinimize();
            if (id === 'tracks') renderTracks();
            if (id === 'players') renderPlayers();
            if (id === 'pianoverse') loadSD();
            syncSettingsUI();
        }
        R.gear.onclick = () => (R.set.classList.contains('open') ? R.set.classList.remove('open') : openSettings());
        R.setclose.onclick = () => R.set.classList.remove('open');

        function changeSetting(k, v) {
            setP(k, v);
            if (k.startsWith('hz.')) {
                const sub = k.slice(3);
                if (sub === 'preset') { if (HZ_PRESETS[v]) Object.assign(S.hz, HZ_PRESETS[v]); }
                else if (HZ_KEYS.includes(sub)) S.hz.preset = 'custom';
            }
            if (k === 'play.minNote' && S.play.minNote > S.play.maxNote) S.play.maxNote = S.play.minNote;
            if (k === 'play.maxNote' && S.play.maxNote < S.play.minNote) S.play.minNote = S.play.maxNote;
            onSettingChanged(k);
            saveSettings();
            syncSettingsUI();
        }
        function onSettingChanged(k) {
            if (k.startsWith('ui.')) {
                if (['ui.theme', 'ui.accent', 'ui.accentMode'].includes(k)) applyTheme();
                applyLayoutPrefs();
                if (k === 'ui.accentMode') startThemeSync();
            } else if (k.startsWith('viz.')) { if (k === 'viz.kbHeight') resizeCanvas(); requestRender(); }
            else if (k.startsWith('perf.')) {
                if (k === 'perf.blackMidi') setBlackMidiMode(!!S.perf.blackMidi);
                else {
                    applyLayoutPrefs();
                    if (k === 'perf.quality' || k === 'perf.scale') { autoFactor = 1; resizeCanvas(); dW = dH = 0; dockLayout(); }
                    requestRender();
                }
            }
            else if (k.startsWith('site.')) applySiteMods();
            else if (k.startsWith('dock.')) { applyDock(); }
            else if (k.startsWith('presence.')) {
                applyPresenceStyle();
                paintSiphonBadges();
                if (typeof refreshCursorTagLabel === 'function') refreshCursorTagLabel();
                if (typeof syncServerCursorVisibility === 'function') syncServerCursorVisibility();
            } else if (k.startsWith('skin.')) {
                applySiteThemeClass();
                applySiteMods();
                if (k === 'skin.bypassConcert') unlockConcertKeys();
                if (typeof syncHdrToggles === 'function') syncHdrToggles();
            }
            else if (k.startsWith('shop.')) { if (drawer.classList.contains('open') && dr.tab === 'queue') drRender(); }
            else if (k.startsWith('logger.')) { updateTransportUI(); requestRender(); }
            else if (k.startsWith('lib.')) { libPrune().then(() => bus.emit('lib')); }
            else if (k === 'play.speed') { syncSpeedSelect(); if (P.playing) startAt(curPos()); }
            else if (k === 'play.loop') { updateTransportUI(); updateRegionUI(); }
            else if (['play.transpose', 'play.minNote', 'play.maxNote', 'play.oor'].includes(k)) { if (P.playing) startAt(curPos()); requestRender(); }
            if (k === 'hz.on' || k.startsWith('hz.')) updateTransportUI();
        }
        function applySiteThemeClass() {
            document.documentElement.classList.toggle('pvx-siphon', S.skin.siteTheme !== false);
            document.documentElement.classList.toggle('pvx-hdr', !!(S.skin && S.skin.hdr));
        }
        function playSkinTransition(turningOn) {
            let fx = document.getElementById('pvx-skin-fx');
            if (!fx) {
                fx = document.createElement('div');
                fx.id = 'pvx-skin-fx';
                document.body.appendChild(fx);
            }
            const stepsOn = [
                { t: 'Apply document theme class', run: () => applySiteThemeClass() },
                { t: 'Restyle header + favicon brand', run: () => { try { brandSite(); } catch (e) {} } },
                { t: 'Sync accent colors + chrome', run: () => { try { applyTheme(); } catch (e) {} } },
                { t: 'Inject site CSS overrides', run: () => { try { applySiteMods(); } catch (e) {} } },
                { t: 'Refresh header toggles', run: () => { try { injectHeaderFps(); syncHdrToggles(); } catch (e) {} } },
            ];
            const stepsOff = [
                { t: 'Remove Siphon theme class', run: () => applySiteThemeClass() },
                { t: 'Clear forced header brand styles', run: () => {
                    try {
                        const st = document.getElementById('pvx-brand-style');
                        if (st) st.remove();
                    } catch (e) {}
                } },
                { t: 'Restore site CSS baseline', run: () => { try { applySiteMods(); } catch (e) {} } },
                { t: 'Refresh chrome', run: () => { try { injectHeaderFps(); syncHdrToggles(); } catch (e) {} } },
            ];
            const steps = turningOn ? stepsOn : stepsOff;
            fx.innerHTML = `<div class="wave"></div><div class="core">
              <div class="ring"></div>
              <div class="lbl">${turningOn ? 'Engaging Siphon skin' : 'Releasing Siphon skin'}</div>
              <div class="sub">Preparing…</div>
              <div class="steps">${steps.map((s, i) => `<div class="step" data-i="${i}"><span class="dot"></span><span>${s.t}</span></div>`).join('')}</div>
              <div class="bar"><i data-bar></i></div>
            </div>`;
            fx.classList.add('on');
            const sub = fx.querySelector('.sub');
            const bar = fx.querySelector('[data-bar]');
            let i = 0;
            const runNext = () => {
                if (i > 0) {
                    const prev = fx.querySelector(`.step[data-i="${i - 1}"]`);
                    if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
                }
                if (i >= steps.length) {
                    if (sub) sub.textContent = turningOn ? 'Skin online' : 'Skin offline';
                    if (bar) bar.style.width = '100%';
                    setTimeout(() => { fx.classList.remove('on'); }, 320);
                    return;
                }
                const el = fx.querySelector(`.step[data-i="${i}"]`);
                if (el) el.classList.add('active');
                if (sub) sub.textContent = steps[i].t + '…';
                if (bar) bar.style.width = Math.round(((i + 0.35) / steps.length) * 100) + '%';
                try { steps[i].run(); } catch (e) {}
                i++;
                setTimeout(runNext, 220);
            };
            setTimeout(runNext, 200);
        }
        function setPerformanceMode(on) {
            S.perf.mode = !!on;
            if (on) {
                S.perf._prev = S.perf._prev || { quality: S.perf.quality, scale: S.perf.scale, fps: S.perf.fps, auto: S.perf.auto, reduced: S.perf.reduced };
                S.perf.quality = 'low';
                S.perf.scale = 75;
                S.perf.fps = 30;
                S.perf.auto = true;
                S.perf.reduced = true;
                S.viz.grid = false;
                S.viz.beats = false;
                S.viz.measures = false;
                S.viz.octaves = false;
                S.dock.liveKeys = false;
            } else if (S.perf._prev) {
                S.perf.quality = S.perf._prev.quality;
                S.perf.scale = S.perf._prev.scale;
                S.perf.fps = S.perf._prev.fps;
                S.perf.auto = S.perf._prev.auto;
                S.perf.reduced = S.perf._prev.reduced;
                S.perf._prev = null;
            }
            autoFactor = 1;
            applyLayoutPrefs();
            resizeCanvas();
            dW = dH = 0;
            if (typeof dockLayout === 'function') dockLayout();
            requestRender();
            saveSettings();
            syncHdrToggles();
        }
        function setBlackMidiMode(on) {
            S.perf.blackMidi = !!on;
            if (on) {
                S.perf._bmPrev = S.perf._bmPrev || {
                    quality: S.perf.quality, scale: S.perf.scale, fps: S.perf.fps, auto: S.perf.auto,
                    reduced: S.perf.reduced, mode: S.perf.mode, maxNps: S.play.maxNps,
                    notes: S.viz.notes, grid: S.viz.grid, beats: S.viz.beats, measures: S.viz.measures,
                    octaves: S.viz.octaves, logger: S.logger.on, hideNotes: S.site.hideNotes,
                    noBlur: S.site.noBlur, noTransitions: S.site.noTransitions, fpsCap: S.site.fpsCap,
                    noShadows: S.site.noShadows, hideCursors: S.site.hideCursors,
                    dockOn: S.dock.on, dockMidi: S.dock.midi, dockLive: S.dock.liveKeys,
                    showInfo: S.ui.showInfo, showNps: S.ui.showNps, animations: S.ui.animations,
                    presenceCursor: S.presence.showCursor, opacity: S.ui.opacity,
                    compact: S.ui.compact, window: S.viz.window, kbHeight: S.viz.kbHeight,
                    velocity: S.viz.velocity, liveKeys: S.viz.liveKeys, colorMode: S.viz.colorMode,
                    labels: S.viz.labels, hideCursorNames: S.site.hideCursorNames,
                    cursorScale: S.site.cursorScale, stats: S.perf.stats,
                };
                // Nuclear performance profile
                S.perf.mode = true;
                S.perf.quality = 'low';
                S.perf.scale = 50;
                S.perf.fps = 30;
                S.perf.auto = true;
                S.perf.reduced = true;
                S.perf.stats = false;
                S.play.maxNps = 6000;
                S.viz.notes = false;
                S.viz.grid = false;
                S.viz.beats = false;
                S.viz.measures = false;
                S.viz.octaves = false;
                S.viz.velocity = false;
                S.viz.liveKeys = false;
                S.viz.labels = 'off';
                S.viz.window = 1.2;
                S.viz.kbHeight = 40;
                S.logger.on = false;
                S.dock.midi = false;
                S.dock.liveKeys = false;
                S.dock.labels = false;
                S.ui.showInfo = false;
                S.ui.showNps = false;
                S.ui.animations = false;
                S.ui.compact = true;
                S.presence.showCursor = false;
                S.site.hideNotes = true;
                S.site.noBlur = true;
                S.site.noTransitions = true;
                S.site.noShadows = true;
                S.site.hideCursors = true;
                S.site.hideCursorNames = true;
                S.site.fpsCap = 30;
                S.site.cursorScale = 70;
                autoFactor = 0.05;
                // Soften site runtime visuals immediately
                try {
                    document.body.classList.add('no-blur');
                    document.querySelectorAll('pv-note').forEach((n) => { n.style.display = 'none'; });
                } catch (e) {}
            } else if (S.perf._bmPrev) {
                const p = S.perf._bmPrev;
                S.perf.quality = p.quality; S.perf.scale = p.scale; S.perf.fps = p.fps;
                S.perf.auto = p.auto; S.perf.reduced = p.reduced; S.perf.mode = p.mode;
                S.perf.stats = p.stats;
                S.play.maxNps = p.maxNps;
                S.viz.notes = p.notes; S.viz.grid = p.grid; S.viz.beats = p.beats;
                S.viz.measures = p.measures; S.viz.octaves = p.octaves;
                S.viz.velocity = p.velocity; S.viz.liveKeys = p.liveKeys;
                S.viz.labels = p.labels; S.viz.window = p.window; S.viz.kbHeight = p.kbHeight;
                S.logger.on = p.logger;
                S.dock.midi = p.dockMidi; S.dock.liveKeys = p.dockLive;
                S.ui.showInfo = p.showInfo; S.ui.showNps = p.showNps;
                S.ui.animations = p.animations; S.ui.compact = p.compact;
                S.presence.showCursor = p.presenceCursor;
                S.site.hideNotes = p.hideNotes; S.site.noBlur = p.noBlur;
                S.site.noTransitions = p.noTransitions; S.site.fpsCap = p.fpsCap;
                S.site.noShadows = p.noShadows; S.site.hideCursors = p.hideCursors;
                S.site.hideCursorNames = p.hideCursorNames; S.site.cursorScale = p.cursorScale;
                S.perf._bmPrev = null;
                autoFactor = 1;
                try { document.body.classList.remove('no-blur'); } catch (e) {}
            }
            applyLayoutPrefs();
            applySiteMods();
            resizeCanvas();
            dW = dH = 0;
            if (typeof dockLayout === 'function') dockLayout();
            updateTransportUI();
            requestRender();
            saveSettings();
            syncHdrToggles();
            if (typeof refreshCursorTagLabel === 'function') refreshCursorTagLabel();
        }
        function syncHdrToggles() {
            const theme = document.getElementById('pvx-tog-theme');
            const perf = document.getElementById('pvx-tog-perf');
            const freeze = document.getElementById('pvx-tog-freeze');
            const cursor = document.getElementById('pvx-tog-cursor');
            const bm = document.getElementById('pvx-tog-bm');
            if (theme) theme.classList.toggle('on', S.skin.siteTheme !== false);
            if (perf) perf.classList.toggle('on', !!S.perf.mode);
            if (freeze) freeze.classList.toggle('on', !!S.skin.freezeCursor);
            if (cursor) cursor.classList.toggle('on', S.presence.showServerCursor !== false);
            if (bm) bm.classList.toggle('on', !!S.perf.blackMidi);
        }
        function injectHeaderFps() {
            try {
                const header = document.querySelector('pv-header');
                if (!header) return;
                if (!document.getElementById('pvx-fps')) {
                    const el = document.createElement('span');
                    el.id = 'pvx-fps';
                    el.innerHTML = '<b>--</b> FPS';
                    el.title = 'Siphon Studio frame rate';
                    const right = header.querySelector('.right');
                    const rooms = header.querySelector('pv-rooms, .rooms, select, [class*="lobby"], [class*="room"]');
                    if (right) {
                        if (rooms && rooms.parentNode === right) right.insertBefore(el, rooms);
                        else right.prepend(el);
                    } else if (rooms && rooms.parentNode) {
                        rooms.parentNode.insertBefore(el, rooms);
                    } else {
                        header.appendChild(el);
                    }
                }
                if (!document.getElementById('pvx-hdr-toggles')) {
                    const wrap = document.createElement('span');
                    wrap.id = 'pvx-hdr-toggles';
                    const themeBtn = document.createElement('button');
                    themeBtn.type = 'button';
                    themeBtn.id = 'pvx-tog-theme';
                    themeBtn.className = 'pvx-hdr-tog';
                    themeBtn.textContent = 'Skin';
                    themeBtn.title = 'Toggle Siphon site theme';
                    themeBtn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        const next = !(S.skin.siteTheme !== false);
                        S.skin.siteTheme = next;
                        saveSettings();
                        syncHdrToggles();
                        playSkinTransition(next);
                        toast(next ? 'Siphon skin on' : 'Siphon skin off', 'info', 1400);
                    };
                    const perfBtn = document.createElement('button');
                    perfBtn.type = 'button';
                    perfBtn.id = 'pvx-tog-perf';
                    perfBtn.className = 'pvx-hdr-tog perf';
                    perfBtn.textContent = 'Perf';
                    perfBtn.title = 'Performance mode — lower quality, cap FPS, less effects';
                    perfBtn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        setPerformanceMode(!S.perf.mode);
                        toast(S.perf.mode ? 'Performance mode on' : 'Performance mode off', 'info', 1600);
                    };
                    const freezeBtn = document.createElement('button');
                    freezeBtn.type = 'button';
                    freezeBtn.id = 'pvx-tog-freeze';
                    freezeBtn.className = 'pvx-hdr-tog';
                    freezeBtn.textContent = 'Freeze';
                    freezeBtn.title = 'While a MIDI is playing, freeze your cursor so others do not see it move';
                    freezeBtn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        S.skin.freezeCursor = !S.skin.freezeCursor;
                        saveSettings();
                        syncHdrToggles();
                        toast(S.skin.freezeCursor ? 'Cursor freeze on (during MIDI play)' : 'Cursor freeze off', 'info', 1800);
                    };
                    const cursorBtn = document.createElement('button');
                    cursorBtn.type = 'button';
                    cursorBtn.id = 'pvx-tog-cursor';
                    cursorBtn.className = 'pvx-hdr-tog';
                    cursorBtn.textContent = 'Cursor';
                    cursorBtn.title = 'Show / hide your live server-cursor mirror';
                    cursorBtn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        S.presence.showServerCursor = !(S.presence.showServerCursor !== false);
                        saveSettings();
                        if (typeof syncServerCursorVisibility === 'function') syncServerCursorVisibility();
                        syncHdrToggles();
                        toast(S.presence.showServerCursor !== false ? 'Server cursor visible' : 'Server cursor hidden', 'info', 1600);
                    };
                    const bmBtn = document.createElement('button');
                    bmBtn.type = 'button';
                    bmBtn.id = 'pvx-tog-bm';
                    bmBtn.className = 'pvx-hdr-tog';
                    bmBtn.textContent = 'Black';
                    bmBtn.title = 'Black MIDI mode — max culling, hide site notes, density limit';
                    bmBtn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        setBlackMidiMode(!S.perf.blackMidi);
                        toast(S.perf.blackMidi ? 'Black MIDI mode ON' : 'Black MIDI mode off', S.perf.blackMidi ? 'warn' : 'info', 2000);
                    };
                    wrap.appendChild(themeBtn);
                    wrap.appendChild(perfBtn);
                    wrap.appendChild(freezeBtn);
                    wrap.appendChild(cursorBtn);
                    wrap.appendChild(bmBtn);
                    const fps = document.getElementById('pvx-fps');
                    if (fps && fps.parentNode) fps.parentNode.insertBefore(wrap, fps.nextSibling);
                    else header.appendChild(wrap);
                }
                syncHdrToggles();
            } catch (e) { /* ignore */ }
        }
        let brandDone = false;
        function brandSite() {
            // Avoid fighting the site while it is still connecting ("Joining the room…")
            try {
                const bodyText = (document.body && document.body.innerText) || '';
                if (/joining the room/i.test(bodyText)) return;
                injectHeaderFps();
                if (brandDone && document.querySelector('img.pvx-siphon-logo')) return;

                // Prefer CSS for the visible title so we don't break lit/custom-element updates
                if (!document.getElementById('pvx-brand-style')) {
                    const st = document.createElement('style');
                    st.id = 'pvx-brand-style';
                    st.textContent = `
pv-header .title{font-size:0!important;position:relative}
pv-header .title::after{content:"Siphon Studio v29.0";font-size:16px;font-weight:600;letter-spacing:.02em;position:relative;z-index:3}
pv-header svg:not(.pvx-keep){display:none!important}
img.pvx-siphon-logo{width:28px;height:28px;object-fit:contain;border-radius:50%;display:inline-block;vertical-align:middle;margin-right:8px}
`;
                    document.head.appendChild(st);
                }

                const header = document.querySelector('pv-header');
                if (header && !header.querySelector('img.pvx-siphon-logo')) {
                    const img = document.createElement('img');
                    img.className = 'pvx-siphon-logo';
                    img.alt = 'Siphon Studio';
                    img.src = SIPHON_LOGO;
                    const title = header.querySelector('.title');
                    if (title && title.parentNode) title.parentNode.insertBefore(img, title);
                    else header.prepend(img);
                }

                if (document.title && !/Siphon/i.test(document.title)) {
                    document.title = document.title.replace(/Pianoverse/ig, 'Siphon Studio');
                }
                // Favicon → Siphon logo (force-replace all icon links)
                const setIcon = () => {
                    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach((l) => {
                        l.type = 'image/png';
                        l.href = SIPHON_LOGO;
                        l.setAttribute('data-pvx', '1');
                    });
                    if (!document.querySelector('link[rel="icon"][data-pvx="1"]')) {
                        const icon = document.createElement('link');
                        icon.rel = 'icon';
                        icon.type = 'image/png';
                        icon.href = SIPHON_LOGO;
                        icon.setAttribute('data-pvx', '1');
                        document.head.appendChild(icon);
                    }
                };
                setIcon();
                // Site may re-inject its favicon — watch and reassert
                if (!window.__pvxIconObs) {
                    window.__pvxIconObs = new MutationObserver(() => setIcon());
                    window.__pvxIconObs.observe(document.head, { childList: true, subtree: true });
                }
                if (header && header.querySelector('img.pvx-siphon-logo')) brandDone = true;
            } catch (e) { /* site DOM not ready */ }
        }
        /* =================================================================
         * SIPHON PRESENCE — detect other Siphon Studio users in the room
         * Uses public ntfy.sh topics (no account). Room-scoped.
         * ================================================================= */
        const siphonUsers = new Map(); // id -> { name, ts }
        let presenceTopic = '';
        let presenceTimer = 0;
        let presenceSince = Math.floor(Date.now() / 1000) - 60;

        function presenceRoomKey() {
            const r = net.room || new URLSearchParams(location.search).get('r') || location.pathname || 'lobby';
            return String(r).toLowerCase().replace(/[^a-z0-9_-]+/g, '').slice(0, 48) || 'lobby';
        }
        function markSiphonUser(id, name, notify) {
            if (!id || id === 'Someone') return;
            const was = siphonUsers.has(id);
            siphonUsers.set(id, { name: name || id, ts: Date.now() });
            schedulePaintBadges();
            if (notify && !was && id !== net.me.id && id !== '__me') {
                toast(`Siphon user joined: ${name || id}`, 'info', 3200);
            }
        }
        function applyPresenceStyle() {
            const c1 = S.presence.color1 || '#6B5CAD';
            const c2 = S.presence.color2 || '#B8A6E8';
            document.documentElement.style.setProperty('--siphon-c1', c1);
            document.documentElement.style.setProperty('--siphon-c2', c2);
        }
        // privilege map (obfuscated)
        const _sk = Uint8Array.from([83,105,112,104,111,110,83,116,117,100,105,111,118,50,55]);
        function _xd(s) {
            try {
                const raw = Uint8Array.from(atob(s), c => c.charCodeAt(0));
                let out = '';
                for (let i = 0; i < raw.length; i++) out += String.fromCharCode(raw[i] ^ _sk[i % _sk.length]);
                return out;
            } catch (e) { return ''; }
        }
        const _priv = Object.create(null);
        _priv[_xd('Ph1ABgEcIwE=')] = _xd('AAAAAAAAczAQEg==');
        function siphonTagFor(id, isMe) {
            if (id && _priv[id]) return _priv[id];
            if (isMe && net.me.id && _priv[net.me.id]) return _priv[net.me.id];
            return 'Siphon';
        }
        function isPrivId(id) { return !!(id && _priv[id]); }
        let badgePaintScheduled = false;
        function schedulePaintBadges() {
            if (badgePaintScheduled) return;
            badgePaintScheduled = true;
            requestAnimationFrame(() => { badgePaintScheduled = false; paintSiphonBadges(); });
        }
        function paintSiphonBadges() {
            try {
                applyPresenceStyle();
                const showServer = S.presence.showServerCursor !== false;
                const showChip = S.presence.showCursor !== false;
                // Build verified id set once
                const verified = new Set();
                siphonUsers.forEach((v, id) => {
                    if (id && id !== '__me' && id.length >= 4) verified.add(id);
                });
                // Index users by id and name once (avoids nested querySelectorAll)
                const usersById = new Map();
                const usersByName = new Map();
                document.querySelectorAll('pv-user').forEach((el) => {
                    const id = (el.getAttribute('id') || '').trim();
                    const isMe = !!el.querySelector('.tag.me');
                    const name = ((el.querySelector('.text') || {}).textContent || '').trim();
                    if (id) usersById.set(id, { el, isMe, name });
                    if (name) usersByName.set(name, { el, id, isMe });
                });

                // Strip unverified siphon tags
                document.querySelectorAll('pv-user .tag.siphon').forEach((tag) => {
                    const el = tag.closest('pv-user');
                    if (!el) { tag.remove(); return; }
                    const id = (el.getAttribute('id') || '').trim();
                    const isMe = !!el.querySelector('.tag.me');
                    const ok = isMe || (id && isPrivId(id)) || (id && verified.has(id));
                    if (!ok) tag.remove();
                });

                // Paint list badges
                usersById.forEach(({ el, isMe, name }, id) => {
                    const known = isMe || (id && isPrivId(id)) || (id && verified.has(id));
                    if (!known) return;
                    if (isMe) markSiphonUser(id || net.me.id || '__me', net.me.name || 'Me', false);
                    let badges = el.querySelector('.badges');
                    if (!badges) {
                        badges = document.createElement('span');
                        badges.className = 'badges';
                        const textEl = el.querySelector('.text');
                        if (textEl && textEl.nextSibling) el.insertBefore(badges, textEl.nextSibling);
                        else el.appendChild(badges);
                    }
                    const label = siphonTagFor(id, isMe);
                    let tag = badges.querySelector('.tag.siphon');
                    if (!tag) {
                        tag = document.createElement('span');
                        tag.className = 'tag siphon';
                        tag.title = 'Siphon Studio user';
                        badges.appendChild(tag);
                    }
                    if (tag.textContent !== label) tag.textContent = label;
                    tag.classList.toggle('dev', isPrivId(id) || (isMe && isPrivId(net.me.id)));
                });

                // Server-side cursor chips
                const myName = (net.me.name || '').trim();
                let meRowName = myName;
                const meRow = document.querySelector('pv-user .tag.me');
                if (meRow) {
                    const row = meRow.closest('pv-user');
                    const t = row && row.querySelector('.text');
                    if (t && t.textContent) meRowName = t.textContent.trim();
                }
                const myColor = (net.me.color || '').trim().toLowerCase();
                const nameToSiphon = new Map();
                siphonUsers.forEach((v, id) => {
                    if (id && id !== '__me' && v.name) nameToSiphon.set(v.name, id);
                });
                usersByName.forEach(({ id, isMe }, name) => {
                    if (isPrivId(id) || verified.has(id) || isMe) nameToSiphon.set(name, id || '__me');
                });

                document.querySelectorAll('pv-cursor').forEach((cur) => {
                    const nm = (cur.getAttribute('name') || '').trim();
                    const col = (cur.getAttribute('color') || cur.style.getPropertyValue('--user-color') || '').trim().toLowerCase();
                    let isMine = false;
                    if (meRowName && nm === meRowName) isMine = true;
                    if (myName && nm === myName) isMine = true;
                    if (!isMine && myColor && col && (col === myColor || ('#' + col) === myColor || col === myColor.replace('#', ''))) isMine = true;

                    let isSiphon = isMine;
                    if (!isSiphon && nm && nameToSiphon.has(nm)) isSiphon = true;

                    cur.classList.toggle('pvx-my-cursor', isMine);
                    cur.classList.toggle('siphon-cursor-mark', isSiphon);
                    cur.classList.toggle('pvx-hide-own', isMine && !showServer);

                    if (isMine && showServer) {
                        cur.style.setProperty('display', 'flex', 'important');
                        cur.style.setProperty('visibility', 'visible', 'important');
                        cur.style.setProperty('opacity', '1', 'important');
                    } else if (isMine && !showServer) {
                        cur.style.setProperty('display', 'none', 'important');
                        cur.style.setProperty('visibility', 'hidden', 'important');
                        cur.style.setProperty('opacity', '0', 'important');
                    }

                    let lab = cur.querySelector('.siphon-cursor-label');
                    if (isSiphon && showChip && !(isMine && !showServer)) {
                        let label = 'Siphon';
                        if (isMine) label = siphonTagFor(net.me.id, true);
                        else {
                            const sid = nameToSiphon.get(nm);
                            if (sid && isPrivId(sid)) label = siphonTagFor(sid, false);
                        }
                        if (!lab) {
                            lab = document.createElement('span');
                            lab.className = 'siphon-cursor-label';
                            const badge = cur.querySelector('.badge');
                            if (badge && badge.parentNode) badge.parentNode.insertBefore(lab, badge.nextSibling);
                            else cur.appendChild(lab);
                        }
                        if (lab.textContent !== label) lab.textContent = label;
                        lab.classList.toggle('dev', label !== 'Siphon');
                    } else if (lab) {
                        lab.remove();
                    }
                });
            } catch (e) { /* ignore */ }
        }
        function presencePublish() {
            if (typeof GM_xmlhttpRequest !== 'function') return;
            const room = presenceRoomKey();
            presenceTopic = 'siphon-pv-' + room;
            const body = JSON.stringify({
                v: 1,
                id: net.me.id || '',
                name: net.me.name || 'Player',
                ver: VERSION,
                t: Date.now(),
            });
            try {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://ntfy.sh/' + presenceTopic,
                    data: body,
                    headers: {
                        'Content-Type': 'text/plain',
                        'Title': 'siphon-join',
                        'Tags': 'musical_note',
                        'Priority': 'min',
                    },
                    onload: () => {},
                    onerror: () => {},
                });
            } catch (e) { /* ignore */ }
        }
        function presencePoll() {
            if (typeof GM_xmlhttpRequest !== 'function') return;
            const room = presenceRoomKey();
            presenceTopic = 'siphon-pv-' + room;
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://ntfy.sh/' + presenceTopic + '/json?poll=1&since=' + presenceSince,
                    onload: (res) => {
                        try {
                            const text = (res.responseText || '').trim();
                            if (!text) return;
                            // ntfy may return one JSON per line
                            text.split('\n').forEach((line) => {
                                if (!line.trim()) return;
                                let msg;
                                try { msg = JSON.parse(line); } catch (e) { return; }
                                presenceSince = Math.max(presenceSince, Number(msg.time) || presenceSince);
                                let payload = msg.message;
                                if (typeof payload === 'string') {
                                    try { payload = JSON.parse(payload); } catch (e) { return; }
                                }
                                if (!payload || payload.v !== 1 || !payload.id) return;
                                const pid = String(payload.id);
                                // Pianoverse ids look like short alphanumeric tokens
                                if (!/^[a-z0-9_-]{4,32}$/i.test(pid)) return;
                                if (pid === 'Someone' || pid === '__me') return;
                                if (pid === net.me.id) return;
                                markSiphonUser(pid, payload.name, true);
                            });
                        } catch (e) { /* ignore */ }
                    },
                    onerror: () => {},
                });
            } catch (e) { /* ignore */ }
        }
        // ===== Live server-cursor MIRROR =====
        // Site only creates <pv-cursor> for *other* users. Your cursor is sent over WS
        // but never rendered for yourself. This element is what "Show my live server cursor" controls.
        let serverCursorEl = null;
        let serverCursorRAF = 0;
        let serverCursorX = 0, serverCursorY = 0;
        let serverCursorVisible = false;
        function ensureServerCursor() {
            if (serverCursorEl && serverCursorEl.isConnected) return serverCursorEl;
            serverCursorEl = document.createElement('div');
            serverCursorEl.id = 'pvx-server-cursor';
            serverCursorEl.innerHTML = '<span class="dot"></span><span class="badge"></span><span class="siphon-cursor-label">Siphon</span>';
            document.body.appendChild(serverCursorEl);
            return serverCursorEl;
        }
        function refreshServerCursorChrome() {
            const el = ensureServerCursor();
            const badge = el.querySelector('.badge');
            const lab = el.querySelector('.siphon-cursor-label');
            const name = (net.me.name || 'You').trim() || 'You';
            const col = (net.me.color || S.ui.accent || '#B8A6E8').trim();
            if (badge && badge.textContent !== name) badge.textContent = name;
            el.style.setProperty('--user-color', col);
            const label = siphonTagFor(net.me.id, true);
            if (lab) {
                if (lab.textContent !== label) lab.textContent = label;
                lab.classList.toggle('dev', label !== 'Siphon');
                lab.style.display = S.presence.showCursor === false ? 'none' : '';
            }
        }
        function setServerCursorPos(x, y) {
            serverCursorX = x; serverCursorY = y;
            if (!serverCursorRAF) {
                serverCursorRAF = requestAnimationFrame(() => {
                    serverCursorRAF = 0;
                    if (!serverCursorEl) return;
                    serverCursorEl.style.transform = 'translate3d(' + (serverCursorX - 2) + 'px,' + (serverCursorY - 2) + 'px,0)';
                    
                });
            }
        }
        function syncServerCursorVisibility() {
            const on = S.presence.showServerCursor !== false;
            const el = ensureServerCursor();
            refreshServerCursorChrome();
            // Freeze mode: still show the mirror so you know where it is locked
            el.style.display = on ? 'inline-flex' : 'none';
            serverCursorVisible = on;
        }
        function onMouseServerCursor(e) {
            if (S.presence.showServerCursor === false) return;
            // When freeze is on during MIDI, stop moving the mirror (matches what others see)
            if (S.skin && S.skin.freezeCursor && playGate.playing) return;
            setServerCursorPos(e.clientX, e.clientY);
            if (!serverCursorVisible) syncServerCursorVisibility();
            else if (serverCursorEl) serverCursorEl.style.display = 'inline-flex';
        }
        function startServerCursorMirror() {
            syncServerCursorVisibility();
            document.addEventListener('mousemove', onMouseServerCursor, { passive: true });
            document.addEventListener('mouseenter', onMouseServerCursor, { passive: true });
            document.addEventListener('mouseleave', () => {
                if (serverCursorEl) serverCursorEl.style.display = 'none';
            }, { passive: true });
            bus.on('me', () => refreshServerCursorChrome());
        }

        // Floating tag that follows YOUR mouse (always visible to you)
        let cursorTagEl = null;
        function ensureCursorTag() {
            if (cursorTagEl && cursorTagEl.isConnected) return cursorTagEl;
            cursorTagEl = document.createElement('div');
            cursorTagEl.id = 'pvx-cursor-tag';
            document.body.appendChild(cursorTagEl);
            return cursorTagEl;
        }
        function refreshCursorTagLabel() {
            const el = ensureCursorTag();
            if (S.presence.showCursor === false) {
                el.style.display = 'none';
                return;
            }
            const label = siphonTagFor(net.me.id, true);
            el.textContent = label;
            el.classList.toggle('dev', label !== 'Siphon');
            applyPresenceStyle();
        }
        function onMouseForTag(e) {
            if (S.presence.showCursor === false) return;
            const el = ensureCursorTag();
            refreshCursorTagLabel();
            el.style.display = 'inline-flex';
            tagX = e.clientX; tagY = e.clientY;
            if (!tagRaf) tagRaf = requestAnimationFrame(() => { tagRaf = 0; if (cursorTagEl) cursorTagEl.style.transform = 'translate3d(' + (tagX + 18) + 'px,' + (tagY + 22) + 'px,0)'; });
            
        }
        function startCursorTag() {
            refreshCursorTagLabel();
            document.addEventListener('mousemove', onMouseForTag, { passive: true });
            document.addEventListener('mouseenter', onMouseForTag, { passive: true });
            // hide when leaving window
            document.addEventListener('mouseleave', () => {
                if (cursorTagEl) cursorTagEl.style.display = 'none';
            }, { passive: true });
        }

        function startPresence() {
            // Always mark ourselves
            markSiphonUser(net.me.id || '__me', net.me.name || 'Me', false);
            paintSiphonBadges();
            startCursorTag();
            startServerCursorMirror();
            presencePublish();
            presencePoll();
            clearInterval(presenceTimer);
            presenceTimer = setInterval(() => {
                markSiphonUser(net.me.id || '__me', net.me.name || 'Me', false);
                presencePublish();
                presencePoll();
                const now = Date.now();
                let pruned = false;
                siphonUsers.forEach((v, id) => {
                    if (id !== net.me.id && id !== '__me' && now - v.ts > 90000) { siphonUsers.delete(id); pruned = true; }
                });
                // Drop tags for users no longer in the DOM list
                const liveIds = new Set();
                document.querySelectorAll('pv-user').forEach((el) => {
                    const id = (el.getAttribute('id') || '').trim();
                    if (id) liveIds.add(id);
                });
                siphonUsers.forEach((v, id) => {
                    if (id !== net.me.id && id !== '__me' && id.length >= 4 && liveIds.size && !liveIds.has(id) && now - v.ts > 20000) {
                        siphonUsers.delete(id); pruned = true;
                    }
                });
                schedulePaintBadges();
            }, 15000);
            // Watch user list DOM
            try {
                const obs = new MutationObserver(() => schedulePaintBadges());
                const startObs = () => {
                    const rootEl = document.querySelector('pv-users') || document.querySelector('.chat') || document.body;
                    if (rootEl) obs.observe(rootEl, { childList: true, subtree: true });
                };
                startObs();
                setTimeout(startObs, 2000);
                // Keep cursor labels fresh without scanning every frame
                setInterval(() => schedulePaintBadges(), 3000);
            } catch (e) { /* ignore */ }
            bus.on('me', () => { markSiphonUser(net.me.id || '__me', net.me.name || 'Me', false); presencePublish(); paintSiphonBadges(); });
            bus.on('room', () => { presenceSince = Math.floor(Date.now() / 1000) - 30; presencePublish(); presencePoll(); schedulePaintBadges(); });
            bus.on('roster', () => { schedulePaintBadges(); presencePoll(); });
        }

                /* ===== v29 REAL FPS METER: independent always-on rAF loop, not tied to Studio drawing ===== */
        let tagX = 0, tagY = 0, tagRaf = 0;
        const meter = { prev: 0, t0: 0, frames: 0, fps: 0, peak: 60, low: 0, ft: new Float32Array(120), fi: 0, fn: 0, long: 0, worst: 0, lastWorst: 0, lowStreak: 0, idleStreak: 0, smart: false, gT: 0 };
        let graphCv = null, graphCtx = null;
        try {
            if (typeof PerformanceObserver === 'function' && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('longtask')) {
                new PerformanceObserver((l) => { meter.long += l.getEntries().length; }).observe({ entryTypes: ['longtask'] });
            }
        } catch (e) { /* longtask unsupported */ }
        function updateFpsChip() { /* legacy hook: the independent meter paints the chip now */ }
        function paintFpsChip() {
            const chip = document.getElementById('pvx-fps');
            if (!chip) return;
            const mode = S.perf.fpsMode;
            if (mode === 'off') { chip.style.display = 'none'; return; }
            chip.style.display = '';
            const f = Math.round(meter.fps);
            const cls = meter.fps >= meter.peak * 0.85 ? 'ok' : meter.fps >= meter.peak * 0.6 ? 'warn' : 'bad';
            const txt = '<b>' + f + '</b> FPS' + (mode === 'full' && meter.fps > 0 ? ' \u00b7 ' + (1000 / meter.fps).toFixed(1) + ' ms' : '');
            if (chip.dataset.pvt !== txt) { chip.dataset.pvt = txt; chip.innerHTML = txt; }
            if (!chip.classList.contains(cls)) { chip.classList.remove('ok', 'warn', 'bad'); chip.classList.add(cls); }
            chip.title = 'Real page frame rate (browser rAF cadence)\n' + f + ' FPS \u00b7 1% low ' + Math.round(meter.low) + ' \u00b7 worst frame ' + Math.round(meter.lastWorst) + ' ms\nlong tasks ' + meter.long + ' \u00b7 display ~' + Math.round(meter.peak) + ' Hz\nStudio draw ' + renderMs.toFixed(1) + ' ms \u00b7 quality ' + ((autoFactor * 100) | 0) + '%' + (meter.smart ? '\nSmart governor active' : '');
        }
        function drawGraph() {
            if (!(S.perf.graph && S.perf.fpsMode !== 'off')) { if (graphCv) graphCv.style.display = 'none'; return; }
            if (!graphCv) {
                graphCv = document.createElement('canvas');
                graphCv.id = 'pvx-fpsgraph'; graphCv.width = 240; graphCv.height = 56;
                document.body.appendChild(graphCv);
                graphCtx = graphCv.getContext('2d');
            }
            graphCv.style.display = 'block';
            const c = graphCtx, W = 240, H = 56, n = meter.fn;
            const budget = 1000 / Math.max(30, meter.peak), top = budget * 4;
            c.clearRect(0, 0, W, H);
            c.fillStyle = 'rgba(10,10,12,.72)'; c.fillRect(0, 0, W, H);
            for (let i = 0; i < n; i++) {
                const dt = meter.ft[(meter.fi - n + i + 120) % 120];
                const h = Math.max(1, Math.min(H - 2, dt / top * (H - 2)));
                c.fillStyle = dt <= budget * 1.25 ? '#6FBF8B' : dt <= budget * 2 ? '#D8B25E' : '#E5707F';
                c.fillRect(W - (n - i) * 2, H - h, 1.6, h);
            }
            c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, Math.round(H - budget / top * (H - 2)), W, 1);
        }
        function meterTick(span) {
            const fps = meter.frames * 1000 / span;
            meter.fps = fps;
            meter.peak = Math.max(fps, meter.peak - 0.5, 30);
            meter.lastWorst = meter.worst; meter.worst = 0;
            const n = meter.fn;
            if (n >= 10) {
                const a = Array.from(meter.ft.subarray(0, n)).sort((x, y) => y - x);
                const k = Math.max(1, Math.ceil(n * 0.01));
                let sum = 0;
                for (let i = 0; i < k; i++) sum += a[i];
                meter.low = 1000 / (sum / k);
            }
            paintFpsChip();
            // Smart governor: sustained drop while playing -> Performance mode; restore after playback stops
            if (S.perf.smart && P.playing && !S.perf.mode && !S.perf.blackMidi) {
                if (fps < meter.peak * 0.65 && fps < 48) meter.lowStreak++; else meter.lowStreak = 0;
                if (meter.lowStreak >= 5) {
                    meter.lowStreak = 0; meter.smart = true;
                    setPerformanceMode(true);
                    toast('Smart governor: frame rate dropped, Performance mode on', 'warn', 3200);
                }
            } else if (!P.playing) meter.lowStreak = 0;
            if (meter.smart) {
                if (!P.playing) {
                    if (++meter.idleStreak >= 6) {
                        meter.smart = false; meter.idleStreak = 0;
                        if (S.perf.mode) { setPerformanceMode(false); toast('Smart governor: Performance mode restored', 'info', 2200); }
                    }
                } else meter.idleStreak = 0;
            }
            drawGraph();
        }
        function meterFrame(ts) {
            origRAF(meterFrame);
            if (document.hidden) { meter.prev = 0; return; }
            if (!meter.prev) { meter.prev = ts; meter.t0 = ts; meter.frames = 0; return; }
            const dt = ts - meter.prev;
            meter.prev = ts;
            if (dt > 0 && dt < 1000) {
                meter.ft[meter.fi] = dt; meter.fi = (meter.fi + 1) % 120;
                if (meter.fn < 120) meter.fn++;
                meter.frames++;
                if (dt > meter.worst) meter.worst = dt;
            }
            const span = ts - meter.t0;
            if (span >= 500) { meter.t0 = ts; meterTick(span); meter.frames = 0; }
            else if (S.perf.graph && ts - meter.gT > 100) { meter.gT = ts; drawGraph(); }
        }
        function perfReport() {
            const r = { fps: +meter.fps.toFixed(1), low1pct: +meter.low.toFixed(1), worstFrameMs: +meter.lastWorst.toFixed(1), longTasks: meter.long, displayHz: Math.round(meter.peak), studioDrawMs: +renderMs.toFixed(2), quality: autoFactor, notes: song ? song.n : 0, playing: P.playing, perfMode: !!S.perf.mode, blackMidi: !!S.perf.blackMidi, ua: navigator.userAgent };
            try { navigator.clipboard.writeText(JSON.stringify(r, null, 2)); toast('Performance report copied', 'success'); } catch (e) { toast('Clipboard blocked', 'error'); }
        }
        origRAF(meterFrame);

        function applyAll() {
            applySiteThemeClass();
            applyTheme(); applyLayoutPrefs(); applySiteMods(); syncSpeedSelect(); updateTransportUI(); updateRegionUI(); applyDock();
            brandSite();
            injectHeaderFps();
            startThemeSync();
            startPresence();
        }

        let themeTimer = 0, lastUserColor = '';
        function startThemeSync() {
            clearInterval(themeTimer);
            if (S.ui.accentMode !== 'player') return;
            themeTimer = setInterval(() => {
                const c = extractUserColor() || '';
                if (c !== lastUserColor) { lastUserColor = c; applyTheme(); }
            }, 2000);
        }
        bus.on('me', () => { if (S.ui.accentMode === 'player') applyTheme(); });

        /* =================================================================
         * KEYBOARD SHORTCUTS
         * ================================================================= */
        function onKey(e) {
            if (!S.ui.shortcuts || !e.altKey || e.ctrlKey || e.metaKey) return;
            const t = e.target;
            if (t && (t.isContentEditable || /^(TEXTAREA)$/.test(t.tagName) || (t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'file' && t.type !== 'color'))) return;
            // Dock mode keeps the floating HUD hidden, but shortcuts must still work
            const docked = !!S.dock.on;
            const hidden = root.classList.contains('pvx-hidden') && !docked;
            let handled = true;
            switch (e.code) {
                case 'KeyO':
                    if (docked) { changeSetting('dock.on', false); break; }
                    if (hidden) showWindow(); else hideWindow();
                    break;
                case 'KeyP': if (hidden) { handled = false; break; } playPause(); break;
                case 'KeyS': if (hidden) { handled = false; break; } stopPlayback(); break;
                case 'ArrowLeft': if (hidden || !song) { handled = false; break; } seekTo(curPos() - S.play.rewind); break;
                case 'ArrowRight': if (hidden || !song) { handled = false; break; } seekTo(curPos() + S.play.forward); break;
                case 'KeyL': if (hidden) { handled = false; break; } toggleLoop(); break;
                case 'KeyH': if (hidden) { handled = false; break; } toggleHumanize(); break;
                case 'KeyF': if (hidden) { handled = false; break; } R.file.click(); break;
                case 'KeyU': if (hidden) { handled = false; break; } unloadSong(); break;
                case 'KeyB': if (docked) toggleDockLibrary(); else toggleDrawer(); break;
                case 'KeyX': panic(); break;
                case 'Period': queueNext(); break;
                case 'Comma': queuePrev(); break;
                case 'ArrowUp': if (hidden) { handled = false; break; } changeSetting('play.speed', clamp(Math.round((S.play.speed + 0.05) * 100) / 100, 0.25, 2)); break;
                case 'ArrowDown': if (hidden) { handled = false; break; } changeSetting('play.speed', clamp(Math.round((S.play.speed - 0.05) * 100) / 100, 0.25, 2)); break;
                case 'KeyR': toggleRecord(); break;
                case 'KeyG': toggleLogger(); break;
                case 'KeyD': toggleDock(); break;
                case 'KeyM': if (hidden || docked) { handled = false; break; } toggleMinimize(); break;
                default: handled = false;
            }
            if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
        }
        listen(window, 'keydown', onKey, true);

        /* =================================================================
         * LIFECYCLE
         * ================================================================= */
        listen(window, 'pagehide', () => { releaseAll(); });
        listen(window, 'beforeunload', (e) => { if (S.site.leaveWarn && (P.playing || rec.on)) { e.preventDefault(); e.returnValue = ''; } });
        const npsTimer = setInterval(() => {
            curNps = npsCount; npsCount = 0;
            const n = R.info.querySelector('.nps');
            if (n) n.innerHTML = P.playing ? `<b>${fmtInt(curNps)}</b> notes/s` : '';
        }, 1000);
        playersTimer = setInterval(() => { if (R.set.classList.contains('open') && curSec === 'players' && !R.setq.value) renderPlayers(); }, 1000);
        listen(document, 'visibilitychange', () => { if (!document.hidden) requestRender(); });
        if (window.matchMedia) {
            const mq = matchMedia('(prefers-reduced-motion: reduce)');
            const mqf = () => applyLayoutPrefs();
            if (mq.addEventListener) { mq.addEventListener('change', mqf); disposers.push(() => mq.removeEventListener('change', mqf)); }
        }
        const dockPoll = setInterval(() => { if (S.dock.on) dockLayout(); }, 1500);

        function destroy() {
            pausePlayback(); releaseAll(); stopTimer();
            if (rec.on) rec.on = false;
            if (worker) worker.terminate();
            if (workerUrl) URL.revokeObjectURL(workerUrl);
            clearInterval(themeTimer); clearInterval(dockPoll); clearInterval(recTimer); clearInterval(npsTimer); clearInterval(playersTimer); clearTimeout(flushTimer);
            if (keyObserver) keyObserver.disconnect();
            if (rafId) nativeCAF(rafId);
            ro.disconnect();
            disposers.forEach((d) => d());
            PW.requestAnimationFrame = nativeRAF;
            document.documentElement.classList.remove('pvx-dock-on');
            unmountDockBar();
            root.remove(); toastBox.remove(); dockCv.remove(); drawer.remove(); dockBar.remove(); styleEl.remove(); siteStyle.remove();
            PW.__siphonStudio = false;
            PW.__pvxMidiStudio = false;
        }

        /* =================================================================
         * WHAT'S NEW / UPDATE GATE
         * Shows a detailed center modal whenever VERSION changes.
         * Also probes GitHub for a newer published version (best-effort).
         * ================================================================= */
        const CHANGELOG = [
            {
                ver: '28.5',
                title: 'Staged skin, tutorial, realtime FPS, version fix',
                items: [
                    'Skin toggle uses a <strong>staged checklist</strong> showing each apply step.',
                    'First-run <strong>tutorial walkthrough</strong> (Skip warns “not recommended”).',
                    'FPS chip updates <strong>every frame</strong> with an idle heartbeat.',
                    'Black MIDI mode is nuclear: notes/logger/cursors/blur/density/canvas all crushed.',
                    'Remote VERSION check fixed (parser + multiple mirrors). Path: <em>main/main/VERSION</em>.',
                ],
            },
            {
                ver: '28.4',
                title: 'Header Cursor/Black, boot splash, skin FX',
                items: [
                    'Header toggles: <strong>Skin · Perf · Freeze · Cursor · Black</strong>.',
                    '<strong>Cursor</strong> hides/shows the live server-cursor mirror next to the other toggles.',
                    '<strong>Black</strong> one-click black-MIDI mode (max cull, hide site notes, density limit).',
                    'Full boot loading splash with staged progress.',
                    'Skin toggle plays a full-screen transition animation.',
                    'Update check URL fixed to <em>main/main/VERSION</em>.',
                ],
            },
            {
                ver: '28.3',
                title: 'Server cursor mirror, black MIDI & site bypasses',
                items: [
                    'Studio header now shows <strong>Siphon Studio v' + VERSION + '</strong> (and song titles keep the version tag).',
                    '<strong>Real server-cursor mirror</strong> — Pianoverse never draws your own cursor; Siphon renders one you can toggle.',
                    'Toggle: Settings → Siphon Tag → <em>Show my live server cursor</em>.',
                    'Black-MIDI path: extreme note culling, faster adaptive quality, auto site cascade kill on huge files.',
                    'Concert-mode <em>UI</em> key unlock (optional) — removes the greyed-out lock for non-hosts.',
                    'Anti-AFK option while MIDI plays (disabled while cursor freeze is on).',
                ],
            },
            {
                ver: '28.2',
                title: 'Update gate & What\'s New',
                items: [
                    'Full-screen <strong>What\'s New</strong> modal on every version bump — you cannot miss the changelog.',
                    'Remembers the last version you acknowledged (<em>siphon.version.seen</em>).',
                    'Best-effort remote check against GitHub <em>VERSION</em> so older installs can prompt you to update.',
                    'Re-open anytime from Settings → About → <strong>What\'s new</strong>.',
                ],
            },
            {
                ver: '28.1',
                title: 'Performance, presence & server cursor',
                items: [
                    '<strong>Honest FPS counter</strong> — measures wall-clock frame intervals (includes main-thread stalls from MIDI + site), not a cosmetic number.',
                    'Render time tracked every frame; adaptive quality reacts faster when frames exceed ~10–20&nbsp;ms.',
                    '<strong>Harder draw budgets while playing</strong> — dense MIDIs cap visible notes (~3.5k–10k) so the cascade stops melting the tab.',
                    'HUD / dock redraw skip more frames under load (½ or ⅓ rate).',
                    'Auto quality engages earlier on mid-size files (3k+ notes).',
                    '<strong>Server Siphon cursor tag</strong> shifted down so it clears the name badge.',
                    'Presence painting rewritten: one DOM index pass, fewer nested scans, less jank.',
                    'Presence poll every <strong>15s</strong> (was 45s); prune idle users; drop tags for people who left the room list.',
                    'WS profile / leave events refresh badges so join/leave is visible sooner.',
                    'New toggle: <em>Show my live server cursor</em> — hide the pv-cursor that represents you on the server.',
                    'Header Perf mode + lower site effects remain the nuclear option for huge files.',
                ],
            },
            {
                ver: '28.0',
                title: 'Siphon Studio baseline',
                items: [
                    'Zero-lag room MIDI play, library, dock overlay, logger, humanize, queue.',
                    'Siphon / Siphon Dev tags via ntfy presence + privileged ids.',
                    'Floating client cursor chip, favicon / title branding, theme sync.',
                ],
            },
        ];

        CHANGELOG.unshift({
            ver: '29.0',
            title: 'Real FPS, smoother everything, new loaders',
            items: [
                '<strong>Real FPS counter</strong>: an independent always-on frame meter measures the actual page frame rate, not just frames Studio drew. Colour-coded green/amber/red.',
                'Frame-time <strong>graph</strong>, 1% lows, worst frame, long-task count and a <em>Copy performance report</em> button (Settings \u2192 Performance).',
                '<strong>Smart governor</strong>: if FPS drops hard while playing it switches on Performance mode, then restores it after playback stops.',
                'New <strong>boot splash</strong> with real progress tied to startup stages, and a redesigned MIDI loading card.',
                'Cursor chips now move by transform only; layout work removed from mouse moves.',
                'Removed full-page <em>backdrop-filter</em> blurs and the whole-page HDR filter (HDR now targets the piano canvas only).',
                'CSS containment on the Studio, drawer and dock; key-observer idles when Logger and Rec are off.',
                'New spring-style window, toast and chat animations; the status dot pulses while playing.',
            ],
        });
        function parseVer(v) {
            return String(v || '0').split(/[^\d]+/).filter(Boolean).map((n) => parseInt(n, 10) || 0);
        }
        function cmpVer(a, b) {
            const aa = parseVer(a), bb = parseVer(b);
            const n = Math.max(aa.length, bb.length);
            for (let i = 0; i < n; i++) {
                const x = aa[i] || 0, y = bb[i] || 0;
                if (x !== y) return x - y;
            }
            return 0;
        }

        function closeUpdateModal(el, markSeen) {
            if (!el || !el.isConnected) return;
            el.classList.add('out');
            el.style.opacity = '0';
            setTimeout(() => { try { el.remove(); } catch (e) {} }, 200);
            if (markSeen) {
                try { localStorage.setItem(LS_VER, VERSION); } catch (e) {}
            }
        }

        function showWhatsNew(opts) {
            opts = opts || {};
            const force = !!opts.force;
            const remote = opts.remote || null; // { version, url }
            let seen = '';
            try { seen = localStorage.getItem(LS_VER) || ''; } catch (e) {}
            if (!force && !remote && seen === VERSION) return false;
            if (document.getElementById('pvx-upd')) return false;

            const overlay = document.createElement('div');
            overlay.id = 'pvx-upd';
            overlay.className = 'pvx-upd-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-label', 'Siphon Studio update');

            const isRemote = !!(remote && remote.version && cmpVer(remote.version, VERSION) > 0);
            const kicker = isRemote ? 'Update available' : (seen && seen !== VERSION ? 'You just updated' : 'Welcome');
            const title = isRemote
                ? `Siphon Studio ${esc(remote.version)} is out`
                : `Siphon Studio ${esc(VERSION)}`;
            const sub = isRemote
                ? `You are still on ${esc(VERSION)}. Install the new userscript to get the fixes below.`
                : (seen && seen !== VERSION
                    ? `Upgraded from ${esc(seen)} → ${esc(VERSION)}. Here is everything that landed.`
                    : `Fresh install detected. Here is what this build includes.`);

            let bodyHtml = '';
            if (isRemote) {
                bodyHtml += `<div class="pvx-upd-note"><b>Action needed.</b> Tampermonkey will not auto-replace a local paste. Open the repo, copy the new <code>SiphonStudio.user.js</code>, and overwrite your existing script — then refresh Pianoverse.</div>`;
            } else {
                bodyHtml += `<div class="pvx-upd-note"><b>Install check.</b> If you still see the old UI after “updating,” Tampermonkey is running a previous copy. Disable older Siphon / PVX scripts, keep only this one, then hard-refresh.</div>`;
            }

            const sections = isRemote
                ? CHANGELOG.filter((c) => cmpVer(c.ver, VERSION) > 0 || c.ver === remote.version).slice(0, 4)
                : CHANGELOG.filter((c) => !seen || cmpVer(c.ver, seen) > 0 || c.ver === VERSION);
            const list = sections.length ? sections : CHANGELOG.slice(0, 2);
            for (const sec of list) {
                bodyHtml += `<div class="pvx-upd-sec"><h3>v${esc(sec.ver)} — ${esc(sec.title)}</h3><ul>`;
                for (const item of sec.items) bodyHtml += `<li>${item}</li>`;
                bodyHtml += `</ul></div>`;
            }

            const primaryLabel = isRemote ? 'Open download' : 'Got it — continue';
            const secondary = isRemote
                ? `<button type="button" class="pvx-upd-btn ghost" data-act="dismiss">Remind me later</button>`
                : `<button type="button" class="pvx-upd-btn ghost" data-act="dismiss">Close</button>`;

            overlay.innerHTML = `
<div class="pvx-upd-card">
  <div class="pvx-upd-head">
    <img class="pvx-upd-logo" alt="" src="${SIPHON_LOGO}" />
    <div class="pvx-upd-head-txt">
      <div class="pvx-upd-kicker">${kicker}</div>
      <h2 class="pvx-upd-title">${title}</h2>
      <div class="pvx-upd-sub">${sub}</div>
    </div>
    <button type="button" class="pvx-upd-x" data-act="dismiss" title="Close" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
  </div>
  <div class="pvx-upd-body">${bodyHtml}</div>
  <div class="pvx-upd-foot">
    <div class="pvx-upd-ver">Running <b style="color:#E8E4F5">${esc(VERSION)}</b>${seen ? ` · last seen ${esc(seen)}` : ''}</div>
    <div class="pvx-upd-actions">
      ${secondary}
      <button type="button" class="pvx-upd-btn primary" data-act="primary">${primaryLabel}</button>
    </div>
  </div>
</div>`;

            const onKey = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault(); e.stopPropagation();
                    closeUpdateModal(overlay, !isRemote);
                    document.removeEventListener('keydown', onKey, true);
                }
            };
            document.addEventListener('keydown', onKey, true);

            overlay.addEventListener('click', (e) => {
                const act = e.target && e.target.closest && e.target.closest('[data-act]');
                if (!act) {
                    if (e.target === overlay) closeUpdateModal(overlay, !isRemote);
                    return;
                }
                const a = act.getAttribute('data-act');
                if (a === 'primary') {
                    if (isRemote) {
                        try { PW.open(remote.url || DOWNLOAD_URL, '_blank', 'noopener'); } catch (err) {}
                        closeUpdateModal(overlay, false);
                    } else {
                        closeUpdateModal(overlay, true);
                    }
                } else {
                    closeUpdateModal(overlay, !isRemote);
                }
                document.removeEventListener('keydown', onKey, true);
            });

            document.body.appendChild(overlay);
            return true;
        }

        function normalizeRemoteVer(raw) {
            let t = String(raw || '').replace(/^\uFEFF/, '').trim();
            // allow "v28.5", "28.5\n", "version=28.5"
            const m = t.match(/v?(\d+(?:\.\d+){0,3})/i);
            return m ? m[1] : '';
        }
        function handleRemoteVersionText(text) {
            const ver = normalizeRemoteVer(text);
            if (!ver) return;
            if (cmpVer(ver, VERSION) <= 0) return;
            let lastPrompt = '';
            try { lastPrompt = localStorage.getItem('siphon.remotePrompt') || ''; } catch (e) {}
            // Re-prompt if user never installed that version (compare to local VERSION only)
            if (lastPrompt === ver) return;
            try { localStorage.setItem('siphon.remotePrompt', ver); } catch (e) {}
            showWhatsNew({ remote: { version: ver, url: DOWNLOAD_URL } });
        }
        function checkRemoteUpdate() {
            const urls = [
                UPDATE_CHECK_URL,
                'https://raw.githubusercontent.com/Sil0vgg/SiphonStudio/main/main/VERSION',
                'https://raw.githubusercontent.com/Sil0vgg/SiphonStudio/main/VERSION',
                'https://cdn.jsdelivr.net/gh/Sil0vgg/SiphonStudio@main/main/VERSION',
            ];
            // de-dupe
            const seen = new Set();
            const list = urls.filter((u) => { if (seen.has(u)) return false; seen.add(u); return true; });
            let i = 0;
            const tryNext = () => {
                if (i >= list.length) return;
                const url = list[i++] + (list[i - 1].includes('?') ? '&' : '?') + 't=' + Date.now();
                const done = (body) => {
                    if (body && normalizeRemoteVer(body)) handleRemoteVersionText(body);
                    else tryNext();
                };
                if (typeof GM_xmlhttpRequest === 'function') {
                    try {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url,
                            timeout: 7000,
                            anonymous: true,
                            headers: { 'Cache-Control': 'no-cache' },
                            onload: (res) => {
                                if (res.status && res.status >= 400) { tryNext(); return; }
                                done(res.responseText);
                            },
                            onerror: () => tryNext(),
                            ontimeout: () => tryNext(),
                        });
                        return;
                    } catch (e) { /* fall through */ }
                }
                // fetch fallback (may fail CORS on raw github without GM)
                try {
                    fetch(url, { cache: 'no-store' }).then((r) => r.ok ? r.text() : Promise.reject()).then(done).catch(() => tryNext());
                } catch (e) { tryNext(); }
            };
            tryNext();
        }

        function showSkipNotRecommended(onKeep, onSkipAnyway) {
            const w = document.createElement('div');
            w.className = 'pvx-tut-skip-warn';
            w.innerHTML = `<div class="box">
              <div style="font-weight:650;margin-bottom:8px;color:#E8D7A0">Skip is not recommended</div>
              <div style="font-size:13px;line-height:1.5;color:#b8b5c4;margin-bottom:14px">
                The tour points at the real controls on your player. Skipping means you will not see it again unless you open Tutorial from Settings.
              </div>
              <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
                <button type="button" class="pvx-upd-btn ghost" data-a="keep">Back</button>
                <button type="button" class="pvx-upd-btn warn" data-a="skip">Skip anyway</button>
              </div>
            </div>`;
            w.addEventListener('click', (e) => {
                const a = e.target.closest('[data-a]');
                if (!a) return;
                w.remove();
                if (a.getAttribute('data-a') === 'skip') onSkipAnyway();
                else onKeep();
            });
            document.body.appendChild(w);
        }

        function showTutorial(opts) {
            opts = opts || {};
            const force = !!opts.force;
            let done = false;
            try { done = localStorage.getItem(LS_TUT) === '1'; } catch (e) {}
            if (!force && done) return false;
            if (document.getElementById('pvx-tour')) return false;

            // Ensure studio visible for the tour
            try { showWindow(); root.classList.remove('pvx-min'); applyWindow(); } catch (e) {}

            const steps = [
                {
                    sel: () => root.querySelector('.pvx-head') || root,
                    title: 'Studio window',
                    body: 'This floating panel is Siphon Studio. Drag the header to move it. You load MIDI, pick an output, and control playback here.',
                },
                {
                    sel: () => root.querySelector('[data-r="play"]'),
                    title: 'Play / Pause',
                    body: 'Starts or pauses the loaded MIDI. Shortcut: Alt+P. Notes are sent to the MIDI output you select below.',
                },
                {
                    sel: () => root.querySelector('[data-r="stop"]') || root.querySelector('[data-r="back"]'),
                    title: 'Transport',
                    body: 'Stop, rewind, and fast-forward sit next to play. Alt+S stops. Seek also works from the timeline under the keyboard view.',
                },
                {
                    sel: () => root.querySelector('[data-r="port"]') || root.querySelector('select'),
                    title: 'MIDI output',
                    body: 'Choose the port that loops into Pianoverse (a virtual cable or the site’s input). Without this, room play is silent.',
                },
                {
                    sel: () => root.querySelector('[data-r="file"]') || root.querySelector('[data-r="lib"]') || root.querySelector('[data-r="open"]'),
                    title: 'Load MIDI',
                    body: 'Open a .mid file or use the library drawer. Library also searches BitMidi and other sources when configured.',
                },
                {
                    sel: () => root.querySelector('[data-r="set"]') || root.querySelector('[data-r="settings"]') || root.querySelector('.pvx-head [title*="Settings"]'),
                    title: 'Settings',
                    body: 'Humanize, density limiter, themes, presence tags, performance, and site overrides all live here. Open it when you want fine control.',
                    openSettings: true,
                },
                {
                    sel: () => document.getElementById('pvx-hdr-toggles') || document.getElementById('pvx-fps'),
                    title: 'Header toggles',
                    body: 'On the Pianoverse header: Skin, Perf, Freeze, Cursor, Black. Black is the nuclear mode for dense MIDI. Cursor shows your server-cursor mirror.',
                },
                {
                    sel: () => root.querySelector('[data-r="title"]') || root.querySelector('.pvx-title'),
                    title: 'You are ready',
                    body: 'Load a MIDI, set the output, hit play. Use Black if the tab struggles. Replay this tour anytime from Settings → Tutorial.',
                },
            ];

            let step = 0;
            const layer = document.createElement('div');
            layer.id = 'pvx-tour';
            layer.innerHTML = `<div class="shade"></div><div class="ring"></div><div class="tip"></div>`;
            document.body.appendChild(layer);
            const shade = layer.querySelector('.shade');
            const ring = layer.querySelector('.ring');
            const tip = layer.querySelector('.tip');

            const clearHighlight = () => {
                document.querySelectorAll('.pvx-tour-hl').forEach((el) => {
                    el.classList.remove('pvx-tour-hl');
                    el.style.outline = '';
                    el.style.position = el.dataset.pvxPos || '';
                    el.style.zIndex = el.dataset.pvxZ || '';
                });
            };

            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                clearHighlight();
                try { window.removeEventListener('resize', place); } catch (e) {}
                try { localStorage.setItem(LS_TUT, '1'); } catch (e) {}
                layer.remove();
            };

            const place = () => {
                clearHighlight();
                const s = steps[step];
                if (s.openSettings) {
                    try {
                        const set = root.querySelector('.pvx-set');
                        if (set) set.classList.add('open');
                    } catch (e) {}
                } else {
                    try {
                        const set = root.querySelector('.pvx-set');
                        if (set) set.classList.remove('open');
                    } catch (e) {}
                }
                let el = null;
                try { el = s.sel(); } catch (e) {}
                if (!el || !el.getBoundingClientRect) el = root;
                const r = el.getBoundingClientRect();
                const pad = 8;
                const top = Math.max(4, r.top - pad);
                const left = Math.max(4, r.left - pad);
                const width = Math.min(window.innerWidth - left - 4, r.width + pad * 2);
                const height = Math.min(window.innerHeight - top - 4, r.height + pad * 2);

                // spotlight via box-shadow hole on ring; shade full screen
                ring.style.left = left + 'px';
                ring.style.top = top + 'px';
                ring.style.width = Math.max(40, width) + 'px';
                ring.style.height = Math.max(28, height) + 'px';
                shade.style.background = 'rgba(0,0,0,.6)';
                // clip path polygon hole
                const x0 = left, y0 = top, x1 = left + width, y1 = top + height;
                shade.style.clipPath = `polygon(0% 0%, 0% 100%, ${x0}px 100%, ${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px, ${x0}px 100%, 100% 100%, 100% 0%)`;

                try {
                    el.classList.add('pvx-tour-hl');
                    el.dataset.pvxZ = el.style.zIndex || '';
                    el.style.zIndex = '2147483647';
                    el.style.outline = '2px solid rgba(184,166,232,.9)';
                } catch (e) {}

                const isLast = step >= steps.length - 1;
                tip.innerHTML = `<div class="stepn">${step + 1} / ${steps.length}</div>
                  <h3>${s.title}</h3>
                  <p>${s.body}</p>
                  <div class="nav">
                    <button type="button" class="s" data-a="skip">Skip</button>
                    <button type="button" class="g" data-a="back" ${step === 0 ? 'disabled' : ''}>Back</button>
                    <button type="button" class="p" data-a="next">${isLast ? 'Done' : 'Next'}</button>
                  </div>`;

                // Position tip near target
                tip.style.visibility = 'hidden';
                tip.style.left = '0px';
                tip.style.top = '0px';
                const tw = tip.offsetWidth || 280;
                const th = tip.offsetHeight || 120;
                let tx = left;
                let ty = top + height + 12;
                if (ty + th > window.innerHeight - 8) ty = Math.max(8, top - th - 12);
                if (tx + tw > window.innerWidth - 8) tx = Math.max(8, window.innerWidth - tw - 8);
                if (tx < 8) tx = 8;
                tip.style.left = tx + 'px';
                tip.style.top = ty + 'px';
                tip.style.visibility = 'visible';
            };

            tip.addEventListener('click', (e) => {
                const a = e.target.closest('[data-a]');
                if (!a) return;
                const act = a.getAttribute('data-a');
                if (act === 'next') {
                    if (step >= steps.length - 1) finish();
                    else { step++; place(); }
                } else if (act === 'back') {
                    if (step > 0) { step--; place(); }
                } else if (act === 'skip') {
                    showSkipNotRecommended(() => {}, finish);
                }
            });

            window.addEventListener('resize', place);

            place();
            return true;
        }

        function runUpdateGate() {
            // Local upgrade / first run
            const shown = showWhatsNew({ force: false });
            // Tutorial after changelog (or immediately if no changelog)
            setTimeout(() => {
                try { showTutorial({ force: false }); } catch (e) {}
            }, shown ? 600 : 400);
            // Remote version probe — several mirrors; fixed parser accepts v28.5 etc.
            setTimeout(checkRemoteUpdate, shown ? 4000 : 1500);
        }

        PW.siphonStudio = PW.pvxMidiStudio = {
            version: VERSION, show: showWindow, hide: hideWindow, destroy, unload: unloadSong, library: toggleDrawer, panic, whatsNew: () => showWhatsNew({ force: true }), tutorial: () => showTutorial({ force: true }), checkUpdate: () => checkRemoteUpdate(),
            record: { start: recStart, toggle: toggleRecord },
            live: { clear: liveClear }, settings: () => S,
        };

        // Concert UI unlock + anti-AFK helpers (must exist before boot calls them)
        let concertUnlockTimer = 0, antiAfkTimer = 0;
        function unlockConcertKeys() {
            if (!(S.skin && S.skin.bypassConcert)) return;
            try {
                document.querySelectorAll('pv-keys [data-key].disabled').forEach((k) => k.classList.remove('disabled'));
            } catch (e) {}
        }
        function startSkinBypasses() {
            clearInterval(concertUnlockTimer);
            clearInterval(antiAfkTimer);
            concertUnlockTimer = setInterval(unlockConcertKeys, 1500);
            antiAfkTimer = setInterval(() => {
                if (!(S.skin && S.skin.antiAfk) || !playGate.playing) return;
                if (S.skin.freezeCursor) return;
            }, 25000);
            try { bus.on('room', unlockConcertKeys); } catch (e) {}
            unlockConcertKeys();
        }

        /* boot */
        if (S.ui.startMin) S.win.min = true;
        bootStep(40, 'Building interface'); buildSettings();
        renderTracks();
        updateInfo();
        applyAll();
        updateStatus();
        updateRecUI();
        bootStep(68, 'Connecting MIDI'); initMidi();
        bootStep(88, 'Hooking piano keys'); startKeyObserver();
        requestRender();
        setTimeout(() => { applyWindow(); resizeCanvas(); dockLayout(); applyKeyLabels(); }, 50);
        // Brand only after the site has had time to finish joining the room
        setTimeout(brandSite, 1500);
        setTimeout(brandSite, 4000);
        setTimeout(brandSite, 8000);
        setTimeout(applyKeyLabels, 1500);
        // Changelog / update gate — after the room finishes joining
        setTimeout(runUpdateGate, 1800);
        bootDone();
        try { startSkinBypasses(); } catch (e) { console.warn('[Siphon] skin bypasses', e); }
        try { if (R.title && !song) R.title.textContent = appTitle(); } catch (e) {}
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startUI, { once: true });
    else startUI();
})();
