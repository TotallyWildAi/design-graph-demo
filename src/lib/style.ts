/**
 * Per-kind visual vocabulary — icon + accent colour, ported from the
 * swarm-of-agents design-graph viewer so the demo matches the product.
 */

export interface KindStyle {
  icon: string;
  color: string;
}

export const PALETTE: Record<string, KindStyle> = {
  SYSTEM: { icon: "🏛️", color: "#8b5cf6" },
  CONTAINER: { icon: "📦", color: "#3b82f6" },
  EXTERNAL_SYSTEM: { icon: "☁️", color: "#64748b" },
  COMPONENT: { icon: "🧩", color: "#10b981" },
  TYPE: { icon: "🔷", color: "#f59e0b" },
  METHOD: { icon: "⚙️", color: "#6366f1" },
  FIELD: { icon: "🔸", color: "#9ca3af" },
  ENDPOINT: { icon: "🌐", color: "#06b6d4" },
  TABLE: { icon: "🗄️", color: "#e11d48" },
  COLUMN: { icon: "▫️", color: "#f472b6" },
  REQUIREMENT: { icon: "📌", color: "#a855f7" },
  CONTRACT: { icon: "📋", color: "#fb923c" },
  CONFIG: { icon: "🔧", color: "#6b7280" },
  MIGRATION: { icon: "🧱", color: "#b45309" },
  TOPIC: { icon: "📣", color: "#0ea5e9" },
  CACHE: { icon: "⚡", color: "#eab308" },
  DEPENDENCY: { icon: "🔗", color: "#94a3b8" },
  DOCKER_IMAGE: { icon: "🐳", color: "#2496ed" },
  DEPLOYABLE_ARTIFACT: { icon: "📦", color: "#0891b2" },
  ENVIRONMENT: { icon: "🌍", color: "#0d9488" },
};

const FALLBACK: KindStyle = { icon: "⬜", color: "#94a3b8" };

export function styleFor(kind: string): KindStyle {
  return PALETTE[kind] ?? FALLBACK;
}

const STEREOTYPE: Record<string, KindStyle> = {
  Controller: { icon: "🎛️", color: "#0ea5e9" },
  RestController: { icon: "🎛️", color: "#0ea5e9" },
  Service: { icon: "🧩", color: "#10b981" },
  Agent: { icon: "🤖", color: "#a855f7" },
  Repository: { icon: "🗃️", color: "#e11d48" },
  Config: { icon: "🔧", color: "#6b7280" },
  ReactComponent: { icon: "⚛️", color: "#22d3ee" },
  Mapper: { icon: "🔀", color: "#f59e0b" },
  Gateway: { icon: "🛰️", color: "#8b5cf6" },
  endpoint: { icon: "🌐", color: "#0ea5e9" },
  "contract-op": { icon: "🔌", color: "#fb923c" },
  "contract-test": { icon: "✅", color: "#16a34a" },
  postgres: { icon: "🐘", color: "#2563eb" },
  "security-policy": { icon: "🛡️", color: "#dc2626" },
  "integration-test-base": { icon: "🧪", color: "#0891b2" },
  "integration-test": { icon: "✔️", color: "#15803d" },
  "registry-image": { icon: "🐳", color: "#2496ed" },
  "dockerfile-image": { icon: "🏗️", color: "#1d4ed8" },
  "fat-jar": { icon: "📦", color: "#0891b2" },
  "oci-image": { icon: "🐳", color: "#2496ed" },
  deployment: { icon: "🚀", color: "#0891b2" },
  dev: { icon: "🧪", color: "#0d9488" },
};

const STEREOTYPE_NORM: Record<string, KindStyle> = Object.fromEntries(
  Object.entries(STEREOTYPE).map(([k, v]) => [k.toLowerCase().replace(/[^a-z0-9]/g, ""), v]),
);

const ROLE_KEYWORDS: [RegExp, KindStyle][] = [
  [/test|spec|fixture|mock/, { icon: "🧪", color: "#16a34a" }],
  [/restcontroller|controller|resource|^route/, { icon: "🎛️", color: "#0ea5e9" }],
  [/repository|\bdao\b|persistenceadapter|jpa/, { icon: "🗃️", color: "#e11d48" }],
  [/applicationservice|usecase|interactor|domainservice|service|handler/, { icon: "🧩", color: "#10b981" }],
  [/entity|aggregate|valueobject|model|record|policy/, { icon: "💠", color: "#0d9488" }],
  [/dto|request|response|schema|payload|contract|mapper/, { icon: "🔀", color: "#f59e0b" }],
  [/config|configuration|properties|settings|bootstrap|wiring/, { icon: "🔧", color: "#6b7280" }],
  [/react|hook|component|tsx|jsx|page|view|widget|store/, { icon: "⚛️", color: "#22d3ee" }],
  [/interface|port/, { icon: "🔌", color: "#9333ea" }],
  [/util|helper|support|common/, { icon: "🧰", color: "#94a3b8" }],
  [/exception|error|advice/, { icon: "🚨", color: "#dc2626" }],
  [/security|filter|jwt|auth/, { icon: "🛡️", color: "#dc2626" }],
];

export function styleForNode(kind: string, stereotype?: string): KindStyle {
  if (stereotype && stereotype.trim()) {
    const norm = stereotype.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (STEREOTYPE_NORM[norm]) return STEREOTYPE_NORM[norm];
    for (const [re, style] of ROLE_KEYWORDS) if (re.test(norm)) return style;
  }
  return styleFor(kind);
}

export function tint(hex: string, alpha = 0.14): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const EDGE_COLOR: Record<string, string> = {
  CONTAINS: "#cbd5e1",
  CALLS: "#6366f1",
  DEPENDS_ON: "#64748b",
  PERSISTS_TO: "#e11d48",
  FK_TO: "#f472b6",
  EVOLVES: "#b45309",
  EXPOSES: "#06b6d4",
  USES_CONFIG: "#6b7280",
  IMPLEMENTS: "#a855f7",
  HAS_CONTRACT: "#fb923c",
  PUBLISHES: "#0ea5e9",
  SUBSCRIBES: "#0ea5e9",
  PACKAGES: "#0891b2",
  DEPLOYS_TO: "#0d9488",
  TESTS: "#16a34a",
  SECURES: "#dc2626",
  MIRRORS: "#7c3aed",
  CONSUMES: "#06b6d4",
};

export function edgeColor(kind: string): string {
  return EDGE_COLOR[kind] ?? "#94a3b8";
}

/** Plain-English meaning of each edge kind — shown as the connection label. */
const EDGE_PHRASE: Record<string, string> = {
  CONTAINS: "contains",
  DEPENDS_ON: "depends on",
  CALLS: "calls",
  EXPOSES: "exposes via HTTP",
  CONSUMES: "calls API",
  PERSISTS_TO: "persists to",
  READS: "reads",
  WRITES: "writes",
  FK_TO: "FK →",
  EVOLVES: "migrates",
  PUBLISHES: "publishes →",
  SUBSCRIBES: "subscribes ←",
  USES_CONFIG: "reads config",
  PACKAGES: "packages",
  DEPLOYS_TO: "deploys to",
  HAS_CONTRACT: "honours contract",
  IMPLEMENTS: "implements",
  TESTS: "tests",
  SECURES: "secures",
  MIRRORS: "mirrors",
  HANDLES: "handles error",
  THROWS: "throws",
};

export function edgePhrase(kind: string): string {
  return EDGE_PHRASE[kind] ?? kind.toLowerCase().replace(/_/g, " ");
}
