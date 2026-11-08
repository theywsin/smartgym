"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client/api";
import { TicketThread } from "@/components/tickets";

export default function StaffTicketPage() {
  const { id } = useParams<{ id: string }>();
  const t = useQuery({ queryKey: ["ticket-scope", id], queryFn: () => api<{ scope: "GYM" | "PLATFORM" }>(`/tickets/${id}`) });
  if (!t.data) return null;
  return <TicketThread base={`/tickets/${id}`} mySide={t.data.scope === "GYM" ? "SUPPORT" : "REQUESTER"} canClose backHref="/manager/tickets" />;
}
