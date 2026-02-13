"use client";

import { useEffect, useLayoutEffect, useRef, useState, type JSX } from "react";
import { toPng } from "html-to-image";

/* ════════════════════════════════════════════════════════════════════
 * CONSTANTS
 * ════════════════════════════════════════════════════════════════════ */

const AW = 1080;
const AH = 1920;
const FGW = 1024;
const FGH = 500;

const ANDROID_SIZES = [{ label: "Phone", w: 1080, h: 1920 }] as const;
const FG_SIZES = [{ label: "Feature Graphic", w: 1024, h: 500 }] as const;

type Device = "android" | "feature-graphic";

/* ════════════════════════════════════════════════════════════════════
 * BRAND TOKENS
 * ════════════════════════════════════════════════════════════════════ */

const C = {
  cream: "#FAF8F5",
  creamDeep: "#F2EDE4",
  lavender50: "#F5F3FA",
  lavender100: "#EDE9F6",
  lavender200: "#D8D1EC",
  lavender300: "#B8AEDD",
  lavender400: "#A99BD4",
  lavender500: "#8B7EBD",
  lavender700: "#6B5E9E",
  lavender800: "#4A4072",
  lavender900: "#2D2840",
  sage300: "#A8C8BB",
  sage500: "#7EAD9B",
  blush200: "#F9DDD6",
  blush300: "#F4C5BA",
  blush500: "#C9847B",
  amber: "#F0C97A",
  text: "#2D2840",
  textSub: "#6F6A82",
};

/* ════════════════════════════════════════════════════════════════════
 * LOCALES + COPY
 * ════════════════════════════════════════════════════════════════════ */

const LOCALES = ["ko", "en"] as const;
type Locale = (typeof LOCALES)[number];

type Copy = {
  fgTitle: string;
  fgTagline: string;
  slides: { label: string; headline: JSX.Element }[];
};

const COPY: Record<Locale, Copy> = {
  ko: {
    fgTitle: "DearMI",
    fgTagline: "마음을 돌보는 매일의 기록",
    slides: [
      {
        label: "디어마이",
        headline: (
          <>
            마음을 돌보는
            <br />
            매일의 기록.
          </>
        ),
      },
      {
        label: "진료 기록",
        headline: (
          <>
            그날 못한 말,
            <br />
            다음 진료에 꺼내요.
          </>
        ),
      },
      {
        label: "감정 추이",
        headline: (
          <>
            오늘의 나,
            <br />
            한눈에 보여요.
          </>
        ),
      },
      {
        label: "AI 처방전 인식",
        headline: (
          <>
            사진 한 장으로
            <br />
            복약까지 자동.
          </>
        ),
      },
      {
        label: "복약 알림",
        headline: (
          <>
            약 먹을 시간,
            <br />
            놓치지 않아요.
          </>
        ),
      },
      {
        label: "상담 준비 메모",
        headline: (
          <>
            하고 싶은 말,
            <br />
            미리 정리해요.
          </>
        ),
      },
    ],
  },
  en: {
    fgTitle: "DearMI",
    fgTagline: "Mental care, every day.",
    slides: [
      {
        label: "DEARMI",
        headline: (
          <>
            A gentle home
            <br />
            for your mind.
          </>
        ),
      },
      {
        label: "VISIT NOTES",
        headline: (
          <>
            Say what you
            <br />
            couldn&apos;t say.
          </>
        ),
      },
      {
        label: "MOOD TREND",
        headline: (
          <>
            See your mood
            <br />
            at a glance.
          </>
        ),
      },
      {
        label: "AI PRESCRIPTION",
        headline: (
          <>
            One photo,
            <br />
            your pill plan.
          </>
        ),
      },
      {
        label: "REMINDERS",
        headline: (
          <>
            Never miss
            <br />
            your meds.
          </>
        ),
      },
      {
        label: "PREP NOTES",
        headline: (
          <>
            Walk in
            <br />
            prepared.
          </>
        ),
      },
    ],
  },
};

