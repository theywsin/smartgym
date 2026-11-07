"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, MapPin, Plus } from "lucide-react";
import { createBranchSchema } from "@smartgym/validation";
import { api, ApiError } from "@/lib/client/api";
import { useCan } from "@/lib/client/me";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

type Branch = { id: string; name: string; address: string | null; phone: string | null; isActive: boolean };
type FormIn = z.input<typeof createBranchSchema>;
type FormOut = z.output<typeof createBranchSchema>;

export default function BranchesPage() {
  const qc = useQueryClient();
  const canManage = useCan("branches.manage");
  const [formOpen, setFormOpen] = useState(false);
  const list = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });

  const form = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(createBranchSchema) });
  const create = useMutation({
    mutationFn: (v: FormOut) => api<Branch>("/branches", { method: "POST", body: v }),
    onSuccess: () => {
      form.reset();
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">شعب</h1>
          <p className="text-sm text-ink-2">شعبه‌های باشگاه و اطلاعات تماس آن‌ها</p>
        </div>
        {canManage && !formOpen && (
          <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden />
            شعبه جدید
          </button>
        )}
      </div>

      {formOpen && (
        <form
          className="card space-y-4"
          noValidate
          onSubmit={form.handleSubmit((v) => create.mutate(v))}
          aria-labelledby="new-branch-title"
        >
          <h2 id="new-branch-title" className="card-title">شعبه جدید</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="b-name">نام شعبه</label>
              <input id="b-name" className="input" aria-invalid={!!form.formState.errors.name} {...form.register("name")} />
              {form.formState.errors.name && <p className="field-error">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="b-phone">تلفن</label>
              <input id="b-phone" className="input ltr-nums text-left" inputMode="tel" {...form.register("phone", { setValueAs: (v) => v || undefined })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="b-address">نشانی</label>
              <input id="b-address" className="input" {...form.register("address", { setValueAs: (v) => v || undefined })} />
            </div>
          </div>
          {create.error && <p role="alert" className="field-error">{create.error instanceof ApiError ? create.error.message : "خطا در ذخیره"}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              ذخیره شعبه
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setFormOpen(false); create.reset(); }}>
              انصراف
            </button>
          </div>
        </form>
      )}

      {list.isPending && <LoadingState />}
      {list.isError && <ErrorState error={list.error} onRetry={() => list.refetch()} />}
      {list.data && list.data.length === 0 && <EmptyState title="هنوز شعبه‌ای ثبت نشده است" />}
      {list.data && list.data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((b) => (
            <li key={b.id} className="card">
              <div className="mb-2 flex items-center gap-2">
                <Building2 className="size-5 text-brand-700" aria-hidden />
                <h3 className="font-bold">{b.name}</h3>
                {!b.isActive && <span className="chip">غیرفعال</span>}
              </div>
              {b.address && (
                <p className="flex items-start gap-1.5 text-sm text-ink-2">
                  <MapPin className="mt-0.5 size-4 flex-none" aria-hidden />
                  {b.address}
                </p>
              )}
              {b.phone && <p className="ltr-nums mt-1 text-right text-sm text-ink-2">{b.phone}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
