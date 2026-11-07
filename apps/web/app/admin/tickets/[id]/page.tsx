"use client";

import { useParams } from "next/navigation";
import { TicketThread } from "@/components/tickets";

export default function AdminTicket() {
  const { id } = useParams<{ id: string }>();
  return <TicketThread base={`/admin/tickets/${id}`} mySide="SUPPORT" canClose backHref="/admin/tickets" />;
}
