import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop } from "./grid-background";
import SkillTreeShowcase from "./skill-tree-showcase";

export default function WhatIsASkill() {
  return (
    <section id="what-is-a-skill" className="relative overflow-hidden scroll-mt-20">
      <SectionBackdrop variant="cli-demo" />

      <LandingContainer>
        <SectionTailSpacer />
        <SkillTreeShowcase />
        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
