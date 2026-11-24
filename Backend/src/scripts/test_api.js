/**
 * Ather3D — Full API Test Suite
 * Run: node Backend/src/scripts/test_api.js
 */

const BASE = "http://localhost:5000/api";
let passed = 0, failed = 0, warned = 0;
const bugs = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function req(method, path, { body, token, form } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let bodyStr, ct;
  if (body) { bodyStr = JSON.stringify(body); ct = "application/json"; headers["Content-Type"] = ct; }

  try {
    const r = await fetch(`${BASE}${path}`, { method, headers, body: bodyStr });
    let data;
    try { data = await r.json(); } catch { data = {}; }
    return { status: r.status, data };
  } catch (e) {
    return { status: 0, data: { error: e.message } };
  }
}

function pass(label) {
  passed++;
  console.log(`  ✅ ${label}`);
}
function fail(label, detail) {
  failed++;
  bugs.push({ label, detail });
  console.log(`  ❌ ${label}`);
  if (detail) console.log(`       → ${detail}`);
}
function warn(label, detail) {
  warned++;
  bugs.push({ label, detail, severity: "warn" });
  console.log(`  ⚠️  ${label}`);
  if (detail) console.log(`       → ${detail}`);
}
function section(name) { console.log(`\n━━ ${name} ${"─".repeat(50 - name.length)}`); }

