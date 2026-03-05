import SkillDetail from "@/app/vault/skills/[id]/skill-detail";

export default async function SharedSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <SkillDetail shareId={id} />;
}
