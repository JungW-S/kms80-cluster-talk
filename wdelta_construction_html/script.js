const chainData = [
  { t: 1, step: "<span class=\"math-formula\">c=3</span>", cells: [2, 3, 1, 2, 2, 1], env: [3], box: [3], label: "<span class=\"math-formula\">c<sub>1</sub>=[3,3]</span>", color: 1, side: "R", h: 1, star: "" },
  { t: 2, step: "<span class=\"math-formula\">L</span>", cells: [2, 3, 1, 2, 2, 1], env: [2, 3], box: [2], label: "<span class=\"math-formula\">c<sub>2</sub>=[2,2]</span>", color: 3, side: "L", h: 1, star: "3*" },
  { t: 3, step: "<span class=\"math-formula\">R</span>", cells: [2, 3, 1, 2, 2, 1], env: [2, 3, 4], box: [4], label: "<span class=\"math-formula\">c<sub>3</sub>=[4,4]</span>", color: 2, side: "R", h: 2, star: "" },
  { t: 4, step: "<span class=\"math-formula\">L</span>", cells: [2, 3, 1, 2, 2, 1], env: [1, 2, 3, 4], box: [1, 2, 3, 4], label: "<span class=\"math-formula\">c<sub>4</sub>=[1,4]</span>", color: 2, side: "L", h: 2, star: "2*" },
  { t: 5, step: "<span class=\"math-formula\">R</span>", cells: [2, 3, 1, 2, 2, 1], env: [1, 2, 3, 4, 5], box: [1, 2, 3, 4, 5], label: "<span class=\"math-formula\">c<sub>5</sub>=[1,5]</span>", color: 2, side: "R", h: 2, star: "" },
  { t: 6, step: "<span class=\"math-formula\">R</span>", cells: [2, 3, 1, 2, 2, 1], env: [1, 2, 3, 4, 5, 6], box: [3, 4, 5, 6], label: "<span class=\"math-formula\">c<sub>6</sub>=[3,6]</span>", color: 1, side: "R", h: 1, star: "" }
];

const deltaWord = [1, 2, 1, 3, 2, 1];
const uWord = [2, 3, 1, 2, 2, 1];
const leftOrder = [4, 2];
const rightOrder = [1, 3, 5, 6];
const readStart = 0.24;
const readEnd = 0.43;

const weaveOuterStart = 0.610;
const weaveOuterSpan = 0.38;
const NAVIGATION_SPEED_MULTIPLIER = 2;

const baseSceneProgress = [
  0,
  0.16,
  0.222,
  0.238,
  0.245,
  0.274,
  0.296,
  0.310,
  0.338,
  0.360,
  0.372,
  0.404,
  0.545,
  0.99
];

let sceneProgress = baseSceneProgress.slice();

const els = {
  shell: document.querySelector(".scroll-shell"),
  frame: document.querySelector(".sticky-frame"),
  canvas: document.getElementById("visualCanvas"),
  pyramid: document.getElementById("pyramid"),
  chainRows: document.getElementById("chainRows"),
  deltaCard: document.getElementById("deltaCard"),
  deltaStart: document.getElementById("deltaStart"),
  assembly: document.getElementById("assembly"),
  deltaSpine: document.getElementById("deltaSpine"),
  leftSlots: document.getElementById("leftSlots"),
  rightSlots: document.getElementById("rightSlots"),
  movingTokens: document.getElementById("movingTokens"),
  starPanel: document.getElementById("starPanel"),
  starFrom: document.getElementById("starFrom"),
  starTo: document.getElementById("starTo"),
  phaseSteps: Array.from(document.querySelectorAll(".phase-step")),
  storyBlocks: Array.from(document.querySelectorAll(".story-block")),
  storyModeOverlay: document.getElementById("storyModeOverlay")
};

let forcedProgress = null;
let presentationProgress = null;
let navAnimation = 0;
let navAnimationTimer = 0;
let activePhase = -1;
let activeStory = -1;
let lastStoryModePhase = 0;
let mappedTrivalentStops = [];
let mappedTopWeaveStart = 0.941;
let mappedTopBoundaryEnd = 0.950;
let mappedTopRevealEnd = 0.970;
let mappedConcatStart = 0.980;
let mappedResultStart = 0.988;

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function makeChip(value, className = "") {
  const chip = document.createElement("span");
  chip.className = `word-chip ${className}`.trim();
  chip.textContent = value;
  return chip;
}

