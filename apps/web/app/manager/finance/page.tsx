"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatIranMobile, formatTehranTime, toPersianDigits } from "@smartgym/shared";
import { api } from "@/lib/client/api";
import { useCan, useMe } from "@/lib/client/me";
import { jdate, toman } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

type Report = {
  from: string;
  byMethod: { method: string; incomeRial: string; refundRial: string; netRial: string }[];
  totalIncomeRial: string; totalRefundRial: string; totalNetRial: string;
  entries: { id: string; type: string; amountRial: string; method: string; description: string | null; occurredAt: string; member: { id: string; firstName: string; lastName: string } | null }[];
};
type Debt = { subscriptionId: string; planName: string; endsAt: string; dueRial: string; member: { id: string; code: number; firstName: string; lastName: string; phone: string | null } };
type Branch = { id: string; name: string };

const LABEL: Record<string, string> = { CASH: "نقد", CARD_POS: "کارت‌خوان", TRANSFER: "کارت به کارت", ONLINE: "درگاه آنلاین" };
const DAY = 86_400_000;
/** Tehran calendar day (YYYY-MM-DD) offset from today. */
function tehranDate(offsetDays: number) {
  return new Date(Date.now() + 3.5 * 3600_000 + offsetDays * DAY).toISOString().slice(0, 10);
}

export default function FinancePage() {
  const me = useMe();
  const canDebts = useCan("finance.read");
  const [offset, setOffset] = useState(0);
  const [branchId, setBranchId] = useState("");
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const allowed = (branches.data ?? []).filter((b) => !me.access?.branchIds || me.access.branchIds.includes(b.id));
  const date = tehranDate(offset);
  const report = useQuery({
    queryKey: ["cash-report", date, branchId],
    queryFn: () => api<Report>(`/finance/cash-report?date=${date}${branchId ? `&branchId=${branchId}` : ""}`),
  });
  const debts = useQuery({ queryKey: ["debts"], queryFn: () => api<Debt[]>("/finance/debts"), enabled: canDebts });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">صندوق و بدهی‌ها</h1>
          <p className="text-sm text-ink-2">مبالغ به تومان؛ دفتر مالی فقط افزودنی است و ویرایش یا حذف نمی‌شود.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allowed.length > 1 && (
            <select aria-label="شعبه" className="input h-10 w-auto" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {!me.access?.branchIds && <option value="">همه شعب</option>}
              {allowed.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1">
            <button type="button" className="btn-secondary h-10 px-2" onClick={() => setOffset((o) => o - 1)} aria-label="روز قبل">
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <span className="min-w-28 text-center text-sm font-semibold">{offset === 0 ? "امروز" : jdate(report.data?.from ?? new Date(Date.now() + offset * DAY))}</span>
            <button type="button" className="btn-secondary h-10 px-2" disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)} aria-label="روز بعد">
              <ChevronLeft className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {report.isPending && <LoadingState />}
      {report.isError && <ErrorState error={report.error} onRetry={() => report.refetch()} />}
      {report.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card"><p className="text-sm text-ink-2">دریافتی</p><p className="text-2xl font-extrabold text-brand-700">{toman(report.data.totalIncomeRial)}</p></div>
            <div className="card"><p className="text-sm text-ink-2">بازگشت وجه</p><p className="text-2xl font-extrabold text-err-tx">{toman(report.data.totalRefundRial)}</p></div>
            <div className="card"><p className="text-sm text-ink-2">خالص</p><p className="text-2xl font-extrabold">{toman(report.data.totalNetRial)}</p></div>
          </div>
          <section className="card p-0" aria-labelledby="methods-title">
            <h2 id="methods-title" className="card-title p-5 pb-3">به تفکیک روش پرداخت</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-right text-xs text-ink-2">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">روش</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">دریافتی</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">بازگشت</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">خالص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {report.data.byMethod.filter((m) => m.method !== "ONLINE" || m.incomeRial !== "0").map((m) => (
                    <tr key={m.method}>
                      <td className="px-4 py-3 font-semibold">{LABEL[m.method]}</td>
                      <td className="px-4 py-3">{toman(m.incomeRial)}</td>
                      <td className="px-4 py-3">{toman(m.refundRial)}</td>
                      <td className="px-4 py-3 font-semibold">{toman(m.netRial)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card p-0" aria-labelledby="entries-title">
            <h2 id="entries-title" className="card-title p-5 pb-3">ریز تراکنش‌ها</h2>
            {report.data.entries.length === 0 ? (
              <EmptyState title="در این روز تراکنشی ثبت نشده است" />
            ) : (
              <ul className="divide-y divide-line">
                {report.data.entries.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <span>
                      <span className="ltr-nums text-ink-3">{formatTehranTime(e.occurredAt)}</span>{" "}
                      {e.member ? <Link href={`/manager/members/${e.member.id}`} className="font-semibold hover:underline">{e.member.firstName} {e.member.lastName}</Link> : "—"}
                      <span className="text-ink-2">، {e.description ?? ""}، {LABEL[e.method]}</span>
                    </span>
                    <span className={`font-bold ${e.type === "INCOME" ? "text-brand-700" : "text-err-tx"}`}>
                      {e.type === "INCOME" ? "+" : "−"}{toman(e.amountRial.replace("-", ""))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {canDebts && (
        <section className="card p-0" aria-labelledby="debts-title">
          <h2 id="debts-title" className="card-title p-5 pb-3">بدهکاران</h2>
          {debts.isPending && <LoadingState />}
          {debts.data?.length === 0 && <EmptyState title="بدهی ثبت‌شده‌ای وجود ندارد" />}
          {debts.data && debts.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-right text-xs text-ink-2">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">عضو</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">موبایل</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">پلن</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">بدهی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {debts.data.map((d) => (
                    <tr key={d.subscriptionId}>
                      <td className="px-4 py-3"><Link href={`/manager/members/${d.member.id}`} className="font-semibold hover:underline">{d.member.firstName} {d.member.lastName}</Link></td>
                      <td className="px-4 py-3">{d.member.phone ? <span className="ltr-nums">{toPersianDigits(formatIranMobile(d.member.phone))}</span> : "—"}</td>
                      <td className="px-4 py-3">{d.planName}</td>
                      <td className="px-4 py-3 font-bold text-err-tx">{toman(d.dueRial)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
