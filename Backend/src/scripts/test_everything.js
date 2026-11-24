/**
 * Ather3D — Master Test Suite (Full End-to-End Test)
 * Run: node Backend/src/scripts/test_everything.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const BASE = "http://localhost:5000";
let passed = 0, failed = 0;
const failures = [];

async function req(method, relPath, { body, token } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let bodyStr;
  if (body) {
    bodyStr = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(`${BASE}${relPath}`, { method, headers, body: bodyStr });
    const ct = res.headers.get("content-type") || "";
    let data = null;
    if (ct.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      data = await res.text().catch(() => "");
    }
    return { status: res.status, headers: res.headers, data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

function pass(name) {
  passed++;
  console.log(`  [PASS] ${name}`);
}

function fail(name, detail) {
  failed++;
  failures.push({ name, detail });
  console.log(`  [FAIL] ${name}`);
  if (detail) console.log(`       -> ${detail}`);
}

function section(title) {
  console.log(`\n----------------------------------------------------------`);
  console.log(`  ${title}`);
  console.log(`----------------------------------------------------------`);
}

async function runTests() {
  console.log("Starting Comprehensive Ather3D System Tests...\n");
  const TS = Date.now();
  let adminToken, customerToken, resetToken, createdRequestId, createdProductId;
  const testCustomerEmail = `test_customer_${TS}@example.com`;
  const initialPassword = "initialPass123";
  const updatedPassword = "updatedPass456";

  // 1. HEALTH & CONNECTIVITY
  section("1. HEALTH CHECK & API BASICS");
  {
    const r = await req("GET", "/api/health");
    if (r.status === 200 && r.data?.success) {
      pass("GET /api/health returns 200 OK with success:true");
    } else {
      fail("GET /api/health failed", `Status: ${r.status}`);
    }
  }

  // 2. STATIC PAGES & SECURITY HEADERS (CSP)
  section("2. FRONTEND PAGES & CSP HEADERS");
  {
    const pages = [
      "/Login/login.html",
      "/Login/sign-up.html",
      "/Login/reset-password.html",
      "/Customer/Customer.html",
      "/Admin/Admin.html",
      "/Admin/Workspace.html",
    ];

    for (const page of pages) {
      const r = await req("GET", page);
      if (r.status === 200 && typeof r.data === "string" && r.data.includes("<!DOCTYPE html>")) {
        pass(`Page ${page} loads (200 OK, HTML)`);
      } else {
        fail(`Page ${page} failed to load`, `Status: ${r.status}`);
      }

      // Check CSP on Admin.html
      if (page === "/Admin/Admin.html" && r.headers) {
        const csp = r.headers.get("content-security-policy") || "";
        if (csp.includes("script-src-attr") && csp.includes("'unsafe-inline'")) {
          pass("Admin.html includes Helmet CSP with script-src-attr 'unsafe-inline' (enables onclick buttons)");
        } else {
          fail("CSP script-src-attr missing or incorrect", csp);
        }
        if (csp.includes("https://cdn.jsdelivr.net")) {
          pass("CSP includes https://cdn.jsdelivr.net for OrbitControls");
        } else {
          fail("CSP missing https://cdn.jsdelivr.net", csp);
        }
        if (csp.includes("https://storage.cdn-luma.com")) {
          pass("CSP media-src includes Luma CDN domains for video streaming");
        } else {
          fail("CSP media-src missing Luma video domains", csp);
        }
      }
    }
  }

  // 3. ADMIN AUTHENTICATION
  section("3. ADMIN AUTHENTICATION");
  {
    const adminEmail = process.env.ADMIN_EMAIL || "ather3dadmin@gmail.com";
    const adminPass = process.env.ADMIN_PASSWORD || "Ather3D@Admin2026";
    const r = await req("POST", "/api/users/login", { body: { email: adminEmail, password: adminPass } });

    if (r.status === 200 && r.data?.token && r.data?.user?.role === "admin") {
      adminToken = r.data.token;
      pass(`Admin login success (role=admin, token issued for ${adminEmail})`);
    } else {
      fail("Admin login failed", `Status: ${r.status}, response: ${JSON.stringify(r.data)}`);
    }

    // Verify /api/users/me with Admin token
    if (adminToken) {
      const me = await req("GET", "/api/users/me", { token: adminToken });
      if (me.status === 200 && me.data?.user?.role === "admin") {
        pass("GET /api/users/me returns admin profile");
      } else {
        fail("GET /api/users/me with admin token failed", `Status: ${me.status}`);
      }
    }
  }

  // 4. CUSTOMER SIGNUP & LOGIN
  section("4. CUSTOMER SIGNUP & SESSION");
  {
    const rSignup = await req("POST", "/api/users/signup", {
      body: { name: "Test User", email: testCustomerEmail, password: initialPassword },
    });

    if (rSignup.status === 201 && rSignup.data?.token && rSignup.data?.user?.role === "customer") {
      customerToken = rSignup.data.token;
      pass("Customer signup creates account with role=customer and returns JWT");
    } else {
      fail("Customer signup failed", `Status: ${rSignup.status}, response: ${JSON.stringify(rSignup.data)}`);
    }

    // Attempt duplicate signup
    const rDup = await req("POST", "/api/users/signup", {
      body: { name: "Test User", email: testCustomerEmail, password: initialPassword },
    });
    if (rDup.status === 409 && rDup.data?.code === "DUPLICATE_KEY") {
      pass("Duplicate signup rejected with 409 DUPLICATE_KEY");
    } else {
      fail("Duplicate signup check failed", `Status: ${rDup.status}`);
    }

    // Test customer login
    const rLogin = await req("POST", "/api/users/login", {
      body: { email: testCustomerEmail, password: initialPassword },
    });
    if (rLogin.status === 200 && rLogin.data?.token) {
      pass("Customer login success with valid credentials");
    } else {
      fail("Customer login failed", `Status: ${rLogin.status}`);
    }
  }

  // 5. FORGOT PASSWORD & RESET FLOW (ACCOUNT TAKEOVER PROTECTION)
  section("5. FORGOT PASSWORD & RESET PASSWORD FLOW");
  {
    const rForgot = await req("POST", "/api/users/forgot-password", {
      body: { email: testCustomerEmail },
    });

    if (rForgot.status === 200 && rForgot.data?.success) {
      pass("POST /api/users/forgot-password returns success");
      
      // CRITICAL SECURITY CHECK: devResetUrl must NOT be leaked when NODE_ENV is production
      if (process.env.NODE_ENV === "production") {
        if (!rForgot.data?.devResetUrl) {
          pass("SECURITY: devResetUrl is NOT leaked in production (Account takeover prevented)");
        } else {
          fail("CRITICAL: devResetUrl leaked in production response!", rForgot.data.devResetUrl);
        }
      }
    } else {
      fail("Forgot password request failed", `Status: ${rForgot.status}, data: ${JSON.stringify(rForgot.data)}`);
    }

    // Direct token generation test to verify resetPassword handler
    const crypto = require("crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    // Set token directly in DB to test the reset endpoint
    const mongoose = require("mongoose");
    const User = require("../Modules/User/user.model");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    await User.updateOne(
      { email: testCustomerEmail },
      { passwordResetToken: hashedToken, passwordResetExpires: Date.now() + 3600000 }
    );

    // Test password reset endpoint
    const rReset = await req("POST", `/api/users/reset-password/${encodeURIComponent(rawToken)}`, {
      body: { password: updatedPassword },
    });

    if (rReset.status === 200 && rReset.data?.success) {
      pass("POST /api/users/reset-password/:token successfully updated password");

      // Verify old password now fails
      const rOldLogin = await req("POST", "/api/users/login", {
        body: { email: testCustomerEmail, password: initialPassword },
      });
      if (rOldLogin.status === 401) {
        pass("Login with old password now correctly fails (401)");
      } else {
        fail("Old password still allowed after reset!", `Status: ${rOldLogin.status}`);
      }

      // Verify new password succeeds
      const rNewLogin = await req("POST", "/api/users/login", {
        body: { email: testCustomerEmail, password: updatedPassword },
      });
      if (rNewLogin.status === 200 && rNewLogin.data?.token) {
        customerToken = rNewLogin.data.token;
        pass("Login with newly reset password succeeds (200 OK)");
      } else {
        fail("Login with new password failed", `Status: ${rNewLogin.status}`);
      }
    } else {
      fail("POST /api/users/reset-password/:token failed", `Status: ${rReset.status}, data: ${JSON.stringify(rReset.data)}`);
    }
  }

  // 6. CUSTOMER REQUEST SUBMISSION & TRACKING
  section("6. CUSTOMER REQUESTS & ADMIN QUEUE");
  {
    // Submit request as Customer
    const rReq = await req("POST", "/api/requests", {
      token: customerToken,
      body: {
        fullName: "Testing Client",
        workEmail: testCustomerEmail,
        targetPlatform: "Meta Quest / PC VR",
        specifications: "Automated test request for VR environment",
      },
    });

    if (rReq.status === 201 && rReq.data?.request?._id) {
      createdRequestId = rReq.data.request._id;
      pass(`Customer submitted custom request: ID=${createdRequestId}, status=${rReq.data.request.status}`);
    } else {
      fail("Customer submit request failed", `Status: ${rReq.status}, data: ${JSON.stringify(rReq.data)}`);
    }

    // Customer views their own requests (/mine)
    const rMine = await req("GET", "/api/requests/mine", { token: customerToken });
    if (rMine.status === 200 && Array.isArray(rMine.data?.requests)) {
      const found = rMine.data.requests.find((r) => r._id === createdRequestId);
      if (found) {
        pass("GET /api/requests/mine returns newly created request in customer list");
      } else {
        fail("GET /api/requests/mine did not include created request");
      }
    } else {
      fail("GET /api/requests/mine failed", `Status: ${rMine.status}`);
    }

    // Admin views queue (/api/requests)
    const rAdminQueue = await req("GET", "/api/requests", { token: adminToken });
    if (rAdminQueue.status === 200 && Array.isArray(rAdminQueue.data?.requests)) {
      const foundInQueue = rAdminQueue.data.requests.find((r) => r._id === createdRequestId);
      if (foundInQueue) {
        pass("GET /api/requests (Admin queue) successfully includes the new customer request");
      } else {
        fail("Request missing from admin queue", `Total in queue: ${rAdminQueue.data.requests.length}`);
      }
    } else {
      fail("GET /api/requests failed for admin", `Status: ${rAdminQueue.status}`);
    }

    // Admin accepts request (PATCH /api/requests/:id/status)
    if (createdRequestId && adminToken) {
      const rAccept = await req("PATCH", `/api/requests/${createdRequestId}/status`, {
        token: adminToken,
        body: { status: "Accepted", adminNote: "Accepted by test suite", quotedPrice: 3500 },
      });

      if (rAccept.status === 200 && rAccept.data?.request?.status === "Accepted") {
        pass("PATCH /api/requests/:id/status sets status='Accepted' with note & quoted price");
      } else {
        fail("Admin PATCH request status failed", `Status: ${rAccept.status}, data: ${JSON.stringify(rAccept.data)}`);
      }
    }
  }

  // 7. PRODUCT CATALOG & ASSET SECURITY
  section("7. PRODUCT CATALOG & ASSET PROTECTION");
  {
    // Public catalog check
    const rProd = await req("GET", "/api/products");
    if (rProd.status === 200 && Array.isArray(rProd.data?.products)) {
      pass(`GET /api/products returns public catalog (${rProd.data.products.length} products listed)`);
      // Verify assetKey is not exposed publicly
      const leaked = rProd.data.products.some((p) => p.assetKey !== undefined);
      if (!leaked) {
        pass("AssetKey protection verified: No assetKey in public catalog responses");
      } else {
        fail("SECURITY RISK: assetKey leaked in public catalog!");
      }
    } else {
      fail("GET /api/products failed", `Status: ${rProd.status}`);
    }

    // Admin creates product
    if (adminToken) {
      const rCreate = await req("POST", "/api/products", {
        token: adminToken,
        body: {
          title: `Test 3D Asset ${TS}`,
          category: "AR",
          price: 1500,
          previewUrl: "https://example.com/thumb.jpg",
          assetKey: "models/test.glb",
          format: ["GLB"],
          status: "published",
        },
      });

      if (rCreate.status === 201 && rCreate.data?.product?._id) {
        createdProductId = rCreate.data.product._id;
        pass(`Admin creates product (ID=${createdProductId})`);

        // Clean up created product
        const rDel = await req("DELETE", `/api/products/${createdProductId}`, { token: adminToken });
        if (rDel.status === 200) {
          pass("Admin successfully deleted temporary test product");
        } else {
          fail("Admin failed to delete test product", `Status: ${rDel.status}`);
        }
      } else {
        fail("Admin product creation failed", `Status: ${rCreate.status}, data: ${JSON.stringify(rCreate.data)}`);
      }
    }
  }

  // 8. SECURITY & ROLE GUARDS
  section("8. SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)");
  {
    // Customer cannot access admin requests queue
    const rCustQueue = await req("GET", "/api/requests", { token: customerToken });
    if (rCustQueue.status === 403) {
      pass("RBAC: Customer blocked from Admin requests queue (403 Forbidden)");
    } else {
      fail("RBAC: Customer was not blocked from Admin queue!", `Status: ${rCustQueue.status}`);
    }

    // Customer cannot create product
    const rCustProd = await req("POST", "/api/products", {
      token: customerToken,
      body: { title: "Hacked", category: "AR", price: 0 },
    });
    if (rCustProd.status === 403) {
      pass("RBAC: Customer blocked from POST /api/products (403 Forbidden)");
    } else {
      fail("RBAC: Customer was not blocked from POST /api/products!", `Status: ${rCustProd.status}`);
    }

    // Unauthenticated user cannot access AI chat
    const rNoAuthChat = await req("POST", "/api/chat", { body: { prompt: "Hi" } });
    if (rNoAuthChat.status === 401) {
      pass("RBAC: Unauthenticated user blocked from POST /api/chat (401 Unauthorized)");
    } else {
      fail("RBAC: Unauthenticated user was not blocked from /api/chat!", `Status: ${rNoAuthChat.status}`);
    }

    // Customer cannot access AI chat
    const rCustChat = await req("POST", "/api/chat", { token: customerToken, body: { prompt: "Hi" } });
    if (rCustChat.status === 403) {
      pass("RBAC: Customer blocked from POST /api/chat (403 Forbidden - Admin only)");
    } else {
      fail("RBAC: Customer was not blocked from /api/chat!", `Status: ${rCustChat.status}`);
    }

    // Unauthenticated user cannot access Luma
    const rNoAuthLuma = await req("GET", "/api/luma/status");
    if (rNoAuthLuma.status === 401) {
      pass("RBAC: Unauthenticated user blocked from Luma routes (401 Unauthorized)");
    } else {
      fail("RBAC: Unauthenticated user was not blocked from Luma!", `Status: ${rNoAuthLuma.status}`);
    }
  }

  // FINAL SUMMARY
  console.log(`\n==========================================================`);
  console.log(`FINAL TEST REPORT`);
  console.log(`==========================================================`);
  console.log(`  Total Passed:  ${passed}`);
  console.log(`  Total Failed:  ${failed}`);
  console.log(`==========================================================`);

  const mongoose = require("mongoose");
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (failed > 0) {
    console.log("\nFailed Tests:");
    failures.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.name} -> ${f.detail}`);
    });
    process.exit(1);
  } else {
    console.log("\nALL TESTS PASSED: System verification successful.\n");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
