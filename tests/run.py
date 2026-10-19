"""Automated checks for Compass, using Playwright (python -m pip install playwright).

Run from the Compass folder:  python tests/run.py [screenshot-folder]
It starts a small local web server, tests the result codes and labels, clicks through the quiz,
and saves screenshots at desktop and phone width. Nothing is sent to Google: the form is faked.
"""
import base64, json, random, sys, threading, functools, http.server, pathlib, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "tests" / "screenshots")
OUT.mkdir(parents=True, exist_ok=True)
PORT = 8765

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
handler = functools.partial(Quiet, directory=str(ROOT))
http.server.ThreadingHTTPServer.allow_reuse_address = True
server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{PORT}/index.html"

failures = []
def check(cond, msg):
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond: failures.append(msg)

# An old-style code (base64 of JSON), like the previous version produced.
OLD = base64.urlsafe_b64encode(json.dumps({"n": "Alex", "a": "4203034322430044014412134110"}).encode()).decode().rstrip("=")

NAMES = ["Alex", "Alixxa", "Lars", "Holly", "Gregor", "Nathan", "Chrizzy", "Samy", "Sam", "Math", "Aston", "Moh",
         "Tymon", "Zoë", "Jan de Vries", "Sanne", "Sanne", "Pieter-Jan", "Emma", "Olivier"]

def fake_people(page, n):
    """Make n fake people with plausible, correlated answers, encoded with the app's own encoder."""
    return page.evaluate("""([names, n]) => {
      const Q = window.COMPASS_QUESTIONS; let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const out = [];
      for (let p = 0; p < n; p++) {
        const lean = { e: rnd()*2-1, s: rnd()*2-1, h: rnd()*2-1 };
        const ans = Q.map(q => {
          if (rnd() < 0.06) return null;
          let t = 0; for (const a of ["e","s","h"]) if (q[a]) t += Math.sign(q[a]) * lean[a];
          const v = Math.round(2 + 2.2 * t + (rnd() - 0.5) * 2.2);
          return Math.max(0, Math.min(4, v));
        });
        out.push(window.Compass.encode(names[p % names.length], p === 3 ? "HV" : "", ans));
      }
      return out;
    }""", [NAMES, n])