const SLIDE_IDS = [
  "hero",
  "record",
  "emotion",
  "ocr",
  "medication",
  "prepnote",
] as const;

const SCREENSHOT_FILES = [
  "01-home.png",
  "02-record.png",
  "03-emotion.png",
  "04-ocr.png",
  "05-medication.png",
  "06-prepnote.png",
];

/* ════════════════════════════════════════════════════════════════════
 * IMAGE PRELOAD — convert to data URIs for html-to-image reliability
 * ════════════════════════════════════════════════════════════════════ */

const IMAGE_PATHS: string[] = [
  "/app-icon.png",
  "/adaptive-icon.png",
  ...LOCALES.flatMap((loc) =>
    SCREENSHOT_FILES.map((f) => `/screenshots/${loc}/${f}`),
  ),
];

const imageCache: Record<string, string> = {};

async function preloadAllImages() {
  await Promise.all(
    IMAGE_PATHS.map(async (path) => {
      try {
        const resp = await fetch(path);
        if (!resp.ok) return;
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        imageCache[path] = dataUrl;
      } catch {
        /* best-effort */
      }
    }),
  );
}

function img(path: string): string {
  return imageCache[path] || path;
}

/* ════════════════════════════════════════════════════════════════════
 * ANDROID PHONE FRAME
 * ════════════════════════════════════════════════════════════════════ */