function makeRow(item) {
  const row = document.createElement("div");
  row.className = "chain-row";
  row.dataset.t = String(item.t);

  const step = document.createElement("span");
  step.className = "chain-step-label";
  step.innerHTML = item.step;

  const cells = document.createElement("span");
  cells.className = "chain-cells";
  item.cells.forEach((value, index) => {
    const cell = document.createElement("span");
    const pos = index + 1;
    const classNames = ["chain-letter"];
    if (item.env.includes(pos)) classNames.push("env");
    if (item.box.includes(pos)) classNames.push("box");
    cell.className = classNames.join(" ");
    cell.textContent = value;
    cells.appendChild(cell);
  });

  const label = document.createElement("span");
  label.className = "chain-box-label";
  label.innerHTML = item.label;

  const source = document.createElement("span");
  source.className = "color-source";
  source.dataset.t = String(item.t);
  source.textContent = item.color;

  row.append(step, cells, label, source);
  return row;
}

function makeSlot(item, side) {
  const slot = document.createElement("span");
  slot.className = `side-slot ${side}-slot`;
  slot.dataset.t = String(item.t);
  slot.dataset.sourceIndex = String(item.t - 1);

  const sourceLabel = document.createElement("span");
  sourceLabel.className = "slot-source-label";
  sourceLabel.innerHTML = `c<sub>${item.t}</sub>`;

  const main = document.createElement("span");
  main.className = "slot-main";
  main.textContent = item.h;
  slot.append(sourceLabel, main);

  return slot;
}

function makeMovingChip(item) {
  const chip = document.createElement("span");
  chip.className = `generated-chip is-${item.side === "L" ? "left" : "right"}`;
  chip.dataset.t = String(item.t);
  const main = document.createElement("span");
  main.className = "chip-main";
  main.textContent = item.color;
  chip.appendChild(main);
  return chip;
}

function setupDom() {
  chainData.forEach((item) => els.chainRows.appendChild(makeRow(item)));
  deltaWord.forEach((value) => {
    els.deltaStart.appendChild(makeChip(value, "delta"));
    els.deltaSpine.appendChild(makeChip(value, "delta"));
  });

  leftOrder.forEach((t) => {
    const item = chainData.find((entry) => entry.t === t);
    els.leftSlots.appendChild(makeSlot(item, "left"));
  });

  rightOrder.forEach((t) => {
    const item = chainData.find((entry) => entry.t === t);
    els.rightSlots.appendChild(makeSlot(item, "right"));
  });

  chainData.forEach((item) => els.movingTokens.appendChild(makeMovingChip(item)));
}

function localRect(element) {
  const canvasRect = els.canvas.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - canvasRect.left + rect.width / 2,
    y: rect.top - canvasRect.top + rect.height / 2,
    width: rect.width,
    height: rect.height
  };
}

function tokenPositions() {
  const sources = new Map();
  const targets = new Map();
  chainData.forEach((item) => {
    const source = els.canvas.querySelector(`.color-source[data-t="${item.t}"]`);
    const target = els.canvas.querySelector(`.side-slot[data-t="${item.t}"]`);
    if (source) sources.set(item.t, localRect(source));
    if (target) targets.set(item.t, localRect(target));
  });
  return { sources, targets };
}

function sceneIndexFromProgress(progress) {
  let active = 0;
  sceneProgress.forEach((scenePoint, index) => {
    const midpoint = index === sceneProgress.length - 1
      ? 1
      : (scenePoint + sceneProgress[index + 1]) / 2;
    if (progress >= midpoint) active = index + 1;
  });
  return Math.min(active, sceneProgress.length - 1);
}

function storyIndexFromProgress(progress) {
  if (progress < 0.13) return 0;
  if (progress < 0.21) return 1;
  if (progress < 0.24) return 2;
  if (progress < 0.52) return 3;
  if (progress < 0.620) return 4;
  if (progress < mappedTopWeaveStart) return 5;
  return 6;
}

function phaseIndexFromProgress(progress) {
  if (progress < 0.620) return 0;
  if (progress < mappedTopWeaveStart) return 1;
  return 2;
}

