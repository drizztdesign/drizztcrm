// Smoke test: creates user, runs seed_demo_data, fetches deals
const URL_BASE = "https://fefdzzvxgmybtlofsdfd.supabase.co";
const ANON = "sb_publishable_3EhyIqIwng4T77A6KPJgPQ_-_f7UNlN";
const email = `drizzt.smoke.${Date.now()}@gmail.com`;
const pw = "hunter2pass";

const r1 = await fetch(`${URL_BASE}/auth/v1/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: ANON },
  body: JSON.stringify({ email, password: pw }),
});
const d1 = await r1.json();
console.log("1. signup status:", r1.status);
console.log("   response:", JSON.stringify(d1).slice(0, 300));

const token = d1.access_token || d1.session?.access_token;
if (!token) {
  console.log("(no access token — might need email confirmation)");
  process.exit(0);
}

const r2 = await fetch(`${URL_BASE}/rest/v1/rpc/seed_demo_data`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: ANON,
    Authorization: `Bearer ${token}`,
  },
  body: "{}",
});
console.log("2. seed status:", r2.status);
console.log("   body:", (await r2.text()).slice(0, 200));

const r3 = await fetch(`${URL_BASE}/rest/v1/deals?select=code,title,stage,temp&limit=5`, {
  headers: { apikey: ANON, Authorization: `Bearer ${token}` },
});
const d3 = await r3.json();
console.log("3. deals:", r3.status, Array.isArray(d3) ? d3.length : d3);
if (Array.isArray(d3)) console.log("   first:", JSON.stringify(d3[0]));

const r4 = await fetch(`${URL_BASE}/rest/v1/templates?select=id`, {
  headers: { apikey: ANON, Authorization: `Bearer ${token}` },
});
const d4 = await r4.json();
console.log("4. templates count:", Array.isArray(d4) ? d4.length : d4);

const r5 = await fetch(`${URL_BASE}/rest/v1/automations?select=id`, {
  headers: { apikey: ANON, Authorization: `Bearer ${token}` },
});
const d5 = await r5.json();
console.log("5. automations count:", Array.isArray(d5) ? d5.length : d5);

const r6 = await fetch(`${URL_BASE}/rest/v1/timeline_events?select=id`, {
  headers: { apikey: ANON, Authorization: `Bearer ${token}` },
});
const d6 = await r6.json();
console.log("6. timeline count:", Array.isArray(d6) ? d6.length : d6);
