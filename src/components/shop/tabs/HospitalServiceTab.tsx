'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Stethoscope } from "lucide-react";
import { Doctor, loadDoctors } from "@/lib/hospitalStore";

export function HospitalServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "");
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);

  useEffect(() => {
    let active = true;
    if (!shopId) return;
    loadDoctors(shopId).then((d) => {
      if (active) setDoctors(d);
    });
    return () => { active = false; };
  }, [shopId]);

  if (doctors === null) {
    return <div className="p-5 bg-white min-h-[50vh]" />;
  }

  if (doctors.length === 0) {
    return (
      <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3 text-purple-500">
          <Stethoscope className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">Эмч нар нэмэгдээгүй байна</p>
        <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
          Эмнэлэг удахгүй эмч нарын мэдээллийг энд нэмэх болно.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white min-h-[50vh] space-y-3">
      {doctors.map((doc) => (
        <div key={doc.id} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                {doc.department}
              </p>
              <p className="font-bold text-sm text-gray-900">{doc.name}</p>
              {doc.specialty && (
                <p className="text-[12px] text-gray-600 mt-0.5">{doc.specialty}</p>
              )}
              {doc.bio && (
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{doc.bio}</p>
              )}
            </div>
          </div>
          <Link
            href={`/category/hospital/${shopId}/book?doctorId=${doc.id}`}
            className="flex items-center justify-center gap-1.5 w-full bg-purple-500 text-white font-semibold py-2.5 rounded-xl text-[13px] active:scale-[0.98] transition-transform"
          >
            Цаг захиалах
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}
