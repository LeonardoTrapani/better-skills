"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Route } from "next";
import { GeistPixelSquare } from "geist/font/pixel";

import { Button } from "@/components/ui/button";
import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop } from "./grid-background";
import { useLandingCta } from "./use-landing-cta";

/* ── Pain-point data with schematic SVG illustrations ── */
const painPoints = [
  {
    id: "scattered",
    title: "Skills live in scattered places",
    detail:
      "A prompt in Notion. A guide in Confluence. A context file buried in a local folder. A system prompt hardcoded in an IDE setting. Nobody knows which version is current, or where to look.",
    illustration: (
      <svg viewBox="0 0 320 200" fill="none" className="w-full max-w-[360px]" aria-hidden="true">
        {/* Notion */}
        <rect
          x="20"
          y="20"
          width="70"
          height="50"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.15"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <rect
          x="28"
          y="28"
          width="54"
          height="4"
          rx="2"
          fill="var(--muted-foreground)"
          fillOpacity="0.3"
        />
        <rect
          x="28"
          y="38"
          width="40"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <rect
          x="28"
          y="46"
          width="48"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <text
          x="55"
          y="62"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.6"
        >
          Notion
        </text>

        {/* Confluence */}
        <rect
          x="230"
          y="10"
          width="70"
          height="50"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.15"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <rect
          x="238"
          y="18"
          width="54"
          height="4"
          rx="2"
          fill="var(--muted-foreground)"
          fillOpacity="0.3"
        />
        <rect
          x="238"
          y="28"
          width="45"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <rect
          x="238"
          y="36"
          width="38"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <text
          x="265"
          y="52"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.6"
        >
          Confluence
        </text>

        {/* Local folder */}
        <rect
          x="125"
          y="90"
          width="70"
          height="50"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.15"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <circle cx="141" cy="109" r="8" fill="var(--muted-foreground)" fillOpacity="0.15" />
        <path
          d="M141 105 L141 113 M137 109 L145 109"
          stroke="var(--muted-foreground)"
          strokeOpacity="0.4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="160"
          y="132"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.6"
        >
          local/
        </text>

        {/* IDE config */}
        <rect
          x="20"
          y="140"
          width="70"
          height="50"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.15"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <rect
          x="28"
          y="148"
          width="54"
          height="3"
          rx="1.5"
          fill="var(--primary)"
          fillOpacity="0.3"
        />
        <rect
          x="28"
          y="156"
          width="40"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <rect
          x="28"
          y="164"
          width="48"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <text
          x="55"
          y="182"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.6"
        >
          IDE
        </text>

        {/* Slack */}
        <rect
          x="230"
          y="140"
          width="70"
          height="50"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.15"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <circle cx="246" cy="159" r="6" fill="var(--primary)" fillOpacity="0.2" />
        <circle cx="266" cy="159" r="6" fill="var(--primary)" fillOpacity="0.2" />
        <circle cx="286" cy="159" r="6" fill="var(--primary)" fillOpacity="0.2" />
        <rect
          x="238"
          y="170"
          width="54"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <text
          x="265"
          y="182"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.6"
        >
          Slack
        </text>

        {/* Chaotic dashed connections */}
        <path
          d="M90 45 Q160 50 230 35"
          stroke="var(--primary)"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M55 70 Q90 105 125 115"
          stroke="var(--primary)"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M195 115 Q220 130 230 165"
          stroke="var(--primary)"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M90 165 Q160 120 160 115"
          stroke="var(--primary)"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Question marks */}
        <text
          x="160"
          y="55"
          textAnchor="middle"
          fontSize="24"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.12"
        >
          ?
        </text>
        <text
          x="110"
          y="95"
          textAnchor="middle"
          fontSize="18"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.1"
        >
          ?
        </text>
        <text
          x="210"
          y="95"
          textAnchor="middle"
          fontSize="18"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.1"
        >
          ?
        </text>
      </svg>
    ),
  },
  {
    id: "manual",
    title: "Sharing across agents is manual",
    detail:
      "Every time you switch between Claude Code, Cursor, or Codex, you copy-paste the same context again. There is no shared source of truth — the knowledge lives on your clipboard.",
    illustration: (
      <svg viewBox="0 0 320 180" fill="none" className="w-full max-w-[360px]" aria-hidden="true">
        <defs>
          <marker
            id="wf-arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="var(--primary)" fillOpacity="0.2" />
          </marker>
        </defs>

        {/* Clipboard source */}
        <rect
          x="135"
          y="15"
          width="50"
          height="60"
          rx="3"
          fill="var(--primary)"
          fillOpacity="0.07"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeOpacity="0.3"
        />
        <rect x="145" y="25" width="30" height="4" rx="2" fill="var(--primary)" fillOpacity="0.4" />
        <rect
          x="145"
          y="35"
          width="24"
          height="3"
          rx="1.5"
          fill="var(--primary)"
          fillOpacity="0.3"
        />
        <rect
          x="145"
          y="43"
          width="28"
          height="3"
          rx="1.5"
          fill="var(--primary)"
          fillOpacity="0.3"
        />
        <path
          d="M152 10 L152 15 L168 15 L168 10 L165 10 L165 7 L155 7 L155 10 Z"
          fill="var(--primary)"
          fillOpacity="0.3"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
        <text
          x="160"
          y="67"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fill="var(--primary)"
          fillOpacity="0.5"
        >
          COPY
        </text>

        {/* Claude */}
        <rect
          x="20"
          y="110"
          width="80"
          height="55"
          rx="3"
          fill="var(--muted)"
          fillOpacity="0.12"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <circle cx="32" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <circle cx="42" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <circle cx="52" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <rect
          x="28"
          y="133"
          width="64"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <rect
          x="28"
          y="141"
          width="48"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.15"
        />
        <text
          x="60"
          y="157"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.6"
        >
          Claude
        </text>
        <text
          x="60"
          y="170"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          v1.2
        </text>

        {/* Cursor */}
        <rect
          x="120"
          y="110"
          width="80"
          height="55"
          rx="3"
          fill="var(--muted)"
          fillOpacity="0.12"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <circle cx="132" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <circle cx="142" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <circle cx="152" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <rect
          x="128"
          y="133"
          width="64"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <rect
          x="128"
          y="141"
          width="52"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.15"
        />
        <text
          x="160"
          y="157"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.6"
        >
          Cursor
        </text>
        <text
          x="160"
          y="170"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          v1.5
        </text>

        {/* Codex */}
        <rect
          x="220"
          y="110"
          width="80"
          height="55"
          rx="3"
          fill="var(--muted)"
          fillOpacity="0.12"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <circle cx="232" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <circle cx="242" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <circle cx="252" cy="122" r="3" fill="var(--muted-foreground)" fillOpacity="0.3" />
        <rect
          x="228"
          y="133"
          width="64"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        />
        <rect
          x="228"
          y="141"
          width="56"
          height="3"
          rx="1.5"
          fill="var(--muted-foreground)"
          fillOpacity="0.15"
        />
        <text
          x="260"
          y="157"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.6"
        >
          Codex
        </text>
        <text
          x="260"
          y="170"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          v1.3
        </text>

        {/* Arrows from clipboard to tools */}
        <path
          d="M160 80 L60 105"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeOpacity="0.2"
          strokeDasharray="4 4"
          markerEnd="url(#wf-arrowhead)"
        />
        <path
          d="M160 80 L160 105"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeOpacity="0.2"
          strokeDasharray="4 4"
          markerEnd="url(#wf-arrowhead)"
        />
        <path
          d="M160 80 L260 105"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeOpacity="0.2"
          strokeDasharray="4 4"
          markerEnd="url(#wf-arrowhead)"
        />
      </svg>
    ),
  },
  {
    id: "erodes",
    title: "Context erodes over time",
    detail:
      "Prompts get stale. Guides go out of date. Nobody notices until an agent does something wrong. There is no versioning, no ownership, no audit trail.",
    illustration: (
      <svg viewBox="0 0 320 200" fill="none" className="w-full max-w-[360px]" aria-hidden="true">
        {/* Current version — bright */}
        <rect
          x="30"
          y="30"
          width="260"
          height="24"
          rx="3"
          fill="var(--primary)"
          fillOpacity="0.5"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeOpacity="0.6"
        />
        <text
          x="160"
          y="47"
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill="var(--background)"
          fillOpacity="0.95"
          fontWeight="600"
        >
          v1.0 — current
        </text>

        {/* 3 months ago */}
        <rect
          x="30"
          y="70"
          width="200"
          height="24"
          rx="3"
          fill="var(--muted-foreground)"
          fillOpacity="0.25"
          stroke="var(--border)"
          strokeWidth="2"
          strokeOpacity="0.4"
        />
        <text
          x="130"
          y="87"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--foreground)"
          fillOpacity="0.5"
        >
          v0.9 — 3 months ago
        </text>
        <text
          x="260"
          y="87"
          textAnchor="middle"
          fontSize="16"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.3"
        >
          ?
        </text>

        {/* 8 months ago */}
        <rect
          x="30"
          y="110"
          width="140"
          height="24"
          rx="3"
          fill="var(--muted-foreground)"
          fillOpacity="0.15"
          stroke="var(--border)"
          strokeWidth="2"
          strokeOpacity="0.25"
        />
        <text
          x="100"
          y="127"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--foreground)"
          fillOpacity="0.4"
        >
          v0.8 — 8 months
        </text>
        <text
          x="200"
          y="127"
          textAnchor="middle"
          fontSize="18"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.2"
        >
          ?
        </text>

        {/* 1 year ago */}
        <rect
          x="30"
          y="150"
          width="80"
          height="24"
          rx="3"
          fill="var(--muted-foreground)"
          fillOpacity="0.08"
          stroke="var(--border)"
          strokeWidth="2"
          strokeOpacity="0.15"
        />
        <text
          x="70"
          y="167"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fill="var(--foreground)"
          fillOpacity="0.3"
        >
          v0.1 — 1 yr
        </text>
        <text
          x="140"
          y="167"
          textAnchor="middle"
          fontSize="20"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.15"
        >
          ?
        </text>

        {/* Clock symbol */}
        <circle
          cx="280"
          cy="100"
          r="28"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeOpacity="0.15"
          fill="none"
        />
        <line
          x1="280"
          y1="100"
          x2="280"
          y2="80"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeOpacity="0.2"
        />
        <line
          x1="280"
          y1="100"
          x2="295"
          y2="100"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeOpacity="0.2"
        />

        {/* Downward trend */}
        <path
          d="M240 45 L200 125"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeOpacity="0.15"
          strokeDasharray="6 6"
        />
        <polygon
          points="200,125 206,115 194,115"
          fill="var(--muted-foreground)"
          fillOpacity="0.15"
        />
      </svg>
    ),
  },
  {
    id: "ownership",
    title: "No ownership model for teams",
    detail:
      "A new engineer joins and has no idea what skills exist. No roles, no access controls, no way to understand who manages what — or what the team's agents are actually capable of.",
    illustration: (
      <svg viewBox="0 0 320 200" fill="none" className="w-full max-w-[360px]" aria-hidden="true">
        {/* Three team members */}
        <circle
          cx="80"
          cy="50"
          r="22"
          stroke="var(--border)"
          strokeWidth="2"
          fill="var(--muted)"
          fillOpacity="0.08"
        />
        <circle cx="74" cy="45" r="3" fill="var(--muted-foreground)" fillOpacity="0.4" />
        <circle cx="86" cy="45" r="3" fill="var(--muted-foreground)" fillOpacity="0.4" />
        <path
          d="M75 58 Q80 62 85 58"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeOpacity="0.3"
          fill="none"
        />
        <text
          x="80"
          y="90"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          owner?
        </text>

        <circle
          cx="160"
          cy="50"
          r="22"
          stroke="var(--border)"
          strokeWidth="2"
          fill="var(--muted)"
          fillOpacity="0.08"
        />
        <circle cx="154" cy="45" r="3" fill="var(--muted-foreground)" fillOpacity="0.4" />
        <circle cx="166" cy="45" r="3" fill="var(--muted-foreground)" fillOpacity="0.4" />
        <path
          d="M155 58 Q160 62 165 58"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeOpacity="0.3"
          fill="none"
        />
        <text
          x="160"
          y="90"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          admin?
        </text>

        <circle
          cx="240"
          cy="50"
          r="22"
          stroke="var(--border)"
          strokeWidth="2"
          fill="var(--muted)"
          fillOpacity="0.08"
        />
        <circle cx="234" cy="45" r="3" fill="var(--muted-foreground)" fillOpacity="0.4" />
        <circle cx="246" cy="45" r="3" fill="var(--muted-foreground)" fillOpacity="0.4" />
        <path
          d="M235 58 Q240 62 245 58"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeOpacity="0.3"
          fill="none"
        />
        <text
          x="240"
          y="90"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          member?
        </text>

        {/* Shared but unclear knowledge box */}
        <rect
          x="80"
          y="115"
          width="160"
          height="65"
          rx="3"
          stroke="var(--border)"
          strokeWidth="2"
          strokeDasharray="8 8"
          fill="var(--muted)"
          fillOpacity="0.04"
        />
        <text
          x="160"
          y="137"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.45"
        >
          code-review.md
        </text>
        <text
          x="160"
          y="153"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.40"
        >
          react-perf.md
        </text>
        <text
          x="160"
          y="169"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.35"
        >
          deployment.md
        </text>

        {/* Disconnected ownership lines */}
        <line
          x1="80"
          y1="72"
          x2="110"
          y2="115"
          stroke="var(--muted-foreground)"
          strokeWidth="1.5"
          strokeOpacity="0.15"
          strokeDasharray="4 4"
        />
        <line
          x1="160"
          y1="72"
          x2="160"
          y2="115"
          stroke="var(--muted-foreground)"
          strokeWidth="1.5"
          strokeOpacity="0.15"
          strokeDasharray="4 4"
        />
        <line
          x1="240"
          y1="72"
          x2="210"
          y2="115"
          stroke="var(--muted-foreground)"
          strokeWidth="1.5"
          strokeOpacity="0.15"
          strokeDasharray="4 4"
        />

        {/* Floating question marks */}
        <text
          x="45"
          y="115"
          textAnchor="middle"
          fontSize="18"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.12"
        >
          ?
        </text>
        <text
          x="275"
          y="115"
          textAnchor="middle"
          fontSize="18"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.12"
        >
          ?
        </text>
      </svg>
    ),
  },
];

