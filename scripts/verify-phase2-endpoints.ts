async function verifyPhase2() {
  console.log("🕉️ Starting Phase 2 Live Endpoints Verification on http://localhost:3000...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  const pages = [
    { name: "Home", hiPath: "/hi", enPath: "/en", hiExpected: "श्री जोरावर धाम", enExpected: "Shri Jorawar Dham" },
    { name: "About", hiPath: "/hi/about", enPath: "/en/about", hiExpected: "धाम परिचय", enExpected: "About Jorawar Dham" },
    { name: "History", hiPath: "/hi/history", enPath: "/en/history", hiExpected: "पावन इतिहास", enExpected: "Sacred History" },
    { name: "Bhagwan Jorawar", hiPath: "/hi/bhagwan-jorawar", enPath: "/en/bhagwan-jorawar", hiExpected: "भगवान जोरावर", enExpected: "Bhagwan Jorawar" },
    { name: "Dham", hiPath: "/hi/dham", enPath: "/en/dham", hiExpected: "तीर्थ विवरण", enExpected: "Dham Facilities" },
    { name: "Darshan", hiPath: "/hi/darshan", enPath: "/en/darshan", hiExpected: "दर्शन समय सारिणी", enExpected: "Sacred Darshan" },
    { name: "Aarti", hiPath: "/hi/aarti", enPath: "/en/aarti", hiExpected: "पंच-आरती सारिणी", enExpected: "Pancha-Aarti Schedule" },
    { name: "Seva", hiPath: "/hi/seva", enPath: "/en/seva", hiExpected: "सेवा परंपरा", enExpected: "Seva Offerings" },
    { name: "Events", hiPath: "/hi/events", enPath: "/en/events", hiExpected: "उत्सव एवं महापर्व", enExpected: "Sacred Events" },
    { name: "Gallery", hiPath: "/hi/gallery", enPath: "/en/gallery", hiExpected: "दिव्य चित्र दीर्घा", enExpected: "Sacred Gallery" },
    { name: "Donation", hiPath: "/hi/donation", enPath: "/en/donation", hiExpected: "दान व सहयोग", enExpected: "Support Shri Jorawar Dham" },
    { name: "Visitor Info", hiPath: "/hi/visitor-info", enPath: "/en/visitor-info", hiExpected: "यात्री सूचना", enExpected: "Visitor Information" },
    { name: "Contact", hiPath: "/hi/contact", enPath: "/en/contact", hiExpected: "संपर्क एवं सहायता", enExpected: "Official Contact Channels" },
    { name: "FAQ", hiPath: "/hi/faq", enPath: "/en/faq", hiExpected: "अक्सर पूछे जाने वाले प्रश्न", enExpected: "Frequently Asked Questions" },
  ];

  // 1. Verify All 14 Bilingual Pages
  for (const p of pages) {
    console.log(`\n--- Testing ${p.name} Page ---`);

    // Test Hindi Route
    try {
      const resHi = await fetch(`http://localhost:3000${p.hiPath}`);
      assert(resHi.status === 200, `${p.name} Hindi (${p.hiPath}) returns 200 OK`);
      const htmlHi = await resHi.text();
      assert(htmlHi.includes(p.hiExpected), `${p.name} Hindi page contains expected text: "${p.hiExpected}"`);
    } catch (e) {
      assert(false, `${p.name} Hindi request error: ${e}`);
    }

    // Test English Route
    try {
      const resEn = await fetch(`http://localhost:3000${p.enPath}`);
      assert(resEn.status === 200, `${p.name} English (${p.enPath}) returns 200 OK`);
      const htmlEn = await resEn.text();
      assert(htmlEn.includes(p.enExpected), `${p.name} English page contains expected text: "${p.enExpected}"`);
    } catch (e) {
      assert(false, `${p.name} English request error: ${e}`);
    }
  }

  // 2. Test SEO Sitemap & Robots.txt
  console.log("\n--- Testing SEO Feeds ---");
  try {
    const sitemapRes = await fetch("http://localhost:3000/sitemap.xml");
    assert(sitemapRes.status === 200, "sitemap.xml returns 200 OK");
    const sitemapText = await sitemapRes.text();
    assert(sitemapText.includes("<urlset") || sitemapText.includes("xmlns"), "sitemap.xml is valid XML urlset");
    assert(sitemapText.includes("/hi/bhagwan-jorawar"), "sitemap.xml contains /hi/bhagwan-jorawar");
    assert(sitemapText.includes("/en/donation"), "sitemap.xml contains /en/donation");
  } catch (e) {
    assert(false, `Sitemap request error: ${e}`);
  }

  try {
    const robotsRes = await fetch("http://localhost:3000/robots.txt");
    assert(robotsRes.status === 200, "robots.txt returns 200 OK");
    const robotsText = await robotsRes.text();
    assert(robotsText.includes("Disallow: /admin/"), "robots.txt disallows /admin/");
    assert(robotsText.includes("sitemap.xml"), "robots.txt links to sitemap.xml");
  } catch (e) {
    assert(false, `Robots request error: ${e}`);
  }

  // 3. Test JSON-LD Structured Data
  console.log("\n--- Testing Structured Data & Mobile UX ---");
  try {
    const homeRes = await fetch("http://localhost:3000/hi");
    const homeHtml = await homeRes.text();
    assert(homeHtml.includes("application/ld+json"), "Homepage renders Schema.org JSON-LD tag");
    assert(homeHtml.includes("HinduTemple"), "JSON-LD includes HinduTemple / PlaceOfWorship type");
    assert(homeHtml.includes("Mobile devotee quick actions") || homeHtml.includes("MobileQuickBar"), "Mobile quick actions bar is rendered");
  } catch (e) {
    assert(false, `Structured data request error: ${e}`);
  }

  console.log("\n==================================================");
  console.log(`PHASE 2 ACCEPTANCE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

verifyPhase2();
