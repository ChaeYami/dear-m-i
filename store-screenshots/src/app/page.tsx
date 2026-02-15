"use client";

import React, { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";

// ─── Canvas & export sizes ────────────────────────────────────────────────────
const W = 1320;
const H = 2868;
const FGW = 1024;
const FGH = 500;

const IPHONE_SIZES = [
  { label: '6.9"', w: 1320, h: 2868 },
  { label: '6.5"', w: 1284, h: 2778 },
  { label: '6.3"', w: 1206, h: 2622 },
  { label: '6.1"', w: 1125, h: 2436 },
] as const;

const FG_SIZE = { label: "Feature Graphic", w: 1024, h: 500 };

// ─── Mockup measurements (iPhone 14, 487×985, RGBA transparent) ──────────────
const MK_W = 487;
const MK_H = 985;
const SC_L  = (27  / MK_W) * 100;   // 5.54%
const SC_T  = (64  / MK_H) * 100;   // 6.5% — below notch, status bar area left empty
const SC_W  = (433 / MK_W) * 100;   // 88.9%
const SC_H  = (915 / MK_H) * 100;   // 92.9%
const SC_RX = (55  / 433)  * 100;   // ~12.7% — iPhone 14 corner radius
const SC_RY = (55  / 952)  * 100;   // ~5.8%
const MK_RATIO = MK_W / MK_H;

// ─── Brand colors ─────────────────────────────────────────────────────────────
const C = {
  lav50:  "#F5F3FA",
  lav100: "#EDE9F6",
  lav200: "#D8D1EC",
  lav300: "#B8AEDD",
  lav500: "#8B7EBD",
  lav700: "#6B5E9E",
  lav900: "#2D2840",
  blush100: "#FDF5F2",
  blush300: "#F4C5BA",
  blush400: "#E8A99D",
  accent:      "#C9847B",
  accentMuted: "#FAEAE5",
  sage300: "#A8C8BB",
  sage500: "#7EAD9B",
  bg:    "#FAF8F5",
  white: "#FFFFFF",
};

// ─── Image preload ────────────────────────────────────────────────────────────
const IMAGE_PATHS = [
  "/mockup.png",
  "/app-icon.png",
  "/icon-logo.png",
  "/screenshots/ko/daily-memo.png",
  "/screenshots/ko/mood.png",
  "/screenshots/ko/schedule.png",
  "/screenshots/ko/record.png",
  "/screenshots/ko/prep-note.png",
  "/screenshots/ko/medication-today.png",
  "/screenshots/ko/medication-history.png",
  "/screenshots/ko/prescription-list.png",
  "/screenshots/ko/ocr-result.png",
  "/iPhone 15 Pro.png",
];

const imageCache: Record<string, string> = {};

async function preloadAllImages() {
  await Promise.all(IMAGE_PATHS.map(async (path) => {
    try {
      const resp = await fetch(path);
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      imageCache[path] = dataUrl;
    } catch { console.warn("Preload failed:", path); }
  }));
}

function img(path: string): string { return imageCache[path] || path; }

// ─── Width formula ────────────────────────────────────────────────────────────
// Natural limit for 6.9" canvas: 0.72 * (2868/1320) * 0.491 ≈ 0.769
// clamp pushes it higher to fill more of the canvas
function phoneW(cW: number, cH: number, clamp = 0.88): number {
  return Math.min(clamp, 0.90 * (cH / cW) * MK_RATIO);
}

// ─── Phone frame ─────────────────────────────────────────────────────────────
// New mockup is RGBA transparent — screenshot sits behind, frame overlays on top.
// Top notch area is left as-is; the frame hardware covers it naturally.
function Phone({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "relative", aspectRatio: `${MK_W}/${MK_H}`, ...style }}>
      {/* Full screen background fill — covers entire screen area incl. status bar */}
      <div style={{ position: "absolute", left: `${SC_L}%`, top: "2.74%", width: `${SC_W}%`, height: "96.65%", background: "#FAF8F5", borderRadius: `${SC_RX}% / ${SC_RY}%` }} />
      {/* Screenshot behind the frame */}
      <div style={{ position: "absolute", left: `${SC_L}%`, top: `${SC_T}%`, width: `${SC_W}%`, height: `${SC_H}%`, overflow: "hidden" }}>
        <img src={src} alt={alt} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} draggable={false} />
      </div>
      {/* Transparent frame on top */}
      <img src={img("/mockup.png")} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block" }} draggable={false} />
    </div>
  );
}

