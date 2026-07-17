/** Viewer JSON schema — mirrors DesignGraphJson.toViewer in the platform. */

export interface DGNode {
  id: string;
  kind: string;
  name: string;
  description?: string;
  status?: string;
  version?: string;
  stereotype?: string;
  visibility?: string;
  provenance?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DGEdge {
  id: string;
  src: string;
  dst: string;
  kind: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface DGData {
  projectId: string;
  label?: string;
  nodes: DGNode[];
  edges: DGEdge[];
  generatedAt?: string;
  nodeCount?: number;
  edgeCount?: number;
}

export interface ContractOperation {
  httpMethod: string;
  path: string;
  requestType?: string;
  responseType?: string;
  endpointId?: string;
}
