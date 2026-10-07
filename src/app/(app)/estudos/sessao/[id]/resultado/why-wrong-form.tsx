"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveWhyWrong } from "../../../actions";

export function WhyWrongForm({ attemptId, initial }: { attemptId: string; initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(Boolean(initial));
  const [pending, startTransition] = useTransition();

  if (saved) {
    return (
      <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
        <span className="font-medium">Por que errei:</span> {value}{" "}
        <button type="button" onClick={() => setSaved(false)} className="text-muted-foreground underline-offset-4 hover:underline">
          editar
        </button>
      </p>
    );
  }

  return (
    <form
      className="mt-3 flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            await saveWhyWrong({ attemptId, whyWrong: value });
            setSaved(true);
          } catch {
            toast.error("Não foi possível salvar.");
          }
        });
      }}
    >
      <label htmlFor={`why-${attemptId}`} className="sr-only">Por que errei</label>
      <input
        id={`why-${attemptId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Por que errei?"
        className="field"
      />
      <Button type="submit" variant="secondary" disabled={pending || value.trim().length < 3}>
        Salvar
      </Button>
    </form>
  );
}
