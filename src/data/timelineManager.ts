import type { DGData, DGEdge, DGNode, ContractOperation } from "@/lib/types";

/**
 * "Timeline Manager" demo fixture — reconstructs the MVP screenshots' example
 * project (Java 21 Spring Boot + PostgreSQL backend, React/TypeScript frontend,
 * timelines/events REST API) in the platform's viewer JSON schema.
 */

const nodes: DGNode[] = [];
const edges: DGEdge[] = [];
let eid = 0;

function node(n: Partial<DGNode> & { id: string; kind: string; name: string }): string {
  nodes.push({
    status: "PLANNED",
    visibility: "NOT_APPLICABLE",
    provenance: "ARCHITECT",
    version: "1",
    createdAt: "2026-07-15T16:40:35Z",
    updatedAt: "2026-07-15T16:40:35Z",
    metadata: {},
    ...n,
  });
  return n.id;
}

function edge(src: string, dst: string, kind: string, metadata?: Record<string, unknown>): void {
  edges.push({ id: `e${eid++}`, src, dst, kind, metadata: metadata ?? {} });
}

// ---------------------------------------------------------------- system
const SYSTEM = node({
  id: "system:timeline-manager",
  kind: "SYSTEM",
  name: "Timeline Manager",
  visibility: "PUBLIC",
  description:
    "Timeline Manager is a single-page web application that allows authenticated users to create, view, update, and delete timelines and events. Users can organize events chronologically within timelines, providing a structured way to track personal or professional milestones. The system uses a Java 21 Spring Boot backend with PostgreSQL for persistence and a React/TypeScript frontend for the user interface. The stack is chosen for its robustness, strong typing, and excellent tooling for both backend and frontend development.",
  metadata: {
    aspects: ["system"],
    artifactTypes: ["system"],
    techStack: [
      "Java 21", "Spring Boot 3.4.1", "Spring Data JPA", "PostgreSQL 17",
      "PostgreSQL Driver 42.7.13", "Liquibase", "Testcontainers", "React 19",
      "TypeScript", "Vite", "npm", "Maven", "Docker Compose",
    ],
  },
});

// ------------------------------------------------------------- containers
const BACKEND = node({
  id: "container:backend", kind: "CONTAINER", name: "backend", stereotype: "Service",
  description: "Spring Boot REST service owning timelines and events. Exposes the HTTP API, enforces JWT auth, persists to PostgreSQL.",
  metadata: { aspects: ["backend"], artifactTypes: ["module:jar"] },
});
const FRONTEND = node({
  id: "container:frontend", kind: "CONTAINER", name: "frontend", stereotype: "ui-app",
  description: "React/TypeScript single-page app. Typed API client generated from the contract; forms and lists for timelines and events.",
  metadata: { aspects: ["frontend", "ui"], artifactTypes: ["ui-app"] },
});
const DB = node({
  id: "container:db", kind: "CONTAINER", name: "db", stereotype: "postgres",
  description: "PostgreSQL 17 database, run locally via Docker Compose. Owns the timelines and events tables.",
  metadata: { aspects: ["database", "data", "persistence"], artifactTypes: ["database"] },
});
const DEPLOY = node({
  id: "container:deployment", kind: "CONTAINER", name: "deployment", stereotype: "deployment",
  description: "Docker Compose deployment: backend + frontend images and the PostgreSQL container on one host.",
  metadata: { aspects: ["deployment", "infrastructure"], artifactTypes: ["deployment"] },
});
const BUILD = node({
  id: "container:build-tools", kind: "CONTAINER", name: "Build Tools", stereotype: "maven-module",
  description: "Build tooling: Maven for the backend, npm/Vite for the frontend.",
  metadata: { aspects: ["build"], artifactTypes: ["build"] },
});
for (const c of [BACKEND, FRONTEND, DB, DEPLOY, BUILD]) edge(SYSTEM, c, "CONTAINS");

