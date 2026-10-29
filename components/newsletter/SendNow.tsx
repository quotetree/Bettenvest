"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deliverCampaignAction } from "@/lib/actions/campaigns";
import { Button } from "@/components/ui";

export function SendNow({ id }: { id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="mt-4">
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await deliverCampaignAction(id);
          setPending(false);
          setMessage(result.ok ? result.note : result.error);
          if (result.ok) router.refresh();
        }}
      >
        {pending ? "Sending…" : "Send now"}
      </Button>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