function AndroidPhone({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "relative", aspectRatio: "9/19.5", ...style }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8% / 4%",
          background: "linear-gradient(160deg, #2a2a2e 0%, #18181b 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px rgba(45, 40, 64, 0.32), 0 8px 32px rgba(45, 40, 64, 0.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "1.5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "3%",
            height: "1.4%",
            borderRadius: "50%",
            background: "#0d0d0f",
            border: "1px solid rgba(255,255,255,0.06)",
            zIndex: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "3.5%",
            top: "2%",
            width: "93%",
            height: "96%",
            borderRadius: "5.5% / 2.6%",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * DECORATIVE PRIMITIVES
 * ════════════════════════════════════════════════════════════════════ */

function Blob({
  cW,
  top,
  left,
  right,
  bottom,
  size,
  color,
  opacity = 0.55,
  blur = 60,
}: {
  cW: number;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  size: number;
  color: string;
  opacity?: number;
  blur?: number;
}) {
  const px = cW * size;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        width: px,
        height: px,
        borderRadius: "50%",
        background: color,
        filter: `blur(${blur}px)`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
 * CAPTION
 * ════════════════════════════════════════════════════════════════════ */

function Caption({
  cW,
  label,
  headline,
  textColor = C.text,
  labelColor = C.lavender500,
  top,
}: {
  cW: number;
  label: string;
  headline: JSX.Element;
  textColor?: string;
  labelColor?: string;
  top?: string | number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: top ?? cW * 0.09,
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        width: `${cW * 0.9}px`,
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontSize: cW * 0.03,
          fontWeight: 600,
          color: labelColor,
          letterSpacing: cW * 0.003,
          textTransform: "uppercase",
          marginBottom: cW * 0.028,
        }}
      >
        {label}
      </div>
      <h2
        style={{
          fontSize: cW * 0.092,
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.12,
          letterSpacing: -cW * 0.0015,
          margin: 0,
        }}
      >
        {headline}
      </h2>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * SLIDES
 * ════════════════════════════════════════════════════════════════════ */

type SlideArgs = { cW: number; cH: number; locale: Locale };

const screenshotSrc = (locale: Locale, index: number) =>
  img(`/screenshots/${locale}/${SCREENSHOT_FILES[index]}`);

function Slide1Hero({ cW, locale }: SlideArgs) {
  const copy = COPY[locale].slides[0];
  const phoneW = cW * 0.78;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(170deg, ${C.cream} 0%, ${C.lavender100} 65%, ${C.lavender200} 100%)`,
      }}
    >
      <Blob cW={cW} size={0.85} top={-cW * 0.25} left={-cW * 0.25} color={C.blush200} opacity={0.6} blur={80} />
      <Blob cW={cW} size={0.7} bottom={-cW * 0.2} right={-cW * 0.2} color={C.lavender300} opacity={0.35} blur={100} />

      <div
        style={{
          position: "absolute",
          top: cW * 0.08,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: cW * 0.02,
          zIndex: 6,
        }}
      >
        <img
          src={img("/app-icon.png")}
          alt=""
          style={{
            width: cW * 0.085,
            height: cW * 0.085,
            borderRadius: cW * 0.02,
            boxShadow: `0 6px 18px ${C.lavender500}33`,
          }}
          draggable={false}
        />
        <span
          style={{
            fontSize: cW * 0.038,
            fontWeight: 700,
            color: C.lavender800,
            letterSpacing: -cW * 0.0005,
          }}
        >
          DearMI
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: cW * 0.22,
          left: 0,
          width: "100%",
          textAlign: "center",
          zIndex: 5,
        }}
      >
        <h1
          style={{
            fontSize: cW * 0.1,
            fontWeight: 700,
            color: C.lavender900,
            lineHeight: 1.1,
            letterSpacing: -cW * 0.002,
            margin: 0,
          }}
        >
          {copy.headline}
        </h1>
        <p
          style={{
            marginTop: cW * 0.03,
            fontSize: cW * 0.034,
            fontWeight: 500,
            color: C.textSub,
            letterSpacing: -cW * 0.0008,
          }}
        >
          {locale === "ko"
            ? "정신건강의학과·심리상담을 위한 하루 돌봄 앱"
            : "A daily companion for therapy & psychiatry"}
        </p>
      </div>

      <AndroidPhone
        src={screenshotSrc(locale, 0)}
        alt="Home"
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: phoneW,
          transform: "translateX(-50%) translateY(32%)",
        }}
      />
    </div>
  );
}

function Slide2Record({ cW, locale }: SlideArgs) {
  const copy = COPY[locale].slides[1];
  const phoneW = cW * 0.74;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(165deg, ${C.lavender50} 0%, ${C.cream} 100%)`,
      }}
    >
      <Blob cW={cW} size={0.7} top={-cW * 0.2} right={-cW * 0.25} color={C.lavender200} opacity={0.5} blur={90} />

      <Caption cW={cW} label={copy.label} headline={copy.headline} />

      <AndroidPhone
        src={screenshotSrc(locale, 1)}
        alt="Record"
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: phoneW,
          transform: "translateX(-50%) translateY(18%) rotate(-2deg)",
        }}
      />
    </div>
  );
}

function Slide3Emotion({ cW, locale }: SlideArgs) {
  const copy = COPY[locale].slides[2];
  const phoneW = cW * 0.72;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(155deg, #F3F6F2 0%, ${C.cream} 60%, ${C.lavender50} 100%)`,
      }}
    >
      <Blob cW={cW} size={0.6} top={-cW * 0.1} left={-cW * 0.2} color={C.sage300} opacity={0.35} blur={100} />
      <Blob cW={cW} size={0.5} top={cW * 0.35} right={-cW * 0.15} color="#F7E3B3" opacity={0.35} blur={90} />

      <Caption
        cW={cW}
        label={copy.label}
        headline={copy.headline}
        labelColor={C.sage500}
      />

      <div
        style={{
          position: "absolute",
          top: cW * 0.56,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: cW * 0.018,
          zIndex: 6,
        }}
      >
        {[
          { n: "4", bg: C.amber, label: locale === "ko" ? "힘듦" : "Low" },
          { n: "7", bg: C.sage500, label: locale === "ko" ? "좋음" : "Good" },
          { n: "9", bg: C.sage500, label: locale === "ko" ? "매우 좋음" : "Great" },
        ].map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: cW * 0.012,
              padding: `${cW * 0.012}px ${cW * 0.022}px ${cW * 0.012}px ${cW * 0.012}px`,
              background: "#fff",
              borderRadius: cW * 0.05,
              boxShadow: `0 8px 22px ${C.lavender500}1E`,
            }}
          >
            <span
              style={{
                width: cW * 0.04,
                height: cW * 0.04,
                borderRadius: "50%",
                background: e.bg,
                color: "#fff",
                fontSize: cW * 0.022,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {e.n}
            </span>
            <span
              style={{
                fontSize: cW * 0.022,
                fontWeight: 600,
                color: C.text,
              }}
            >
              {e.label}
            </span>
          </div>
        ))}
      </div>

      <AndroidPhone
        src={screenshotSrc(locale, 2)}
        alt="Emotion"
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: phoneW,
          transform: "translateX(-50%) translateY(22%)",
        }}
      />
    </div>
  );
}