// ─── Caption ──────────────────────────────────────────────────────────────────
// Always anchored to top-left (or top-right for right-aligned slides), zIndex 2
function Caption({ cW, label, headline, color = C.lav900, labelColor = C.lav500, align = "left" }: {
  cW: number; label: string; headline: React.ReactNode;
  color?: string; labelColor?: string; align?: "left" | "right";
}) {
  return (
    <div style={{ textAlign: align, position: "relative", zIndex: 2 }}>
      <div style={{ fontSize: cW * 0.026, fontWeight: 600, letterSpacing: "0.14em", color: labelColor, marginBottom: cW * 0.020, fontFamily: "'SUIT', sans-serif", textTransform: "uppercase" as const }}>
        {label}
      </div>
      <div style={{ fontSize: cW * 0.094, fontWeight: 800, lineHeight: 1.08, color, fontFamily: "'SUIT', sans-serif", wordBreak: "keep-all" as const }}>
        {headline}
      </div>
    </div>
  );
}

// ─── Blob ─────────────────────────────────────────────────────────────────────
function Blob({ x, y, size, color, opacity = 0.28 }: { x: string; y: string; size: number; color: string; opacity?: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color, opacity, filter: `blur(${size * 0.38}px)`, pointerEvents: "none", transform: "translate(-50%, -50%)" }} />
  );
}

