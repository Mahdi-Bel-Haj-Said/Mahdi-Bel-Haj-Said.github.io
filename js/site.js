// Site logic: state, copy (EN/FR) and interactions, rendered by dc-runtime.js
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { theme: null, lang: "en", now: Date.now(), copied: false, sp: 0, filter: "all", tldr: false, active: "", dec: 0, openExp: -1, cert: -1,
      askChip: 2, askQ: "", askN: 9999, askMs: 0,
      gh: null, gp: null, skView: (typeof window !== "undefined" && window.innerWidth < 720) ? "list" : "graph",
      chessSel: null, chessDone: false, chessMsg: "", chessHint: false,
      termOpen: false, termLines: [], termParty: false, crash: 0, crashN: 0, crashP: 0 };
    this.statsRef = (el) => { this.statsEl = el; };
    this.netRef = (el) => { this.netEl = el; };
    this.mouse = null;
    this.askRef = (el) => { this.askEl = el; };
    this.termRef = (el) => { this.termEl = el; };
    this.termLogRef = (el) => { this.termLogEl = el; };
    this.termWinRef = (el) => { this.termWinEl = el; };
    this.termBtnRef = (el) => { this.termBtnEl = el; };
    this.netManRef = (el) => { this.netManEl = el; };
    this.netBandRef = (el) => { this.netBandEl = el; };
    this.netContactRef = (el) => { this.netContactEl = el; };
    this.mice = {};
    this.nets = [];
    this.termHist = [];
    this.crashT = [];
  }
  runAsk(q, chip) {
    const query = String(q || "").trim();
    if (!query) return;
    const lang = this.state.lang;
    const clock = () => (window.performance && window.performance.now) ? window.performance.now() : Date.now();
    const t0 = clock();
    const res = retrieve(query, lang);
    const ms = clock() - t0;
    const found = res.top.length > 0 && res.top[0].score >= ASK_MIN;
    const ans = found ? KB[res.top[0].i].x[lang === "fr" ? 1 : 0] : STRINGS[lang].askFallback;
    this.askTarget = ans.split(" ").length;
    clearInterval(this.askTimer);
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.setState({ askQ: query, askChip: chip, askN: reduce ? 9999 : 0, askMs: ms });
    if (reduce) return;
    this.askTimer = setInterval(() => {
      const n = (this.state.askN || 0) + 2;
      if (n >= this.askTarget) { clearInterval(this.askTimer); this.setState({ askN: 9999 }); }
      else this.setState({ askN: n });
    }, 45);
  }
  chessClick(sq) {
    if (this.state.chessDone) return;
    const pc = CHESS[sq] || "";
    const sel = this.state.chessSel;
    if (pc && pc.charAt(0) === "w") { this.setState({ chessSel: sel === sq ? null : sq, chessMsg: "" }); return; }
    if (!sel) { this.setState({ chessMsg: pc ? "black" : "" }); return; }
    if (sel === "d1" && sq === "d8") { this.setState({ chessDone: true, chessSel: null, chessMsg: "win" }); return; }
    this.setState({ chessSel: null, chessMsg: "wrong" });
  }
  termRun(raw) {
    const input = String(raw || "").trim();
    const lang = this.state.lang;
    const fr = lang === "fr";
    const T = TERM[lang];
    const out = [{ k: "cmd", text: input }];
    if (input) this.termHist = (this.termHist || []).concat([input]).slice(-30);
    this.termHi = (this.termHist || []).length;
    const lc = input.toLowerCase().replace(/\s+/g, " ");
    const say = (text, k) => { out.push({ k: k || "out", text: text }); };
    const add = (k, text, href, dl) => { out.push({ k: k, text: text, href: href, dl: dl || "" }); };
    const go = (id) => { const el = document.getElementById(id); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
    const SECTIONS = { about: "about", apropos: "about", projects: "projects", projets: "projects", experience: "experience", skills: "skills", competences: "skills", references: "letters", letters: "letters", ask: "ask", contact: "contact", hobbies: "beyond", loisirs: "beyond", education: "education", formation: "education", chess: "chess", echecs: "chess", top: "top" };
    let after = null;
    if (!input) {
      out.length = 1;
    } else if (lc === "help" || lc === "aide" || lc === "?") {
      T.help.forEach((l) => say(l));
    } else if (lc === "whoami") {
      T.whoami.forEach((l) => say(l));
    } else if (lc === "ls" || lc === "ls -la" || lc === "ls -a" || lc === "dir") {
      say(T.ls);
    } else if (lc === "projects" || lc === "projets" || lc === "ls projects") {
      T.projects.forEach((l) => say(l));
    } else if (lc === "skills" || lc === "stack" || lc === "competences") {
      T.skills.forEach((l) => say(l));
    } else if (lc === "ask" || lc.indexOf("ask ") === 0) {
      const q = input.slice(3).trim();
      if (!q) {
        say(T.askUsage, "dim");
      } else {
        const r = retrieve(q, lang);
        const ok = r.top.length > 0 && r.top[0].score >= ASK_MIN;
        say(ok ? KB[r.top[0].i].x[fr ? 1 : 0] : T.askNone, ok ? "out" : "err");
        if (ok) say("[" + T.source + ": " + KB[r.top[0].i].t[fr ? 1 : 0] + " · " + r.top[0].score.toFixed(2) + "]", "dim");
      }
    } else if (lc === "cv" || lc === "resume" || lc === "cat cv.pdf" || lc === "open cv.pdf") {
      say(T.cv);
      const file = fr ? "Mahdi-Bel-Haj-Said-CV-FR.pdf" : "Mahdi-Bel-Haj-Said-Resume-EN.pdf";
      add("file", file, fr ? CV_FR : CV_EN, file);
    } else if (lc === "contact" || lc === "email" || lc === "cat contact.txt") {
      say(T.contact);
      add("mail", "mahdi.haj.said@gmail.com", "mailto:mahdi.haj.said@gmail.com");
      add("mail", "+216 26 957 057", "tel:+21626957057");
      add("web", "linkedin.com/in/mahdi-bel-haj-said", "https://www.linkedin.com/in/mahdi-bel-haj-said-152602202/");
      add("web", "github.com/Mahdi-Bel-Haj-Said", "https://github.com/Mahdi-Bel-Haj-Said");
    } else if (/^(sudo )?(hire|embaucher)( mahdi)?$/.test(lc)) {
      if (lc.indexOf("sudo ") !== 0) {
        say(T.hireDenied, "err");
      } else {
        T.hire.forEach((l) => say(l, "ok"));
        add("mail", "mahdi.haj.said@gmail.com", "mailto:mahdi.haj.said@gmail.com?subject=" + encodeURIComponent(T.hireSubject));
        after = () => {
          clearTimeout(this.partyT);
          this.setState({ termParty: true });
          this.partyT = setTimeout(() => this.setState({ termParty: false }), 1700);
        };
      }
    } else if (/^sudo rm -(rf|fr) \/\*?( --no-preserve-root)?$/.test(lc) || lc === "rm -rf / --no-preserve-root") {
      say(T.rmStart, "err");
      after = () => this.startCrash();
    } else if (lc.indexOf("rm ") === 0) {
      say(T.rmDenied, "err");
    } else if (lc === "sudo" || lc.indexOf("sudo ") === 0) {
      say(T.sudo, "dim");
    } else if (lc === "theme" || lc.indexOf("theme ") === 0) {
      const arg = lc.slice(6);
      const cur = this.state.theme || this.props.startTheme || "dark";
      const next = (arg === "light" || arg === "clair") ? "light" : ((arg === "dark" || arg === "sombre") ? "dark" : (cur === "dark" ? "light" : "dark"));
      say(T.themeOk.replace("{t}", next), "ok");
      after = () => this.setState({ theme: next });
    } else if (lc === "lang en" || lc === "lang fr") {
      const nl = lc.slice(5);
      say(TERM[nl].langOk, "ok");
      after = () => this.setState({ lang: nl });
    } else if (/^(open|cd|goto|go) /.test(lc)) {
      const key = normTxt(lc.slice(lc.indexOf(" ") + 1)).replace(/[^a-z]/g, "");
      const id = SECTIONS[key];
      if (id) {
        say(T.opening + " " + key + "...", "dim");
        after = () => go(id);
      } else {
        say(T.noSection.replace("{s}", key), "err");
      }
    } else if (lc === "chess" || lc === "echecs") {
      say(T.chess, "dim");
      after = () => go("chess");
    } else if (lc === "date" || lc === "time") {
      let d = "";
      try { d = new Date().toLocaleString(fr ? "fr-FR" : "en-GB", { timeZone: "Africa/Tunis", dateStyle: "medium", timeStyle: "short" }); } catch (e) { d = new Date().toString(); }
      say(T.date + " " + d);
    } else if (lc.indexOf("echo ") === 0) {
      say(input.slice(5));
    } else if (/secrets/.test(lc)) {
      say(T.secrets, "dim");
    } else if (lc === "coffee" || lc === "make coffee" || lc === "cafe") {
      say(T.coffee, "err");
    } else if (lc === "hello" || lc === "hi" || lc === "hey" || lc === "bonjour" || lc === "salut") {
      say(T.hello);
    } else if (lc === "clear" || lc === "cls") {
      this.setState({ termLines: [] });
      return;
    } else if (lc === "exit" || lc === "quit" || lc === "close") {
      this.closeTerminal();
      return;
    } else {
      say(T.notFound.replace("{c}", input.split(" ")[0]), "err");
    }
    this.setState((s) => ({ termLines: s.termLines.concat(out).slice(-200) }), () => {
      if (this.termLogEl) this.termLogEl.scrollTop = this.termLogEl.scrollHeight;
      if (after) after();
    });
  }
  startCrash() {
    this.clearCrash();
    this.cancelAuto();
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { this.setState({ crash: 4, crashN: 0, termOpen: false }); return; }
    this.setState({ crash: 1, crashN: 0, crashP: 0 });
    const at = (ms, fn) => { this.crashT.push(setTimeout(fn, ms)); };
    for (let i = 1; i <= 10; i++) at(i * 110, () => this.setState({ crashN: i }));
    at(1300, () => this.setState({ crash: 2 }));
    at(2200, () => this.setState({ crash: 3, crashP: 0 }));
    [7, 18, 26, 41, 55, 63, 78, 86, 94, 100].forEach((p, k) => at(2300 + k * 150, () => this.setState({ crashP: p })));
    at(4100, () => this.setState({ crash: 4, crashN: 0, termOpen: false }));
  }
  clearCrash() {
    (this.crashT || []).forEach((id) => clearTimeout(id));
    this.crashT = [];
  }
  flyTerm(win, rect, reverse) {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !win || !win.animate || !rect) return null;
    const w = win.getBoundingClientRect();
    if (!w.width || !w.height) return null;
    const dx = (rect.left + rect.width / 2) - (w.left + w.width / 2);
    const dy = (rect.top + rect.height / 2) - (w.top + w.height / 2);
    const sx = Math.max(0.03, rect.width / w.width);
    const sy = Math.max(0.03, rect.height / w.height);
    const small = { transform: "translate(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px) scale(" + sx.toFixed(3) + ", " + sy.toFixed(3) + ")", opacity: 0, borderRadius: "999px" };
    const mid = { transform: "translate(" + (dx * 0.35).toFixed(1) + "px, " + (dy * 0.35).toFixed(1) + "px) scale(" + (0.35 + sx * 0.65).toFixed(3) + ", " + (0.2 + sy * 0.8).toFixed(3) + ")", opacity: 0.85, borderRadius: "28px" };
    const big = { transform: "translate(0px, 0px) scale(1, 1)", opacity: 1, borderRadius: "14px" };
    try {
      return reverse
        ? win.animate([big, Object.assign({ offset: 0.55 }, mid), small], { duration: 420, easing: "cubic-bezier(.55,0,.7,.2)", fill: "forwards" })
        : win.animate([small, Object.assign({ offset: 0.45 }, mid), big], { duration: 620, easing: "cubic-bezier(.16,1,.3,1)" });
    } catch (e) {
      return null;
    }
  }
  openTerminal(originEl, auto) {
    if (this.state.termOpen || this.termClosing || this.state.crash) return;
    const lang = this.state.lang;
    const add = this.state.termLines.length ? [] : TERM[lang].welcome.map((text) => ({ k: "dim", text: text }));
    const src = originEl || this.termBtnEl;
    const rect = src && src.getBoundingClientRect ? src.getBoundingClientRect() : null;
    this.setState((s) => ({ termOpen: true, termLines: s.termLines.concat(add) }), () => {
      this.flyTerm(this.termWinEl, rect, false);
      if (this.termLogEl) this.termLogEl.scrollTop = this.termLogEl.scrollHeight;
      if (auto) {
        this.autoType("whoami");
      } else if (this.termEl) {
        try { this.termEl.focus({ preventScroll: true }); } catch (e) { this.termEl.focus(); }
      }
    });
  }
  closeTerminal() {
    if (!this.state.termOpen || this.termClosing) return;
    this.cancelAuto();
    const btn = this.termBtnEl;
    const anim = this.flyTerm(this.termWinEl, btn && btn.getBoundingClientRect ? btn.getBoundingClientRect() : null, true);
    if (!anim) { this.setState({ termOpen: false }); return; }
    this.termClosing = true;
    const done = () => { this.termClosing = false; this.setState({ termOpen: false }); };
    anim.onfinish = done;
    anim.oncancel = done;
  }
  autoType(cmd) {
    this.cancelAuto();
    const lang = this.state.lang;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      this.autoTyping = false;
      if (this.termEl) this.termEl.value = "";
      this.termRun(cmd);
      this.setState((s) => ({ termLines: s.termLines.concat([{ k: "dim", text: TERM[lang].autoHint }]) }), () => {
        if (this.termLogEl) this.termLogEl.scrollTop = this.termLogEl.scrollHeight;
      });
    };
    if (reduce) { finish(); return; }
    this.autoTyping = true;
    let i = 0;
    this.autoT = setTimeout(() => {
      this.autoI = setInterval(() => {
        if (!this.termEl || !this.state.termOpen) { this.cancelAuto(); return; }
        i++;
        this.termEl.value = cmd.slice(0, i);
        if (i >= cmd.length) {
          clearInterval(this.autoI);
          this.autoI = null;
          this.autoT = setTimeout(finish, 280);
        }
      }, 90);
    }, 750);
  }
  cancelAuto() {
    clearTimeout(this.autoT);
    clearInterval(this.autoI);
    this.autoI = null;
    if (this.autoTyping && this.termEl) this.termEl.value = "";
    this.autoTyping = false;
  }
  startNet() {
    const c = this.netEl;
    if (!c || !c.getContext) return;
    const ctx = c.getContext("2d");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pts = [];
    let w = 0, h = 0;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(80, Math.round((w * h) / 14000)));
      pts.length = 0;
      for (let i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 });
      if (reduce) draw();
    };
    const draw = () => {
      const acc = getComputedStyle(c).getPropertyValue("--accent").trim() || "#8B7CFF";
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = acc; ctx.fillStyle = acc;
      const m = this.mouse;
      for (const p of pts) {
        if (!reduce) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          if (m) { const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy); if (d < 180 && d > 1) { p.x += dx / d * 0.35; p.y += dy / d * 0.35; } }
        }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) { ctx.globalAlpha = (1 - d / 130) * 0.38; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        if (m) { const a = pts[i], d = Math.hypot(a.x - m.x, a.y - m.y); if (d < 180) { ctx.globalAlpha = (1 - d / 180) * 0.7; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.stroke(); } }
      }
      for (const p of pts) { ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (!reduce && this.netOn !== false) this.netRaf = requestAnimationFrame(draw); else this.netRaf = 0;
    };
    resize();
    this.onResize = resize;
    window.addEventListener("resize", resize);
    if (!reduce) this.netRaf = requestAnimationFrame(draw);
    if (!reduce && "IntersectionObserver" in window) {
      this.netIo = new IntersectionObserver((entries) => {
        const vis = entries.some((en) => en.isIntersecting);
        this.netOn = vis;
        if (vis && !this.netRaf) this.netRaf = requestAnimationFrame(draw);
      });
      this.netIo.observe(c);
    }
  }
  componentDidMount() {
    this.clock = setInterval(() => this.setState({ now: Date.now() }), 20000);
    const mkNet = (el, o) => {
      if (!el || !el.getContext) return;
      try { this.nets.push(new NeuralNet(el, o)); } catch (e) {}
    };
    mkNet(this.netEl, { getMouse: () => this.mouse });
    mkNet(this.netManEl, { alpha: 0.55, density: 16000, getMouse: () => this.mice.man });
    mkNet(this.netBandEl, { mode: "layers", layers: [3, 6, 8, 8, 8, 6, 3], burstOnEnter: true });
    mkNet(this.netContactEl, { alpha: 0.6, density: 12000, getMouse: () => this.mice.contact });
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = () => {
      if (reduce) { this.setState({ sp: 1 }); return; }
      const t0 = performance.now();
      const step = (ts) => {
        const k = Math.min(1, Math.max(0, (ts - t0) / 1600));
        this.setState({ sp: 1 - Math.pow(1 - k, 3) });
        if (k < 1) this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    };
    if (this.statsEl && "IntersectionObserver" in window) {
      this.io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { this.io.disconnect(); run(); }
      }, { threshold: 0.3 });
      this.io.observe(this.statsEl);
    } else { run(); }
    if (reduce) { this.setState({ dec: 1 }); } else {
      const d0 = performance.now() + 250;
      const stepD = (ts) => {
        const k = Math.min(1, Math.max(0, (ts - d0) / 1300));
        this.setState({ dec: k });
        if (k < 1) this.decRaf = requestAnimationFrame(stepD);
      };
      this.decRaf = requestAnimationFrame(stepD);
    }
    if ("IntersectionObserver" in window) {
      this.spy = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) this.setState({ active: en.target.id }); });
      }, { rootMargin: "-40% 0px -55% 0px" });
      ["about", "projects", "experience", "skills", "letters", "ask", "contact"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) this.spy.observe(el);
      });
    }
    try {
      console.log("%cHi, fellow engineer.", "font: 700 16px sans-serif; color: #8B7CFF");
      console.log("If you are reading the console of a portfolio, we would probably get along. mahdi.haj.said@gmail.com");
      console.log("Psst: open the >_ terminal in the menu and type help. Just don't run sudo rm -rf /.");
    } catch (e) {}
    try {
      if (window.innerWidth >= 900) this.autoOpenT = setTimeout(() => this.openTerminal(null, true), 1800);
    } catch (e) {}
  }
  componentWillUnmount() {
    clearInterval(this.clock); clearTimeout(this.tt); clearTimeout(this.ct);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.io) this.io.disconnect();
    if (this.netRaf) cancelAnimationFrame(this.netRaf);
    if (this.onResize) window.removeEventListener("resize", this.onResize);
    if (this.spy) this.spy.disconnect();
    if (this.decRaf) cancelAnimationFrame(this.decRaf);
    clearInterval(this.askTimer);
    if (this.netIo) this.netIo.disconnect();
    this.clearCrash();
    clearTimeout(this.partyT);
    clearTimeout(this.autoOpenT);
    this.cancelAuto();
    (this.nets || []).forEach((n) => n.destroy());
  }
  renderVals() {
    const theme = this.state.theme || this.props.startTheme || "dark";
    const dark = theme === "dark";
    const lang = this.state.lang;
    const aD = this.props.accentDark ?? "#8B7CFF";
    const aL = this.props.accentLight ?? "#5B47F0";
    const hexA = (h, a) => {
      const n = parseInt(h.slice(1), 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    };
    const c = dark
      ? { bg: "#0A0C12", nav: "rgba(10,12,18,0.78)", surface: "#11141D", surface2: "#181C28", border: "#252A3A", text: "#ECEEF5", muted: "#A3A9BC", accent: aD, ink: "#0A0C12", ok: "#4ADE80" }
      : { bg: "#F7F7FB", nav: "rgba(247,247,251,0.82)", surface: "#FFFFFF", surface2: "#F0F0F7", border: "#E0E2EC", text: "#12141C", muted: "#4F5568", accent: aL, ink: "#FFFFFF", ok: "#15803D" };
    const rootVars = "--bg:" + c.bg + ";--nav:" + c.nav + ";--surface:" + c.surface + ";--surface2:" + c.surface2 + ";--border:" + c.border + ";--text:" + c.text + ";--muted:" + c.muted + ";--accent:" + c.accent + ";--accent-ink:" + c.ink + ";--ok:" + c.ok + ";--accent-soft:" + hexA(c.accent, dark ? 0.14 : 0.09) + ";--accent-line:" + hexA(c.accent, dark ? 0.45 : 0.4) + ";--grid:" + hexA(c.accent, dark ? 0.12 : 0.1) + ";";
    const on = "background: var(--accent); color: var(--accent-ink);";
    const off = "background: transparent; color: var(--text);";
    const t = STRINGS[lang];
    const stacks = [
      ["PyTorch", "LoRA", "GPT-4o Vision", "RunPod", "FastAPI", "RQ/Redis", "MongoDB", "Cloudflare R2", "React"],
      ["Groq", "LLM agents", "RAG", "FastAPI"],
      ["Tesseract OCR", "FastAPI", "React", "PostgreSQL", "AWS (VPC, EC2, S3, IAM)", "OpenAI API", "ChromaDB"],
      ["Whisper", "BART", "sentence-transformers", "Hugging Face", "FastAPI", "Twitch API"],
      ["YOLOv8", "OpenCV", "FastAPI"]
    ];
    const projectsAll = t.projects.map((p, i) => ({
      ...p,
      stack: stacks[i],
      span: i === 0 ? "grid-column: 1 / -1;" : "",
      hasMetrics: !!(p.metrics && p.metrics.length),
      hasBuilt: !!p.built,
      v0: i === 0, v1: i === 1, v2: i === 2, v3: i === 3, v4: i === 4,
      extra: i === 0 ? "featured" : ""
    }));
    const cats = [["genai"], ["genai"], ["genai", "auto"], ["ml"], ["ml"]];
    const filt = this.state.filter || "all";
    const projects = projectsAll.filter((p, i) => filt === "all" || cats[i].indexOf(filt) >= 0);
    const filters = t.filters.map((f) => ({
      label: f.label, sel: f.id === filt,
      count: f.id === "all" ? cats.length : cats.filter((c) => c.indexOf(f.id) >= 0).length,
      pick: () => this.setState({ filter: f.id }),
      style: f.id === filt ? "background: var(--accent); border-color: var(--accent); color: var(--accent-ink);" : "background: var(--surface); color: var(--text);"
    }));
    const hr = new Date(this.state.now).getHours();
    const greeting = lang === "fr" ? (hr >= 18 || hr < 5 ? "Bonsoir, je suis" : "Bonjour, je suis") : (hr < 5 ? "Hi, I'm" : hr < 12 ? "Good morning, I'm" : hr < 18 ? "Good afternoon, I'm" : "Good evening, I'm");
    const fr = lang === "fr";
    const sp = this.state.sp;
    const num = (v, d) => { const s = (v * sp).toFixed(d); return fr ? s.replace(".", ",") : s; };
    const pct = fr ? " %" : "%";
    const statVals = [num(99.7, 1) + pct, num(88, 0) + pct, "~" + num(70, 0) + pct, num(100, 0), fr ? "0,10 $" : "$0.10", num(7, 0)];
    const stats = t.stats.map((label, i) => ({ label, value: statVals[i] }));
    const li = fr ? 1 : 0;
    const askQText = this.state.askChip >= 0 ? (t.askChips[this.state.askChip] || "") : this.state.askQ;
    const askHasQ = !!askQText;
    let askAns = "", askFound = false, askTop = [], askToks = [];
    if (askHasQ) {
      const res = retrieve(askQText, lang);
      askFound = res.top.length > 0 && res.top[0].score >= ASK_MIN;
      askAns = askFound ? KB[res.top[0].i].x[li] : t.askFallback;
      const known = {};
      res.known.forEach((s) => { known[s] = true; });
      askToks = res.tokens.map((w) => ({ w, style: known[stem(w)] ? "background: var(--accent-soft); color: var(--accent); border-color: var(--accent-line);" : "color: var(--muted); text-decoration: line-through;" }));
      askTop = res.top.map((r, k) => {
        const hot = k === 0 && askFound;
        const sc = r.score.toFixed(2);
        return { rank: k + 1, title: KB[r.i].t[li], score: fr ? sc.replace(".", ",") : sc,
          w: Math.max(3, Math.min(100, Math.round(r.score * 100))) + "%",
          bar: hot ? "var(--accent)" : "var(--muted)",
          tstyle: hot ? "color: var(--text); font-weight: 600;" : "color: var(--muted);" };
      });
    }
    const askWords = askAns ? askAns.split(" ") : [];
    const askStreaming = askHasQ && this.state.askN < askWords.length;
    const askShownA = askStreaming ? askWords.slice(0, this.state.askN).join(" ") : askAns;
    const askMsRaw = this.state.askMs < 0.1 ? "<0.1 ms" : this.state.askMs.toFixed(2) + " ms";
    const askVerdict = !askHasQ ? t.hoodIdle : (askFound ? t.hoodFound.replace("{s}", askTop[0].score) : t.hoodNone);
    const askStatsLine = t.hoodStats.replace("{n}", String(KB.length)).replace("{v}", String(getIndex(lang).vocab)).replace("{ms}", fr ? askMsRaw.replace(".", ",") : askMsRaw);
    const askChips = t.askChips.map((q, i) => ({ q, pick: () => this.runAsk(q, i) }));
    const GL = graphLayout();
    const gAct = this.state.gh || this.state.gp;
    const gHot = {};
    if (gAct) {
      gHot[gAct] = true;
      const gi = Number(gAct.slice(1));
      if (gAct.charAt(0) === "p") GL.skills.forEach((s, si) => { if (s.projects.indexOf(gi) >= 0) gHot["s" + si] = true; });
      else GL.skills[gi].projects.forEach((pi) => { gHot["p" + pi] = true; });
    }
    const gNode = (id, label, kind, x, y) => ({
      label, cls: kind + (gAct ? (gHot[id] ? " hot" : " dim") : ""), pinned: this.state.gp === id,
      st: "left: " + (x / GL.W * 100).toFixed(2) + "%; top: " + (y / GL.H * 100).toFixed(2) + "%;",
      enter: () => this.setState({ gh: id }),
      leave: () => this.setState({ gh: null }),
      pin: () => this.setState((s) => ({ gp: s.gp === id ? null : id }))
    });
    const gNodes = GL.skills.map((s, si) => gNode("s" + si, s.name, s.side === "l" ? "gl" : "gr", s.x, s.y))
      .concat(GL.py.map((y, pi) => gNode("p" + pi, t.gProj[pi], "gp", 500, y)));
    const gHiList = gAct ? GL.edges.filter((e) => ("p" + e.pi) === gAct || ("s" + e.si) === gAct) : [];
    let gCaption = t.gHint;
    if (gAct) {
      const gi = Number(gAct.slice(1));
      gCaption = gAct.charAt(0) === "p"
        ? t.gProj[gi] + " · " + GRAPH[gi].length + " " + t.gTools + ": " + GRAPH[gi].join(", ")
        : GL.skills[gi].name + " → " + t.gUsedIn + " " + GL.skills[gi].projects.map((pi) => t.gProj[pi]).join(", ");
    }
    const skGraph = this.state.skView === "graph";
    const onSt = "background: var(--accent); border-color: var(--accent); color: var(--accent-ink);";
    const offSt = "background: var(--surface); color: var(--text);";
    const cboard = this.state.chessDone ? Object.assign({}, CHESS, { d1: "", d8: "wR" }) : CHESS;
    const csel = this.state.chessSel;
    const chessSquares = [];
    for (let r = 8; r >= 1; r--) {
      for (let f = 0; f < 8; f++) {
        const sq = "abcdefgh".charAt(f) + r;
        const pc = cboard[sq] || "";
        const darkSq = (f + r) % 2 === 1;
        let bg = darkSq ? "#7C6CE0" : "#ECE8FB";
        if (this.state.chessHint && !this.state.chessDone && (sq === "d1" || sq === "d8")) bg = darkSq ? "#D99A1E" : "#F8DE8C";
        if (csel === sq) bg = "#FFD166";
        if (this.state.chessDone && sq === "d8") bg = "#4ADE80";
        if (this.state.chessDone && sq === "g8") bg = "#F87171";
        chessSquares.push({
          glyph: pc ? GLYPH[pc.charAt(1)] + "︎" : "",
          pstyle: pc ? (pc.charAt(0) === "w" ? "color: #FFFFFF; text-shadow: 0 0 2px #1B1530, 0 1px 2px #1B1530, 0 0 1px #1B1530;" : "color: #17142A; text-shadow: 0 0 1px rgba(255,255,255,0.7);") : "",
          st: "background: " + bg + ";",
          label: sq + (pc ? ", " + pieceName(pc, fr) : ""),
          coordR: f === 0 ? String(r) : "",
          coordF: r === 1 ? "abcdefgh".charAt(f) : "",
          cstyle: darkSq ? "color: rgba(255,255,255,0.85);" : "color: #5B4BC4;",
          click: () => this.chessClick(sq)
        });
      }
    }
    const cm = this.state.chessMsg;
    const chessMsg = cm ? t.chess[cm] : (csel ? t.chessSelMsg.replace("{sq}", csel) : t.chess.intro);
    const chessMsgBg = cm === "win" ? "var(--accent-soft)" : (cm === "wrong" ? "rgba(248,113,113,0.14)" : "var(--surface2)");
    const TT = TERM[lang];
    const crash = this.state.crash;
    const termLines = this.state.termLines.map((l) => ({
      text: l.text, href: l.href || "", dl: l.dl || "",
      isCmd: l.k === "cmd", isWeb: l.k === "web", isMail: l.k === "mail", isFile: l.k === "file",
      isText: l.k !== "web" && l.k !== "mail" && l.k !== "file",
      st: l.k === "cmd" ? "color: #E6E8F2; margin-top: 6px;" : (l.k === "ok" ? "color: #4ADE80;" : (l.k === "err" ? "color: #F87171;" : (l.k === "dim" ? "color: #8A90A6;" : "color: #C9CEDD;")))
    }));
    const crashWins = [];
    for (let i = 0; i < this.state.crashN; i++) {
      const lines = [];
      for (let j = 0; j < 5; j++) {
        const tx = TT.crashLines[(i * 2 + j) % TT.crashLines.length];
        lines.push({ t: tx, st: /fatal|cannot/.test(tx) ? "color: #F87171;" : (/warning/.test(tx) ? "color: #FBBF24;" : "color: #C9CEDD;") });
      }
      crashWins.push({ title: "rm -rf /  ·  pid " + (4180 + i * 7), lines: lines,
        st: "left: calc(3vw + " + i + " * min(5.2vw, 46px)); top: calc(4vh + " + i + " * min(6.4vh, 48px)); z-index: " + (51 + i) + ";" });
    }
    let tunisTime = "";
    try { tunisTime = new Date(this.state.now).toLocaleTimeString(fr ? "fr-FR" : "en-GB", { timeZone: "Africa/Tunis", hour: "2-digit", minute: "2-digit" }); } catch (e) { tunisTime = ""; }
    const copyEmail = () => {
      try {
        navigator.clipboard.writeText("mahdi.haj.said@gmail.com").then(() => {
          this.setState({ copied: true });
          clearTimeout(this.ct);
          this.ct = setTimeout(() => this.setState({ copied: false }), 1800);
        }).catch(() => {});
      } catch (e) {}
    };
    const spot = (e) => {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    };
    const skills = t.skills.map((g, i) => ({ ...g, k0: i === 0, k1: i === 1, k2: i === 2, k3: i === 3, k4: i === 4, k5: i === 5 }));
    const tech = ["LLM agents", "RAG", "LoRA fine-tuning", "Diffusion models", "GPT-4o Vision", "PyTorch", "Hugging Face", "YOLOv8", "Whisper", "OpenCV", "FastAPI", "React", "AWS", "RunPod", "Docker", "MongoDB", "ChromaDB", "Groq"];
    const marquee = tech.concat(tech);
    const hobbies = t.hobbies.map((h, i) => ({ ...h, h0: i === 0, h1: i === 1, h2: i === 2, h3: i === 3 }));
    return {
      t, projects, hobbies, rootVars, skills, marquee,
      stats, statsRef: this.statsRef, spot, copyEmail, tunisTime,
      askNote: t.askNote.replace("{n}", String(KB.length)), askChips, askRef: this.askRef,
      askKey: (e) => { if (e.key === "Enter") { e.preventDefault(); const el = e.currentTarget; this.runAsk(el.value, -1); el.value = ""; } },
      askGo: () => { const el = this.askEl; if (el) { this.runAsk(el.value, -1); el.value = ""; el.focus(); } },
      askHasQ, askShownQ: askQText, askShownA, askStreaming, askDone: askHasQ && !askStreaming && askFound,
      askLive: askStreaming ? "" : askShownA,
      askSrc: askFound && askTop.length ? askTop[0].title : "", askToks, askNoToks: askHasQ && askToks.length === 0,
      askTop, askVerdict, askStatsLine,
      gNodes, gAll: GL.allD, gHi: gHiList.length ? gHiList.map((e) => e.d).join(" ") : "M0 0", gBaseOp: gAct ? "0.12" : "0.4", gCaption,
      skGraph, skList: !skGraph, skGraphStyle: skGraph ? onSt : offSt, skListStyle: skGraph ? offSt : onSt,
      skSetGraph: () => this.setState({ skView: "graph" }), skSetList: () => this.setState({ skView: "list" }),
      chessSquares, chessMsg, chessMsgBg, chessWin: this.state.chessDone, confetti: CONFETTI,
      chessHintFn: () => this.setState({ chessHint: true, chessMsg: "hint" }),
      chessReset: () => this.setState({ chessDone: false, chessSel: null, chessMsg: "", chessHint: false }),
      cvUrl: fr ? "assets/docs/Mahdi-Bel-Haj-Said-CV-FR.pdf" : "assets/docs/Mahdi-Bel-Haj-Said-Resume-EN.pdf",
      cvFile: fr ? "Mahdi-Bel-Haj-Said-CV-FR.pdf" : "Mahdi-Bel-Haj-Said-Resume-EN.pdf",
      tt: TT, termOpen: this.state.termOpen, termLines, termParty: this.state.termParty,
      termRef: this.termRef, termLogRef: this.termLogRef,
      openTerm: (e) => this.openTerminal(e && e.currentTarget, false),
      toggleTerm: (e) => { if (this.state.termOpen) this.closeTerminal(); else this.openTerminal(e && e.currentTarget, false); },
      closeTerm: () => this.closeTerminal(),
      termFocus: () => this.cancelAuto(),
      termWinRef: this.termWinRef, termBtnRef: this.termBtnRef,
      netManRef: this.netManRef, netBandRef: this.netBandRef, netContactRef: this.netContactRef,
      manMove: (e) => { const r = e.currentTarget.getBoundingClientRect(); this.mice.man = { x: e.clientX - r.left, y: e.clientY - r.top }; },
      manLeave: () => { this.mice.man = null; },
      contactMove: (e) => { const r = e.currentTarget.getBoundingClientRect(); this.mice.contact = { x: e.clientX - r.left, y: e.clientY - r.top }; },
      contactLeave: () => { this.mice.contact = null; },
      termBtnCls: this.state.termOpen ? "on" : "idle",
      termKey: (e) => {
        const el = e.currentTarget;
        if (e.key === "Enter") {
          e.preventDefault();
          const v = el.value;
          el.value = "";
          this.termRun(v);
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          const h = this.termHist || [];
          if (!h.length) return;
          e.preventDefault();
          let i = typeof this.termHi === "number" ? this.termHi : h.length;
          i = e.key === "ArrowUp" ? Math.max(0, i - 1) : Math.min(h.length, i + 1);
          this.termHi = i;
          el.value = i < h.length ? h[i] : "";
        } else if (e.key === "Tab") {
          const v = el.value.toLowerCase();
          if (!v) return;
          const m = TERM_CMDS.filter((c) => c.indexOf(v) === 0);
          if (m.length) { e.preventDefault(); el.value = m[0]; }
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.closeTerminal();
        }
      },
      siteCls: crash === 2 ? "glitching" : "",
      crashRunning: crash >= 1 && crash <= 3, crashGlitch: crash === 2, crashScreen: crash === 3, crashReveal: crash === 4,
      crashWins, crashProgText: TT.crashProg.replace("{p}", String(this.state.crashP)), crashW: this.state.crashP + "%",
      skipCrash: () => { this.clearCrash(); this.setState({ crash: 4, crashN: 0, termOpen: false }); },
      closeCrash: () => { this.clearCrash(); this.setState({ crash: 0, crashN: 0, crashP: 0 }); },
      copyLabel: this.state.copied ? t.copied : t.copy,
      filters, greeting, tldr: this.state.tldr,
      nav: t.nav.map((n) => { const on = this.state.active === n.href.slice(1); return { ...n, active: on ? "on" : "", current: on ? "true" : "false" }; }),
      heroName: (() => {
        const NAME = "Mahdi Bel Haj Said", G = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*", d = this.state.dec;
        if (d >= 1) return NAME;
        const n = Math.floor(d * NAME.length);
        return NAME.split("").map((ch, i) => (ch === " " || i < n) ? ch : G.charAt(Math.floor(Math.random() * G.length))).join("");
      })(),
      exp: t.exp.map((e, i) => {
        const open = this.state.openExp === i;
        return { ...e, details: t.expDetails[i], open, tlabel: open ? t.lessLbl : t.moreLbl, chev: open ? "rotate(180deg)" : "none",
          toggle: () => this.setState((s) => ({ openExp: s.openExp === i ? -1 : i })) };
      }),
      netRef: this.netRef,
      heroMove: (e) => { const r = e.currentTarget.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; },
      heroLeave: () => { this.mouse = null; },
      manifesto: t.manifesto.split(" ").map((w) => ({ w: w.replace(/^\*/, ""), cls: w.charAt(0) === "*" ? "mw mw-hl" : "mw" })),
      letters: LETTERS.map((l, i) => ({ ...l, ...t.letters[i] })),
      certs: CERTS.map((c, i) => ({ ...c, type: t.certTypes[c.kind], meta: t.certMeta[i], hasMeta: !!t.certMeta[i],
        viewLabel: t.viewCert + ": " + c.title, open: () => this.setState({ cert: i }) })),
      certOpen: this.state.cert >= 0,
      certCur: (() => { const c = CERTS[Math.max(0, this.state.cert)]; return { ...c, alt: c.title + ", " + c.issuer }; })(),
      closeCert: () => this.setState({ cert: -1 }),
      repos: REPOS.map((r, i) => ({ ...r, url: "https://github.com/Mahdi-Bel-Haj-Said/" + r.slug, desc: t.repos[i] })),
      openTldr: () => this.setState({ tldr: true }),
      closeTldr: () => this.setState({ tldr: false }),
      isDark: dark, isLight: !dark,
      isEn: lang === "en", isFr: lang === "fr",
      enStyle: lang === "en" ? on : off,
      frStyle: lang === "fr" ? on : off,
      setEn: () => this.setState({ lang: "en" }),
      setFr: () => this.setState({ lang: "fr" }),
      toggleTheme: (e) => {
        const next = dark ? "light" : "dark";
        const reduceM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!document.startViewTransition || reduceM) { this.setState({ theme: next }); return; }
        let x = e && e.clientX, y = e && e.clientY;
        if (!e || e.detail === 0) { const r = e.currentTarget.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
        const root = document.documentElement;
        root.style.setProperty("--vt-x", x + "px");
        root.style.setProperty("--vt-y", y + "px");
        root.style.setProperty("--vt-r", Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + "px");
        document.startViewTransition(() => new Promise((res) => this.setState({ theme: next }, res)));
      }
    };
  }
}

