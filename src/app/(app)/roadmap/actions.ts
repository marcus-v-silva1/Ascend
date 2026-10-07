"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

function refresh() {
  revalidatePath("/roadmap");
  revalidatePath("/dashboard");
}

const statusSchema = z.object({
  id: z.uuid(),
  // null = volta ao automático
  status: z.enum(["todo", "doing", "done", "skipped"]).nullable(),
});

export async function setNodeStatus(input: z.infer<typeof statusSchema>) {
  const { id, status } = statusSchema.parse(input);
  const { supabase } = await requireUser();
  const { error } = await supabase.from("roadmap_nodes").update({ status }).eq("id", id);
  if (error) throw new Error("Não foi possível salvar o status.");
  refresh();
}

const notesSchema = z.object({ id: z.uuid(), notes: z.string().trim().max(4000) });

export async function saveNodeNotes(input: z.infer<typeof notesSchema>) {
  const { id, notes } = notesSchema.parse(input);
  const { supabase } = await requireUser();
  const { error } = await supabase.from("roadmap_nodes").update({ notes: notes || null }).eq("id", id);
  if (error) throw new Error("Não foi possível salvar as anotações.");
  refresh();
}

const topicSchema = z.object({
  roadmap: z.string().min(1).max(40),
  parent: z.string().min(1).max(120),
  title: z.string().trim().min(2, "Dê um nome ao tópico.").max(120),
  side: z.enum(["left", "right"]),
});

export async function addTopic(input: z.infer<typeof topicSchema>) {
  const parsed = topicSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { roadmap, parent, title, side } = parsed.data;
  const { supabase } = await requireUser();
  const { data: siblings } = await supabase
    .from("roadmap_nodes")
    .select("position")
    .eq("roadmap", roadmap)
    .eq("parent_external_id", parent)
    .order("position", { ascending: false })
    .limit(1);
  const { error } = await supabase.from("roadmap_nodes").insert({
    external_id: `custom-${crypto.randomUUID()}`,
    roadmap,
    parent_external_id: parent,
    kind: "topic",
    title,
    side,
    position: (siblings?.[0]?.position ?? 0) + 1,
  });
  if (error) return { error: "Não foi possível adicionar o tópico." };
  refresh();
  return { ok: true };
}

export async function deleteTopic(input: { id: string }) {
  const id = z.uuid().parse(input.id);
  const { supabase } = await requireUser();
  // Só tópicos criados por você; os do plano inicial podem ser pulados, não apagados
  await supabase.from("roadmap_nodes").delete().eq("id", id).like("external_id", "custom-%");
  refresh();
}