// ------------------------------------------------------------ requirements
const REQS: Array<[string, string, string]> = [
  ["req:create-timelines", "Users can create and name timelines", "A signed-in user can create a timeline with a name and description."],
  ["req:add-events", "Users can add events to a timeline", "Events carry a title, description and occurred-at instant, and belong to exactly one timeline."],
  ["req:chronological", "Events are ordered chronologically", "Listing a timeline's events returns them ordered by occurred-at."],
  ["req:edit-timelines", "Users can update and delete timelines", "Timelines are editable and deletable; deleting a timeline removes its events."],
  ["req:edit-events", "Users can update and delete events", "Events are editable and deletable individually."],
  ["req:auth", "Only authenticated users access their data", "All API operations require a valid JWT; users only see their own timelines."],
  ["req:local-run", "System runs locally via Docker Compose", "One command brings up db, backend and frontend for local development."],
];
for (const [id, name, description] of REQS) {
  node({ id, kind: "REQUIREMENT", name, description, metadata: { aspects: ["requirement"] } });
  edge(SYSTEM, id, "CONTAINS");
}

// ---------------------------------------------------------------- contract
const CONTRACT = node({
  id: "contract:timeline-api", kind: "CONTRACT", name: "API Contract", stereotype: "openapi",
  description: "The testable UI↔backend REST contract for timelines and events.",
  metadata: {
    aspects: ["contract", "api"],
    protocol: "HTTP/REST",
    contractStyle: "openapi",
    sourceOfTruth: "openapi.yaml",
    operations: 8,
    generation: {
      sourceOfTruth: "openapi.yaml",
      tool: "openapi-generator (server) / openapi-typescript-codegen (client)",
      server: "controller interfaces + request/response DTOs generated from openapi.yaml",
      client: "typed API client generated from openapi.yaml",
    },
    verificationStrategy: "shared interface — typed client + provider integration tests across the boundary",
  },
});
edge(SYSTEM, CONTRACT, "CONTAINS");
edge(BACKEND, CONTRACT, "HAS_CONTRACT");
edge(FRONTEND, CONTRACT, "HAS_CONTRACT");

// ---------------------------------------------------------------- endpoints
const OPS: Array<{ id: string; name: string; m: string; p: string; req?: string; res: string }> = [
  { id: "ep:create-timeline", name: "CreateTimelineEndpoint", m: "POST", p: "/timelines", req: "CreateTimelineRequest", res: "TimelineResponse" },
  { id: "ep:list-timelines", name: "GetTimelinesEndpoint", m: "GET", p: "/timelines", res: "List<TimelineResponse>" },
  { id: "ep:update-timeline", name: "UpdateTimelineEndpoint", m: "PUT", p: "/timelines/{id}", req: "UpdateTimelineRequest", res: "TimelineResponse" },
  { id: "ep:delete-timeline", name: "DeleteTimelineEndpoint", m: "DELETE", p: "/timelines/{id}", res: "Void" },
  { id: "ep:create-event", name: "CreateEventEndpoint", m: "POST", p: "/timelines/{timelineId}/events", req: "CreateEventRequest", res: "EventResponse" },
  { id: "ep:list-events", name: "GetEventsEndpoint", m: "GET", p: "/timelines/{timelineId}/events", res: "List<EventResponse>" },
  { id: "ep:update-event", name: "UpdateEventEndpoint", m: "PUT", p: "/events/{eventId}", req: "UpdateEventRequest", res: "EventResponse" },
  { id: "ep:delete-event", name: "DeleteEventEndpoint", m: "DELETE", p: "/events/{eventId}", res: "Void" },
];
const operationsList: ContractOperation[] = [];
for (const op of OPS) {
  node({
    id: op.id, kind: "ENDPOINT", name: op.name, stereotype: "contract-op", visibility: "PUBLIC",
    description: `${op.m} ${op.p}`,
    metadata: { aspects: ["api", "backend"], httpMethod: op.m, path: op.p, requestDto: op.req, responseDto: op.res },
  });
  edge(CONTRACT, op.id, "EXPOSES");
  operationsList.push({ httpMethod: op.m, path: op.p, requestType: op.req, responseType: op.res, endpointId: op.id });
}
const contractNode = nodes.find((n) => n.id === CONTRACT)!;
contractNode.metadata = { ...contractNode.metadata, operationsList };
edge("ep:create-timeline", "req:create-timelines", "IMPLEMENTS");
edge("ep:create-event", "req:add-events", "IMPLEMENTS");
edge("ep:list-events", "req:chronological", "IMPLEMENTS");
edge("ep:update-timeline", "req:edit-timelines", "IMPLEMENTS");
edge("ep:delete-timeline", "req:edit-timelines", "IMPLEMENTS");
edge("ep:update-event", "req:edit-events", "IMPLEMENTS");
edge("ep:delete-event", "req:edit-events", "IMPLEMENTS");