class NeuralNet {
  constructor(canvas, opts) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d");
    this.o = Object.assign({ mode: "drift", density: 14000, min: 18, max: 80, link: 130, speed: 0.4, pulses: true, alpha: 1, layers: [5, 8, 8, 4], getMouse: null, burstOnEnter: false }, opts || {});
    this.reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    this.pts = [];
    this.edges = [];
    this.pulses = [];
    this.w = 0;
    this.h = 0;
    this.on = true;
    this.raf = 0;
    this.last = 0;
    this.spawnT = 300;
    this.dead = false;
    this.entered = false;
    this.frame = this.frame.bind(this);
    this.resize = this.resize.bind(this);
    this.resize();
    window.addEventListener("resize", this.resize);
    if ("IntersectionObserver" in window) {
      this.io = new IntersectionObserver((entries) => {
        this.on = entries.some((en) => en.isIntersecting);
        if (this.on) {
          if (this.o.burstOnEnter && !this.entered) { this.entered = true; this.burst(); }
          this.kick();
        }
      });
      this.io.observe(canvas);
    }
    this.kick();
  }
  kick() {
    if (this.reduce || this.dead || this.raf) return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }
  resize() {
    const r = this.c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.c.width = Math.max(1, Math.round(this.w * dpr));
    this.c.height = Math.max(1, Math.round(this.h * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.build();
    if (this.reduce) this.draw(0);
  }
  build() {
    const o = this.o, w = this.w, h = this.h;
    this.pts = [];
    this.pulses = [];
    this.edges = [];
    if (o.mode === "layers") {
      const L = o.layers;
      const padX = Math.min(60, w * 0.06), padY = Math.min(24, h * 0.16);
      L.forEach((n, li) => {
        const x = padX + (w - 2 * padX) * (L.length > 1 ? li / (L.length - 1) : 0.5);
        for (let k = 0; k < n; k++) {
          const y = n > 1 ? padY + (h - 2 * padY) * k / (n - 1) : h / 2;
          this.pts.push({ x: x, y: y, bx: x, by: y, layer: li, glow: 0, ph: Math.random() * 6.2832 });
        }
      });
      for (let a = 0; a < this.pts.length; a++) {
        for (let b = 0; b < this.pts.length; b++) {
          if (this.pts[b].layer === this.pts[a].layer + 1) this.edges.push([a, b]);
        }
      }
    } else {
      const n = Math.max(o.min, Math.min(o.max, Math.round((w * h) / o.density)));
      for (let i = 0; i < n; i++) {
        this.pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * o.speed, vy: (Math.random() - 0.5) * o.speed, glow: 0 });
      }
    }
  }
  frame(ts) {
    this.raf = 0;
    if (this.dead) return;
    const dt = this.last ? Math.min(50, ts - this.last) : 16;
    this.last = ts;
    this.draw(dt);
    if (this.on) this.raf = requestAnimationFrame(this.frame);
  }
  draw(dt) {
    const ctx = this.ctx, o = this.o, w = this.w, h = this.h, pts = this.pts;
    if (!w || !h) return;
    const acc = getComputedStyle(this.c).getPropertyValue("--accent").trim() || "#8B7CFF";
    const k = dt / 16;
    const m = o.getMouse ? o.getMouse() : null;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = acc;
    ctx.fillStyle = acc;
    if (o.mode === "layers") {
      if (!this.reduce) {
        for (const p of pts) { p.ph += 0.02 * k; p.x = p.bx + Math.cos(p.ph) * 2.5; p.y = p.by + Math.sin(p.ph * 1.3) * 3; }
      }
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.09 * o.alpha;
      ctx.beginPath();
      for (const e of this.edges) { const a = pts[e[0]], b = pts[e[1]]; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke();
    } else {
      if (!this.reduce) {
        for (const p of pts) {
          p.x += p.vx * k;
          p.y += p.vy * k;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          if (m) {
            const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
            if (d < 180 && d > 1) { p.x += dx / d * 0.35 * k; p.y += dy / d * 0.35 * k; }
          }
        }
      }
      const L = o.link;
      this.edges = [];
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < L) {
            ctx.globalAlpha = (1 - d / L) * 0.38 * o.alpha;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            this.edges.push([i, j]);
          }
        }
        if (m) {
          const a = pts[i], d = Math.hypot(a.x - m.x, a.y - m.y);
          if (d < 180) {
            ctx.globalAlpha = (1 - d / 180) * 0.7 * o.alpha;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.stroke();
            ctx.lineWidth = 1;
          }
        }
      }
    }
    if (o.pulses && !this.reduce) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) { this.spawnT = o.mode === "layers" ? 380 : 450; this.spawn(); }
      const keep = [];
      for (const q of this.pulses) {
        q.t += dt / q.dur;
        const a = pts[q.a], b = pts[q.b];
        if (!a || !b) continue;
        if (q.t >= 1) {
          b.glow = 1;
          if (q.hops > 0) this.propagate(q.b, q.hops - 1, keep, false);
          continue;
        }
        const x = a.x + (b.x - a.x) * q.t, y = a.y + (b.y - a.y) * q.t;
        const s = Math.max(0, q.t - 0.28);
        ctx.globalAlpha = 0.75 * o.alpha;
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * s, a.y + (b.y - a.y) * s); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = o.alpha;
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.2832); ctx.fill();
        keep.push(q);
      }
      this.pulses = keep.slice(-90);
      ctx.lineWidth = 1;
    }
    for (const p of pts) {
      if (p.glow > 0) {
        p.glow = Math.max(0, p.glow - dt / 700);
        ctx.globalAlpha = p.glow * 0.35 * o.alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 + p.glow * 9, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 0.85 * o.alpha;
      ctx.beginPath(); ctx.arc(p.x, p.y, o.mode === "layers" ? 3 : 1.8, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  spawn() {
    if (!this.pts.length) return;
    if (this.o.mode === "layers") {
      const starts = [];
      this.pts.forEach((p, i) => { if (p.layer === 0) starts.push(i); });
      if (starts.length) this.propagate(starts[Math.floor(Math.random() * starts.length)], this.o.layers.length - 1, this.pulses, true);
    } else if (this.edges.length) {
      const e = this.edges[Math.floor(Math.random() * this.edges.length)];
      const flip = Math.random() < 0.5;
      this.pulses.push({ a: flip ? e[0] : e[1], b: flip ? e[1] : e[0], t: 0, dur: 520 + Math.random() * 380, hops: 2 });
    }
  }
  propagate(from, hops, list, first) {
    const layered = this.o.mode === "layers";
    const outs = this.edges.filter((e) => (layered ? e[0] === from : (e[0] === from || e[1] === from)));
    if (!outs.length) return;
    const n = layered && first ? 2 : 1;
    for (let i = 0; i < n; i++) {
      if (!layered && Math.random() < 0.35) continue;
      const e = outs[Math.floor(Math.random() * outs.length)];
      const to = layered ? e[1] : (e[0] === from ? e[1] : e[0]);
      list.push({ a: from, b: to, t: 0, dur: layered ? 380 + Math.random() * 220 : 520 + Math.random() * 380, hops: hops });
    }
  }
  burst() {
    if (this.reduce || !this.pts.length) return;
    if (this.o.mode === "layers") {
      this.pts.forEach((p, i) => { if (p.layer === 0) { p.glow = 1; this.propagate(i, this.o.layers.length - 1, this.pulses, true); } });
    } else {
      for (let i = 0; i < 6; i++) this.spawn();
    }
    this.kick();
  }
  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    if (this.io) this.io.disconnect();
  }
}

const ASK_MIN = 0.08;
const STOP = new Set(("a an the and or but of to in on at for with by from about as is are was were be been am do does did have has had you your yours i me my we our it its this that these those what which who whom how why when where can could would should will shall may might there here any some tell please mahdi so if than then them they he his she her not no yes just also very much more most like get got go into out up work works worked working use used using know familiar built build "
  + "le la les un une des du de et ou mais en dans sur pour par avec sans au aux est sont etes es suis avez avons vous votre vos tu ton ta tes je mon ma mes nous notre il elle ils elles ce cet cette ces qui que qu quoi quel quelle quels quelles comment pourquoi quand ne pas plus se pouvez peux faire fait etre moi toi lui leur leurs tout tous ca cela travaille travailler travaillez travaillais utilise utilisez connaissez").split(" "));

const KB = [
  { t: ["Who I am", "Qui je suis"],
    x: ["I'm Mahdi Bel Haj Said, an AI engineer based in Tunis. I build generative-AI products and ship them to production: LLM agents, RAG systems, fine-tuned models and computer vision. I have 2+ years of software experience, including 1.5+ years shipping AI to production.",
      "Je suis Mahdi Bel Haj Said, ingénieur IA basé à Tunis. Je construis des produits d'IA générative et je les mets en production : agents LLM, systèmes RAG, modèles fine-tunés et vision par ordinateur. J'ai plus de 2 ans d'expérience en logiciel, dont plus de 1,5 an à mettre de l'IA en production."],
    kw: "who are you yourself introduce introduction summary profile background based experience years presentation profil parcours experience annees" },
  { t: ["The role I'm looking for", "Le poste que je recherche"],
    x: ["I'm looking for a full-time AI engineer role where I build LLM, agent and RAG products that real people use, in a team that moves fast and values initiative.",
      "Je recherche un poste d'ingénieur IA à temps plein où je construis des produits LLM, agents et RAG utilisés par de vraies personnes, dans une équipe qui avance vite et valorise l'initiative."],
    kw: "role job position looking seeking want hire hiring opportunity full-time fulltime poste recherche recherchez cherche emploi opportunite cdi" },
  { t: ["Relocation and availability", "Mobilité et disponibilité"],
    x: ["I'm open to relocation, France and Europe first, and I'm available immediately.",
      "Je suis ouvert à la mobilité, en priorité vers la France et l'Europe, et je suis disponible immédiatement."],
    kw: "relocate relocation move moving abroad visa france europe paris where location available availability start when notice immediately demenager demenagement mobilite partir etranger disponible disponibilite quand commencer" },
  { t: ["Long-term goals", "Objectifs à long terme"],
    x: ["Long term, I want to grow into a technical lead in AI: the person who connects business needs with the right technical solution, helps a team turn ideas into products, and mentors junior engineers.",
      "À long terme, je veux devenir lead technique en IA : la personne qui relie les besoins métier à la bonne solution technique, aide une équipe à transformer des idées en produits et accompagne les ingénieurs juniors."],
    kw: "future long term long-term career goal goals ambition lead leader plan five years see yourself avenir carriere objectif objectifs ambition terme" },
  { t: ["What I value in a team", "Ce que j'apprécie dans une équipe"],
    x: ["In a team, I value ownership, honest feedback, curiosity, and people who enjoy building together.",
      "Dans une équipe, j'apprécie l'autonomie et la responsabilité, les retours honnêtes, la curiosité, et les personnes qui aiment construire ensemble."],
    kw: "value values culture environment company ideal workplace valeurs culture entreprise environnement ideal" },
  { t: ["AI Poster Studio", "AI Poster Studio"],
    x: ["AI Poster Studio is the project I'm proudest of. It turns a single JSON brief into a publish-ready esports poster in about a minute, for $0.10 per poster: GPT-4o Vision writes the image prompt and gpt-image-2 composes the design, on top of backgrounds from Qwen-Image, a 20B diffusion model I fine-tuned with LoRA and served on RunPod serverless GPUs.",
      "AI Poster Studio est le projet dont je suis le plus fier. Il transforme un simple brief JSON en affiche esport prête à publier en environ une minute, pour 0,10 $ par affiche : GPT-4o Vision rédige le prompt image et gpt-image-2 compose le visuel, sur des arrière-plans générés par Qwen-Image, un modèle de diffusion de 20 Md de paramètres que j'ai fine-tuné avec LoRA et servi sur des GPU serverless RunPod."],
    kw: "poster studio image generation generative diffusion lora fine-tuning finetuning finetune qwen gpt-4o gpt-image runpod gpu proud proudest best favorite favourite project affiche fier meilleur prefere projet" },
  { t: ["Shipping it as a SaaS", "Livré en SaaS"],
    x: ["I shipped AI Poster Studio end to end as a multi-tenant SaaS (FastAPI, RQ/Redis, MongoDB, Cloudflare R2, React). It is live on Defendr's platform, its first-month revenue covered the full development cost, and API access was sold to an external client.",
      "J'ai livré AI Poster Studio de bout en bout en SaaS multi-tenant (FastAPI, RQ/Redis, MongoDB, Cloudflare R2, React). Il est en ligne sur la plateforme Defendr, le chiffre d'affaires du premier mois a couvert tout le coût de développement, et un accès API a été vendu à un client externe."],
    kw: "saas revenue money business impact roi profit cost client customer sold api production architecture backend scale multi-tenant chiffre affaires rentable rentabilite" },
  { t: ["Scout, an LLM agent", "Scout, un agent LLM"],
    x: ["Scout is a production LLM agent (Groq, gpt-oss-20B) that replaces manual organisation and tournament-creation forms with a conversation, and answers esports and platform questions grounded in Defendr's FAQ and live data with RAG.",
      "Scout est un agent LLM en production (Groq, gpt-oss-20B) qui remplace les formulaires de création d'organisations et de tournois par une conversation, et répond aux questions esport et plateforme à partir de la FAQ et des données en temps réel de Defendr, avec du RAG."],
    kw: "scout agent agents llm llms chatbot assistant conversation conversational groq gpt-oss tools function calling rag retrieval agentique" },
  { t: ["PDF-to-Excel automation", "Automatisation PDF vers Excel"],
    x: ["At SCP, I built a PDF-to-Excel tool for invoices and import/export files: Tesseract OCR, classification of the extracted data and automatic Excel filling, with an optional human-validation step. It reached 99.7% accuracy and processes 100 documents in 20 minutes.",
      "Chez SCP, j'ai construit un outil PDF vers Excel pour les factures et les dossiers import/export : OCR Tesseract, classification des données extraites et remplissage automatique d'Excel, avec une validation humaine optionnelle. Il atteint 99,7 % d'exactitude et traite 100 documents en 20 minutes."],
    kw: "ocr pdf excel invoice invoices document documents automation extraction tesseract accuracy scp factures automatisation" },
  { t: ["AWS deployment and RAG chatbot", "Déploiement AWS et chatbot RAG"],
    x: ["I deployed that system as a 3-tier app (FastAPI backend, React frontend, PostgreSQL) on AWS (VPC, EC2, S3, IAM), and integrated an employee chatbot (OpenAI API + ChromaDB RAG) that answers from the company's documents and database, with guardrails that keep it work-related.",
      "J'ai déployé ce système en application 3-tiers (backend FastAPI, frontend React, PostgreSQL) sur AWS (VPC, EC2, S3, IAM), et intégré un chatbot employés (API OpenAI + RAG ChromaDB) qui répond à partir des documents et de la base de données de l'entreprise, avec des garde-fous."],
    kw: "aws cloud deploy deployment devops ec2 s3 chatbot rag chromadb vector database openai guardrails postgresql deploiement" },
  { t: ["AI highlight generator", "Générateur de highlights par IA"],
    x: ["At Gamefy Academy, I built an AI highlight generator: Whisper speech-to-text, event detection and semantic search with sentence-transformers over match transcripts, then automatic highlight reels from Twitch VODs. It cut manual review time by about 70%.",
      "Chez Gamefy Academy, j'ai construit un générateur de highlights par IA : speech-to-text avec Whisper, détection d'événements et recherche sémantique avec sentence-transformers sur les transcriptions, puis montage automatique à partir des VOD Twitch. Il a réduit le temps de revue manuelle d'environ 70 %."],
    kw: "highlight highlights video videos whisper speech audio transcription nlp bart sentence-transformers embeddings semantic search twitch gamefy vod montage" },
  { t: ["Computer vision: match results", "Vision par ordinateur : résultats de matchs"],
    x: ["I built a computer-vision module (OpenCV preprocessing, YOLOv8 detection) that reads the match winner from user screenshots with 88% accuracy, adapted to each game's result screen and served through FastAPI.",
      "J'ai construit un module de vision par ordinateur (prétraitement OpenCV, détection YOLOv8) qui identifie le vainqueur d'un match à partir des captures d'écran des joueurs avec 88 % d'exactitude, adapté à chaque jeu et servi via FastAPI."],
    kw: "computer vision yolo yolov8 opencv object detection image images screenshot screenshots vision ordinateur" },
  { t: ["Web3 and gamification", "Web3 et gamification"],
    x: ["At Defendr, I also implemented wallet-to-crypto conversion through NFTs (Solidity smart contracts, ethers.js) with gas-fee handling, and a gamification module that rewards users through external game APIs.",
      "Chez Defendr, j'ai aussi implémenté la conversion des soldes du portefeuille en cryptomonnaie via des NFT (smart contracts Solidity, ethers.js) avec gestion des frais de gaz, et un module de gamification qui récompense les utilisateurs via des API de jeux externes."],
    kw: "web3 blockchain crypto cryptocurrency nft nfts solidity smart contract contracts ethers gamification wallet" },
  { t: ["Document processing at Carthage Industries", "Traitement de documents chez Carthage Industries"],
    x: ["At Carthage Industries, I built an automated document-processing system (Python, OCR, NLP) that extracts, validates and organises business documents, cutting manual data entry by 60%.",
      "Chez Carthage Industries, j'ai développé un système automatisé de traitement de documents (Python, OCR, NLP) qui extrait, valide et organise les documents métier, réduisant la saisie manuelle de 60 %."],
    kw: "carthage industries python nlp document processing data entry saisie" },
  { t: ["Anomaly detection at ACTIA", "Détection d'anomalies chez ACTIA"],
    x: ["At ACTIA, I built a Random Forest model (scikit-learn) that flags anomalies in system logs with 71% precision, and I ran hardware diagnostics and electronic-board testing.",
      "Chez ACTIA, j'ai développé un modèle Random Forest (scikit-learn) qui signale les anomalies dans les logs système avec 71 % de précision, et j'ai réalisé des diagnostics matériels et des tests de cartes électroniques."],
    kw: "actia anomaly anomalies detection random forest machine learning logs embedded hardware electronics embarque materiel" },
  { t: ["Android travel planner", "Planificateur de voyages Android"],
    x: ["At HOTIX, I built an Android travel-planning app in Java that uses the A* algorithm to optimise itineraries for budget, time and destination.",
      "Chez HOTIX, j'ai développé une application Android de planification de voyages en Java, qui utilise l'algorithme A* pour optimiser l'itinéraire selon le budget, le temps et la destination."],
    kw: "hotix android mobile app java travel trip algorithm algorithms itinerary voyage application algorithme" },
  { t: ["Generative AI skills", "Compétences en IA générative"],
    x: ["On the generative-AI side, I work with LLMs, LLM agents, RAG, LoRA fine-tuning, diffusion models, GPT-4o Vision, prompt engineering, LangChain, the OpenAI API, Groq and LLM evaluation.",
      "Côté IA générative, je travaille avec les LLM, les agents LLM, le RAG, le fine-tuning LoRA, les modèles de diffusion, GPT-4o Vision, le prompt engineering, LangChain, l'API OpenAI, Groq et l'évaluation de LLM."],
    kw: "generative genai gen llm llms langchain prompt engineering evaluation skills competences generative" },
  { t: ["Machine learning skills", "Compétences en machine learning"],
    x: ["For machine learning, I use PyTorch, Hugging Face Transformers, sentence-transformers, Whisper, YOLOv8, OpenCV, MediaPipe, scikit-learn and Tesseract OCR, across deep learning, NLP and computer vision.",
      "En machine learning, j'utilise PyTorch, Hugging Face Transformers, sentence-transformers, Whisper, YOLOv8, OpenCV, MediaPipe, scikit-learn et Tesseract OCR, en deep learning, NLP et vision par ordinateur."],
    kw: "machine learning ml deep learning pytorch hugging face frameworks skills competences apprentissage automatique" },
  { t: ["My tech stack", "Ma stack technique"],
    x: ["My go-to stack: Python and FastAPI for services, React or Next.js for the product, PostgreSQL, MongoDB, Redis and ChromaDB for data, and AWS, Docker, RunPod, GitHub Actions and Jenkins to ship it. I also code in TypeScript, JavaScript, C++, Java and SQL.",
      "Ma stack de prédilection : Python et FastAPI pour les services, React ou Next.js pour le produit, PostgreSQL, MongoDB, Redis et ChromaDB pour les données, et AWS, Docker, RunPod, GitHub Actions et Jenkins pour livrer. Je code aussi en TypeScript, JavaScript, C++, Java et SQL."],
    kw: "stack tech technical technologies tools backend frontend web cloud devops docker database databases sql programming coding code languages python typescript technique outils technologies langages programmation" },
  { t: ["Education", "Formation"],
    x: ["I hold an engineering degree in Computer Science (MSc equivalent) from the University of Tunis El Manar. In my bachelor's in Computer Engineering, I ranked 8th out of 110, and my final-year project earned a high distinction.",
      "Je suis diplômé ingénieur en informatique (équivalent Master) de l'Université de Tunis El Manar. En licence de génie informatique, j'ai été classé 8e sur 110, et mon projet de fin d'études a obtenu la mention Très Bien."],
    kw: "education degree degrees master masters msc engineering diploma university school bachelor grades rank ranking gpa transcript transcripts studies diplome etudes universite licence classement notes releve formation ingenieur" },
  { t: ["Working while studying", "Travailler pendant mes études"],
    x: ["Attendance wasn't mandatory in my engineering programme, so I worked during the day and studied on my own in the evenings. That's how I built 2+ years of real experience while completing my degree.",
      "La présence n'était pas obligatoire dans mon cycle d'ingénieur : je travaillais la journée et j'étudiais en autonomie le soir. C'est ainsi que j'ai acquis plus de 2 ans d'expérience concrète tout en terminant mon diplôme."],
    kw: "while studying study student master masters same time attendance evening evenings night both school how manage balance pendant etudes etudier etudiant presence soir nuit master meme temps" },
  { t: ["Languages", "Langues"],
    x: ["I speak Arabic (native), French (C1), English (C1) and some Spanish (A2).",
      "Je parle arabe (langue maternelle), français (C1), anglais (C1) et un peu espagnol (A2)."],
    kw: "language languages speak speaking spoken fluent french english arabic spanish level langue langues parle parler francais anglais arabe espagnol niveau" },
  { t: ["References", "Références"],
    x: ["Two supervisors recommended me in writing: Mottaki Hajouni, CEO of Defendr, highlighted my autonomy, professionalism and adaptability, and Sami Boukesra at ACTIA highlighted my work ethic, eye for detail and quick learning. Both letters are in the References section.",
      "Deux encadrants m'ont recommandé par écrit : Mottaki Hajouni, CEO de Defendr, a souligné mon autonomie, mon professionnalisme et mon adaptabilité, et Sami Boukesra, chez ACTIA, mon éthique de travail, mon souci du détail et ma rapidité d'apprentissage. Les deux lettres sont dans la section Références."],
    kw: "reference references recommendation recommendations letter letters supervisor supervisors manager referee testimonial recommandation recommandations lettre lettres encadrant" },
  { t: ["Certifications", "Certifications"],
    x: ["My certifications: AI Fundamentals with IBM SkillsBuild, Aviatrix Multicloud Network Associate (ACE), and the AWS Academy Cloud Foundations and Cloud Security Foundations courses.",
      "Mes certifications : AI Fundamentals with IBM SkillsBuild, Aviatrix Multicloud Network Associate (ACE), et les cours AWS Academy Cloud Foundations et Cloud Security Foundations."],
    kw: "certification certifications certificate certificates certified course courses ibm aviatrix badge badges certificat certificats cours" },
  { t: ["Strengths", "Points forts"],
    x: ["My strengths: I'm autonomous and proactive. Give me a task and I'll usually come back with a way to make it better; give me a problem and I'll own it end to end, from first commit to production.",
      "Mes points forts : je suis autonome et proactif. Confiez-moi une tâche et je reviendrai souvent avec une façon de l'améliorer ; confiez-moi un problème et je m'en charge de bout en bout, du premier commit à la production."],
    kw: "strength strengths soft skills personality autonomous autonomy proactive initiative ownership qualities quality forces force qualites qualite autonome personnalite" },
  { t: ["Working with people", "Travailler avec les autres"],
    x: ["As a teammate, I read the room quickly, adapt to any team (startups, industrial companies, technical or business, on-site or remote) and explain technical things in plain words. People enjoy working with me.",
      "En équipe, je sens vite l'ambiance, je m'adapte à toute équipe (startups, industrie, technique ou métier, sur site ou à distance) et j'explique la technique avec des mots simples. On aime travailler avec moi."],
    kw: "teammate teammates teamwork team colleague colleagues people communication collaboration emotional intelligence remote equipe coequipier esprit equipe collegue collegues communication collaboration distance relationnel" },
  { t: ["How I ship", "Comment je livre"],
    x: ["My process: understand the real need, prototype fast, measure and fix failures, then ship to real users and keep it reliable. I care less about the hype and more about what works.",
      "Ma méthode : comprendre le vrai besoin, prototyper vite, mesurer et corriger les échecs, puis livrer à de vrais utilisateurs et garder le système fiable. Le buzz m'intéresse moins que ce qui marche."],
    kw: "process method methodology approach workflow ship shipping deliver philosophy hype methode approche livrer philosophie" },
  { t: ["Chess", "Échecs"],
    x: ["I play chess and have reached 1400 Elo in rapid. There's a mate-in-one puzzle in my Hobbies section if you want to test yourself.",
      "Je joue aux échecs et j'ai atteint 1400 Elo en partie rapide. Un problème de mat en un coup vous attend dans la section Loisirs."],
    kw: "chess elo rapid rating puzzle hobby hobbies echecs loisir loisirs" },
  { t: ["Esports", "Esport"],
    x: ["I played League of Legends professionally, in national and international tournaments with several teams. Today I build AI for esports.",
      "J'ai joué à League of Legends en professionnel, dans des tournois nationaux et internationaux avec plusieurs équipes. Aujourd'hui, je construis de l'IA pour l'esport."],
    kw: "esports esport gaming games gamer video league legends lol pro professional player tournament tournaments jeux jeu joueur tournoi tournois" },
  { t: ["Swimming and handiwork", "Natation et bricolage"],
    x: ["I took swimming courses for three years, and since I was a kid I've spent my days off working alongside my father, a plumber with over 40 years of experience.",
      "J'ai suivi trois ans de cours de natation, et depuis tout petit je passe mes jours de repos à travailler avec mon père, plombier depuis plus de 40 ans."],
    kw: "hobby hobbies free time sport sports swimming swim handiwork diy plumber plumbing father family weekend loisir loisirs natation nager bricolage plombier pere famille" },
  { t: ["Contact", "Contact"],
    x: ["The easiest way to reach me is mahdi.haj.said@gmail.com or +216 26 957 057. I'm also on LinkedIn and GitHub as Mahdi Bel Haj Said.",
      "Le plus simple pour me joindre : mahdi.haj.said@gmail.com ou +216 26 957 057. Je suis aussi sur LinkedIn et GitHub sous le nom Mahdi Bel Haj Said."],
    kw: "contact email mail e-mail phone number call reach linkedin interview telephone joindre appeler numero entretien" },
  { t: ["Side projects on GitHub", "Projets perso sur GitHub"],
    x: ["On my GitHub, you'll find a real-time sign-language recognition system (TensorFlow, OpenCV, MediaPipe), a GPRS driver for STM32 boards, a secure 3-tier deployment on AWS, a CloudSim task-scheduling study and a Jenkins CI/CD pipeline monitored with Grafana and Prometheus.",
      "Sur mon GitHub : un système de reconnaissance de la langue des signes en temps réel (TensorFlow, OpenCV, MediaPipe), un driver GPRS pour cartes STM32, un déploiement 3-tiers sécurisé sur AWS, une étude d'ordonnancement de tâches avec CloudSim et un pipeline CI/CD Jenkins supervisé avec Grafana et Prometheus."],
    kw: "github open source side projects personal repositories repos tensorflow sign mediapipe stm32 embedded jenkins ci cd projets perso depots" },
  { t: ["Results in numbers", "Résultats en chiffres"],
    x: ["Some numbers: 99.7% accuracy on document extraction, 88% accuracy on match-result detection, about 70% less manual review time, 60% less manual data entry, and $0.10 per AI-generated poster.",
      "Quelques chiffres : 99,7 % d'exactitude en extraction de documents, 88 % en détection de résultats de matchs, environ 70 % de temps de revue manuelle en moins, 60 % de saisie manuelle en moins, et 0,10 $ par affiche générée par IA."],
    kw: "numbers metrics results result impact accuracy kpi performance achievements achievement chiffres resultats resultat realisations" },
  { t: ["Why hire me", "Pourquoi moi"],
    x: ["Why me? I ship AI that works in production and pays for itself, I measure what I build, and I'm easy to work with: two supervisors recommended me in writing.",
      "Pourquoi moi ? Je livre de l'IA qui fonctionne en production et qui se rentabilise, je mesure ce que je construis, et on travaille facilement avec moi : deux encadrants m'ont recommandé par écrit."],
    kw: "why hire hiring choose should different unique value pitch convince best candidate embaucher recruter choisir candidat" },
  { t: ["Easter eggs", "Easter eggs"],
    x: ["There's a terminal behind the >_ button in the menu. Type help, try sudo hire mahdi, and whatever you do, don't run sudo rm -rf /.",
      "Un terminal se cache derrière le bouton >_ du menu. Tapez help, essayez sudo hire mahdi, et surtout, ne lancez jamais sudo rm -rf /."],
    kw: "easter egg eggs secret secrets hidden terminal fun joke surprise cli command commands shell oeuf paques cache blague commande" }
];

function normTxt(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function tokens(s) {
  return normTxt(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
}
function stem(w) {
  if (w.length > 3 && w.charAt(w.length - 1) === "s" && w.charAt(w.length - 2) !== "s") w = w.slice(0, -1);
  return w.length > 6 ? w.slice(0, 6) : w;
}
const IDX = {};
function getIndex(lang) {
  if (IDX[lang]) return IDX[lang];
  const li = lang === "fr" ? 1 : 0;
  const tfs = KB.map((d) => {
    const tf = {};
    tokens(d.t[li] + " " + d.x[li] + " " + d.kw).forEach((w) => { const s = stem(w); tf[s] = (tf[s] || 0) + 1; });
    return tf;
  });
  const df = {};
  tfs.forEach((tf) => { Object.keys(tf).forEach((s) => { df[s] = (df[s] || 0) + 1; }); });
  const N = tfs.length;
  const idf = {};
  Object.keys(df).forEach((s) => { idf[s] = Math.log((N + 1) / (df[s] + 1)) + 1; });
  const vecs = tfs.map((tf) => {
    const v = {};
    let norm = 0;
    Object.keys(tf).forEach((s) => { const w = (1 + Math.log(tf[s])) * idf[s]; v[s] = w; norm += w * w; });
    return { v: v, norm: Math.sqrt(norm) || 1 };
  });
  IDX[lang] = { vecs: vecs, idf: idf, vocab: Object.keys(df).length };
  return IDX[lang];
}
function retrieve(q, lang) {
  const ix = getIndex(lang);
  const toks = tokens(q);
  const qtf = {};
  toks.forEach((w) => { const s = stem(w); qtf[s] = (qtf[s] || 0) + 1; });
  const qv = {};
  let qn = 0;
  Object.keys(qtf).forEach((s) => { if (ix.idf[s]) { const w = (1 + Math.log(qtf[s])) * ix.idf[s]; qv[s] = w; qn += w * w; } });
  qn = Math.sqrt(qn) || 1;
  const known = Object.keys(qv);
  const scored = ix.vecs.map((d, i) => {
    let dot = 0;
    known.forEach((s) => { if (d.v[s]) dot += qv[s] * d.v[s]; });
    return { i: i, score: dot / (qn * d.norm) };
  });
  scored.sort((a, b) => b.score - a.score);
  return { tokens: toks, known: known, top: scored.slice(0, 3) };
}

const GRAPH = [
  ["PyTorch", "LoRA", "GPT-4o Vision", "RunPod", "FastAPI", "RQ/Redis", "MongoDB", "Cloudflare R2", "React"],
  ["Groq", "LLM agents", "RAG", "FastAPI"],
  ["Tesseract OCR", "FastAPI", "React", "PostgreSQL", "AWS", "OpenAI API", "ChromaDB", "RAG"],
  ["Whisper", "BART", "sentence-transformers", "Hugging Face", "FastAPI", "Twitch API"],
  ["YOLOv8", "OpenCV", "FastAPI"]
];
let GLAYOUT = null;
function graphLayout() {
  if (GLAYOUT) return GLAYOUT;
  const W = 1000, H = 580;
  const py = GRAPH.map((_, i) => 70 + i * 110);
  const skills = [];
  const seen = {};
  GRAPH.forEach((list, pi) => {
    list.forEach((name) => {
      if (!(name in seen)) { seen[name] = skills.length; skills.push({ name: name, projects: [] }); }
      skills[seen[name]].projects.push(pi);
    });
  });
  skills.forEach((s) => { s.b = s.projects.reduce((a, pi) => a + py[pi], 0) / s.projects.length; });
  const order = skills.slice().sort((a, b) => a.b - b.b);
  const cols = [[], []];
  order.forEach((s, k) => { cols[k % 2].push(s); });
  cols.forEach((col, ci) => {
    col.forEach((s, k) => {
      s.x = ci === 0 ? 250 : 750;
      s.y = col.length > 1 ? 40 + (H - 80) * k / (col.length - 1) : H / 2;
      s.side = ci === 0 ? "l" : "r";
    });
  });
  const edges = [];
  skills.forEach((s, si) => {
    s.projects.forEach((pi) => {
      const mx = (s.x + 500) / 2;
      edges.push({ si: si, pi: pi, d: "M" + s.x + " " + s.y.toFixed(1) + " C" + mx + " " + s.y.toFixed(1) + " " + mx + " " + py[pi] + " 500 " + py[pi] });
    });
  });
  GLAYOUT = { W: W, H: H, py: py, skills: skills, edges: edges, allD: edges.map((e) => e.d).join(" ") };
  return GLAYOUT;
}

const CHESS = { g1: "wK", d1: "wR", c3: "wN", c4: "wB", a2: "wP", b2: "wP", f2: "wP", g2: "wP", h2: "wP", g8: "bK", a7: "bP", b7: "bP", f7: "bP", g7: "bP", h7: "bP", b5: "bN", a4: "bR" };
const GLYPH = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" };
function pieceName(pc, fr) {
  const k = pc.charAt(1), white = pc.charAt(0) === "w";
  if (!fr) return (white ? "white " : "black ") + ({ K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight", P: "pawn" })[k];
  const n = ({ K: ["roi", 0], Q: ["dame", 1], R: ["tour", 1], B: ["fou", 0], N: ["cavalier", 0], P: ["pion", 0] })[k];
  return n[0] + " " + (white ? (n[1] ? "blanche" : "blanc") : (n[1] ? "noire" : "noir"));
}
const CONFETTI = (function () {
  const cols = ["#8B7CFF", "#4ADE80", "#FBBF24", "#F87171", "#22D3EE", "#FFFFFF"];
  const out = [];
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2, d = 110 + (k % 3) * 45;
    out.push("background: " + cols[k % cols.length] + "; --dx: " + Math.round(Math.cos(a) * d) + "px; --dy: " + Math.round(Math.sin(a) * d - 30) + "px; --r: " + ((k * 67) % 360) + "deg; animation-delay: " + ((k % 4) * 0.05).toFixed(2) + "s;");
  }
  return out;
})();

const CV_EN = "assets/docs/Mahdi-Bel-Haj-Said-Resume-EN.pdf";
const CV_FR = "assets/docs/Mahdi-Bel-Haj-Said-CV-FR.pdf";
const TERM_CMDS = ["help", "whoami", "projects", "skills", "ask ", "cv", "contact", "open ", "theme ", "lang ", "clear", "exit", "sudo hire mahdi", "date", "ls", "chess"];
const TERM_CRASH = [
  "rm: removing '/portfolio/projects/ai-poster-studio'",
  "rm: removing '/portfolio/skills/pytorch'",
  "rm: removing '/portfolio/references'",
  "rm: cannot remove '/mahdi/curiosity': Resource busy",
  "rm: removing '/portfolio/chess/1400-elo'",
  "warning: deleting '/self-confidence' failed (too much of it)",
  "rm: removing '/portfolio/cv.pdf'",
  "kernel: model weights drifting...",
  "rm: removing '/portfolio/esports/league-of-legends'",
  "fatal: stack overflow in '/mahdi/ideas'"
];
const TERM = {
  en: {
    title: "mahdi@portfolio: ~", btnLabel: "Open the terminal", closeLabel: "Close the terminal", inputLabel: "Terminal command", placeholder: "type help", footer: "try the terminal",
    welcome: ["Portfolio OS 2.6 · interactive shell", "Type help to see what you can do. Try: ask can you relocate?"],
    autoHint: "Your turn: type help to see everything. Close me anytime with ×, I'll wait in the >_ button.",
    help: [
      "Available commands:",
      "  whoami             who I am",
      "  projects           what I've shipped",
      "  skills             my stack",
      "  ask <question>     query my CV (mini RAG)",
      "  cv                 download my CV",
      "  contact            how to reach me",
      "  open <section>     jump to projects, skills, chess...",
      "  theme light|dark   switch the theme",
      "  lang en|fr         switch the language",
      "  clear | exit       tidy up",
      "  sudo hire mahdi    the best command in here",
      "  sudo rm -rf /      never, ever run this"
    ],
    whoami: [
      "Mahdi Bel Haj Said",
      "AI Engineer · Generative AI, LLM agents & RAG, computer vision",
      "Based in Tunis · open to relocation (France & Europe first) · available now",
      "I build AI that people actually use, and that pays for itself."
    ],
    ls: "projects/  skills/  cv.pdf  contact.txt  secrets/",
    projects: [
      "ai-poster-studio/     JSON brief → esports poster in ~1 min, $0.10 each",
      "scout/                production LLM agent (Groq, RAG)",
      "doc-automation/       99.7% accuracy · 100 docs in 20 min",
      "highlight-generator/  ~70% less manual review time",
      "match-vision/         88% accuracy on real screenshots",
      "Tip: open projects"
    ],
    skills: [
      "genai    LLMs, agents, RAG, LoRA, diffusion, GPT-4o Vision, LangChain, Groq",
      "ml       PyTorch, Hugging Face, Whisper, YOLOv8, OpenCV, scikit-learn",
      "backend  Python, FastAPI, Node.js, React, Next.js, TypeScript",
      "data     PostgreSQL, MongoDB, Redis, ChromaDB",
      "cloud    AWS, Docker, RunPod, GitHub Actions, Jenkins, Linux"
    ],
    askUsage: "Usage: ask <question>    e.g. ask can you relocate?",
    askNone: "Not in my CV, and I won't make it up. Try another question.",
    source: "source", cv: "Here you go:", contact: "Reach me here:",
    hireDenied: "hire: permission denied. Try: sudo hire mahdi",
    hire: [
      "[sudo] password for recruiter: ********",
      "Verifying candidate... autonomy ✓  curiosity ✓  ships to production ✓",
      "Permission granted. Scheduling interview...",
      "Done. Click below to send the invite:"
    ],
    hireSubject: "Interview invitation",
    rmStart: "rm: deleting the entire portfolio... (you were warned)",
    rmDenied: "rm: cannot remove: Permission denied. You'd need sudo... but please don't.",
    sudo: "With great power comes great responsibility. Try: sudo hire mahdi",
    themeOk: "Theme set to {t}.", langOk: "Language set to English.",
    opening: "Opening", noSection: "open: no section called '{s}'. Try: projects, skills, experience, references, chess, contact",
    chess: "Board's ready. White to play and mate in one.",
    date: "Tunis time:",
    secrets: "secrets/: nothing here. The only secret: I write tests.",
    coffee: "Error 418: I'm a teapot. (Coffee is for interview day.)",
    hello: "Hi! Type help to see what you can do.",
    notFound: "command not found: {c}. Type help.",
    crashLines: TERM_CRASH,
    crashTitle: "MODEL COLLAPSE",
    crashErr: "Error 418: too much talent detected in a single candidate.",
    crashText: "The portfolio overfit on one candidate and stopped generalising. Rebuilding from scratch.",
    crashProg: "Rebuilding portfolio... {p}%",
    crashCode: ["error_code   0x418 TOO_MUCH_TALENT", "module       mahdi.exe", "suggestion   hire_and_reboot()"],
    skip: "Skip",
    revealKicker: "$ sudo rm -rf /  ·  exit code 0",
    revealTitle: "Relax, nothing broke.",
    revealText: "Your computer is fine, and so is my portfolio: I test my code before it ships.",
    revealText2: "Thanks for being curious enough to run that. Curiosity is exactly what I look for in a team.",
    revealBuilt: "See what I actually built", revealTalk: "Let's talk", revealClose: "Close"
  },
  fr: {
    title: "mahdi@portfolio: ~", btnLabel: "Ouvrir le terminal", closeLabel: "Fermer le terminal", inputLabel: "Commande du terminal", placeholder: "tapez help", footer: "essayez le terminal",
    welcome: ["Portfolio OS 2.6 · terminal interactif", "Tapez help pour voir ce que vous pouvez faire. Essayez : ask pouvez-vous déménager ?"],
    autoHint: "À vous : tapez help pour tout voir. Fermez-moi quand vous voulez avec ×, je vous attends dans le bouton >_.",
    help: [
      "Commandes disponibles :",
      "  whoami             qui je suis",
      "  projects           ce que j'ai livré",
      "  skills             ma stack",
      "  ask <question>     interroger mon CV (mini RAG)",
      "  cv                 télécharger mon CV",
      "  contact            me contacter",
      "  open <section>     aller à projects, skills, chess...",
      "  theme light|dark   changer de thème",
      "  lang en|fr         changer de langue",
      "  clear | exit       faire le ménage",
      "  sudo hire mahdi    la meilleure commande ici",
      "  sudo rm -rf /      surtout, ne lancez jamais ça"
    ],
    whoami: [
      "Mahdi Bel Haj Said",
      "Ingénieur IA · IA générative, agents LLM & RAG, vision par ordinateur",
      "Basé à Tunis · mobilité internationale (France & Europe en priorité) · disponible",
      "Je construis une IA que les gens utilisent vraiment, et qui se rentabilise."
    ],
    ls: "projects/  skills/  cv.pdf  contact.txt  secrets/",
    projects: [
      "ai-poster-studio/     brief JSON → affiche esport en ~1 min, 0,10 $ l'unité",
      "scout/                agent LLM en production (Groq, RAG)",
      "doc-automation/       99,7 % d'exactitude · 100 docs en 20 min",
      "highlight-generator/  ~70 % de temps de revue en moins",
      "match-vision/         88 % d'exactitude sur de vraies captures",
      "Astuce : open projects"
    ],
    skills: [
      "genai    LLM, agents, RAG, LoRA, diffusion, GPT-4o Vision, LangChain, Groq",
      "ml       PyTorch, Hugging Face, Whisper, YOLOv8, OpenCV, scikit-learn",
      "backend  Python, FastAPI, Node.js, React, Next.js, TypeScript",
      "data     PostgreSQL, MongoDB, Redis, ChromaDB",
      "cloud    AWS, Docker, RunPod, GitHub Actions, Jenkins, Linux"
    ],
    askUsage: "Usage : ask <question>    ex. ask pouvez-vous déménager ?",
    askNone: "Pas dans mon CV, et je n'invente rien. Essayez une autre question.",
    source: "source", cv: "Et voilà :", contact: "Pour me joindre :",
    hireDenied: "hire : permission refusée. Essayez : sudo hire mahdi",
    hire: [
      "[sudo] mot de passe pour recruteur : ********",
      "Vérification du candidat... autonomie ✓  curiosité ✓  livre en production ✓",
      "Permission accordée. Planification de l'entretien...",
      "Terminé. Cliquez ci-dessous pour envoyer l'invitation :"
    ],
    hireSubject: "Invitation à un entretien",
    rmStart: "rm : suppression de tout le portfolio... (vous étiez prévenu)",
    rmDenied: "rm : suppression impossible : permission refusée. Il faudrait sudo... mais s'il vous plaît, non.",
    sudo: "Un grand pouvoir implique de grandes responsabilités. Essayez : sudo hire mahdi",
    themeOk: "Thème : {t}.", langOk: "Langue : français.",
    opening: "Ouverture de", noSection: "open : aucune section « {s} ». Essayez : projects, skills, experience, references, chess, contact",
    chess: "L'échiquier est prêt. Les Blancs matent en un coup.",
    date: "Heure de Tunis :",
    secrets: "secrets/ : rien ici. Le seul secret : j'écris des tests.",
    coffee: "Erreur 418 : je suis une théière. (Le café, c'est pour le jour de l'entretien.)",
    hello: "Bonjour ! Tapez help pour voir ce que vous pouvez faire.",
    notFound: "commande introuvable : {c}. Tapez help.",
    crashLines: TERM_CRASH,
    crashTitle: "MODEL COLLAPSE",
    crashErr: "Erreur 418 : trop de talent détecté chez un seul candidat.",
    crashText: "Le portfolio a surappris sur un seul candidat et ne généralise plus. Reconstruction en cours.",
    crashProg: "Reconstruction du portfolio... {p} %",
    crashCode: ["error_code   0x418 TOO_MUCH_TALENT", "module       mahdi.exe", "suggestion   hire_and_reboot()"],
    skip: "Passer",
    revealKicker: "$ sudo rm -rf /  ·  exit code 0",
    revealTitle: "Pas de panique, rien n'est cassé.",
    revealText: "Votre ordinateur va bien, et mon portfolio aussi : je teste mon code avant de le livrer.",
    revealText2: "Merci d'avoir eu la curiosité de lancer ça. C'est exactement ce que je recherche dans une équipe.",
    revealBuilt: "Voir ce que j'ai vraiment construit", revealTalk: "Parlons-en", revealClose: "Fermer"
  }
};

const LETTERS = [
  { pdf: "assets/docs/Recommendation-Defendr-Mahdi-Bel-Haj-Said.pdf", img: "assets/img/letter-defendr.jpg", file: "Recommendation-Defendr-Mahdi-Bel-Haj-Said.pdf", name: "Mottaki Hajouni", initials: "MH", tilt: "rotate(-3deg)",
    quote: "Mahdi distinguished himself through his autonomy, professionalism, and ability to adapt.",
    quote2: "He integrates quickly into a team and communicates naturally with people from different backgrounds, profiles, and personalities." },
  { pdf: "assets/docs/Recommendation-ACTIA-Mahdi-Bel-Haj-Said.pdf", img: "assets/img/letter-actia.jpg", file: "Recommendation-ACTIA-Mahdi-Bel-Haj-Said.pdf", name: "Sami Boukesra", initials: "SB", tilt: "rotate(2.5deg)",
    quote: "Mahdi consistently demonstrated a strong work ethic, a keen eye for detail, and a quick learning ability.",
    quote2: "He was always willing to lend a hand, collaborate with colleagues, and actively seek out new challenges." }
];

const CERTS = [
  { title: "AI Fundamentals with IBM SkillsBuild", issuer: "IBM SkillsBuild · Cisco Networking Academy", kind: "cert", img: "assets/img/cert-ibm-ai.jpg", full: "assets/img/cert-ibm-ai.jpg", bg: "#FFFFFF" },
  { title: "Multicloud Network Associate (ACE)", issuer: "Aviatrix", kind: "cert", img: "assets/img/cert-aviatrix.png", full: "assets/img/cert-aviatrix-full.jpg", bg: "#111216" },
  { title: "AWS Cloud Foundations", issuer: "AWS Academy", kind: "course", img: "assets/img/cert-aws-foundations.png", full: "assets/img/cert-aws-foundations.png", bg: "#FFFFFF" },
  { title: "AWS Cloud Security Foundations", issuer: "AWS Academy", kind: "course", img: "assets/img/cert-aws-security.png", full: "assets/img/cert-aws-security.png", bg: "#FFFFFF" }
];

const REPOS = [
  { slug: "Sign-Language-Recognition-and-Translation-System", name: "Sign Language Recognition", lang: "Python", color: "#3572A5" },
  { slug: "GPRS-Driver-for-STM32", name: "GPRS Driver for STM32", lang: "C", color: "#A8B9CC" },
  { slug: "Web-Application-Deployement-in-AWS-", name: "3-tier App on AWS", lang: "AWS", color: "#FF9900" },
  { slug: "CloudSim-Task-Scheduling-Optimization-for-Multiprocessor-Systems", name: "CloudSim Task Scheduling", lang: "Java", color: "#B07219" },
  { slug: "DevOps-CI-CD-Pipeline-", name: "DevOps CI/CD Pipeline", lang: "Java", color: "#B07219" },
  { slug: "Travel-management-application-", name: "Travel Management App", lang: "Web", color: "#22D3EE" }
];

const STRINGS = {
  en: {
    nav: [
      { href: "#about", label: "About" }, { href: "#projects", label: "Projects" },
      { href: "#experience", label: "Experience" }, { href: "#skills", label: "Skills" },
      { href: "#letters", label: "References" }, { href: "#ask", label: "Ask me" }, { href: "#contact", label: "Contact" }
    ],
    moreLbl: "Show details", lessLbl: "Hide details",
    expDetails: [
      ["Built AI Poster Studio: a JSON brief becomes a publish-ready esports poster in about a minute, at $0.10 per poster.", "Fine-tuned Qwen-Image (20B) with LoRA and served it from a custom RunPod serverless GPU worker.", "Shipped it as a multi-tenant SaaS: first-month revenue covered the full development cost, and API access was sold to a client.", "Built Scout, a production LLM agent (Groq, gpt-oss-20B) that replaces creation forms with a conversation and answers questions with RAG."],
      ["Built an AI highlight generator (FastAPI, Whisper, BART, Twitch API) that extracts key moments from match VODs and assembles reels.", "Built a pipeline for speech-to-text, event detection and semantic search over transcripts, cutting manual review time by about 70%."],
      ["Built a computer-vision module (OpenCV, YOLOv8) that reads the match winner from user screenshots with 88% accuracy.", "Implemented wallet-to-crypto conversion through NFTs (Solidity, ethers.js), including gas-fee handling.", "Created a gamification module that rewards activity on and off the platform through external game APIs."],
      ["Built an automated document-processing system (Python, OCR, NLP) to extract, validate and organise business documents, cutting manual data entry by 60%."],
      ["Built a PDF-to-Excel tool (Tesseract OCR, classification, auto-fill) with 99.7% accuracy: 100 documents in 20 minutes.", "Deployed the full 3-tier system (FastAPI, React, PostgreSQL) on AWS (VPC, EC2, S3, IAM).", "Integrated an employee chatbot (OpenAI + ChromaDB RAG) answering from company data, with guardrails."],
      ["Built a Random Forest anomaly-detection model (scikit-learn) that flags abnormal patterns in system logs with 71% precision.", "Ran hardware diagnostics and electronic-board testing in the after-sales department."],
      ["Built an Android app in Java that plans personalised trips, using the A* algorithm to optimise itineraries for budget, time and destination."]
    ],
    langLabel: "Language", themeLabel: "Switch light or dark theme",
    badge: "Available now · Open to relocation",
    role: "AI Engineer",
    oneLiner: "I build AI that people actually use, and that pays for itself.",
    cv: "Download my CV", contactBtn: "Contact me",
    aboutTitle: "About me",
    about: "I'm an AI engineer who loves the moment an idea becomes something people use every day. Over the last two years, I've built LLM agents, RAG assistants, fine-tuned diffusion models and computer-vision systems, and shipped them to real users. I care less about the hype and more about what works: measuring, understanding failures and making things reliable. I rarely just take a task; I usually come back with an idea to make it better. And I get along with pretty much everyone.",
    facts: [
      "2+ years in software, 1.5+ years shipping AI to production",
      "Ranked 8th/110 in my bachelor's, and a high distinction on my final-year project",
      "A SaaS I built paid for its own development in its first month",
      "Speaks Arabic, French, English and some Spanish"
    ],
    goalsTitle: "What I'm looking for",
    goals: [
      { title: "Short term", text: "A full-time AI engineer role where I build LLM, agent and RAG products that real people use, in a team that moves fast and values initiative. Open to relocation (France and Europe first), available immediately." },
      { title: "Long term", text: "Grow into a technical lead in AI: the person who connects business needs with the right technical solution, helps a team turn ideas into products, and mentors junior engineers." },
      { title: "What I value in a team", text: "Ownership, honest feedback, curiosity, and people who enjoy building together." }
    ],
    projectsTitle: "Featured projects",
    builtLabel: "What I built", stackLabel: "Tech stack",
    projects: [
      { kind: "Generative-AI SaaS", title: "AI Poster Studio", pitch: "Turns a single JSON brief into a publish-ready esports poster in about a minute.",
        built: "A model chain (GPT-4o Vision writes the prompt, gpt-image-2 composes the design) on top of a background library from Qwen-Image, a 20B diffusion model I fine-tuned with LoRA and served on RunPod serverless GPUs. Shipped as a multi-tenant SaaS.",
        metrics: [{ big: "~1 min", label: "per poster" }, { big: "$0.10", label: "per poster" }, { big: "Month 1", label: "revenue covered the full development cost" }, { big: "API", label: "access sold to an external client" }] },
      { kind: "Production LLM agent", title: "Scout", pitch: "An agent that replaces manual creation forms with a conversation.",
        built: "An LLM agent (Groq, gpt-oss-20B) that creates organisations and tournaments on the platform and answers user questions grounded in the FAQ and live data (RAG).", metrics: [] },
      { kind: "Automation + RAG", title: "Document automation and RAG employee chatbot", pitch: "From piles of invoices and import/export files to clean, structured data.",
        built: "OCR extraction, classification and automatic Excel filling with an optional human-validation step, deployed as a 3-tier app on AWS. Plus an employee chatbot (OpenAI + ChromaDB) answering from company documents and the database, with guardrails.",
        metrics: [{ big: "99.7%", label: "accuracy" }, { big: "100 docs", label: "in 20 minutes" }] },
      { kind: "Speech + NLP", title: "AI esports highlight generator", pitch: "Automatically finds the best moments in match videos.",
        built: "Speech-to-text, event detection and semantic search over match transcripts, then automatic highlight-reel assembly.",
        metrics: [{ big: "~70%", label: "less manual review time" }] },
      { kind: "Computer vision", title: "Match-result detection", pitch: "Reads the winner from user screenshots across different games.",
        built: "", metrics: [{ big: "88%", label: "accuracy on real user screenshots" }] }
    ],
    moreTitle: "Also built",
    small: [
      { title: "Log anomaly detection", tech: "Random Forest" },
      { title: "NFT-based wallet-to-crypto conversion", tech: "Solidity, ethers.js" },
      { title: "Android travel planner using A*", tech: "Java" }
    ],
    expTitle: "Experience",
    exp: [
      { dates: "02/2026 – 08/2026", role: "AI Developer Intern", org: "Defendr.gg", text: "AI Poster Studio, Scout LLM agent." },
      { dates: "12/2025 – 02/2026", role: "AI Developer (part-time)", org: "Gamefy Academy", text: "AI highlight generator." },
      { dates: "08/2025 – 11/2025", role: "AI & Web3 Developer", org: "Defendr.gg", text: "Computer vision, smart contracts, gamification." },
      { dates: "07/2025 – 08/2025", role: "Python Developer Intern", org: "Carthage Industries", text: "Document processing, 60% less manual entry." },
      { dates: "12/2024 – 05/2025", role: "AI Developer", org: "SCP", text: "PDF-to-Excel automation, RAG chatbot, AWS deployment." },
      { dates: "06/2024 – 07/2024", role: "AI & Embedded Systems Intern", org: "ACTIA", text: "Anomaly detection, hardware testing." },
      { dates: "02/2023 – 06/2023", role: "Full Stack Intern", org: "HOTIX", text: "Android travel planner with A*." }
    ],
    skillsTitle: "Technical skills",
    skills: [
      { title: "Generative AI", items: ["LLMs", "LLM agents", "RAG", "LoRA fine-tuning", "Diffusion models", "GPT-4o Vision", "Prompt engineering", "LangChain", "OpenAI API", "Groq", "LLM evaluation"] },
      { title: "Machine learning", items: ["PyTorch", "Hugging Face", "sentence-transformers", "Whisper", "YOLOv8", "OpenCV", "MediaPipe", "scikit-learn", "OCR (Tesseract)", "NLP"] },
      { title: "Backend and web", items: ["Python", "FastAPI", "Node.js", "Next.js", "React", "TypeScript", "REST APIs", "Pydantic"] },
      { title: "Data", items: ["PostgreSQL", "MongoDB", "Redis", "ChromaDB", "MySQL", "SQL Server", "Cloudflare R2"] },
      { title: "Cloud and DevOps", items: ["AWS (EC2, S3, VPC, IAM, Lambda)", "Docker", "RunPod", "Git", "GitHub Actions", "Jenkins", "SonarQube", "Grafana", "Linux"] },
      { title: "Other", items: ["C++", "Java", "Solidity"] }
    ],
    howTitle: "How I work",
    soft: [
      { title: "Innovative", text: "I like finding the simpler, smarter way. My most successful project started as an idea nobody asked me for." },
      { title: "I suggest, not just accept", text: "Give me a task and I'll usually come back with a way to make it better." },
      { title: "Autonomous", text: "Give me a problem and I'll own it end to end, from first commit to production." },
      { title: "Competitive spirit", text: "I like setting the bar high and beating it, in a healthy, team-first way." }
    ],
    peopleTitle: "How I work with people",
    social: [
      { title: "High emotional intelligence", text: "I read the room quickly. I notice when a teammate is under pressure or when a user doesn't dare say a tool isn't working for them, and I adapt." },
      { title: "I fit into any team", text: "Startups, industrial companies, technical and business teams, on-site or remote: I've adapted to all of them, and to all kinds of people." },
      { title: "Genuinely friendly", text: "I'm the colleague people enjoy working with. I explain technical things in plain words and I'm always happy to help." }
    ],
    beyondTitle: "Beyond work",
    assoc: [
      { name: "IEEE Computer Society Chapter", meta: "University of Tunis El Manar · 3 years · Role: [MY ROLE]", text: "[1–2 lines on what I did: events, workshops, competitions...]" },
      { name: "OPTIMA Junior Entreprise", meta: "2 years · Role: [MY ROLE]", text: "[1–2 lines: client projects, organisation, teamwork...]" }
    ],
    assocClose: "These years taught me how to work with very different personalities, organise things from scratch and handle disagreements without breaking relationships.",
    hobbiesTitle: "Hobbies",
    hobbies: [
      { name: "Chess", badge: "1400 Elo · rapid", text: "I love positions where one quiet move changes everything. Code works the same way." },
      { name: "Esports", badge: "Former pro · League of Legends", text: "I played League of Legends professionally, in national and international tournaments with several teams. Today I build AI for esports." },
      { name: "Swimming", badge: "3 years of courses", text: "Still my reset button. Some of my best debugging ideas show up between two laps." },
      { name: "Handiwork", badge: "Since I was a kid", text: "On my days off I work alongside my father, a plumber with over 40 years of experience. Real problems, no undo button." }
    ],
    eduTitle: "Education",
    edu: [
      { dates: "2023 – 2026", title: "Engineering Degree in Computer Science (MSc equivalent)", text: "University of Tunis El Manar · Final-year project: High Distinction · Attendance not mandatory, so I studied in the evenings while working" },
      { dates: "2020 – 2023", title: "National Bachelor's Degree in Computer Engineering", text: "Ranked 8th/110 · Final-year project: High Distinction" }
    ],
    langTitle: "Languages",
    langs: [{ name: "Arabic", level: "Native" }, { name: "French", level: "C1" }, { name: "English", level: "C1" }, { name: "Spanish", level: "A2" }],
    contactLine: "Building something with AI? Let's talk.",
    mailBtn: "Write me an email", phoneLabel: "Phone", locLabel: "Location",
    location: "Tunis, Tunisia · Open to relocation",
    backTop: "Back to top",
    viz: { writes: "writes the prompt", composes: "composes the design", bgLib: "background library", chatUser: "I want to create a tournament.", chatBot: "Great! Which game, and what date?", winner: "WINNER" },
    statsLabel: "By the numbers",
    stats: ["accuracy on document extraction", "accuracy reading match results from screenshots", "less manual highlight-review time", "documents processed in 20 minutes", "per AI-generated esports poster", "roles and internships since 2023"],
    processTitle: "How I ship",
    process: [
      { n: "01", title: "Understand", text: "Start from the real need, not the hype." },
      { n: "02", title: "Prototype", text: "Get something working, fast." },
      { n: "03", title: "Measure", text: "Test it, find where it fails, fix it." },
      { n: "04", title: "Ship", text: "Put it in front of real users and keep it reliable." }
    ],
    askTitle: "Ask my CV anything",
    askNote: "A tiny retrieval engine that runs in your browser: TF-IDF and cosine similarity over {n} passages about me. No LLM, no server, just the R in RAG.",
    askBot: "Ask my CV",
    askStatus: "Retrieval engine · runs in your browser",
    askHello: "Hi! Ask me anything about my projects, skills or availability. Every answer is pulled from my CV and portfolio: nothing is generated, so nothing is made up.",
    askLabel: "Your question", askPlaceholder: "e.g. Have you worked with RAG?", askBtn: "Ask", askSource: "Source:",
    askFallback: "I couldn't find that in my CV, and I'd rather not guess. Try asking about my projects, my stack or relocation, or email me at mahdi.haj.said@gmail.com.",
    askChips: ["What role are you looking for?", "Can you relocate?", "Which project are you proudest of?", "How did you work while studying?", "Do you have references?", "What's your tech stack?", "What are you like as a teammate?", "Tell me about esports"],
    hoodTitle: "Under the hood", hoodTok: "tokenize", hoodRet: "retrieve · cosine similarity", hoodGen: "respond",
    hoodFound: "Answer taken from passage #1 (similarity {s}). Nothing is generated, so nothing is made up.",
    hoodNone: "No passage scored above 0.08, so I say I don't know instead of making something up.",
    hoodIdle: "Ask something to see the pipeline run.",
    hoodStats: "{n} passages · {v} terms · {ms} · 100% in your browser",
    skViewLabel: "Skills view", skGraphBtn: "Connections", skListBtn: "Full list",
    gHint: "Hover or tap a project or a tool to see how they connect.", gTools: "tools", gUsedIn: "used in",
    gProj: ["AI Poster Studio", "Scout agent", "Docs + RAG chatbot", "Highlight generator", "Match-result vision"],
    chessKicker: "Your move", chessTitle: "Mate in one?",
    chessSub: "I've reached 1400 Elo in rapid. Let's see if you can find the winning move.",
    chessBoard: "Chess puzzle board", chessHintBtn: "Hint", chessResetBtn: "Reset",
    chessSelMsg: "Piece on {sq} selected. Now pick its target square.",
    chess: { intro: "White to play and mate in one. Pick a white piece, then its target square.", black: "You're playing White: pick a white piece first.", wrong: "Not mate yet. Try again!", win: "Checkmate! Rd8#. The back rank strikes again. You'd fit right in on my team.", hint: "Hint: Black's king is boxed in by its own pawns. Look at the back rank." },
    skip: "Skip to content", scrollCue: "Scroll to the About section",
    askLegacy: [
      { q: "What role are you looking for?", a: "A full-time AI engineer role where I build LLM, agent and RAG products that real people use, in a team that moves fast and values initiative." },
      { q: "Which project are you proudest of?", a: "AI Poster Studio. It turns a JSON brief into a publish-ready esports poster in about a minute, for $0.10. Its first-month revenue covered the full development cost, and API access was sold to an external client." },
      { q: "Can you relocate?", a: "Yes. I'm open to relocation, France and Europe first, and available immediately." },
      { q: "Do you have references?", a: "Yes. The CEO of Defendr and my supervisor at ACTIA both wrote recommendation letters. You can read or download them in the References section." },
      { q: "How did you work during your Master's?", a: "My engineering programme (MSc equivalent) didn't require attendance. I worked during the day and studied on my own in the evenings, and still graduated, with a high distinction on my final-year project. Happy to explain more in an interview." },
      { q: "What's your go-to stack?", a: "Python, PyTorch and Hugging Face for models; OpenAI, Groq and ChromaDB for LLM agents and RAG; FastAPI and React for the product; AWS and RunPod to ship it." },
      { q: "What are you like to work with?", a: "I'm the colleague people enjoy working with. I explain technical things in plain words, I notice when someone is under pressure, and I'm always happy to help." },
      { q: "Where do you see yourself long term?", a: "As a technical lead in AI: connecting business needs with the right technical solution, helping a team turn ideas into products, and mentoring junior engineers." }
    ],
    copy: "Copy", copied: "Copied!", timeLabel: "Local time in Tunis",
    manifestoLabel: "What I believe",
    lettersKicker: "References", lettersTitle: "What my supervisors say",
    lettersNote: "Real excerpts from two recommendation letters. Read or download the full letters.",
    readLetter: "Read the full letter", downloadPdf: "Download PDF",
    letters: [
      { role: "CEO, Defendr", context: "Supervised my AI Developer internship · Letter dated October 7, 2026", alt: "First page of the recommendation letter from Defendr", openLabel: "Open the Defendr recommendation letter (PDF)" },
      { role: "Hardware Designer, ACTIA Engineering Services", context: "Supervised my internship at CIPI-ACTIA in June 2024 · Letter dated November 29, 2025", alt: "First page of the recommendation letter from CIPI-ACTIA", openLabel: "Open the ACTIA recommendation letter (PDF)" }
    ],
    certTitle: "Certifications", certTypes: { cert: "Certificate", course: "Course" }, viewCert: "View certificate",
    certMeta: ["Completed Aug 7, 2025", "Issued Aug 6, 2025 · Valid until Aug 6, 2028 · ACE ID 2025-25987", "", ""],
    transTitle: "Academic transcripts", transNote: "Official transcripts from the University of Tunis El Manar, with my ID number and date of birth hidden.", transBtn: "Download PDF",
    transcripts: [
      { title: "Engineering Degree in Computer Science (MSc equivalent)", meta: "Transcripts for 2023–2024 and 2024–2025", link: "assets/docs/Transcripts-Engineering-2023-2025-Mahdi-Bel-Haj-Said.pdf", file: "Transcripts-Engineering-2023-2025-Mahdi-Bel-Haj-Said.pdf" },
      { title: "National Bachelor's Degree in Computer Engineering", meta: "Transcripts for 2020–2021, 2021–2022 and 2022–2023 · Ranked 8th/110", link: "assets/docs/Transcripts-Bachelor-2020-2023-Mahdi-Bel-Haj-Said.pdf", file: "Transcripts-Bachelor-2020-2023-Mahdi-Bel-Haj-Said.pdf" }
    ],
    studyTitle: "Working while studying? Yes, here's how.",
    studyText: "Attendance wasn't mandatory in my engineering programme (MSc equivalent), so I worked during the day and studied on my own in the evenings. That's how I built 2+ years of real experience and still graduated, with a high distinction on my final-year project. Happy to walk you through it in an interview.",
    manifesto: "I care less about the hype and more about *what *works: measuring, understanding failures and making things *reliable.",
    mapTitle: "From Tunis to Europe",
    mapText: "Open to relocation, France and Europe first. Available immediately.",
    mapAlt: "Map with a route from Tunis to Paris and other European cities",
    ghTitle: "From my GitHub", ghAll: "See all repositories",
    repos: [
      "Recognises hand gestures in real time and translates them, with TensorFlow, OpenCV, scikit-learn and MediaPipe.",
      "A library for talking to the SIM808 module over UART on STM32 boards, with GPRS support for HTTP GET and POST.",
      "Deploys a secure, scalable three-tier web application on AWS.",
      "A CloudSim simulation that optimises task scheduling across heterogeneous multiprocessor devices.",
      "A CI/CD pipeline built with Jenkins, monitored with Grafana and Prometheus.",
      "A web app for personalised travel planning that builds itineraries from budget, time and destination."
    ],
    filterLabel: "Filter projects",
    filters: [{ id: "all", label: "All" }, { id: "genai", label: "LLMs & generative AI" }, { id: "ml", label: "Vision & speech" }, { id: "auto", label: "Automation" }],
    tldrBtn: "30-second version", tldrTitle: "Mahdi in 30 seconds", close: "Close",
    tldr: [
      "AI engineer: LLM agents, RAG, LoRA fine-tuning and computer vision.",
      "2+ years in software, 1.5+ years shipping AI to production.",
      "Built a generative-AI SaaS whose first-month revenue covered its full development cost.",
      "99.7% accuracy on document extraction, 88% on match-result detection, ~70% less manual review time.",
      "Engineering degree in CS (MSc equivalent), earned while working: attendance wasn't mandatory, so I studied in the evenings.",
      "Ranked 8th/110 in my bachelor's; high distinction on my final-year project.",
      "Recommended in writing by the CEO of Defendr and my supervisor at ACTIA.",
      "Available now, open to relocation (France and Europe first). Arabic, French C1, English C1."
    ]
  },
  fr: {
    nav: [
      { href: "#about", label: "À propos" }, { href: "#projects", label: "Projets" },
      { href: "#experience", label: "Expérience" }, { href: "#skills", label: "Compétences" },
      { href: "#letters", label: "Références" }, { href: "#ask", label: "Questions" }, { href: "#contact", label: "Contact" }
    ],
    moreLbl: "Voir le détail", lessLbl: "Masquer le détail",
    expDetails: [
      ["Création d'AI Poster Studio : un brief JSON devient une affiche esport prête à publier en environ une minute, pour 0,10 $ par affiche.", "Fine-tuning LoRA de Qwen-Image (20 Md de paramètres), servi depuis un worker GPU serverless RunPod sur mesure.", "Livré en SaaS multi-tenant : le chiffre d'affaires du premier mois a couvert tout le développement, et un accès API a été vendu à un client.", "Création de Scout, un agent LLM en production (Groq, gpt-oss-20B) qui remplace les formulaires par une conversation et répond aux questions via RAG."],
      ["Création d'un générateur de highlights par IA (FastAPI, Whisper, BART, API Twitch) qui extrait les moments clés des VOD et monte les vidéos.", "Pipeline de speech-to-text, détection d'événements et recherche sémantique sur les transcriptions : environ 70 % de temps de revue manuelle en moins."],
      ["Module de vision par ordinateur (OpenCV, YOLOv8) qui identifie le vainqueur à partir des captures d'écran avec 88 % d'exactitude.", "Conversion des soldes du portefeuille en cryptomonnaie via des NFT (Solidity, ethers.js), avec gestion des frais de gaz.", "Module de gamification qui récompense l'activité sur et en dehors de la plateforme via des API de jeux externes."],
      ["Système automatisé de traitement de documents (Python, OCR, NLP) pour extraire, valider et organiser les documents métier : 60 % de saisie manuelle en moins."],
      ["Outil PDF vers Excel (Tesseract OCR, classification, remplissage automatique) avec 99,7 % d'exactitude : 100 documents en 20 minutes.", "Déploiement du système 3-tiers (FastAPI, React, PostgreSQL) sur AWS (VPC, EC2, S3, IAM).", "Intégration d'un chatbot employés (OpenAI + RAG ChromaDB) répondant à partir des données de l'entreprise, avec garde-fous."],
      ["Modèle de détection d'anomalies Random Forest (scikit-learn) qui signale les comportements anormaux dans les logs avec 71 % de précision.", "Diagnostics matériels et tests de cartes électroniques au service après-vente."],
      ["Application Android en Java de planification de voyages personnalisés, avec l'algorithme A* pour optimiser l'itinéraire selon le budget, le temps et la destination."]
    ],
    langLabel: "Langue", themeLabel: "Basculer entre thème clair et sombre",
    badge: "Disponible immédiatement · Mobilité internationale",
    role: "Ingénieur IA",
    oneLiner: "Je construis une IA que les gens utilisent vraiment, et qui se rentabilise.",
    cv: "Télécharger mon CV", contactBtn: "Me contacter",
    aboutTitle: "À propos de moi",
    about: "Je suis ingénieur IA et j'adore le moment où une idée devient quelque chose que les gens utilisent au quotidien. Ces deux dernières années, j'ai construit des agents LLM, des assistants RAG, des modèles de diffusion fine-tunés et des systèmes de vision par ordinateur, et je les ai mis entre les mains de vrais utilisateurs. Le buzz m'intéresse moins que ce qui marche : mesurer, comprendre les échecs et rendre les choses fiables. Je prends rarement une tâche telle quelle ; je reviens souvent avec une idée pour l'améliorer. Et je m'entends avec à peu près tout le monde.",
    facts: [
      "2+ ans en ingénierie logicielle, dont 1,5+ an à mettre de l'IA en production",
      "Classé 8e/110 en licence, et mention Très Bien pour mon projet de fin d'études",
      "Un SaaS que j'ai construit a remboursé son développement dès le premier mois",
      "Parle arabe, français, anglais et un peu d'espagnol"
    ],
    goalsTitle: "Ce que je recherche",
    goals: [
      { title: "À court terme", text: "Un poste d'ingénieur IA à temps plein où je construis des produits LLM, agents et RAG utilisés par de vraies personnes, dans une équipe qui avance vite et valorise l'initiative. Mobilité internationale (France et Europe en priorité), disponible immédiatement." },
      { title: "À long terme", text: "Devenir lead technique en IA : la personne qui relie les besoins métier à la bonne solution technique, aide une équipe à transformer des idées en produits et accompagne les ingénieurs juniors." },
      { title: "Ce que j'apprécie dans une équipe", text: "L'autonomie et la responsabilité, les retours honnêtes, la curiosité, et des personnes qui aiment construire ensemble." }
    ],
    projectsTitle: "Projets phares",
    builtLabel: "Ce que j'ai construit", stackLabel: "Stack technique",
    projects: [
      { kind: "SaaS d'IA générative", title: "AI Poster Studio", pitch: "Transforme un simple brief JSON en affiche esport prête à publier en environ une minute.",
        built: "Une chaîne de modèles (GPT-4o Vision rédige le prompt, gpt-image-2 compose le visuel) s'appuyant sur une bibliothèque d'arrière-plans générée par Qwen-Image, un modèle de diffusion de 20 Md de paramètres que j'ai fine-tuné avec LoRA et servi sur des GPU serverless RunPod. Livré en SaaS multi-tenant.",
        metrics: [{ big: "~1 min", label: "par affiche" }, { big: "0,10 $", label: "par affiche" }, { big: "1er mois", label: "le chiffre d'affaires a couvert tout le coût de développement" }, { big: "API", label: "accès vendu à un client externe" }] },
      { kind: "Agent LLM en production", title: "Scout", pitch: "Un agent qui remplace les formulaires de création par une conversation.",
        built: "Un agent LLM (Groq, gpt-oss-20B) qui crée organisations et tournois sur la plateforme et répond aux questions des utilisateurs à partir de la FAQ et des données en temps réel (RAG).", metrics: [] },
      { kind: "Automatisation + RAG", title: "Automatisation documentaire et chatbot RAG pour les employés", pitch: "Des piles de factures et de dossiers import/export à des données propres et structurées.",
        built: "Extraction OCR, classification et remplissage automatique d'Excel avec une étape de validation humaine optionnelle, déployé en application 3-tiers sur AWS. Plus un chatbot employés (OpenAI + ChromaDB) qui répond à partir des documents et de la base de données de l'entreprise, avec garde-fous.",
        metrics: [{ big: "99,7 %", label: "d'exactitude" }, { big: "100 docs", label: "en 20 minutes" }] },
      { kind: "Speech + NLP", title: "Générateur de highlights esport par IA", pitch: "Trouve automatiquement les meilleurs moments des vidéos de matchs.",
        built: "Speech-to-text, détection d'événements et recherche sémantique sur les transcriptions de matchs, puis montage automatique des highlights.",
        metrics: [{ big: "~70 %", label: "de temps de revue manuelle en moins" }] },
      { kind: "Vision par ordinateur", title: "Détection du résultat des matchs", pitch: "Identifie le vainqueur à partir des captures d'écran des joueurs, sur différents jeux.",
        built: "", metrics: [{ big: "88 %", label: "d'exactitude sur de vraies captures d'utilisateurs" }] }
    ],
    moreTitle: "Autres réalisations",
    small: [
      { title: "Détection d'anomalies dans les logs", tech: "Random Forest" },
      { title: "Conversion portefeuille vers crypto via NFT", tech: "Solidity, ethers.js" },
      { title: "Planificateur de voyages Android avec A*", tech: "Java" }
    ],
    expTitle: "Expérience",
    exp: [
      { dates: "02/2026 – 08/2026", role: "Développeur IA (stage)", org: "Defendr.gg", text: "AI Poster Studio, agent LLM Scout." },
      { dates: "12/2025 – 02/2026", role: "Développeur IA (temps partiel)", org: "Gamefy Academy", text: "Générateur de highlights par IA." },
      { dates: "08/2025 – 11/2025", role: "Développeur IA & Web3", org: "Defendr.gg", text: "Vision par ordinateur, smart contracts, gamification." },
      { dates: "07/2025 – 08/2025", role: "Développeur Python (stage)", org: "Carthage Industries", text: "Traitement de documents, 60 % de saisie manuelle en moins." },
      { dates: "12/2024 – 05/2025", role: "Développeur IA", org: "SCP", text: "Automatisation PDF vers Excel, chatbot RAG, déploiement AWS." },
      { dates: "06/2024 – 07/2024", role: "Stagiaire IA & systèmes embarqués", org: "ACTIA", text: "Détection d'anomalies, tests matériels." },
      { dates: "02/2023 – 06/2023", role: "Développeur Full Stack (stage)", org: "HOTIX", text: "Planificateur de voyages Android avec A*." }
    ],
    skillsTitle: "Compétences techniques",
    skills: [
      { title: "IA générative", items: ["LLM", "Agents LLM", "RAG", "Fine-tuning LoRA", "Modèles de diffusion", "GPT-4o Vision", "Prompt engineering", "LangChain", "API OpenAI", "Groq", "Évaluation de LLM"] },
      { title: "Machine learning", items: ["PyTorch", "Hugging Face", "sentence-transformers", "Whisper", "YOLOv8", "OpenCV", "MediaPipe", "scikit-learn", "OCR (Tesseract)", "NLP"] },
      { title: "Backend et web", items: ["Python", "FastAPI", "Node.js", "Next.js", "React", "TypeScript", "API REST", "Pydantic"] },
      { title: "Données", items: ["PostgreSQL", "MongoDB", "Redis", "ChromaDB", "MySQL", "SQL Server", "Cloudflare R2"] },
      { title: "Cloud et DevOps", items: ["AWS (EC2, S3, VPC, IAM, Lambda)", "Docker", "RunPod", "Git", "GitHub Actions", "Jenkins", "SonarQube", "Grafana", "Linux"] },
      { title: "Autres", items: ["C++", "Java", "Solidity"] }
    ],
    howTitle: "Ma façon de travailler",
    soft: [
      { title: "Innovant", text: "J'aime trouver la voie la plus simple et la plus intelligente. Mon projet le plus réussi est parti d'une idée que personne ne m'avait demandée." },
      { title: "Je propose, je ne fais pas que suivre", text: "Confiez-moi une tâche : je reviendrai souvent avec une façon de l'améliorer." },
      { title: "Autonome", text: "Confiez-moi un problème et je m'en charge de bout en bout, du premier commit à la production." },
      { title: "Esprit de compétition", text: "J'aime placer la barre haut et la dépasser, de façon saine et toujours au service de l'équipe." }
    ],
    peopleTitle: "Ma façon de travailler avec les autres",
    social: [
      { title: "Forte intelligence émotionnelle", text: "Je sens vite l'ambiance. Je remarque quand un collègue est sous pression ou quand un utilisateur n'ose pas dire qu'un outil ne lui convient pas, et je m'adapte." },
      { title: "Je m'intègre dans toute équipe", text: "Startups, entreprises industrielles, équipes techniques et métier, sur site ou à distance : je me suis adapté à toutes, et à tous les profils." },
      { title: "Sincèrement sympathique", text: "Je suis le collègue avec qui on aime travailler. J'explique la technique avec des mots simples et je suis toujours prêt à aider." }
    ],
    beyondTitle: "Hors travail",
    assoc: [
      { name: "IEEE Computer Society Chapter", meta: "Université de Tunis El Manar · 3 ans · Rôle : [MY ROLE]", text: "[1–2 lignes sur ce que j'ai fait : événements, ateliers, compétitions...]" },
      { name: "OPTIMA Junior Entreprise", meta: "2 ans · Rôle : [MY ROLE]", text: "[1–2 lignes : projets clients, organisation, travail d'équipe...]" }
    ],
    assocClose: "Ces années m'ont appris à travailler avec des personnalités très différentes, à organiser des choses à partir de zéro et à gérer les désaccords sans abîmer les relations.",
    hobbiesTitle: "Loisirs",
    hobbies: [
      { name: "Échecs", badge: "1400 Elo · rapide", text: "J'adore les positions où un coup discret change tout. Le code fonctionne pareil." },
      { name: "Esport", badge: "Ex-joueur pro · League of Legends", text: "J'ai joué à League of Legends en professionnel, dans des tournois nationaux et internationaux avec plusieurs équipes. Aujourd'hui, je construis de l'IA pour l'esport." },
      { name: "Natation", badge: "3 ans de cours", text: "Toujours mon bouton reset. Certaines de mes meilleures idées de débogage arrivent entre deux longueurs." },
      { name: "Bricolage", badge: "Depuis l'enfance", text: "Pendant mes jours de repos, je travaille avec mon père, plombier depuis plus de 40 ans. De vrais problèmes, sans bouton annuler." }
    ],
    eduTitle: "Formation",
    edu: [
      { dates: "2023 – 2026", title: "Diplôme d'ingénieur en informatique (équivalent Master)", text: "Université de Tunis El Manar · PFE : mention Très Bien · Présence non obligatoire : j'étudiais le soir tout en travaillant" },
      { dates: "2020 – 2023", title: "Licence nationale en génie informatique", text: "Classé 8e/110 · PFE : mention Très Bien" }
    ],
    langTitle: "Langues",
    langs: [{ name: "Arabe", level: "Natif" }, { name: "Français", level: "C1" }, { name: "Anglais", level: "C1" }, { name: "Espagnol", level: "A2" }],
    contactLine: "Vous construisez quelque chose avec l'IA ? Parlons-en.",
    mailBtn: "M'écrire un e-mail", phoneLabel: "Téléphone", locLabel: "Localisation",
    location: "Tunis, Tunisie · Mobilité internationale",
    backTop: "Haut de page",
    viz: { writes: "rédige le prompt", composes: "compose le visuel", bgLib: "bibliothèque d'arrière-plans", chatUser: "Je veux créer un tournoi.", chatBot: "Super ! Quel jeu, et pour quelle date ?", winner: "VAINQUEUR" },
    statsLabel: "En chiffres",
    stats: ["d'exactitude sur l'extraction de documents", "d'exactitude pour lire le résultat des matchs sur captures", "de temps de revue manuelle en moins", "documents traités en 20 minutes", "par affiche esport générée par IA", "postes et stages depuis 2023"],
    processTitle: "Comment je livre",
    process: [
      { n: "01", title: "Comprendre", text: "Partir du vrai besoin, pas du buzz." },
      { n: "02", title: "Prototyper", text: "Obtenir vite quelque chose qui marche." },
      { n: "03", title: "Mesurer", text: "Tester, trouver où ça casse, corriger." },
      { n: "04", title: "Livrer", text: "Mettre entre les mains de vrais utilisateurs et garder le système fiable." }
    ],
    askTitle: "Interrogez mon CV",
    askNote: "Un mini moteur de recherche qui tourne dans votre navigateur : TF-IDF et similarité cosinus sur {n} passages me concernant. Pas de LLM, pas de serveur : juste le R de RAG.",
    askBot: "Interrogez mon CV",
    askStatus: "Moteur de recherche · dans votre navigateur",
    askHello: "Bonjour ! Posez-moi vos questions sur mes projets, mes compétences ou ma disponibilité. Chaque réponse vient de mon CV et de mon portfolio : rien n'est généré, donc rien n'est inventé.",
    askLabel: "Votre question", askPlaceholder: "ex. Avez-vous déjà fait du RAG ?", askBtn: "Demander", askSource: "Source :",
    askFallback: "Je n'ai pas trouvé ça dans mon CV, et je préfère ne pas deviner. Essayez avec mes projets, ma stack ou la mobilité, ou écrivez-moi à mahdi.haj.said@gmail.com.",
    askChips: ["Quel poste recherchez-vous ?", "Pouvez-vous déménager ?", "De quel projet êtes-vous le plus fier ?", "Comment avez-vous travaillé pendant vos études ?", "Avez-vous des références ?", "Quelle est votre stack technique ?", "Comment êtes-vous en équipe ?", "Parlez-moi de l'esport"],
    hoodTitle: "Sous le capot", hoodTok: "tokenisation", hoodRet: "recherche · similarité cosinus", hoodGen: "réponse",
    hoodFound: "Réponse tirée du passage n°1 (similarité {s}). Rien n'est généré, donc rien n'est inventé.",
    hoodNone: "Aucun passage ne dépasse 0,08 : je dis que je ne sais pas plutôt que d'inventer.",
    hoodIdle: "Posez une question pour voir le pipeline tourner.",
    hoodStats: "{n} passages · {v} termes · {ms} · 100 % dans votre navigateur",
    skViewLabel: "Affichage des compétences", skGraphBtn: "Connexions", skListBtn: "Liste complète",
    gHint: "Survolez ou touchez un projet ou un outil pour voir les liens.", gTools: "outils", gUsedIn: "utilisé dans",
    gProj: ["AI Poster Studio", "Agent Scout", "Docs + chatbot RAG", "Générateur de highlights", "Vision : résultats"],
    chessKicker: "À vous de jouer", chessTitle: "Mat en un coup ?",
    chessSub: "J'ai atteint 1400 Elo en rapide. Voyons si vous trouvez le coup gagnant.",
    chessBoard: "Échiquier du problème", chessHintBtn: "Indice", chessResetBtn: "Recommencer",
    chessSelMsg: "Pièce en {sq} sélectionnée. Choisissez maintenant sa case d'arrivée.",
    chess: { intro: "Les Blancs jouent et matent en un coup. Choisissez une pièce blanche, puis sa case d'arrivée.", black: "Vous jouez les Blancs : choisissez d'abord une pièce blanche.", wrong: "Pas encore mat. Réessayez !", win: "Échec et mat ! Td8#. La dernière rangée frappe encore. Vous seriez à l'aise dans mon équipe.", hint: "Indice : le roi noir est enfermé par ses propres pions. Regardez la dernière rangée." },
    skip: "Aller au contenu", scrollCue: "Aller à la section À propos",
    askLegacy: [
      { q: "Quel poste recherchez-vous ?", a: "Un poste d'ingénieur IA à temps plein où je construis des produits LLM, agents et RAG utilisés par de vraies personnes, dans une équipe qui avance vite et valorise l'initiative." },
      { q: "De quel projet êtes-vous le plus fier ?", a: "AI Poster Studio. Il transforme un brief JSON en affiche esport prête à publier en environ une minute, pour 0,10 $. Le chiffre d'affaires du premier mois a couvert tout le coût de développement, et un accès API a été vendu à un client externe." },
      { q: "Pouvez-vous déménager ?", a: "Oui. Je suis ouvert à la mobilité, en priorité en France et en Europe, et disponible immédiatement." },
      { q: "Avez-vous des références ?", a: "Oui. Le CEO de Defendr et mon encadrant chez ACTIA m'ont chacun écrit une lettre de recommandation. Vous pouvez les lire ou les télécharger dans la section Références." },
      { q: "Comment avez-vous travaillé pendant votre master ?", a: "Mon cycle d'ingénieur (équivalent Master) n'imposait pas la présence. Je travaillais la journée et j'étudiais en autonomie le soir, et j'ai obtenu mon diplôme, avec la mention Très Bien pour mon PFE. Je l'explique volontiers en entretien." },
      { q: "Quelle est votre stack de prédilection ?", a: "Python, PyTorch et Hugging Face pour les modèles ; OpenAI, Groq et ChromaDB pour les agents LLM et le RAG ; FastAPI et React pour le produit ; AWS et RunPod pour la mise en production." },
      { q: "Comment êtes-vous au travail ?", a: "Je suis le collègue avec qui on aime travailler. J'explique la technique avec des mots simples, je remarque quand quelqu'un est sous pression, et je suis toujours prêt à aider." },
      { q: "Où vous voyez-vous à long terme ?", a: "Lead technique en IA : relier les besoins métier à la bonne solution technique, aider une équipe à transformer des idées en produits et accompagner les ingénieurs juniors." }
    ],
    copy: "Copier", copied: "Copié !", timeLabel: "Heure locale à Tunis",
    manifestoLabel: "Ce en quoi je crois",
    lettersKicker: "Références", lettersTitle: "Ce que disent mes encadrants",
    lettersNote: "Extraits réels de deux lettres de recommandation (en anglais). Lisez ou téléchargez les lettres complètes.",
    readLetter: "Lire la lettre complète", downloadPdf: "Télécharger le PDF",
    letters: [
      { role: "CEO, Defendr", context: "A encadré mon stage de Développeur IA · Lettre du 7 octobre 2026", alt: "Première page de la lettre de recommandation de Defendr", openLabel: "Ouvrir la lettre de recommandation de Defendr (PDF)" },
      { role: "Hardware Designer, ACTIA Engineering Services", context: "A encadré mon stage chez CIPI-ACTIA en juin 2024 · Lettre du 29 novembre 2025", alt: "Première page de la lettre de recommandation de CIPI-ACTIA", openLabel: "Ouvrir la lettre de recommandation d'ACTIA (PDF)" }
    ],
    certTitle: "Certifications", certTypes: { cert: "Certificat", course: "Cours" }, viewCert: "Voir le certificat",
    certMeta: ["Obtenu le 7 août 2025", "Délivré le 6 août 2025 · Valable jusqu'au 6 août 2028 · ACE ID 2025-25987", "", ""],
    transTitle: "Relevés de notes", transNote: "Relevés de notes officiels de l'Université de Tunis El Manar, avec mon numéro de CIN et ma date de naissance masqués.", transBtn: "Télécharger le PDF",
    transcripts: [
      { title: "Diplôme d'ingénieur en informatique (équivalent Master)", meta: "Relevés 2023–2024 et 2024–2025", link: "assets/docs/Transcripts-Engineering-2023-2025-Mahdi-Bel-Haj-Said.pdf", file: "Transcripts-Engineering-2023-2025-Mahdi-Bel-Haj-Said.pdf" },
      { title: "Licence nationale en génie informatique", meta: "Relevés 2020–2021, 2021–2022 et 2022–2023 · Classé 8e/110", link: "assets/docs/Transcripts-Bachelor-2020-2023-Mahdi-Bel-Haj-Said.pdf", file: "Transcripts-Bachelor-2020-2023-Mahdi-Bel-Haj-Said.pdf" }
    ],
    studyTitle: "Travailler pendant mes études ? Oui, voici comment.",
    studyText: "La présence n'était pas obligatoire dans mon cycle d'ingénieur (équivalent Master) : je travaillais la journée et j'étudiais en autonomie le soir. C'est ainsi que j'ai acquis plus de 2 ans d'expérience concrète tout en obtenant mon diplôme, avec la mention Très Bien pour mon projet de fin d'études. Je l'explique volontiers en entretien.",
    manifesto: "Le buzz m'intéresse moins que *ce *qui *marche : mesurer, comprendre les échecs et rendre les choses *fiables.",
    mapTitle: "De Tunis à l'Europe",
    mapText: "Mobilité internationale, en priorité vers la France et l'Europe. Disponible immédiatement.",
    mapAlt: "Carte avec un trajet de Tunis vers Paris et d'autres villes européennes",
    ghTitle: "Sur mon GitHub", ghAll: "Voir tous les dépôts",
    repos: [
      "Reconnaît les gestes de la main en temps réel et les traduit, avec TensorFlow, OpenCV, scikit-learn et MediaPipe.",
      "Une bibliothèque pour piloter le module SIM808 en UART sur cartes STM32, avec support GPRS pour HTTP GET et POST.",
      "Déploie une application web 3-tiers sécurisée et scalable sur AWS.",
      "Une simulation CloudSim qui optimise l'ordonnancement des tâches sur des systèmes multiprocesseurs hétérogènes.",
      "Un pipeline CI/CD avec Jenkins, supervisé avec Grafana et Prometheus.",
      "Une application web de planification de voyages personnalisés selon le budget, le temps et la destination."
    ],
    filterLabel: "Filtrer les projets",
    filters: [{ id: "all", label: "Tous" }, { id: "genai", label: "LLM & IA générative" }, { id: "ml", label: "Vision & audio" }, { id: "auto", label: "Automatisation" }],
    tldrBtn: "Version 30 secondes", tldrTitle: "Mahdi en 30 secondes", close: "Fermer",
    tldr: [
      "Ingénieur IA : agents LLM, RAG, fine-tuning LoRA et vision par ordinateur.",
      "2+ ans en ingénierie logicielle, dont 1,5+ an à mettre de l'IA en production.",
      "Création d'un SaaS d'IA générative dont le chiffre d'affaires du premier mois a couvert tout le développement.",
      "99,7 % d'exactitude en extraction de documents, 88 % en détection de résultats de matchs, ~70 % de temps de revue en moins.",
      "Diplôme d'ingénieur en informatique (équivalent Master), obtenu en travaillant : la présence n'était pas obligatoire, j'étudiais le soir.",
      "Classé 8e/110 en licence ; mention Très Bien pour mon projet de fin d'études.",
      "Recommandé par écrit par le CEO de Defendr et mon encadrant chez ACTIA.",
      "Disponible immédiatement, mobilité internationale (France et Europe en priorité). Arabe, français C1, anglais C1."
    ]
  }
};
