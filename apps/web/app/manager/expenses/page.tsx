"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { gregorianToJalali, parseJalaliDate, toPersianDigits } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { useCan, useMe } from "@/lib/client/me";
import { jdate, toman, tomanInputToRial } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

type Category = { id: string; name: string; isActive: boolean };
type Expense = {
  id: string; amountRial: string; method: string; description: string | null; spentAt: string;
  voidedAt: string | null; voidReason: string | null; branchId: string | null; category: { name: string };
};
type Profit = {
  year: number; month: number; incomeRial: string; refundRial: string; expenseRial: string; netRial: string;
  expensesByCategory: { categoryId: string; name: string; amountRial: string }[];
};
type Branch = { id: string; name: string };

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const METHODS = [["CASH", "نقد"], ["CARD_POS", "کارت‌خوان"], ["TRANSFER", "کارت به کارت"]] as const;
const LABEL: Record<string, string> = Object.fromEntries(METHODS);

function thisMonth() {
  const t = new Date(Date.now() + 3.5 * 3600_000);
  const j = gregorianToJalali(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  return { y: j.y, m: j.m };
}

export default function ExpensesPage() {
  const qc = useQueryClient();
  const canManage = useCan("finance.manage");
  const now = useMemo(thisMonth, []);
  const [ym, setYm] = useState(now);
  const isCurrent = ym.y === now.y && ym.m === now.m;
  const qs = `year=${ym.y}&month=${ym.m}`;
  const profit = useQuery({ queryKey: ["profit", qs], queryFn: () => api<Profit>(`/finance/profit?${qs}`) });
  const expenses = useQuery({ queryKey: ["expenses", qs], queryFn: () => api<Expense[]>(`/expenses?${qs}`) });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["profit"] });
    void qc.invalidateQueries({ queryKey: ["expenses"] });
    void qc.invalidateQueries({ queryKey: ["cash-report"] });
  };
  const voidM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api(`/expenses/${id}/void`, { method: "POST", body: { reason } }),
    onSuccess: refresh,
  });
  const shift = (d: number) => setYm(({ y, m }) => {
    const n = m + d;
    return n < 1 ? { y: y - 1, m: 12 } : n > 12 ? { y: y + 1, m: 1 } : { y, m: n };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">هزینه‌ها و سود</h1>
        <div className="flex items-center gap-1" role="group" aria-label="انتخاب ماه">
          <button type="button" className="btn-ghost h-9 px-2" aria-label="ماه قبل" onClick={() => shift(-1)}><ChevronRight className="size-4" aria-hidden /></button>
          <span className="min-w-28 text-center font-bold" aria-live="polite">{MONTHS[ym.m - 1]} {toPersianDigits(ym.y)}</span>
          <button type="button" className="btn-ghost h-9 px-2" aria-label="ماه بعد" disabled={isCurrent} onClick={() => shift(1)}><ChevronLeft className="size-4" aria-hidden /></button>
        </div>
      </div>

      {profit.isLoading ? <LoadingState /> : profit.isError ? <ErrorState error={profit.error} onRetry={() => profit.refetch()} /> : profit.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="card"><p className="text-sm text-ink-2">درآمد</p><p className="text-2xl font-extrabold text-brand-700">{toman(profit.data.incomeRial)}</p></div>
            <div className="card"><p className="text-sm text-ink-2">بازگشت وجه</p><p className="text-2xl font-extrabold text-err-tx">{toman(profit.data.refundRial)}</p></div>
            <div className="card"><p className="text-sm text-ink-2">هزینه‌ها</p><p className="text-2xl font-extrabold text-err-tx">{toman(profit.data.expenseRial)}</p></div>
            <div className="card"><p className="text-sm text-ink-2">{BigInt(profit.data.netRial) < 0n ? "زیان" : "سود"}</p>
              <p className={`text-2xl font-extrabold ${BigInt(profit.data.netRial) < 0n ? "text-err-tx" : ""}`}>{toman(BigInt(profit.data.netRial) < 0n ? (-BigInt(profit.data.netRial)).toString() : profit.data.netRial)}</p></div>
          </div>
          {profit.data.expensesByCategory.length > 0 && (
            <section className="card space-y-2" aria-labelledby="bycat-title">
              <h2 id="bycat-title" className="card-title">هزینه به تفکیک دسته</h2>
              <ul className="space-y-2 text-sm">
                {profit.data.expensesByCategory.map((c) => {
                  const pct = Number((BigInt(c.amountRial) * 100n) / (BigInt(profit.data!.expenseRial) || 1n));
                  return (
                    <li key={c.categoryId}>
                      <div className="flex justify-between"><span>{c.name}</span><span className="font-semibold">{toman(c.amountRial)}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-canvas"><div className="h-1.5 rounded-full bg-err" style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {canManage && <ExpenseForm onDone={refresh} />}

      <section className="card p-0" aria-labelledby="list-title">
        <h2 id="list-title" className="card-title p-5 pb-3">هزینه‌های این ماه</h2>
        {expenses.isLoading ? <LoadingState /> : expenses.isError ? <ErrorState error={expenses.error} /> : expenses.data?.length === 0 ? (
          <EmptyState title="در این ماه هزینه‌ای ثبت نشده است" />
        ) : (
          <ul className="divide-y divide-line">
            {expenses.data?.map((e) => (
              <li key={e.id} className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm ${e.voidedAt ? "opacity-60" : ""}`}>
                <div>
                  <p className="font-semibold">{e.category.name}{e.description ? `، ${e.description}` : ""}</p>
                  <p className="text-xs text-ink-2">{jdate(e.spentAt)}، {LABEL[e.method] ?? e.method}{e.voidedAt ? `، باطل شده: ${e.voidReason}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${e.voidedAt ? "line-through" : ""}`}>{toman(e.amountRial)}</span>
                  {canManage && !e.voidedAt && (
                    <button type="button" className="btn-ghost h-8 px-2 text-xs text-err-tx" disabled={voidM.isPending}
                      onClick={() => { const reason = prompt("دلیل ابطال این هزینه؟"); if (reason?.trim()) voidM.mutate({ id: e.id, reason: reason.trim() }); }}>
                      ابطال
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {voidM.error && <p role="alert" className="field-error px-5 pb-3">{(voidM.error as ApiError).message}</p>}
      </section>
    </div>
  );
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const me = useMe();
  const cats = useQuery({ queryKey: ["expense-categories"], queryFn: () => api<Category[]>("/expenses/categories") });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const allowed = (branches.data ?? []).filter((b) => !me.access?.branchIds || me.access.branchIds.includes(b.id));
  const [f, setF] = useState({ categoryId: "", amount: "", method: "CASH", date: "", description: "", branchId: "" });
  const [newCat, setNewCat] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: () => {
      const errs: Record<string, string> = {};
      const amountRial = tomanInputToRial(f.amount);
      if (!f.categoryId) errs.categoryId = "دسته را انتخاب کنید";
      if (!amountRial || amountRial === "0") errs.amountRial = "مبلغ را به عدد وارد کنید";
      const spentAt = f.date.trim() ? parseJalaliDate(f.date) : undefined;
      if (spentAt === null) errs.spentAt = "تاریخ را به شکل ۱۴۰۵/۰۸/۱۶ بنویسید";
      setErrors(errs);
      if (Object.keys(errs).length) throw new ApiError(400, "LOCAL", "");
      return api("/expenses", { method: "POST", body: { categoryId: f.categoryId, amountRial, method: f.method, spentAt, description: f.description || undefined, branchId: f.branchId || undefined } });
    },
    onSuccess: () => { setF((s) => ({ ...s, amount: "", description: "", date: "" })); onDone(); },
    onError: (e) => { if (e instanceof ApiError && e.fields) setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0]!]))); },
  });
  const addCat = useMutation({
    mutationFn: (name: string) => api<Category>("/expenses/categories", { method: "POST", body: { name } }),
    onSuccess: (c) => { setNewCat(null); setF((s) => ({ ...s, categoryId: c.id })); void qc.invalidateQueries({ queryKey: ["expense-categories"] }); },
  });
  const err = save.error as ApiError | null;

  return (
    <section className="card space-y-4" aria-labelledby="new-exp-title">
      <h2 id="new-exp-title" className="card-title">ثبت هزینه</h2>
      <form className="grid gap-3 sm:grid-cols-3" noValidate onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <div>
          <label htmlFor="cat" className="label">دسته</label>
          {newCat === null ? (
            <div className="flex gap-1">
              <select id="cat" className="input" value={f.categoryId} onChange={set("categoryId")}>
                <option value="">انتخاب کنید</option>
                {cats.data?.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" className="btn-ghost px-2" aria-label="دسته‌ی جدید" onClick={() => setNewCat("")}><Plus className="size-4" aria-hidden /></button>
            </div>
          ) : (
            <div className="flex gap-1">
              <input id="cat" className="input" placeholder="نام دسته‌ی جدید" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button type="button" className="btn-secondary px-2 text-xs" disabled={!newCat.trim() || addCat.isPending} onClick={() => addCat.mutate(newCat.trim())}>افزودن</button>
            </div>
          )}
          {(errors.categoryId || addCat.error) && <p className="field-error">{errors.categoryId ?? (addCat.error as ApiError).message}</p>}
        </div>
        <div>
          <label htmlFor="amount" className="label">مبلغ (تومان)</label>
          <input id="amount" inputMode="numeric" className="input ltr-nums" value={f.amount} onChange={set("amount")} />
          {errors.amountRial && <p className="field-error">{errors.amountRial}</p>}
        </div>
        <div>
          <label htmlFor="method" className="label">روش پرداخت</label>
          <select id="method" className="input" value={f.method} onChange={set("method")}>
            {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="label">تاریخ (خالی = امروز)</label>
          <input id="date" className="input ltr-nums" placeholder="۱۴۰۵/۰۸/۱۶" value={f.date} onChange={set("date")} />
          {errors.spentAt && <p className="field-error">{errors.spentAt}</p>}
        </div>
        {allowed.length > 1 && (
          <div>
            <label htmlFor="branch" className="label">شعبه</label>
            <select id="branch" className="input" value={f.branchId} onChange={set("branchId")}>
              {!me.access?.branchIds && <option value="">کل باشگاه</option>}
              {allowed.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div className={allowed.length > 1 ? "" : "sm:col-span-2"}>
          <label htmlFor="desc" className="label">توضیح</label>
          <input id="desc" className="input" value={f.description} onChange={set("description")} />
        </div>
        <div className="sm:col-span-3 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}ثبت هزینه
          </button>
          {err && err.code !== "LOCAL" && !err.fields && <p role="alert" className="field-error">{err.message}</p>}
        </div>
      </form>
    </section>
  );
}
