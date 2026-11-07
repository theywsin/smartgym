"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useMe } from "./me";

type Branch = { id: string; name: string };

/** Branches the signed-in user may act on, with the picked one (defaults to the first). */
export function useBranchPicker() {
  const me = useMe();
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const allowed = (branches.data ?? []).filter((b) => !me.access?.branchIds || me.access.branchIds.includes(b.id));
  const [picked, setPicked] = useState("");
  const branchId = picked || allowed[0]?.id || "";
  return { allowed, branchId, setBranchId: setPicked };
}
