"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Archive, CheckCircle2, LogIn, Loader2, Pencil, RotateCcw } from "lucide-react";
import { formatIranMobile, isoDateToJalali, toPersianDigits } from "@smartgym/shared";
import type { MemberInput } from "@smartgym/validation";
import { api, ApiError } from "@/lib/client/api";
import { useCan, useMe } from "@/lib/client/me";
import { fa, jdate, toman, tomanInputToRial } from "@/lib/client/format";
import { FormDialog, type DialogRequest } from "@/components/form-dialog";
import { ErrorState, LoadingState } from "@/components/states";
import { MembershipBadge, type MembershipSummary } from "@/components/membership-badge";
import { MemberForm, applyServerFieldErrors, memberToForm } from "@/components/member-form";

type Sub = {
  id: string; planName: string; branchId: string | null; status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  startsAt: string; endsAt: string; entryLimit: number | null; entriesUsed: number;
  priceAmountRial: string; discountAmountRial: string; paidAmountRial: string; dueAmountRial: string; note: string | null;
};
type Member = {
  id: string; code: number; firstName: string; lastName: string; phone: string | null; gender: string | null;
  birthDate: string | null; nationalCode: string | null; homeBranchId: string | null; status: "ACTIVE" | "ARCHIVED";
  emergencyContact: { name?: string | null; phone?: string | null } | null; notes: string | null; hasApp: boolean;
  createdAt: string; membership: MembershipSummary; subscriptions: Sub[]; coach: { userId: string; name: string | null } | null;
  recentAttendance: { id: string; branchId: string; checkedInAt: string; checkedOutAt: string | null }[];
};
type Plan = { id: string; name: string; durationDays: number; priceAmountRial: string; entryLimit: number | null; allowedBranchIds: string[] };
type Branch = { id: string; name: string };
type CheckInResult = { daysLeft: number; entriesLeft: number | null; warning: string | null; planName: string };

const SUB_STATUS: Record<Sub["status"], string> = { ACTIVE: "فعال", SUSPENDED: "تعلیق", CANCELLED: "لغو شده" };

