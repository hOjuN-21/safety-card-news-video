/**
 * sample-data.js
 * Pre-built Safety Card News Templates with SVG Image Generators
 */

const SampleSafetyTemplates = {
  // 1. 밀폐공간 질식재해 예방 3대 안전수칙
  confinedSpace: {
    title: "밀폐공간 3대 안전수칙",
    cards: [
      {
        title: "밀폐공간 질식재해 예방 3대 안전수칙",
        script: "밀폐공간 작업 시 질식재해를 예방하기 위한 3대 핵심 안전수칙을 안내합니다.",
        bgGradient: ["#0f172a", "#1e293b"],
        accentColor: "#ef4444",
        badge: "사내 안전보건 핵심 공지",
        icon: "⚠️",
        headline: "밀폐공간 질식재해 예방",
        subline: "생명을 지키는 3대 필수 안전수칙 준수"
      },
      {
        title: "수칙 1. 산소 및 유해가스 농도 측정",
        script: "첫째, 작업 전 반드시 산소 및 유해가스 농도를 측정하고 적정 공기 상태를 확인해야 합니다.",
        bgGradient: ["#091e3a", "#102a45"],
        accentColor: "#38bdf8",
        badge: "안전수칙 제1원칙",
        icon: "💨",
        headline: "작업 전 유해가스 측정",
        subline: "산소농도 18% 이상 23.5% 미만 유지 필수"
      },
      {
        title: "수칙 2. 작업 전 및 작업 중 지속적 환기",
        script: "둘째, 작업 시작 전은 물론 작업 중에도 송풍기를 가동하여 지속적으로 환기를 실시합니다.",
        bgGradient: ["#064e3b", "#065f46"],
        accentColor: "#34d399",
        badge: "안전수칙 제2원칙",
        icon: "🔄",
        headline: "지속적인 강제 환기",
        subline: "급기 및 배기 송풍기 상시 가동 확인"
      },
      {
        title: "수칙 3. 공기호흡기 착용 및 감시인 배치",
        script: "셋째, 비상 시 송기마스크를 착용하고 외부 감시인과 비상연락체계를 유지하십시오.",
        bgGradient: ["#78350f", "#854d0e"],
        accentColor: "#fbbf24",
        badge: "안전수칙 제3원칙",
        icon: "🦺",
        headline: "보호구 착용 & 감시인 배치",
        subline: "외부 감시인 상주 및 비상 연락망 상시 대기"
      },
      {
        title: "안전은 생명입니다",
        script: "안전수칙 준수는 나와 동료의 생명을 지킵니다. 오늘도 안전작업 하십시오.",
        bgGradient: ["#0f172a", "#164e63"],
        accentColor: "#22d3ee",
        badge: "안전 최우선 실천",
        icon: "🛡️",
        headline: "오늘도 안전제일!",
        subline: "작업 전 안전점검, 생명을 지키는 기본입니다."
      }
    ]
  },

  // 2. 추락재해 예방 안전대 착용 수칙
  fallProtection: {
    title: "고소작업 추락재해 예방 수칙",
    cards: [
      {
        title: "고소작업 추락재해 근절",
        script: "2미터 이상 고소작업 시 추락사고 예방을 위한 핵심 안전 가이드입니다.",
        bgGradient: ["#1e1b4b", "#312e81"],
        accentColor: "#a855f7",
        badge: "중대재해 예방 핵심수칙",
        icon: "🧗",
        headline: "고소작업 추락재해 예방",
        subline: "높은 곳 작업 시 반드시 지켜야 할 철칙"
      },
      {
        title: "1. 안전모 및 안전대(그네식) 착용",
        script: "작업 전 안전모 턱끈을 조이고, 전신 그네식 안전대를 바르게 착용합니다.",
        bgGradient: ["#1e293b", "#334155"],
        accentColor: "#f59e0b",
        badge: "보호구 점검",
        icon: "🪖",
        headline: "안전모 & 안전대 착용",
        subline: "안전모 턱끈 결속 및 전신 그네식 안전대 밀착"
      },
      {
        title: "2. 안전대 부착설비 체결 철저",
        script: "안전고리는 반드시 견고한 로프나 구조물에 정확히 체결하고 이동해야 합니다.",
        bgGradient: ["#831843", "#9d174d"],
        accentColor: "#f43f5e",
        badge: "체결 필수",
        icon: "🔗",
        headline: "안전고리 100% 체결",
        subline: "추락방지대 및 수평구명줄에 반드시 걸고 이동"
      }
    ]
  }
};