function Slide4Ocr({ cW, locale }: SlideArgs) {
  const copy = COPY[locale].slides[3];
  const phoneW = cW * 0.74;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(160deg, ${C.lavender900} 0%, ${C.lavender800} 60%, ${C.lavender700} 100%)`,
      }}
    >
      <Blob cW={cW} size={0.7} top={-cW * 0.2} right={-cW * 0.3} color={C.lavender500} opacity={0.45} blur={90} />
      <Blob cW={cW} size={0.55} bottom={-cW * 0.2} left={-cW * 0.2} color={C.blush500} opacity={0.25} blur={100} />

      <Caption
        cW={cW}
        label={copy.label}
        headline={copy.headline}
        textColor="#FFFFFF"
        labelColor={C.lavender300}
      />

      <div
        style={{
          position: "absolute",
          top: cW * 0.56,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: cW * 0.012,
          padding: `${cW * 0.014}px ${cW * 0.024}px`,
          background: "rgba(255,255,255,0.12)",
          border: `1px solid rgba(255,255,255,0.18)`,
          borderRadius: cW * 0.05,
          zIndex: 6,
        }}
      >
        <span
          style={{
            width: cW * 0.018,
            height: cW * 0.018,
            borderRadius: "50%",
            background: C.sage500,
          }}
        />
        <span
          style={{
            fontSize: cW * 0.024,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: cW * 0.0015,
          }}
        >
          {locale === "ko" ? "자동 분석 완료" : "AUTO-ANALYZED"}
        </span>
      </div>

      <AndroidPhone
        src={screenshotSrc(locale, 3)}
        alt="OCR"
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: phoneW,
          transform: "translateX(-50%) translateY(20%)",
        }}
      />
    </div>
  );
}

function Slide5Medication({ cW, locale }: SlideArgs) {
  const copy = COPY[locale].slides[4];
  const phoneW = cW * 0.74;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(165deg, #FBF0EA 0%, ${C.cream} 70%)`,
      }}
    >
      <Blob cW={cW} size={0.6} top={-cW * 0.15} left={-cW * 0.2} color={C.blush300} opacity={0.5} blur={85} />
      <Blob cW={cW} size={0.5} bottom={-cW * 0.15} right={-cW * 0.15} color={C.lavender200} opacity={0.5} blur={90} />

      <Caption
        cW={cW}
        label={copy.label}
        headline={copy.headline}
        labelColor={C.blush500}
      />

      <div
        style={{
          position: "absolute",
          top: cW * 0.54,
          right: cW * 0.04,
          display: "flex",
          alignItems: "center",
          gap: cW * 0.014,
          padding: `${cW * 0.016}px ${cW * 0.024}px`,
          background: "#fff",
          borderRadius: cW * 0.04,
          boxShadow: `0 14px 34px ${C.lavender500}22`,
          zIndex: 6,
          transform: "rotate(3deg)",
        }}
      >
        <div
          style={{
            width: cW * 0.04,
            height: cW * 0.04,
            borderRadius: "50%",
            background: C.lavender500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: cW * 0.022,
            fontWeight: 700,
          }}
        >
          ✓
        </div>
        <div>
          <div style={{ fontSize: cW * 0.022, fontWeight: 700, color: C.text }}>
            {locale === "ko" ? "08:00 아침 약" : "8:00 AM meds"}
          </div>
          <div
            style={{
              fontSize: cW * 0.018,
              fontWeight: 500,
              color: C.textSub,
              marginTop: cW * 0.004,
            }}
          >
            {locale === "ko" ? "오늘 잊지 말아요" : "Don’t forget today"}
          </div>
        </div>
      </div>

      <AndroidPhone
        src={screenshotSrc(locale, 4)}
        alt="Medication"
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: phoneW,
          transform: "translateX(-50%) translateY(20%) rotate(2deg)",
        }}
      />
    </div>
  );
}

