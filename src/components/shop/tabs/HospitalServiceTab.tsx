'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Stethoscope } from "lucide-react";
import { Doctor, defaultDoctors, loadDoctors } from "@/lib/hospitalStore";

export function HospitalServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "1");
  const [doctors, setDoctors] = useState<Doctor[]>(defaultDoctors);
  const [activeDept, setActiveDept] = useState<string>("all");

  useEffect(() => {
    setDoctors(loadDoctors());
  }, []);

  const departments = useMemo(() => {
    const set = new Set(doctors.map((d) => d.department));
    return ["all", ...Array.from(set)];
  }, [doctors]);

  const visible = activeDept === "all" ? doctors : doctors.filter((d) => d.department === activeDept);

  return (
    <div className="p-5 bg-white min-h-[50vh]">
      {departments.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-3 -mx-1 px-1">
          {departments.map((d) => {
            const active = activeDept === d;
            return (
              <button
                key={d}
                onClick={() => setActiveDept(d)}
                className={`px-4 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap ${active ? "bg-purple-500 border-purple-500 text-white" : "border-gray-200 bg-white text-gray-700"}`}
              >
                {d === "all" ? "Бүгд" : d}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">Эмч байхгүй байна</p>
      ) : (
        <div className="space-y-3 mt-2">
          {visible.map((doc) => (
            <div key={doc.id} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
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
                    <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2">{doc.bio}</p>
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
      )}
    </div>
  );
}
