"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Search, Upload, UserPlus, X } from "lucide-react";
import { formatIranMobile, toPersianDigits } from "@smartgym/shared";
import { api } from "@/lib/client/api";
import { useCan } from "@/lib/client/me";
import { jdate } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { MembershipBadge, type MembershipSummary } from "@/components/membership-badge";

type Row = {
  id: string;
  code: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  homeBranchId: string | null;
  membership: MembershipSummary;
  coach: { userId: string; name: string | null } | null;
};
type ListResponse = {
  items: Row[];
  total: number;
  page: number;
  pageSize: number;
  counts: { all: number; active: number; expiring: number; expired: number; suspended: number };
};
type Branch = { id: string; name: string };
type Coach = { userId: string; firstName: string | null; lastName: string | null };

const TABS = [
  { key: "", label: "همه", count: "all" },
  { key: "active", label: "فعال", count: "active" },
  { key: "expiring", label: "رو به اتمام", count: "expiring" },
  { key: "expired", label: "منقضی", count: "expired" },
  { key: "suspended", label: "تعلیق", count: "suspended" },
] as const;

export default function MembersPageWrapper() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MembersPage />
    </Suspense>
  );
}

function MembersPage() {
  const router = useRouter();
  const coachFilter = useSearchParams().get("coach") ?? "";
  const canCreate = useCan("members.create");
  const canExport = useCan("members.export");
  const canCoaches = useCan("coaches.read");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [debounced, tab, archived, coachFilter]);

  const params = new URLSearchParams({ page: String(page), pageSize: "25", status: archived ? "ARCHIVED" : "ACTIVE" });
  if (debounced) params.set("q", debounced);
  if (tab) params.set("membership", tab);
  if (coachFilter) params.set("coachUserId", coachFilter);
  const coaches = useQuery({ queryKey: ["coaches"], queryFn: () => api<Coach[]>("/coaches"), enabled: canCoaches });
  const setCoach = (id: string) => router.replace(id ? `/manager/members?coach=${id}` : "/manager/members");
  const list = useQuery({
    queryKey: ["members", params.toString()],
    queryFn: () => api<ListResponse>(`/members?${params}`),
    placeholderData: keepPreviousData,
  });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const branchName = useMemo(() => new Map(branches.data?.map((b) => [b.id, b.name])), [branches.data]);
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">اعضا</h1>
          <p className="text-sm text-ink-2">
            {list.data ? `${toPersianDigits(list.data.counts.active)} عضو با اشتراک فعال` : " "}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canExport && (
            <a href="/api/v1/members/export" className="btn-secondary" download>
              <Download className="size-4" aria-hidden />
              خروجی اکسل
            </a>
          )}
          {canCreate && (
            <Link href="/manager/members/import" className="btn-secondary">
              <Upload className="size-4" aria-hidden />
              ورود گروهی
            </Link>
          )}
          {canCreate && (
            <Link href="/manager/members/new" className="btn-primary">
              <UserPlus className="size-4" aria-hidden />
              افزودن عضو
            </Link>
          )}
        </div>
      </div>

      <div className="card p-0">
        <div className="flex flex-wrap gap-1 border-b border-line px-3 pt-2" role="tablist" aria-label="وضعیت اشتراک">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px flex h-10 items-center gap-1.5 border-b-2 px-3 text-sm whitespace-nowrap ${
                tab === t.key ? "border-brand-600 font-bold text-brand-700" : "border-transparent text-ink-2 hover:text-ink"
              }`}
            >
              {t.label}
              {list.data && <span className="rounded-full bg-line-2 px-1.5 text-xs">{toPersianDigits(list.data.counts[t.count])}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <label className="relative block w-full max-w-sm">
            <span className="sr-only">جستجو</span>
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input className="input pr-9" placeholder="نام، موبایل یا کد عضویت" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          {canCoaches && (coaches.data?.length ?? 0) > 0 && (
            <label className="flex items-center gap-2 text-sm text-ink-2">
              مربی
              <select className="input h-10 w-auto" value={coachFilter} onChange={(e) => setCoach(e.target.value)}>
                <option value="">همه</option>
                {coaches.data?.map((c) => (
                  <option key={c.userId} value={c.userId}>{[c.firstName, c.lastName].filter(Boolean).join(" ") || "بی‌نام"}</option>
                ))}
              </select>
              {coachFilter && (
                <button type="button" className="btn-ghost h-8 px-2" onClick={() => setCoach("")} aria-label="حذف فیلتر مربی">
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" className="accent-brand-600" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            نمایش بایگانی‌شده‌ها
          </label>
        </div>

        {list.isPending && <LoadingState />}
        {list.isError && <div className="p-4"><ErrorState error={list.error} onRetry={() => list.refetch()} /></div>}
        {list.data && list.data.items.length === 0 && (
          <EmptyState
            title={debounced || tab || coachFilter ? "عضوی با این مشخصات پیدا نشد" : "هنوز عضوی ثبت نشده است"}
            hint={!debounced && !tab && canCreate ? "اولین عضو باشگاه را ثبت کنید تا بتوانید برایش اشتراک بفروشید." : undefined}
            action={!debounced && !tab && canCreate ? <Link href="/manager/members/new" className="btn-primary">افزودن عضو</Link> : undefined}
          />
        )}
        {list.data && list.data.items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-right text-xs text-ink-2">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">عضو</th>
                    <th scope="col" className="px-4 py-3 font-semibold">موبایل</th>
                    <th scope="col" className="px-4 py-3 font-semibold">پلن</th>
                    <th scope="col" className="px-4 py-3 font-semibold">وضعیت</th>
                    <th scope="col" className="px-4 py-3 font-semibold">مربی</th>
                    <th scope="col" className="px-4 py-3 font-semibold">شعبه</th>
                    <th scope="col" className="px-4 py-3 font-semibold">انقضا</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {list.data.items.map((m) => (
                    <tr key={m.id} className="hover:bg-canvas">
                      <td className="px-4 py-3">
                        <Link href={`/manager/members/${m.id}`} className="flex items-center gap-3">
                          <span className="flex size-9 flex-none items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700" aria-hidden>
                            {m.firstName.slice(0, 1)}‌{m.lastName.slice(0, 1)}
                          </span>
                          <span>
                            <span className="block font-semibold text-ink">{m.firstName} {m.lastName}</span>
                            <span className="ltr-nums block text-xs text-ink-3">SG-{toPersianDigits(m.code)}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{m.phone ? <span className="ltr-nums">{toPersianDigits(formatIranMobile(m.phone))}</span> : "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{m.membership.planName ?? "—"}</td>
                      <td className="px-4 py-3"><MembershipBadge m={m.membership} /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-2">{m.coach?.name ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-2">{m.homeBranchId ? branchName.get(m.homeBranchId) ?? "—" : "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{jdate(m.membership.endsAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-line p-3 text-sm">
                <span className="text-ink-2">صفحه {toPersianDigits(page)} از {toPersianDigits(pages)}</span>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary h-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="صفحه قبل">
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                  <button type="button" className="btn-secondary h-8 px-2" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="صفحه بعد">
                    <ChevronLeft className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