function Slide6Prepnote({ cW, locale }: SlideArgs) {
  const copy = COPY[locale].slides[5];
  const phoneW = cW * 0.74;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(170deg, ${C.lavender100} 0%, ${C.cream} 55%, ${C.blush200} 100%)`,
      }}
    >
      <Blob cW={cW} size={0.65} top={-cW * 0.2} right={-cW * 0.2} color={C.lavender300} opacity={0.4} blur={100} />

      <Caption cW={cW} label={copy.label} headline={copy.headline} />

      <div
        style={{
          position: "absolute",
          top: cW * 0.54,
          left: cW * 0.05,
          padding: `${cW * 0.024}px ${cW * 0.028}px`,
          background: "#fff",
          borderRadius: cW * 0.032,
          boxShadow: `0 14px 30px ${C.lavender500}22`,
          zIndex: 6,
          transform: "rotate(-3deg)",
          maxWidth: cW * 0.42,
        }}
      >
        <div
          style={{
            fontSize: cW * 0.02,
            fontWeight: 600,
            color: C.lavender500,
            letterSpacing: cW * 0.0015,
            textTransform: "uppercase",
            marginBottom: cW * 0.01,
          }}
        >
          MEMO
        </div>
        <div
          style={{
            fontSize: cW * 0.026,
            fontWeight: 600,
            color: C.text,
            lineHeight: 1.4,
          }}
        >
          {locale === "ko"
            ? "요즘 잠이 잘 안 와요. 약 바꿔볼 수 있을까요?"
            : "Trouble sleeping lately. Can we adjust meds?"}
        </div>
      </div>

      <AndroidPhone
        src={screenshotSrc(locale, 5)}
        alt="Prep note"
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: phoneW,
          transform: "translateX(-50%) translateY(20%)",
        }}
      />
    </div>
  );
}

const SLIDE_COMPONENTS = [
  Slide1Hero,
  Slide2Record,
  Slide3Emotion,
  Slide4Ocr,
  Slide5Medication,
  Slide6Prepnote,
];

/* ════════════════════════════════════════════════════════════════════
 * FEATURE GRAPHIC
 * ════════════════════════════════════════════════════════════════════ */

function FeatureGraphicSlide({ cW, cH, locale }: SlideArgs) {
  const copy = COPY[locale];

  const features =
    locale === "ko"
      ? ["진료 일정 및 준비", "진료 기록", "감정 추이", "처방전 인식", "복약 관리"]
      : ["Visits & Prep", "Visit Notes", "Mood Trend", "Rx Scan", "Meds"];

  const dotGridSize = Math.round(cH * 0.06);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(120deg, ${C.lavender900} 0%, ${C.lavender800} 42%, ${C.lavender500} 100%)`,
      }}
    >
      {/* Soft color blobs */}
      <Blob cW={cW} size={0.45} top={-cH * 0.5} left={cW * 0.38} color={C.blush500} opacity={0.3} blur={70} />
      <Blob cW={cW} size={0.42} bottom={-cH * 0.7} right={-cW * 0.04} color={C.lavender300} opacity={0.5} blur={60} />
      <Blob cW={cW} size={0.32} top={-cH * 0.35} left={-cW * 0.05} color={C.lavender500} opacity={0.4} blur={70} />

      {/* Subtle dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.10) 1.2px, transparent 1.2px)",
          backgroundSize: `${dotGridSize}px ${dotGridSize}px`,
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      {/* ═══ LEFT BLOCK — icon + brand + tagline + bullet row ═══ */}
      <div
        style={{
          position: "absolute",
          left: cW * 0.045,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: cW * 0.015,
          maxWidth: cW * 0.65,
        }}
      >
        {/* Brand icon (transparent PNG, logo fills more of its canvas) */}
        <div
          style={{
            width: cH * 0.6,
            height: cH * 0.6,
            flexShrink: 0,
            filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.35))",
          }}
        >
          <img
            src={img("/app-icon.png")}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            draggable={false}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: cH * 0.12,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: -cH * 0.003,
            }}
          >
            {copy.fgTitle}
          </div>
          <div
            style={{
              marginTop: cH * 0.028,
              fontSize: cH * 0.05,
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.25,
              whiteSpace: "nowrap",
            }}
          >
            {copy.fgTagline}
          </div>
          <div
            style={{
              marginTop: cH * 0.04,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              columnGap: cH * 0.028,
              rowGap: cH * 0.02,
              fontSize: cH * 0.036,
              fontWeight: 600,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            {features.map((f, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: cH * 0.016,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: cH * 0.014,
                    height: cH * 0.014,
                    borderRadius: "50%",
                    background: [
                      C.blush300,
                      C.lavender300,
                      C.sage300,
                      C.lavender400,
                      "#F0C97A",
                    ][i % 5],
                  }}
                />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — single floating "today" card ═══ */}
      <div
        style={{
          position: "absolute",
          right: cW * 0.045,
          top: "50%",
          transform: "translateY(-50%) rotate(-3deg)",
          padding: `${cH * 0.04}px ${cH * 0.05}px`,
          background: "#fff",
          borderRadius: cH * 0.05,
          boxShadow: "0 20px 40px rgba(0,0,0,0.32)",
          display: "flex",
          alignItems: "center",
          gap: cH * 0.036,
          zIndex: 6,
        }}
      >
        <div
          style={{
            width: cH * 0.13,
            height: cH * 0.13,
            borderRadius: "50%",
            background: C.sage500,
            color: "#fff",
            fontSize: cH * 0.074,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          9
        </div>
        <div>
          <div
            style={{
              fontSize: cH * 0.024,
              fontWeight: 600,
              color: C.lavender500,
              letterSpacing: cH * 0.002,
              textTransform: "uppercase",
              marginBottom: cH * 0.01,
            }}
          >
            {locale === "ko" ? "오늘의 감정" : "TODAY"}
          </div>
          <div
            style={{
              fontSize: cH * 0.054,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1,
            }}
          >
            {locale === "ko" ? "매우 좋음" : "Great mood"}
          </div>
          <div
            style={{
              marginTop: cH * 0.014,
              fontSize: cH * 0.028,
              fontWeight: 500,
              color: C.textSub,
            }}
          >
            {locale === "ko" ? "수면 7시간 · 복약 완료" : "Slept 7h · Meds done"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * SCREENSHOT PREVIEW
 * ════════════════════════════════════════════════════════════════════ */

function ScreenshotPreview({
  cW,
  cH,
  children,
  exportRef,
}: {
  cW: number;
  cH: number;
  children: React.ReactNode;
  exportRef: (el: HTMLDivElement | null) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.2);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / cW);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cW]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        aspectRatio: `${cW} / ${cH}`,
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 6px 22px rgba(45, 40, 64, 0.12)",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: cW,
          height: cH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>

      <div
        ref={exportRef}
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: cW,
          height: cH,
          pointerEvents: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * EXPORT
 * ════════════════════════════════════════════════════════════════════ */

async function captureSlide(el: HTMLElement, w: number, h: number) {
  el.style.left = "0px";
  el.style.opacity = "1";
  el.style.zIndex = "-1";

  const opts = { width: w, height: h, pixelRatio: 1, cacheBust: true };
  await toPng(el, opts);
  const dataUrl = await toPng(el, opts);

  el.style.left = "-9999px";
  el.style.opacity = "";
  el.style.zIndex = "";
  return dataUrl;
}

/* ════════════════════════════════════════════════════════════════════
 * PAGE
 * ════════════════════════════════════════════════════════════════════ */

export default function ScreenshotsPage() {
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<Device>("android");
  const [locale, setLocale] = useState<Locale>("ko");
  const [exporting, setExporting] = useState<string | null>(null);

  const phoneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    preloadAllImages().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <main style={{ padding: 40, fontSize: 14, color: "#6b7280" }}>
        Loading images…
      </main>
    );
  }

  const isFG = device === "feature-graphic";
  const currentSize = isFG ? FG_SIZES[0] : ANDROID_SIZES[0];

  const exportAll = async () => {
    try {
      if (isFG) {
        setExporting("1/1");
        const el = fgRef.current;
        if (!el) return;
        const dataUrl = await captureSlide(el, FGW, FGH);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `feature-graphic-${locale}-${FGW}x${FGH}.png`;
        a.click();
      } else {
        for (let i = 0; i < SLIDE_COMPONENTS.length; i++) {
          setExporting(`${i + 1}/${SLIDE_COMPONENTS.length}`);
          const el = phoneRefs.current[i];
          if (!el) continue;
          const dataUrl = await captureSlide(el, AW, AH);
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${String(i + 1).padStart(2, "0")}-${SLIDE_IDS[i]}-${locale}-${AW}x${AH}.png`;
          a.click();
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } finally {
      setExporting(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            overflowX: "auto",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              whiteSpace: "nowrap",
              color: C.lavender800,
            }}
          >
            DearMI · Google Play
          </span>

          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            style={{
              fontSize: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "5px 10px",
            }}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>

          <div
            style={{
              display: "flex",
              gap: 4,
              background: "#f3f4f6",
              borderRadius: 8,
              padding: 4,
              flexShrink: 0,
            }}
          >
            {(["android", "feature-graphic"] as Device[]).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                style={{
                  padding: "4px 14px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  background: device === d ? "white" : "transparent",
                  color: device === d ? "#2563eb" : "#6b7280",
                }}
              >
                {d === "android" ? "Phone (6)" : "Feature Graphic"}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
            {currentSize.label} · {currentSize.w}×{currentSize.h}
          </span>
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: "10px 16px",
            borderLeft: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={exportAll}
            disabled={!!exporting}
            style={{
              padding: "7px 20px",
              background: exporting ? "#93c5fd" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: exporting ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {exporting ? `Exporting… ${exporting}` : "Export All"}
          </button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {!isFG ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 20,
              maxWidth: 1400,
              margin: "0 auto",
            }}
          >
            {SLIDE_COMPONENTS.map((Slide, i) => (
              <div key={i}>
                <ScreenshotPreview
                  cW={AW}
                  cH={AH}
                  exportRef={(el) => {
                    phoneRefs.current[i] = el;
                  }}
                >
                  <Slide cW={AW} cH={AH} locale={locale} />
                </ScreenshotPreview>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  {String(i + 1).padStart(2, "0")} · {SLIDE_IDS[i]}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <ScreenshotPreview
              cW={FGW}
              cH={FGH}
              exportRef={(el) => {
                fgRef.current = el;
              }}
            >
              <FeatureGraphicSlide cW={FGW} cH={FGH} locale={locale} />
            </ScreenshotPreview>
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              Feature Graphic · {FGW}×{FGH}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