// ─── App icon (rounded square) ────────────────────────────────────────────────
function AppIcon({ size }: { size: number }) {
  return (
    <img src={img("/app-icon.png")} alt="DearMI" style={{ width: size, height: size, borderRadius: size * 0.22, display: "block", flexShrink: 0 }} draggable={false} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Portrait Slides
//
// Key layout rule:
//   • Caption: position absolute, top "5%", left/right padding
//   • Phone: position absolute, top "20%"  ← phone starts right under caption
//     The bottom of the phone may extend past canvas (OK) or stop above canvas
//     bottom with background showing (also OK per user).
//   • For hero slide: icon at top, caption after icon, phone at "28%"
// ─────────────────────────────────────────────────────────────────────────────

function Slide1({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(165deg, ${C.lav50} 0%, ${C.bg} 50%, #EDE8DF 100%)` }}>
      <Blob x="88%" y="-5%" size={cW * 1.0} color={C.lav300} opacity={0.20} />
      <Blob x="-8%" y="80%" size={cW * 0.75} color={C.blush300} opacity={0.22} />

      {/* App icon top-left */}
      <div style={{ position: "absolute", top: cH * 0.05, left: pad, zIndex: 2 }}>
        <AppIcon size={cW * 0.10} />
      </div>

      {/* Caption below icon */}
      <div style={{ position: "absolute", top: cH * 0.05 + cW * 0.10 + cH * 0.025, left: pad, right: pad }}>
        <Caption cW={cW} label="DEAR MI" headline={<>나의 마음 건강,<br />매일 기록하다</>} color={C.lav900} labelColor={C.lav500} align="left" />
      </div>

      <Phone src={img("/screenshots/ko/daily-memo.png")} alt="하루 메모"
        style={{ position: "absolute", top: "31%", width: `${fw}%`, left: "50%", transform: "translateX(-50%)" }} />
    </div>
  );
}

function Slide2({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(155deg, #2D2840 0%, #3D3460 55%, #2D2840 100%)` }}>
      <Blob x="88%" y="5%"  size={cW * 0.90} color={C.lav700} opacity={0.28} />
      <Blob x="10%" y="85%" size={cW * 0.70} color={C.accent} opacity={0.16} />

      <div style={{ position: "absolute", top: "5%", left: pad, right: pad }}>
        <Caption cW={cW} label="감정 기록" headline={<>오늘 기분이<br />어떠세요?</>} color={C.white} labelColor={C.blush300} align="left" />
      </div>

      <Phone src={img("/screenshots/ko/mood.png")} alt="오늘의 기분"
        style={{ position: "absolute", top: "23%", width: `${fw}%`, left: "50%", transform: "translateX(-50%)" }} />
    </div>
  );
}

function Slide3({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(155deg, ${C.lav50} 0%, ${C.lav100} 55%, ${C.bg} 100%)` }}>
      <Blob x="10%" y="16%" size={cW * 0.75} color={C.lav300} opacity={0.24} />
      <Blob x="82%" y="70%" size={cW * 0.55} color={C.sage300} opacity={0.20} />

      <div style={{ position: "absolute", top: "5%", left: pad, right: pad }}>
        <Caption cW={cW} label="진료 관리" headline={<>다음 진료일을<br />놓치지 마세요</>} color={C.lav900} labelColor={C.lav500} align="left" />
      </div>

      <Phone src={img("/screenshots/ko/schedule.png")} alt="진료 일정"
        style={{ position: "absolute", top: "23%", width: `${fw}%`, right: "-6%" }} />
    </div>
  );
}

function Slide4({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(160deg, #1A1525 0%, #2D2840 60%, #1A1525 100%)` }}>
      <Blob x="18%" y="12%" size={cW * 0.72} color={C.lav700} opacity={0.26} />
      <Blob x="85%" y="78%" size={cW * 0.58} color={C.sage500} opacity={0.13} />

      <div style={{ position: "absolute", top: "5%", left: pad, right: pad, zIndex: 2 }}>
        <Caption cW={cW} label="진료 기록" headline={<>진료실의 이야기를<br />오래 기억하세요</>} color={C.white} labelColor={C.sage300} align="right" />
      </div>

      <Phone src={img("/screenshots/ko/record.png")} alt="진료 기록"
        style={{ position: "absolute", top: "23%", width: `${fw}%`, left: "-6%" }} />
    </div>
  );
}

function Slide5({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(165deg, ${C.blush100} 0%, ${C.accentMuted} 55%, #FAF0EC 100%)` }}>
      <Blob x="82%" y="-4%" size={cW * 0.82} color={C.blush400} opacity={0.18} />
      <Blob x="5%"  y="74%" size={cW * 0.62} color={C.lav300}  opacity={0.20} />

      <div style={{ position: "absolute", top: "5%", left: pad, right: pad }}>
        <Caption cW={cW} label="진료 준비" headline={<>하고 싶은 말,<br />미리 적어두세요</>} color={C.lav900} labelColor={C.accent} align="left" />
      </div>

      <Phone src={img("/screenshots/ko/prep-note.png")} alt="진료 준비 메모"
        style={{ position: "absolute", top: "23%", width: `${fw}%`, left: "50%", transform: "translateX(-50%)" }} />
    </div>
  );
}

function Slide6({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(155deg, #EEF7F2 0%, #E0EEE8 55%, ${C.bg} 100%)` }}>
      <Blob x="86%" y="6%"  size={cW * 0.76} color={C.sage300} opacity={0.26} />
      <Blob x="10%" y="80%" size={cW * 0.56} color={C.lav300}  opacity={0.20} />

      <div style={{ position: "absolute", top: "5%", left: pad, right: pad }}>
        <Caption cW={cW} label="복약 관리" headline={<>오늘 약,<br />빠짐없이 챙겨요</>} color={C.lav900} labelColor={C.sage500} align="left" />
      </div>

      <Phone src={img("/screenshots/ko/medication-today.png")} alt="오늘 복약 일정"
        style={{ position: "absolute", top: "23%", width: `${fw}%`, right: "-6%" }} />
    </div>
  );
}

function Slide7({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(165deg, ${C.bg} 0%, #EAE4DA 100%)` }}>
      <Blob x="16%" y="8%"  size={cW * 0.65} color={C.sage300} opacity={0.20} />
      <Blob x="82%" y="75%" size={cW * 0.58} color={C.lav300}  opacity={0.20} />

      <div style={{ position: "absolute", top: "5%", left: pad, right: pad, zIndex: 2 }}>
        <Caption cW={cW} label="복약 이력" headline={<>복약 기록을<br />한눈에</>} color={C.lav900} labelColor={C.sage500} align="right" />
      </div>

      <Phone src={img("/screenshots/ko/medication-history.png")} alt="복약 이력"
        style={{ position: "absolute", top: "23%", width: `${fw}%`, left: "-6%" }} />
    </div>
  );
}

function Slide8({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(155deg, ${C.lav50} 0%, ${C.lav100} 55%, ${C.bg} 100%)` }}>
      <Blob x="76%" y="-5%" size={cW * 0.85} color={C.lav300}  opacity={0.20} />
      <Blob x="16%" y="86%" size={cW * 0.62} color={C.blush300} opacity={0.18} />

      <div style={{ position: "absolute", top: "5%", left: pad, right: pad }}>
        <Caption cW={cW} label="처방전" headline={<>처방전을<br />한 곳에 모아요</>} color={C.lav900} labelColor={C.lav500} align="left" />
      </div>

      <Phone src={img("/screenshots/ko/prescription-list.png")} alt="처방전 목록"
        style={{ position: "absolute", top: "23%", width: `${fw}%`, left: "50%", transform: "translateX(-50%)" }} />
    </div>
  );
}

function Slide9({ cW, cH }: { cW: number; cH: number }) {
  const fw = phoneW(cW, cH) * 100;
  const pad = cW * 0.08;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(155deg, #2D2840 0%, #4A4072 55%, #2D2840 100%)` }}>
      <Blob x="12%" y="6%"  size={cW * 0.82} color={C.lav500} opacity={0.23} />
      <Blob x="88%" y="80%" size={cW * 0.65} color={C.accent} opacity={0.16} />

      <div style={{ position: "absolute", top: "5%", left: pad, right: pad }}>
        <Caption cW={cW} label="자동 인식" headline={<>사진 한 장으로<br />자동 입력</>} color={C.white} labelColor={C.blush300} align="left" />
      </div>

      <Phone src={img("/screenshots/ko/ocr-result.png")} alt="처방전 자동 인식"
        style={{ position: "absolute", top: "23%", width: `${fw}%`, left: "50%", transform: "translateX(-50%)" }} />
    </div>
  );
}

// ─── Feature Graphic (1024 × 500) ────────────────────────────────────────────
//
// Layout:
//   Left  (~50%): icon + app name + tagline + chips (vertically centered)
//   Right (~50%): mockup-duo.png (1082×1034, transparent bg + transparent screens)
//
// Screen corners measured from mockup-duo.png pixel scan:
//   Left phone  (y=90..960): bbox x=28..470  → clip polygon(0% 0%, 100% 0%, 97.3% 100%, 28.1% 100%)
//   Right phone (y=90..960): bbox x=598..1057 → clip polygon(3.5% 0%, 100% 0%, 67.1% 100%, 0% 100%)
//
function FeatureGraphicSlide({ cW, cH }: { cW: number; cH: number }) {
  const padL    = cW * 0.10;

  // Left text sizes
  const iconSize = cH * 0.200;
  const nameSize = cH * 0.110;
  const tagSize  = cH * 0.058;
  const chipSize = cH * 0.036;

  const mk2H = cH * 0.92;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${C.lav50} 0%, ${C.lav100} 50%, #EDE8DF 100%)` }}>

      <Blob x="75%" y="50%" size={cH * 2.2} color={C.lav300} opacity={0.22} />
      <Blob x="20%" y="90%" size={cH * 0.9} color={C.blush300} opacity={0.15} />

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        left: padL, top: "50%", transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0,
      }}>
        {/* Icon row: logo + name side by side */}
        <div style={{ display: "flex", alignItems: "center", gap: cH * 0.040, marginBottom: cH * 0.030 }}>
          <img src={img("/icon-logo.png")} alt="DearMI"
            style={{ display: "block", width: iconSize, height: iconSize, flexShrink: 0 }}
            draggable={false} />
          <div style={{ fontSize: nameSize, fontWeight: 800, color: C.lav900, fontFamily: "'SUIT', sans-serif", lineHeight: 1.0, letterSpacing: "-0.02em" }}>
            DearMI
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: tagSize, fontWeight: 500, color: C.lav700, fontFamily: "'SUIT', sans-serif", marginBottom: cH * 0.050, whiteSpace: "nowrap" as const }}>
          나의 마음 건강, 매일 기록하다
        </div>

        {/* Chips — 2 rows of 3 */}
        {[
          ["진료 기록", "복약 관리", "감정 체크인"],
          ["진료 일정", "약품 정보", "처방전 자동인식"],
        ].map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: cH * 0.020, marginBottom: ri === 0 ? cH * 0.016 : 0 }}>
            {row.map((text, i) => (
              <div key={i} style={{
                background: ri === 0 && i === 0 ? C.lav500 : C.lav100,
                borderRadius: 50,
                padding: `${cH * 0.012}px ${cH * 0.024}px`,
                fontSize: chipSize, fontWeight: ri === 0 && i === 0 ? 700 : 500,
                color: ri === 0 && i === 0 ? C.white : C.lav700,
                fontFamily: "'SUIT', sans-serif", whiteSpace: "nowrap" as const,
              }}>
                {text}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Right panel: pre-filled mockup ── */}
      <img
        src={img("/iPhone 15 Pro.png")}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          right: cW * 0.02,
          top: "50%",
          transform: "translateY(-50%)",
          height: mk2H,
          width: "auto",
        }}
      />
    </div>
  );
}

