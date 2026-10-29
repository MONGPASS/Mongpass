"use client";
import { useState, useEffect } from "react";
import {
  PushStatus,
  disablePush,
  enablePush,
  getPushStatus,
} from "@/lib/pushClient";

export default function PushOptInCard() {
  const [status, setStatus] = useState<PushStatus | "loading">("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    getPushStatus().then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, []);

  // Nothing to offer: no browser support or server keys not set.
  if (status === "loading" || status === "unsupported") return null;

  if (status === "denied") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[12px] text-gray-500 leading-relaxed">
        Хөтөч мэдэгдлийг хаасан байна. Хөтчийн тохиргооноос зөвшөөрвөл шинэ захиалгын мэдэгдэл авна.
      </div>
    );
  }

  const subscribed = status === "subscribed";
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-amber-900">Шинэ захиалгын мэдэгдэл</p>
        <p className="text-[11px] text-amber-800/80 leading-relaxed">
          {subscribed
            ? "Шинэ захиалга ирэхэд мэдэгдэнэ"
            : "Хуудсаа хаасан ч шинэ захиалгын мэдэгдэл аваарай"}
        </p>
      </div>
      <button
        onClick={async () => {
          if (working) return;
          setWorking(true);
          try {
            if (subscribed) {
              await disablePush();
              setStatus("not-subscribed");
            } else {
              setStatus(await enablePush());
            }
          } finally {
            setWorking(false);
          }
        }}
        disabled={working}
        className={`shrink-0 text-[12px] font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
          subscribed
            ? "bg-white border border-amber-200 text-amber-800"
            : "bg-amber-500 text-white"
        }`}
      >
        {working ? "..." : subscribed ? "Унтраах" : "Асаах"}
      </button>
    </div>
  );
}