// ---------------------------------------------------------------- backend
type NodeSpec = { id: string; name: string; kind?: string; st?: string; d?: string; meta?: Record<string, unknown> };
function backendNode(s: NodeSpec): string {
  const id = node({
    id: s.id, kind: s.kind ?? "COMPONENT", name: s.name, stereotype: s.st, description: s.d,
    metadata: { aspects: undefined, ...(s.meta ?? {}) },
  });
  edge(BACKEND, id, "CONTAINS");
  return id;
}

const APP = backendNode({ id: "be:BackendApplication", name: "BackendApplication", st: "SpringBootApplication", d: "Spring Boot entry point." });
const TL_CTRL = backendNode({ id: "be:TimelineController", name: "TimelineController", st: "RestController", d: "HTTP adapter for timeline CRUD. Implements the generated contract interface." });
const EV_CTRL = backendNode({ id: "be:EventController", name: "EventController", st: "RestController", d: "HTTP adapter for event CRUD within a timeline." });
const TL_SVC = backendNode({ id: "be:TimelineService", name: "TimelineService", st: "Service", d: "Timeline use-cases: create, rename, delete (cascades to events)." });
const EV_SVC = backendNode({ id: "be:EventService", name: "EventService", st: "Service", d: "Event use-cases: add to timeline, update, delete, list chronologically." });
const TL_REPO = backendNode({ id: "be:TimelineRepository", name: "TimelineRepository", st: "Repository", d: "Spring Data JPA repository for Timeline." });
const EV_REPO = backendNode({ id: "be:EventRepository", name: "EventRepository", st: "Repository", d: "Spring Data JPA repository for Event, ordered by occurredAt." });
const TL_ENT = backendNode({ id: "be:Timeline", name: "Timeline", kind: "TYPE", st: "Entity", d: "Timeline aggregate root: id, name, description, owner, audit timestamps." });
const EV_ENT = backendNode({ id: "be:Event", name: "Event", kind: "TYPE", st: "Entity", d: "Event entity: id, timeline FK, title, description, occurredAt." });
const DTOS = [
  ["be:CreateTimelineRequest", "CreateTimelineRequest"], ["be:UpdateTimelineRequest", "UpdateTimelineRequest"],
  ["be:TimelineResponse", "TimelineResponse"], ["be:CreateEventRequest", "CreateEventRequest"],
  ["be:UpdateEventRequest", "UpdateEventRequest"], ["be:EventResponse", "EventResponse"],
  ["be:ErrorResponse", "ErrorResponse"],
].map(([id, name]) => backendNode({ id, name, kind: "TYPE", st: "DTO", d: `${name} wire DTO, generated from openapi.yaml.` }));
const JWT_FILTER = backendNode({ id: "be:JwtAuthenticationFilter", name: "JwtAuthenticationFilter", st: "Filter", d: "Validates the bearer token on every request and populates the security context." });
const JWT_PROVIDER = backendNode({ id: "be:JwtTokenProvider", name: "JwtTokenProvider", st: "Security", d: "Issues and verifies JWTs." });
const SEC_CFG = backendNode({ id: "be:SecurityConfig", name: "SecurityConfig", kind: "CONFIG", st: "security-policy", d: "Spring Security filter chain: all /timelines and /events routes require authentication." });
const EXC = backendNode({ id: "be:GlobalExceptionHandler", name: "GlobalExceptionHandler", st: "ControllerAdvice", d: "Maps domain errors to ErrorResponse payloads." });
const APP_YML = backendNode({ id: "be:application.yml", name: "application.yml", kind: "CONFIG", st: "spring-config", d: "Datasource, Liquibase and JWT configuration." });
const BE_DOCKERFILE = backendNode({ id: "be:Dockerfile", name: "Dockerfile", kind: "CONFIG", st: "dockerfile", d: "Builds the backend OCI image." });
const MIG1 = backendNode({ id: "be:mig-1", name: "db/changelog/1_create_timelines", kind: "MIGRATION", d: "Creates the timelines table." });
const MIG2 = backendNode({ id: "be:mig-2", name: "db/changelog/2_create_events", kind: "MIGRATION", d: "Creates the events table with FK to timelines." });