function updatePhaseLabel(progress) {
  const next = phaseIndexFromProgress(progress);
  if (next === activePhase) return;
  activePhase = next;
  els.phaseSteps.forEach((step, index) => {
    step.classList.toggle("active", index === next);
  });
}

function ordinalLabel(index) {
  return ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth"][index]
    ?? `Number ${index + 1}`;
}

function trivalentIndexNearProgress(progress, windowSize = 0.008) {
  if (mappedTrivalentStops.length === 0) return -1;
  let bestIndex = -1;
  let bestDistance = Infinity;
  mappedTrivalentStops.forEach((stop, index) => {
    const distance = Math.abs(stop.progress - progress);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestDistance <= windowSize ? bestIndex : -1;
}

function updateStory(progress) {
  const next = storyIndexFromProgress(progress);
  if (next === activeStory) return;
  activeStory = next;
  els.storyBlocks.forEach((block, index) => {
    block.classList.toggle("active", index === next);
  });
}

function currentChainItem(progress) {
  const span = (readEnd - readStart) / chainData.length;
  const index = clamp(Math.floor((progress - readStart) / span), 0, chainData.length - 1);
  const begin = readStart + index * span;
  return {
    item: chainData[index],
    local: clamp((progress - begin) / span),
  };
}

function activeStoryLineIndex(progress, storyIndex) {
  if (storyIndex === 0) {
    return -1;
  }
  if (storyIndex === 1) return -1;
  if (storyIndex === 2) return progress < 0.232 ? 0 : 1;
  if (storyIndex === 3) {
    const { item } = currentChainItem(progress);
    return item.side === "L" ? 1 : 0;
  }
  if (storyIndex === 4) return -1;
  if (storyIndex === 5) {
    const firstTrivalent = mappedTrivalentStops[0]?.progress ?? (weaveOuterStart + 0.080);
    const lastTrivalent = mappedTrivalentStops[mappedTrivalentStops.length - 1]?.progress ?? (mappedTopWeaveStart - 0.030);
    if (progress <= firstTrivalent + 0.001) return 0;
    if (progress < lastTrivalent + 0.010) return 1;
    return 2;
  }
  return -1;
}

function updateStoryLineEmphasis(progress) {
  els.storyBlocks.forEach((block, storyIndex) => {
    if (storyIndex === 6) return;
    const activeLine = storyIndex === activeStory
      ? activeStoryLineIndex(progress, storyIndex)
      : -1;
    block.querySelectorAll(".story-list > li").forEach((line, lineIndex) => {
      line.classList.toggle("is-active", lineIndex === activeLine);
    });
  });
}

function updateFinalEmphasis(progress) {
  const showResult = progress >= mappedResultStart + 0.004;
  const showConcat = progress >= mappedConcatStart - 0.002 && !showResult;
  document.querySelectorAll(".final-construct-emphasis").forEach((line) => {
    line.classList.toggle("is-active", !showConcat && !showResult);
  });
  document.querySelectorAll(".final-concat-emphasis").forEach((line) => {
    line.classList.toggle("is-active", showConcat);
  });
  document.querySelectorAll(".final-result-emphasis").forEach((line) => {
    line.classList.toggle("is-active", showResult);
  });
}

function transformPyramid(progress) {
  const move = smoothstep(0.07, 0.18, progress);
  const settle = smoothstep(0.32, 0.86, progress);
  const cleanup = smoothstep(0.49, 0.525, progress);
  const x = lerp(0, 11, move);
  const y = lerp(0, -7, move);
  const scale = lerp(1, 0.78, move);
  els.pyramid.style.transform = `translate(${x}%, ${y}%) scale(${scale})`;
  els.pyramid.style.opacity = String(lerp(1, 0.78, settle * 0.35) * (1 - cleanup));
}

function transformDelta(progress) {
  const move = smoothstep(0.07, 0.18, progress);
  const fade = smoothstep(0.185, 0.220, progress);
  const assemblyIn = smoothstep(0.205, 0.235, progress);
  const carry = smoothstep(0.49, 0.615, progress);
  const carryOut = 1 - smoothstep(0.90, 0.955, progress);
  const x = lerp(0, -55, move);
  const y = lerp(0, 118, move);
  const scale = lerp(1, 0.76, move);
  els.deltaCard.style.transform = `translate(${x}%, ${y}%) scale(${scale})`;
  els.deltaCard.style.opacity = String(1 - fade);
  els.assembly.classList.toggle("is-carry", carry > 0.08);
  els.assembly.classList.toggle("show-source-labels", progress >= weaveOuterStart + 0.006 && progress < 0.91);
  els.assembly.style.opacity = String(assemblyIn * carryOut);
  els.assembly.style.transform = `translate(-50%, ${lerp(18, -150, carry)}px) scale(${lerp(1, 0.69, carry)})`;
}

function revealSlots(progress) {
  const span = (readEnd - readStart) / chainData.length;
  const colorRevealStart = 0.224;
  const colorRevealEnd = 0.238;

  chainData.forEach((item, index) => {
    const begin = readStart + index * span;
    const end = begin + span * 0.82;
    const amount = smoothstep(begin + span * 0.62, end, progress);
    const row = els.canvas.querySelector(`.chain-row[data-t="${item.t}"]`);
    const slot = els.canvas.querySelector(`.side-slot[data-t="${item.t}"]`);
    const source = els.canvas.querySelector(`.color-source[data-t="${item.t}"]`);

    row?.classList.toggle("active", progress >= begin && progress < begin + span);
    row?.classList.toggle("dimmed", progress >= readStart && !(progress >= begin && progress < begin + span));
    source?.classList.toggle("recording", progress >= begin && progress < begin + span * 0.34);
    if (source) {
      const revealAt = lerp(colorRevealStart, colorRevealEnd, index / Math.max(1, chainData.length - 1));
      source.classList.toggle("revealed", progress >= revealAt);
    }
    slot?.classList.toggle("filled", amount > 0.70);
  });

  if (progress < readStart || progress > 0.91) {
    els.canvas.querySelectorAll(".chain-row").forEach((row) => {
      row.classList.remove("active", "dimmed");
    });
    els.canvas.querySelectorAll(".color-source").forEach((source) => {
      source.classList.remove("recording");
    });
  }
}

function animateMovingTokens(progress) {
  const { sources, targets } = tokenPositions();
  const span = (readEnd - readStart) / chainData.length;

  chainData.forEach((item, index) => {
    const chip = els.movingTokens.querySelector(`.generated-chip[data-t="${item.t}"]`);
    const source = sources.get(item.t);
    const target = targets.get(item.t);
    if (!chip || !source || !target) return;

    const begin = readStart + index * span;
    const travel = smoothstep(begin + span * 0.26, begin + span * 0.82, progress);
    const appear = smoothstep(begin + span * 0.20, begin + span * 0.32, progress);
    const stay = progress >= begin + span * 0.82 ? 0 : 1;
    const opacity = progress < begin ? 0 : Math.min(appear, stay);
    const x = lerp(source.x, target.x, travel);
    const y = lerp(source.y, target.y, travel);
    const lift = Math.sin(travel * Math.PI) * 24;
    const scale = lerp(0.78, 1.02, smoothstep(0, 0.6, travel));
    const main = chip.querySelector(".chip-main");

    if (item.side === "L") {
      if (travel < 0.34) {
        main.textContent = item.color;
      } else if (travel < 0.66) {
        main.textContent = item.color;
      } else {
        main.textContent = item.h;
      }
    } else {
      main.textContent = item.h;
    }

    chip.style.opacity = String(opacity);
    chip.style.transform = `translate(${x - source.width / 2}px, ${y - source.height / 2 - lift}px) scale(${scale})`;
  });
}

function updateStarPanel(progress) {
  const span = (readEnd - readStart) / chainData.length;
  let active = null;

  chainData.forEach((item, index) => {
    if (item.side !== "L") return;
    const begin = readStart + index * span;
    const end = begin + span * 1.08;
    if (progress >= begin && progress <= end) {
      active = item;
    }
  });

  if (active) {
    els.starFrom.textContent = active.color;
    els.starTo.textContent = active.h;
  }
  const visible = active ? 1 : 0;
  els.starPanel.style.opacity = String(visible);
  els.starPanel.style.transform = `translate(-50%, ${visible ? 0 : 10}px)`;
}

function getStoryModeApi() {
  return window.storyModeApi ?? null;
}

function setStoryModePhase(phase) {
  lastStoryModePhase = clamp(phase);
  window.STORY_MODE_PHASE = lastStoryModePhase;
  const api = getStoryModeApi();
  if (api?.setPhaseProgress) {
    api.setPhaseProgress(lastStoryModePhase);
  }
}

function updateWeave(progress) {
  const overlayIn = smoothstep(0.616, 0.642, progress);
  const phase = clamp((progress - weaveOuterStart) / weaveOuterSpan);
  els.storyModeOverlay.style.opacity = String(overlayIn);
  els.storyModeOverlay.style.transform = `translateY(${lerp(18, 0, overlayIn)}px) scale(${lerp(0.985, 1, overlayIn)})`;
  setStoryModePhase(phase);
  updateSourceLabels(progress);
}

function activeSourceIndexFromProgress(progress) {
  if (!mappedTrivalentStops.length) return null;
  const firstStop = mappedTrivalentStops[0].progress;
  for (let index = 0; index < mappedTrivalentStops.length; index += 1) {
    const current = mappedTrivalentStops[index];
    const previous = mappedTrivalentStops[index - 1];
    const start = index === 0 ? firstStop - 0.032 : previous.progress + 0.010;
    const end = current.progress + 0.020;
    if (progress >= start && progress <= end) {
      return current.record?.sourceIndex ?? null;
    }
  }
  return null;
}

function updateSourceLabels(progress) {
  const activeSourceIndex = activeSourceIndexFromProgress(progress);
  els.canvas.querySelectorAll(".side-slot").forEach((slot) => {
    const sourceIndex = Number.parseInt(slot.dataset.sourceIndex ?? "", 10);
    slot.classList.toggle("source-current", Number.isFinite(sourceIndex) && sourceIndex === activeSourceIndex);
  });
}

function mapStoryModeStop(stop, marks) {
  const start = Number.isFinite(marks.handoffStart) ? marks.handoffStart : 0;
  const end = Number.isFinite(marks.finalEnd) ? marks.finalEnd : 1;
  if (!Number.isFinite(stop) || end <= start || stop < start) return null;
  return weaveOuterStart + ((stop - start) / (end - start)) * weaveOuterSpan;
}

function updateNavigationStopsFromStoryMode(api) {
  const marks = api?.phaseMarks ?? {};
  const storyStops = Array.isArray(api?.keyboardStops) ? api.keyboardStops : [];
  const storyTrivalentStops = Array.isArray(api?.trivalentStops) ? api.trivalentStops : [];
  const storyTrivalentRecords = Array.isArray(api?.trivalentRecords) ? api.trivalentRecords : [];
  const topWeaveStart = mapStoryModeStop(marks.topBoundaryStart ?? marks.topRevealStart, marks);
  const topBoundaryEnd = mapStoryModeStop(marks.topBoundaryEnd, marks);
  const topRevealEnd = mapStoryModeStop(marks.topRevealEnd, marks);
  const concatStart = mapStoryModeStop(marks.concatStart, marks);
  const concatEnd = mapStoryModeStop(marks.concatEnd, marks);
  if (Number.isFinite(topWeaveStart)) mappedTopWeaveStart = clamp(topWeaveStart, weaveOuterStart, 0.99);
  if (Number.isFinite(topBoundaryEnd)) mappedTopBoundaryEnd = clamp(topBoundaryEnd, weaveOuterStart, 0.99);
  if (Number.isFinite(topRevealEnd)) mappedTopRevealEnd = clamp(topRevealEnd, weaveOuterStart, 0.99);
  if (Number.isFinite(concatStart)) mappedConcatStart = clamp(concatStart, weaveOuterStart, 0.99);
  if (Number.isFinite(concatEnd)) mappedResultStart = clamp(concatEnd, weaveOuterStart, 0.99);
  mappedTrivalentStops = storyTrivalentStops
    .map((stop, index) => ({
      progress: mapStoryModeStop(stop, marks),
      record: storyTrivalentRecords[index] ?? null,
    }))
    .filter((entry) => Number.isFinite(entry.progress))
    .map((entry) => ({
      ...entry,
      progress: clamp(entry.progress, weaveOuterStart, 0.99),
    }))
    .sort((left, right) => left.progress - right.progress);
  const firstTrivalentStop = mappedTrivalentStops[0]?.progress ?? weaveOuterStart;
  const lastTrivalentStop = mappedTrivalentStops[mappedTrivalentStops.length - 1]?.progress ?? null;
  const lowerWeaveCompleteStop = Number.isFinite(lastTrivalentStop) && Number.isFinite(mappedTopWeaveStart)
    ? Math.min(
      mappedTopWeaveStart - 0.018,
      Math.max(lastTrivalentStop + 0.020, mappedTopWeaveStart - 0.040),
    )
    : null;
  const mappedStops = storyStops
    .map((stop) => mapStoryModeStop(stop, marks))
    .filter((stop) => Number.isFinite(stop))
    .map((stop) => clamp(stop, weaveOuterStart, 0.99))
    .filter((stop) => stop >= firstTrivalentStop - 0.001 || stop >= 0.94)
    .filter((stop) => {
      if (!Number.isFinite(lowerWeaveCompleteStop) || !Number.isFinite(mappedTopWeaveStart)) return true;
      return stop <= lowerWeaveCompleteStop + 0.006;
    });
  const introStops = [
    firstTrivalentStop,
  ]
    .filter((stop) => Number.isFinite(stop))
    .map((stop) => clamp(stop, weaveOuterStart, 0.99));
  const completionStops = [
    Number.isFinite(lowerWeaveCompleteStop) ? lowerWeaveCompleteStop : null,
  ]
    .filter((stop) => Number.isFinite(stop))
    .map((stop) => clamp(stop, weaveOuterStart, 0.99));
  const finalStageStops = [
    Number.isFinite(mappedTopBoundaryEnd) ? mappedTopBoundaryEnd : null,
    Number.isFinite(mappedTopRevealEnd) ? mappedTopRevealEnd : null,
    Number.isFinite(mappedConcatStart) ? mappedConcatStart : null,
    Number.isFinite(mappedResultStart) ? mappedResultStart : null,
  ]
    .filter((stop) => Number.isFinite(stop))
    .map((stop) => clamp(stop, weaveOuterStart, 0.99));
  sceneProgress = [...baseSceneProgress, ...introStops, ...mappedStops, ...completionStops, ...finalStageStops, 0.99]
    .sort((left, right) => left - right)
    .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > 0.006);
}

function progressFromScroll() {
  if (presentationProgress !== null) return presentationProgress;
  if (forcedProgress !== null) return forcedProgress;

  const params = new URLSearchParams(window.location.search);
  if (params.has("p")) {
    const forced = Number.parseFloat(params.get("p"));
    if (!Number.isNaN(forced)) return clamp(forced);
  }

  const maxScroll = els.shell.offsetHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return clamp(window.scrollY / maxScroll);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function navIsAnimating() {
  return navAnimation !== 0 || navAnimationTimer !== 0;
}

function clearNavFrame() {
  if (navAnimation) cancelAnimationFrame(navAnimation);
  if (navAnimationTimer) window.clearTimeout(navAnimationTimer);
  navAnimation = 0;
  navAnimationTimer = 0;
}

function scheduleNavFrame(step) {
  if (navAnimationTimer) window.clearTimeout(navAnimationTimer);
  navAnimation = 1;
  navAnimationTimer = window.setTimeout(() => {
    navAnimationTimer = 0;
    navAnimation = 0;
    step();
  }, 16);
}

function renderProgress(progress) {
  updatePhaseLabel(progress);
  updateStory(progress);
  updateStoryLineEmphasis(progress);
  updateFinalEmphasis(progress);
  transformPyramid(progress);
  transformDelta(progress);
  revealSlots(progress);
  animateMovingTokens(progress);
  updateStarPanel(progress);
  updateWeave(progress);
}

function animateToProgress(targetProgress, options = {}) {
  const params = new URLSearchParams(window.location.search);
  const startProgress = progressFromScroll();
  const distance = Math.abs(targetProgress - startProgress);
  const speedMultiplier = Number.isFinite(options.speedMultiplier)
    ? options.speedMultiplier
    : NAVIGATION_SPEED_MULTIPLIER;
  const duration = clamp(620 + distance * 1600, 680, 1120) * speedMultiplier;
  const startTime = performance.now();
  const maxScroll = els.shell.offsetHeight - window.innerHeight;

  if (navIsAnimating()) clearNavFrame();

  const step = () => {
    const elapsed = performance.now() - startTime;
    const amount = easeInOutCubic(clamp(elapsed / duration));
    const nextProgress = lerp(startProgress, targetProgress, amount);
    presentationProgress = nextProgress;

    if (!params.has("p") && maxScroll > 0) {
      window.scrollTo(0, nextProgress * maxScroll);
    }

    renderProgress(nextProgress);

    if (amount < 1) {
      scheduleNavFrame(step);
      return;
    }

    clearNavFrame();
    if (params.has("p")) {
      forcedProgress = targetProgress;
    }
    presentationProgress = null;

    if (!params.has("p") && maxScroll > 0) {
      window.scrollTo(0, targetProgress * maxScroll);
    }
    renderProgress(targetProgress);
  };

  scheduleNavFrame(step);
}

function navigateScene(direction, options = {}) {
  if (navIsAnimating()) {
    if (options.force) clearNavFrame();
    else return true;
  }
  const current = sceneIndexFromProgress(progressFromScroll());
  const stepCount = Math.max(1, Math.floor(Number(options.stepCount) || 1));
  const next = clamp(current + direction * stepCount, 0, sceneProgress.length - 1);
  if (next === current) return false;
  const progress = sceneProgress[next];
  animateToProgress(progress, options);
  return true;
}

let raf = 0;

function update() {
  raf = 0;
  renderProgress(progressFromScroll());
}

function requestUpdate() {
  if (raf) return;
  raf = requestAnimationFrame(update);
}

function focusPageForKeyboard() {
  document.body.tabIndex = -1;
  document.body.focus({ preventScroll: true });
}

function handleKeyboardNavigation(event) {
  const target = event.target;
  if (target instanceof HTMLElement && target.closest("input, textarea, select, button, [contenteditable='true']")) {
    return;
  }
  if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    event.stopPropagation();
    const moved = navigateScene(1);
    if (!moved && document.body.classList.contains("deck-embed")) {
      window.parent?.postMessage({ type: "wdelta-boundary", direction: 1 }, "*");
    }
  }
  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    event.stopPropagation();
    const moved = navigateScene(-1);
    if (!moved && document.body.classList.contains("deck-embed")) {
      window.parent?.postMessage({ type: "wdelta-boundary", direction: -1 }, "*");
    }
  }
}

