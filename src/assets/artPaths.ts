export const RYO_PORTRAITS = {
  normal: "/art/portraits/ryo/ryo_normal.jpeg",
  tense: "/art/portraits/ryo/ryo_tense.jpeg",
  sadness: "/art/portraits/ryo/ryo_sadness.jpeg",
  joy: "/art/portraits/ryo/ryo_joy.jpeg",
  divine: "/art/portraits/ryo/ryo_divine.jpeg",
} as const;

export const RYO_ILLUSTRATIONS = {
  watch: "/art/illustrations/ryo/ryo_watch.jpeg",
  bless: "/art/illustrations/ryo/ryo_bless.jpeg",
  test: "/art/illustrations/ryo/ryo_test.jpeg",
} as const;

export const APOSTLE_GUIDE_SPRITE = {
  sheet: "/art/apostle/tutorial-guide-apostle-sheet.png",
  cellWidth: 181,
  cellHeight: 181,
  columns: 6,
  rows: 8,
  motions: {
    idle: [
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 2, row: 0 },
      { column: 3, row: 0 },
      { column: 4, row: 0 },
      { column: 5, row: 0 },
    ],
    guidePoint: [
      { column: 0, row: 5 },
      { column: 1, row: 5 },
      { column: 2, row: 5 },
      { column: 3, row: 5 },
      { column: 4, row: 5 },
      { column: 5, row: 5 },
    ],
    run: [
      { column: 0, row: 1 },
      { column: 1, row: 1 },
      { column: 2, row: 1 },
      { column: 3, row: 1 },
      { column: 4, row: 1 },
      { column: 5, row: 1 },
    ],
    fly: [
      { column: 0, row: 2 },
      { column: 1, row: 2 },
      { column: 2, row: 2 },
      { column: 3, row: 2 },
      { column: 4, row: 2 },
      { column: 5, row: 2 },
    ],
    walk: [
      { column: 0, row: 3 },
      { column: 1, row: 3 },
      { column: 2, row: 3 },
      { column: 3, row: 3 },
      { column: 4, row: 3 },
      { column: 5, row: 3 },
    ],
    fall: [
      { column: 0, row: 4 },
      { column: 1, row: 4 },
      { column: 2, row: 4 },
      { column: 3, row: 4 },
      { column: 4, row: 4 },
      { column: 5, row: 4 },
    ],
    joy: [
      { column: 0, row: 6 },
      { column: 4, row: 6 },
      { column: 5, row: 6 },
    ],
    angry: [{ column: 1, row: 6 }],
    sad: [{ column: 2, row: 6 }],
    surprise: [{ column: 3, row: 6 }],
    ritual: [
      { column: 0, row: 7 },
      { column: 1, row: 7 },
      { column: 2, row: 7 },
      { column: 3, row: 7 },
      { column: 4, row: 7 },
      { column: 5, row: 7 },
    ],
  },
} as const;

export const WORLD_BACKGROUNDS = {
  spring: {
    morning: "/art/world/backgrounds/spring-morning.png",
    noon: "/art/world/backgrounds/spring-noon.png",
    evening: "/art/world/backgrounds/spring-evening.png",
    night: "/art/world/backgrounds/spring-night.png",
  },
  summer: {
    morning: "/art/world/backgrounds/summer-morning.png",
    noon: "/art/world/backgrounds/summer-noon.png",
    evening: "/art/world/backgrounds/summer-evening.png",
    night: "/art/world/backgrounds/summer-night.png",
  },
  autumn: {
    morning: "/art/world/backgrounds/autumn-morning.png",
    noon: "/art/world/backgrounds/autumn-noon.png",
    evening: "/art/world/backgrounds/autumn-evening.png",
    night: "/art/world/backgrounds/autumn-night.png",
  },
  winter: {
    morning: "/art/world/backgrounds/winter-morning.png",
    noon: "/art/world/backgrounds/winter-noon.png",
    evening: "/art/world/backgrounds/winter-evening.png",
    night: "/art/world/backgrounds/winter-night.png",
  },
} as const;
