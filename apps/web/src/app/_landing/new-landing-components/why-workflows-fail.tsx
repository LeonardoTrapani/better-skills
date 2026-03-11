"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Route } from "next";
import { SectionBackdrop } from "../grid-background";
import { LandingContainer, SectionTailSpacer } from "../design-system";

const painPoints = [
  {
    id: "scattered",
    title: "Skills live in scattered places",
    detail:
      "A prompt in Notion. A guide in Confluence. A context file buried in a local folder. A system prompt hardcoded in an IDE setting. Nobody knows which version is current, or even where to look.",
    illustration: (
      <svg viewBox="0 0 320 200" fill="none" className="w-full max-w-[400px]" aria-hidden="true">
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

        {/* Chaotic connection lines */}
        <path
          d="M90 45 Q160 50 230 35"
          stroke="var(--primary)"
          strokeOpacity="0.15"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M55 70 Q90 105 125 115"
          stroke="var(--primary)"
          strokeOpacity="0.15"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M195 115 Q220 130 230 165"
          stroke="var(--primary)"
          strokeOpacity="0.15"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M90 165 Q160 120 160 115"
          stroke="var(--primary)"
          strokeOpacity="0.15"
          strokeWidth="2"
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
          fillOpacity="0.15"
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
          fillOpacity="0.12"
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
          fillOpacity="0.12"
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
      <svg viewBox="0 0 320 180" fill="none" className="w-full max-w-[400px]" aria-hidden="true">
        {/* Clipboard/Copy symbol at top */}
        <rect
          x="135"
          y="15"
          width="50"
          height="60"
          rx="3"
          fill="var(--primary)"
          fillOpacity="0.08"
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
          y="65"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--primary)"
          fillOpacity="0.6"
        >
          COPY
        </text>

        {/* Claude Code */}
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

        {/* Arrows from clipboard to tools */}
        <path
          d="M160 80 L60 105"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeOpacity="0.2"
          strokeDasharray="4 4"
          markerEnd="url(#arrowhead)"
        />
        <path
          d="M160 80 L160 105"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeOpacity="0.2"
          strokeDasharray="4 4"
          markerEnd="url(#arrowhead)"
        />
        <path
          d="M160 80 L260 105"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeOpacity="0.2"
          strokeDasharray="4 4"
          markerEnd="url(#arrowhead)"
        />

        {/* Version labels showing inconsistency */}
        <text
          x="60"
          y="173"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          v1.2
        </text>
        <text
          x="160"
          y="173"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          v1.5
        </text>
        <text
          x="260"
          y="173"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          v1.3
        </text>

        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="var(--primary)" fillOpacity="0.2" />
          </marker>
        </defs>
      </svg>
    ),
  },
  {
    id: "erodes",
    title: "Context erodes over time",
    detail:
      "Prompts get stale. Guides go out of date. Nobody notices until an agent does something wrong. There is no versioning, no ownership, no audit trail.",
    illustration: (
      <svg viewBox="0 0 320 200" fill="none" className="w-full max-w-[400px]" aria-hidden="true">
        {/* Timeline visualization with degrading quality */}
        {/* Current version - bright and clear */}
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

        {/* 3 months ago - fading */}
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

        {/* 8 months ago - more faded */}
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
          v0.8 — 8 months ago
        </text>
        <text
          x="200"
          y="127"
          textAnchor="middle"
          fontSize="18"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.25"
        >
          ?
        </text>

        {/* 1 year ago - very faded */}
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
          v0.1 — 1 year
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

        {/* Decay indicator - clock/time symbol */}
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

        {/* Downward trend arrow */}
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
      <svg viewBox="0 0 320 200" fill="none" className="w-full max-w-[400px]" aria-hidden="true">
        {/* Three confused team members */}
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
          fontSize="10"
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
          fontSize="10"
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
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.4"
        >
          member?
        </text>

        {/* Unclear knowledge box */}
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
          fillOpacity="0.05"
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

        {/* Question marks floating around */}
        <text
          x="45"
          y="115"
          textAnchor="middle"
          fontSize="18"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.15"
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
          fillOpacity="0.15"
        >
          ?
        </text>
        <text
          x="30"
          y="155"
          textAnchor="middle"
          fontSize="22"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.12"
        >
          ?
        </text>
        <text
          x="290"
          y="155"
          textAnchor="middle"
          fontSize="22"
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          fillOpacity="0.12"
        >
          ?
        </text>

        {/* Disconnected lines showing no clear ownership */}
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
      </svg>
    ),
  },
];

export default function WhyWorkflowsFail() {
  const [active, setActive] = useState(0);
  const point = painPoints[active]!;

  // Auto-rotate tabs every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % painPoints.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="why-workflows-fail" className="relative overflow-hidden">
      <SectionBackdrop variant="problem" />
      <LandingContainer>
        <div className="flex flex-col border-y border-border/50 bg-background lg:flex-row">
          {/* Left: Vertical tabs + title + CTAs (50% width on desktop) */}
          <div className="flex flex-col lg:w-5/11 border-r border-border/70 lg:order-1 order-2">
            {/* Title section - NO PARAGRAPH */}
            <div className="flex flex-col gap-4 px-8 pb-8 pt-16 lg:px-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                // The Problem \\
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-[1.15] sm:text-4xl">
                Why current skill workflows <span className="text-primary">break down</span>
              </h2>
            </div>

            {/* Vertical tabs */}
            <div className="flex-1 flex flex-col">
              {painPoints.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`group flex items-center gap-4 px-12 py-6 text-left transition-all duration-300 hover:bg-muted/20 ${
                    active === i ? "bg-muted/30" : ""
                  }`}
                >
                  <span
                    className={`h-px flex-shrink-0 transition-all duration-300 ${
                      active === i ? "w-7 bg-primary" : "w-3 bg-muted-foreground/30"
                    }`}
                  />
                  <span
                    className={`font-medium transition-colors ${
                      active === i
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground/80"
                    }`}
                  >
                    {p.title}
                  </span>
                </button>
              ))}
            </div>

            {/* CTAs at bottom */}
            <div className="flex flex-wrap items-center gap-3 px-8 py-8 lg:px-12 lg:py-10 border-t border-border/70">
              <a
                href="#enterprise"
                onClick={(e) => {
                  const el = document.querySelector<HTMLElement>("#enterprise");
                  if (!el) return;
                  e.preventDefault();
                  window.scrollTo({
                    top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 60),
                    behavior: "smooth",
                  });
                }}
                className="inline-flex h-11 items-center gap-2 border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                See enterprise
                <ArrowRight className="size-4" />
              </a>
              <Link
                href={"/login" as Route}
                className="inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Right: Animated content (50% width on desktop) - NO PROGRESS DOTS */}
          <div className="flex flex-1 flex-col items-center justify-center gap-10 px-8 py-16 lg:px-16 lg:py-20 lg:w-6/11 lg:order-2 order-1 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={point.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-10 text-center w-full"
              >
                <div className="flex justify-center w-full">{point.illustration}</div>
                <p className="max-w-lg leading-relaxed text-muted-foreground">{point.detail}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