// ─── Registries ───────────────────────────────────────────────────────────────
type SlideDef = { id: string; label: string; component: (p: { cW: number; cH: number }) => React.ReactElement };

const IPHONE_SLIDES: SlideDef[] = [
  { id: "hero",               label: "Hero",       component: Slide1 },
  { id: "mood",               label: "감정 체크인",  component: Slide2 },
  { id: "schedule",           label: "진료 일정",   component: Slide3 },
  { id: "record",             label: "진료 기록",   component: Slide4 },
  { id: "prep-note",          label: "진료 준비",   component: Slide5 },
  { id: "medication-today",   label: "복약 관리",   component: Slide6 },
  { id: "medication-history", label: "복약 이력",   component: Slide7 },
  { id: "prescription-list",  label: "처방전",      component: Slide8 },
  { id: "ocr-result",         label: "OCR 인식",   component: Slide9 },
];

const FG_SLIDES: SlideDef[] = [
  { id: "feature-graphic", label: "Feature Graphic", component: FeatureGraphicSlide },
];

// ─── Preview card ─────────────────────────────────────────────────────────────
function SlidePreview({ slide, index, canvasW, canvasH }: {
  slide: SlideDef; index: number; canvasW: number; canvasH: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => { setScale(el.getBoundingClientRect().width / canvasW); });
    obs.observe(el);
    return () => obs.disconnect();
  }, [canvasW]);

  const SlideComp = slide.component;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, fontFamily: "'SUIT', sans-serif" }}>
        {String(index + 1).padStart(2, "0")} · {slide.label}
      </div>
      <div ref={containerRef} style={{ width: "100%", aspectRatio: `${canvasW}/${canvasH}`, position: "relative", overflow: "hidden", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
        <div style={{ width: canvasW, height: canvasH, transformOrigin: "top left", transform: `scale(${scale})`, position: "absolute", top: 0, left: 0 }}>
          <SlideComp cW={canvasW} cH={canvasH} />
        </div>
      </div>
    </div>
  );
}

