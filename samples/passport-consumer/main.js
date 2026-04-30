const fallbackPassport = {
  schemaVersion: 'character-passport/v1',
  characterId: 'ryo-sample-001',
  name: 'Ryo',
  originGame: 'god-sandbox-mvp',
  element: 'wood',
  combatClass: 'healer',
  baseAttributes: {
    vision: 4,
    power: 2,
    guard: 3,
    discipline: 3,
    flow: 5,
  },
  faith: {
    value: 58,
    obedienceBias: 'adaptive',
    commandInterpretation: 'contextual',
    hazardResponse: 'guarded',
    autonomyAlignment: 'balanced',
    trustBand: 'steady',
    sources: {
      blessings: 2,
      trials: 1,
      chaosExposure: 1,
    },
  },
  growth: {
    blessings: { wood: 1, fire: 0, earth: 0, metal: 0, water: 1 },
    trials: { wood: 0, fire: 0, earth: 1, metal: 0, water: 0 },
    chaosExposure: { wood: 1, fire: 0, earth: 0, metal: 0, water: 0 },
  },
  skills: [
    {
      kind: 'skill',
      id: 'forest-first-aid',
      name: 'Forest First Aid',
      element: 'water',
      skillType: 'heal',
      description: '森で覚えた手当てで、近くの仲間を落ち着かせる。',
      targetPattern: 'adjacent',
      range: 1,
      powerPerTile: 1,
      secondaryEffect: {
        type: 'buff',
        key: 'flowing',
        value: 1,
        duration: 1,
        target: 'ally',
      },
    },
  ],
  abilities: [
    {
      kind: 'ability',
      id: 'listens-before-acting',
      name: 'Listens Before Acting',
      source: 'blessing',
      element: 'wood',
      abilityType: 'passive',
      description: '急いで決めず、周囲の様子を見てから動く。',
      trigger: {
        type: 'onTurnStart',
      },
      effects: [
        {
          type: 'buff',
          key: 'growth',
          value: 1,
          duration: 1,
          target: 'self',
        },
      ],
    },
  ],
};

const elementLabels = {
  wood: '森の気配',
  fire: '熱い意志',
  earth: '落ち着き',
  metal: '規律',
  water: '流れ',
};

const classLabels = {
  ranger: '案内役',
  mage: '術を使う人',
  guardian: '守る人',
  knight: '境界を守る人',
  healer: '手当てをする人',
};

const trustLabels = {
  dismissive: '神の声をほとんど信じていない',
  wary: '少し疑いながら聞いている',
  steady: '落ち着いて受け取っている',
  trusting: 'かなり信頼している',
  devoted: '強く信じている',
};

const portraitByCharacterId = {
  'ryo-sample-001': '../../public/art/portraits/ryo/ryo_normal.jpeg',
};

const app = document.querySelector('#app');
const status = document.querySelector('#status');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadPassport() {
  try {
    const response = await fetch('./sample-passport.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    status.textContent = 'sample-passport.json を読み込みました。';
    return response.json();
  } catch (error) {
    status.textContent =
      'ブラウザの制限でJSONを直接読めなかったため、同じ内容の予備データを表示しています。実際のJSON読み込みは README のローカルサーバー手順で確認できます。';
    status.classList.add('status--warn');
    return fallbackPassport;
  }
}

function makeSummary(passport) {
  const name = passport.name ?? 'Unknown';
  const element = elementLabels[passport.element] ?? passport.element ?? '未設定の属性';
  const role = classLabels[passport.combatClass] ?? passport.combatClass ?? '役割未定';
  const trust = trustLabels[passport.faith?.trustBand] ?? '神への向き合い方はまだ分からない';

  return `${name} は ${element} を感じさせるキャラクターです。このサンプルでは、別ゲーム側で「${role}」として読み替えています。神の声は、${trust}状態です。`;
}

function makeTags(passport) {
  const tags = [
    passport.element ? `属性: ${elementLabels[passport.element] ?? passport.element}` : null,
    passport.combatClass ? `使い方例: ${classLabels[passport.combatClass] ?? passport.combatClass}` : null,
    passport.faith?.trustBand ? `信頼: ${trustLabels[passport.faith.trustBand] ?? passport.faith.trustBand}` : null,
  ];

  if (passport.growth?.chaosExposure) {
    const chaosTotal = Object.values(passport.growth.chaosExposure).reduce((sum, value) => sum + Number(value ?? 0), 0);
    tags.push(`カオス経験: ${chaosTotal}`);
  }

  return tags.filter(Boolean);
}

function renderPortrait(passport) {
  const src = portraitByCharacterId[passport.characterId];

  if (!src) {
    return `<div class="portrait-fallback">${escapeHtml((passport.name ?? '?').slice(0, 1))}</div>`;
  }

  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(passport.name ?? 'Character')} portrait" onerror="this.replaceWith(Object.assign(document.createElement('div'), { className: 'portrait-fallback', textContent: '${escapeHtml((passport.name ?? '?').slice(0, 1))}' }))" />`;
}

function render(passport) {
  const skill = passport.skills?.[0];
  const ability = passport.abilities?.[0];
  const tags = makeTags(passport);

  app.innerHTML = `
    <div class="portrait">
      ${renderPortrait(passport)}
    </div>
    <div class="content">
      <div>
        <p class="eyebrow">${escapeHtml(passport.schemaVersion ?? 'unknown schema')}</p>
        <h1>${escapeHtml(passport.name ?? 'Unknown')}</h1>
      </div>
      <p class="summary">${escapeHtml(makeSummary(passport))}</p>
      <div class="tags">
        ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="grid">
        <div class="note">
          <strong>consumerが読んだ項目</strong>
          <p>この画面は、主に name / characterId / element / combatClass / faith.trustBand だけを使っています。</p>
        </div>
        <div class="note">
          <strong>使わなかった項目</strong>
          <p>baseAttributes や growth の多くは無視しています。別ゲーム側は、不要な項目をスキップできます。</p>
        </div>
        <div class="note">
          <strong>Skill の例</strong>
          <p>${escapeHtml(skill ? `${skill.name}: ${skill.description}` : 'このconsumerではSkillを使っていません。')}</p>
        </div>
        <div class="note">
          <strong>Ability の例</strong>
          <p>${escapeHtml(ability ? `${ability.name}: ${ability.description}` : 'このconsumerではAbilityを使っていません。')}</p>
        </div>
      </div>
    </div>
  `;
}

const passport = await loadPassport();
render(passport);
