export type ProjectKind =
  | "website" | "web_app" | "mobile_app" | "ecommerce"
  | "ai_assistant" | "automation" | "custom_software";

export type RiskClass = "low" | "medium" | "high" | "critical";
export type CostClass = "free" | "existing_subscription" | "usage_based" | "new_subscription" | "contract";

export interface ProjectBrief {
  kind: ProjectKind;
  requirements: string[];
  constraints?: {
    maxMonthlySpendUsd?: number;
    approvedProviders?: string[];
    allowedCostClasses?: CostClass[];
    dataSensitivity?: "public" | "internal" | "confidential" | "regulated";
  };
}

export interface ToolCapability {
  id: string;
  provider: string;
  name: string;
  description: string;
  projectKinds: ProjectKind[];
  capabilities: string[];
  integration: "native" | "api" | "cli" | "manual";
  costClass: CostClass;
  estimatedMonthlyUsd: number | null;
  risk: RiskClass;
  requiresSecret: boolean;
  enabled: boolean;
  evidenceUrl?: string;
}

export interface ToolDecision {
  capabilityId: string;
  provider: string;
  name: string;
  reason: string;
  estimatedMonthlyUsd: number | null;
  requiresApproval: boolean;
  blockedReason?: string;
}

export interface ToolPlan {
  projectKind: ProjectKind;
  decisions: ToolDecision[];
  estimatedMonthlyUsd: number | null;
  requiresHumanApproval: boolean;
  approvalReasons: string[];
  executionAllowed: false;
  note: string;
}

// This registry is metadata only. It does not create accounts, accept terms,
// spend money, retrieve secrets, or invoke third-party APIs.
export const capabilityRegistry: readonly ToolCapability[] = [
  {
    id: "github.repository",
    provider: "GitHub",
    name: "GitHub repository",
    description: "Version control, pull requests, reviews and source history.",
    projectKinds: ["website", "web_app", "mobile_app", "ecommerce", "ai_assistant", "automation", "custom_software"],
    capabilities: ["source_control", "pull_requests", "code_review"],
    integration: "api", costClass: "existing_subscription", estimatedMonthlyUsd: 0,
    risk: "medium", requiresSecret: true, enabled: true,
  },
  {
    id: "postgres.database",
    provider: "PostgreSQL",
    name: "PostgreSQL database",
    description: "Relational data persistence and transactional workloads.",
    projectKinds: ["web_app", "mobile_app", "ecommerce", "ai_assistant", "automation", "custom_software"],
    capabilities: ["relational_database", "transactions", "sql"],
    integration: "native", costClass: "usage_based", estimatedMonthlyUsd: null,
    risk: "high", requiresSecret: true, enabled: true,
  },
  {
    id: "openai.models",
    provider: "OpenAI",
    name: "OpenAI API",
    description: "Language, reasoning and multimodal model capabilities.",
    projectKinds: ["website", "web_app", "mobile_app", "ecommerce", "ai_assistant", "automation", "custom_software"],
    capabilities: ["llm", "reasoning", "embeddings", "multimodal"],
    integration: "api", costClass: "usage_based", estimatedMonthlyUsd: null,
    risk: "medium", requiresSecret: true, enabled: true,
  },
  {
    id: "n8n.automation",
    provider: "n8n",
    name: "n8n workflow automation",
    description: "Connectors, triggers and cross-system workflow orchestration.",
    projectKinds: ["web_app", "mobile_app", "ecommerce", "ai_assistant", "automation", "custom_software"],
    capabilities: ["workflow_automation", "webhooks", "connectors"],
    integration: "api", costClass: "existing_subscription", estimatedMonthlyUsd: null,
    risk: "high", requiresSecret: true, enabled: true,
  },
  {
    id: "cloudflare.edge",
    provider: "Cloudflare",
    name: "Cloudflare edge services",
    description: "DNS, CDN, TLS and edge security controls.",
    projectKinds: ["website", "web_app", "ecommerce", "ai_assistant", "custom_software"],
    capabilities: ["dns", "cdn", "tls", "waf"],
    integration: "api", costClass: "existing_subscription", estimatedMonthlyUsd: null,
    risk: "high", requiresSecret: true, enabled: true,
  },
  {
    id: "playwright.qa",
    provider: "Microsoft",
    name: "Playwright",
    description: "Browser automation and end-to-end verification.",
    projectKinds: ["website", "web_app", "ecommerce", "custom_software"],
    capabilities: ["browser_testing", "e2e_testing"],
    integration: "cli", costClass: "free", estimatedMonthlyUsd: 0,
    risk: "low", requiresSecret: false, enabled: true,
  },
  {
    id: "expo.mobile",
    provider: "Expo",
    name: "Expo",
    description: "React Native application build and delivery tooling.",
    projectKinds: ["mobile_app"],
    capabilities: ["mobile_build", "mobile_runtime", "app_delivery"],
    integration: "cli", costClass: "usage_based", estimatedMonthlyUsd: null,
    risk: "medium", requiresSecret: true, enabled: true,
  },
  {
    id: "stripe.payments",
    provider: "Stripe",
    name: "Stripe",
    description: "Payment processing; availability and legal suitability must be checked per market.",
    projectKinds: ["ecommerce", "web_app", "mobile_app"],
    capabilities: ["payments", "subscriptions", "invoicing"],
    integration: "api", costClass: "usage_based", estimatedMonthlyUsd: null,
    risk: "critical", requiresSecret: true, enabled: false,
  },
];

