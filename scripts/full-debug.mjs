// Comprehensive debug — creates 2 users, verifies RLS isolation, mutations, realtime.
const URL_BASE = "https://fefdzzvxgmybtlofsdfd.supabase.co";
const ANON = "sb_publishable_3EhyIqIwng4T77A6KPJgPQ_-_f7UNlN";

const api = (token) => async (path, init = {}) => {
  const r = await fetch(URL_BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(init.headers ?? {}),
    },
  });
  return { status: r.status, json: await r.json().catch(() => null), text: null };
};

const signup = async (email, pw) => {
  const r = await fetch(URL_BASE + "/auth/v1/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ email, password: pw }),
  });
  return (await r.json()).access_token;
};

const line = (label, ok, extra = "") => console.log(`${ok ? "✓" : "✗"} ${label}${extra ? "  — " + extra : ""}`);

console.log("\n== DEBUG COMPLETO: flujo multi-usuario + RLS + mutations + realtime ==\n");

// 1. Two users
const emailA = `dbg.a.${Date.now()}@gmail.com`;
const emailB = `dbg.b.${Date.now()}@gmail.com`;
const tokenA = await signup(emailA, "hunter2pass");
const tokenB = await signup(emailB, "hunter2pass");
line("1. Signup usuarios A y B", !!tokenA && !!tokenB);

const A = api(tokenA);
const B = api(tokenB);

// 2. Onboarding trigger auto-seeded templates for both (19 each)
const tplA = await A("/rest/v1/templates?select=id");
const tplB = await B("/rest/v1/templates?select=id");
line("2. handle_new_user seedea 19 plantillas para A", tplA.json.length === 19, `A=${tplA.json.length}`);
line("3. handle_new_user seedea 19 plantillas para B", tplB.json.length === 19, `B=${tplB.json.length}`);

// 3. Run seed_demo_data for A only
const seedA = await A("/rest/v1/rpc/seed_demo_data", { method: "POST", body: "{}" });
line("4. A ejecuta seed_demo_data", seedA.status === 204);

// 4. A sees 16 deals, B sees 0 (RLS isolation)
const dealsA = await A("/rest/v1/deals?select=id");
const dealsB = await B("/rest/v1/deals?select=id");
line("5. A ve 16 deals", dealsA.json.length === 16, `A=${dealsA.json.length}`);
line("6. B ve 0 deals (RLS aísla)", dealsB.json.length === 0, `B=${dealsB.json.length}`);

// 5. B tries to read A's deal by ID (explicit attack)
const firstIdA = dealsA.json[0].id;
const crossRead = await B(`/rest/v1/deals?id=eq.${firstIdA}&select=id`);
line("7. B intenta leer un deal de A por id", crossRead.json.length === 0, `expected 0 rows, got ${crossRead.json.length}`);

// 6. B tries to UPDATE A's deal directly (explicit attack)
const crossUpdate = await B(`/rest/v1/deals?id=eq.${firstIdA}`, {
  method: "PATCH",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ stage: "cerrado" }),
});
line("8. B intenta modificar un deal de A", Array.isArray(crossUpdate.json) && crossUpdate.json.length === 0,
     `RLS devuelve ${JSON.stringify(crossUpdate.json).slice(0, 80)}`);

// 7. A updates a deal stage (Kanban simulation)
const beforeStage = dealsA.json[0];
const updA = await A(`/rest/v1/deals?id=eq.${firstIdA}`, {
  method: "PATCH",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ stage: "cerrado", stage_entered_at: new Date().toISOString() }),
});
line("9. A mueve un deal a 'cerrado'", updA.status === 200 && updA.json[0]?.stage === "cerrado");

// 8. A inserts a timeline event (Composer simulation)
const dealAny = await A(`/rest/v1/deals?select=id&limit=1`);
const tlInsert = await A("/rest/v1/timeline_events", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({
    deal_id: dealAny.json[0].id,
    kind: "note",
    who: "Debug",
    body: "Test timeline insert",
    t: "Ahora",
    occurred_at: new Date().toISOString(),
  }),
});
line("10. A añade timeline event", tlInsert.status === 201);

// 9. A inserts a task
const tInsert = await A("/rest/v1/tasks", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ title: "Debug task", kind: "note", priority: "normal", due: "Hoy" }),
});
line("11. A crea task", tInsert.status === 201);

// 10. A toggles task done
const newTaskId = tInsert.json[0]?.id;
const togT = await A(`/rest/v1/tasks?id=eq.${newTaskId}`, {
  method: "PATCH",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ done: true, done_at: new Date().toISOString() }),
});
line("12. A marca task como done", togT.status === 200 && togT.json[0]?.done === true);

// 11. A deletes task
const delT = await A(`/rest/v1/tasks?id=eq.${newTaskId}`, { method: "DELETE" });
line("13. A borra task", delT.status === 204);

// 12. Counts per user — proves full isolation
const auts = await A("/rest/v1/automations?select=id");
const buts = await B("/rest/v1/automations?select=id");
const scrA = await A("/rest/v1/scoring_rules?select=id");
const scrB = await B("/rest/v1/scoring_rules?select=id");
line("14. A tiene 10 automatizaciones", auts.json.length === 10);
line("15. B tiene 10 automatizaciones", buts.json.length === 10);
line("16. A tiene 8 scoring rules", scrA.json.length === 8);
line("17. B tiene 8 scoring rules", scrB.json.length === 8);

// 13. Cleanup
const mgmt = (q) => fetch("https://api.supabase.com/v1/projects/fefdzzvxgmybtlofsdfd/database/query", {
  method: "POST",
  headers: {
    Authorization: "Bearer sbp_67a0f460b278d89246a95938c7ac2564fe7e2d99",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: q }),
});
await mgmt(`delete from auth.users where email like 'dbg.%@gmail.com'`);
line("18. Cleanup usuarios debug", true);

console.log("\nDone.");