// ─── Capture ──────────────────────────────────────────────────────────────────
async function captureSlide(el: HTMLElement, w: number, h: number): Promise<string> {
  el.style.left = "0px"; el.style.opacity = "1"; el.style.zIndex = "-1";
  const opts = { width: w, height: h, pixelRatio: 1, cacheBust: true };
  await toPng(el, opts);
  const dataUrl = await toPng(el, opts);
  el.style.left = "-9999px"; el.style.opacity = ""; el.style.zIndex = "";
  return dataUrl;
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Mode = "iphone" | "fg";

export default function ScreenshotsPage() {
  const [ready, setReady]     = useState(false);
  const [mode, setMode]       = useState<Mode>("iphone");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [exporting, setExporting] = useState<string | null>(null);
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { preloadAllImages().then(() => setReady(true)); }, []);

  const isFG       = mode === "fg";
  const slides     = isFG ? FG_SLIDES : IPHONE_SLIDES;
  const canvasW    = isFG ? FGW : W;
  const canvasH    = isFG ? FGH : H;
  const exportSize = isFG ? FG_SIZE : IPHONE_SIZES[sizeIdx];

  async function exportAll() {
    for (let i = 0; i < slides.length; i++) {
      setExporting(`${i + 1}/${slides.length}`);
      const el = exportRefs.current[i];
      if (!el) continue;
      const dataUrl = await captureSlide(el, exportSize.w, exportSize.h);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${String(i + 1).padStart(2, "0")}-${slides[i].id}-ko-${exportSize.w}x${exportSize.h}.png`;
      a.click();
      await new Promise((r) => setTimeout(r, 300));
    }
    setExporting(null);
  }

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'SUIT', sans-serif", color: C.lav500, fontSize: 18, fontWeight: 600, background: C.bg }}>
        이미지 불러오는 중…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", position: "relative", overflowX: "hidden", fontFamily: "'SUIT', sans-serif" }}>
      {/* Offscreen export canvases */}
      {slides.map((slide, i) => {
        const SlideComp = slide.component;
        return (
          <div key={slide.id} ref={(el) => { exportRefs.current[i] = el; }}
            style={{ position: "absolute", left: "-9999px", top: 0, width: exportSize.w, height: exportSize.h, opacity: 0, zIndex: -1 }}>
            <SlideComp cW={exportSize.w} cH={exportSize.h} />
          </div>
        );
      })}

      {/* Toolbar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", overflowX: "auto", minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", color: C.lav900, fontFamily: "'SUIT', sans-serif" }}>DearMI · 스크린샷</span>
          <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 8, padding: 4, flexShrink: 0 }}>
            {(["iphone", "fg"] as Mode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); setSizeIdx(0); }}
                style={{ padding: "4px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'SUIT', sans-serif", background: mode === m ? "white" : "transparent", color: mode === m ? C.lav500 : "#6b7280" }}>
                {m === "iphone" ? "iPhone" : "Feature Graphic"}
              </button>
            ))}
          </div>
          {!isFG ? (
            <select value={sizeIdx} onChange={(e) => setSizeIdx(Number(e.target.value))}
              style={{ fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 10px", fontFamily: "'SUIT', sans-serif" }}>
              {IPHONE_SIZES.map((s, i) => <option key={i} value={i}>{s.label} — {s.w}×{s.h}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>1024 × 500</span>
          )}
        </div>
        <div style={{ flexShrink: 0, padding: "10px 16px", borderLeft: "1px solid #e5e7eb" }}>
          <button onClick={exportAll} disabled={!!exporting}
            style={{ padding: "7px 20px", background: exporting ? "#93c5fd" : C.lav500, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: exporting ? "default" : "pointer", whiteSpace: "nowrap", fontFamily: "'SUIT', sans-serif" }}>
            {exporting ? `내보내는 중… ${exporting}` : "전체 내보내기"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: 24, display: "grid", gridTemplateColumns: isFG ? "minmax(0, 700px)" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, maxWidth: isFG ? 780 : 1400, margin: "0 auto" }}>
        {slides.map((slide, i) => (
          <SlidePreview key={slide.id} slide={slide} index={i} canvasW={canvasW} canvasH={canvasH} />
        ))}
      </div>
    </div>
  );
}