const requirementMap: Record<string, string[]> = {
  auth: ["authentication"], login: ["authentication"], database: ["relational_database"],
  "data storage": ["relational_database"], payment: ["payments"], payments: ["payments"],
  checkout: ["payments"], "ai chatbot": ["llm"], chatbot: ["llm"],
  automation: ["workflow_automation"], integration: ["connectors"],
  "end-to-end testing": ["e2e_testing"], "browser testing": ["browser_testing"],
  dns: ["dns"], cdn: ["cdn"], mobile: ["mobile_build"],
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function requiredCapabilities(requirements: string[]): Set<string> {
  const result = new Set<string>();
  for (const requirement of requirements.map(normalize)) {
    for (const [phrase, capabilities] of Object.entries(requirementMap)) {
      if (requirement.includes(phrase)) capabilities.forEach((capability) => result.add(capability));
    }
  }
  return result;
}

function approvalReason(tool: ToolCapability, brief: ProjectBrief): string | undefined {
  const reasons: string[] = [];
  if (!tool.enabled) reasons.push("Capability is disabled pending provider, legal, security and commercial verification.");
  if (tool.risk === "critical") reasons.push("Critical-risk integration requires security and business approval.");
  if (tool.costClass === "new_subscription" || tool.costClass === "contract") reasons.push("New subscription or contract requires explicit purchasing approval.");
  if (tool.estimatedMonthlyUsd === null && tool.costClass === "usage_based") reasons.push("Usage cost is unknown; set a budget and obtain an estimate before activation.");
  if (brief.constraints?.approvedProviders && !brief.constraints.approvedProviders.includes(tool.provider)) reasons.push("Provider is not on the project's approved-provider list.");
  if (brief.constraints?.allowedCostClasses && !brief.constraints.allowedCostClasses.includes(tool.costClass)) reasons.push("Cost class is outside the project's allowed policy.");
  if (brief.constraints?.dataSensitivity === "regulated" && tool.risk !== "low") reasons.push("Regulated data requires a separate compliance and security assessment.");
  return reasons.length ? reasons.join(" ") : undefined;
}

export function planTools(brief: ProjectBrief, registry: readonly ToolCapability[] = capabilityRegistry): ToolPlan {
  const needed = requiredCapabilities(brief.requirements);
  const candidates = registry.filter((tool) => tool.enabled && tool.projectKinds.includes(brief.kind));
  const decisions: ToolDecision[] = candidates
    .filter((tool) => tool.capabilities.some((capability) => needed.has(capability)))
    .map((tool) => {
      const blockedReason = approvalReason(tool, brief);
      return {
        capabilityId: tool.id,
        provider: tool.provider,
        name: tool.name,
        reason: `Matches required capabilities: ${tool.capabilities.filter((capability) => needed.has(capability)).join(", ")}.`,
        estimatedMonthlyUsd: tool.estimatedMonthlyUsd,
        requiresApproval: Boolean(blockedReason),
        ...(blockedReason ? { blockedReason } : {}),
      };
    });

  const selectedCapabilities = new Set(decisions.map((decision) =>
    registry.find((tool) => tool.id === decision.capabilityId)?.capabilities ?? []).flat());
  for (const capability of needed) {
    if (!selectedCapabilities.has(capability)) {
      decisions.push({
        capabilityId: `unresolved:${capability}`, provider: "unresolved", name: capability,
        reason: "No verified enabled capability in the registry satisfies this requirement.",
        estimatedMonthlyUsd: null, requiresApproval: true,
        blockedReason: "Research and validate a suitable provider/tool before implementation.",
      });
    }
  }

  const knownCosts = decisions.map((decision) => decision.estimatedMonthlyUsd);
  const estimatedMonthlyUsd = knownCosts.some((cost) => cost === null)
    ? null : knownCosts.reduce<number>((sum, cost) => sum + (cost ?? 0), 0);
  const approvalReasons = decisions.filter((decision) => decision.requiresApproval)
    .map((decision) => `${decision.name}: ${decision.blockedReason}`);
  if (brief.constraints?.maxMonthlySpendUsd !== undefined &&
      (estimatedMonthlyUsd === null || estimatedMonthlyUsd > brief.constraints.maxMonthlySpendUsd)) {
    approvalReasons.push("Estimated cost is unknown or exceeds the approved monthly budget.");
  }

  return {
    projectKind: brief.kind,
    decisions,
    estimatedMonthlyUsd,
    requiresHumanApproval: approvalReasons.length > 0,
    approvalReasons,
    executionAllowed: false,
    note: "Planning only. The planner cannot provision accounts, accept contracts, spend money, access secrets, or execute integrations.",
  };
}