export default function WhyWorkflowsFail() {
  const { ctaHref, ctaLabel } = useLandingCta();
  const [active, setActive] = useState(0);

  return (
    <section id="why-workflows-fail" className="relative overflow-hidden">
      <SectionBackdrop variant="problem" />

      <LandingContainer>
        <div className="flex flex-col overflow-hidden border border-border bg-background lg:flex-row">
          {/* Left: section title + vertical tabs */}
          <div className="flex flex-col border-b border-border lg:w-5/12 lg:border-b-0 lg:border-r">
            {/* Title area */}
            <div className="px-8 pb-8 pt-16 lg:px-10 lg:pt-14">
              <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground/50">
                // The Problem \\
              </p>
              <h2
                className={`mt-4 text-[2rem] text-balance leading-tight tracking-tight text-foreground sm:text-[2.5rem] ${GeistPixelSquare.className}`}
              >
                Why workflows
                <br />
                <span className="text-primary">break down</span>
              </h2>
            </div>

            {/* Vertical tab list */}
            <div
              role="tablist"
              aria-label="Problem areas"
              className="flex flex-1 flex-col border-t border-border"
            >
              {painPoints.map((p, i) => (
                <button
                  key={p.id}
                  role="tab"
                  id={`wf-tab-${p.id}`}
                  aria-selected={active === i}
                  aria-controls={`wf-panel-${p.id}`}
                  type="button"
                  tabIndex={active === i ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive((prev) => (prev + 1) % painPoints.length);
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive((prev) => (prev - 1 + painPoints.length) % painPoints.length);
                    }
                  }}
                  className={`group flex cursor-pointer items-center gap-4 border-b border-border px-8 py-5 text-left last:border-b-0 transition-colors duration-200 hover:bg-muted/[0.04] lg:px-10 ${
                    active === i ? "bg-muted/[0.06]" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-px shrink-0 bg-primary transition-all duration-200 ${
                      active === i ? "w-6 opacity-100" : "w-2.5 opacity-30"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      active === i ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {p.title}
                  </span>
                </button>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 border-t border-border px-8 py-8 lg:px-10 lg:py-10">
              <Button
                variant="outline"
                animated
                className="h-10 gap-2 px-5 text-xs"
                render={<a href="mailto:hello@better-skills.dev" rel="noopener noreferrer" />}
              >
                Talk to us
                <ArrowRight className="size-3" aria-hidden="true" />
              </Button>
              <Button
                animated
                className="h-10 gap-2 px-5 text-xs"
                render={<Link href={ctaHref as Route} />}
              >
                {ctaLabel}
                <ArrowRight className="size-3" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Right: animated illustration + description */}
          <div className="flex min-h-[420px] flex-1 flex-col items-center justify-center gap-8 px-8 py-16 lg:px-12 lg:py-20">
            {painPoints.map((p) => (
              <div
                key={p.id}
                role="tabpanel"
                id={`wf-panel-${p.id}`}
                aria-labelledby={`wf-tab-${p.id}`}
                hidden={active !== painPoints.indexOf(p)}
                className="w-full"
              >
                {active === painPoints.indexOf(p) && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center gap-8 text-center"
                    >
                      <div className="flex w-full max-w-sm justify-center">{p.illustration}</div>
                      <p className="max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
                        {p.detail}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
