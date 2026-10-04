// =====================================================================
// app.js — 모바일 화면 / 소개 팝업 / 메뉴 / 화면 자판 / 기기 저장 / 모두의 정원
// script.js(다육이 성장 엔진)는 거의 그대로 두고, 그 위에 얹는 층.
// script.js의 전역 함수·변수(committedSequence, rebuildFromSequence 등)를 그대로 사용함.
// =====================================================================
(() => {
  "use strict";

  // ---------- 작은 도구 ----------
  const $ = (id) => document.getElementById(id);
  const PREFIX = "succ-type:";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) {} },
  };
  const ENDPOINT = (window.GARDEN_ENDPOINT || "").trim();

  // 휴대폰/태블릿(손가락) → 화면 자판 사용. 키보드가 달린 기기는 기존 입력창 그대로.
  const TOUCH = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  window.TOUCH_UI = TOUCH;
  document.documentElement.classList.add(TOUCH ? "touch-ui" : "desk-ui");

  const stageEl = $("render-stage");
  const inputEl = $("succulent-input");

  // 화면 자판에서는 휴대폰 기본 키보드가 뜨지 않게 (입력창은 상태 저장용으로만 사용)
  if (TOUCH && inputEl) {
    inputEl.readOnly = true;
    inputEl.setAttribute("inputmode", "none");
    inputEl.tabIndex = -1;
  }

  // ---------- 화면 배율 ----------
  let gardenZoomMul = 1;
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
  // script.js의 init(첫 카메라 이동)보다 먼저 배율을 정해둠
  if (stageEl) applyZoom(baseZoom(), false);

  // ---------- 상태 ----------
  let gardenActive = false;
  let gardenEntriesShown = [];
  let gardenRenderToken = 0;
  let ownSequenceBackup = "";
  let kbdCollapsed = false;

  const fullSequence = () => committedSequence + currentInputSnapshot;
  const visibleText = (seq) => seq.replace(/\n/g, "");

  // =====================================================================
  // 오버레이(메뉴, 팝업, 시트) 열고 닫기
  // =====================================================================
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

  // ---------- 토스트 ----------
  let toastTimer = null;
  function toast(msg, ms = 2600) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }
  let lastLatinWarn = 0;
  window.onNonLatinInput = () => {
    const now = Date.now();
    if (now - lastLatinWarn < 4000) return;
    lastLatinWarn = now;
    toast("영문 자판(A–Z)으로 바꿔서 입력해 주세요");
  };

  // =====================================================================
  // 메뉴 (옆 목록)
  // =====================================================================
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
    mutant: () => { clickCore("decode-btn"); syncDrawer(); },
    coord: () => { clickCore("coord-toggle"); syncDrawer(); },
    receipt: () => { closeOverlay($("drawer"), true); clickCore("receipt-btn"); },
    save: () => { closeOverlay($("drawer"), true); toast("이미지를 만드는 중… 잠시 기다려 주세요", 3500); clickCore("save-btn"); },
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
      if (label) b.textContent = label;
    };
    set("xray", document.body.classList.contains("xray-active"));
    set("mutant", stageEl.classList.contains("only-mutant-view"));
    set("coord", $("coord-layer") && $("coord-layer").classList.contains("show"));
    set("map", $("growth-map-panel").classList.contains("show"));
    set("sound", false, window.SOUND_MUTED ? "소리 켜기" : "소리 끄기");
    set("garden", gardenActive, gardenActive ? "내 다육이로 돌아가기" : "모두의 정원");
  }

  // ---------- 소리 ----------
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

  // =====================================================================
  // 화면 자판 (휴대폰)
  // =====================================================================
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
        if (k === "⌫") { b.classList.add("key-fn", "key-back"); b.setAttribute("aria-label", "지우기"); }
        else if (k === "↵") { b.classList.add("key-fn", "key-enter"); b.textContent = "줄 바꾸기 ↵"; b.setAttribute("aria-label", "줄 바꾸기"); }
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
    e.preventDefault(); // 포커스 이동·더블탭 확대 방지, 누르는 순간 바로 입력
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
      // 방금 줄을 바꿨다면 줄바꿈부터 되돌림 (앞 줄의 글자는 다시 "현재 줄"이 됨)
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

  // 손가락 자판인데 블루투스 키보드를 연결한 경우도 그대로 칠 수 있게
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
    $("kbd-toggle").textContent = c ? "자판 펴기" : "자판 접기";
    $("kbd-toggle").setAttribute("aria-label", c ? "자판 펴기" : "자판 접기");
    requestAnimationFrame(updateInsets);
  }

  // ---------- 친 글자 표시 (휴대폰) ----------
  function renderDisplay() {
    const d = $("type-display");
    if (!d) return;
    const seq = fullSequence();
    d.innerHTML = "";
    if (!visibleText(seq)) {
      const ph = document.createElement("span");
      ph.className = "ph";
      ph.textContent = "A–Z를 눌러 심어 보세요";
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

  // =====================================================================
  // 기기 안에서만 자라는 다육이 (localStorage에 저장 — 방문 기록을 지우면 탈락)
  // =====================================================================
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
    if (!window.confirm("지금 키우던 다육이를 모두 갈아엎고 처음부터 다시 심을까요?")) return;
    closeOverlay($("drawer"), true);
    if (gardenActive) exitGarden(true);
    store.del("plant");
    restoreOwnPlant("");
    updateDataLog(0, 90, false);
    toast("흙을 갈아엎었어요");
  }

  // =====================================================================
  // 정원에 심기 (구글 시트로 전송)
  // =====================================================================
  function previewHTML(seq) {
    return seq
      .split("\n")
      .filter((l) => l)
      .map((l) => `<span>${l.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))}</span>`)
      .join('<span class="br">/</span>');
  }

  function openSend() {
    if (gardenActive) { toast("내 다육이로 돌아간 뒤에 심을 수 있어요"); return; }
    const seq = fullSequence();
    if (!visibleText(seq)) { toast("먼저 글자를 쳐서 다육이를 키워 주세요"); return; }
    $("send-preview").innerHTML = previewHTML(seq);
    $("send-name").value = store.get("name", "");
    $("send-status").textContent = "";
    $("send-status").className = "";
    const btn = $("send-confirm");
    btn.disabled = false;
    btn.textContent = "심기";
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
    btn.textContent = "심는 중…";
    status.className = "";
    status.textContent = "";

    let ok = false;
    if (!ENDPOINT) {
      // 시트가 아직 연결되지 않은 연습 모드: 이 기기에만 저장
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
        // 응답을 읽지 못하는 경우(네트워크 정책)에 대비해 한 번 더, 응답 없이 보냄
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
        ? "정원에 심었어요."
        : "연습 모드라 이 기기에만 심었어요. (config.js에 시트 주소를 넣으면 모두에게 보여요)";
      btn.textContent = "정원 보러 가기";
      btn.dataset.mode = "goto";
    } else {
      status.className = "err";
      status.textContent = "보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.";
      btn.textContent = "다시 심기";
    }
  }

  // =====================================================================
  // 모두의 정원 — 모든 방문자의 다육이를 한 땅에 나란히 심어 보여줌
  // =====================================================================
  const GARDEN_LIMIT = {
    lines: 80,                       // 무대 폭 안에 들어가는 줄 수
    chars: TOUCH ? 600 : 1400,       // 휴대폰은 너무 많으면 버벅이므로 최근 것부터 잘라냄
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

    $("garden-count").textContent = picked.length ? `${picked.length}그루` : "";
    if (!picked.length) {
      setGardenNote(
        `아직 심어진 다육이가 없어요.<br>내 다육이로 돌아가 <b>정원에 심기</b>를 눌러 첫 번째로 심어 보세요.` +
        (ENDPOINT ? "" : `<small>연습 모드 — config.js에 시트 주소를 넣으면 모두의 다육이가 모여요.</small>`)
      );
      renderGardenList();
      return;
    }
    setGardenNote(ENDPOINT ? "" : `<small>연습 모드 — 이 기기에서 심은 것만 보여요. config.js에 시트 주소를 넣으면 모두의 다육이가 모여요.</small>`);

    // 사람마다 한 줄(혹은 여러 줄)씩 나란히: 엔진의 "줄 바꿈"을 그대로 이용
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

    // 한꺼번에 그리면 휴대폰이 멈추므로, 한 프레임에 조금씩 나눠 심음
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
    n.textContent = e.name || "이름 없음";
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
    if (d < 60) return "방금";
    if (d < 3600) return `${Math.floor(d / 60)}분 전`;
    if (d < 86400) return `${Math.floor(d / 3600)}시간 전`;
    return `${Math.floor(d / 86400)}일 전`;
  }

  function renderGardenList() {
    const ul = $("garden-list-items");
    ul.innerHTML = "";
    if (!gardenEntriesShown.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "아직 아무도 심지 않았어요.";
      ul.appendChild(li);
      return;
    }
    [...gardenEntriesShown].reverse().forEach((e) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      const who = document.createElement("span");
      who.className = "who";
      who.textContent = e.name || "이름 없음";
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
    if (showLoading) setGardenNote("정원을 불러오는 중…");
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
        ? "새 다육이를 불러오지 못해 저장해 둔 정원을 보여주고 있어요. <b>새로 고침</b>으로 다시 시도해 보세요."
        : "정원을 불러오지 못했어요. 인터넷 연결을 확인하고 <b>새로 고침</b>을 눌러 주세요.");
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

    // 저장해 둔 정원을 먼저 바로 보여주고, 그 뒤 새 다육이를 받아옴
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

    gardenZoomMul = 1;
    applyZoom(baseZoom(), false);
    updateInsets();
    if (!skipRestore) restoreOwnPlant(ownSequenceBackup);
    if (!TOUCH && inputEl) inputEl.focus({ preventScroll: true });
    syncDrawer();
  }

  function zoomGarden(f) {
    gardenZoomMul = Math.max(0.25, Math.min(2, gardenZoomMul * f));
    applyZoom(baseZoom() * gardenZoomMul, true);
  }

  // =====================================================================
  // 화면에서 가려지는 영역 → 카메라가 성장점을 그 사이에 맞추도록
  // =====================================================================
  function updateInsets() {
    if (!TOUCH) { window.CAMERA_TOP_INSET = 0; window.CAMERA_BOTTOM_INSET = 0; return; }
    const top = $("top-bar").getBoundingClientRect();
    window.CAMERA_TOP_INSET = Math.round(top.bottom);
    const dockEl = gardenActive ? $("garden-dock") : $("ui-layer");
    const r = dockEl.getBoundingClientRect();
    window.CAMERA_BOTTOM_INSET = Math.max(0, Math.round(window.innerHeight - r.top));
  }

  // =====================================================================
  // 연결
  // =====================================================================
  function wire() {
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

    // 패널(성장 지도, 영수증) 버튼 상태를 메뉴에도 반영
    ["growth-map-close", "growth-map-btn", "growth-xray-btn", "decode-btn"].forEach((id) => {
      const b = $(id);
      if (b) b.addEventListener("click", () => setTimeout(syncDrawer, 0));
    });

    // 가로/세로 전환 등 화면 폭이 바뀌면 배율을 다시 맞춤 (높이만 바뀌는 건 무시)
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      updateInsets();
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      applyZoom(baseZoom() * gardenZoomMul, true);
      if (!gardenActive && typeof lastPos !== "undefined") moveCamera(lastPos.x, lastPos.y, "auto");
    });

    // 다른 탭에 갔다 오면 정원을 새로 받아옴
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
    // 처음 들어오면 작업 소개를 띄움 (닫으면 메뉴의 "작업 소개"로 다시 열 수 있음)
    openOverlay($("about"));
  }

  // script.js의 init 다음에 실행되도록 (같은 이벤트에 나중에 등록됨)
  window.addEventListener("DOMContentLoaded", start);
})();
