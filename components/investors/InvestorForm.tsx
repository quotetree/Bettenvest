"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteInvestorAction, updateInvestorAction } from "@/lib/actions/investors";
import type { Investor, InvestorInput } from "@/lib/types";
import { InvestorFields } from "@/components/investors/InvestorFields";
import { Button } from "@/components/ui";

export function InvestorForm({ investor }: { investor: Investor }) {
  const router = useRouter();
  const [form, setForm] = useState<InvestorInput>(investor);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <Link href="/investors" className="text-sm text-slate-500">
        Investor leads
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{investor.fullName}</h1>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <InvestorFields value={form} onChange={setForm} />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            disabled={pending}
            onClick={async () => {
              setPending(true);
              const result = await updateInvestorAction(investor.id, form);
              setPending(false);
              setMessage(result.ok ? "Saved" : result.error);
              router.refresh();
            }}
          >
            Save investor
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirm("Delete this investor?")) return;
              const result = await deleteInvestorAction(investor.id);
              if (result.ok) router.push("/investors");
              else setMessage(result.error);
            }}
          >
            Delete
          </Button>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
      </div>
    </div>
  );
}
