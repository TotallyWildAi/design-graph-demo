"use client";

import type { DGNode, ContractOperation } from "@/lib/types";
import { nodeAspects, type GraphIndex } from "@/lib/graph";
import { edgePhrase, styleForNode, tint } from "@/lib/style";

interface Props {
  idx: GraphIndex;
  node: DGNode | null;
  onSelect: (id: string) => void;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-[3px] border-b border-[var(--border)]/60">
      <span className="text-[var(--muted)]">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

export function InspectorPanel({ idx, node, onSelect }: Props) {
  if (!node) {
    return (
      <aside className="w-72 shrink-0 border-l border-[var(--border)] bg-[var(--panel-bg)] p-4 text-[11px] text-[var(--muted)]">
        Select a node to inspect it — its role, metadata, wire schema and every
        incoming / outgoing relationship.
      </aside>
    );
  }
  const s = styleForNode(node.kind, node.stereotype);
  const outgoing = idx.out.get(node.id) ?? [];
  const incoming = idx.in.get(node.id) ?? [];
  const aspects = nodeAspects(idx, node);
  const meta = node.metadata ?? {};
  const techStack = meta.techStack as string[] | undefined;
  const artifactTypes = meta.artifactTypes as string[] | undefined;
  const ops = meta.operationsList as ContractOperation[] | undefined;
  const httpMethod = meta.httpMethod as string | undefined;

  return (
    <aside className="w-72 shrink-0 border-l border-[var(--border)] bg-[var(--panel-bg)] overflow-y-auto text-[11px]">
      <div className="p-3 border-b border-[var(--border)]" style={{ background: tint(s.color, 0.08) }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{s.icon}</span>
          <div className="min-w-0">
            <div className="font-bold text-[13px] truncate">{node.name}</div>
            <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: s.color }}>
              {node.kind}
              {node.stereotype ? ` · ${node.stereotype}` : ""}
            </div>
          </div>
        </div>
      </div>

      {node.description && (
        <div className="p-3 border-b border-[var(--border)]">
          <div className="panel-heading">About</div>
          <p className="mt-1 leading-relaxed text-[var(--text-soft)]">{node.description}</p>
        </div>
      )}

      <div className="p-3 border-b border-[var(--border)]">
        {node.status && <Row k="Status" v={node.status} />}
        {node.visibility && node.visibility !== "NOT_APPLICABLE" && <Row k="Visibility" v={node.visibility} />}
        {node.provenance && <Row k="Provenance" v={node.provenance} />}
        {node.version && <Row k="Version" v={node.version} />}
        {node.updatedAt && <Row k="Updated" v={new Date(node.updatedAt).toLocaleString()} />}
      </div>

      <div className="p-3 border-b border-[var(--border)]">
        <div className="panel-heading">Metadata</div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {aspects.map((a) => (
            <span key={a} className="px-1.5 py-0.5 rounded bg-[var(--iris-soft)] text-[var(--iris)] text-[10px] font-semibold">
              {a}
            </span>
          ))}
        </div>
        {artifactTypes && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {artifactTypes.map((a) => (
              <span key={a} className="px-1.5 py-0.5 rounded border border-[var(--border)] text-[10px] text-[var(--muted)] font-mono">
                {a}
              </span>
            ))}
          </div>
        )}
        {techStack && (
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-[var(--text-soft)]">
            <span className="font-bold">techStack:</span> {techStack.join(", ")}
          </p>
        )}
        {httpMethod && (
          <p className="mt-2 font-mono text-[10px]">
            <span className="font-bold">{httpMethod}</span> {String(meta.path ?? "")}
            <br />
            <span className="text-[var(--muted)]">
              {String(meta.requestDto ?? "∅")} → {String(meta.responseDto ?? "∅")}
            </span>
          </p>
        )}
      </div>

      {ops && (
        <div className="p-3 border-b border-[var(--border)]">
          <div className="panel-heading">Operations (wire schema)</div>
          {ops.map((op) => (
            <div key={`${op.httpMethod} ${op.path}`} className="py-1.5 border-b border-[var(--border)]/60 last:border-0">
              <div className="font-mono text-[10.5px] font-bold">
                {op.httpMethod} <span className="font-semibold">{op.path}</span>
              </div>
              <div className="font-mono text-[10px] text-[var(--muted)]">
                {op.requestType ?? "∅"} → {op.responseType ?? "∅"}
              </div>
            </div>
          ))}
          <div className="mt-2 text-[10px] font-semibold text-emerald-600">✓ conforms to profile</div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="p-3 border-b border-[var(--border)]">
          <div className="panel-heading">Outgoing ({outgoing.length})</div>
          {outgoing.map((e) => {
            const t = idx.byId.get(e.dst);
            return (
              <button
                key={e.id}
                onClick={() => onSelect(e.dst)}
                className="flex w-full items-baseline gap-1.5 py-[3px] text-left hover:bg-[var(--hover)] rounded px-1 -mx-1"
              >
                <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--iris)" }}>
                  → {edgePhrase(e.kind)}
                </span>
                <span className="truncate">{t?.name ?? e.dst}</span>
              </button>
            );
          })}
        </div>
      )}
      {incoming.length > 0 && (
        <div className="p-3">
          <div className="panel-heading">Incoming ({incoming.length})</div>
          {incoming.map((e) => {
            const t = idx.byId.get(e.src);
            return (
              <button
                key={e.id}
                onClick={() => onSelect(e.src)}
                className="flex w-full items-baseline gap-1.5 py-[3px] text-left hover:bg-[var(--hover)] rounded px-1 -mx-1"
              >
                <span className="text-[10px] font-semibold shrink-0 text-[var(--amber,#d97706)]">
                  ← {edgePhrase(e.kind)}
                </span>
                <span className="truncate">{t?.name ?? e.src}</span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
