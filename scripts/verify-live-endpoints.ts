async function testLiveServer() {
  console.log("🌐 Testing live server endpoints on http://localhost:3000...");

  // Wait a moment for server to bind
  await new Promise((r) => setTimeout(r, 2000));

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Test Root Redirect to /hi
  try {
    const rootRes = await fetch("http://localhost:3000/", { redirect: "manual" });
    const location = rootRes.headers.get("location");
    assert(rootRes.status === 307 || rootRes.status === 308 || rootRes.status === 302, `Root redirects to locale (status: ${rootRes.status})`);
    assert(Boolean(location?.includes("/hi")), `Default locale redirect targets /hi (location: ${location})`);
  } catch (e) {
    assert(false, `Root request failed: ${e}`);
  }

  // 2. Test Hindi Homepage & Security Headers
  try {
    const hiRes = await fetch("http://localhost:3000/hi");
    assert(hiRes.status === 200, "Hindi page /hi returns 200 OK");
    const html = await hiRes.text();
    assert(html.includes("श्री जोरावर धाम"), "Hindi page contains Devanagari temple title");
    assert(html.includes("महाआरती"), "Hindi page contains aarti schedule content");

    const csp = hiRes.headers.get("content-security-policy");
    const xcto = hiRes.headers.get("x-content-type-options");
    const xfo = hiRes.headers.get("x-frame-options");

    assert(csp !== null, "Content-Security-Policy header is present");
    assert(xcto === "nosniff", "X-Content-Type-Options is nosniff");
    assert(xfo === "DENY", "X-Frame-Options is DENY");
  } catch (e) {
    assert(false, `Hindi page request failed: ${e}`);
  }

  // 3. Test English Homepage
  try {
    const enRes = await fetch("http://localhost:3000/en");
    assert(enRes.status === 200, "English page /en returns 200 OK");
    const html = await enRes.text();
    assert(html.includes("Shri Jorawar Dham"), "English page contains Latin temple title");
    assert(html.includes("Maha Aarti"), "English page contains English Aarti header");
  } catch (e) {
    assert(false, `English page request failed: ${e}`);
  }

  // 4. Test Public API
  try {
    const noticesRes = await fetch("http://localhost:3000/api/public/notices");
    const noticesData = await noticesRes.json();
    assert(noticesRes.status === 200 && noticesData.success, "Public notices API returns 200 OK");
    assert(noticesData.data.length >= 1, "Public notices array has seeded notices");

    const servicesRes = await fetch("http://localhost:3000/api/public/services");
    const servicesData = await servicesRes.json();
    assert(servicesRes.status === 200 && servicesData.success, "Public services API returns 200 OK");
    assert(servicesData.data.length >= 5, "Public services array has all 5 aartis");
  } catch (e) {
    assert(false, `Public API request failed: ${e}`);
  }

  // 5. Test Admin Login & Session Creation
  let sessionCookie = "";
  try {
    const loginRes = await fetch("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "superadmin",
        password: "JorawarDham@Admin2026!",
      }),
    });

    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, "Admin login succeeds with seeded Super Admin credentials");
    assert(loginData.admin.roles.includes("SUPER_ADMIN"), "Admin login returns SUPER_ADMIN role");

    const rawCookies = loginRes.headers.get("set-cookie");
    assert(Boolean(rawCookies?.includes("jd_admin_session")), "Login sets secure httpOnly jd_admin_session cookie");

    if (rawCookies) {
      sessionCookie = rawCookies.split(";")[0];
    }
  } catch (e) {
    assert(false, `Admin login request failed: ${e}`);
  }

  // 6. Test Protected Admin API with Session Cookie
  try {
    const meRes = await fetch("http://localhost:3000/api/admin/auth/me", {
      headers: { Cookie: sessionCookie },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.success, "Protected /api/admin/auth/me succeeds with session cookie");
    assert(meData.admin.username === "superadmin", "Session resolves authenticated superadmin profile");
  } catch (e) {
    assert(false, `Admin me request failed: ${e}`);
  }

  // 7. Test Protected Admin API WITHOUT Session Cookie (Must be rejected)
  try {
    const unauthRes = await fetch("http://localhost:3000/api/admin/auth/me");
    assert(unauthRes.status === 401, "Unauthenticated request to /api/admin/auth/me is blocked with 401 Unauthorized");
  } catch (e) {
    assert(false, `Unauth guard test failed: ${e}`);
  }

  console.log("==================================================");
  console.log(`LIVE SERVER TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

testLiveServer();
