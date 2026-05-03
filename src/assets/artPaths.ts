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
  sheet: "/art/apostle/tutorial-guide-apostle-sprite.svg",
  frameCount: 4,
  motions: {
    idle: [0, 1],
    guidePoint: [2, 3],
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
