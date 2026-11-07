"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MemberInput } from "@smartgym/validation";
import { api } from "@/lib/client/api";
import { MemberForm, applyServerFieldErrors } from "@/components/member-form";

export default function NewMemberPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const setField = useRef<(f: string, m: string) => void>(() => {});
  const create = useMutation({
    mutationFn: (input: MemberInput) => api<{ id: string }>("/members", { method: "POST", body: input }),
    onSuccess: (m) => {
      void qc.invalidateQueries({ queryKey: ["members"] });
      router.push(`/manager/members/${m.id}?created=1`);
    },
    onError: (e) => applyServerFieldErrors(e, setField.current),
  });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">افزودن عضو</h1>
        <p className="text-sm text-ink-2">فقط نام و نام خانوادگی لازم است. با ثبت موبایل، عضو بعداً می‌تواند وارد اپ ورزشکار شود.</p>
      </div>
      <MemberForm
        submitLabel="ثبت عضو"
        pending={create.isPending}
        serverError={create.error}
        onSubmit={(input, setFieldError) => {
          setField.current = setFieldError;
          create.mutate(input);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
