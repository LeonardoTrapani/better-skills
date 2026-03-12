import { LandingSection } from "./landing-section";
import SkillTreeShowcase from "./skill-tree-showcase";

export default function WhatIsASkill() {
  return (
    <LandingSection
      id="what-is-a-skill"
      className="scroll-mt-20"
      variant="cli-demo"
      topSpacer
      bottomSpacer
    >
      <SkillTreeShowcase />
    </LandingSection>
  );
}