let embedWheelAccumulator = 0;
let embedWheelResetTimer = 0;
let embedLastWheelStepAt = 0;

function handleEmbedWheelNavigation(event) {
  if (!document.body.classList.contains("deck-embed")) return;
  const rawDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (Math.abs(rawDelta) < 2) return;

  event.preventDefault();
  event.stopPropagation();

  const now = performance.now();
  const modeScale = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? window.innerHeight : 1;
  const primaryDelta = rawDelta * modeScale;
  const direction = primaryDelta > 0 ? 1 : -1;
  const wheelThreshold = 65;
  const wheelCooldown = 90;

  if (embedWheelAccumulator && Math.sign(embedWheelAccumulator) !== direction) {
    embedWheelAccumulator = 0;
  }
  embedWheelAccumulator += primaryDelta;

  window.clearTimeout(embedWheelResetTimer);
  embedWheelResetTimer = window.setTimeout(() => {
    embedWheelAccumulator = 0;
  }, 360);

  if (Math.abs(embedWheelAccumulator) < wheelThreshold || now - embedLastWheelStepAt < wheelCooldown) {
    return;
  }

  embedLastWheelStepAt = now;
  const stepCount = Math.min(3, Math.floor(Math.abs(embedWheelAccumulator) / wheelThreshold));
  embedWheelAccumulator -= direction * stepCount * wheelThreshold;
  const moved = navigateScene(direction, {
    stepCount,
    speedMultiplier: 0.58,
    force: true
  });
  if (!moved) {
    window.parent?.postMessage({ type: "wdelta-boundary", direction }, "*");
  }
}

setupDom();
window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
window.addEventListener("load", () => {
  focusPageForKeyboard();
  requestUpdate();
});
window.addEventListener("story-mode-ready", () => {
  updateNavigationStopsFromStoryMode(getStoryModeApi());
  setStoryModePhase(lastStoryModePhase);
  requestUpdate();
});
window.addEventListener("pointerdown", focusPageForKeyboard);
document.addEventListener("keydown", handleKeyboardNavigation, true);
document.addEventListener("wheel", handleEmbedWheelNavigation, { passive: false, capture: true });
window.WDELTA_CONSTRUCTION = {
  navigateScene
};
update();
