const SVG_NS = "http://www.w3.org/2000/svg";
const gallery = document.querySelector("#gallery");
const categoryControls = document.querySelector("#category-controls");
const viewerModal = document.querySelector("#viewer-modal");
const viewerBackdrop = document.querySelector("#viewer-backdrop");
const viewer = document.querySelector("#viewer");
const viewerGroup = document.querySelector("#viewer-group");
const viewerPath = document.querySelector("#viewer-path");
const viewerTitle = document.querySelector("#viewer-title");
const viewerTag = document.querySelector("#viewer-tag");
const viewerDesc = document.querySelector("#viewer-desc");
const viewerControls = document.querySelector("#viewer-controls");
const viewerFormula = document.querySelector("#viewer-formula");
const viewerCode = document.querySelector("#viewer-code code");
const viewerCopy = document.querySelector("#viewer-copy");
const viewerDownload = document.querySelector("#viewer-download");
const viewerClose = document.querySelector("#viewer-close");
const viewerReset = document.querySelector("#viewer-reset");
const langEnButton = document.querySelector("#lang-en");
const langZhButton = document.querySelector("#lang-zh");
const heroEyebrow = document.querySelector("#hero-eyebrow");
const heroTitle = document.querySelector("#hero-title");
const viewerControlsLabel = document.querySelector("#viewer-controls-label");
const viewerFormulaLabel = document.querySelector("#viewer-formula-label");
const viewerCodeLabel = document.querySelector("#viewer-code-label");
let openAnimationFrame = 0;
let currentLanguage = "en";

const UI_TEXT = {
  en: {
    heroEyebrow: "Mathematical Curve Motion",
    heroTitle: "A Gallery of Mathematical Loading Animations",
    galleryLabel: "Mathematical curve animation gallery",
    categoryLabel: "Filter by curve family",
    controls: "Controls",
    formula: "Formula",
    code: "Code",
    download: "Download",
    downloaded: "Downloaded",
    downloadFailed: "Failed",
    reset: "Reset",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Failed",
    close: "Close",
    ariaOpen: "Open enlarged preview and code for",
  },
  zh: {
    heroEyebrow: "Mathematical Curve Motion",
    heroTitle: "基于数学曲线的加载动画集",
    galleryLabel: "数学曲线动画画廊",
    categoryLabel: "按曲线类别筛选",
    controls: "配置项",
    formula: "公式",
    code: "代码",
    download: "下载",
    downloaded: "已下载",
    downloadFailed: "下载失败",
    reset: "重置",
    copy: "复制",
    copied: "已复制",
    copyFailed: "复制失败",
    close: "关闭",
    ariaOpen: "查看放大预览与代码：",
  },
};

const VISUAL_DEFAULTS = {
  hue: 210,
  hueRange: 72,
  saturation: 92,
  lightness: 64,
  glow: 5,
};

function getVisualConfig(config) {
  return {
    ...VISUAL_DEFAULTS,
    ...Object.fromEntries(
      Object.keys(VISUAL_DEFAULTS).map((key) => [key, config[key] ?? VISUAL_DEFAULTS[key]])
    ),
  };
}

function getHslColor(visual, offset = 0, alpha = 1) {
  const hue = ((visual.hue + offset) % 360 + 360) % 360;
  const alphaText = alpha >= 1 ? "" : ` / ${alpha.toFixed(3)}`;
  return `hsl(${hue.toFixed(1)} ${visual.saturation.toFixed(1)}% ${visual.lightness.toFixed(1)}%${alphaText})`;
}

function getParticleColor(config, index) {
  const visual = getVisualConfig(config);
  const denominator = Math.max(1, (config.particleCount ?? 1) - 1);
  const ratio = index / denominator;
  return getHslColor(visual, visual.hueRange * ratio);
}

function applyVisualStyle(group, path, config) {
  const visual = getVisualConfig(config);
  path.setAttribute("stroke", getHslColor(visual, visual.hueRange * 0.16));
  group.style.filter = visual.glow > 0
    ? `drop-shadow(0 0 ${visual.glow.toFixed(1)}px ${getHslColor(visual, visual.hueRange * 0.45, 0.52)})`
    : "none";
}

const CATEGORIES = [
  { id: "all", labelEn: "All", labelZh: "全部" },
  { id: "original", labelEn: "Originals", labelZh: "原始灵感" },
  { id: "rose", labelEn: "Roses", labelZh: "玫瑰曲线" },
  { id: "spiro", labelEn: "Spirograph", labelZh: "摆线 / 旋轮线" },
  { id: "spiral", labelEn: "Spirals", labelZh: "螺旋" },
  { id: "heart", labelEn: "Hearts", labelZh: "心形" },
  { id: "harmonic", labelEn: "Harmonic", labelZh: "谐波 / 编织" },
  { id: "advanced", labelEn: "Advanced", labelZh: "进阶几何" },
];

let activeCategory = "all";

function getCategoryLabel(categoryId) {
  const category = CATEGORIES.find((item) => item.id === categoryId) ?? CATEGORIES[0];
  return currentLanguage === "zh" ? category.labelZh : category.labelEn;
}

function getCurveCategory(config) {
  const haystack = `${config.name} ${config.tag}`.toLowerCase();

  if (haystack.includes("thinking") || haystack.includes("original")) {
    return "original";
  }
  if (haystack.includes("rose") || haystack.includes("petal")) {
    return "rose";
  }
  if (haystack.includes("hypotrochoid") || haystack.includes("epicycloid") || haystack.includes("epitrochoid") || haystack.includes("cycloid") || haystack.includes("trochoid") || haystack.includes("nephroid") || haystack.includes("spiro")) {
    return "spiro";
  }
  if (haystack.includes("spiral") || haystack.includes("shell")) {
    return "spiral";
  }
  if (haystack.includes("heart") || haystack.includes("cardioid")) {
    return "heart";
  }
  if (haystack.includes("lissajous") || haystack.includes("fourier") || haystack.includes("maurer") || haystack.includes("ribbon") || haystack.includes("knot") || haystack.includes("infinity") || haystack.includes("sine") || haystack.includes("weave")) {
    return "harmonic";
  }

  return "advanced";
}

const CONTROL_DEFS = [
  { key: "particleCount", labelEn: "Particles", labelZh: "粒子数", min: 24, max: 140, step: 1 },
  { key: "trailSpan", labelEn: "Trail", labelZh: "尾迹长度", min: 0.12, max: 0.68, step: 0.01 },
  { key: "durationMs", labelEn: "Loop", labelZh: "循环时长", min: 2400, max: 24000, step: 100 },
  { key: "pulseDurationMs", labelEn: "Pulse", labelZh: "呼吸时长", min: 1800, max: 10000, step: 100 },
  { key: "rotationDurationMs", labelEn: "Rotate", labelZh: "旋转时长", min: 6000, max: 120000, step: 500 },
  { key: "strokeWidth", labelEn: "Stroke", labelZh: "轨迹粗细", min: 2.5, max: 7.5, step: 0.1 },
  { key: "hue", labelEn: "Hue", labelZh: "色相", min: 0, max: 360, step: 1 },
  { key: "hueRange", labelEn: "Gradient", labelZh: "渐变范围", min: 0, max: 360, step: 1 },
  { key: "saturation", labelEn: "Saturation", labelZh: "饱和度", min: 20, max: 100, step: 1 },
  { key: "lightness", labelEn: "Lightness", labelZh: "亮度", min: 35, max: 82, step: 1 },
  { key: "glow", labelEn: "Glow", labelZh: "光晕", min: 0, max: 18, step: 0.5 },
];