const BE_TESTS = [
  ["be:TimelineServiceTest", "TimelineServiceTest", "test", TL_SVC],
  ["be:EventServiceTest", "EventServiceTest", "test", EV_SVC],
  ["be:TimelineControllerTest", "TimelineControllerTest", "test", TL_CTRL],
  ["be:EventControllerTest", "EventControllerTest", "test", EV_CTRL],
  ["be:TimelineControllerIT", "TimelineControllerIT", "integration-test", TL_CTRL],
  ["be:EventControllerIT", "EventControllerIT", "integration-test", EV_CTRL],
  ["be:TimelineRepositoryIT", "TimelineRepositoryIT", "integration-test", TL_REPO],
  ["be:EventRepositoryIT", "EventRepositoryIT", "integration-test", EV_REPO],
  ["be:IntegrationTestBase", "IntegrationTestBase", "integration-test-base", null],
] as const;
for (const [id, name, st, target] of BE_TESTS) {
  backendNode({ id, name, st, d: st === "integration-test-base" ? "Testcontainers PostgreSQL base class." : `Tests ${name.replace(/Test|IT$/g, "")}.` });
  if (target) edge(id, target, "TESTS");
}

// backend wiring
edge(TL_CTRL, TL_SVC, "CALLS");
edge(EV_CTRL, EV_SVC, "CALLS");
edge(TL_SVC, TL_REPO, "CALLS");
edge(EV_SVC, EV_REPO, "CALLS");
edge(EV_SVC, TL_REPO, "CALLS");
edge(TL_CTRL, CONTRACT, "IMPLEMENTS");
edge(EV_CTRL, CONTRACT, "IMPLEMENTS");
for (const ep of ["ep:create-timeline", "ep:list-timelines", "ep:update-timeline", "ep:delete-timeline"]) edge(TL_CTRL, ep, "EXPOSES");
for (const ep of ["ep:create-event", "ep:list-events", "ep:update-event", "ep:delete-event"]) edge(EV_CTRL, ep, "EXPOSES");
edge(SEC_CFG, BACKEND, "SECURES");
edge(JWT_FILTER, SEC_CFG, "IMPLEMENTS");
edge(JWT_FILTER, JWT_PROVIDER, "CALLS");
edge(APP, APP_YML, "USES_CONFIG");
edge(JWT_PROVIDER, APP_YML, "USES_CONFIG");
edge(EXC, DTOS[6], "CALLS");
edge(SEC_CFG, "req:auth", "IMPLEMENTS");

// ---------------------------------------------------------------- database
function table(id: string, name: string, d: string, cols: Array<[string, string]>): string {
  const t = node({ id, kind: "TABLE", name, description: d, metadata: { aspects: ["database", "data", "persistence"] } });
  edge(DB, t, "CONTAINS");
  for (const [cn, ct] of cols) {
    const c = node({
      id: `${id}.${cn}`, kind: "COLUMN", name: cn,
      metadata: { aspects: ["database", "data"], columnType: ct },
    });
    edge(t, c, "CONTAINS");
  }
  return t;
}
const T_TIMELINES = table("tbl:timelines", "timelines", "One row per timeline.", [
  ["id", "uuid pk"], ["owner_id", "uuid"], ["name", "varchar(200)"], ["description", "text"],
  ["created_at", "timestamptz"], ["updated_at", "timestamptz"],
]);
const T_EVENTS = table("tbl:events", "events", "One row per event; belongs to a timeline.", [
  ["id", "uuid pk"], ["timeline_id", "uuid fk"], ["title", "varchar(200)"], ["description", "text"],
  ["occurred_at", "timestamptz"], ["created_at", "timestamptz"],
]);
edge("tbl:events.timeline_id", "tbl:timelines.id", "FK_TO", { cardinality: "N:1" });
edge(TL_ENT, T_TIMELINES, "PERSISTS_TO");
edge(EV_ENT, T_EVENTS, "PERSISTS_TO");
edge(TL_REPO, T_TIMELINES, "PERSISTS_TO");
edge(EV_REPO, T_EVENTS, "PERSISTS_TO");
edge(MIG1, T_TIMELINES, "EVOLVES");
edge(MIG2, T_EVENTS, "EVOLVES");

