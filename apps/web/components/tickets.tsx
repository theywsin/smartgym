"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Send } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { jdate } from "@/lib/client/format";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";
import { Field } from "@/components/field";

export type TicketStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type TicketRow = { id: string; subject: string; category: string; status: TicketStatus; lastMessageAt: string; memberName?: string | null; gym?: { name: string } | null };
type Thread = {
  id: string; subject: string; category: string; status: TicketStatus; gymName: string; member: { firstName: string; lastName: string; code: number } | null;
  messages: { id: string; side: "REQUESTER" | "SUPPORT"; body: string; createdAt: string; authorName: string | null }[];
};

const STATUS: Record<TicketStatus, { label: string; cls: string }> = {
  OPEN: { label: "در انتظار پاسخ", cls: "border-[#fde68a] bg-warn-bg text-warn-tx" },
  ANSWERED: { label: "پاسخ داده شد", cls: "border-brand-200 bg-brand-50 text-brand-700" },
  CLOSED: { label: "بسته", cls: "border-line bg-line-2 text-ink-2" },
};
export const TicketStatusChip = ({ s }: { s: TicketStatus }) => <span className={`chip text-xs font-semibold ${STATUS[s].cls}`}>{STATUS[s].label}</span>;
const time = (d: string) => new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }).format(new Date(d));

export function TicketList({ rows, hrefFor, empty, meta }: { rows: TicketRow[]; hrefFor: (id: string) => string; empty: string; meta?: (r: TicketRow) => string | null | undefined }) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <ul className="card divide-y divide-line p-0">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={hrefFor(r.id)} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-line-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{r.subject}</span>
              <span className="text-xs text-ink-2">{[meta?.(r), r.category].filter(Boolean).join("، ")}</span>
            </span>
            <span className="text-xs text-ink-3">{jdate(r.lastMessageAt)}</span>
            <TicketStatusChip s={r.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Conversation + reply box. `mySide` is the side the viewer writes as (their bubbles go to the start). */
export function TicketThread({ base, mySide, canClose, backHref }: { base: string; mySide: "REQUESTER" | "SUPPORT"; canClose: boolean; backHref: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ticket", base], queryFn: () => api<Thread>(base) });
  const [body, setBody] = useState("");
  const reply = useMutation({
    mutationFn: (text: string) => api<Thread>(`${base}/reply`, { method: "POST", body: { body: text } }),
    onSuccess: (t) => { setBody(""); qc.setQueryData(["ticket", base], t); void qc.invalidateQueries({ queryKey: ["tickets"] }); },
  });
  const close = useMutation({
    mutationFn: () => api(`${base}/close`, { method: "POST" }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["ticket", base] }); void qc.invalidateQueries({ queryKey: ["tickets"] }); },
  });
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const t = q.data;
  const blocked = t.status === "CLOSED" && mySide === "SUPPORT";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={backHref} className="text-xs text-ink-2">بازگشت به تیکت‌ها</Link>
          <h1 className="text-xl font-extrabold">{t.subject}</h1>
          <p className="text-sm text-ink-2">{[t.member ? `${t.member.firstName} ${t.member.lastName}` : t.gymName, t.category].join("، ")}</p>
        </div>
        <div className="flex items-center gap-2">
          <TicketStatusChip s={t.status} />
          {canClose && t.status !== "CLOSED" && <button type="button" className="btn-secondary h-8 text-sm" onClick={() => close.mutate()} disabled={close.isPending}>بستن تیکت</button>}
        </div>
      </div>
      <ol className="space-y-3" aria-label="پیام‌ها">
        {t.messages.map((m) => {
          const mine = m.side === mySide;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "bg-brand-50" : "border border-line bg-white"}`}>
                <p className="whitespace-pre-line text-sm">{m.body}</p>
                <p className="mt-1 text-xs text-ink-3">{mine ? "شما" : m.side === "SUPPORT" ? "پشتیبانی" : "درخواست‌کننده"}{m.authorName ? ` (${m.authorName})` : ""}، {jdate(m.createdAt)} {time(m.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {blocked ? (
        <p className="text-sm text-ink-2">این تیکت بسته شده است.</p>
      ) : (
        <form className="card space-y-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); reply.mutate(String(f.get("body") ?? "")); }}>
          <label htmlFor="reply" className="text-sm font-semibold">پاسخ{t.status === "CLOSED" ? " (تیکت دوباره باز می‌شود)" : ""}</label>
          <textarea id="reply" name="body" className="input min-h-24" value={body} onChange={(e) => setBody(e.target.value)} />
          {reply.isError && <p role="alert" className="field-error">{(reply.error as ApiError).message}</p>}
          <button className="btn-primary" disabled={reply.isPending}><Send className="size-4" aria-hidden /> ارسال</button>
        </form>
      )}
    </div>
  );
}

export function NewTicketForm({ endpoint, categories, onCreated }: { endpoint: string; categories: readonly string[]; onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (body: { subject: string; category: string; body: string }) => api<{ id: string }>(endpoint, { method: "POST", body }),
    onSuccess: (r) => { void qc.invalidateQueries({ queryKey: ["tickets"] }); onCreated(r.id); },
  });
  if (!open) return <button type="button" className="btn-primary" onClick={() => setOpen(true)}><MessageSquarePlus className="size-4" aria-hidden /> تیکت جدید</button>;
  const err = create.error as ApiError | null;
  return (
    <form className="card space-y-3" aria-label="تیکت جدید" onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      create.mutate({ subject: String(f.get("subject") ?? ""), category: String(f.get("category") ?? ""), body: String(f.get("body") ?? "") });
    }}>
      <Field label="موضوع" error={err?.fields?.subject?.[0]}><input name="subject" className="input" /></Field>
      <Field label="دسته‌بندی"><select name="category" className="input w-auto">{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="متن پیام" error={err?.fields?.body?.[0]}><textarea name="body" className="input min-h-28" /></Field>
      {err && !err.fields && <p role="alert" className="field-error">{err.message}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={create.isPending}>ارسال تیکت</button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>انصراف</button>
      </div>
    </form>
  );
}

export function useTickets(path: string) {
  return useQuery({ queryKey: ["tickets", path], queryFn: () => api<TicketRow[]>(path) });
}
