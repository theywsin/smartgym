"use client";

import { useParams } from "next/navigation";
import { TicketThread } from "@/components/tickets";

export default function AthleteTicket() {
  const { memberId, id } = useParams<{ memberId: string; id: string }>();
  return <TicketThread base={`/athlete/profiles/${memberId}/tickets/${id}`} mySide="REQUESTER" canClose={false} backHref={`/athlete/${memberId}/tickets`} />;
}