// ---------------------------------------------------------------- frontend
function feNode(s: NodeSpec): string {
  const id = node({
    id: s.id, kind: s.kind ?? "COMPONENT", name: s.name, stereotype: s.st ?? "ReactComponent",
    description: s.d, metadata: s.meta ?? {},
  });
  edge(FRONTEND, id, "CONTAINS");
  return id;
}
const FE_APP = feNode({ id: "fe:App", name: "App", d: "Root component: routing between timeline list and timeline detail." });
const TL_API = feNode({ id: "fe:TimelineApi", name: "TimelineApi", st: "Gateway", d: "Typed client for the timeline operations, generated from openapi.yaml." });
const EV_API = feNode({ id: "fe:EventApi", name: "EventApi", st: "Gateway", d: "Typed client for the event operations, generated from openapi.yaml." });
const TL_LIST = feNode({ id: "fe:TimelineList", name: "TimelineList", d: "Lists the user's timelines." });
const EV_LIST = feNode({ id: "fe:EventList", name: "EventList", d: "Chronological event list for the selected timeline." });
const TL_FORM = feNode({ id: "fe:TimelineForm", name: "TimelineForm", d: "Create/edit timeline form." });
const EV_FORM = feNode({ id: "fe:EventForm", name: "EventForm", d: "Create/edit event form with occurred-at picker." });
const TL_STORE = feNode({ id: "fe:TimelineStore", name: "TimelineStore", st: "store", d: "Client state for timelines." });
const EV_STORE = feNode({ id: "fe:EventStore", name: "EventStore", st: "store", d: "Client state for events." });
const FE_MAIN = feNode({ id: "fe:main", name: "main.tsx", d: "SPA entry point." });
const VITE_CFG = feNode({ id: "fe:vite.config.ts", name: "vite.config.ts", kind: "CONFIG", st: "config", d: "Vite build + dev proxy to the backend." });
const FE_DOCKERFILE = feNode({ id: "fe:Dockerfile", name: "Dockerfile", kind: "CONFIG", st: "dockerfile", d: "Builds the static frontend image." });
const FE_TESTS = [
  ["fe:TimelineList.test", "TimelineList.test.tsx", TL_LIST],
  ["fe:EventList.test", "EventList.test.tsx", EV_LIST],
  ["fe:TimelineForm.test", "TimelineForm.test.tsx", TL_FORM],
  ["fe:EventForm.test", "EventForm.test.tsx", EV_FORM],
  ["fe:EventApi.test", "EventApi.test.ts", EV_API],
] as const;
for (const [id, name, target] of FE_TESTS) {
  feNode({ id, name, st: "test", d: `Component test for ${name.replace(".test.tsx", "").replace(".test.ts", "")}.` });
  edge(id, target, "TESTS");
}
edge(FE_MAIN, FE_APP, "CALLS");
edge(FE_APP, TL_LIST, "CALLS");
edge(FE_APP, EV_LIST, "CALLS");
edge(TL_LIST, TL_FORM, "CALLS");
edge(EV_LIST, EV_FORM, "CALLS");
edge(TL_LIST, TL_STORE, "CALLS");
edge(EV_LIST, EV_STORE, "CALLS");
edge(TL_STORE, TL_API, "CALLS");
edge(EV_STORE, EV_API, "CALLS");
for (const ep of ["ep:create-timeline", "ep:list-timelines", "ep:update-timeline", "ep:delete-timeline"]) edge(TL_API, ep, "CONSUMES");
for (const ep of ["ep:create-event", "ep:list-events", "ep:update-event", "ep:delete-event"]) edge(EV_API, ep, "CONSUMES");

