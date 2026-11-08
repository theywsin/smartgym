"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Package, Plus, Trash2 } from "lucide-react";
import { formatTehranTime, toPersianDigits } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { FormDialog, type DialogRequest } from "@/components/form-dialog";
import { useCan } from "@/lib/client/me";
import { useBranchPicker } from "@/lib/client/branches";
import { toman } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

type Product = {
  id: string; kind: "STORE" | "BUFFET"; name: string; sku: string | null; priceRial: string;
  trackStock: boolean; isActive: boolean; quantity: number | null; stock: { branchId: string; quantity: number }[];
};
type Sale = { id: string; totalRial: string; method: string; createdAt: string; voidedAt: string | null; voidReason: string | null; items: { name: string; quantity: number }[] };
type SalesDay = { totalRial: string; count: number; byProduct: { name: string; quantity: number; totalRial: string }[]; sales: Sale[] };

const METHODS = [["CASH", "نقد"], ["CARD_POS", "کارت‌خوان"], ["TRANSFER", "کارت به کارت"]] as const;
const KIND_LABEL = { BUFFET: "بوفه", STORE: "فروشگاه" } as const;

export default function StorePage() {
  const qc = useQueryClient();
  const canStore = useCan("store.manage");
  const canBuffet = useCan("buffet.manage");
  const canFinance = useCan("finance.manage");
  const canManage = canStore || canBuffet;
  const canVoid = canStore || canFinance;
  const { allowed, branchId, setBranchId } = useBranchPicker();
  const products = useQuery({ queryKey: ["products", branchId], queryFn: () => api<Product[]>(`/store/products?branchId=${branchId}`), enabled: !!branchId });
  const sales = useQuery({ queryKey: ["sales", branchId], queryFn: () => api<SalesDay>(`/store/sales?branchId=${branchId}`), enabled: !!branchId });
  const [kind, setKind] = useState<"BUFFET" | "STORE">("BUFFET");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [method, setMethod] = useState("CASH");
  const key = useRef(crypto.randomUUID());
  const byId = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p])), [products.data]);
  const lines = Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ p: byId.get(id)!, n })).filter((l) => l.p);
  const total = lines.reduce((a, l) => a + BigInt(l.p.priceRial) * BigInt(l.n), 0n);
  const add = (p: Product, d: number) => setCart((c) => {
    const n = Math.max(0, (c[p.id] ?? 0) + d);
    if (p.trackStock && p.quantity !== null && n > p.quantity) return c;
    return { ...c, [p.id]: n };
  });
  const refresh = () => {
    for (const k of ["products", "sales", "cash-report", "profit"]) void qc.invalidateQueries({ queryKey: [k] });
  };
  const sell = useMutation({
    mutationFn: () => api("/store/sales", { method: "POST", body: { branchId, method, items: lines.map((l) => ({ productId: l.p.id, quantity: l.n })) }, idempotencyKey: key.current }),
    onSuccess: () => { setCart({}); key.current = crypto.randomUUID(); refresh(); },
  });
  const voidM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api(`/store/sales/${id}/void`, { method: "POST", body: { reason } }),
    onSuccess: refresh,
  });
  const visible = (products.data ?? []).filter((p) => p.isActive && p.kind === kind);

  const [dlg, setDlg] = useState<DialogRequest | null>(null);
  return (
    <div className="space-y-6">
      <FormDialog request={dlg} onClose={() => setDlg(null)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">فروشگاه و بوفه</h1>
        <div className="flex items-center gap-2">
          {allowed.length > 1 && (
            <select aria-label="شعبه" className="input h-9 w-auto" value={branchId} onChange={(e) => { setBranchId(e.target.value); setCart({}); }}>
              {allowed.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {canManage && <Link href="/manager/store/products" className="btn-secondary h-9"><Package className="size-4" aria-hidden />کالاها و انبار</Link>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card space-y-4" aria-label="کالاها">
          <div className="flex gap-1" role="tablist">
            {(["BUFFET", "STORE"] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "btn-primary h-9" : "btn-ghost h-9"} onClick={() => setKind(k)}>{KIND_LABEL[k]}</button>
            ))}
          </div>
          {products.isLoading ? <LoadingState /> : products.isError ? <ErrorState error={products.error} /> : visible.length === 0 ? (
            <EmptyState title="کالایی ثبت نشده است" hint={canManage ? "از «کالاها و انبار» کالا اضافه کنید." : undefined} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((p) => {
                const out = p.trackStock && (p.quantity ?? 0) <= (cart[p.id] ?? 0);
                return (
                  <button key={p.id} type="button" disabled={out} onClick={() => add(p, 1)}
                    className="rounded-xl border border-line bg-surface p-3 text-right transition hover:border-brand-500 disabled:opacity-50">
                    <p className="font-bold">{p.name}</p>
                    <p className="mt-1 text-sm text-brand-700">{toman(p.priceRial)}</p>
                    {p.trackStock && <p className="mt-1 text-xs text-ink-3">موجودی: {toPersianDigits(p.quantity ?? 0)}</p>}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="card space-y-4" aria-labelledby="cart-title">
          <h2 id="cart-title" className="card-title">فاکتور</h2>
          {lines.length === 0 ? <p className="text-sm text-ink-2">روی کالا بزنید تا به فاکتور اضافه شود.</p> : (
            <ul className="space-y-2 text-sm">
              {lines.map(({ p, n }) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="flex items-center gap-1">
                    <button type="button" className="btn-ghost size-7 p-0" aria-label={`کم کردن ${p.name}`} onClick={() => add(p, -1)}>{n === 1 ? <Trash2 className="size-3.5" aria-hidden /> : <Minus className="size-3.5" aria-hidden />}</button>
                    <span className="w-6 text-center font-bold">{toPersianDigits(n)}</span>
                    <button type="button" className="btn-ghost size-7 p-0" aria-label={`افزودن ${p.name}`} onClick={() => add(p, 1)}><Plus className="size-3.5" aria-hidden /></button>
                  </span>
                  <span className="w-24 text-left">{toman((BigInt(p.priceRial) * BigInt(n)).toString())}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-line pt-3 font-extrabold"><span>جمع</span><span>{toman(total.toString())}</span></div>
          <div>
            <label htmlFor="pay-method" className="label">روش پرداخت</label>
            <select id="pay-method" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button type="button" className="btn-primary btn-lg w-full" disabled={lines.length === 0 || sell.isPending} onClick={() => sell.mutate()}>
            {sell.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}ثبت فروش
          </button>
          {sell.error && <p role="alert" className="field-error">{(sell.error as ApiError).message}</p>}
          {sell.isSuccess && lines.length === 0 && <p role="status" className="text-sm text-brand-700">فروش ثبت شد.</p>}
        </section>
      </div>

      <section className="card p-0" aria-labelledby="today-title">
        <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
          <h2 id="today-title" className="card-title">فروش امروز</h2>
          {sales.data && <p className="text-sm">{toPersianDigits(sales.data.count)} فاکتور، <span className="font-extrabold">{toman(sales.data.totalRial)}</span></p>}
        </div>
        {sales.data?.sales.length === 0 ? <EmptyState title="امروز فروشی ثبت نشده است" /> : (
          <ul className="divide-y divide-line">
            {sales.data?.sales.map((s) => (
              <li key={s.id} className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm ${s.voidedAt ? "opacity-60" : ""}`}>
                <div>
                  <p>{s.items.map((i) => `${i.name} × ${toPersianDigits(i.quantity)}`).join("، ")}</p>
                  <p className="text-xs text-ink-2">{formatTehranTime(s.createdAt)}، {METHODS.find((m) => m[0] === s.method)?.[1] ?? s.method}{s.voidedAt ? `، باطل شده: ${s.voidReason}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${s.voidedAt ? "line-through" : ""}`}>{toman(s.totalRial)}</span>
                  {canVoid && !s.voidedAt && (
                    <button type="button" className="btn-ghost h-8 px-2 text-xs text-err-tx" disabled={voidM.isPending}
                      onClick={() => setDlg({ title: "ابطال فروش", description: `${toman(s.totalRial)}؛ موجودی کالاها برمی‌گردد.`, fields: [{ name: "reason", label: "دلیل ابطال" }], confirmLabel: "ابطال فروش", danger: true, onSubmit: (v) => { voidM.mutate({ id: s.id, reason: v.reason! }); } })}>ابطال</button>
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
