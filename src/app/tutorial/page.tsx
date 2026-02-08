"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBottomNav } from "../context/BottomNavContext";
import Slide1 from "./Slide1";
import Slide2 from "./Slide2";
import Slide3 from "./Slide3";
import Slide4 from "./Slide4";

const SLIDES = [Slide1, Slide2, Slide3, Slide4];

export default function TutorialPage() {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setVisible } = useBottomNav();

  useEffect(() => {
    setVisible(false);
    return () => setVisible(true);
  }, [setVisible]);

  const next = () => setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  const finish = async () => {
    setLoading(true);
    try {
      // Try to notify backend that tutorial was seen. Ignore failures.
      await fetch("/api/users/tutorial/seen", { method: "POST" }).catch(() => {});
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      router.push("/feed");
    }
  };

  return (
    <div className="min-h-svh h-svh w-full flex items-center justify-center bg-gradient-to-b from-[#0b0c0f] to-[#0f0f0f] p-4">
      <div className="w-full h-full flex flex-col md:flex-row gap-6 items-center text-white pb-24">
          <div className="flex-1 flex flex-col md:flex-row gap-6 items-center w-full">
            <div className="w-full md:w-1/2 flex flex-col gap-4 px-4 md:px-8">
            {/* Render slide component for current index */}
            <div className="w-full">
              {(() => {
                const Comp = SLIDES[index];
                return <Comp />;
              })()}
            </div>
          </div>
          {/* Image removed per request: text-only slides */}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`page-${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-8 rounded-full ${i === index ? "bg-white" : "bg-gray-600"}`}
            />
          ))}
        </div>

        {/* Bottom action bar: fixed */}
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm py-4 px-4 flex items-center" style={{zIndex:50}}>
          <div className="max-w-[1200px] w-full mx-auto flex items-center gap-3">
            <button
              onClick={() => finish()}
              className="px-4 py-2 rounded bg-transparent border border-[#374151] text-sm text-white"
            >
              スキップ
            </button>
            <div className="flex-1" />
            {index < SLIDES.length - 1 ? (
              <button
                onClick={next}
                className="px-6 py-2 rounded bg-gradient-to-b from-[#00a63e] to-[#13ac4c] text-white font-bold"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={loading}
                className="px-6 py-2 rounded bg-gradient-to-b from-[#00a63e] to-[#13ac4c] text-white font-bold disabled:opacity-50"
              >
                {loading ? "処理中..." : "始める"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