// ------------------------------------------------------------- dependencies
const BE_DEPS = [
  ["dep:spring-boot", "spring-boot-starter-web", "3.4.1"],
  ["dep:spring-data-jpa", "spring-boot-starter-data-jpa", "3.4.1"],
  ["dep:postgresql", "PostgreSQL Driver", "42.7.13"],
  ["dep:liquibase", "liquibase-core", "4.31.0"],
  ["dep:testcontainers", "Testcontainers", "1.20.6"],
  ["dep:junit", "junit-jupiter", "5.11.4"],
  ["dep:spring-boot-test", "spring-boot-starter-test", "3.4.1"],
] as const;
for (const [id, name, ver] of BE_DEPS) {
  node({ id, kind: "DEPENDENCY", name, stereotype: "maven", metadata: { aspects: ["build", "backend"], current: ver, source: "maven-central", managedBy: "spring-boot-bom" } });
  edge(BUILD, id, "CONTAINS");
  edge(BACKEND, id, "DEPENDS_ON");
}
const FE_DEPS = [
  ["dep:react", "React", "19.1.0"],
  ["dep:typescript", "TypeScript", "5.8.2"],
  ["dep:vite", "Vite", "6.2.0"],
] as const;
for (const [id, name, ver] of FE_DEPS) {
  node({ id, kind: "DEPENDENCY", name, stereotype: "npm", metadata: { aspects: ["build", "frontend"], current: ver, source: "npm" } });
  edge(BUILD, id, "CONTAINS");
  edge(FRONTEND, id, "DEPENDS_ON");
}

// ------------------------------------------------------------- deployment
const IMG_BE = node({ id: "img:backend", kind: "DOCKER_IMAGE", name: "timeline-backend:latest", stereotype: "dockerfile-image", metadata: { aspects: ["deployment"] } });
const IMG_FE = node({ id: "img:frontend", kind: "DOCKER_IMAGE", name: "timeline-frontend:latest", stereotype: "dockerfile-image", metadata: { aspects: ["deployment"] } });
const IMG_PG = node({ id: "img:postgres", kind: "DOCKER_IMAGE", name: "postgres:17", stereotype: "registry-image", metadata: { aspects: ["deployment", "database"] } });
const ART_BE = node({ id: "art:backend-jar", kind: "DEPLOYABLE_ARTIFACT", name: "backend fat-jar", stereotype: "fat-jar", metadata: { aspects: ["deployment"] } });
const ENV_LOCAL = node({ id: "env:docker-compose", kind: "ENVIRONMENT", name: "Docker Compose host", stereotype: "dev", description: "Local development environment: db + backend + frontend.", metadata: { aspects: ["deployment", "infrastructure"] } });
const COMPOSE = node({ id: "cfg:docker-compose.yml", kind: "CONFIG", name: "docker-compose.yml", stereotype: "config", metadata: { aspects: ["deployment", "infrastructure", "config"] } });
for (const d of [IMG_BE, IMG_FE, IMG_PG, ART_BE, ENV_LOCAL, COMPOSE]) edge(DEPLOY, d, "CONTAINS");
edge(ART_BE, BACKEND, "PACKAGES");
edge(IMG_BE, ART_BE, "PACKAGES");
edge(IMG_FE, FRONTEND, "PACKAGES");
edge(IMG_PG, DB, "PACKAGES");
edge(IMG_BE, ENV_LOCAL, "DEPLOYS_TO");
edge(IMG_FE, ENV_LOCAL, "DEPLOYS_TO");
edge(IMG_PG, ENV_LOCAL, "DEPLOYS_TO");
edge(COMPOSE, "req:local-run", "IMPLEMENTS");
edge(BE_DOCKERFILE, IMG_BE, "PACKAGES");
edge(FE_DOCKERFILE, IMG_FE, "PACKAGES");

export const timelineManager: DGData = {
  projectId: "PRJ-13aa3921",
  label: "Timeline Manager",
  generatedAt: "2026-07-15T16:40:35Z",
  nodes,
  edges,
  nodeCount: nodes.length,
  edgeCount: edges.length,
};