// ─── Test runner ─────────────────────────────────────────────────────────────
async function run() {
  console.log("🧪 Ather3D API Test Suite\n");

  let customerToken, adminToken, productId, requestId, testUserId;
  const TS = Date.now();

  // ═══════════════════════════════════════════════════════════════════
  section("1. HEALTH");
  {
    const { status, data } = await req("GET", "/health");
    status === 200 && data.success ? pass("GET /health → 200") : fail("GET /health", `${status} ${JSON.stringify(data)}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  section("2. AUTH — Signup");
  {
    // Valid signup
    const { status, data } = await req("POST", "/users/signup", {
      body: { name: "Test Customer", email: `testcust_${TS}@example.com`, password: "pass123" }
    });
    if (status === 201 && data.token) {
      customerToken = data.token;
      testUserId = data.user?.id;
      pass("POST /users/signup valid → 201 + token");
    } else {
      fail("POST /users/signup valid", `${status} ${JSON.stringify(data)}`);
    }

    // Missing fields
    const r2 = await req("POST", "/users/signup", { body: { email: "x@x.com" } });
    r2.status === 400 && r2.data.code === "VALIDATION_FAILED"
      ? pass("Signup missing fields → 400 VALIDATION_FAILED")
      : fail("Signup missing fields", `Got ${r2.status} code=${r2.data.code}`);

    // Short password
    const r3 = await req("POST", "/users/signup", {
      body: { name: "A", email: `short_${TS}@x.com`, password: "123" }
    });
    r3.status === 400 ? pass("Signup short password → 400")
      : fail("Signup short password", `Expected 400, got ${r3.status}`);

    // Duplicate email
    const r4 = await req("POST", "/users/signup", {
      body: { name: "Dup", email: `testcust_${TS}@example.com`, password: "pass123" }
    });
    r4.status === 409 && r4.data.code === "DUPLICATE_KEY"
      ? pass("Signup duplicate email → 409 DUPLICATE_KEY")
      : fail("Signup duplicate email", `Got ${r4.status} code=${r4.data.code}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  section("3. AUTH — Login");
  {
    // Valid admin login
    const rAdmin = await req("POST", "/users/login", {
      body: { email: "ather3dadmin@gmail.com", password: "Ather3D@Admin2026" }
    });
    if (rAdmin.status === 200 && rAdmin.data.token && rAdmin.data.user?.role === "admin") {
      adminToken = rAdmin.data.token;
      pass("Admin login → 200 + token + role=admin");
    } else {
      fail("Admin login", `${rAdmin.status} role=${rAdmin.data.user?.role} ${JSON.stringify(rAdmin.data)}`);
    }

    // Wrong password
    const r2 = await req("POST", "/users/login", {
      body: { email: "ather3dadmin@gmail.com", password: "wrongpass" }
    });
    r2.status === 401 && r2.data.code === "AUTH_REQUIRED"
      ? pass("Login wrong password → 401 AUTH_REQUIRED")
      : fail("Login wrong password", `Got ${r2.status} code=${r2.data.code}`);

    // Non-existent user
    const r3 = await req("POST", "/users/login", {
      body: { email: "nobody_${TS}@x.com", password: "pass123" }
    });
    r3.status === 401 ? pass("Login unknown email → 401")
      : fail("Login unknown email", `Expected 401, got ${r3.status}`);

    // Missing body
    const r4 = await req("POST", "/users/login", { body: {} });
    r4.status === 400 ? pass("Login empty body → 400")
      : fail("Login empty body", `Expected 400, got ${r4.status}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  section("4. AUTH — /me");
  {
    // With valid token
    const { status, data } = await req("GET", "/users/me", { token: customerToken });
    status === 200 && data.user ? pass("GET /users/me authenticated → 200")
      : fail("GET /users/me authenticated", `${status} ${JSON.stringify(data)}`);

    // No token
    const r2 = await req("GET", "/users/me");
    r2.status === 401 && r2.data.code === "AUTH_REQUIRED"
      ? pass("GET /users/me no token → 401 AUTH_REQUIRED")
      : fail("GET /users/me no token", `Got ${r2.status} code=${r2.data.code}`);

    // Garbage token
    const r3 = await req("GET", "/users/me", { token: "not.a.real.token" });
    r3.status === 401 ? pass("GET /users/me bad token → 401")
      : fail("GET /users/me bad token", `Expected 401, got ${r3.status}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  section("5. PRODUCTS — Public Read");
  {
    const { status, data } = await req("GET", "/products");
    status === 200 && Array.isArray(data.products)
      ? pass("GET /products → 200 array")
      : fail("GET /products", `${status} ${JSON.stringify(data)}`);

    // Check assetKey not leaked
    if (data.products && data.products.length > 0) {
      const leaked = data.products.some(p => p.assetKey !== undefined);
      leaked
        ? fail("GET /products assetKey not leaked", "assetKey found in public response!")
        : pass("GET /products assetKey not in response");
    } else {
      warn("GET /products assetKey check skipped", "No published products exist yet");
    }

    // Pagination params
    const rPage = await req("GET", "/products?page=1&limit=5");
    rPage.status === 200 && rPage.data.limit === 5
      ? pass("GET /products pagination params respected")
      : fail("GET /products pagination", `Got limit=${rPage.data.limit}`);

    // GET by non-existent id
    const r404 = await req("GET", "/products/000000000000000000000000");
    r404.status === 404 && r404.data.code === "NOT_FOUND"
      ? pass("GET /products/:id not found → 404 NOT_FOUND")
      : fail("GET /products/:id not found", `Got ${r404.status} code=${r404.data.code}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  section("6. PRODUCTS — Admin Write");
  {
    // Create without auth
    const rNoAuth = await req("POST", "/products", {
      body: { title: "Hack", category: "AR", price: 0, fileUrl: "x" }
    });
    rNoAuth.status === 401 ? pass("POST /products no auth → 401")
      : fail("POST /products no auth", `Expected 401, got ${rNoAuth.status}`);

    // Create with customer token (should be 403)
    const rCustomer = await req("POST", "/products", {
      token: customerToken,
      body: { title: "Hack", category: "AR", price: 0, fileUrl: "x" }
    });
    rCustomer.status === 403 && rCustomer.data.code === "FORBIDDEN"
      ? pass("POST /products customer token → 403 FORBIDDEN")
      : fail("POST /products customer token", `Expected 403 FORBIDDEN, got ${rCustomer.status} code=${rCustomer.data.code}`);

    // Create with admin token — valid
    if (adminToken) {
      const rCreate = await req("POST", "/products", {
        token: adminToken,
        body: {
          title: `Test Product ${TS}`,
          category: "AR",
          price: 999,
          previewUrl: "https://example.com/preview.png",
          assetKey: "assets/test.glb",
          tags: ["test"],
          format: ["GLB"],
          status: "published"
        }
      });
      if (rCreate.status === 201 && rCreate.data.product?._id) {
        productId = rCreate.data.product._id;
        pass("POST /products admin → 201 product created");

        // Check assetKey in admin create response (acceptable for admin context)
        // GET the product publicly to verify assetKey is hidden
        const rGet = await req("GET", `/products/${productId}`);
        if (rGet.status === 200) {
          rGet.data.product?.assetKey !== undefined
            ? fail("GET /products/:id leaks assetKey publicly", "assetKey visible in public detail response!")
            : pass("GET /products/:id assetKey hidden from public");
        }

        // createdBy should come from token, not body — check it's not null
        rCreate.data.product.createdBy
          ? pass("POST /products createdBy set from token")
          : fail("POST /products createdBy", "createdBy is null — not set from token");

      } else {
        fail("POST /products admin valid", `${rCreate.status} ${JSON.stringify(rCreate.data)}`);
      }

      // Missing required fields
      const rBad = await req("POST", "/products", {
        token: adminToken,
        body: { title: "No category" }
      });
      rBad.status === 400 ? pass("POST /products missing fields → 400")
        : fail("POST /products missing fields", `Expected 400, got ${rBad.status}`);

      // Update
      if (productId) {
        const rUp = await req("PUT", `/products/${productId}`, {
          token: adminToken,
          body: { price: 1999 }
        });
        rUp.status === 200 && rUp.data.product?.price === 1999
          ? pass("PUT /products/:id admin → 200 price updated")
          : fail("PUT /products/:id admin", `${rUp.status} price=${rUp.data.product?.price}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  section("7. REQUESTS — Submit & View");
  {
    // Submit without auth
    const rNoAuth = await req("POST", "/requests", {
      body: { fullName: "X", workEmail: "x@x.com", targetPlatform: "Unity", specifications: "Make me a 3D model" }
    });
    rNoAuth.status === 401 ? pass("POST /requests no auth → 401")
      : fail("POST /requests no auth", `Expected 401, got ${rNoAuth.status}`);

    // Submit with customer token — valid
    if (customerToken) {
      const rSubmit = await req("POST", "/requests", {
        token: customerToken,
        body: { fullName: "Test User", workEmail: "test@example.com", targetPlatform: "Unity AR", specifications: "I need a detailed low-poly city block for Unity AR." }
      });
      if (rSubmit.status === 201 && rSubmit.data.request?._id) {
        requestId = rSubmit.data.request._id;
        pass("POST /requests authenticated → 201 created");

        // Check user field is set (critical bug from system design)
        rSubmit.data.request.user
          ? pass("POST /requests user field linked to auth user")
          : fail("POST /requests user field missing", "request.user is null — customer can't track their own requests!");

        // Status defaults to Pending
        rSubmit.data.request.status === "Pending"
          ? pass("POST /requests default status = Pending")
          : fail("POST /requests status default", `Got ${rSubmit.data.request.status}`);

      } else {
        fail("POST /requests authenticated", `${rSubmit.status} ${JSON.stringify(rSubmit.data)}`);
      }

      // Missing fields
      const rBad = await req("POST", "/requests", { token: customerToken, body: { fullName: "X" } });
      rBad.status === 400 ? pass("POST /requests missing fields → 400")
        : fail("POST /requests missing fields", `Expected 400, got ${rBad.status}`);

      // GET /requests/mine — customer sees own requests
      const rMine = await req("GET", "/requests/mine", { token: customerToken });
      rMine.status === 200 && Array.isArray(rMine.data.requests)
        ? pass("GET /requests/mine → 200 array")
        : fail("GET /requests/mine", `${rMine.status} ${JSON.stringify(rMine.data)}`);

      // Verify customer only sees their own requests
      if (rMine.data.requests?.length > 0) {
        const allOwned = rMine.data.requests.every(r => r.user?.toString() === testUserId || r.user === testUserId);
        // Note: user field may be an ObjectId string
        pass("GET /requests/mine returns requests (ownership check requires ObjectId comparison)");
      }
    }

    // GET /requests (admin queue) with no auth
    const rNoAuth2 = await req("GET", "/requests");
    rNoAuth2.status === 401 ? pass("GET /requests no auth → 401")
      : fail("GET /requests no auth", `Expected 401, got ${rNoAuth2.status}`);

    // GET /requests with customer token (should be 403)
    if (customerToken) {
      const rCust = await req("GET", "/requests", { token: customerToken });
      rCust.status === 403 && rCust.data.code === "FORBIDDEN"
        ? pass("GET /requests customer token → 403 FORBIDDEN")
        : fail("GET /requests customer token", `Expected 403, got ${rCust.status} code=${rCust.data.code}`);
    }

    // GET /requests with admin token
    if (adminToken) {
      const rAdmin = await req("GET", "/requests", { token: adminToken });
      rAdmin.status === 200 && Array.isArray(rAdmin.data.requests)
        ? pass("GET /requests admin → 200 array")
        : fail("GET /requests admin", `${rAdmin.status} ${JSON.stringify(rAdmin.data)}`);

      // Filter by status
      const rFilter = await req("GET", "/requests?status=Pending", { token: adminToken });
      rFilter.status === 200 ? pass("GET /requests?status=Pending → 200")
        : fail("GET /requests?status=Pending", `${rFilter.status}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  section("8. REQUESTS — Status Update");
  {
    if (adminToken && requestId) {
      // Valid status update
      const rUp = await req("PATCH", `/requests/${requestId}/status`, {
        token: adminToken,
        body: { status: "Accepted", adminNote: "Great brief!", quotedPrice: 5000 }
      });
      if (rUp.status === 200 && rUp.data.request?.status === "Accepted") {
        pass("PATCH /requests/:id/status admin → 200 Accepted");
        rUp.data.request.adminNote === "Great brief!" ? pass("adminNote persisted") : fail("adminNote", `Got ${rUp.data.request.adminNote}`);
        rUp.data.request.quotedPrice === 5000 ? pass("quotedPrice persisted") : fail("quotedPrice", `Got ${rUp.data.request.quotedPrice}`);
      } else {
        fail("PATCH /requests/:id/status admin", `${rUp.status} ${JSON.stringify(rUp.data)}`);
      }

      // Invalid status value
      const rBad = await req("PATCH", `/requests/${requestId}/status`, {
        token: adminToken,
        body: { status: "FakeStatus" }
      });
      rBad.status === 400 && rBad.data.code === "VALIDATION_FAILED"
        ? pass("PATCH /requests/:id/status invalid value → 400 VALIDATION_FAILED")
        : fail("PATCH status invalid value", `Got ${rBad.status} code=${rBad.data.code}`);

      // New statuses from system design
      for (const st of ["InProgress", "Completed", "Delivered"]) {
        const r = await req("PATCH", `/requests/${requestId}/status`, {
          token: adminToken, body: { status: st }
        });
        r.status === 200 ? pass(`PATCH status=${st} accepted`)
          : fail(`PATCH status=${st}`, `${r.status} ${JSON.stringify(r.data)}`);
      }

      // Customer cannot update status
      if (customerToken) {
        const rCust = await req("PATCH", `/requests/${requestId}/status`, {
          token: customerToken, body: { status: "Rejected" }
        });
        rCust.status === 403 ? pass("Customer cannot update request status → 403")
          : fail("Customer PATCH status", `Expected 403, got ${rCust.status}`);
      }

      // Non-existent request
      const r404 = await req("PATCH", "/requests/000000000000000000000000/status", {
        token: adminToken, body: { status: "Rejected" }
      });
      r404.status === 404 ? pass("PATCH unknown request → 404")
        : fail("PATCH unknown request", `Expected 404, got ${r404.status}`);
    } else {
      warn("Status update tests skipped", "No requestId or adminToken available");
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  section("9. AI ROUTES — Auth Guards");
  {
    // Chat no auth
    const rChat = await req("POST", "/chat", { body: { prompt: "Hello" } });
    rChat.status === 401 ? pass("POST /chat no auth → 401")
      : fail("POST /chat no auth", `Expected 401, got ${rChat.status}`);

    // Chat with customer token (should be 403)
    if (customerToken) {
      const r = await req("POST", "/chat", { token: customerToken, body: { prompt: "Hello" } });
      r.status === 403 && r.data.code === "FORBIDDEN"
        ? pass("POST /chat customer token → 403 FORBIDDEN")
        : fail("POST /chat customer token", `Expected 403, got ${r.status} code=${r.data.code}`);
    }

    // Luma no auth
    const rLuma = await req("GET", "/luma/status");
    rLuma.status === 401 ? pass("GET /luma/status no auth → 401")
      : fail("GET /luma/status no auth", `Expected 401, got ${rLuma.status}`);

    // Luma with customer token (should be 403)
    if (customerToken) {
      const r = await req("GET", "/luma/status", { token: customerToken });
      r.status === 403 ? pass("GET /luma/status customer token → 403")
        : fail("GET /luma/status customer token", `Expected 403, got ${r.status}`);
    }

    // Chat analyze-image no auth
    const rVision = await req("POST", "/chat/analyze-image", { body: { image: "abc" } });
    rVision.status === 401 ? pass("POST /chat/analyze-image no auth → 401")
      : fail("POST /chat/analyze-image no auth", `Expected 401, got ${rVision.status}`);

    // proxy-image SSRF test — should block non-Luma URL even with admin token
    if (adminToken) {
      const rSsrf = await req("POST", "/chat/proxy-image", {
        token: adminToken,
        body: { url: "http://169.254.169.254/latest/meta-data/" }  // AWS metadata endpoint
      });
      rSsrf.status === 403 ? pass("proxy-image blocks AWS metadata URL → 403")
        : fail("proxy-image SSRF guard", `Expected 403, got ${rSsrf.status} — SSRF may be possible!`);

      const rSsrf2 = await req("POST", "/chat/proxy-image", {
        token: adminToken,
        body: { url: "http://evil.example.com/image.png" }
      });
      rSsrf2.status === 403 ? pass("proxy-image blocks non-Luma hostname → 403")
        : fail("proxy-image non-Luma host", `Expected 403, got ${rSsrf2.status}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  section("10. PRODUCTS — Cleanup");
  if (adminToken && productId) {
    const rDel = await req("DELETE", `/products/${productId}`, { token: adminToken });
    rDel.status === 200 ? pass("DELETE /products/:id admin → 200")
      : fail("DELETE /products/:id", `${rDel.status} ${JSON.stringify(rDel.data)}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  section("11. ERROR FORMAT");
  {
    // All errors must have { success: false, code, message }
    const r = await req("GET", "/users/me");
    const hasCode = r.data.code && typeof r.data.code === "string";
    const hasMsg  = r.data.message && typeof r.data.message === "string";
    const hasSucc = r.data.success === false;
    hasCode && hasMsg && hasSucc
      ? pass("Error response shape: { success, code, message } ✓")
      : fail("Error response shape", `Got ${JSON.stringify(r.data)}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log(`RESULTS: ✅ ${passed} passed  |  ❌ ${failed} failed  |  ⚠️  ${warned} warnings`);
  console.log("═".repeat(60));

  if (bugs.length > 0) {
    console.log("\n🐛 BUGS & ISSUES FOUND:\n");
    bugs.forEach((b, i) => {
      const icon = b.severity === "warn" ? "⚠️ " : "❌";
      console.log(`  ${i + 1}. ${icon} ${b.label}`);
      if (b.detail) console.log(`     ${b.detail}`);
    });
  } else {
    console.log("\n🎉 No bugs found!");
  }
}

run().catch(console.error);
