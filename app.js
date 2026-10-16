(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const PREFIX = "succ-type:";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) {} },
  };
  const ENDPOINT = (window.GARDEN_ENDPOINT || "").trim();

  const TOUCH = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  window.TOUCH_UI = TOUCH;
  document.documentElement.classList.add(TOUCH ? "touch-ui" : "desk-ui");

  const stageEl = $("render-stage");
  const inputEl = $("succulent-input");

  if (TOUCH && inputEl) {
    inputEl.readOnly = true;
    inputEl.setAttribute("inputmode", "none");
    inputEl.tabIndex = -1;
  }

  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 3;
  const clampMul = (m) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number(m) || 1));
  let gardenZoomMul = 1;
  let userZoom = clampMul(store.get("zoom", 1));
  let gardenActive = false;
  const zoomMul = () => (gardenActive ? gardenZoomMul : userZoom);
  function baseZoom() {
    const w = window.innerWidth;
    if (w >= 820) return 1;
    return Math.max(0.4, Math.min(1, w / 900));
  }
  function applyZoom(z, keepCenter = true) {
    const old = window.VIEW_ZOOM || 1;
    const cx = (window.scrollX + window.innerWidth / 2) / old;
    const cy = (window.scrollY + window.innerHeight / 2) / old;
    window.VIEW_ZOOM = z;
    stageEl.style.zoom = String(z);
    stageEl.style.setProperty("--inv-zoom", String(1 / z));
    if (keepCenter) window.scrollTo(cx * z - window.innerWidth / 2, cy * z - window.innerHeight / 2);
  }

  function zoomAround(mul, fromX, fromY, toX, toY) {
    const old = window.VIEW_ZOOM || 1;
    const sx = (window.scrollX + fromX) / old;
    const sy = (window.scrollY + fromY) / old;
    const z = baseZoom() * mul;
    window.VIEW_ZOOM = z;
    stageEl.style.zoom = String(z);
    stageEl.style.setProperty("--inv-zoom", String(1 / z));
    window.scrollTo(sx * z - toX, sy * z - toY);
  }

  function setupPinch() {
    let pinch = null;
    let raf = null;
    let latest = null;
    const blocked = (t) => t.closest && t.closest("#ui-layer, #top-bar, #garden-dock, .app-overlay, #growth-map-panel, #receipt-panel");
    const mid = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;

    document.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 2 || blocked(e.target)) return;
      e.preventDefault();
      const [a, b] = e.touches;
      const m = mid(a, b);
      pinch = { d0: dist(a, b), mul0: zoomMul(), x: m.x, y: m.y };
      cameraLocked = true;
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
      if (!pinch) return;
      e.preventDefault();
      if (e.touches.length < 2) return;
      const [a, b] = e.touches;
      latest = { ratio: dist(a, b) / pinch.d0, m: mid(a, b) };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (!pinch || !latest) return;
        const mul = clampMul(pinch.mul0 * latest.ratio);
        zoomAround(mul, pinch.x, pinch.y, latest.m.x, latest.m.y);
        pinch.x = latest.m.x;
        pinch.y = latest.m.y;
        if (gardenActive) gardenZoomMul = mul; else userZoom = mul;
      });
    }, { passive: false });

    const end = (e) => {
      if (!pinch || e.touches.length >= 2) return;
      pinch = null;
      latest = null;
      cameraLocked = false;
      if (!gardenActive) store.set("zoom", userZoom);
    };
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", end);

    ["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
      document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  }

  if (stageEl) applyZoom(baseZoom() * userZoom, false);

  let gardenEntriesShown = [];
  let gardenRenderToken = 0;
  let ownSequenceBackup = "";
  let kbdCollapsed = false;

  const fullSequence = () => committedSequence + currentInputSnapshot;
  const visibleText = (seq) => seq.replace(/\n/g, "");

  const scrim = $("scrim");
  const overlays = ["drawer", "about", "send-sheet", "garden-list"].map($).filter(Boolean);

  function openOverlay(el) {
    overlays.forEach((o) => { if (o !== el) closeOverlay(o, true); });
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("overlay-open");
    if (el.id === "drawer" || el.id === "garden-list") scrim.hidden = false;
    if (el.id === "drawer") { $("menu-btn").setAttribute("aria-expanded", "true"); syncDrawer(); }
  }
  function closeOverlay(el, silent = false) {
    if (!el || !el.classList.contains("open")) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    if (el.id === "drawer") $("menu-btn").setAttribute("aria-expanded", "false");
    if (!overlays.some((o) => o.classList.contains("open"))) {
      document.body.classList.remove("overlay-open");
      scrim.hidden = true;
      if (!silent && !TOUCH && !gardenActive && inputEl) inputEl.focus({ preventScroll: true });
    }
  }
  overlays.forEach((o) => {
    o.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeOverlay(o)));
    if (o.classList.contains("modal")) {
      o.addEventListener("click", (e) => { if (e.target === o) closeOverlay(o); });
    }
  });
  scrim.addEventListener("click", () => overlays.forEach((o) => closeOverlay(o)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlays.forEach((o) => closeOverlay(o));
  });

  let toastTimer = null;

  const bi = (ja, ko) => `${ja}<span class="ko">${ko}</span>`;

  function syncXrayBar() {
    const b = document.getElementById("xray-bar-btn");
    if (b) b.setAttribute("aria-pressed", String(document.body.classList.contains("xray-active")));
  }

  function toast(msg, ms = 2600) {
    const t = $("toast");
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }
  let lastLatinWarn = 0;
  window.onNonLatinInput = () => {
    const now = Date.now();
    if (now - lastLatinWarn < 4000) return;
    lastLatinWarn = now;
    toast(bi("英字キーボード（A〜Z）に切り替えて入力してください", "영문 키보드(A~Z)로 바꿔서 입력해 주세요"));
  };

  $("menu-btn").addEventListener("click", () => {
    const d = $("drawer");
    d.classList.contains("open") ? closeOverlay(d) : openOverlay(d);
  });

  const clickCore = (id) => { const b = $(id); if (b) b.click(); };
  const ACTIONS = {
    about: () => openOverlay($("about")),
    garden: () => { closeOverlay($("drawer"), true); gardenActive ? exitGarden() : enterGarden(); },
    send: () => openSend(),
    map: () => { closeOverlay($("drawer"), true); clickCore("growth-map-btn"); },
    xray: () => { clickCore("growth-xray-btn"); syncDrawer(); },
    coord: () => { clickCore("coord-toggle"); syncDrawer(); },
    receipt: () => { closeOverlay($("drawer"), true); clickCore("receipt-btn"); },
    save: () => { closeOverlay($("drawer"), true); toast(bi("画像をつくっています… 少しお待ちください", "이미지를 만들고 있어요… 잠시만 기다려 주세요"), 3500); clickCore("save-btn"); },
    sound: () => { setMuted(!window.SOUND_MUTED); syncDrawer(); },
    reset: () => resetSoil(),
  };
  $("drawer").querySelectorAll("[data-act]").forEach((b) => {
    b.addEventListener("click", () => ACTIONS[b.dataset.act] && ACTIONS[b.dataset.act]());
  });

  function syncDrawer() {
    const set = (act, on, label) => {
      const b = $("drawer").querySelector(`[data-act="${act}"]`);
      if (!b) return;
      b.classList.toggle("on", !!on);
      if (label) b.innerHTML = label;
    };
    set("xray", document.body.classList.contains("xray-active"));
    syncXrayBar();
    set("coord", $("coord-layer") && $("coord-layer").classList.contains("show"));
    set("map", $("growth-map-panel").classList.contains("show"));
    set("sound", false, window.SOUND_MUTED ? bi("音を出す", "소리 켜기") : bi("音を消す", "소리 끄기"));
    set("garden", gardenActive, gardenActive ? bi("自分の多肉へ戻る", "내 다육이로 돌아가기") : bi("みんなの庭", "모두의 정원"));
  }

  function setMuted(m) {
    window.SOUND_MUTED = m;
    store.set("muted", m);
    try {
      if (typeof audioCtx !== "undefined" && audioCtx) {
        if (m) audioCtx.suspend(); else audioCtx.resume();
      }
    } catch (e) {}
    if (!m && typeof ensureAudioStarted === "function") ensureAudioStarted();
  }
  window.SOUND_MUTED = store.get("muted", false);

  const ROWS = {
    abc: [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Z", "X", "C", "V", "B", "N", "M", "⌫"],
      ["123", "↵"],
    ],
    num: [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["?", "+", "!", ".", "\""],
      ["@", "*", "&", "%", "⌫"],
      ["ABC", "↵"],
    ],
  };
  let kbdPage = "abc";

  function buildKeyboard() {
    const kbd = $("kbd");
    kbd.innerHTML = "";
    ROWS[kbdPage].forEach((row) => {
      const r = document.createElement("div");
      r.className = "kbd-row";
      row.forEach((k) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "key";
        b.dataset.key = k;
        if (k === "⌫") { b.classList.add("key-fn", "key-back"); b.setAttribute("aria-label", "消す / 지우기"); }
        else if (k === "↵") { b.classList.add("key-fn", "key-enter"); b.innerHTML = bi("改行 ↵", "줄바꿈"); b.setAttribute("aria-label", "改行 / 줄바꿈"); }
        else if (k === "123" || k === "ABC") { b.classList.add("key-fn", "key-page"); }
        if (!b.textContent) b.textContent = k;
        r.appendChild(b);
      });
      kbd.appendChild(r);
    });
  }

  let repeatTimer = null;
  let repeatInterval = null;
  function stopRepeat() {
    clearTimeout(repeatTimer);
    clearInterval(repeatInterval);
    repeatTimer = repeatInterval = null;
  }

  function onKeyDown(e) {
    const btn = e.target.closest(".key");
    if (!btn) return;
    e.preventDefault();
    const k = btn.dataset.key;
    btn.classList.add("pressed");
    if (k === "123" || k === "ABC") {
      kbdPage = k === "123" ? "num" : "abc";
      buildKeyboard();
      return;
    }
    pressKey(k);
    if (k === "⌫") {
      repeatTimer = setTimeout(() => {
        repeatInterval = setInterval(() => pressKey("⌫"), 70);
      }, 420);
    }
  }
  function onKeyUp(e) {
    stopRepeat();
    document.querySelectorAll(".key.pressed").forEach((b) => b.classList.remove("pressed"));
  }

  function pressKey(k) {
    if (gardenActive || !inputEl) return;
    if (k === "⌫") return backspace();
    if (k === "↵") return newLine();
    inputEl.value = normalizeInput(inputEl.value) + k;
    handleInput({ target: inputEl, isComposing: false });
  }

  function newLine() {
    handleKeydown({ key: "Enter", keyCode: 13, preventDefault() {} });
  }

  function backspace() {
    const now = normalizeInput(inputEl.value);
    if (currentInputSnapshot === "" && committedSequence.endsWith("\n")) {
      const c = committedSequence.slice(0, -1);
      committedSequence = c.slice(0, c.lastIndexOf("\n") + 1);
      currentInputSnapshot = now.slice(visibleText(committedSequence).length);
      requestRebuild();
      updateDataLog(0, 90, false);
      return;
    }
    if (!now.length) return;
    inputEl.value = now.slice(0, -1);
    handleInput({ target: inputEl, isComposing: false });
  }

  function onHardwareKey(e) {
    if (!TOUCH || gardenActive || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement !== inputEl) return;
    if (document.body.classList.contains("overlay-open")) return;
    if (e.key === "Backspace") { e.preventDefault(); backspace(); }
    else if (e.key === "Enter") { e.preventDefault(); newLine(); }
    else if (e.key.length === 1) {
      const c = normalizeInput(e.key);
      if (c) { e.preventDefault(); pressKey(c); }
    }
  }

  function setKbdCollapsed(c) {
    kbdCollapsed = c;
    document.body.classList.toggle("kbd-collapsed", c);
    $("kbd-toggle").innerHTML = c ? bi("キーボードを開く", "키보드 열기") : bi("キーボードを閉じる", "키보드 닫기");
    $("kbd-toggle").setAttribute("aria-label", c ? "キーボードを開く / 키보드 열기" : "キーボードを閉じる / 키보드 닫기");
    requestAnimationFrame(updateInsets);
  }

  function renderDisplay() {
    const d = $("type-display");
    if (!d) return;
    const seq = fullSequence();
    d.innerHTML = "";
    if (!visibleText(seq)) {
      const ph = document.createElement("span");
      ph.className = "ph";
      ph.innerHTML = bi("A〜Zを押して植えてみてください", "A~Z를 눌러 심어 보세요");
      d.appendChild(ph);
    } else {
      const lines = seq.split("\n");
      lines.forEach((line, i) => {
        if (i > 0) {
          const br = document.createElement("span");
          br.className = "br";
          br.textContent = "/";
          d.appendChild(br);
        }
        if (line) {
          const s = document.createElement("span");
          s.textContent = line;
          d.appendChild(s);
        }
      });
    }
    const caret = document.createElement("span");
    caret.className = "caret";
    d.appendChild(caret);
    d.scrollLeft = d.scrollWidth;
  }

  function updateSendState() {
    const has = !!visibleText(fullSequence());
    $("send-btn").disabled = !has || gardenActive;
  }

  let saveTimer = null;
  window.onSequenceChange = () => {
    if (gardenActive) return;
    renderDisplay();
    updateSendState();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      store.set("plant", { committed: committedSequence, current: currentInputSnapshot, t: Date.now() });
    }, 250);
  };

  function restoreOwnPlant(seqOverride) {
    let committed = "";
    let current = "";
    if (typeof seqOverride === "string") {
      const i = seqOverride.lastIndexOf("\n");
      committed = seqOverride.slice(0, i + 1);
      current = seqOverride.slice(i + 1);
    } else {
      const saved = store.get("plant", null);
      if (!saved || typeof saved.committed !== "string") return false;
      committed = saved.committed;
      current = saved.current || "";
    }
    committedSequence = committed;
    currentInputSnapshot = current;
    const seq = committed + current;
    inputEl.value = visibleText(seq);
    lastVisualSequence = seq;
    animatedTokenIndex = -1;
    rebuildFromSequence(seq);
    if (!visibleText(seq)) moveCamera(START_X, START_Y, "auto");
    renderDisplay();
    updateSendState();
    return !!visibleText(seq);
  }

  function resetSoil() {
    if (!window.confirm("いま育てている多肉をすべて掘り返して、最初から植え直しますか？\n지금 키우고 있는 다육이를 모두 파내고 처음부터 다시 심을까요?")) return;
    closeOverlay($("drawer"), true);
    if (gardenActive) exitGarden(true);
    store.del("plant");
    restoreOwnPlant("");
    updateDataLog(0, 90, false);
    toast(bi("土を掘り返しました", "흙을 파냈어요"));
  }

  function previewHTML(seq) {
    return seq
      .split("\n")
      .filter((l) => l)
      .map((l) => `<span>${l.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))}</span>`)
      .join('<span class="br">/</span>');
  }

  function openSend() {
    if (gardenActive) { toast(bi("自分の多肉に戻ってから植えられます", "내 다육이로 돌아간 뒤에 심을 수 있어요")); return; }
    const seq = fullSequence();
    if (!visibleText(seq)) { toast(bi("まず文字を打って、多肉を育ててください", "먼저 글자를 쳐서 다육이를 키워 주세요")); return; }
    $("send-preview").innerHTML = previewHTML(seq);
    $("send-name").value = store.get("name", "");
    $("send-status").textContent = "";
    $("send-status").className = "";
    const btn = $("send-confirm");
    btn.disabled = false;
    btn.innerHTML = bi("植える", "심기");
    btn.dataset.mode = "send";
    openOverlay($("send-sheet"));
  }

  function fetchWithTimeout(url, opts = {}, ms = 15000) {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
    return fetch(url, Object.assign({}, opts, ctrl ? { signal: ctrl.signal } : {}))
      .finally(() => timer && clearTimeout(timer));
  }

  async function submitPlant() {
    const btn = $("send-confirm");
    if (btn.dataset.mode === "goto") { closeOverlay($("send-sheet"), true); enterGarden(); return; }

    const text = fullSequence().replace(/^\n+|\n+$/g, "").replace(/\n{2,}/g, "\n").slice(0, 240);
    if (!visibleText(text)) return;
    const name = $("send-name").value.trim().slice(0, 20);
    store.set("name", name);
    const entry = { text, name, t: Date.now() };

    const status = $("send-status");
    btn.disabled = true;
    btn.innerHTML = bi("植えています…", "심는 중…");
    status.className = "";
    status.textContent = "";

    let ok = false;
    if (!ENDPOINT) {
      const local = store.get("local-garden", []);
      local.push(Object.assign({ id: "local-" + entry.t }, entry));
      store.set("local-garden", local.slice(-200));
      ok = true;
    } else {
      try {
        const res = await fetchWithTimeout(ENDPOINT, { method: "POST", body: JSON.stringify(entry) });
        const data = await res.json().catch(() => ({ ok: res.ok }));
        ok = !!data.ok;
        if (ok) {
          const cache = store.get("garden-cache", []);
          cache.push(Object.assign({ id: data.id || "me-" + entry.t }, entry));
          store.set("garden-cache", cache.slice(-300));
        }
      } catch (err) {
        if (err && err.name === "TypeError") {
          try {
            await fetchWithTimeout(ENDPOINT, { method: "POST", mode: "no-cors", body: JSON.stringify(entry) });
            ok = true;
          } catch (e2) { ok = false; }
        }
      }
    }

    btn.disabled = false;
    if (ok) {
      store.set("last-sent", entry.t);
      status.className = "ok";
      status.textContent = ENDPOINT
        ? bi("庭に植えました。", "정원에 심었어요.")
        : bi("練習モードのため、この端末にだけ植えました。（config.js にシートのURLを入れると、みんなに表示されます）", "연습 모드라서 이 기기에만 심었어요. (config.js에 시트 URL을 넣으면 모두에게 보여요)");
      btn.innerHTML = bi("庭を見にいく", "정원 보러 가기");
      btn.dataset.mode = "goto";
    } else {
      status.className = "err";
      status.innerHTML = bi("送信できませんでした。インターネット接続を確認して、もう一度押してください。", "보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      btn.innerHTML = bi("もう一度植える", "다시 심기");
    }
  }

  const GARDEN_LIMIT = {
    lines: 80,
    chars: TOUCH ? 600 : 1400,
    perEntryChars: 80,
    perEntryLines: 4,
  };

  function cleanEntryText(text) {
    const lines = String(text || "")
      .split(/\n|\//)
      .map((l) => normalizeInput(l))
      .filter(Boolean)
      .slice(0, GARDEN_LIMIT.perEntryLines);
    let total = 0;
    const out = [];
    for (const l of lines) {
      if (total >= GARDEN_LIMIT.perEntryChars) break;
      const cut = l.slice(0, GARDEN_LIMIT.perEntryChars - total);
      out.push(cut);
      total += cut.length;
    }
    return out.join("\n");
  }

  function pickEntries(all) {
    const picked = [];
    let lines = 0;
    let chars = 0;
    for (let i = all.length - 1; i >= 0; i--) {
      const text = cleanEntryText(all[i].text);
      if (!text) continue;
      const l = text.split("\n").length;
      const c = visibleText(text).length;
      if (picked.length && (lines + l > GARDEN_LIMIT.lines || chars + c > GARDEN_LIMIT.chars)) break;
      picked.push(Object.assign({}, all[i], { text }));
      lines += l;
      chars += c;
    }
    return picked.reverse();
  }

  function setGardenNote(msg) {
    const n = $("garden-note");
    if (!msg) { n.hidden = true; n.innerHTML = ""; return; }
    n.hidden = false;
    n.innerHTML = msg;
  }

  function clearGardenTags() {
    stageEl.querySelectorAll(".garden-tag").forEach((el) => el.remove());
  }

  function renderGarden(entries) {
    const token = ++gardenRenderToken;
    const picked = pickEntries(entries);
    gardenEntriesShown = [];

    clearGardenTags();
    resetRuntimeState();
    lastVisualSequence = "";

    $("garden-count").innerHTML = picked.length ? bi(`${picked.length}株`, `${picked.length}포기`) : "";
    if (!picked.length) {
      setGardenNote(
        `まだ植えられた多肉はありません。<br>自分の多肉に戻って<b>庭に植える</b>を押し、最初の一株を植えてみてください。` +
        `<span class="ko-b">아직 심어진 다육이가 없어요. 내 다육이로 돌아가 <b>정원에 심기</b>를 눌러 첫 포기를 심어 보세요.</span>` +
        (ENDPOINT ? "" : `<small>練習モード — config.js にシートのURLを入れると、みんなの多肉が集まります。<span class="ko-b">연습 모드 — config.js에 시트 URL을 넣으면 모두의 다육이가 모여요.</span></small>`)
      );
      renderGardenList();
      return;
    }
    setGardenNote(ENDPOINT ? "" : `<small>練習モード — この端末で植えたものだけが表示されます。config.js にシートのURLを入れると、みんなの多肉が集まります。<span class="ko-b">연습 모드 — 이 기기에서 심은 것만 보여요. config.js에 시트 URL을 넣으면 모두의 다육이가 모여요.</span></small>`);

    let seq = "";
    let lineIdx = 0;
    picked.forEach((e, i) => {
      if (i > 0) { seq += "\n"; lineIdx += 1; }
      e.line = lineIdx;
      e.x = START_X + lineIdx * LINE_GAP_X;
      seq += e.text;
      lineIdx += e.text.split("\n").length - 1;
      gardenEntriesShown.push(e);
      addGardenTag(e);
    });

    renderGardenList();

    cameraLocked = true;
    const CHUNK = TOUCH ? 10 : 28;
    let i = 0;
    const lastEntry = gardenEntriesShown[gardenEntriesShown.length - 1];
    focusGardenEntry(lastEntry, true);
    const step = () => {
      if (token !== gardenRenderToken || !gardenActive) return;
      const end = Math.min(seq.length, i + CHUNK);
      for (; i < end; i++) {
        const t = seq[i];
        if (t === "\n") processLineBreak(true);
        else processCharacter(t, true);
      }
      if (i < seq.length) {
        requestAnimationFrame(step);
      } else {
        lastVisualSequence = seq;
        if (document.body.classList.contains("xray-active")) drawGlobalGrowthBranch();
        cameraLocked = false;
      }
    };
    requestAnimationFrame(step);
  }

  function addGardenTag(e) {
    const tag = document.createElement("div");
    tag.className = "garden-tag";
    tag.style.left = `${e.x}px`;
    tag.style.top = `${START_Y + 260}px`;
    const n = document.createElement("span");
    n.className = "who";
    n.textContent = e.name || "名前なし · 이름 없음";
    const t = document.createElement("span");
    t.className = "what";
    t.textContent = e.text.replace(/\n/g, " / ");
    tag.append(n, t);
    stageEl.appendChild(tag);
  }

  function focusGardenEntry(e, instant) {
    if (!e) return;
    const was = cameraLocked;
    cameraLocked = false;
    moveCamera(e.x + 120, START_Y - 260, instant ? "auto" : "smooth");
    cameraLocked = was;
  }

  function timeAgo(t) {
    const d = (Date.now() - new Date(t).getTime()) / 1000;
    if (!isFinite(d)) return "";
    if (d < 60) return "たった今 · 방금";
    if (d < 3600) return `${Math.floor(d / 60)}分前 · ${Math.floor(d / 60)}분 전`;
    if (d < 86400) return `${Math.floor(d / 3600)}時間前 · ${Math.floor(d / 3600)}시간 전`;
    return `${Math.floor(d / 86400)}日前 · ${Math.floor(d / 86400)}일 전`;
  }

  function renderGardenList() {
    const ul = $("garden-list-items");
    ul.innerHTML = "";
    if (!gardenEntriesShown.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.innerHTML = bi("まだ誰も植えていません。", "아직 아무도 심지 않았어요.");
      ul.appendChild(li);
      return;
    }
    [...gardenEntriesShown].reverse().forEach((e) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      const who = document.createElement("span");
      who.className = "who";
      who.textContent = e.name || "名前なし · 이름 없음";
      const when = document.createElement("span");
      when.className = "when";
      when.textContent = timeAgo(e.t);
      const what = document.createElement("span");
      what.className = "what";
      what.textContent = e.text.replace(/\n/g, " / ");
      b.append(who, when, what);
      b.addEventListener("click", () => {
        closeOverlay($("garden-list"), true);
        focusGardenEntry(e, false);
      });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  async function loadGardenEntries() {
    if (!ENDPOINT) return store.get("local-garden", []);
    const res = await fetchWithTimeout(`${ENDPOINT}${ENDPOINT.includes("?") ? "&" : "?"}action=list&_=${Date.now()}`, {}, 15000);
    const data = await res.json();
    if (!data || !data.ok || !Array.isArray(data.entries)) throw new Error("bad response");
    store.set("garden-cache", data.entries.slice(-300));
    return data.entries;
  }

  async function refreshGarden(showLoading) {
    if (showLoading) setGardenNote(bi("庭を読み込んでいます…", "정원을 불러오는 중…"));
    try {
      const entries = await loadGardenEntries();
      if (!gardenActive) return;
      const sig = JSON.stringify(entries.map((e) => e.id || e.t));
      if (sig !== refreshGarden.lastSig) {
        refreshGarden.lastSig = sig;
        renderGarden(entries);
      } else if (showLoading) {
        setGardenNote(ENDPOINT ? "" : $("garden-note").innerHTML);
      }
    } catch (e) {
      if (!gardenActive) return;
      const hasCache = gardenEntriesShown.length > 0;
      setGardenNote(hasCache
        ? "新しい多肉を読み込めなかったため、保存してある庭を表示しています。<b>更新</b>でもう一度試してください。<span class=\"ko-b\">새 다육이를 불러오지 못해서 저장해 둔 정원을 보여 주고 있어요. <b>새로고침</b>으로 다시 시도해 주세요.</span>"
        : "庭を読み込めませんでした。インターネット接続を確認して、<b>更新</b>を押してください。<span class=\"ko-b\">정원을 불러오지 못했어요. 인터넷 연결을 확인하고 <b>새로고침</b>을 눌러 주세요.</span>");
    }
  }
  refreshGarden.lastSig = "";

  function enterGarden() {
    if (gardenActive) return;
    overlays.forEach((o) => closeOverlay(o, true));
    gardenActive = true;
    ownSequenceBackup = fullSequence();
    document.body.classList.add("garden-mode");
    if (inputEl) { inputEl.disabled = true; inputEl.blur(); }
    $("garden-btn").hidden = true;
    $("garden-exit").hidden = false;
    $("garden-title").hidden = false;
    $("garden-dock").hidden = false;
    updateSendState();

    gardenZoomMul = 0.6;
    applyZoom(baseZoom() * gardenZoomMul, false);
    updateInsets();

    const cached = ENDPOINT ? store.get("garden-cache", []) : store.get("local-garden", []);
    refreshGarden.lastSig = JSON.stringify(cached.map((e) => e.id || e.t));
    renderGarden(cached);
    refreshGarden(!cached.length);
    syncDrawer();
  }

  function exitGarden(skipRestore = false) {
    if (!gardenActive) return;
    gardenRenderToken++;
    gardenActive = false;
    cameraLocked = false;
    clearGardenTags();
    setGardenNote("");
    overlays.forEach((o) => closeOverlay(o, true));
    document.body.classList.remove("garden-mode");
    $("garden-btn").hidden = false;
    $("garden-exit").hidden = true;
    $("garden-title").hidden = true;
    $("garden-dock").hidden = true;
    if (inputEl) inputEl.disabled = false;

    applyZoom(baseZoom() * userZoom, false);
    updateInsets();
    if (!skipRestore) restoreOwnPlant(ownSequenceBackup);
    if (!TOUCH && inputEl) inputEl.focus({ preventScroll: true });
    syncDrawer();
  }

  function zoomGarden(f) {
    gardenZoomMul = clampMul(gardenZoomMul * f);
    applyZoom(baseZoom() * gardenZoomMul, true);
  }

  function updateInsets() {
    if (!TOUCH) { window.CAMERA_TOP_INSET = 0; window.CAMERA_BOTTOM_INSET = 0; return; }
    const top = $("top-bar").getBoundingClientRect();
    window.CAMERA_TOP_INSET = Math.round(top.bottom);
    const dockEl = gardenActive ? $("garden-dock") : $("ui-layer");
    const r = dockEl.getBoundingClientRect();
    window.CAMERA_BOTTOM_INSET = Math.max(0, Math.round(window.innerHeight - r.top));
  }

  function wire() {
    if (TOUCH) setupPinch();
    if (TOUCH) {
      buildKeyboard();
      const kbd = $("kbd");
      kbd.addEventListener("pointerdown", onKeyDown);
      ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => kbd.addEventListener(ev, onKeyUp));
      kbd.addEventListener("contextmenu", (e) => e.preventDefault());
      document.addEventListener("keydown", onHardwareKey);
      $("kbd-toggle").addEventListener("click", () => setKbdCollapsed(!kbdCollapsed));
      $("type-display").addEventListener("click", () => { if (kbdCollapsed) setKbdCollapsed(false); });
      if ("ResizeObserver" in window) new ResizeObserver(() => updateInsets()).observe($("ui-layer"));
    }

    $("send-btn").addEventListener("click", openSend);
    $("send-confirm").addEventListener("click", submitPlant);
    $("send-name").addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { e.preventDefault(); submitPlant(); }
    });
    $("garden-btn").addEventListener("click", enterGarden);
    $("garden-exit").addEventListener("click", () => exitGarden());
    $("garden-zoom-in").addEventListener("click", () => zoomGarden(1.25));
    $("garden-zoom-out").addEventListener("click", () => zoomGarden(0.8));
    $("garden-list-btn").addEventListener("click", () => openOverlay($("garden-list")));
    $("garden-refresh").addEventListener("click", () => refreshGarden(true));

    $("xray-bar-btn").addEventListener("click", () => {
      clickCore("growth-xray-btn");
      syncDrawer();
    });

    ["growth-map-close", "growth-map-btn", "growth-xray-btn"].forEach((id) => {
      const b = $(id);
      if (b) b.addEventListener("click", () => setTimeout(syncDrawer, 0));
    });

    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      updateInsets();
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      applyZoom(baseZoom() * zoomMul(), true);
      if (!gardenActive && typeof lastPos !== "undefined") moveCamera(lastPos.x, lastPos.y, "auto");
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && gardenActive) refreshGarden(false);
    });
  }

  function start() {
    if (!stageEl || !inputEl) return;
    wire();
    updateInsets();
    const had = restoreOwnPlant();
    if (!had) {
      renderDisplay();
      updateSendState();
      moveCamera(START_X, START_Y, "auto");
    }
    syncDrawer();

    openOverlay($("about"));
  }

  window.addEventListener("DOMContentLoaded", start);
})();