with sync_playwright() as pw:
    browser = pw.chromium.launch()

    # ---------- 1. codes and labels (unit tests inside the page) ----------
    page = browser.new_page()
    page.goto(URL)
    r = page.evaluate("""(OLD) => {
      const C = window.Compass, res = {};
      res.ansLen = C.ANS_LEN;
      let ok = true, maxLen = 0;
      const names = ["Teun", "Zoë van Dijk", "a_b c", "O'Brien (UK).", "Jean-Luc!", "Łukasz", "名前"];
      for (let t = 0; t < 300; t++) {
        const ans = Array.from({length: C.N}, () => { const r = Math.random(); return r < 0.15 ? null : Math.floor(r * 5.99 - 0.9) < 0 ? 0 : Math.min(4, Math.floor(Math.random()*5)); });
        const name = names[t % names.length], tag = ["", "TV", "x9Z"][t % 3];
        const code = C.encode(name, tag, ans);
        maxLen = Math.max(maxLen, code.length);
        const d = C.decode(code);
        if (d.error || d.name !== name || d.tag !== tag || JSON.stringify(d.answers) !== JSON.stringify(ans)) { ok = false; res.bad = [code, d]; break; }
        const inText = C.decode("hi Teun, here's mine: " + code + ". cheers");
        if (inText.error || inText.code !== code) { ok = false; res.badText = [code, inText]; break; }
      }
      res.roundTrip = ok; res.maxLen = maxLen;
      res.allNull = C.decode(C.encode("Ann", "", Array(C.N).fill(null))).answers.every(v => v === null);
      res.allFour = C.decode(C.encode("Ann", "", Array(C.N).fill(4))).answers.every(v => v === 4);
      const good = C.encode("Teun", "", Array(C.N).fill(2));
      res.sample = good; res.sampleLen = good.length;
      res.old = C.decode(OLD).error;
      const v2 = C.decode("C2S7fNfh2BPVTdQsNbvAxtBePveZcJOQbQgh4HgTfknWiyk19EXGUQyIEL0T.Teun");
      res.v2 = v2.error || (v2.version + ":" + v2.answers.slice(0, 127).filter(a => a !== null).length + ":" + v2.answers.slice(127).every(a => a === null));
      const v1 = C.decode("C1BDewSIpAzbmpC81qd5wdxDGN5J7fknWiyk19EXGUQyIErfT.Teun");
      res.v1 = v1.error || (v1.version + ":" + v1.answers.length + ":" + v1.answers.slice(0, 100).filter(a => a !== null).length + ":" + v1.answers.slice(100).every(a => a === null));
      res.newer = C.decode("C9" + good.slice(2)).error;
      res.cut = C.decode(good.slice(0, 30)).error;
      const flipped = good.slice(0, 10) + (good[10] === "A" ? "B" : "A") + good.slice(11);
      res.typo = C.decode(flipped).error;
      res.cutName = C.decode(good.slice(0, -1)).error;
      const lab = names => { const l = names.map(([name, tag]) => ({name, tag})); C.assignLabels(l); return l.map(p => p.label); };
      res.alAl = lab([["Alex",""],["Alixxa",""]]);
      res.tagWins = lab([["Teun","TE"],["Teresa",""]]);
      res.twins = lab([["Sanne",""],["Sanne",""]]);
      res.multi = lab([["Jan de Vries",""],["Jan",""]]);
      res.samSamy = lab([["Sam",""],["Samy",""],["Sami",""]]);
      return res;
    }""", OLD)
    print(json.dumps({k: v for k, v in r.items() if k not in ("bad", "badText")}, ensure_ascii=False))
    check(r["roundTrip"], "300 random codes decode back to the same name, label and answers (also inside a sentence)")
    check(r["allNull"] and r["allFour"], "all-skipped and all-strongly-agree edge cases survive")
    check(r["sampleLen"] <= 100, f"a code for 'Teun' is short ({r['sampleLen']} characters)")
    check(r["old"] == "old", "old-version code is rejected as 'old'")
    check(r["newer"] in ("newer", "broken"), "unknown future version is rejected")
    check(r["cut"] == "broken" and r["typo"] == "broken" and r["cutName"] == "broken", "cut-off and mistyped codes are rejected")
    check(r["alAl"] == ["Ale", "Ali"], f"Alex and Alixxa get different labels {r['alAl']}")
    check(r["tagWins"][0] == "TE" and r["tagWins"][1] != "Te", f"a chosen label wins {r['tagWins']}")
    check(len(set(r["twins"])) == 2, f"two people with the same name get different labels {r['twins']}")
    check(len(set(r["samSamy"])) == 3, f"Sam, Samy and Sami all differ {r['samSamy']}")
    codes = fake_people(page, 20)
    page.close()

    # ---------- 2. the full flow, with a fake group and a fake Google Form ----------
    results_js = "window.COMPASS_RESULTS = " + json.dumps(codes + [OLD]) + ";"
    config_js = """window.COMPASS_CONFIG = {owner:"Teun", ownerX:"Teunemansvb", form:{
      action:"https://docs.google.com/forms/d/e/TEST/formResponse", code:"entry.1", kind:"entry.2", key:"entry.3", consent:"entry.4"}};"""
    posts = []

    def setup(context):
        context.route("**/results.js", lambda route: route.fulfill(body=results_js, content_type="text/javascript"))
        context.route("**/config.js", lambda route: route.fulfill(body=config_js, content_type="text/javascript"))
        def form(route):
            posts.append(urllib.parse.parse_qs(route.request.post_data or ""))
            route.fulfill(status=200, body="ok")
        context.route("https://docs.google.com/**", form)
        external = []
        context.on("request", lambda req: external.append(req.url) if not req.url.startswith(f"http://127.0.0.1:{PORT}") and "docs.google.com" not in req.url and not req.url.startswith("data:") else None)
        return external

    for label, size, mobile in [("desktop", {"width": 1280, "height": 900}, False), ("phone", {"width": 390, "height": 844}, True)]:
        ctx = browser.new_context(viewport=size, is_mobile=mobile, has_touch=mobile, device_scale_factor=2 if mobile else 1)
        external = setup(ctx)
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(URL)
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / f"{label}-1-start.png"), full_page=True)

        page.fill("#name", "Teun")
        page.click("#start")
        page.wait_for_timeout(100)
        page.screenshot(path=str(OUT / f"{label}-2-question.png"))
        # Answer: mostly by clicking, skip a few
        random.seed(3)
        n_q = page.evaluate("window.Compass.N")
        for i in range(n_q):
            if i in (5, 41, 77):
                page.click("#skip")
            else:
                page.click(f"#answers button >> nth={random.randint(0, 4)}")
        page.wait_for_timeout(300)
        check(not page.is_hidden("#result"), f"[{label}] result appears after the last statement")
        txt = page.inner_text("#answered-note")
        check(f"{n_q - 3} of {n_q}" in txt, f"[{label}] skipped statements are counted: {txt!r}")
        check(page.inner_text("#group-count").startswith("20"), f"[{label}] group shows the 20 valid built-in people, ignoring the old code: {page.inner_text('#group-count')!r}")
        check(page.locator("#closest-you-list .match-row").count() == 5, f"[{label}] 'closest to you' lists 5 people")
        check(page.locator("#people .person").count() == 12 and "Show all 21" in page.inner_text("#people-more"), f"[{label}] long list is shortened to 12 with a 'Show all' button")
        page.click("#people-more")
        labels = page.eval_on_selector_all("#people .ball", "els => els.map(e => e.textContent)")
        check(len(labels) == len(set(l.lower() for l in labels)), f"[{label}] every ball label is unique: {labels}")
        page.screenshot(path=str(OUT / f"{label}-3-result.png"), full_page=True)

        # Shareable image
        if not mobile:
            with page.expect_download() as dl:
                page.click("#share-img")
            dl.value.save_as(str(OUT / "share-image.png"))
            check(dl.value.suggested_filename == "compass-teun.png", "[desktop] 'Save as image' downloads compass-teun.png")
        # Send
        check(page.is_disabled("#send-btn"), f"[{label}] Add me is disabled until consent is ticked")
        page.check("#consent")
        page.click("#send-btn")
        page.wait_for_timeout(300)
        check(len(posts) >= 1 and posts[-1].get("entry.2") == ["add"] and posts[-1]["entry.1"][0].startswith("C7"), f"[{label}] result is posted to the form with kind=add")
        check("Sent on" in page.inner_text("#send-status"), f"[{label}] confirmation shown")

        # Group views
        page.locator("#people .person").nth(3).click()
        page.wait_for_timeout(200)
        check(not page.is_hidden("#focus"), f"[{label}] clicking a person opens their closest matches")
        check(page.locator("#focus .diff").count() >= 1, f"[{label}] focus panel shows where you differ most")
        page.locator("#group").screenshot(path=str(OUT / f"{label}-4-group-2d.png"))
        page.click("#view-3d")
        page.wait_for_timeout(600)
        check(page.is_visible("#plot3d") and page.is_hidden("#plot"), f"[{label}] 3D button swaps the 2D compass for the 3D view")
        page.locator("#group").screenshot(path=str(OUT / f"{label}-5-group-3d.png"))
        page.click("#view-2d")
        page.check("#divisive")
        page.locator("#compare").screenshot(path=str(OUT / f"{label}-6-compare.png"))

        # Remove
        page.click("#remove-link")
        page.wait_for_timeout(500)
        page.click("#remove-btn")
        page.wait_for_timeout(300)
        check(posts[-1].get("entry.2") == ["remove"] and posts[-1].get("entry.3") == posts[-2].get("entry.3"), f"[{label}] removal request sent with the same removal key")

        # Dark mode
        page.click("#theme")
        page.wait_for_timeout(100)
        page.evaluate("window.scrollTo(0,0)")
        page.screenshot(path=str(OUT / f"{label}-7-dark.png"), full_page=True)
        page.click("#theme")

        # Continue with an old code
        page.click("#retake")
        page.click("#resume-code summary")
        page.fill("#old-code", OLD)
        page.click("#use-code")
        check("old version" in page.inner_text("#old-code-note"), f"[{label}] old code shows a clear message")

        overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        check(not overflow, f"[{label}] no horizontal scrolling")
        check(not errors, f"[{label}] no JavaScript errors {errors[:3]}")
        check(not external, f"[{label}] no requests to other websites {external[:3]}")
        ctx.close()

    # ---------- 3. owner page ----------
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    setup(ctx)
    page = ctx.new_page()
    page.goto(URL + "?owner")
    page.wait_for_timeout(300)
    check(not page.is_hidden("#owner"), "owner tools appear with ?owner")
    check("1 unreadable" in page.inner_text("#owner-status"), f"owner tools flag the old code: {page.inner_text('#owner-status')!r}")
    page.locator("#owner").screenshot(path=str(OUT / "desktop-8-owner.png"))
    ctx.close()

    # ---------- 4. empty group, sending switched off ----------
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx.route("**/config.js", lambda route: route.fulfill(body='window.COMPASS_CONFIG = {owner:"Teun", ownerX:"Teunemansvb", form:{action:""}};', content_type="text/javascript"))
    ctx.route("**/results.js", lambda route: route.fulfill(body="window.COMPASS_RESULTS = [];", content_type="text/javascript"))
    page = ctx.new_page()
    page.goto(URL)
    page.fill("#name", "Sanne")
    page.click("#start")
    for i in range(30):
        page.click("#answers button >> nth=1")
    page.click("#finish")
    page.wait_for_timeout(200)
    check(not page.is_hidden("#send-off"), "with no form configured, the page explains how to send the code on X")
    page.screenshot(path=str(OUT / "phone-9-empty-group.png"), full_page=True)
    ctx.close()
    browser.close()

server.shutdown()
print("\n" + ("ALL CHECKS PASSED" if not failures else f"{len(failures)} FAILED"))
sys.exit(1 if failures else 0)
