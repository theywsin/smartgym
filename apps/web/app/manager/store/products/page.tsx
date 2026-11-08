"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { toPersianDigits } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { FormDialog, type DialogRequest } from "@/components/form-dialog";
import { useCan } from "@/lib/client/me";
import { useBranchPicker } from "@/lib/client/branches";
import { toman, tomanInputToRial } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

type Product = { id: string; kind: "STORE" | "BUFFET"; name: string; priceRial: string; trackStock: boolean; isActive: boolean; quantity: number | null };
const KIND_LABEL = { BUFFET: "بوفه", STORE: "فروشگاه" } as const;

export default function ProductsPage() {
  const qc = useQueryClient();
  const canStore = useCan("store.manage");
  const canBuffet = useCan("buffet.manage");
  const { allowed, branchId, setBranchId } = useBranchPicker();
  const products = useQuery({ queryKey: ["products", branchId], queryFn: () => api<Product[]>(`/store/products?branchId=${branchId}`), enabled: !!branchId });
  const [f, setF] = useState({ kind: canBuffet ? "BUFFET" : "STORE", name: "", price: "", trackStock: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refresh = () => void qc.invalidateQueries({ queryKey: ["products"] });

  const create = useMutation({
    mutationFn: () => {
      const priceRial = tomanInputToRial(f.price);
      const errs: Record<string, string> = {};
      if (!f.name.trim()) errs.name = "نام کالا را بنویسید";
      if (priceRial === null) errs.priceRial = "قیمت را به عدد وارد کنید";
      setErrors(errs);
      if (Object.keys(errs).length) throw new ApiError(400, "LOCAL", "");
      return api("/store/products", { method: "POST", body: { kind: f.kind, name: f.name, priceRial, trackStock: f.trackStock } });
    },
    onSuccess: () => { setF((s) => ({ ...s, name: "", price: "" })); refresh(); },
    onError: (e) => { if (e instanceof ApiError && e.fields) setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0]!]))); },
  });
  const act = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) => api(path, { method: path.endsWith("/stock") ? "POST" : "PATCH", body }),
    onSuccess: refresh,
  });
  const [dlg, setDlg] = useState<DialogRequest | null>(null);
  const stock = (p: Product, reason: "PURCHASE" | "ADJUST") =>
    setDlg({
      title: reason === "PURCHASE" ? `ورود به انبار: ${p.name}` : `شمارش موجودی: ${p.name}`,
      fields: [{ name: "n", label: reason === "PURCHASE" ? "تعداد واردشده" : "موجودی شمارش‌شده", kind: "number" }],
      onSubmit: (v) => { act.mutate({ path: `/store/products/${p.id}/stock`, body: { branchId, reason, quantity: Number(v.n) } }); },
    });
  const reprice = (p: Product) =>
    setDlg({
      title: `قیمت جدید: ${p.name}`,
      fields: [{ name: "price", label: "قیمت (تومان)", kind: "number", defaultValue: (BigInt(p.priceRial) / 10n).toString() }],
      onSubmit: (v) => {
        const priceRial = tomanInputToRial(v.price!);
        if (priceRial === null) return "قیمت را به عدد وارد کنید.";
        act.mutate({ path: `/store/products/${p.id}`, body: { priceRial } });
      },
    });
  const err = create.error as ApiError | null;

  return (
    <div className="space-y-6">
      <FormDialog request={dlg} onClose={() => setDlg(null)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/manager/store" className="btn-ghost -mr-3 mb-1 h-8 px-3 text-xs"><ArrowRight className="size-3.5" aria-hidden />فروش</Link>
          <h1 className="text-xl font-extrabold">کالاها و انبار</h1>
        </div>
        {allowed.length > 1 && (
          <select aria-label="شعبه" className="input h-9 w-auto" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {allowed.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      <section className="card space-y-3" aria-labelledby="new-title">
        <h2 id="new-title" className="card-title">کالای جدید</h2>
        <form className="grid gap-3 sm:grid-cols-4" noValidate onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div>
            <label htmlFor="kind" className="label">بخش</label>
            <select id="kind" className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
              {canBuffet && <option value="BUFFET">بوفه</option>}
              {canStore && <option value="STORE">فروشگاه</option>}
            </select>
          </div>
          <div>
            <label htmlFor="pname" className="label">نام کالا</label>
            <input id="pname" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="price" className="label">قیمت فروش (تومان)</label>
            <input id="price" inputMode="numeric" className="input ltr-nums" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
            {errors.priceRial && <p className="field-error">{errors.priceRial}</p>}
          </div>
          <div className="flex items-end gap-3">
            <label className="flex h-10 items-center gap-2 text-sm">
              <input type="checkbox" checked={f.trackStock} onChange={(e) => setF({ ...f, trackStock: e.target.checked })} />شمارش موجودی
            </label>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}افزودن
            </button>
          </div>
          {err && err.code !== "LOCAL" && !err.fields && <p role="alert" className="field-error sm:col-span-4">{err.message}</p>}
        </form>
      </section>

      <section className="card p-0" aria-labelledby="list-title">
        <h2 id="list-title" className="card-title p-5 pb-3">فهرست کالاها</h2>
        {products.isLoading ? <LoadingState /> : products.isError ? <ErrorState error={products.error} /> : products.data?.length === 0 ? <EmptyState title="هنوز کالایی ثبت نشده است" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-right text-xs text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">کالا</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">بخش</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">قیمت</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">موجودی این شعبه</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">عملیات</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.data?.map((p) => {
                  const can = p.kind === "STORE" ? canStore : canBuffet;
                  return (
                    <tr key={p.id} className={p.isActive ? "" : "opacity-60"}>
                      <td className="px-4 py-3 font-semibold">{p.name}{!p.isActive && " (غیرفعال)"}</td>
                      <td className="px-4 py-3">{KIND_LABEL[p.kind]}</td>
                      <td className="px-4 py-3">{toman(p.priceRial)}</td>
                      <td className={`px-4 py-3 ${p.trackStock && (p.quantity ?? 0) <= 3 ? "font-bold text-err-tx" : ""}`}>{p.trackStock ? toPersianDigits(p.quantity ?? 0) : "—"}</td>
                      <td className="px-4 py-3">
                        {can && (
                          <div className="flex flex-wrap gap-1">
                            {p.trackStock && <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => stock(p, "PURCHASE")}>ورود کالا</button>}
                            {p.trackStock && <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => stock(p, "ADJUST")}>شمارش</button>}
                            <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => reprice(p)}>قیمت</button>
                            <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => act.mutate({ path: `/store/products/${p.id}`, body: { isActive: !p.isActive } })}>{p.isActive ? "غیرفعال" : "فعال"}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {act.error && <p role="alert" className="field-error px-5 pb-3">{(act.error as ApiError).message}</p>}
      </section>
    </div>
  );
}
