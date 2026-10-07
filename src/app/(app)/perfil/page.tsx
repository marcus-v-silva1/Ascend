import type { Metadata } from "next";
import { ActionForm, Field } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { saveProfile } from "./actions";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const { supabase, userId, email } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, target_cefr, target_cefr_date, daily_new_cards")
    .eq("id", userId)
    .single();

  return (
    <>
      <PageHeader title="Perfil" description={`Conectado como ${email}.`} />
      <section className="max-w-lg rounded-lg border bg-card p-5">
        <ActionForm action={saveProfile} submitLabel="Salvar perfil" resetOnSuccess={false} className="space-y-4">
          <Field label="Como quer ser chamado" name="display_name" required defaultValue={profile?.display_name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cefr" className="field-label">Meta de inglês</label>
              <select id="cefr" name="target_cefr" defaultValue={profile?.target_cefr ?? "B2"} className="field">
                {["A2", "B1", "B2", "C1", "C2"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <Field label="Até quando" name="target_cefr_date" type="date" defaultValue={profile?.target_cefr_date} />
          </div>
          <div>
            <Field label="Flashcards novos por dia" name="daily_new_cards" type="number" min={0} max={200} defaultValue={profile?.daily_new_cards ?? 20} required />
            <p className="mt-1 text-xs text-muted-foreground">Cartões novos entram na revisão até esse limite diário. 20 é um bom começo.</p>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
