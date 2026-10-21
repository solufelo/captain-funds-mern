import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  cometPoint,
  easeOutExpo,
  formatChange,
  giftImpact,
  orbitLayout,
  orbitPoint,
  periodDelta,
  shareLabel,
  sparkPath,
  toneIndex,
  tweenValue,
} from "./insights.ts";

describe("count-up tween", () => {
  test("easing is clamped and monotonic", () => {
    assert.equal(easeOutExpo(-1), 0);
    assert.equal(easeOutExpo(0), 0);
    assert.equal(easeOutExpo(1), 1);
    assert.equal(easeOutExpo(2), 1);
    let last = 0;
    for (let t = 0.05; t < 1; t += 0.05) {
      const v = easeOutExpo(t);
      assert.ok(v > last);
      last = v;
    }
  });

  test("lands exactly on the target and stays whole", () => {
    assert.equal(tweenValue(0, 40495, 1200, 1200), 40495);
    assert.equal(tweenValue(0, 40495, 5000, 1200), 40495);
    assert.equal(tweenValue(100, 150, 0, 1200), 100);
    assert.ok(Number.isInteger(tweenValue(0, 999, 333, 1200)));
    assert.equal(tweenValue(10, 20, 50, 0), 20, "zero duration jumps to the end");
  });

  test("counts down as well as up", () => {
    const mid = tweenValue(500, 100, 300, 1000);
    assert.ok(mid < 500 && mid > 100);
  });
});

describe("gift impact", () => {
  test("shows how far a gift moves the bar", () => {
    const r = giftImpact(6885, 8500, 50);
    assert.equal(r.beforePct, 81);
    assert.equal(r.afterPct, 82);
    assert.ok(Math.abs(r.gainPct - (50 / 8500) * 100) < 1e-9);
    assert.equal(r.remainingAfter, 8500 - 6885 - 50);
    assert.equal(r.reachesGoal, false);
  });

  test("flags the gift that crosses the goal and caps the segment", () => {
    const r = giftImpact(8400, 8500, 250);
    assert.equal(r.reachesGoal, true);
    assert.equal(r.remainingAfter, 0);
    assert.ok(r.gainPct <= 100 - (8400 / 8500) * 100 + 1e-9);
    assert.equal(r.afterPct, 102, "the label can pass 100% even though the bar can't");
  });

  test("already funded campaigns don't 'reach' the goal again", () => {
    assert.equal(giftImpact(9000, 8500, 10).reachesGoal, false);
    assert.equal(giftImpact(9000, 8500, 10).gainPct, 0);
  });

  test("bad input is harmless", () => {
    assert.deepEqual(giftImpact(100, 0, 50), { beforePct: 0, afterPct: 0, gainPct: 0, remainingAfter: 0, reachesGoal: false });
    assert.equal(giftImpact(100, 1000, Number.NaN).gainPct, 0);
    assert.equal(giftImpact(100, 1000, -20).gainPct, 0);
  });
});

describe("period delta", () => {
  const days = (xs: number[]) => xs.map((amount) => ({ amount }));

  test("compares the last window with the one before", () => {
    const d = periodDelta(days([1, 1, 1, 10, 10, 10, 20, 20, 20]), 3);
    assert.equal(d.current, 60);
    assert.equal(d.previous, 30);
    assert.equal(d.change, 1);
  });

  test("no previous giving means no percentage", () => {
    assert.equal(periodDelta(days([0, 0, 0, 5, 5, 5]), 3).change, null);
    assert.equal(periodDelta([], 7).change, null);
  });

  test("formats signed percentages", () => {
    assert.equal(formatChange(0.1234), "+12%");
    assert.equal(formatChange(-0.08), "−8%");
    assert.equal(formatChange(0.001), "flat");
    assert.equal(formatChange(null), null);
    assert.equal(formatChange(Number.POSITIVE_INFINITY), null);
  });
});

