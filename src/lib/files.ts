import type { DGData, DGNode } from "./types";
import type { GraphIndex } from "./graph";
import { canonicalRole, laneOf } from "./graph";

/**
 * Planned-files derivation — DEMO MOCK. The real product returns the planned
 * file tree from the backend (/api/design-graphs/{id}/files); here we
 * synthesise plausible paths from the graph nodes.
 */

export type FileRole =
  | "SOURCE" | "TEST" | "CONFIG" | "MIGRATION" | "CONTRACT" | "DEPLOY" | "BUILD_MANIFEST";

export interface FileEntry {
  path: string;
  module: string;
  role: FileRole;
  delivered: boolean;
  nodeId?: string;
}

export const ROLE_ICON: Record<FileRole, string> = {
  SOURCE: "📄",
  TEST: "🧪",
  CONFIG: "🔧",
  MIGRATION: "🧱",
  CONTRACT: "📋",
  DEPLOY: "🚀",
  BUILD_MANIFEST: "🧰",
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function isTest(n: DGNode): boolean {
  const aspects = (n.metadata?.aspects as string[] | undefined) ?? [];
  return aspects.includes("testing") || /test/i.test(n.stereotype ?? "");
}

/** Mirrors the work-unit narrative: backend mostly delivered, frontend mid-flight, deploy pending. */
function delivered(module: string, key: string): boolean {
  const m = module.toLowerCase();
  if (/db|database|contract/.test(m)) return true;
  if (/back/.test(m)) return hash(key) % 5 !== 0;
  if (/front|ui/.test(m)) return hash(key) % 2 === 0;
  return hash(key) % 4 === 0;
}

export function deriveFiles(d: DGData, idx: GraphIndex): FileEntry[] {
  const files: FileEntry[] = [];
  const seen = new Set<string>();
  const push = (f: Omit<FileEntry, "delivered">) => {
    if (seen.has(f.path)) return;
    seen.add(f.path);
    files.push({ ...f, delivered: delivered(f.module, f.path) });
  };

  const modules = new Set<string>();

  for (const n of d.nodes) {
    const lane = laneOf(idx, n.id);
    const module = lane.label;
    const frontend = /front|ui/i.test(module) || (n.metadata?.aspects as string[] | undefined)?.includes("frontend");
    if (n.kind === "CONTAINER") modules.add(module);
    const role = canonicalRole(n.stereotype);

    switch (n.kind) {
      case "COMPONENT":
      case "TYPE": {
        const test = isTest(n);
        if (frontend) {
          const base = n.name.replace(/\.(test\.)?(t|j)sx?$/i, "");
          const ext = role === "gateway" || /store|api/i.test(n.name) ? "ts" : "tsx";
          const p = test
            ? `frontend/src/__tests__/${base}.test.${ext}`
            : `frontend/src/${base}.${ext}`;
          push({ path: p, module, role: test ? "TEST" : "SOURCE", nodeId: n.id });
        } else {
          const dir = test ? "src/test/java" : "src/main/java";
          const pkgOf: Record<string, string> = {
            controller: "api", service: "service", repository: "repo", dto: "api/dto",
            domain: "domain", security: "security", filter: "security", config: "config",
          };
          const pkg = pkgOf[role] ?? "app";
          const mod = module.toLowerCase().replace(/[^a-z0-9]/g, "") || "backend";
          push({
            path: `${mod}/${dir}/ai/totallywild/${mod}/${test ? "" : pkg + "/"}${n.name.replace(/[^A-Za-z0-9]/g, "")}.java`,
            module, role: test ? "TEST" : "SOURCE", nodeId: n.id,
          });
        }
        break;
      }
      case "CONFIG": {
        // A PascalCase extensionless CONFIG (SecurityConfig) is a Java @Configuration class.
        if (/^[A-Z][A-Za-z0-9]*$/.test(n.name) && !frontend) {
          const mod = module.toLowerCase().replace(/[^a-z0-9]/g, "") || "backend";
          push({
            path: `${mod}/src/main/java/ai/totallywild/${mod}/config/${n.name}.java`,
            module, role: "SOURCE", nodeId: n.id,
          });
          break;
        }
        const name = n.name.includes(".") || n.name === "Dockerfile" ? n.name : `${n.name}.yml`;
        const mod = /compose/i.test(n.name) ? "" : `${module.toLowerCase().replace(/[^a-z0-9]/g, "")}/`;
        const isDeploy = /docker|compose/i.test(n.name);
        push({ path: `${mod}${name}`, module: isDeploy && !mod ? "deployment" : module, role: isDeploy ? "DEPLOY" : "CONFIG", nodeId: n.id });
        break;
      }
      case "MIGRATION":
        push({
          path: `backend/src/main/resources/${n.name.replace(/^db\//, "db/")}.xml`,
          module, role: "MIGRATION", nodeId: n.id,
        });
        break;
      case "CONTRACT":
        push({ path: "contract/openapi.yaml", module: "Contracts", role: "CONTRACT", nodeId: n.id });
        break;
    }
  }

  // Build manifests per top-level module we saw.
  for (const m of modules) {
    const ml = m.toLowerCase();
    if (/front|ui/.test(ml)) {
      push({ path: "frontend/package.json", module: m, role: "BUILD_MANIFEST" });
      push({ path: "frontend/tsconfig.json", module: m, role: "BUILD_MANIFEST" });
    } else if (/back/.test(ml)) {
      push({ path: `${ml.replace(/[^a-z0-9]/g, "")}/pom.xml`, module: m, role: "BUILD_MANIFEST" });
    }
  }

  return files.sort((a, b) => a.module.localeCompare(b.module) || a.path.localeCompare(b.path));
}
