'use client';

export const runtime = "edge";

import { ArrowLeft, Send, Check, Stethoscope } from "lucide-react";
import { r2Url } from "@/lib/images/upload";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Doctor, loadDoctors } from "@/lib/hospitalStore";
import {
  HospitalAppointment,
  addOrder,
  newOrderId,
} from "@/lib/orderStore";

export default function HospitalBookPage({ params }: { params: { shopId: string } }) {
  const searchParams = useSearchParams();
  const initialDoctorId = searchParams.get("doctorId");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(initialDoctorId);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [symptom, setSymptom] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    loadDoctors(params.shopId).then((d) => {
      if (!active) return;
      setDoctors(d);
      if (!selectedDoctorId && d.length > 0) setSelectedDoctorId(d[0].id);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.shopId]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
  );

  const canSubmit =
    selectedDoctor !== null &&
    patientName.trim().length > 0 &&
    patientPhone.trim().length > 0 &&
    preferredDate.trim().length > 0 &&
    preferredTime.trim().length > 0;

  async function submit() {
    if (!selectedDoctor || !canSubmit) return;
    const order: HospitalAppointment = {
      id: newOrderId(),
      shopCategory: "hospital",
      shopId: params.shopId,
      createdAt: new Date().toISOString(),
      status: "pending",
      doctorId: selectedDoctor.id,
      doctorSnapshot: {
        name: selectedDoctor.name,
        department: selectedDoctor.department,
      },
      preferredDate: preferredDate.trim(),
      preferredTime: preferredTime.trim(),
      patient: {
        name: patientName.trim(),
        phone: patientPhone.trim(),
        age: patientAge.trim() || undefined,
      },
      symptom: symptom.trim() || undefined,
    };
    const created = await addOrder(order);
    if (!created) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <Check className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Цаг захиалга илгээгдлээ!</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Эмнэлгийн ажилтан таны хүсэлтийг хүлээн авч, цаг баталгаажуулах болно.
          </p>
          {/* Primary action sends the user to their orders list so
              they can track the appointment status; secondary returns
              to the shop for browsing more services. */}
          <div className="flex flex-col gap-2">
            <Link
              href="/profile/orders"
              className="block w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm"
            >
              Миний захиалгууд руу
            </Link>
            <Link
              href={`/category/hospital/${params.shopId}`}
              className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl text-sm"
            >
              Эмнэлэг рүү буцах
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link
            href={`/category/hospital/${params.shopId}`}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Цаг захиалах</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Doctor picker */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">1. Эмч сонгох</h2>
          {doctors.length === 0 ? (
            <p className="text-xs text-gray-400">Эмч байхгүй байна</p>
          ) : (
            <div className="space-y-2">
              {doctors.map((d) => {
                const active = selectedDoctorId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDoctorId(d.id)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors ${active ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white"}`}
                  >
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${active ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-500"}`}
                    >
                      {d.imageR2Key ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r2Url(d.imageR2Key)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Stethoscope className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                        {d.department}
                      </p>
                      <p className="font-bold text-sm text-gray-900">{d.name}</p>
                      {d.specialty && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{d.specialty}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Preferred slot */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">2. Хүсэлт өгөх цаг</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Огноо</label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Цаг</label>
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Эмнэлэг тантай холбогдож баталгаажуулна
          </p>
        </section>

        {/* Patient info */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">3. Үйлчлүүлэгчийн мэдээлэл</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Сараа"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Утас</label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="010-xxxx-xxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Нас <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="32"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Зовиур <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <textarea
                rows={3}
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                placeholder="Ямар зовиуртай байгаагаа товчхон бичнэ үү..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-purple-500 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Send className="w-4 h-4" /> Цаг захиалга илгээх
          </button>
        </div>
      </div>
    </main>
  );
}