describe("orbit layout", () => {
  const items = [
    { id: "a", target: 12000, raised: 7440 },
    { id: "b", target: 8500, raised: 6885 },
    { id: "c", target: 20000, raised: 8800 },
    { id: "d", target: 5000, raised: 5100 },
    { id: "e", target: 3000, raised: 900 },
    { id: "f", target: 15000, raised: 4000 },
  ];

  test("is deterministic and keeps every campaign", () => {
    const a = orbitLayout(items);
    assert.deepEqual(a, orbitLayout(items));
    assert.deepEqual(a.map((b) => b.id), items.map((i) => i.id));
    assert.deepEqual(orbitLayout([]), []);
  });

  test("spreads bodies over the three rings, inner rings faster", () => {
    const a = orbitLayout(items);
    assert.deepEqual([...new Set(a.map((b) => b.ring))], [0, 1, 2]);
    const speed = (r: number) => a.find((b) => b.ring === r)!.speed;
    assert.ok(speed(0) > speed(1) && speed(1) > speed(2));
    const radius = (r: number) => a.find((b) => b.ring === r)!.radius;
    assert.ok(radius(0) < radius(1) && radius(1) < radius(2) && radius(2) <= 1);
  });

  test("bigger goals get bigger planets within the size range", () => {
    const a = orbitLayout(items, 64, 30);
    const size = (id: string) => a.find((b) => b.id === id)!.size;
    assert.equal(size("c"), 64);
    assert.equal(size("e"), 30);
    assert.ok(size("a") > size("b"));
  });

  test("percent funded is carried through", () => {
    assert.equal(orbitLayout(items).find((b) => b.id === "d")!.percent, 102);
  });

  test("bodies on a ring don't overlap at the start", () => {
    const a = orbitLayout(items).filter((b) => b.ring === 0);
    if (a.length > 1) assert.notEqual(a[0].angle % (Math.PI * 2), a[1].angle % (Math.PI * 2));
  });

  test("orbit points sit on a squashed ellipse with depth", () => {
    const front = orbitPoint(Math.PI / 2, 100, 0.36);
    const back = orbitPoint(-Math.PI / 2, 100, 0.36);
    assert.ok(Math.abs(front.x) < 1e-9 && Math.abs(front.y - 36) < 1e-9);
    assert.equal(front.depth, 1);
    assert.equal(back.depth, -1);
    assert.ok(front.scale > back.scale);
  });
});

describe("tone index", () => {
  test("is stable and in range", () => {
    assert.equal(toneIndex("Leah L.", 6), toneIndex("Leah L.", 6));
    for (const n of ["A", "Grace K.", "Anonymous", ""]) {
      const i = toneIndex(n, 6);
      assert.ok(i >= 0 && i < 6);
    }
    assert.equal(toneIndex("x", 0), 0);
  });
});

describe("sparkline path", () => {
  test("scales into the box with the peak at the top", () => {
    const { line, area } = sparkPath([0, 5, 10], 100, 40, 0);
    assert.equal(line, "M0.0 40.0 L50.0 20.0 L100.0 0.0");
    assert.ok(area.startsWith(line) && area.endsWith("Z"));
  });

  test("handles empty, flat and negative input", () => {
    assert.deepEqual(sparkPath([], 100, 40), { line: "", area: "" });
    assert.ok(!sparkPath([0, 0, 0], 100, 40).line.includes("NaN"));
    assert.ok(!sparkPath([7], 100, 40).line.includes("NaN"));
    assert.ok(!sparkPath([-5, 3], 100, 40).line.includes("NaN"));
  });
});

describe("gift comets", () => {
  const from = { x: 200, y: -60 };
  test("starts at the planet and lands on the sun", () => {
    const a = cometPoint(from, 0);
    assert.ok(Math.abs(a.x - 200) < 1e-9 && Math.abs(a.y + 60) < 1e-9);
    const b = cometPoint(from, 1);
    assert.ok(Math.abs(b.x) < 1e-9 && Math.abs(b.y) < 1e-9);
    assert.deepEqual(cometPoint(from, 5), b, "progress is clamped");
  });

  test("gets closer to the sun the whole way down", () => {
    let last = Infinity;
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const p = cometPoint(from, t);
      const d = Math.hypot(p.x, p.y);
      assert.ok(d < last + 1e-9);
      last = d;
    }
  });

  test("with no bend it falls in a straight line, heading at the sun", () => {
    const p = cometPoint({ x: 100, y: 0 }, 0.5, 0);
    assert.ok(Math.abs(p.y) < 1e-9 && p.x > 0 && p.x < 100);
    assert.equal(Math.round(Math.abs(p.angle)), 180);
  });
});

describe("share labels", () => {
  test("rounds, flags slivers and handles empty totals", () => {
    assert.equal(shareLabel(25, 100), "25%");
    assert.equal(shareLabel(100, 40595), "<1%");
    assert.equal(shareLabel(40495, 40595), "100%");
    assert.equal(shareLabel(0, 100), "0%");
    assert.equal(shareLabel(5, 0), "0%");
  });
});