/**
 * Generate a high-resolution SVG Card image data URL
 */
function createSvgCardDataUrl(cardData, width = 1080, height = 1080) {
  const g1 = cardData.bgGradient ? cardData.bgGradient[0] : '#0f172a';
  const g2 = cardData.bgGradient ? cardData.bgGradient[1] : '#1e293b';
  const accent = cardData.accentColor || '#22c55e';
  const badge = cardData.badge || 'SAFETY FIRST';
  const icon = cardData.icon || '🛡️';
  const headline = cardData.headline || cardData.title;
  const subline = cardData.subline || '';

  const svgString = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${g1}" />
        <stop offset="100%" stop-color="${g2}" />
      </linearGradient>
      <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0.2" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#cardBg)" />
    <rect width="${width}" height="${height}" fill="url(#grid)" />

    <!-- Corner Ambient Glow -->
    <circle cx="${width * 0.85}" cy="${height * 0.15}" r="260" fill="${accent}" opacity="0.15" filter="blur(60px)" />
    <circle cx="${width * 0.15}" cy="${height * 0.85}" r="220" fill="${accent}" opacity="0.08" filter="blur(50px)" />

    <!-- Outer Border Frame -->
    <rect x="36" y="36" width="${width - 72}" height="${height - 72}" rx="28" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3" />

    <!-- Header Badge -->
    <g transform="translate(80, 90)">
      <rect x="0" y="0" width="${badge.length * 20 + 70}" height="46" rx="23" fill="${accent}" opacity="0.15" stroke="${accent}" stroke-width="2" />
      <circle cx="24" cy="23" r="6" fill="${accent}" />
      <text x="42" y="29" fill="${accent}" font-family="Pretendard, 'Noto Sans KR', sans-serif" font-size="20" font-weight="700" letter-spacing="1">${badge}</text>
    </g>

    <!-- Main Graphic Icon Box -->
    <g transform="translate(${width / 2 - 110}, ${height * 0.28})">
      <rect x="0" y="0" width="220" height="220" rx="40" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
      <text x="110" y="145" text-anchor="middle" font-size="96">${icon}</text>
    </g>

    <!-- Accent Divider Line -->
    <rect x="120" y="${height * 0.58}" width="${width - 240}" height="4" rx="2" fill="url(#accentLine)" />

    <!-- Main Headline -->
    <text x="${width / 2}" y="${height * 0.68}" text-anchor="middle" fill="#ffffff" font-family="Pretendard, 'Noto Sans KR', sans-serif" font-size="52" font-weight="800" letter-spacing="-1">
      ${headline}
    </text>

    <!-- Subtitle / Explanation -->
    <text x="${width / 2}" y="${height * 0.76}" text-anchor="middle" fill="#94a3b8" font-family="Pretendard, 'Noto Sans KR', sans-serif" font-size="28" font-weight="500">
      ${subline}
    </text>

    <!-- Bottom Watermark / Company Safety Brand -->
    <g transform="translate(${width / 2 - 130}, ${height - 90})">
      <rect x="0" y="0" width="260" height="34" rx="17" fill="rgba(0,0,0,0.3)" />
      <text x="130" y="22" text-anchor="middle" fill="#64748b" font-family="Pretendard, sans-serif" font-size="14" font-weight="600" letter-spacing="2">
        SAFETY FIRST • 사내 안전보건
      </text>
    </g>
  </svg>
  `;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}
