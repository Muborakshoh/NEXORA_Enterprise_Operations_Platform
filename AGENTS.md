# AGENTS.md

Read `MASTER_SPEC.md` before any work: it is the source of truth for architecture and phase order.

## Rules
- Work phase by phase (spec section 61); never "everything at once".
- Read the existing implementation before changing it.
- No mock data presented as real (spec 3.4).
- Never commit secrets; `.env.example` holds placeholders only.
- Every schema change is a new migration; never edit migrations already applied.
- No business logic in controllers.
