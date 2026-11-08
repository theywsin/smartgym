"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Download, FileUp, Loader2 } from "lucide-react";
import { toPersianDigits } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { useCan } from "@/lib/client/me";
import { ErrorState } from "@/components/states";

type Report = { imported: number; dryRun: boolean; totalRows: number; errors: { row: number; field: string | null; message: string }[] };

const TEMPLATE = "﻿نام,نام خانوادگی,موبایل,جنسیت,تاریخ تولد,کد ملی,شعبه,یادداشت\r\nسارا,محمدی,09123456789,زن,1375/02/10,,شعبه اصلی,\r\n";

/** Excel saves "CSV" as Windows-1256 on Persian systems and "CSV UTF-8" as UTF-8; accept both. */
async function readCsv(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1256").decode(buf);
  }
}

export default function ImportMembersPage() {
  const qc = useQueryClient();
  const canCreate = useCan("members.create");
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const run = useMutation({
    mutationFn: ({ dryRun }: { dryRun: boolean }) => api<Report>(`/members/import${dryRun ? "?dryRun=1" : ""}`, { method: "POST", csv: file!.text }),
    onSuccess: (r) => {
      if (!r.dryRun && r.imported > 0) void qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
  const report = run.data;

  if (!canCreate) return <ErrorState error={new ApiError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.")} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/manager/members" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ArrowRight className="size-4" aria-hidden />
        اعضا
      </Link>
      <div>
        <h1 className="page-title">ورود گروهی اعضا</h1>
        <p className="text-sm text-ink-2">
          فایل CSV (از اکسل: «ذخیره به‌عنوان CSV») با ستون‌های نام و نام خانوادگی؛ بقیه ستون‌ها اختیاری است. ابتدا فایل بررسی می‌شود و اگر حتی یک سطر خطا داشته باشد، هیچ عضوی ثبت نمی‌شود.
        </p>
      </div>

      <section className="card space-y-4">
        <a className="btn-secondary w-fit" href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="smartgym-members-template.csv">
          <Download className="size-4" aria-hidden />
          دریافت فایل نمونه
        </a>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line p-8 text-center hover:border-brand-200">
          <FileUp className="size-8 text-ink-3" aria-hidden />
          <span className="font-semibold">{file ? file.name : "انتخاب فایل CSV"}</span>
          <span className="text-xs text-ink-3">حداکثر ۲٬۰۰۰ عضو در هر فایل</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              run.reset();
              setFile(f ? { name: f.name, text: await readCsv(f) } : null);
              e.target.value = "";
            }}
          />
        </label>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" disabled={!file || run.isPending} onClick={() => run.mutate({ dryRun: true })}>
            {run.isPending && run.variables?.dryRun && <Loader2 className="size-4 animate-spin" aria-hidden />}
            بررسی فایل
          </button>
        </div>
        {run.error && <p role="alert" className="field-error">{(run.error as ApiError).message}</p>}
      </section>

      {report && (
        <section className="card space-y-4" aria-live="polite">
          {!report.dryRun && report.imported > 0 ? (
            <p className="flex items-center gap-2 font-semibold text-brand-700">
              <CheckCircle2 className="size-5" aria-hidden />
              {toPersianDigits(report.imported)} عضو ثبت شد.
              <Link href="/manager/members" className="underline">مشاهده اعضا</Link>
            </p>
          ) : report.errors.length === 0 ? (
            <div className="space-y-3">
              <p className="font-semibold">{toPersianDigits(report.totalRows)} سطر بدون خطا است و آماده ثبت است.</p>
              <button type="button" className="btn-primary" disabled={run.isPending} onClick={() => run.mutate({ dryRun: false })}>
                {run.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                ثبت {toPersianDigits(report.totalRows)} عضو
              </button>
            </div>
          ) : (
            <>
              <p className="font-semibold text-err-tx">
                {toPersianDigits(report.errors.length)} خطا در {toPersianDigits(new Set(report.errors.map((e) => e.row)).size)} سطر. فایل را اصلاح کنید و دوباره بارگذاری کنید؛ چیزی ثبت نشد.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-canvas text-right text-xs text-ink-2">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-semibold">سطر</th>
                      <th scope="col" className="px-3 py-2 font-semibold">ستون</th>
                      <th scope="col" className="px-3 py-2 font-semibold">خطا</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {report.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{toPersianDigits(e.row)}</td>
                        <td className="px-3 py-2">{e.field ?? "—"}</td>
                        <td className="px-3 py-2">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