export default function MemberPage() {
  const { id } = useParams<{ id: string }>();
  const created = useSearchParams().get("created") === "1";
  const qc = useQueryClient();
  const me = useMe();
  const canUpdate = useCan("members.update");
  const canArchive = useCan("members.delete");
  const canSell = useCan("memberships.manage");
  const canCheckIn = useCan("attendance.manage");
  const [editing, setEditing] = useState(false);
  const setField = useRef<(f: string, m: string) => void>(() => {});

  const member = useQuery({ queryKey: ["member", id], queryFn: () => api<Member>(`/members/${id}`) });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const branchName = useMemo(() => new Map(branches.data?.map((b) => [b.id, b.name])), [branches.data]);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["member", id] });
    void qc.invalidateQueries({ queryKey: ["members"] });
    void qc.invalidateQueries({ queryKey: ["attendance"] });
    void qc.invalidateQueries({ queryKey: ["member-payments", id] });
    void qc.invalidateQueries({ queryKey: ["cash-report"] });
    void qc.invalidateQueries({ queryKey: ["debts"] });
  };

  const update = useMutation({
    mutationFn: (input: MemberInput) => api(`/members/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => { setEditing(false); refresh(); },
    onError: (e) => applyServerFieldErrors(e, setField.current),
  });
  const archive = useMutation({
    mutationFn: (archived: boolean) => api(`/members/${id}/${archived ? "archive" : "restore"}`, { method: "POST" }),
    onSuccess: refresh,
  });
  const subAction = useMutation({
    mutationFn: ({ subId, action }: { subId: string; action: "suspend" | "resume" | "cancel" }) =>
      api(`/memberships/${subId}/${action}`, { method: "POST", body: {} }),
    onSuccess: refresh,
  });

  if (member.isPending) return <LoadingState />;
  if (member.isError) return <ErrorState error={member.error} onRetry={() => member.refetch()} />;
  const m = member.data;
  const archived = m.status === "ARCHIVED";

  return (
    <div className="space-y-6">
      <Link href="/manager/members" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ArrowRight className="size-4" aria-hidden />
        اعضا
      </Link>

      {created && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700">
          <CheckCircle2 className="size-4" aria-hidden />
          عضو ثبت شد. حالا می‌توانید برایش اشتراک بفروشید.
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-700" aria-hidden>
            {m.firstName.slice(0, 1)}‌{m.lastName.slice(0, 1)}
          </span>
          <div>
            <h1 className="text-xl font-extrabold">{m.firstName} {m.lastName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-2">
              <span className="ltr-nums">SG-{fa(m.code)}</span>
              {archived ? <span className="chip">بایگانی‌شده</span> : <MembershipBadge m={m.membership} />}
              {m.hasApp && <span className="chip-brand">اپ ورزشکار</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCheckIn && !archived && <CheckInButton member={m} branches={branches.data ?? []} scoped={me.access?.branchIds ?? null} onDone={refresh} />}
          {canUpdate && !editing && (
            <button type="button" className="btn-secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden />
              ویرایش
            </button>
          )}
          {canArchive && (
            <button
              type="button"
              className="btn-ghost"
              disabled={archive.isPending}
              onClick={() => {
                if (archived || confirm("این عضو بایگانی شود؟ سوابق او حفظ می‌شود.")) archive.mutate(!archived);
              }}
            >
              {archived ? <RotateCcw className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
              {archived ? "بازگردانی" : "بایگانی"}
            </button>
          )}
        </div>
      </div>
      {(archive.error || subAction.error) && (
        <p role="alert" className="field-error">{((archive.error ?? subAction.error) as ApiError).message}</p>
      )}

      {editing ? (
        <MemberForm
          defaultValues={memberToForm(m)}
          submitLabel="ذخیره تغییرات"
          pending={update.isPending}
          serverError={update.error}
          onSubmit={(input, setFieldError) => {
            setField.current = setFieldError;
            update.mutate(input);
          }}
          onCancel={() => { setEditing(false); update.reset(); }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="card" aria-labelledby="current-title">
              <h2 id="current-title" className="card-title mb-3">اشتراک فعلی</h2>
              {m.membership.state === "none" ? (
                <p className="text-sm text-ink-2">این عضو هنوز اشتراکی ندارد.</p>
              ) : (
                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <Info label="پلن" value={m.membership.planName ?? "—"} />
                  <Info label="شروع" value={jdate(m.membership.startsAt)} />
                  <Info label="پایان" value={jdate(m.membership.endsAt)} />
                  <Info
                    label="باقی‌مانده"
                    value={
                      m.membership.state === "expired"
                        ? "تمام شده"
                        : `${fa(m.membership.daysLeft ?? 0)} روز${m.membership.entriesLeft !== null ? `، ${fa(m.membership.entriesLeft)} جلسه` : ""}`
                    }
                  />
                </dl>
              )}
            </section>

            {canSell && !archived && <SellCard member={m} branches={branches.data ?? []} scoped={me.access?.branchIds ?? null} onDone={refresh} />}

            <section className="card p-0" aria-labelledby="subs-title">
              <h2 id="subs-title" className="card-title p-5 pb-3">سابقه اشتراک‌ها</h2>
              {m.subscriptions.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-ink-2">سابقه‌ای ثبت نشده است.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-canvas text-right text-xs text-ink-2">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-semibold">پلن</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">دوره</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">جلسات</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">مبلغ</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">وضعیت</th>
                        {canSell && <th scope="col" className="px-4 py-2.5"><span className="sr-only">عملیات</span></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {m.subscriptions.map((s) => {
                        const ended = new Date(s.endsAt).getTime() <= Date.now();
                        const net = BigInt(s.priceAmountRial) - BigInt(s.discountAmountRial);
                        return (
                          <tr key={s.id}>
                            <td className="px-4 py-3 font-semibold whitespace-nowrap">{s.planName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{jdate(s.startsAt)} تا {jdate(s.endsAt)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{s.entryLimit === null ? "نامحدود" : `${fa(s.entriesUsed)} از ${fa(s.entryLimit)}`}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {toman(net)}
                              {s.discountAmountRial !== "0" && <span className="block text-xs text-ink-3">تخفیف {toman(s.discountAmountRial)}</span>}
                              {BigInt(s.dueAmountRial) > 0n && s.status !== "CANCELLED" && (
                                <span className="block text-xs font-semibold text-err-tx">بدهی {toman(s.dueAmountRial)}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{s.status === "ACTIVE" && ended ? "پایان یافته" : SUB_STATUS[s.status]}</td>
                            {canSell && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex gap-1">
                                  {BigInt(s.dueAmountRial) > 0n && s.status !== "CANCELLED" && (
                                    <>
                                      <PayDueButton sub={s} onDone={refresh} />
                                      <PayLinkButton sub={s} />
                                    </>
                                  )}
                                  {s.status === "ACTIVE" && !ended && (
                                    <button type="button" className="btn-ghost h-8 px-2 text-xs" disabled={subAction.isPending}
                                      onClick={() => confirm("اشتراک تعلیق شود؟ روزهای تعلیق هنگام ادامه به انتهای دوره اضافه می‌شود.") && subAction.mutate({ subId: s.id, action: "suspend" })}>
                                      تعلیق
                                    </button>
                                  )}
                                  {s.status === "SUSPENDED" && (
                                    <button type="button" className="btn-ghost h-8 px-2 text-xs" disabled={subAction.isPending}
                                      onClick={() => subAction.mutate({ subId: s.id, action: "resume" })}>
                                      ادامه
                                    </button>
                                  )}
                                  {s.status !== "CANCELLED" && !ended && (
                                    <button type="button" className="btn-ghost h-8 px-2 text-xs text-err-tx" disabled={subAction.isPending}
                                      onClick={() => confirm("این اشتراک لغو شود؟ بازگشت وجه جداگانه از فهرست پرداخت‌ها ثبت می‌شود.") && subAction.mutate({ subId: s.id, action: "cancel" })}>
                                      لغو
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="card" aria-labelledby="profile-title">
              <h2 id="profile-title" className="card-title mb-3">مشخصات</h2>
              <dl className="space-y-3 text-sm">
                <Info label="موبایل" value={m.phone ? <span className="ltr-nums">{toPersianDigits(formatIranMobile(m.phone))}</span> : "—"} />
                <Info label="شعبه" value={m.homeBranchId ? branchName.get(m.homeBranchId) ?? "—" : "—"} />
                <Info label="تاریخ تولد" value={m.birthDate ? toPersianDigits(isoDateToJalali(m.birthDate)) : "—"} />
                <Info label="کد ملی" value={m.nationalCode ? <span className="ltr-nums">{toPersianDigits(m.nationalCode)}</span> : "—"} />
                <Info
                  label="تماس اضطراری"
                  value={m.emergencyContact ? [m.emergencyContact.name, m.emergencyContact.phone && toPersianDigits(formatIranMobile(m.emergencyContact.phone))].filter(Boolean).join("، ") : "—"}
                />
                <Info label="عضویت از" value={jdate(m.createdAt)} />
                {m.notes && <Info label="یادداشت" value={<span className="whitespace-pre-line">{m.notes}</span>} />}
              </dl>
            </section>
            <PaymentsCard memberId={m.id} onDone={refresh} />
            <CoachCard member={m} onDone={refresh} />
            <NotesCard memberId={m.id} canAdd={canUpdate && !archived} />
            <section className="card" aria-labelledby="visits-title">
              <h2 id="visits-title" className="card-title mb-3">آخرین ورودها</h2>
              {m.recentAttendance.length === 0 ? (
                <p className="text-sm text-ink-2">ورودی ثبت نشده است.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {m.recentAttendance.map((a) => (
                    <li key={a.id} className="flex justify-between gap-2">
                      <span>{jdate(a.checkedInAt)}</span>
                      <span className="text-ink-2">{branchName.get(a.branchId) ?? ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

function SellCard({ member, branches, scoped, onDone }: { member: Member; branches: Branch[]; scoped: string[] | null; onDone: () => void }) {
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => api<Plan[]>("/memberships/plans") });
  const allowed = scoped ? branches.filter((b) => scoped.includes(b.id)) : branches;
  const [planId, setPlanId] = useState("");
  const [branchId, setBranchId] = useState(member.homeBranchId ?? allowed[0]?.id ?? "");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [paid, setPaid] = useState("");
  const [method, setMethod] = useState<PayMethod>("CARD_POS");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const plan = plans.data?.find((p) => p.id === planId);
  const discountRial = discount.trim() ? tomanInputToRial(discount) : "0";
  const payable = plan && discountRial !== null && BigInt(discountRial) <= BigInt(plan.priceAmountRial) ? BigInt(plan.priceAmountRial) - BigInt(discountRial) : null;
  const paidRial = paid.trim() === "" ? (payable !== null ? payable.toString() : "0") : tomanInputToRial(paid);
  const renew = member.membership.state === "active" || member.membership.state === "upcoming" || member.membership.state === "exhausted";

  const sell = useMutation({
    mutationFn: () =>
      api("/memberships", {
        method: "POST",
        body: {
          memberId: member.id, planId, branchId: branchId || undefined, discountAmountRial: discountRial ?? "0", note: note || undefined,
          payment: paidRial && paidRial !== "0" ? { amountRial: paidRial, method, reference: reference || undefined } : undefined,
        },
      }),
    onSuccess: () => { setPlanId(""); setDiscount(""); setNote(""); setPaid(""); setReference(""); setError(null); onDone(); },
    onError: (e) => setError(e instanceof ApiError ? Object.values(e.fields ?? {})[0]?.[0] ?? e.message : "خطا در ثبت"),
  });

  return (
    <section className="card space-y-4" aria-labelledby="sell-title">
      <div>
        <h2 id="sell-title" className="card-title">{renew ? "تمدید اشتراک" : "فروش اشتراک"}</h2>
        {renew && <p className="text-xs text-ink-2">دوره جدید از پایان اشتراک فعلی شروع می‌شود.</p>}
      </div>
      {plans.data?.length === 0 ? (
        <p className="text-sm text-ink-2">
          هنوز پلنی تعریف نشده است. <Link href="/manager/plans" className="font-semibold text-brand-700 hover:underline">تعریف پلن</Link>
        </p>
      ) : (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!planId) return setError("پلن را انتخاب کنید.");
            if (discountRial === null) return setError("مبلغ تخفیف را به عدد وارد کنید.");
            if (paidRial === null) return setError("مبلغ دریافتی را به عدد وارد کنید.");
            sell.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="sell-plan">پلن</label>
              <select id="sell-plan" className="input" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                <option value="">انتخاب کنید</option>
                {plans.data?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}، {toman(p.priceAmountRial)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sell-branch">شعبه فروش</label>
              <select id="sell-branch" className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {!scoped && <option value="">—</option>}
                {allowed.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sell-discount">تخفیف (تومان)</label>
              <input id="sell-discount" className="input ltr-nums text-left" inputMode="numeric" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="sell-note">توضیح</label>
            <input id="sell-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: پرداخت نقدی در پذیرش" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="sell-paid">مبلغ دریافتی (تومان)</label>
              <input id="sell-paid" className="input ltr-nums text-left" inputMode="numeric" placeholder={payable !== null ? (payable / 10n).toString() : "0"} value={paid} onChange={(e) => setPaid(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="sell-method">روش پرداخت</label>
              <select id="sell-method" className="input" value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
                {PAY_METHODS.map((m) => <option key={m} value={m}>{PAY_LABEL[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sell-ref">شماره پیگیری</label>
              <input id="sell-ref" className="input ltr-nums text-left" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>
          {plan && (
            <p className="rounded-lg bg-canvas p-3 text-sm">
              {fa(plan.durationDays)} روز
              {plan.entryLimit !== null && `، ${fa(plan.entryLimit)} جلسه`}
              {"، "}
              مبلغ قابل پرداخت:{" "}
              <strong>{discountRial !== null && BigInt(discountRial) <= BigInt(plan.priceAmountRial) ? toman(BigInt(plan.priceAmountRial) - BigInt(discountRial)) : "—"}</strong>
            </p>
          )}
          {error && <p role="alert" className="field-error">{error}</p>}
          <p className="text-xs text-ink-3">خالی گذاشتن مبلغ دریافتی یعنی کل مبلغ دریافت شد؛ برای ثبت بدهی، مبلغ کمتر (یا ۰) وارد کنید.</p>
          <button type="submit" className="btn-primary" disabled={sell.isPending}>
            {sell.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {renew ? "ثبت تمدید" : "ثبت اشتراک"}
          </button>
        </form>
      )}
    </section>
  );
}

function CheckInButton({ member, branches, scoped, onDone }: { member: Member; branches: Branch[]; scoped: string[] | null; onDone: () => void }) {
  const allowed = scoped ? branches.filter((b) => scoped.includes(b.id)) : branches;
  const [branchId, setBranchId] = useState("");
  const chosen = branchId || member.homeBranchId && allowed.find((b) => b.id === member.homeBranchId)?.id || allowed[0]?.id || "";
  const [result, setResult] = useState<CheckInResult | null>(null);
  const check = useMutation({
    mutationFn: () => api<CheckInResult>("/attendance/check-in", { method: "POST", body: { memberId: member.id, branchId: chosen } }),
    onSuccess: (r) => { setResult(r); onDone(); },
  });
  return (
    <div className="flex flex-wrap items-center gap-2">
      {allowed.length > 1 && (
        <select aria-label="شعبه ورود" className="input h-10 w-auto" value={chosen} onChange={(e) => setBranchId(e.target.value)}>
          {allowed.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )}
      <button type="button" className="btn-primary" disabled={check.isPending || !chosen} onClick={() => { setResult(null); check.mutate(); }}>
        {check.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
        ثبت ورود
      </button>
      <span role="status" className="w-full text-sm">
        {check.error && <span className="text-err-tx">{(check.error as ApiError).message}</span>}
        {result && (
          <span className="text-brand-700">
            ورود ثبت شد. {result.warning ?? ""}
          </span>
        )}
      </span>
    </div>
  );
}

type Coach = { userId: string; firstName: string | null; lastName: string | null };

function CoachCard({ member, onDone }: { member: Member; onDone: () => void }) {
  const canRead = useCan("coaches.read");
  const canManage = useCan("coaches.manage");
  const coaches = useQuery({ queryKey: ["coaches"], queryFn: () => api<Coach[]>("/coaches"), enabled: canManage });
  const assign = useMutation({
    mutationFn: (coachUserId: string | null) => api(`/members/${member.id}/coach`, { method: "POST", body: { coachUserId } }),
    onSuccess: onDone,
  });
  if (!canRead && !member.coach) return null;
  return (
    <section className="card space-y-3" aria-labelledby="coach-title">
      <h2 id="coach-title" className="card-title">مربی</h2>
      {canManage && member.status === "ACTIVE" ? (
        <select
          aria-label="انتخاب مربی"
          className="input"
          value={member.coach?.userId ?? ""}
          disabled={assign.isPending || coaches.isPending}
          onChange={(e) => assign.mutate(e.target.value || null)}
        >
          <option value="">بدون مربی</option>
          {coaches.data?.map((c) => (
            <option key={c.userId} value={c.userId}>{[c.firstName, c.lastName].filter(Boolean).join(" ") || "بی‌نام"}</option>
          ))}
        </select>
      ) : (
        <p className="text-sm font-semibold">{member.coach?.name ?? "—"}</p>
      )}
      {assign.error && <p role="alert" className="field-error">{(assign.error as ApiError).message}</p>}
    </section>
  );
}

type Note = { id: string; body: string; createdAt: string; authorName: string | null };

function NotesCard({ memberId, canAdd }: { memberId: string; canAdd: boolean }) {
  const qc = useQueryClient();
  const notes = useQuery({ queryKey: ["member-notes", memberId], queryFn: () => api<Note[]>(`/members/${memberId}/notes`) });
  const [text, setText] = useState("");
  const add = useMutation({
    mutationFn: () => api(`/members/${memberId}/notes`, { method: "POST", body: { body: text } }),
    onSuccess: () => { setText(""); void qc.invalidateQueries({ queryKey: ["member-notes", memberId] }); },
  });
  return (
    <section className="card space-y-3" aria-labelledby="notes-title">
      <h2 id="notes-title" className="card-title">یادداشت‌ها</h2>
      {canAdd && (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) add.mutate(); }}>
          <label className="sr-only" htmlFor="note-body">یادداشت جدید</label>
          <textarea id="note-body" rows={2} className="input h-auto py-2" placeholder="مثلاً: آسیب زانو، تمرین سبک" value={text} onChange={(e) => setText(e.target.value)} />
          {add.error && <p role="alert" className="field-error">{(add.error as ApiError).message}</p>}
          <button type="submit" className="btn-secondary h-8 px-3 text-xs" disabled={add.isPending || !text.trim()}>افزودن یادداشت</button>
        </form>
      )}
      {notes.data?.length === 0 && <p className="text-sm text-ink-2">یادداشتی ثبت نشده است.</p>}
      <ul className="space-y-3">
        {notes.data?.map((n) => (
          <li key={n.id} className="border-t border-line pt-3 text-sm first:border-0 first:pt-0">
            <p className="whitespace-pre-line">{n.body}</p>
            <p className="mt-1 text-xs text-ink-3">{n.authorName ?? "همکار"}، {jdate(n.createdAt)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

type PayMethod = "CASH" | "CARD_POS" | "TRANSFER";
const PAY_METHODS: PayMethod[] = ["CARD_POS", "CASH", "TRANSFER"];
const PAY_LABEL: Record<string, string> = { CASH: "نقد", CARD_POS: "کارت‌خوان", TRANSFER: "کارت به کارت", ONLINE: "درگاه آنلاین" };

function PayDueButton({ sub, onDone }: { sub: Sub; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PayMethod>("CARD_POS");
  const key = useRef(crypto.randomUUID());
  const pay = useMutation({
    mutationFn: () => {
      const rial = amount.trim() ? tomanInputToRial(amount) : sub.dueAmountRial;
      if (rial === null) throw new ApiError(400, "BAD", "مبلغ را به عدد وارد کنید.");
      return api("/payments", { method: "POST", body: { subscriptionId: sub.id, amountRial: rial, method } , idempotencyKey: key.current });
    },
    onSuccess: () => { setOpen(false); setAmount(""); key.current = crypto.randomUUID(); onDone(); },
  });
  if (!open) return <button type="button" className="btn-ghost h-8 px-2 text-xs text-brand-700" onClick={() => setOpen(true)}>دریافت</button>;
  return (
    <form className="flex flex-wrap items-center gap-1" onSubmit={(e) => { e.preventDefault(); pay.mutate(); }}>
      <input aria-label="مبلغ (تومان)" className="input h-8 w-28 text-xs ltr-nums" placeholder={(BigInt(sub.dueAmountRial) / 10n).toString()} value={amount} onChange={(e) => setAmount(e.target.value)} />
      <select aria-label="روش پرداخت" className="input h-8 w-auto text-xs" value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
        {PAY_METHODS.map((m) => <option key={m} value={m}>{PAY_LABEL[m]}</option>)}
      </select>
      <button type="submit" className="btn-primary h-8 px-2 text-xs" disabled={pay.isPending}>ثبت</button>
      {pay.error && <span className="w-full text-xs text-err-tx">{(pay.error as ApiError).message}</span>}
    </form>
  );
}

function PayLinkButton({ sub }: { sub: Sub }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const create = useMutation({
    mutationFn: () => api<{ url: string }>("/payments/links", { method: "POST", body: { subscriptionId: sub.id } }),
    onSuccess: (r) => { setUrl(r.url); void qc.invalidateQueries({ queryKey: ["payment-links"] }); },
  });
  if (url) {
    return (
      <span className="flex items-center gap-1">
        <input readOnly aria-label="لینک پرداخت" className="input h-8 w-44 text-left text-xs ltr-nums" value={url} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => { void navigator.clipboard?.writeText(url).then(() => setCopied(true)); }}>
          {copied ? "کپی شد" : "کپی"}
        </button>
      </span>
    );
  }
  return (
    <span className="flex flex-col">
      <button type="button" className="btn-ghost h-8 px-2 text-xs" disabled={create.isPending} onClick={() => create.mutate()}
        title="لینکی می‌سازد که عضو با آن بدهی را از درگاه بانک سامان پرداخت کند">
        لینک پرداخت
      </button>
      {create.error && <span className="max-w-56 text-xs text-err-tx">{(create.error as ApiError).message}</span>}
    </span>
  );
}

type PaymentRow = { id: string; amountRial: string; refundedAmountRial: string; method: string; reference: string | null; paidAt: string };

function PaymentsCard({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const qc = useQueryClient();
  const canRefund = useCan("finance.manage");
  const payments = useQuery({ queryKey: ["member-payments", memberId], queryFn: () => api<PaymentRow[]>(`/members/${memberId}/payments`) });
  const [dlg, setDlg] = useState<DialogRequest | null>(null);
  const refund = useMutation({
    mutationFn: ({ id, amountRial, reason }: { id: string; amountRial: string; reason: string }) =>
      api(`/payments/${id}/refund`, { method: "POST", body: { amountRial, method: "CASH", reason } }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["member-payments", memberId] }); onDone(); },
  });
  return (
    <section className="card space-y-3" aria-labelledby="payments-title">
      <h2 id="payments-title" className="card-title">پرداخت‌ها</h2>
      {payments.data?.length === 0 && <p className="text-sm text-ink-2">پرداختی ثبت نشده است.</p>}
      <ul className="space-y-2 text-sm">
        {payments.data?.map((p) => {
          const left = BigInt(p.amountRial) - BigInt(p.refundedAmountRial);
          return (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>{toman(p.amountRial)}</strong> <span className="text-ink-2">{PAY_LABEL[p.method] ?? p.method}، {jdate(p.paidAt)}</span>
                {p.refundedAmountRial !== "0" && <span className="block text-xs text-err-tx">بازگشت {toman(p.refundedAmountRial)}</span>}
              </span>
              {canRefund && left > 0n && (
                <button
                  type="button"
                  className="btn-ghost h-7 px-2 text-xs text-err-tx"
                  disabled={refund.isPending}
                  onClick={() => setDlg({
                    title: "بازگشت وجه",
                    description: `پرداخت ${toman(p.amountRial)}؛ حداکثر قابل بازگشت ${toman(left.toString())}`,
                    fields: [
                      { name: "amount", label: "مبلغ بازگشت (تومان)", kind: "number", defaultValue: (left / 10n).toString() },
                      { name: "reason", label: "دلیل بازگشت" },
                    ],
                    confirmLabel: "ثبت بازگشت وجه",
                    danger: true,
                    onSubmit: (v) => {
                      const rial = tomanInputToRial(v.amount!);
                      if (!rial || BigInt(rial) <= 0n) return "مبلغ معتبر نیست.";
                      if (BigInt(rial) > left) return "مبلغ از باقی‌مانده‌ی قابل بازگشت بیشتر است.";
                      refund.mutate({ id: p.id, amountRial: rial, reason: v.reason! });
                    },
                  })}
                >
                  بازگشت وجه
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {refund.error && <p role="alert" className="field-error">{(refund.error as ApiError).message}</p>}
      <FormDialog request={dlg} onClose={() => setDlg(null)} />
    </section>
  );
}