const curves = [
  {
    name: "Original Thinking",
    tag: "Custom Rose Trail",
    descriptionEn: "The base circle is carved by a sevenfold cosine term, so the trail blooms into a rotating seven-petal ring.",
    descriptionZh: "基础圆周叠加了 7 倍频余弦项，所以轨迹会长成一个旋转中的七瓣花环。",
    baseRadius: 7,
    detailAmplitude: 3,
    petalCount: 7,
    curveScale: 3.9,
    controls: [
      { key: "baseRadius", labelEn: "Base radius", labelZh: "基础半径", min: 4, max: 10, step: 0.1 },
      { key: "detailAmplitude", labelEn: "Detail", labelZh: "细节振幅", min: 1, max: 5, step: 0.1 },
      { key: "petalCount", labelEn: "Petals", labelZh: "花瓣数", min: 3, max: 12, step: 1 },
      { key: "curveScale", labelEn: "Scale", labelZh: "缩放", min: 2.5, max: 5.5, step: 0.1 },
    ],
    formula(config) {
      return [
        `x(t) = 50 + (${config.baseRadius.toFixed(1)} cos t - ${config.detailAmplitude.toFixed(1)}s cos ${Math.round(config.petalCount)}t) * ${config.curveScale.toFixed(1)}`,
        `y(t) = 50 + (${config.baseRadius.toFixed(1)} sin t - ${config.detailAmplitude.toFixed(1)}s sin ${Math.round(config.petalCount)}t) * ${config.curveScale.toFixed(1)}`,
        "s = detailScale(time)",
      ].join("\n");
    },
    rotate: true,
    particleCount: 64,
    trailSpan: 0.38,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 5.5,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const petals = Math.round(config.petalCount);
      const x = config.baseRadius * Math.cos(t) - config.detailAmplitude * detailScale * Math.cos(petals * t);
      const y = config.baseRadius * Math.sin(t) - config.detailAmplitude * detailScale * Math.sin(petals * t);
      return {
        x: 50 + x * config.curveScale,
        y: 50 + y * config.curveScale,
      };
    },
  },
  {
    name: "Thinking Five",
    tag: "Custom Rose Trail",
    descriptionEn: "Replacing the sevenfold term with a fivefold term reduces the inner loops, giving the curve a cleaner five-petal rhythm.",
    descriptionZh: "把 7 倍频项换成 5 倍频后，内部环绕圈减少，整条轨迹会呈现更简洁的五瓣节奏。",
    baseRadius: 7,
    detailAmplitude: 3,
    petalCount: 5,
    curveScale: 3.9,
    controls: [
      { key: "baseRadius", labelEn: "Base radius", labelZh: "基础半径", min: 4, max: 10, step: 0.1 },
      { key: "detailAmplitude", labelEn: "Detail", labelZh: "细节振幅", min: 1, max: 5, step: 0.1 },
      { key: "petalCount", labelEn: "Petals", labelZh: "花瓣数", min: 3, max: 12, step: 1 },
      { key: "curveScale", labelEn: "Scale", labelZh: "缩放", min: 2.5, max: 5.5, step: 0.1 },
    ],
    formula(config) {
      return [
        `x(t) = 50 + (${config.baseRadius.toFixed(1)} cos t - ${config.detailAmplitude.toFixed(1)}s cos ${Math.round(config.petalCount)}t) * ${config.curveScale.toFixed(1)}`,
        `y(t) = 50 + (${config.baseRadius.toFixed(1)} sin t - ${config.detailAmplitude.toFixed(1)}s sin ${Math.round(config.petalCount)}t) * ${config.curveScale.toFixed(1)}`,
        "s = detailScale(time)",
      ].join("\n");
    },
    rotate: true,
    particleCount: 62,
    trailSpan: 0.38,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 5.5,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const petals = Math.round(config.petalCount);
      const x = config.baseRadius * Math.cos(t) - config.detailAmplitude * detailScale * Math.cos(petals * t);
      const y = config.baseRadius * Math.sin(t) - config.detailAmplitude * detailScale * Math.sin(petals * t);
      return {
        x: 50 + x * config.curveScale,
        y: 50 + y * config.curveScale,
      };
    },
  },
  {
    name: "Thinking Nine",
    tag: "Custom Rose Trail",
    descriptionEn: "A ninefold term packs more inner turns into the same orbit, so the floral ring feels denser and more finely braided.",
    descriptionZh: "9 倍频项会把更多小回环压进同一圈轨道里，所以花环会更密、更细。",
    baseRadius: 7,
    detailAmplitude: 3,
    petalCount: 9,
    curveScale: 3.9,
    controls: [
      { key: "baseRadius", labelEn: "Base radius", labelZh: "基础半径", min: 4, max: 10, step: 0.1 },
      { key: "detailAmplitude", labelEn: "Detail", labelZh: "细节振幅", min: 1, max: 5, step: 0.1 },
      { key: "petalCount", labelEn: "Petals", labelZh: "花瓣数", min: 3, max: 12, step: 1 },
      { key: "curveScale", labelEn: "Scale", labelZh: "缩放", min: 2.5, max: 5.5, step: 0.1 },
    ],
    formula(config) {
      return [
        `x(t) = 50 + (${config.baseRadius.toFixed(1)} cos t - ${config.detailAmplitude.toFixed(1)}s cos ${Math.round(config.petalCount)}t) * ${config.curveScale.toFixed(1)}`,
        `y(t) = 50 + (${config.baseRadius.toFixed(1)} sin t - ${config.detailAmplitude.toFixed(1)}s sin ${Math.round(config.petalCount)}t) * ${config.curveScale.toFixed(1)}`,
        "s = detailScale(time)",
      ].join("\n");
    },
    rotate: true,
    particleCount: 68,
    trailSpan: 0.39,
    durationMs: 4700,
    rotationDurationMs: 30000,
    pulseDurationMs: 4200,
    strokeWidth: 5.5,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const petals = Math.round(config.petalCount);
      const x = config.baseRadius * Math.cos(t) - config.detailAmplitude * detailScale * Math.cos(petals * t);
      const y = config.baseRadius * Math.sin(t) - config.detailAmplitude * detailScale * Math.sin(petals * t);
      return {
        x: 50 + x * config.curveScale,
        y: 50 + y * config.curveScale,
      };
    },
  },
  {
    name: "Rose Orbit",
    tag: "r = cos(kθ)",
    descriptionEn: "The radius expands and contracts with cos(7t), so the orbit breathes into repeated petals while staying anchored to a circle.",
    descriptionZh: "半径随 cos(7t) 起伏，所以整条轨迹会在圆周上反复鼓起花瓣，同时保持绕圈感。",
    orbitRadius: 7,
    detailAmplitude: 2.7,
    petalCount: 7,
    curveScale: 3.9,
    controls: [
      { key: "orbitRadius", labelEn: "Base radius", labelZh: "基础半径", min: 4, max: 10, step: 0.1 },
      { key: "detailAmplitude", labelEn: "Detail", labelZh: "细节振幅", min: 1, max: 5, step: 0.1 },
      { key: "petalCount", labelEn: "k", labelZh: "k 值", min: 3, max: 12, step: 1 },
      { key: "curveScale", labelEn: "Scale", labelZh: "缩放", min: 2.5, max: 5.5, step: 0.1 },
    ],
    formula(config) {
      return [
        `r(t) = ${config.orbitRadius.toFixed(1)} - ${config.detailAmplitude.toFixed(1)}s cos(${Math.round(config.petalCount)}t)`,
        `x(t) = 50 + cos t · r(t) · ${config.curveScale.toFixed(1)}`,
        `y(t) = 50 + sin t · r(t) · ${config.curveScale.toFixed(1)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 72,
    trailSpan: 0.42,
    durationMs: 5200,
    rotationDurationMs: 28000,
    pulseDurationMs: 4600,
    strokeWidth: 5.2,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const k = Math.round(config.petalCount);
      const r = config.orbitRadius - config.detailAmplitude * detailScale * Math.cos(k * t);
      return {
        x: 50 + Math.cos(t) * r * config.curveScale,
        y: 50 + Math.sin(t) * r * config.curveScale,
      };
    },
  },
  {
    name: "Rose Curve",
    tag: "r = a cos(kθ)",
    descriptionEn: "Using r = a cos(5t) creates five evenly spaced lobes, and the breathing multiplier gently swells each petal in and out.",
    descriptionZh: "使用 r = a cos(5t) 会得到五个均匀分布的花瓣，再叠加呼吸倍率后，每片花瓣都会轻微胀缩。",
    roseA: 9.2,
    roseABoost: 0.6,
    roseBreathBase: 0.72,
    roseBreathBoost: 0.28,
    roseK: 5,
    roseScale: 3.25,
    controls: [
      { key: "roseA", labelEn: "a", labelZh: "a", min: 5, max: 14, step: 0.1 },
      { key: "roseABoost", labelEn: "a boost", labelZh: "a 呼吸量", min: 0, max: 2, step: 0.05 },
      { key: "roseBreathBase", labelEn: "Base pulse", labelZh: "基础呼吸", min: 0.3, max: 1.2, step: 0.01 },
      { key: "roseBreathBoost", labelEn: "Pulse boost", labelZh: "呼吸增量", min: 0, max: 0.8, step: 0.01 },
      { key: "roseK", labelEn: "k", labelZh: "k 值", min: 2, max: 10, step: 1 },
      { key: "roseScale", labelEn: "Scale", labelZh: "缩放", min: 2, max: 5, step: 0.05 },
    ],
    formula(config) {
      return [
        `r(t) = (${config.roseA.toFixed(1)} + ${config.roseABoost.toFixed(2)}s)(${config.roseBreathBase.toFixed(2)} + ${config.roseBreathBoost.toFixed(2)}s) cos(${Math.round(config.roseK)}t)`,
        `x(t) = 50 + cos t · r(t) · ${config.roseScale.toFixed(2)}`,
        `y(t) = 50 + sin t · r(t) · ${config.roseScale.toFixed(2)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 78,
    trailSpan: 0.32,
    durationMs: 5400,
    rotationDurationMs: 28000,
    pulseDurationMs: 4600,
    strokeWidth: 4.5,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.roseA + detailScale * config.roseABoost;
      const k = Math.round(config.roseK);
      const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(k * t);
      return {
        x: 50 + Math.cos(t) * r * config.roseScale,
        y: 50 + Math.sin(t) * r * config.roseScale,
      };
    },
  },
  {
    name: "Rose Two",
    tag: "r = a cos(2θ)",
    descriptionEn: "With k = 2, the cosine radius forms broad opposing petals, and the breathing factor makes the center pulse like the original.",
    descriptionZh: "当 k = 2 时，余弦半径会生成一组宽阔的对称花瓣，呼吸倍率则让中心像原版一样鼓动。",
    roseA: 9.2,
    roseABoost: 0.6,
    roseBreathBase: 0.72,
    roseBreathBoost: 0.28,
    roseScale: 3.25,
    controls: [
      { key: "roseA", labelEn: "a", labelZh: "a", min: 5, max: 14, step: 0.1 },
      { key: "roseABoost", labelEn: "a boost", labelZh: "a 呼吸量", min: 0, max: 2, step: 0.05 },
      { key: "roseBreathBase", labelEn: "Base pulse", labelZh: "基础呼吸", min: 0.3, max: 1.2, step: 0.01 },
      { key: "roseBreathBoost", labelEn: "Pulse boost", labelZh: "呼吸增量", min: 0, max: 0.8, step: 0.01 },
      { key: "roseScale", labelEn: "Scale", labelZh: "缩放", min: 2, max: 5, step: 0.05 },
    ],
    formula(config) {
      return [
        `r(t) = (${config.roseA.toFixed(1)} + ${config.roseABoost.toFixed(2)}s)(${config.roseBreathBase.toFixed(2)} + ${config.roseBreathBoost.toFixed(2)}s) cos(2t)`,
        `x(t) = 50 + cos t · r(t) · ${config.roseScale.toFixed(2)}`,
        `y(t) = 50 + sin t · r(t) · ${config.roseScale.toFixed(2)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 74,
    trailSpan: 0.3,
    durationMs: 5200,
    rotationDurationMs: 28000,
    pulseDurationMs: 4300,
    strokeWidth: 4.6,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.roseA + detailScale * config.roseABoost;
      const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(2 * t);
      return {
        x: 50 + Math.cos(t) * r * config.roseScale,
        y: 50 + Math.sin(t) * r * config.roseScale,
      };
    },
  },
  {
    name: "Rose Three",
    tag: "r = a cos(3θ)",
    descriptionEn: "With k = 3, the curve resolves into three rotating petals, and the inner breathing keeps the motion from feeling mathematically rigid.",
    descriptionZh: "当 k = 3 时，曲线会落成三瓣旋转结构，而内层呼吸感会让它不只是静态的数学图形。",
    roseA: 9.2,
    roseABoost: 0.6,
    roseBreathBase: 0.72,
    roseBreathBoost: 0.28,
    roseScale: 3.25,
    controls: [
      { key: "roseA", labelEn: "a", labelZh: "a", min: 5, max: 14, step: 0.1 },
      { key: "roseABoost", labelEn: "a boost", labelZh: "a 呼吸量", min: 0, max: 2, step: 0.05 },
      { key: "roseBreathBase", labelEn: "Base pulse", labelZh: "基础呼吸", min: 0.3, max: 1.2, step: 0.01 },
      { key: "roseBreathBoost", labelEn: "Pulse boost", labelZh: "呼吸增量", min: 0, max: 0.8, step: 0.01 },
      { key: "roseScale", labelEn: "Scale", labelZh: "缩放", min: 2, max: 5, step: 0.05 },
    ],
    formula(config) {
      return [
        `r(t) = (${config.roseA.toFixed(1)} + ${config.roseABoost.toFixed(2)}s)(${config.roseBreathBase.toFixed(2)} + ${config.roseBreathBoost.toFixed(2)}s) cos(3t)`,
        `x(t) = 50 + cos t · r(t) · ${config.roseScale.toFixed(2)}`,
        `y(t) = 50 + sin t · r(t) · ${config.roseScale.toFixed(2)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 76,
    trailSpan: 0.31,
    durationMs: 5300,
    rotationDurationMs: 28000,
    pulseDurationMs: 4400,
    strokeWidth: 4.6,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.roseA + detailScale * config.roseABoost;
      const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(3 * t);
      return {
        x: 50 + Math.cos(t) * r * config.roseScale,
        y: 50 + Math.sin(t) * r * config.roseScale,
      };
    },
  },
  {
    name: "Rose Four",
    tag: "r = a cos(4θ)",
    descriptionEn: "With k = 4, the petals settle into a balanced cross-like rose, and the breathing core adds the same soft pulse as the original loader.",
    descriptionZh: "当 k = 4 时，花瓣会落成更均衡的十字型玫瑰，而内圆呼吸让它保留原版那种轻微脉动。",
    roseA: 9.2,
    roseABoost: 0.6,
    roseBreathBase: 0.72,
    roseBreathBoost: 0.28,
    roseScale: 3.25,
    controls: [
      { key: "roseA", labelEn: "a", labelZh: "a", min: 5, max: 14, step: 0.1 },
      { key: "roseABoost", labelEn: "a boost", labelZh: "a 呼吸量", min: 0, max: 2, step: 0.05 },
      { key: "roseBreathBase", labelEn: "Base pulse", labelZh: "基础呼吸", min: 0.3, max: 1.2, step: 0.01 },
      { key: "roseBreathBoost", labelEn: "Pulse boost", labelZh: "呼吸增量", min: 0, max: 0.8, step: 0.01 },
      { key: "roseScale", labelEn: "Scale", labelZh: "缩放", min: 2, max: 5, step: 0.05 },
    ],
    formula(config) {
      return [
        `r(t) = (${config.roseA.toFixed(1)} + ${config.roseABoost.toFixed(2)}s)(${config.roseBreathBase.toFixed(2)} + ${config.roseBreathBoost.toFixed(2)}s) cos(4t)`,
        `x(t) = 50 + cos t · r(t) · ${config.roseScale.toFixed(2)}`,
        `y(t) = 50 + sin t · r(t) · ${config.roseScale.toFixed(2)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 78,
    trailSpan: 0.32,
    durationMs: 5400,
    rotationDurationMs: 28000,
    pulseDurationMs: 4500,
    strokeWidth: 4.6,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.roseA + detailScale * config.roseABoost;
      const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(4 * t);
      return {
        x: 50 + Math.cos(t) * r * config.roseScale,
        y: 50 + Math.sin(t) * r * config.roseScale,
      };
    },
  },
  {
    name: "Lissajous Drift",
    tag: "x = sin(at), y = sin(bt)",
    descriptionEn: "Different sine frequencies on x and y make the path cross itself repeatedly, producing the woven feel of an oscilloscope trace.",
    descriptionZh: "x 和 y 使用不同频率的正弦后，路径会不断交叉回绕，所以会呈现示波器一样的编织感。",
    lissajousAmp: 24,
    lissajousAmpBoost: 6,
    lissajousAX: 3,
    lissajousBY: 4,
    lissajousPhase: 1.57,
    lissajousYScale: 0.92,
    controls: [
      { key: "lissajousAmp", labelEn: "Amplitude", labelZh: "振幅", min: 8, max: 36, step: 0.5 },
      { key: "lissajousAmpBoost", labelEn: "Amp pulse", labelZh: "振幅呼吸", min: 0, max: 12, step: 0.1 },
      { key: "lissajousAX", labelEn: "a", labelZh: "a", min: 1, max: 8, step: 1 },
      { key: "lissajousBY", labelEn: "b", labelZh: "b", min: 1, max: 8, step: 1 },
      { key: "lissajousYScale", labelEn: "Y scale", labelZh: "Y 缩放", min: 0.4, max: 1.4, step: 0.01 },
    ],
    formula(config) {
      return [
        `A = ${config.lissajousAmp.toFixed(1)} + ${config.lissajousAmpBoost.toFixed(1)}s`,
        `x(t) = 50 + sin(${Math.round(config.lissajousAX)}t + ${config.lissajousPhase.toFixed(2)}) · A`,
        `y(t) = 50 + sin(${Math.round(config.lissajousBY)}t) · ${config.lissajousYScale.toFixed(2)}A`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 68,
    trailSpan: 0.34,
    durationMs: 6000,
    rotationDurationMs: 36000,
    pulseDurationMs: 5400,
    strokeWidth: 4.7,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const amp = config.lissajousAmp + detailScale * config.lissajousAmpBoost;
      return {
        x: 50 + Math.sin(Math.round(config.lissajousAX) * t + config.lissajousPhase) * amp,
        y: 50 + Math.sin(Math.round(config.lissajousBY) * t) * (amp * config.lissajousYScale),
      };
    },
  },
  {
    name: "Lemniscate Bloom",
    tag: "Bernoulli Lemniscate",
    descriptionEn: "The 1 + sin²t denominator pinches the center while preserving two lobes, so the curve naturally reads as a breathing infinity sign.",
    descriptionZh: "分母里的 1 + sin²t 会把中间收紧、两侧保留双环，因此它天然像一个会呼吸的无限符号。",
    lemniscateA: 20,
    lemniscateBoost: 7,
    controls: [
      { key: "lemniscateA", labelEn: "a", labelZh: "a", min: 8, max: 30, step: 0.5 },
      { key: "lemniscateBoost", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 12, step: 0.1 },
    ],
    formula(config) {
      return [
        `a = ${config.lemniscateA.toFixed(1)} + ${config.lemniscateBoost.toFixed(1)}s`,
        "x(t) = 50 + a cos t / (1 + sin² t)",
        "y(t) = 50 + a sin t cos t / (1 + sin² t)",
      ].join("\n");
    },
    rotate: false,
    particleCount: 70,
    trailSpan: 0.4,
    durationMs: 5600,
    rotationDurationMs: 34000,
    pulseDurationMs: 5000,
    strokeWidth: 4.8,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const scale = config.lemniscateA + detailScale * config.lemniscateBoost;
      const denom = 1 + Math.sin(t) ** 2;
      return {
        x: 50 + (scale * Math.cos(t)) / denom,
        y: 50 + (scale * Math.sin(t) * Math.cos(t)) / denom,
      };
    },
  },
  {
    name: "Hypotrochoid Loop",
    tag: "Inner Spirograph",
    descriptionEn: "The rolling-circle terms create nested turns and offsets, so the path feels like a compact spirograph traced by a machine.",
    descriptionZh: "滚动圆项会叠出嵌套回环和偏移卷曲，因此整条路径会像机械画出来的紧凑内旋轮线。",
    spiroR: 8.2,
    spiror: 2.7,
    spirorBoost: 0.45,
    spirod: 4.8,
    spirodBoost: 1.2,
    spiroScale: 3.05,
    controls: [
      { key: "spiroR", labelEn: "R", labelZh: "R", min: 4, max: 12, step: 0.1 },
      { key: "spiror", labelEn: "r", labelZh: "r", min: 1, max: 5, step: 0.1 },
      { key: "spirod", labelEn: "d", labelZh: "d", min: 1, max: 8, step: 0.1 },
      { key: "spiroScale", labelEn: "Scale", labelZh: "缩放", min: 1.5, max: 4.5, step: 0.05 },
    ],
    formula(config) {
      return [
        `x(t) = 50 + ((R-r) cos t + d cos((R-r)t/r)) · ${config.spiroScale.toFixed(2)}`,
        `y(t) = 50 + ((R-r) sin t - d sin((R-r)t/r)) · ${config.spiroScale.toFixed(2)}`,
        `R = ${config.spiroR.toFixed(1)}, r = ${config.spiror.toFixed(1)} + ${config.spirorBoost.toFixed(2)}s, d = ${config.spirod.toFixed(1)} + ${config.spirodBoost.toFixed(1)}s`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 82,
    trailSpan: 0.46,
    durationMs: 7600,
    rotationDurationMs: 42000,
    pulseDurationMs: 6200,
    strokeWidth: 4.6,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const r = config.spiror + detailScale * config.spirorBoost;
      const d = config.spirod + detailScale * config.spirodBoost;
      const x = (config.spiroR - r) * Math.cos(t) + d * Math.cos(((config.spiroR - r) / r) * t);
      const y = (config.spiroR - r) * Math.sin(t) - d * Math.sin(((config.spiroR - r) / r) * t);
      return {
        x: 50 + x * config.spiroScale,
        y: 50 + y * config.spiroScale,
      };
    },
  },
  {
    name: "Three-Petal Spiral",
    tag: "R = 3, r = 1, d = 3",
    descriptionEn: "This rolling-circle setup resolves into three large looping petals, all breathing together like a compact spiral flower.",
    descriptionZh: "这组滚动圆参数会展开成 3 个大回环，而且整组圆环会像原版一样统一呼吸，像一朵紧凑的三瓣螺旋花。",
    spiralR: 3,
    spiralr: 1,
    spirald: 3,
    spiralScale: 2.2,
    spiralBreath: 0.45,
    controls: [
      { key: "spiralR", labelEn: "R", labelZh: "R", min: 2, max: 8, step: 1 },
      { key: "spiralr", labelEn: "r", labelZh: "r", min: 1, max: 3, step: 0.1 },
      { key: "spirald", labelEn: "d", labelZh: "d", min: 1, max: 5, step: 0.1 },
      { key: "spiralScale", labelEn: "Scale", labelZh: "缩放", min: 1.2, max: 3.5, step: 0.05 },
      { key: "spiralBreath", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 1, step: 0.05 },
    ],
    formula(config) {
      return [
        "u(t) = ((R-r) cos t + d cos((R-r)t/r), (R-r) sin t - d sin((R-r)t/r))",
        `m(t) = ${config.spiralScale.toFixed(2)} + ${config.spiralBreath.toFixed(2)}s`,
        "(x, y) = 50 + u(t) · m(t)",
        `R = ${config.spiralR.toFixed(1)}, r = ${config.spiralr.toFixed(1)}, d = ${config.spirald.toFixed(1)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 82,
    trailSpan: 0.34,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 4.4,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const d = config.spirald + detailScale * 0.25;
      const baseX = (config.spiralR - config.spiralr) * Math.cos(t) + d * Math.cos(((config.spiralR - config.spiralr) / config.spiralr) * t);
      const baseY = (config.spiralR - config.spiralr) * Math.sin(t) - d * Math.sin(((config.spiralR - config.spiralr) / config.spiralr) * t);
      const scale = config.spiralScale + detailScale * config.spiralBreath;
      return {
        x: 50 + baseX * scale,
        y: 50 + baseY * scale,
      };
    },
  },
  {
    name: "Four-Petal Spiral",
    tag: "R = 4, r = 1, d = 3",
    descriptionEn: "With R = 4, the rolling-circle path settles into four looping petals, rotating and breathing as one ring.",
    descriptionZh: "当 R = 4 时，滚动圆路径会稳定成 4 个回环花瓣，并且整组会一起旋转、一起呼吸。",
    spiralR: 4,
    spiralr: 1,
    spirald: 3,
    spiralScale: 2.2,
    spiralBreath: 0.45,
    controls: [
      { key: "spiralR", labelEn: "R", labelZh: "R", min: 2, max: 8, step: 1 },
      { key: "spiralr", labelEn: "r", labelZh: "r", min: 1, max: 3, step: 0.1 },
      { key: "spirald", labelEn: "d", labelZh: "d", min: 1, max: 5, step: 0.1 },
      { key: "spiralScale", labelEn: "Scale", labelZh: "缩放", min: 1.2, max: 3.5, step: 0.05 },
      { key: "spiralBreath", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 1, step: 0.05 },
    ],
    formula(config) {
      return [
        "u(t) = ((R-r) cos t + d cos((R-r)t/r), (R-r) sin t - d sin((R-r)t/r))",
        `m(t) = ${config.spiralScale.toFixed(2)} + ${config.spiralBreath.toFixed(2)}s`,
        "(x, y) = 50 + u(t) · m(t)",
        `R = ${config.spiralR.toFixed(1)}, r = ${config.spiralr.toFixed(1)}, d = ${config.spirald.toFixed(1)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 84,
    trailSpan: 0.34,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 4.4,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const d = config.spirald + detailScale * 0.25;
      const baseX = (config.spiralR - config.spiralr) * Math.cos(t) + d * Math.cos(((config.spiralR - config.spiralr) / config.spiralr) * t);
      const baseY = (config.spiralR - config.spiralr) * Math.sin(t) - d * Math.sin(((config.spiralR - config.spiralr) / config.spiralr) * t);
      const scale = config.spiralScale + detailScale * config.spiralBreath;
      return {
        x: 50 + baseX * scale,
        y: 50 + baseY * scale,
      };
    },
  },
  {
    name: "Five-Petal Spiral",
    tag: "R = 5, r = 1, d = 3",
    descriptionEn: "With R = 5, the loop count increases to five petals, giving the spiral flower a denser and more ornate rhythm.",
    descriptionZh: "当 R = 5 时，回环数量会变成 5 个花瓣，整朵螺旋花会显得更密、更华丽。",
    spiralR: 5,
    spiralr: 1,
    spirald: 3,
    spiralScale: 2.2,
    spiralBreath: 0.45,
    controls: [
      { key: "spiralR", labelEn: "R", labelZh: "R", min: 2, max: 8, step: 1 },
      { key: "spiralr", labelEn: "r", labelZh: "r", min: 1, max: 3, step: 0.1 },
      { key: "spirald", labelEn: "d", labelZh: "d", min: 1, max: 5, step: 0.1 },
      { key: "spiralScale", labelEn: "Scale", labelZh: "缩放", min: 1.2, max: 3.5, step: 0.05 },
      { key: "spiralBreath", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 1, step: 0.05 },
    ],
    formula(config) {
      return [
        "u(t) = ((R-r) cos t + d cos((R-r)t/r), (R-r) sin t - d sin((R-r)t/r))",
        `m(t) = ${config.spiralScale.toFixed(2)} + ${config.spiralBreath.toFixed(2)}s`,
        "(x, y) = 50 + u(t) · m(t)",
        `R = ${config.spiralR.toFixed(1)}, r = ${config.spiralr.toFixed(1)}, d = ${config.spirald.toFixed(1)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 85,
    trailSpan: 0.34,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 4.4,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const d = config.spirald + detailScale * 0.25;
      const baseX = (config.spiralR - config.spiralr) * Math.cos(t) + d * Math.cos(((config.spiralR - config.spiralr) / config.spiralr) * t);
      const baseY = (config.spiralR - config.spiralr) * Math.sin(t) - d * Math.sin(((config.spiralR - config.spiralr) / config.spiralr) * t);
      const scale = config.spiralScale + detailScale * config.spiralBreath;
      return {
        x: 50 + baseX * scale,
        y: 50 + baseY * scale,
      };
    },
  },
  {
    name: "Six-Petal Spiral",
    tag: "R = 6, r = 1, d = 3",
    descriptionEn: "The rolling-circle path splits into six petals, and the whole ring breathes in one unified pulse like the original loader.",
    descriptionZh: "滚动圆路径会展开成六个花瓣，而且整组圆环会像原版一样以统一节奏一起呼吸缩放。",
    spiralR: 6,
    spiralr: 1,
    spirald: 3,
    spiralScale: 2.2,
    spiralBreath: 0.45,
    controls: [
      { key: "spiralR", labelEn: "R", labelZh: "R", min: 2, max: 8, step: 1 },
      { key: "spiralr", labelEn: "r", labelZh: "r", min: 1, max: 3, step: 0.1 },
      { key: "spirald", labelEn: "d", labelZh: "d", min: 1, max: 5, step: 0.1 },
      { key: "spiralScale", labelEn: "Scale", labelZh: "缩放", min: 1.2, max: 3.5, step: 0.05 },
      { key: "spiralBreath", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 1, step: 0.05 },
    ],
    formula(config) {
      return [
        "u(t) = ((R-r) cos t + d cos((R-r)t/r), (R-r) sin t - d sin((R-r)t/r))",
        `m(t) = ${config.spiralScale.toFixed(2)} + ${config.spiralBreath.toFixed(2)}s`,
        "(x, y) = 50 + u(t) · m(t)",
        `R = ${config.spiralR.toFixed(1)}, r = ${config.spiralr.toFixed(1)}, d = ${config.spirald.toFixed(1)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 86,
    trailSpan: 0.34,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 4.4,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const d = config.spirald + detailScale * 0.25;
      const baseX = (config.spiralR - config.spiralr) * Math.cos(t) + d * Math.cos(((config.spiralR - config.spiralr) / config.spiralr) * t);
      const baseY = (config.spiralR - config.spiralr) * Math.sin(t) - d * Math.sin(((config.spiralR - config.spiralr) / config.spiralr) * t);
      const scale = config.spiralScale + detailScale * config.spiralBreath;
      return {
        x: 50 + baseX * scale,
        y: 50 + baseY * scale,
      };
    },
  },
  {
    name: "Butterfly Phase",
    tag: "Butterfly Curve",
    descriptionEn: "Exponential and high-frequency cosine terms stretch the wings unevenly, giving the path its unmistakably fluttering butterfly shape.",
    descriptionZh: "指数项和高频余弦会把两侧翅膀不均匀地拉开，所以整条轨迹会像蝴蝶一样拍动。",
    butterflyTurns: 12,
    butterflyScale: 4.6,
    butterflyPulse: 0.45,
    butterflyCosWeight: 2,
    butterflyPower: 5,
    controls: [
      { key: "butterflyTurns", labelEn: "Turns", labelZh: "圈数", min: 6, max: 18, step: 0.5 },
      { key: "butterflyScale", labelEn: "Scale", labelZh: "缩放", min: 2.5, max: 7, step: 0.05 },
      { key: "butterflyPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 1.2, step: 0.01 },
      { key: "butterflyCosWeight", labelEn: "Cos weight", labelZh: "余弦权重", min: 0.5, max: 4, step: 0.05 },
      { key: "butterflyPower", labelEn: "Power", labelZh: "幂次", min: 2, max: 8, step: 1 },
    ],
    formula(config) {
      return [
        `u = ${config.butterflyTurns.toFixed(1)}t`,
        `B(u) = e^{cos u} - ${config.butterflyCosWeight.toFixed(2)} cos 4u - sin^${Math.round(config.butterflyPower)}(u/12)`,
        `x(t) = 50 + sin u · B(u) · (${config.butterflyScale.toFixed(2)} + ${config.butterflyPulse.toFixed(2)}s)`,
        `y(t) = 50 + cos u · B(u) · (${config.butterflyScale.toFixed(2)} + ${config.butterflyPulse.toFixed(2)}s)`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 88,
    trailSpan: 0.32,
    durationMs: 9000,
    rotationDurationMs: 50000,
    pulseDurationMs: 7000,
    strokeWidth: 4.4,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * config.butterflyTurns;
      const s =
        Math.exp(Math.cos(t)) -
        config.butterflyCosWeight * Math.cos(4 * t) -
        Math.sin(t / 12) ** Math.round(config.butterflyPower);
      const scale = config.butterflyScale + detailScale * config.butterflyPulse;
      return {
        x: 50 + Math.sin(t) * s * scale,
        y: 50 + Math.cos(t) * s * scale,
      };
    },
  },
  {
    name: "Cardioid Glow",
    tag: "Cardioid",
    descriptionEn: "Because r = a(1 - cos t) collapses to zero at one side and swells on the other, the curve reads like a soft pulsing heart wave.",
    descriptionZh: "由于 r = a(1 - cos t) 会在一侧收成尖点、另一侧鼓起，所以这条曲线会像温和起伏的心形脉冲。",
    cardioidA: 8.4,
    cardioidPulse: 0.8,
    cardioidScale: 2.15,
    controls: [
      { key: "cardioidA", labelEn: "a", labelZh: "a", min: 4, max: 14, step: 0.1 },
      { key: "cardioidPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 2, step: 0.05 },
      { key: "cardioidScale", labelEn: "Scale", labelZh: "缩放", min: 1, max: 3.5, step: 0.05 },
    ],
    formula(config) {
      return [
        `a = ${config.cardioidA.toFixed(1)} + ${config.cardioidPulse.toFixed(2)}s`,
        "r(t) = a(1 - cos t)",
        `x(t) = 50 + cos t · r(t) · ${config.cardioidScale.toFixed(2)}`,
        `y(t) = 50 + sin t · r(t) · ${config.cardioidScale.toFixed(2)}`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 72,
    trailSpan: 0.36,
    durationMs: 6200,
    rotationDurationMs: 36000,
    pulseDurationMs: 5200,
    strokeWidth: 4.9,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.cardioidA + detailScale * config.cardioidPulse;
      const r = a * (1 - Math.cos(t));
      return {
        x: 50 + Math.cos(t) * r * config.cardioidScale,
        y: 50 + Math.sin(t) * r * config.cardioidScale,
      };
    },
  },
  {
    name: "Cardioid Heart",
    tag: "r = a(1 + cosθ)",
    descriptionEn: "Starting from r = a(1 + cos t) and rotating the coordinates turns the textbook cardioid into a more legible upright heart.",
    descriptionZh: "从 r = a(1 + cos t) 出发，再把坐标整体旋转后，标准心形线就会变成更直观的竖向爱心。",
    cardioidA: 8.8,
    cardioidPulse: 0.8,
    cardioidScale: 2.15,
    controls: [
      { key: "cardioidA", labelEn: "a", labelZh: "a", min: 4, max: 14, step: 0.1 },
      { key: "cardioidPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 2, step: 0.05 },
      { key: "cardioidScale", labelEn: "Scale", labelZh: "缩放", min: 1, max: 3.5, step: 0.05 },
    ],
    formula(config) {
      return [
        `a = ${config.cardioidA.toFixed(1)} + ${config.cardioidPulse.toFixed(2)}s`,
        "r(t) = a(1 + cos t)",
        "x'(t) = -sin t · r(t)",
        `y'(t) = -cos t · r(t), m = ${config.cardioidScale.toFixed(2)}`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 74,
    trailSpan: 0.36,
    durationMs: 6200,
    rotationDurationMs: 36000,
    pulseDurationMs: 5200,
    strokeWidth: 4.9,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.cardioidA + detailScale * config.cardioidPulse;
      const r = a * (1 + Math.cos(t));
      const baseX = Math.cos(t) * r;
      const baseY = Math.sin(t) * r;
      return {
        x: 50 - baseY * config.cardioidScale,
        y: 50 - baseX * config.cardioidScale,
      };
    },
  },
  {
    name: "Heart Wave",
    tag: "f(x) Heart Wave",
    descriptionEn: "The x^(2/3) envelope supplies the heart outline, while sin(bπx) fills its interior with adjustable horizontal ripples.",
    descriptionZh: "x^(2/3) 负责给出爱心外轮廓，sin(bπx) 则把可调密度的横向波纹填进心形内部。",
    heartWaveB: 6.4,
    heartWaveRoot: 3.3,
    heartWaveAmp: 0.9,
    heartWaveScaleX: 23.2,
    heartWaveScaleY: 24.5,
    controls: [
      { key: "heartWaveB", labelEn: "b", labelZh: "b", min: 2, max: 12, step: 0.1 },
      { key: "heartWaveRoot", labelEn: "Root span", labelZh: "根号范围", min: 2.2, max: 4.2, step: 0.05 },
      { key: "heartWaveAmp", labelEn: "Wave amp", labelZh: "波纹振幅", min: 0.3, max: 1.6, step: 0.05 },
      { key: "heartWaveScaleX", labelEn: "X scale", labelZh: "X 缩放", min: 14, max: 30, step: 0.1 },
      { key: "heartWaveScaleY", labelEn: "Y scale", labelZh: "Y 缩放", min: 14, max: 34, step: 0.1 },
    ],
    formula(config) {
      return [
        `f(x) = |x|^(2/3) + ${config.heartWaveAmp.toFixed(2)}√(${config.heartWaveRoot.toFixed(2)} - x²) sin(${config.heartWaveB.toFixed(1)}πx)`,
        `screenX = 50 + x · ${config.heartWaveScaleX.toFixed(1)}`,
        `screenY = 18 + (1.75 - f(x))(${config.heartWaveScaleY.toFixed(1)} + 1.5s)`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 104,
    trailSpan: 0.18,
    durationMs: 8400,
    rotationDurationMs: 22000,
    pulseDurationMs: 5600,
    strokeWidth: 3.9,
    point(progress, detailScale, config) {
      const xLimit = Math.sqrt(config.heartWaveRoot);
      const x = -xLimit + progress * xLimit * 2;
      const safeRoot = Math.max(0, config.heartWaveRoot - x * x);
      const b = config.heartWaveB;
      const wave = config.heartWaveAmp * Math.sqrt(safeRoot) * Math.sin(b * Math.PI * x);
      const curve = Math.pow(Math.abs(x), 2 / 3);
      const y = curve + wave;
      const scaleX = config.heartWaveScaleX;
      const scaleY = config.heartWaveScaleY + detailScale * 1.5;

      return {
        x: 50 + x * scaleX,
        y: 18 + (1.75 - y) * scaleY,
      };
    },
  },
  {
    name: "Spiral Search",
    tag: "Archimedean Spiral",
    descriptionEn: "A fast-growing angle combined with a cosine-modulated radius creates a spiral that opens out and closes cleanly back into itself.",
    descriptionZh: "快速增长的角度配合被余弦调制的半径，会形成向外展开又能平顺闭合的螺旋轨迹。",
    searchTurns: 4,
    searchBaseRadius: 8,
    searchRadiusAmp: 8.5,
    searchPulse: 2.4,
    searchScale: 1,
    controls: [
      { key: "searchTurns", labelEn: "Turns", labelZh: "圈数", min: 2, max: 8, step: 0.1 },
      { key: "searchBaseRadius", labelEn: "Base radius", labelZh: "基础半径", min: 2, max: 16, step: 0.1 },
      { key: "searchRadiusAmp", labelEn: "Radius amp", labelZh: "半径振幅", min: 2, max: 16, step: 0.1 },
      { key: "searchPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 6, step: 0.1 },
      { key: "searchScale", labelEn: "Scale", labelZh: "缩放", min: 0.5, max: 1.8, step: 0.05 },
    ],
    formula(config) {
      return [
        `θ(t) = ${config.searchTurns.toFixed(1)}t`,
        `r(t) = ${config.searchBaseRadius.toFixed(1)} + (1 - cos t)(${config.searchRadiusAmp.toFixed(1)} + ${config.searchPulse.toFixed(1)}s)`,
        `x(t) = 50 + cos θ · r(t) · ${config.searchScale.toFixed(2)}`,
        `y(t) = 50 + sin θ · r(t) · ${config.searchScale.toFixed(2)}`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 86,
    trailSpan: 0.28,
    durationMs: 7800,
    rotationDurationMs: 44000,
    pulseDurationMs: 6800,
    strokeWidth: 4.3,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const angle = t * config.searchTurns;
      const radius =
        config.searchBaseRadius +
        (1 - Math.cos(t)) * (config.searchRadiusAmp + detailScale * config.searchPulse);
      return {
        x: 50 + Math.cos(angle) * radius * config.searchScale,
        y: 50 + Math.sin(angle) * radius * config.searchScale,
      };
    },
  },
  {
    name: "Fourier Flow",
    tag: "Fourier Curve",
    descriptionEn: "Several sine and cosine components interfere with one another, so the shape keeps mutating like a living waveform.",
    descriptionZh: "多组正弦和余弦彼此干涉后，轮廓会持续变形，看起来像一条有生命的信号波。",
    fourierX1: 17,
    fourierX3: 7.5,
    fourierX5: 3.2,
    fourierY1: 15,
    fourierY2: 8.2,
    fourierY4: 4.2,
    fourierMixBase: 1,
    fourierMixPulse: 0.16,
    controls: [
      { key: "fourierX1", labelEn: "x cos1", labelZh: "x 一阶", min: 4, max: 24, step: 0.1 },
      { key: "fourierX3", labelEn: "x cos3", labelZh: "x 三阶", min: 0, max: 14, step: 0.1 },
      { key: "fourierX5", labelEn: "x sin5", labelZh: "x 五阶", min: 0, max: 10, step: 0.1 },
      { key: "fourierY1", labelEn: "y sin1", labelZh: "y 一阶", min: 4, max: 24, step: 0.1 },
      { key: "fourierY2", labelEn: "y sin2", labelZh: "y 二阶", min: 0, max: 14, step: 0.1 },
      { key: "fourierY4", labelEn: "y cos4", labelZh: "y 四阶", min: 0, max: 10, step: 0.1 },
      { key: "fourierMixPulse", labelEn: "Mix pulse", labelZh: "混合呼吸", min: 0, max: 0.8, step: 0.01 },
    ],
    formula(config) {
      return [
        `x(t) = 50 + ${config.fourierX1.toFixed(1)} cos t + ${config.fourierX3.toFixed(1)} cos(3t + 0.6m) + ${config.fourierX5.toFixed(1)} sin(5t - 0.4)`,
        `y(t) = 50 + ${config.fourierY1.toFixed(1)} sin t + ${config.fourierY2.toFixed(1)} sin(2t + 0.25) - ${config.fourierY4.toFixed(1)} cos(4t - 0.5m)`,
        `m = ${config.fourierMixBase.toFixed(2)} + ${config.fourierMixPulse.toFixed(2)}s`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 92,
    trailSpan: 0.31,
    durationMs: 8400,
    rotationDurationMs: 44000,
    pulseDurationMs: 6800,
    strokeWidth: 4.2,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const mix = config.fourierMixBase + detailScale * config.fourierMixPulse;
      const x =
        config.fourierX1 * Math.cos(t) +
        config.fourierX3 * Math.cos(3 * t + 0.6 * mix) +
        config.fourierX5 * Math.sin(5 * t - 0.4);
      const y =
        config.fourierY1 * Math.sin(t) +
        config.fourierY2 * Math.sin(2 * t + 0.25) -
        config.fourierY4 * Math.cos(4 * t - 0.5 * mix);
      return {
        x: 50 + x,
        y: 50 + y,
      };
    },
  },
  {
    name: "Epicycloid Crown",
    tag: "Outer Spirograph",
    descriptionEn: "An epicycloid rolls around the outside of a circle, so the particles flare outward into a bright crown of looping cusps.",
    descriptionZh: "外摆线沿着圆外滚动，所以粒子会向外张开，形成一圈像皇冠一样的尖瓣回环。",
    epiR: 7,
    epir: 2.2,
    epid: 4.2,
    epiPulse: 0.7,
    epiScale: 2.35,
    controls: [
      { key: "epiR", labelEn: "R", labelZh: "R", min: 4, max: 12, step: 0.1 },
      { key: "epir", labelEn: "r", labelZh: "r", min: 1, max: 5, step: 0.1 },
      { key: "epid", labelEn: "d", labelZh: "d", min: 1, max: 8, step: 0.1 },
      { key: "epiPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 1.6, step: 0.05 },
      { key: "epiScale", labelEn: "Scale", labelZh: "缩放", min: 1.4, max: 3.6, step: 0.05 },
    ],
    formula(config) {
      return [
        `x(t) = 50 + ((R+r) cos t - d cos((R+r)t/r)) · ${config.epiScale.toFixed(2)}`,
        `y(t) = 50 + ((R+r) sin t - d sin((R+r)t/r)) · ${config.epiScale.toFixed(2)}`,
        `R = ${config.epiR.toFixed(1)}, r = ${config.epir.toFixed(1)}, d = ${config.epid.toFixed(1)} + ${config.epiPulse.toFixed(2)}s`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 90,
    trailSpan: 0.38,
    durationMs: 7200,
    rotationDurationMs: 36000,
    pulseDurationMs: 5600,
    strokeWidth: 4.3,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const d = config.epid + detailScale * config.epiPulse;
      const ratio = (config.epiR + config.epir) / config.epir;
      const x = (config.epiR + config.epir) * Math.cos(t) - d * Math.cos(ratio * t);
      const y = (config.epiR + config.epir) * Math.sin(t) - d * Math.sin(ratio * t);
      return {
        x: 50 + x * config.epiScale,
        y: 50 + y * config.epiScale,
      };
    },
  },
  {
    name: "Astroid Pulse",
    tag: "x^(2/3) + y^(2/3)",
    descriptionEn: "The astroid's cos³ and sin³ coordinates pinch the orbit into four soft cusps, like a rounded diamond breathing in place.",
    descriptionZh: "星形线使用 cos³ 与 sin³ 坐标，会把轨迹压成四个柔和尖点，像一颗会呼吸的圆角钻石。",
    astroidA: 26,
    astroidPulse: 5,
    astroidSkew: 0.18,
    controls: [
      { key: "astroidA", labelEn: "a", labelZh: "a", min: 12, max: 34, step: 0.5 },
      { key: "astroidPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 10, step: 0.1 },
      { key: "astroidSkew", labelEn: "Skew", labelZh: "倾斜", min: -0.5, max: 0.5, step: 0.01 },
    ],
    formula(config) {
      return [
        `a = ${config.astroidA.toFixed(1)} + ${config.astroidPulse.toFixed(1)}s`,
        "x(t) = 50 + a cos³ t + skew · a sin³ t",
        "y(t) = 50 + a sin³ t - skew · a cos³ t",
      ].join("\n");
    },
    rotate: true,
    particleCount: 78,
    trailSpan: 0.34,
    durationMs: 5600,
    rotationDurationMs: 32000,
    pulseDurationMs: 4800,
    strokeWidth: 4.6,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.astroidA + detailScale * config.astroidPulse;
      const cx = Math.cos(t) ** 3;
      const sy = Math.sin(t) ** 3;
      return {
        x: 50 + a * (cx + config.astroidSkew * sy),
        y: 50 + a * (sy - config.astroidSkew * cx),
      };
    },
  },
  {
    name: "Superellipse Squircle",
    tag: "Lamé Curve",
    descriptionEn: "A Lamé superellipse morphs between square and circle energy, giving the loader a calm rounded-rectangle orbit.",
    descriptionZh: "Lamé 超椭圆介乎方形和圆形之间，会形成一种平静的圆角矩形加载轨道。",
    superA: 24,
    superB: 20,
    superPower: 3.6,
    superPulse: 3.5,
    controls: [
      { key: "superA", labelEn: "Width", labelZh: "宽度", min: 12, max: 34, step: 0.5 },
      { key: "superB", labelEn: "Height", labelZh: "高度", min: 12, max: 34, step: 0.5 },
      { key: "superPower", labelEn: "Power", labelZh: "指数", min: 1.6, max: 6, step: 0.1 },
      { key: "superPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 8, step: 0.1 },
    ],
    formula(config) {
      return [
        `n = ${config.superPower.toFixed(1)}, a = ${config.superA.toFixed(1)} + ${config.superPulse.toFixed(1)}s`,
        "x(t) = 50 + a · sgn(cos t)|cos t|^(2/n)",
        `y(t) = 50 + ${config.superB.toFixed(1)} · sgn(sin t)|sin t|^(2/n)`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 82,
    trailSpan: 0.3,
    durationMs: 6400,
    rotationDurationMs: 38000,
    pulseDurationMs: 5200,
    strokeWidth: 4.5,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const n = config.superPower;
      const a = config.superA + detailScale * config.superPulse;
      const signedPow = (value) => Math.sign(value) * Math.abs(value) ** (2 / n);
      return {
        x: 50 + a * signedPow(Math.cos(t)),
        y: 50 + config.superB * signedPow(Math.sin(t)),
      };
    },
  },
  {
    name: "Trefoil Ribbon",
    tag: "Projected Knot",
    descriptionEn: "A 2D projection of the trefoil knot crosses over itself in a smooth ribbon, giving the loader a braided orbital feel.",
    descriptionZh: "三叶结的二维投影会优雅地自我交叉，令加载轨迹有一种编织丝带般的绕行动感。",
    trefoilScale: 8.2,
    trefoilPulse: 1.1,
    trefoilYScale: 0.86,
    controls: [
      { key: "trefoilScale", labelEn: "Scale", labelZh: "缩放", min: 4, max: 12, step: 0.1 },
      { key: "trefoilPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 2.5, step: 0.05 },
      { key: "trefoilYScale", labelEn: "Y scale", labelZh: "Y 缩放", min: 0.5, max: 1.2, step: 0.01 },
    ],
    formula(config) {
      return [
        "u(t) = (sin t + 2 sin 2t, cos t - 2 cos 2t)",
        `x(t) = 50 + uₓ(t) · (${config.trefoilScale.toFixed(1)} + ${config.trefoilPulse.toFixed(2)}s)`,
        `y(t) = 50 + uᵧ(t) · ${config.trefoilYScale.toFixed(2)} · (${config.trefoilScale.toFixed(1)} + ${config.trefoilPulse.toFixed(2)}s)`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 88,
    trailSpan: 0.36,
    durationMs: 7000,
    rotationDurationMs: 42000,
    pulseDurationMs: 5600,
    strokeWidth: 4.4,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const scale = config.trefoilScale + detailScale * config.trefoilPulse;
      const x = Math.sin(t) + 2 * Math.sin(2 * t);
      const y = Math.cos(t) - 2 * Math.cos(2 * t);
      return {
        x: 50 + x * scale,
        y: 50 + y * scale * config.trefoilYScale,
      };
    },
  },
  {
    name: "Maurer Spark",
    tag: "Rose Chord Weave",
    descriptionEn: "Sampling a rose curve with a moving chord step turns simple petals into a starry woven spark that keeps folding back on itself.",
    descriptionZh: "用移动弦步去采样玫瑰曲线，会把简单花瓣织成星芒一样的回折轨迹。",
    maurerRadius: 24,
    maurerK: 5,
    maurerStep: 13,
    maurerPulse: 2.5,
    controls: [
      { key: "maurerRadius", labelEn: "Radius", labelZh: "半径", min: 12, max: 34, step: 0.5 },
      { key: "maurerK", labelEn: "k", labelZh: "k 值", min: 2, max: 9, step: 1 },
      { key: "maurerStep", labelEn: "Step", labelZh: "弦步", min: 3, max: 37, step: 1 },
      { key: "maurerPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 6, step: 0.1 },
    ],
    formula(config) {
      return [
        `θ(t) = ${Math.round(config.maurerStep)}t`,
        `r(t) = (${config.maurerRadius.toFixed(1)} + ${config.maurerPulse.toFixed(1)}s) sin(${Math.round(config.maurerK)}θ)`,
        "x(t) = 50 + r(t) cos θ, y(t) = 50 + r(t) sin θ",
      ].join("\n");
    },
    rotate: true,
    particleCount: 96,
    trailSpan: 0.34,
    durationMs: 16000,
    rotationDurationMs: 72000,
    pulseDurationMs: 6200,
    strokeWidth: 4.0,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const step = Math.round(config.maurerStep);
      const k = Math.round(config.maurerK);
      const theta = t * step;
      const radius = (config.maurerRadius + detailScale * config.maurerPulse) * Math.sin(k * theta);
      return {
        x: 50 + radius * Math.cos(theta),
        y: 50 + radius * Math.sin(theta),
      };
    },
  },
  {
    name: "Gerono Infinity",
    tag: "Infinity Weave",
    descriptionEn: "A figure-eight Lemniscate of Gerono crosses the center smoothly, creating a readable infinity spinner.",
    descriptionZh: "Gerono 双纽线会在中心平滑交叉，形成清晰易读的无限符号旋转加载器。",
    geronoA: 28,
    geronoPulse: 4,
    controls: [
      { key: "geronoA", labelEn: "Size", labelZh: "大小", min: 12, max: 36, step: 0.5 },
      { key: "geronoPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 8, step: 0.1 },
    ],
    formula(config) {
      return [
        `a = ${config.geronoA.toFixed(1)} + ${config.geronoPulse.toFixed(1)}s`,
        "x(t) = 50 + a cos t",
        "y(t) = 50 + (a/2) sin 2t",
      ].join("\n");
    },
    rotate: false,
    particleCount: 84,
    trailSpan: 0.42,
    durationMs: 7600,
    rotationDurationMs: 36000,
    pulseDurationMs: 5600,
    strokeWidth: 4.4,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.geronoA + detailScale * config.geronoPulse;
      return {
        x: 50 + a * Math.cos(t),
        y: 50 + (a / 2) * Math.sin(2 * t),
      };
    },
  },
  {
    name: "Epitrochoid Lantern",
    tag: "Epitrochoid",
    descriptionEn: "An epitrochoid with a short arm makes a lantern-like orbital bloom, adding another spirograph family to the set.",
    descriptionZh: "短臂外旋轮线会形成像灯笼一样的环形花纹，为图库加入另一类 spirograph 轨迹。",
    epiTrochoidR: 6,
    epiTrochoidr: 1.7,
    epiTrochoidD: 3.4,
    epiTrochoidScale: 2.8,
    controls: [
      { key: "epiTrochoidR", labelEn: "R", labelZh: "R", min: 3, max: 10, step: 0.1 },
      { key: "epiTrochoidr", labelEn: "r", labelZh: "r", min: 0.8, max: 4, step: 0.1 },
      { key: "epiTrochoidD", labelEn: "d", labelZh: "d", min: 1, max: 7, step: 0.1 },
      { key: "epiTrochoidScale", labelEn: "Scale", labelZh: "缩放", min: 1.6, max: 4, step: 0.05 },
    ],
    formula(config) {
      return [
        `x(t) = 50 + ((R+r)cos t - d cos((R+r)t/r)) · ${config.epiTrochoidScale.toFixed(2)}`,
        `y(t) = 50 + ((R+r)sin t - d sin((R+r)t/r)) · ${config.epiTrochoidScale.toFixed(2)}`,
        `R=${config.epiTrochoidR.toFixed(1)}, r=${config.epiTrochoidr.toFixed(1)}, d=${config.epiTrochoidD.toFixed(1)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 92,
    trailSpan: 0.36,
    durationMs: 8800,
    rotationDurationMs: 64000,
    pulseDurationMs: 6200,
    strokeWidth: 4.2,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const d = config.epiTrochoidD * (0.9 + detailScale * 0.18);
      const ratio = (config.epiTrochoidR + config.epiTrochoidr) / config.epiTrochoidr;
      const x = (config.epiTrochoidR + config.epiTrochoidr) * Math.cos(t) - d * Math.cos(ratio * t);
      const y = (config.epiTrochoidR + config.epiTrochoidr) * Math.sin(t) - d * Math.sin(ratio * t);
      return {
        x: 50 + x * config.epiTrochoidScale,
        y: 50 + y * config.epiTrochoidScale,
      };
    },
  },
  {
    name: "Archimedean Spiral",
    tag: "Linear Spiral",
    descriptionEn: "A linear-radius spiral winds outward at an even pace, useful for search and loading states that should feel directional.",
    descriptionZh: "线性半径螺旋会以稳定节奏向外绕出，适合带有方向感的搜索或加载状态。",
    archTurns: 3.2,
    archRadius: 29,
    archPulse: 3,
    controls: [
      { key: "archTurns", labelEn: "Turns", labelZh: "圈数", min: 1.5, max: 6, step: 0.1 },
      { key: "archRadius", labelEn: "Radius", labelZh: "半径", min: 14, max: 36, step: 0.5 },
      { key: "archPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 8, step: 0.1 },
    ],
    formula(config) {
      return [
        `θ(t) = ${config.archTurns.toFixed(1)} · 2πt`,
        `r(t) = (${config.archRadius.toFixed(1)} + ${config.archPulse.toFixed(1)}s) · t`,
        "x(t)=50+r cosθ, y(t)=50+r sinθ",
      ].join("\n");
    },
    rotate: true,
    particleCount: 88,
    trailSpan: 0.52,
    durationMs: 9200,
    rotationDurationMs: 54000,
    pulseDurationMs: 5200,
    strokeWidth: 4.1,
    point(progress, detailScale, config) {
      const t = progress;
      const theta = t * config.archTurns * Math.PI * 2;
      const radius = (config.archRadius + detailScale * config.archPulse) * t;
      return {
        x: 50 + radius * Math.cos(theta),
        y: 50 + radius * Math.sin(theta),
      };
    },
  },
  {
    name: "Fermat Spiral",
    tag: "√t Spiral",
    descriptionEn: "Fermat's spiral uses a square-root radius, making the inner motion dense while the outer trail opens into balanced arms.",
    descriptionZh: "费马螺旋使用平方根半径，中心更密集，外侧则展开成均衡的双臂轨迹。",
    fermatTurns: 4.6,
    fermatRadius: 31,
    fermatTwist: 0.5,
    controls: [
      { key: "fermatTurns", labelEn: "Turns", labelZh: "圈数", min: 2, max: 8, step: 0.1 },
      { key: "fermatRadius", labelEn: "Radius", labelZh: "半径", min: 14, max: 38, step: 0.5 },
      { key: "fermatTwist", labelEn: "Twist", labelZh: "扭转", min: -1, max: 1, step: 0.05 },
    ],
    formula(config) {
      return [
        `θ(t) = ${config.fermatTurns.toFixed(1)} · 2πt`,
        `r(t) = ${config.fermatRadius.toFixed(1)}√t`,
        "x(t)=50+r cosθ, y(t)=50+r sinθ",
      ].join("\n");
    },
    rotate: true,
    particleCount: 90,
    trailSpan: 0.48,
    durationMs: 10400,
    rotationDurationMs: 68000,
    pulseDurationMs: 6400,
    strokeWidth: 4.0,
    point(progress, detailScale, config) {
      const t = progress;
      const theta = (t * config.fermatTurns + config.fermatTwist * detailScale) * Math.PI * 2;
      const radius = config.fermatRadius * Math.sqrt(t);
      return {
        x: 50 + radius * Math.cos(theta),
        y: 50 + radius * Math.sin(theta),
      };
    },
  },
  {
    name: "Superformula Star",
    tag: "Gielis Superformula",
    descriptionEn: "A compact superformula star can be tuned into many rounded polygon and floral silhouettes from one equation.",
    descriptionZh: "紧凑的 Gielis 超公式星形可由同一条公式调出圆角多边形和花状轮廓。",
    superM: 7,
    superN1: 0.35,
    superN2: 1.2,
    superN3: 1.2,
    superScale: 16,
    controls: [
      { key: "superM", labelEn: "m", labelZh: "m 值", min: 2, max: 12, step: 1 },
      { key: "superN1", labelEn: "n1", labelZh: "n1", min: 0.2, max: 3, step: 0.05 },
      { key: "superN2", labelEn: "n2", labelZh: "n2", min: 0.2, max: 3, step: 0.05 },
      { key: "superN3", labelEn: "n3", labelZh: "n3", min: 0.2, max: 3, step: 0.05 },
      { key: "superScale", labelEn: "Scale", labelZh: "缩放", min: 8, max: 26, step: 0.5 },
    ],
    formula(config) {
      return [
        `r(θ) = (|cos(mθ/4)|^n2 + |sin(mθ/4)|^n3)^(-1/n1)`,
        `m=${Math.round(config.superM)}, n1=${config.superN1.toFixed(2)}, n2=${config.superN2.toFixed(2)}, n3=${config.superN3.toFixed(2)}`,
        "x(t)=50+r cosθ, y(t)=50+r sinθ",
      ].join("\n");
    },
    rotate: true,
    particleCount: 96,
    trailSpan: 0.32,
    durationMs: 9800,
    rotationDurationMs: 72000,
    pulseDurationMs: 6800,
    strokeWidth: 4.1,
    point(progress, detailScale, config) {
      const theta = progress * Math.PI * 2;
      const m = Math.round(config.superM);
      const a = Math.abs(Math.cos((m * theta) / 4)) ** config.superN2;
      const b = Math.abs(Math.sin((m * theta) / 4)) ** config.superN3;
      const r = (a + b) ** (-1 / config.superN1);
      const scale = config.superScale * (0.92 + detailScale * 0.16);
      return {
        x: 50 + r * Math.cos(theta) * scale,
        y: 50 + r * Math.sin(theta) * scale,
      };
    },
  },
  {
    name: "Nephroid Caustic",
    tag: "Two-Cusped Epicycloid",
    descriptionEn: "A nephroid's two large cusps make a soft caustic glow that feels slower and more elegant than dense spirographs.",
    descriptionZh: "肾形线拥有两个明显尖点，像柔和焦散光一样，比密集旋轮线更慢、更优雅。",
    nephroidA: 10,
    nephroidPulse: 2.5,
    controls: [
      { key: "nephroidA", labelEn: "Size", labelZh: "大小", min: 5, max: 16, step: 0.1 },
      { key: "nephroidPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 5, step: 0.1 },
    ],
    formula(config) {
      return [
        `a = ${config.nephroidA.toFixed(1)} + ${config.nephroidPulse.toFixed(1)}s`,
        "x(t)=50+a(3cos t - cos 3t)",
        "y(t)=50+a(3sin t - sin 3t)",
      ].join("\n");
    },
    rotate: true,
    particleCount: 86,
    trailSpan: 0.4,
    durationMs: 9000,
    rotationDurationMs: 62000,
    pulseDurationMs: 6200,
    strokeWidth: 4.6,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const a = config.nephroidA + detailScale * config.nephroidPulse;
      return {
        x: 50 + a * (3 * Math.cos(t) - Math.cos(3 * t)),
        y: 50 + a * (3 * Math.sin(t) - Math.sin(3 * t)),
      };
    },
  },
  {
    name: "Cochleoid Shell",
    tag: "Shell Spiral",
    descriptionEn: "A cochleoid-style shell folds a sine wave into a spiral radius, giving the loader a natural conch-like sweep.",
    descriptionZh: "贝壳形螺线把正弦波折入螺旋半径，形成类似海螺的自然扫动轨迹。",
    cochA: 28,
    cochTurns: 3.4,
    cochOffset: 0.35,
    controls: [
      { key: "cochA", labelEn: "Size", labelZh: "大小", min: 12, max: 36, step: 0.5 },
      { key: "cochTurns", labelEn: "Turns", labelZh: "圈数", min: 1.5, max: 6, step: 0.1 },
      { key: "cochOffset", labelEn: "Core", labelZh: "核心", min: 0.05, max: 1, step: 0.05 },
    ],
    formula(config) {
      return [
        `θ(t) = ${config.cochTurns.toFixed(1)} · 2πt`,
        `r(t) = ${config.cochA.toFixed(1)} sinθ / (θ + ${config.cochOffset.toFixed(2)})`,
        "x(t)=50+r cosθ, y(t)=50+r sinθ",
      ].join("\n");
    },
    rotate: true,
    particleCount: 92,
    trailSpan: 0.5,
    durationMs: 11000,
    rotationDurationMs: 78000,
    pulseDurationMs: 7200,
    strokeWidth: 4.0,
    point(progress, detailScale, config) {
      const theta = (progress * config.cochTurns + 0.08) * Math.PI * 2;
      const radius = (config.cochA * (0.9 + detailScale * 0.18) * Math.sin(theta)) / (theta + config.cochOffset);
      return {
        x: 50 + radius * Math.cos(theta) * 3.4,
        y: 50 + radius * Math.sin(theta) * 3.4,
      };
    },
  },
  {
    name: "Sine Weave",
    tag: "Harmonic Weave",
    descriptionEn: "Layered sine waves braid a smooth horizontal weave, adding a calm waveform loader beside the closed-orbit curves.",
    descriptionZh: "多层正弦波会编织成平滑的横向轨迹，为闭合曲线之外加入安静的波形加载器。",
    sineAmp: 20,
    sineFreq: 2.5,
    sineMod: 0.35,
    controls: [
      { key: "sineAmp", labelEn: "Amplitude", labelZh: "振幅", min: 8, max: 28, step: 0.5 },
      { key: "sineFreq", labelEn: "Frequency", labelZh: "频率", min: 1, max: 6, step: 0.1 },
      { key: "sineMod", labelEn: "Mod", labelZh: "调制", min: 0, max: 1, step: 0.05 },
    ],
    formula(config) {
      return [
        "x(t)=14+72t",
        `y(t)=50+${config.sineAmp.toFixed(1)}(sin(${config.sineFreq.toFixed(1)}τ)+${config.sineMod.toFixed(2)}sin(3τ))`,
        "τ = 2πt",
      ].join("\n");
    },
    rotate: false,
    particleCount: 76,
    trailSpan: 0.36,
    durationMs: 6800,
    rotationDurationMs: 30000,
    pulseDurationMs: 5400,
    strokeWidth: 4.5,
    point(progress, detailScale, config) {
      const t = progress;
      const tau = Math.PI * 2 * t;
      return {
        x: 14 + 72 * t,
        y: 50 + config.sineAmp * (0.85 + detailScale * 0.22) * (Math.sin(config.sineFreq * tau) + config.sineMod * Math.sin(3 * tau)),
      };
    },
  },


];

function createGeneratedRosePreset({ name, k, radius, pulse, phase = 0, hue }) {
  return {
    name,
    tag: "Generated Rose",
    descriptionEn: `A generated rose preset using k=${k}, tuned as part of the scalable expansion wave toward a much larger gallery.`,
    descriptionZh: `生成式玫瑰曲线预设，k=${k}，作为图库扩展到更大规模的一组精选变体。`,
    generated: true,
    roseRadius: radius,
    roseK: k,
    rosePhase: phase,
    rosePulse: pulse,
    hue,
    hueRange: 110,
    controls: [
      { key: "roseRadius", labelEn: "Radius", labelZh: "半径", min: 10, max: 36, step: 0.5 },
      { key: "roseK", labelEn: "k", labelZh: "k 值", min: 2, max: 14, step: 1 },
      { key: "rosePhase", labelEn: "Phase", labelZh: "相位", min: -1, max: 1, step: 0.01 },
      { key: "rosePulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 8, step: 0.1 },
    ],
    formula(config) {
      return [
        `r(t) = (${config.roseRadius.toFixed(1)} + ${config.rosePulse.toFixed(1)}s) cos(${Math.round(config.roseK)}(t + ${config.rosePhase.toFixed(2)}))`,
        "x(t)=50+r cos t, y(t)=50+r sin t",
        "Generated preset: rose family",
      ].join("\n");
    },
    rotate: true,
    particleCount: 88,
    trailSpan: 0.34,
    durationMs: 8200 + k * 180,
    rotationDurationMs: 52000 + k * 1600,
    pulseDurationMs: 5400,
    strokeWidth: 4.2,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const radius = (config.roseRadius + detailScale * config.rosePulse) * Math.cos(Math.round(config.roseK) * (t + config.rosePhase));
      return {
        x: 50 + radius * Math.cos(t),
        y: 50 + radius * Math.sin(t),
      };
    },
  };
}

function createGeneratedLissajousPreset({ name, ax, by, delta, scaleX, scaleY, hue }) {
  return {
    name,
    tag: "Generated Lissajous",
    descriptionEn: `A generated Lissajous preset with ${ax}:${by} frequency coupling for smooth harmonic motion.`,
    descriptionZh: `生成式 Lissajous 预设，使用 ${ax}:${by} 频率耦合，形成平滑的谐波运动。`,
    generated: true,
    lissA: ax,
    lissB: by,
    lissDelta: delta,
    lissScaleX: scaleX,
    lissScaleY: scaleY,
    hue,
    hueRange: 180,
    controls: [
      { key: "lissA", labelEn: "A freq", labelZh: "A 频率", min: 1, max: 9, step: 1 },
      { key: "lissB", labelEn: "B freq", labelZh: "B 频率", min: 1, max: 9, step: 1 },
      { key: "lissDelta", labelEn: "Phase", labelZh: "相位", min: 0, max: 6.28, step: 0.01 },
      { key: "lissScaleX", labelEn: "Width", labelZh: "宽度", min: 12, max: 38, step: 0.5 },
      { key: "lissScaleY", labelEn: "Height", labelZh: "高度", min: 12, max: 38, step: 0.5 },
    ],
    formula(config) {
      return [
        `x(t) = 50 + ${config.lissScaleX.toFixed(1)} sin(${Math.round(config.lissA)}t + ${config.lissDelta.toFixed(2)})`,
        `y(t) = 50 + ${config.lissScaleY.toFixed(1)} sin(${Math.round(config.lissB)}t)`,
        "Generated preset: Lissajous family",
      ].join("\n");
    },
    rotate: false,
    particleCount: 86,
    trailSpan: 0.38,
    durationMs: 8800,
    rotationDurationMs: 42000,
    pulseDurationMs: 6000,
    strokeWidth: 4.3,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const sx = config.lissScaleX * (0.92 + detailScale * 0.16);
      const sy = config.lissScaleY * (0.92 + detailScale * 0.16);
      return {
        x: 50 + sx * Math.sin(Math.round(config.lissA) * t + config.lissDelta),
        y: 50 + sy * Math.sin(Math.round(config.lissB) * t),
      };
    },
  };
}

function createGeneratedSpiroPreset({ name, rMajor, rMinor, d, scale, inward = true, hue }) {
  return {
    name,
    tag: inward ? "Generated Hypotrochoid" : "Generated Epitrochoid",
    descriptionEn: `A generated ${inward ? "hypotrochoid" : "epitrochoid"} preset expanding the spirograph family with curated defaults.`,
    descriptionZh: `生成式${inward ? "内旋轮线" : "外旋轮线"}预设，以精选参数扩展 spirograph 家族。`,
    generated: true,
    spiroMajor: rMajor,
    spiroMinor: rMinor,
    spiroD: d,
    spiroScale: scale,
    spiroInward: inward,
    hue,
    hueRange: 140,
    controls: [
      { key: "spiroMajor", labelEn: "R", labelZh: "R", min: 3, max: 13, step: 0.1 },
      { key: "spiroMinor", labelEn: "r", labelZh: "r", min: 0.8, max: 6, step: 0.1 },
      { key: "spiroD", labelEn: "d", labelZh: "d", min: 0.8, max: 9, step: 0.1 },
      { key: "spiroScale", labelEn: "Scale", labelZh: "缩放", min: 1.4, max: 4.4, step: 0.05 },
    ],
    formula(config) {
      const sign = config.spiroInward ? "-" : "+";
      return [
        `x(t)=50+((R${sign}r)cos t + d cos((R${sign}r)t/r)) · ${config.spiroScale.toFixed(2)}`,
        `y(t)=50+((R${sign}r)sin t - d sin((R${sign}r)t/r)) · ${config.spiroScale.toFixed(2)}`,
        "Generated preset: spirograph family",
      ].join("\n");
    },
    rotate: true,
    particleCount: 94,
    trailSpan: 0.36,
    durationMs: 9400,
    rotationDurationMs: 68000,
    pulseDurationMs: 6500,
    strokeWidth: 4.1,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const r = config.spiroMinor;
      const d = config.spiroD * (0.92 + detailScale * 0.16);
      const base = config.spiroInward ? config.spiroMajor - r : config.spiroMajor + r;
      const ratio = base / r;
      const x = base * Math.cos(t) + d * Math.cos(ratio * t);
      const y = base * Math.sin(t) - d * Math.sin(ratio * t);
      return {
        x: 50 + x * config.spiroScale,
        y: 50 + y * config.spiroScale,
      };
    },
  };
}

function createGeneratedSuperellipsePreset({ name, width, height, power, hue }) {
  return {
    name,
    tag: "Generated Superellipse",
    descriptionEn: `A generated superellipse preset with power ${power}, giving the gallery more rounded-geometry options.`,
    descriptionZh: `生成式超椭圆预设，指数为 ${power}，为图库加入更多圆润几何选择。`,
    generated: true,
    genSuperWidth: width,
    genSuperHeight: height,
    genSuperPower: power,
    genSuperPulse: 3.5,
    hue,
    hueRange: 96,
    controls: [
      { key: "genSuperWidth", labelEn: "Width", labelZh: "宽度", min: 10, max: 38, step: 0.5 },
      { key: "genSuperHeight", labelEn: "Height", labelZh: "高度", min: 10, max: 38, step: 0.5 },
      { key: "genSuperPower", labelEn: "Power", labelZh: "指数", min: 1.2, max: 8, step: 0.1 },
      { key: "genSuperPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 8, step: 0.1 },
    ],
    formula(config) {
      return [
        `n=${config.genSuperPower.toFixed(1)}`,
        "x(t)=50+a·sgn(cos t)|cos t|^(2/n)",
        "y(t)=50+b·sgn(sin t)|sin t|^(2/n)",
      ].join("\n");
    },
    rotate: true,
    particleCount: 82,
    trailSpan: 0.3,
    durationMs: 8200,
    rotationDurationMs: 62000,
    pulseDurationMs: 5600,
    strokeWidth: 4.4,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const signedPow = (value) => Math.sign(value) * Math.abs(value) ** (2 / config.genSuperPower);
      const pulse = detailScale * config.genSuperPulse;
      return {
        x: 50 + (config.genSuperWidth + pulse) * signedPow(Math.cos(t)),
        y: 50 + (config.genSuperHeight + pulse * 0.7) * signedPow(Math.sin(t)),
      };
    },
  };
}


function createGeneratedSpiralPreset({ name, turns, radius, curve = 1, shell = false, hue }) {
  return {
    name,
    tag: shell ? "Generated Shell Spiral" : "Generated Spiral",
    descriptionEn: `A generated ${shell ? "shell" : "spiral"} preset with ${turns} turns for directional loading motion.`,
    descriptionZh: `生成式${shell ? "贝壳" : "螺旋"}预设，${turns} 圈轨迹带来有方向感的加载动效。`,
    generated: true,
    genSpiralTurns: turns,
    genSpiralRadius: radius,
    genSpiralCurve: curve,
    genSpiralShell: shell,
    hue,
    hueRange: shell ? 150 : 120,
    controls: [
      { key: "genSpiralTurns", labelEn: "Turns", labelZh: "圈数", min: 1.2, max: 9, step: 0.1 },
      { key: "genSpiralRadius", labelEn: "Radius", labelZh: "半径", min: 10, max: 38, step: 0.5 },
      { key: "genSpiralCurve", labelEn: "Curve", labelZh: "曲率", min: 0.35, max: 2.6, step: 0.05 },
    ],
    formula(config) {
      return [
        `θ(t) = ${config.genSpiralTurns.toFixed(1)} · 2πt`,
        `r(t) = ${config.genSpiralRadius.toFixed(1)} · t^${config.genSpiralCurve.toFixed(2)}`,
        "x(t)=50+r cosθ, y(t)=50+r sinθ",
      ].join("\n");
    },
    rotate: true,
    particleCount: 88,
    trailSpan: 0.5,
    durationMs: 9800,
    rotationDurationMs: 74000,
    pulseDurationMs: 6400,
    strokeWidth: 4.0,
    point(progress, detailScale, config) {
      const t = progress;
      const theta = t * config.genSpiralTurns * Math.PI * 2;
      const radius = (config.genSpiralRadius * (0.92 + detailScale * 0.16)) * (config.genSpiralShell ? Math.sin(theta) / (theta * 0.18 + 0.75) * 2.2 : t ** config.genSpiralCurve);
      return {
        x: 50 + radius * Math.cos(theta),
        y: 50 + radius * Math.sin(theta),
      };
    },
  };
}

function createGeneratedHeartPreset({ name, scale, squeeze = 1, beat = 1, hue }) {
  return {
    name,
    tag: "Generated Heart",
    descriptionEn: `A generated heart/cardioid-style preset with beat ${beat}, adding warmer public-facing loader options.`,
    descriptionZh: `生成式心形 / cardioid 预设，beat=${beat}，加入更有温度的加载选项。`,
    generated: true,
    genHeartScale: scale,
    genHeartSqueeze: squeeze,
    genHeartBeat: beat,
    hue,
    hueRange: 80,
    controls: [
      { key: "genHeartScale", labelEn: "Scale", labelZh: "缩放", min: 0.7, max: 1.8, step: 0.01 },
      { key: "genHeartSqueeze", labelEn: "Squeeze", labelZh: "压缩", min: 0.6, max: 1.4, step: 0.01 },
      { key: "genHeartBeat", labelEn: "Beat", labelZh: "心跳", min: 0, max: 2.5, step: 0.05 },
    ],
    formula(config) {
      return [
        "x(t)=50+16s·sin³t",
        "y(t)=50-s·(13cos t-5cos2t-2cos3t-cos4t)",
        `s=${config.genHeartScale.toFixed(2)} + ${config.genHeartBeat.toFixed(2)} pulse`,
      ].join("\n");
    },
    rotate: false,
    particleCount: 86,
    trailSpan: 0.42,
    durationMs: 8200,
    rotationDurationMs: 36000,
    pulseDurationMs: 5200,
    strokeWidth: 4.5,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const scale = config.genHeartScale + detailScale * config.genHeartBeat * 0.12;
      return {
        x: 50 + 16 * scale * Math.sin(t) ** 3,
        y: 52 - scale * config.genHeartSqueeze * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
      };
    },
  };
}

function createGeneratedFourierPreset({ name, a, b, c, d, hue }) {
  return {
    name,
    tag: "Generated Fourier",
    descriptionEn: `A generated Fourier-style preset blending ${a}, ${b}, ${c}, and ${d} harmonics into a braided orbit.`,
    descriptionZh: `生成式 Fourier 风格预设，将 ${a}、${b}、${c}、${d} 次谐波编织成轨道。`,
    generated: true,
    genFourierA: a,
    genFourierB: b,
    genFourierC: c,
    genFourierD: d,
    genFourierScale: 18,
    hue,
    hueRange: 220,
    controls: [
      { key: "genFourierA", labelEn: "A", labelZh: "A", min: 1, max: 13, step: 1 },
      { key: "genFourierB", labelEn: "B", labelZh: "B", min: 1, max: 13, step: 1 },
      { key: "genFourierC", labelEn: "C", labelZh: "C", min: 1, max: 13, step: 1 },
      { key: "genFourierD", labelEn: "D", labelZh: "D", min: 1, max: 13, step: 1 },
      { key: "genFourierScale", labelEn: "Scale", labelZh: "缩放", min: 10, max: 28, step: 0.5 },
    ],
    formula(config) {
      return [
        "x(t)=50+s(sin At + 0.5sin Bt)",
        "y(t)=50+s(cos Ct - 0.5cos Dt)",
        `A=${Math.round(config.genFourierA)}, B=${Math.round(config.genFourierB)}, C=${Math.round(config.genFourierC)}, D=${Math.round(config.genFourierD)}`,
      ].join("\n");
    },
    rotate: true,
    particleCount: 96,
    trailSpan: 0.38,
    durationMs: 10400,
    rotationDurationMs: 82000,
    pulseDurationMs: 7000,
    strokeWidth: 4.0,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const scale = config.genFourierScale * (0.92 + detailScale * 0.16);
      const x = Math.sin(Math.round(config.genFourierA) * t) + 0.5 * Math.sin(Math.round(config.genFourierB) * t);
      const y = Math.cos(Math.round(config.genFourierC) * t) - 0.5 * Math.cos(Math.round(config.genFourierD) * t);
      return {
        x: 50 + x * scale,
        y: 50 + y * scale,
      };
    },
  };
}

function createGeneratedPolarPreset({ name, petals, wobble, radius, hue }) {
  return {
    name,
    tag: "Generated Polar Wave",
    descriptionEn: `A generated polar-wave preset combining ${petals} petals with wobble ${wobble}.`,
    descriptionZh: `生成式极坐标波形预设，将 ${petals} 个花瓣与 ${wobble} 段扰动结合。`,
    generated: true,
    genPolarPetals: petals,
    genPolarWobble: wobble,
    genPolarRadius: radius,
    genPolarPulse: 3,
    hue,
    hueRange: 160,
    controls: [
      { key: "genPolarPetals", labelEn: "Petals", labelZh: "花瓣", min: 2, max: 18, step: 1 },
      { key: "genPolarWobble", labelEn: "Wobble", labelZh: "扰动", min: 1, max: 18, step: 1 },
      { key: "genPolarRadius", labelEn: "Radius", labelZh: "半径", min: 10, max: 34, step: 0.5 },
      { key: "genPolarPulse", labelEn: "Pulse", labelZh: "呼吸量", min: 0, max: 8, step: 0.1 },
    ],
    formula(config) {
      return [
        `r(t)=R(0.7+0.3cos(${Math.round(config.genPolarPetals)}t)+0.18sin(${Math.round(config.genPolarWobble)}t))`,
        "x(t)=50+r cos t, y(t)=50+r sin t",
        "Generated preset: polar wave family",
      ].join("\n");
    },
    rotate: true,
    particleCount: 92,
    trailSpan: 0.34,
    durationMs: 9200,
    rotationDurationMs: 76000,
    pulseDurationMs: 6200,
    strokeWidth: 4.2,
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2;
      const radius = (config.genPolarRadius + detailScale * config.genPolarPulse) * (0.7 + 0.3 * Math.cos(Math.round(config.genPolarPetals) * t) + 0.18 * Math.sin(Math.round(config.genPolarWobble) * t));
      return {
        x: 50 + radius * Math.cos(t),
        y: 50 + radius * Math.sin(t),
      };
    },
  };
}

const generatedCurvePresets = [
  createGeneratedRosePreset({ name: "Rose Prime 7", k: 7, radius: 25, pulse: 2.8, phase: 0.04, hue: 315 }),
  createGeneratedRosePreset({ name: "Rose Prime 11", k: 11, radius: 23, pulse: 2.2, phase: 0.02, hue: 335 }),
  createGeneratedRosePreset({ name: "Rose Even 8", k: 8, radius: 24, pulse: 2.6, phase: 0.08, hue: 290 }),
  createGeneratedRosePreset({ name: "Rose Orbit 12", k: 12, radius: 22, pulse: 3.2, phase: -0.03, hue: 265 }),
  createGeneratedRosePreset({ name: "Rose Bloom 13", k: 13, radius: 21, pulse: 2.4, phase: 0.01, hue: 345 }),
  createGeneratedRosePreset({ name: "Rose Soft 6", k: 6, radius: 27, pulse: 3.5, phase: -0.06, hue: 300 }),
  createGeneratedLissajousPreset({ name: "Lissajous 3:4", ax: 3, by: 4, delta: 1.1, scaleX: 28, scaleY: 26, hue: 198 }),
  createGeneratedLissajousPreset({ name: "Lissajous 5:6", ax: 5, by: 6, delta: 0.8, scaleX: 27, scaleY: 27, hue: 215 }),
  createGeneratedLissajousPreset({ name: "Lissajous 2:7", ax: 2, by: 7, delta: 1.57, scaleX: 30, scaleY: 24, hue: 232 }),
  createGeneratedLissajousPreset({ name: "Lissajous 4:9", ax: 4, by: 9, delta: 0.55, scaleX: 26, scaleY: 29, hue: 250 }),
  createGeneratedLissajousPreset({ name: "Lissajous 7:8", ax: 7, by: 8, delta: 1.32, scaleX: 25, scaleY: 25, hue: 178 }),
  createGeneratedLissajousPreset({ name: "Lissajous 3:8", ax: 3, by: 8, delta: 2.05, scaleX: 29, scaleY: 23, hue: 205 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Pearl", rMajor: 8, rMinor: 3, d: 5.5, scale: 2.55, inward: true, hue: 40 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Gear 9", rMajor: 9, rMinor: 2.5, d: 4.8, scale: 2.65, inward: true, hue: 55 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Ribbon 10", rMajor: 10, rMinor: 3.2, d: 6.2, scale: 2.25, inward: true, hue: 70 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Halo", rMajor: 6.5, rMinor: 2.4, d: 4.1, scale: 2.5, inward: false, hue: 25 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Crown 8", rMajor: 8, rMinor: 2.2, d: 5.2, scale: 2.15, inward: false, hue: 18 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Orbit 11", rMajor: 7.5, rMinor: 1.8, d: 4.8, scale: 2.2, inward: false, hue: 82 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Pillow", width: 27, height: 22, power: 4.8, hue: 160 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Tablet", width: 31, height: 18, power: 5.6, hue: 145 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Gem", width: 24, height: 24, power: 2.4, hue: 130 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Window", width: 29, height: 25, power: 6.2, hue: 118 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Orbit", width: 20, height: 30, power: 3.4, hue: 170 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Softbox", width: 32, height: 20, power: 7.0, hue: 155 }),
  createGeneratedRosePreset({ name: "Rose Crown 15", k: 15, radius: 20, pulse: 2.2, phase: 0.03, hue: 318 }),
  createGeneratedRosePreset({ name: "Rose Crown 16", k: 16, radius: 20, pulse: 2.6, phase: -0.02, hue: 328 }),
  createGeneratedRosePreset({ name: "Rose Prime 17", k: 17, radius: 19, pulse: 2.0, phase: 0.05, hue: 338 }),
  createGeneratedRosePreset({ name: "Rose Orbit 18", k: 18, radius: 19, pulse: 2.4, phase: -0.04, hue: 348 }),
  createGeneratedRosePreset({ name: "Rose Prime 19", k: 19, radius: 18, pulse: 2.1, phase: 0.02, hue: 6 }),
  createGeneratedRosePreset({ name: "Rose Lace 20", k: 20, radius: 18, pulse: 2.8, phase: -0.01, hue: 16 }),
  createGeneratedRosePreset({ name: "Rose Prime 23", k: 23, radius: 17, pulse: 1.8, phase: 0.04, hue: 26 }),
  createGeneratedRosePreset({ name: "Rose Halo 9", k: 9, radius: 24, pulse: 3.0, phase: 0.12, hue: 282 }),
  createGeneratedRosePreset({ name: "Rose Halo 10", k: 10, radius: 23, pulse: 3.1, phase: -0.10, hue: 272 }),
  createGeneratedRosePreset({ name: "Rose Halo 14", k: 14, radius: 21, pulse: 2.7, phase: 0.09, hue: 302 }),
  createGeneratedLissajousPreset({ name: "Lissajous 5:7", ax: 5, by: 7, delta: 0.94, scaleX: 27, scaleY: 25, hue: 188 }),
  createGeneratedLissajousPreset({ name: "Lissajous 6:7", ax: 6, by: 7, delta: 1.18, scaleX: 26, scaleY: 27, hue: 196 }),
  createGeneratedLissajousPreset({ name: "Lissajous 7:9", ax: 7, by: 9, delta: 0.72, scaleX: 25, scaleY: 28, hue: 204 }),
  createGeneratedLissajousPreset({ name: "Lissajous 8:9", ax: 8, by: 9, delta: 1.44, scaleX: 24, scaleY: 26, hue: 212 }),
  createGeneratedLissajousPreset({ name: "Lissajous 1:5", ax: 1, by: 5, delta: 1.57, scaleX: 33, scaleY: 22, hue: 220 }),
  createGeneratedLissajousPreset({ name: "Lissajous 2:9", ax: 2, by: 9, delta: 2.22, scaleX: 31, scaleY: 23, hue: 228 }),
  createGeneratedLissajousPreset({ name: "Lissajous 3:10", ax: 3, by: 10, delta: 0.63, scaleX: 29, scaleY: 24, hue: 236 }),
  createGeneratedLissajousPreset({ name: "Lissajous 4:11", ax: 4, by: 11, delta: 1.05, scaleX: 28, scaleY: 25, hue: 244 }),
  createGeneratedLissajousPreset({ name: "Lissajous 5:12", ax: 5, by: 12, delta: 1.88, scaleX: 27, scaleY: 26, hue: 252 }),
  createGeneratedLissajousPreset({ name: "Lissajous 6:13", ax: 6, by: 13, delta: 2.48, scaleX: 26, scaleY: 27, hue: 260 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Gear 12", rMajor: 12, rMinor: 3.5, d: 6.5, scale: 2.0, inward: true, hue: 88 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Lace 13", rMajor: 13, rMinor: 4.2, d: 7.1, scale: 1.8, inward: true, hue: 96 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Orbit 7", rMajor: 7, rMinor: 2.1, d: 4.9, scale: 2.8, inward: true, hue: 104 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Bloom 11", rMajor: 11, rMinor: 3.8, d: 5.8, scale: 2.05, inward: true, hue: 112 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Shell 14", rMajor: 14, rMinor: 4.6, d: 6.4, scale: 1.68, inward: true, hue: 120 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Signal 15", rMajor: 15, rMinor: 5.2, d: 7.2, scale: 1.52, inward: true, hue: 128 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Crown 10", rMajor: 10, rMinor: 2.6, d: 5.8, scale: 1.85, inward: false, hue: 34 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Halo 12", rMajor: 12, rMinor: 3.1, d: 6.4, scale: 1.55, inward: false, hue: 44 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Lantern 14", rMajor: 9.5, rMinor: 2.3, d: 5.1, scale: 1.95, inward: false, hue: 54 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Signal 16", rMajor: 8.5, rMinor: 1.9, d: 4.7, scale: 2.05, inward: false, hue: 64 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Stadium", width: 34, height: 16, power: 8.0, hue: 138 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Portal", width: 18, height: 34, power: 5.0, hue: 148 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Coin", width: 25, height: 25, power: 1.6, hue: 158 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Lens", width: 34, height: 14, power: 3.0, hue: 168 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Monolith", width: 17, height: 34, power: 7.2, hue: 178 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Rounded Square", width: 28, height: 28, power: 4.2, hue: 188 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Rounded Diamond", width: 23, height: 31, power: 2.1, hue: 198 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Capsule", width: 35, height: 18, power: 6.6, hue: 208 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Orbit Tall", width: 19, height: 32, power: 4.6, hue: 218 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Orbit Wide", width: 32, height: 19, power: 4.6, hue: 228 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Soft Gem", width: 26, height: 30, power: 2.8, hue: 238 }),
  createGeneratedSuperellipsePreset({ name: "Superellipse Glow Box", width: 30, height: 24, power: 6.8, hue: 248 }),
  createGeneratedSpiralPreset({ name: "Spiral Aurora 1", turns: 2.4, radius: 30, curve: 0.85, hue: 18 }),
  createGeneratedSpiralPreset({ name: "Spiral Aurora 2", turns: 3.1, radius: 31, curve: 1.05, hue: 28 }),
  createGeneratedSpiralPreset({ name: "Spiral Aurora 3", turns: 3.8, radius: 32, curve: 1.25, hue: 38 }),
  createGeneratedSpiralPreset({ name: "Spiral Aurora 4", turns: 4.5, radius: 29, curve: 1.45, hue: 48 }),
  createGeneratedSpiralPreset({ name: "Spiral Aurora 5", turns: 5.2, radius: 28, curve: 1.65, hue: 58 }),
  createGeneratedSpiralPreset({ name: "Spiral Aurora 6", turns: 5.9, radius: 27, curve: 1.85, hue: 68 }),
  createGeneratedSpiralPreset({ name: "Shell Spiral Pearl", turns: 2.6, radius: 32, curve: 1.1, shell: true, hue: 78 }),
  createGeneratedSpiralPreset({ name: "Shell Spiral Tide", turns: 3.2, radius: 34, curve: 1.2, shell: true, hue: 88 }),
  createGeneratedSpiralPreset({ name: "Shell Spiral Echo", turns: 3.8, radius: 33, curve: 1.35, shell: true, hue: 98 }),
  createGeneratedSpiralPreset({ name: "Shell Spiral Signal", turns: 4.4, radius: 31, curve: 1.5, shell: true, hue: 108 }),
  createGeneratedHeartPreset({ name: "Heart Ember", scale: 1.18, squeeze: 0.92, beat: 1.4, hue: 348 }),
  createGeneratedHeartPreset({ name: "Heart Velvet", scale: 1.12, squeeze: 1.05, beat: 1.2, hue: 332 }),
  createGeneratedHeartPreset({ name: "Heart Lantern", scale: 1.05, squeeze: 1.15, beat: 1.6, hue: 18 }),
  createGeneratedHeartPreset({ name: "Heart Pulse Soft", scale: 1.0, squeeze: 0.9, beat: 1.9, hue: 358 }),
  createGeneratedHeartPreset({ name: "Heart Orbit Warm", scale: 0.96, squeeze: 1.08, beat: 1.1, hue: 8 }),
  createGeneratedHeartPreset({ name: "Heart Flame", scale: 1.22, squeeze: 0.98, beat: 1.7, hue: 24 }),
  createGeneratedHeartPreset({ name: "Heart Neon", scale: 1.08, squeeze: 0.84, beat: 1.5, hue: 322 }),
  createGeneratedHeartPreset({ name: "Heart Signal", scale: 1.14, squeeze: 1.2, beat: 1.3, hue: 342 }),
  createGeneratedHeartPreset({ name: "Heart Bloom", scale: 1.0, squeeze: 1.0, beat: 2.0, hue: 352 }),
  createGeneratedHeartPreset({ name: "Heart Halo", scale: 0.92, squeeze: 1.12, beat: 1.45, hue: 2 }),
  createGeneratedFourierPreset({ name: "Fourier Braid 3-5", a: 3, b: 5, c: 4, d: 7, hue: 198 }),
  createGeneratedFourierPreset({ name: "Fourier Braid 4-7", a: 4, b: 7, c: 5, d: 9, hue: 208 }),
  createGeneratedFourierPreset({ name: "Fourier Braid 5-8", a: 5, b: 8, c: 3, d: 10, hue: 218 }),
  createGeneratedFourierPreset({ name: "Fourier Braid 6-11", a: 6, b: 11, c: 7, d: 4, hue: 228 }),
  createGeneratedFourierPreset({ name: "Fourier Braid 7-12", a: 7, b: 12, c: 5, d: 8, hue: 238 }),
  createGeneratedFourierPreset({ name: "Fourier Braid 8-13", a: 8, b: 13, c: 6, d: 11, hue: 248 }),
  createGeneratedFourierPreset({ name: "Fourier Orbit 2-9", a: 2, b: 9, c: 7, d: 5, hue: 258 }),
  createGeneratedFourierPreset({ name: "Fourier Orbit 3-10", a: 3, b: 10, c: 8, d: 6, hue: 268 }),
  createGeneratedFourierPreset({ name: "Fourier Orbit 4-11", a: 4, b: 11, c: 9, d: 7, hue: 278 }),
  createGeneratedFourierPreset({ name: "Fourier Orbit 5-12", a: 5, b: 12, c: 10, d: 8, hue: 288 }),
  createGeneratedPolarPreset({ name: "Polar Wave 5-8", petals: 5, wobble: 8, radius: 25, hue: 128 }),
  createGeneratedPolarPreset({ name: "Polar Wave 6-10", petals: 6, wobble: 10, radius: 24, hue: 138 }),
  createGeneratedPolarPreset({ name: "Polar Wave 7-11", petals: 7, wobble: 11, radius: 23, hue: 148 }),
  createGeneratedPolarPreset({ name: "Polar Wave 8-13", petals: 8, wobble: 13, radius: 22, hue: 158 }),
  createGeneratedPolarPreset({ name: "Polar Wave 9-14", petals: 9, wobble: 14, radius: 21, hue: 168 }),
  createGeneratedPolarPreset({ name: "Polar Wave 10-15", petals: 10, wobble: 15, radius: 20, hue: 178 }),
  createGeneratedPolarPreset({ name: "Polar Bloom 4-7", petals: 4, wobble: 7, radius: 27, hue: 188 }),
  createGeneratedPolarPreset({ name: "Polar Bloom 6-9", petals: 6, wobble: 9, radius: 26, hue: 198 }),
  createGeneratedPolarPreset({ name: "Polar Bloom 8-12", petals: 8, wobble: 12, radius: 25, hue: 208 }),
  createGeneratedPolarPreset({ name: "Polar Bloom 12-17", petals: 12, wobble: 17, radius: 20, hue: 218 }),
  createGeneratedSpiralPreset({ name: "Spiral Comet 7", turns: 6.6, radius: 28, curve: 1.15, hue: 118 }),
  createGeneratedSpiralPreset({ name: "Spiral Comet 8", turns: 7.2, radius: 27, curve: 1.3, hue: 128 }),
  createGeneratedSpiralPreset({ name: "Spiral Comet 9", turns: 7.8, radius: 26, curve: 1.45, hue: 138 }),
  createGeneratedHeartPreset({ name: "Heart Aurora", scale: 1.16, squeeze: 0.88, beat: 2.1, hue: 312 }),
  createGeneratedHeartPreset({ name: "Heart Crown", scale: 1.2, squeeze: 1.16, beat: 1.8, hue: 28 }),
  createGeneratedFourierPreset({ name: "Fourier Halo 6-7", a: 6, b: 7, c: 8, d: 9, hue: 298 }),
  createGeneratedFourierPreset({ name: "Fourier Halo 7-9", a: 7, b: 9, c: 10, d: 11, hue: 308 }),
  createGeneratedPolarPreset({ name: "Polar Halo 14-5", petals: 14, wobble: 5, radius: 19, hue: 228 }),
  createGeneratedPolarPreset({ name: "Polar Halo 16-7", petals: 16, wobble: 7, radius: 18, hue: 238 }),
  createGeneratedPolarPreset({ name: "Polar Halo 18-9", petals: 18, wobble: 9, radius: 17, hue: 248 }),
  createGeneratedRosePreset({ name: "Rose Zenith 29", k: 29, radius: 16, pulse: 1.7, phase: 0.02, hue: 32 }),
  createGeneratedRosePreset({ name: "Rose Zenith 31", k: 31, radius: 15.5, pulse: 1.6, phase: -0.02, hue: 42 }),
  createGeneratedRosePreset({ name: "Rose Zenith 37", k: 37, radius: 15, pulse: 1.4, phase: 0.01, hue: 52 }),
  createGeneratedRosePreset({ name: "Rose Zenith 41", k: 41, radius: 14.5, pulse: 1.3, phase: 0.03, hue: 62 }),
  createGeneratedRosePreset({ name: "Rose Zenith 43", k: 43, radius: 14, pulse: 1.2, phase: -0.01, hue: 72 }),
  createGeneratedRosePreset({ name: "Rose Zenith 47", k: 47, radius: 13.5, pulse: 1.1, phase: 0.04, hue: 82 }),
  createGeneratedRosePreset({ name: "Rose Lace 21", k: 21, radius: 17.5, pulse: 2.0, phase: -0.05, hue: 92 }),
  createGeneratedRosePreset({ name: "Rose Lace 22", k: 22, radius: 17.2, pulse: 2.1, phase: 0.06, hue: 102 }),
  createGeneratedRosePreset({ name: "Rose Lace 24", k: 24, radius: 17, pulse: 2.2, phase: -0.04, hue: 112 }),
  createGeneratedRosePreset({ name: "Rose Lace 25", k: 25, radius: 16.8, pulse: 2.0, phase: 0.05, hue: 122 }),
  createGeneratedLissajousPreset({ name: "Lissajous 8:15", ax: 8, by: 15, delta: 0.77, scaleX: 24, scaleY: 27, hue: 270 }),
  createGeneratedLissajousPreset({ name: "Lissajous 9:10", ax: 9, by: 10, delta: 1.21, scaleX: 24, scaleY: 24, hue: 280 }),
  createGeneratedLissajousPreset({ name: "Lissajous 9:14", ax: 9, by: 14, delta: 1.66, scaleX: 23, scaleY: 26, hue: 290 }),
  createGeneratedLissajousPreset({ name: "Lissajous 10:11", ax: 10, by: 11, delta: 0.41, scaleX: 22, scaleY: 25, hue: 300 }),
  createGeneratedLissajousPreset({ name: "Lissajous 10:13", ax: 10, by: 13, delta: 2.1, scaleX: 22, scaleY: 27, hue: 310 }),
  createGeneratedLissajousPreset({ name: "Lissajous 11:12", ax: 11, by: 12, delta: 1.03, scaleX: 21, scaleY: 24, hue: 320 }),
  createGeneratedLissajousPreset({ name: "Lissajous 11:16", ax: 11, by: 16, delta: 2.44, scaleX: 21, scaleY: 26, hue: 330 }),
  createGeneratedLissajousPreset({ name: "Lissajous 12:17", ax: 12, by: 17, delta: 1.71, scaleX: 20, scaleY: 25, hue: 340 }),
  createGeneratedLissajousPreset({ name: "Lissajous 13:18", ax: 13, by: 18, delta: 0.9, scaleX: 20, scaleY: 24, hue: 350 }),
  createGeneratedLissajousPreset({ name: "Lissajous 14:19", ax: 14, by: 19, delta: 1.38, scaleX: 19, scaleY: 24, hue: 0 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Zenith 16", rMajor: 16, rMinor: 5.4, d: 7.5, scale: 1.42, inward: true, hue: 132 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Zenith 17", rMajor: 17, rMinor: 5.8, d: 7.8, scale: 1.32, inward: true, hue: 142 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Zenith 18", rMajor: 18, rMinor: 6.0, d: 8.0, scale: 1.25, inward: true, hue: 152 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Mesh 19", rMajor: 19, rMinor: 6.2, d: 8.1, scale: 1.18, inward: true, hue: 162 }),
  createGeneratedSpiroPreset({ name: "Hypotrochoid Mesh 20", rMajor: 20, rMinor: 6.5, d: 8.4, scale: 1.1, inward: true, hue: 172 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Zenith 18", rMajor: 11, rMinor: 2.4, d: 5.6, scale: 1.72, inward: false, hue: 74 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Zenith 20", rMajor: 12, rMinor: 2.8, d: 6.0, scale: 1.55, inward: false, hue: 84 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Mesh 22", rMajor: 13, rMinor: 3.0, d: 6.4, scale: 1.42, inward: false, hue: 94 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Mesh 24", rMajor: 14, rMinor: 3.4, d: 6.8, scale: 1.28, inward: false, hue: 104 }),
  createGeneratedSpiroPreset({ name: "Epitrochoid Mesh 26", rMajor: 15, rMinor: 3.8, d: 7.2, scale: 1.18, inward: false, hue: 114 }),
  createGeneratedSpiralPreset({ name: "Spiral Galaxy 10", turns: 8.4, radius: 25, curve: 1.08, hue: 148 }),
  createGeneratedSpiralPreset({ name: "Spiral Galaxy 11", turns: 9.0, radius: 24, curve: 1.18, hue: 158 }),
  createGeneratedSpiralPreset({ name: "Spiral Galaxy 12", turns: 9.6, radius: 23, curve: 1.28, hue: 168 }),
  createGeneratedSpiralPreset({ name: "Shell Galaxy 5", turns: 5.0, radius: 30, curve: 1.55, shell: true, hue: 178 }),
  createGeneratedSpiralPreset({ name: "Shell Galaxy 6", turns: 5.6, radius: 29, curve: 1.7, shell: true, hue: 188 }),
  createGeneratedHeartPreset({ name: "Heart Zenith", scale: 1.24, squeeze: 1.0, beat: 2.2, hue: 338 }),
  createGeneratedHeartPreset({ name: "Heart Prism", scale: 1.1, squeeze: 0.78, beat: 2.25, hue: 318 }),
  createGeneratedHeartPreset({ name: "Heart Ribbon", scale: 1.18, squeeze: 1.26, beat: 1.95, hue: 22 }),
  createGeneratedHeartPreset({ name: "Heart Beacon", scale: 0.98, squeeze: 0.82, beat: 2.35, hue: 2 }),
  createGeneratedHeartPreset({ name: "Heart Resonance", scale: 1.06, squeeze: 1.18, beat: 2.0, hue: 12 }),
  createGeneratedFourierPreset({ name: "Fourier Zenith 9-14", a: 9, b: 14, c: 11, d: 6, hue: 318 }),
  createGeneratedFourierPreset({ name: "Fourier Zenith 10-15", a: 10, b: 15, c: 12, d: 7, hue: 328 }),
  createGeneratedFourierPreset({ name: "Fourier Zenith 11-16", a: 11, b: 16, c: 13, d: 8, hue: 338 }),
  createGeneratedFourierPreset({ name: "Fourier Mesh 12-17", a: 12, b: 17, c: 9, d: 14, hue: 348 }),
  createGeneratedFourierPreset({ name: "Fourier Mesh 13-18", a: 13, b: 18, c: 10, d: 15, hue: 358 }),
  createGeneratedPolarPreset({ name: "Polar Zenith 20-11", petals: 20, wobble: 11, radius: 16, hue: 258 }),
  createGeneratedPolarPreset({ name: "Polar Zenith 22-13", petals: 22, wobble: 13, radius: 15, hue: 268 }),
  createGeneratedPolarPreset({ name: "Polar Zenith 24-15", petals: 24, wobble: 15, radius: 14, hue: 278 }),
  createGeneratedPolarPreset({ name: "Polar Mesh 26-17", petals: 26, wobble: 17, radius: 13, hue: 288 }),
  createGeneratedPolarPreset({ name: "Polar Mesh 28-19", petals: 28, wobble: 19, radius: 12, hue: 298 }),
];

curves.push(...generatedCurvePresets);

function normalizeProgress(progress) {
  return ((progress % 1) + 1) % 1;
}

function createCard(config) {
  const article = document.createElement("article");
  article.className = "curve-card";
  article.dataset.category = getCurveCategory(config);
  article.tabIndex = 0;
  article.setAttribute("role", "button");

  article.innerHTML = `
    <div class="curve-frame"></div>
    <div class="curve-meta">
      <h2 class="curve-title">${config.name}</h2>
      <span class="curve-tag">${config.tag}</span>
      <span class="curve-category"></span>
    </div>
    <p class="curve-desc"></p>
  `;

  const frame = article.querySelector(".curve-frame");
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "curve-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");

  const group = document.createElementNS(SVG_NS, "g");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", String(config.strokeWidth));
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("opacity", "0.1");

  group.appendChild(path);
  svg.appendChild(group);
  frame.appendChild(svg);

  const particles = Array.from({ length: config.particleCount }, (_, index) => {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("fill", getParticleColor(config, index));
    group.appendChild(circle);
    return circle;
  });
  applyVisualStyle(group, path, config);

  return {
    article,
    config,
    group,
    path,
    particles,
    startTime: performance.now(),
    phaseOffset: Math.random(),
  };
}

function getDescription(config) {
  return currentLanguage === "zh" ? config.descriptionZh : config.descriptionEn;
}

function applyLanguage() {
  const ui = UI_TEXT[currentLanguage];
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  heroEyebrow.textContent = ui.heroEyebrow;
  heroTitle.textContent = ui.heroTitle;
  gallery.setAttribute("aria-label", ui.galleryLabel);
  categoryControls.setAttribute("aria-label", ui.categoryLabel);
  viewerControlsLabel.textContent = ui.controls;
  viewerFormulaLabel.textContent = ui.formula;
  viewerCodeLabel.textContent = ui.code;
  viewerDownload.textContent = ui.download;
  viewerReset.textContent = ui.reset;
  viewerCopy.textContent = ui.copy;
  viewerClose.textContent = ui.close;
  langEnButton.classList.toggle("is-active", currentLanguage === "en");
  langZhButton.classList.toggle("is-active", currentLanguage === "zh");

  instances.forEach((instance) => {
    const desc = instance.article.querySelector(".curve-desc");
    const category = instance.article.querySelector(".curve-category");
    if (desc) {
      desc.textContent = getDescription(instance.config);
    }
    if (category) {
      category.textContent = getCategoryLabel(instance.article.dataset.category);
    }
    instance.article.setAttribute(
      "aria-label",
      currentLanguage === "zh"
        ? `${ui.ariaOpen}${instance.config.name}`
        : `${ui.ariaOpen} ${instance.config.name}`
    );
  });

  updateCategoryControls();

  if (activeInstance) {
    viewerDesc.textContent = getDescription(activeInstance.config);
  }
}

function getCategoryCount(categoryId) {
  if (categoryId === "all") {
    return instances.length;
  }

  return instances.filter((instance) => instance.article.dataset.category === categoryId).length;
}

function updateCategoryControls() {
  categoryControls.querySelectorAll(".category-button").forEach((button) => {
    const categoryId = button.dataset.category;
    const count = getCategoryCount(categoryId);
    button.classList.toggle("is-active", categoryId === activeCategory);
    button.setAttribute("aria-pressed", String(categoryId === activeCategory));
    button.textContent = `${getCategoryLabel(categoryId)} (${count})`;
  });
}

function applyCategoryFilter() {
  instances.forEach((instance) => {
    const isVisible = activeCategory === "all" || instance.article.dataset.category === activeCategory;
    instance.article.hidden = !isVisible;
    instance.article.setAttribute("aria-hidden", String(!isVisible));
    instance.article.tabIndex = isVisible ? 0 : -1;
  });
  updateCategoryControls();
}

function createCategoryControls() {
  CATEGORIES.forEach((category) => {
    const button = document.createElement("button");
    button.className = "category-button";
    button.type = "button";
    button.dataset.category = category.id;
    button.addEventListener("click", () => {
      activeCategory = category.id;
      applyCategoryFilter();
    });
    categoryControls.appendChild(button);
  });
}

function buildPath(config, detailScale, steps = 480) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const point = config.point(index / steps, detailScale, config);
    return `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join(" ");
}

function getParticle(config, index, progress, detailScale) {
  const tailOffset = index / (config.particleCount - 1);
  const point = config.point(
    normalizeProgress(progress - tailOffset * config.trailSpan),
    detailScale,
    config
  );
  const fade = Math.pow(1 - tailOffset, 0.56);

  return {
    x: point.x,
    y: point.y,
    radius: 0.9 + fade * 2.7,
    opacity: 0.04 + fade * 0.96,
  };
}

function getDetailScale(time, config, phaseOffset) {
  const pulseProgress =
    ((time + phaseOffset * config.pulseDurationMs) % config.pulseDurationMs) /
    config.pulseDurationMs;
  const pulseAngle = pulseProgress * Math.PI * 2;
  return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
}

function getRotation(time, config, phaseOffset) {
  if (!config.rotate) {
    return 0;
  }

  return -(
    ((time + phaseOffset * config.rotationDurationMs) % config.rotationDurationMs) /
    config.rotationDurationMs
  ) * 360;
}

const instances = curves.map((config) => {
  const instance = createCard(config);
  gallery.appendChild(instance.article);
  return instance;
});

const viewerParticles = Array.from({ length: 120 }, () => {
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("fill", "currentColor");
  viewerGroup.appendChild(circle);
  return circle;
});

let activeInstance = null;
let activeViewerConfig = null;

function formatControlValue(key, value) {
  if (key.endsWith("Ms")) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  if (key === "hue" || key === "hueRange") {
    return `${Math.round(value)}°`;
  }
  if (key === "saturation" || key === "lightness") {
    return `${Math.round(value)}%`;
  }
  if (key === "glow") {
    return `${Number(value).toFixed(1)}px`;
  }

  if (
    key === "trailSpan" ||
    key === "strokeWidth" ||
    !Number.isInteger(value)
  ) {
    return Number(value).toFixed(2);
  }

  return `${Math.round(value)}`;
}

function createViewerConfig(config) {
  return {
    ...VISUAL_DEFAULTS,
    ...config,
    point: config.point,
    formula: config.formula,
  };
}

function renderControls(config) {
  viewerControls.innerHTML = "";

  const controls = [...CONTROL_DEFS, ...(config.controls ?? [])];

  controls.forEach((control) => {
    const wrap = document.createElement("label");
    wrap.className = "viewer-control";
    wrap.innerHTML = `
      <div class="viewer-control-head">
        <span class="viewer-control-label">${currentLanguage === "zh" ? control.labelZh : control.labelEn}</span>
        <span class="viewer-control-value" data-value-key="${control.key}">
          ${formatControlValue(control.key, config[control.key])}
        </span>
      </div>
      <input
        type="range"
        min="${control.min}"
        max="${control.max}"
        step="${control.step}"
        value="${config[control.key]}"
        data-key="${control.key}"
      />
    `;
    viewerControls.appendChild(wrap);
  });
}

function formatFormula(config) {
  if (typeof config.formula === "function") {
    return config.formula(config);
  }

  return config.formula;
}

function syncViewerMeta(config) {
  viewerFormula.textContent = formatFormula(config);
  viewerCode.textContent = formatCurveCode(config);
  viewerPath.setAttribute("stroke-width", String(config.strokeWidth));
  applyVisualStyle(viewerGroup, viewerPath, config);
  renderControls(config);
}

function serializeCurveValue(value) {
  return JSON.stringify(value);
}

function formatCurveRuntimeObject(config) {
  const formulaSource =
    typeof config.formula === "function"
      ? config.formula.toString()
      : `formula: () => ${serializeCurveValue(config.formula)}`;
  const pointSource = config.point.toString();
  const orderedKeys = [
    "name",
    "tag",
    "rotate",
    "particleCount",
    "trailSpan",
    "durationMs",
    "rotationDurationMs",
    "pulseDurationMs",
    "strokeWidth",
  ];
  const skipKeys = new Set([
    ...orderedKeys,
    "descriptionEn",
    "descriptionZh",
    "controls",
    "formula",
    "point",
  ]);
  const dynamicKeys = Object.keys(config).filter((key) => !skipKeys.has(key));
  const scalarKeys = [...orderedKeys, ...dynamicKeys].filter((key) => key in config);
  const scalarLines = scalarKeys.map((key) => `  ${key}: ${serializeCurveValue(config[key])},`);

  return [
    `const config = {`,
    ...scalarLines,
    typeof config.formula === "function"
      ? `  ${formulaSource},`
      : `  ${formulaSource},`,
    `  ${pointSource},`,
    `};`,
  ].join("\n");
}

function formatCurveCode(config) {
  const runtimeObject = formatCurveRuntimeObject(config);

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${config.name}</title>`,
    "  <style>",
    "    :root { color-scheme: dark; }",
    "    * { box-sizing: border-box; }",
    "    body {",
    "      margin: 0;",
    "      min-height: 100vh;",
    "      display: grid;",
    "      place-items: center;",
    "      background: #050505;",
    "      color: #f5f5f5;",
    "      font-family: Inter, system-ui, sans-serif;",
    "    }",
    "    .demo {",
    "      display: grid;",
    "      gap: 20px;",
    "      justify-items: center;",
    "      padding: 32px;",
    "    }",
    "    .frame {",
    "      width: min(72vmin, 420px);",
    "      aspect-ratio: 1;",
    "      display: grid;",
    "      place-items: center;",
    "    }",
    "    svg {",
    "      width: 100%;",
    "      height: 100%;",
    "      overflow: visible;",
    "    }",
    "    .meta {",
    "      display: grid;",
    "      gap: 6px;",
    "      text-align: center;",
    "    }",
    "    .title {",
    "      font-size: 22px;",
    "      font-weight: 700;",
    "    }",
    "    .tag {",
    "      font-size: 13px;",
    "      letter-spacing: 0.18em;",
    "      text-transform: uppercase;",
    "      color: rgba(255,255,255,0.58);",
    "    }",
    "    .formula {",
      "      max-width: min(92vw, 720px);",
      "      padding: 14px 16px;",
      "      border: 1px solid rgba(255,255,255,0.1);",
      "      border-radius: 14px;",
      "      background: rgba(255,255,255,0.03);",
      "      color: rgba(255,255,255,0.82);",
      "      font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;",
      "      white-space: pre-wrap;",
    "    }",
    "    .back-link {",
    "      display: inline-flex;",
    "      align-items: center;",
    "      justify-content: center;",
    "      padding: 10px 16px;",
    "      border-radius: 999px;",
    "      border: 1px solid rgba(255,255,255,0.14);",
    "      background: rgba(255,255,255,0.04);",
    "      color: #fff;",
    "      text-decoration: none;",
    "      font-size: 13px;",
    "      line-height: 1;",
    "      transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;",
    "    }",
    "    .back-link:hover {",
    "      background: rgba(255,255,255,0.08);",
    "      border-color: rgba(255,255,255,0.22);",
    "      transform: translateY(-1px);",
    "    }",
    "  </style>",
    "</head>",
    "<body>",
    '  <div class="demo">',
    '    <div class="frame">',
    '      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">',
    '        <g id="group">',
    '          <path id="path" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.1"></path>',
    "        </g>",
    "      </svg>",
    "    </div>",
    '    <div class="meta">',
    `      <div class="title">${config.name}</div>`,
    `      <div class="tag">${config.tag}</div>`,
    "    </div>",
    '    <pre class="formula" id="formula"></pre>',
    '    <a class="back-link" href="https://shtse8.github.io/math-curve-loaders/" target="_blank" rel="noreferrer">View All</a>',
    "  </div>",
    "  <script>",
    "    const SVG_NS = 'http://www.w3.org/2000/svg';",
    `    ${runtimeObject}`,
    "    const group = document.querySelector('#group');",
    "    const path = document.querySelector('#path');",
    "    const formula = document.querySelector('#formula');",
    "    path.setAttribute('stroke-width', String(config.strokeWidth));",
    "    formula.textContent = typeof config.formula === 'function' ? config.formula(config) : config.formula;",
    "    const particles = Array.from({ length: config.particleCount }, () => {",
    "      const circle = document.createElementNS(SVG_NS, 'circle');",
    "      circle.setAttribute('fill', 'currentColor');",
    "      group.appendChild(circle);",
    "      return circle;",
    "    });",
    "    function normalizeProgress(progress) {",
    "      return ((progress % 1) + 1) % 1;",
    "    }",
    "    function getVisualConfig() {",
    "      return { hue: config.hue ?? 210, hueRange: config.hueRange ?? 72, saturation: config.saturation ?? 92, lightness: config.lightness ?? 64, glow: config.glow ?? 5 };",
    "    }",
    "    function getHslColor(offset = 0, alpha = 1) {",
    "      const visual = getVisualConfig();",
    "      const hue = ((visual.hue + offset) % 360 + 360) % 360;",
    "      const alphaText = alpha >= 1 ? '' : ` / ${alpha.toFixed(3)}`;",
    "      return `hsl(${hue.toFixed(1)} ${visual.saturation.toFixed(1)}% ${visual.lightness.toFixed(1)}%${alphaText})`;",
    "    }",
    "    function getDetailScale(time) {",
    "      const pulseProgress = (time % config.pulseDurationMs) / config.pulseDurationMs;",
    "      const pulseAngle = pulseProgress * Math.PI * 2;",
    "      return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;",
    "    }",
    "    function getRotation(time) {",
    "      if (!config.rotate) return 0;",
    "      return -((time % config.rotationDurationMs) / config.rotationDurationMs) * 360;",
    "    }",
    "    function buildPath(detailScale, steps = 480) {",
    "      return Array.from({ length: steps + 1 }, (_, index) => {",
    "        const point = config.point(index / steps, detailScale, config);",
    "        return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;",
    "      }).join(' ');",
    "    }",
    "    function getParticle(index, progress, detailScale) {",
    "      const tailOffset = index / (config.particleCount - 1);",
    "      const point = config.point(normalizeProgress(progress - tailOffset * config.trailSpan), detailScale, config);",
    "      const fade = Math.pow(1 - tailOffset, 0.56);",
    "      return {",
    "        x: point.x,",
    "        y: point.y,",
    "        radius: 0.9 + fade * 2.7,",
    "        opacity: 0.04 + fade * 0.96,",
    "      };",
    "    }",
    "    const startedAt = performance.now();",
    "    function render(now) {",
    "      const time = now - startedAt;",
    "      const progress = (time % config.durationMs) / config.durationMs;",
    "      const detailScale = getDetailScale(time);",
    "      const visual = getVisualConfig();",
    "      group.setAttribute('transform', `rotate(${getRotation(time)} 50 50)`);",
    "      group.style.filter = visual.glow > 0 ? `drop-shadow(0 0 ${visual.glow.toFixed(1)}px ${getHslColor(visual.hueRange * 0.45, 0.52)})` : 'none';",
    "      path.setAttribute('stroke', getHslColor(visual.hueRange * 0.16));",
    "      path.setAttribute('d', buildPath(detailScale));",
    "      particles.forEach((node, index) => {",
    "        const particle = getParticle(index, progress, detailScale);",
    "        node.setAttribute('fill', getHslColor(visual.hueRange * (index / Math.max(1, config.particleCount - 1))));",
    "        node.setAttribute('cx', particle.x.toFixed(2));",
    "        node.setAttribute('cy', particle.y.toFixed(2));",
    "        node.setAttribute('r', particle.radius.toFixed(2));",
    "        node.setAttribute('opacity', particle.opacity.toFixed(3));",
    "      });",
    "      requestAnimationFrame(render);",
    "    }",
    "    requestAnimationFrame(render);",
    "  </script>",
    "</body>",
    "</html>",
  ].join("\n");
}

function setActiveInstance(instance) {
  activeInstance = instance;
  document.body.classList.add("modal-open");
  if (openAnimationFrame) {
    cancelAnimationFrame(openAnimationFrame);
    openAnimationFrame = 0;
  }
  const rect = instance.article.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const modalWidth = Math.min(1200, vw - 32);
  const modalHeight = Math.min(vh - 32, vw <= 640 ? vh - 24 : vh - 32);
  const targetLeft = (vw - modalWidth) / 2;
  const targetTop = (vh - modalHeight) / 2;
  const scaleX = Math.max(0.18, rect.width / modalWidth);
  const scaleY = Math.max(0.18, rect.height / modalHeight);
  viewer.style.setProperty("--viewer-translate-x", `${rect.left - targetLeft}px`);
  viewer.style.setProperty("--viewer-translate-y", `${rect.top - targetTop}px`);
  viewer.style.setProperty("--viewer-scale", `${Math.min(scaleX, scaleY)}`);
  viewerModal.classList.remove("is-open");
  viewerModal.classList.add("is-entering");
  viewerModal.setAttribute("aria-hidden", "false");
  viewerTitle.textContent = instance.config.name;
  viewerTag.textContent = instance.config.tag;
  viewerDesc.textContent = getDescription(instance.config);
  activeViewerConfig = createViewerConfig(instance.config);
  syncViewerMeta(activeViewerConfig);

  instances.forEach((item) => {
    item.article.classList.toggle("is-active", item === instance);
    item.article.setAttribute("aria-pressed", item === instance ? "true" : "false");
  });

  openAnimationFrame = requestAnimationFrame(() => {
    openAnimationFrame = requestAnimationFrame(() => {
      viewerModal.classList.add("is-open");
      viewerModal.classList.remove("is-entering");
      openAnimationFrame = 0;
    });
  });
}

function clearActiveInstance() {
  activeInstance = null;
  document.body.classList.remove("modal-open");
  if (openAnimationFrame) {
    cancelAnimationFrame(openAnimationFrame);
    openAnimationFrame = 0;
  }
  viewerModal.classList.remove("is-open");
  viewerModal.classList.remove("is-entering");
  viewerModal.setAttribute("aria-hidden", "true");
  instances.forEach((item) => {
    item.article.classList.remove("is-active");
    item.article.setAttribute("aria-pressed", "false");
  });
  viewerTitle.textContent = "";
  viewerTag.textContent = "";
  viewerDesc.textContent = "";
  viewerControls.innerHTML = "";
  viewerFormula.textContent = "";
  viewerCode.textContent = "";
  viewerPath.setAttribute("d", "");
  activeViewerConfig = null;
}

instances.forEach((instance) => {
  const open = () => setActiveInstance(instance);
  instance.article.addEventListener("click", open);
  instance.article.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
});

viewerClose.addEventListener("click", () => {
  clearActiveInstance();
});

viewerCopy.addEventListener("click", async () => {
  if (!activeInstance || !activeViewerConfig) {
    return;
  }

  const textToCopy = [
    `${activeViewerConfig.name}`,
    "",
    "Formula",
    formatFormula(activeViewerConfig),
    "",
    "Code",
    formatCurveCode(activeViewerConfig),
  ].join("\n");

  try {
    await navigator.clipboard.writeText(textToCopy);
      viewerCopy.textContent = UI_TEXT[currentLanguage].copied;
      window.setTimeout(() => {
      viewerCopy.textContent = UI_TEXT[currentLanguage].copy;
    }, 1400);
  } catch (_error) {
    viewerCopy.textContent = UI_TEXT[currentLanguage].copyFailed;
    window.setTimeout(() => {
      viewerCopy.textContent = UI_TEXT[currentLanguage].copy;
    }, 1400);
  }
});

viewerDownload.addEventListener("click", () => {
  if (!activeViewerConfig) {
    return;
  }

  try {
    const html = formatCurveCode(activeViewerConfig);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const slug = activeViewerConfig.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    anchor.href = url;
    anchor.download = `${slug || "curve-demo"}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    viewerDownload.textContent = UI_TEXT[currentLanguage].downloaded;
    window.setTimeout(() => {
      viewerDownload.textContent = UI_TEXT[currentLanguage].download;
    }, 1400);
  } catch (_error) {
    viewerDownload.textContent = UI_TEXT[currentLanguage].downloadFailed;
    window.setTimeout(() => {
      viewerDownload.textContent = UI_TEXT[currentLanguage].download;
    }, 1400);
  }
});

langEnButton.addEventListener("click", () => {
  currentLanguage = "en";
  applyLanguage();
  if (activeViewerConfig) {
    renderControls(activeViewerConfig);
  }
});

langZhButton.addEventListener("click", () => {
  currentLanguage = "zh";
  applyLanguage();
  if (activeViewerConfig) {
    renderControls(activeViewerConfig);
  }
});

viewerReset.addEventListener("click", () => {
  if (!activeInstance) {
    return;
  }

  activeViewerConfig = createViewerConfig(activeInstance.config);
  syncViewerMeta(activeViewerConfig);
});

viewerControls.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !activeViewerConfig) {
    return;
  }

  const { key } = target.dataset;
  if (!key) {
    return;
  }

  const nextValue = key === "particleCount"
    ? Math.round(Number(target.value))
    : Number(target.value);

  activeViewerConfig[key] = nextValue;

  const valueEl = viewerControls.querySelector(`[data-value-key="${key}"]`);
  if (valueEl) {
    valueEl.textContent = formatControlValue(key, nextValue);
  }

  viewerFormula.textContent = formatFormula(activeViewerConfig);
  viewerCode.textContent = formatCurveCode(activeViewerConfig);
  viewerPath.setAttribute("stroke-width", String(activeViewerConfig.strokeWidth));
});

viewerBackdrop.addEventListener("click", () => {
  clearActiveInstance();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeInstance) {
    clearActiveInstance();
  }
});

function renderInstance(instance, now) {
  if (instance.article.hidden) {
    return;
  }

  const time = now - instance.startTime;
  const { config, group, path, particles, phaseOffset } = instance;
  const progress =
    ((time + phaseOffset * config.durationMs) % config.durationMs) / config.durationMs;
  const detailScale = getDetailScale(time, config, phaseOffset);
  const rotation = getRotation(time, config, phaseOffset);

  group.setAttribute("transform", `rotate(${rotation} 50 50)`);
  applyVisualStyle(group, path, config);
  path.setAttribute("d", buildPath(config, detailScale));

  particles.forEach((node, index) => {
    const particle = getParticle(config, index, progress, detailScale);
    node.setAttribute("fill", getParticleColor(config, index));
    node.setAttribute("cx", particle.x.toFixed(2));
    node.setAttribute("cy", particle.y.toFixed(2));
    node.setAttribute("r", particle.radius.toFixed(2));
    node.setAttribute("opacity", particle.opacity.toFixed(3));
  });
}

function renderViewer(now) {
  if (!activeInstance) {
    return;
  }

  const time = now - activeInstance.startTime;
  const { phaseOffset } = activeInstance;
  const config = activeViewerConfig ?? activeInstance.config;
  const progress =
    ((time + phaseOffset * config.durationMs) % config.durationMs) / config.durationMs;
  const detailScale = getDetailScale(time, config, phaseOffset);
  const rotation = getRotation(time, config, phaseOffset);

  viewerGroup.setAttribute("transform", `rotate(${rotation} 50 50)`);
  applyVisualStyle(viewerGroup, viewerPath, config);
  viewerPath.setAttribute("d", buildPath(config, detailScale));

  viewerParticles.forEach((node, index) => {
    if (index >= config.particleCount) {
      node.setAttribute("opacity", "0");
      return;
    }

    const particle = getParticle(config, index, progress, detailScale);
    node.setAttribute("fill", getParticleColor(config, index));
    node.setAttribute("cx", particle.x.toFixed(2));
    node.setAttribute("cy", particle.y.toFixed(2));
    node.setAttribute("r", (particle.radius * 1.35).toFixed(2));
    node.setAttribute("opacity", Math.min(1, particle.opacity + 0.04).toFixed(3));
  });
}

function tick(now) {
  instances.forEach((instance) => renderInstance(instance, now));
  renderViewer(now);
  window.requestAnimationFrame(tick);
}

createCategoryControls();
applyCategoryFilter();
instances.forEach((instance) => renderInstance(instance, performance.now()));
applyLanguage();
window.requestAnimationFrame(tick);
