import { PrismaClient, AdminRoleType, NoticePriority, EventStatus, AuditAction, ActorType } from "@prisma/client";
import { hashPassword } from "../lib/auth/argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Jorawar Dham database seeding...");

  // 1. Seed Roles
  const roleData: { name: AdminRoleType; description: string }[] = [
    { name: AdminRoleType.SUPER_ADMIN, description: "Full root administrative control over all modules and settings" },
    { name: AdminRoleType.CONTENT_ADMIN, description: "Manage dynamic pages, notices, history, and FAQs" },
    { name: AdminRoleType.BOOKING_ADMIN, description: "Manage darshan schedules, aarti timings, pooja guidelines" },
    { name: AdminRoleType.FINANCE_ADMIN, description: "Inspect donation records, financial audits, and summaries" },
    { name: AdminRoleType.EVENT_ADMIN, description: "Manage upcoming festivals, events, and announcements" },
    { name: AdminRoleType.STAFF, description: "Read-only access to temple schedules and notices" },
  ];

  const roleMap = new Map<string, string>();
  for (const r of roleData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roleMap.set(r.name, role.id);
  }

  // 2. Seed Permissions
  const permissions = [
    { code: "content:read", module: "content", description: "View pages and sections" },
    { code: "content:write", module: "content", description: "Create and modify page sections" },
    { code: "notices:read", module: "notices", description: "View notices" },
    { code: "notices:write", module: "notices", description: "Create, edit, and publish notices" },
    { code: "events:read", module: "events", description: "View events" },
    { code: "events:write", module: "events", description: "Create and edit events" },
    { code: "services:read", module: "services", description: "View darshan services and timings" },
    { code: "services:write", module: "services", description: "Modify darshan services and guidelines" },
    { code: "gallery:read", module: "gallery", description: "View gallery items" },
    { code: "gallery:write", module: "gallery", description: "Upload and organize gallery media" },
    { code: "settings:read", module: "settings", description: "View site settings" },
    { code: "settings:write", module: "settings", description: "Modify site settings" },
    { code: "audit:read", module: "audit", description: "Inspect system audit logs" },
    { code: "users:manage", module: "users", description: "Manage admin accounts and roles" },
    { code: "bookings:read", module: "bookings", description: "View darshan & pooja bookings" },
    { code: "bookings:manage", module: "bookings", description: "Create, cancel, and reschedule bookings" },
    { code: "payments:read", module: "payments", description: "View financial payment transactions" },
    { code: "payments:manage", module: "payments", description: "Process refunds and reconcile payments" },
    { code: "donations:read", module: "donations", description: "View devotee charitable donations" },
    { code: "donations:manage", module: "donations", description: "Manage causes and receipts" },
    { code: "reports:read", module: "reports", description: "View analytics and operational reports" },
    { code: "reports:export", module: "reports", description: "Export CSV datasets" },
  ];

  const permMap = new Map<string, string>();
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description, module: p.module },
      create: p,
    });
    permMap.set(p.code, perm.id);
  }

  // Map permissions to Super Admin role (Full access)
  const superAdminRoleId = roleMap.get(AdminRoleType.SUPER_ADMIN);
  if (superAdminRoleId) {
    const allPerms = await prisma.permission.findMany();
    for (const p of allPerms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRoleId,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRoleId,
          permissionId: p.id,
        },
      });
    }
  }

  // Map specific least-privilege permissions to roles
  const rolePermissionsConfig: Record<string, string[]> = {
    [AdminRoleType.FINANCE_ADMIN]: [
      "payments:read",
      "payments:manage",
      "donations:read",
      "donations:manage",
      "reports:read",
      "reports:export",
      "audit:read",
      "settings:read",
    ],
    [AdminRoleType.BOOKING_ADMIN]: [
      "bookings:read",
      "bookings:manage",
      "services:read",
      "services:write",
      "reports:read",
      "settings:read",
    ],
    [AdminRoleType.CONTENT_ADMIN]: [
      "content:read",
      "content:write",
      "notices:read",
      "notices:write",
      "events:read",
      "events:write",
      "gallery:read",
      "gallery:write",
      "settings:read",
    ],
    [AdminRoleType.EVENT_ADMIN]: [
      "events:read",
      "events:write",
      "gallery:read",
      "gallery:write",
    ],
    [AdminRoleType.STAFF]: [
      "bookings:read",
      "services:read",
      "notices:read",
      "events:read",
    ],
  };

  for (const [roleType, permCodes] of Object.entries(rolePermissionsConfig)) {
    const rId = roleMap.get(roleType);
    if (!rId) continue;
    for (const code of permCodes) {
      const pId = permMap.get(code);
      if (!pId) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: rId,
            permissionId: pId,
          },
        },
        update: {},
        create: {
          roleId: rId,
          permissionId: pId,
        },
      });
    }
  }

  // 3. Seed Initial Super Admin
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@jorawardham.org";
  const adminUsername = process.env.SUPER_ADMIN_USERNAME || "superadmin";
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD || "JorawarDham@Admin2026!";

  const passwordHash = await hashPassword(rawPassword);

  const superAdmin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      passwordHash,
      status: "ACTIVE",
    },
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      firstName: "Dham",
      lastName: "Administrator",
      status: "ACTIVE",
    },
  });

  if (superAdminRoleId) {
    await prisma.adminRole.upsert({
      where: {
        adminId_roleId: {
          adminId: superAdmin.id,
          roleId: superAdminRoleId,
        },
      },
      update: {},
      create: {
        adminId: superAdmin.id,
        roleId: superAdminRoleId,
      },
    });
  }

  // 4. Seed Dynamic Pages & Sections
  const pages = [
    { slug: "home", isSystem: true },
    { slug: "about", isSystem: true },
    { slug: "history", isSystem: true },
    { slug: "dham", isSystem: true },
    { slug: "darshan", isSystem: true },
    { slug: "seva", isSystem: true },
    { slug: "events", isSystem: true },
    { slug: "gallery", isSystem: true },
    { slug: "contact", isSystem: true },
  ];

  for (const pg of pages) {
    const page = await prisma.page.upsert({
      where: { slug: pg.slug },
      update: {},
      create: pg,
    });

    if (pg.slug === "home") {
      await prisma.pageSection.upsert({
        where: {
          pageId_sectionKey: {
            pageId: page.id,
            sectionKey: "hero",
          },
        },
        update: {},
        create: {
          pageId: page.id,
          sectionKey: "hero",
          titleHi: "श्री जोरावर धाम के दिव्य दर्शन",
          titleEn: "Divine Darshan of Shri Jorawar Dham",
          subtitleHi: "परम पूज्य जोरावर जी महाराज की तपोभूमि, राजस्थान",
          subtitleEn: "Sacred Tapobhoomi of Param Pujya Jorawar Ji Maharaj, Rajasthan",
          contentHi: "राजस्थान की पावन धरा पर स्थित श्री जोरावर धाम एक अलौकिक आध्यात्मिक केंद्र है जहाँ प्रतिदिन हजारों श्रद्धालु प्रभु चरणों में नतमस्तक होकर शांति और आध्यात्मिक ऊर्जा प्राप्त करते हैं।",
          contentEn: "Situated in the revered state of Rajasthan, Shri Jorawar Dham is a sacred pilgrimage center welcoming thousands of devotees daily for peace, spiritual awakening, and divine blessings.",
          sortOrder: 1,
        },
      });

      await prisma.pageSection.upsert({
        where: {
          pageId_sectionKey: {
            pageId: page.id,
            sectionKey: "history_intro",
          },
        },
        update: {},
        create: {
          pageId: page.id,
          sectionKey: "history_intro",
          titleHi: "धाम की पावन स्थापना एवं आध्यात्मिक महत्व",
          titleEn: "Holy Inception & Spiritual Significance",
          subtitleHi: "शताब्दियों पुरानी साधना व तपस्या की परंपरा",
          subtitleEn: "Centuries of Sacred Penance and Tradition",
          contentHi: "श्री जोरावर धाम की स्थापना पूज्य संतों की अखंड तपस्या और जन-कल्याण के संकल्प से हुई थी। यहाँ स्थापित अखंड धूणा और दिव्य विग्रह भक्तों की मनोकामनाएं पूर्ण करने वाले माने जाते हैं।",
          contentEn: "The establishment of Shri Jorawar Dham is rooted in the relentless penance of revered sages dedicated to social welfare. The eternal flame (Akhand Dhoona) and consecrated deities are known to bestow divine grace on all pilgrims.",
          sortOrder: 2,
        },
      });
    }
  }

  // 5. Seed Services & Darshan Timings
  const services = [
    {
      slug: "mangala-aarti",
      titleHi: "मंगला आरती",
      titleEn: "Mangala Aarti",
      descriptionHi: "प्रातःकाल भगवान का प्रथम दर्शन एवं जागरण आरती। वातावरण में दिव्य शांति और मंत्रोच्चार का अनुभव।",
      descriptionEn: "The first morning darshan and awakening ritual. Experience profound spiritual serenity and sacred chanting.",
      timingHi: "प्रातः 05:00 - 05:45",
      timingEn: "05:00 AM - 05:45 AM",
      guidelinesHi: "कृपया आरती प्रारंभ होने से 15 मिनट पूर्व प्रांगण में उपस्थित हों।",
      guidelinesEn: "Please be present in the temple sanctum 15 minutes prior to commencement.",
      imageUrl: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=800&auto=format&fit=crop",
      price: 0,
      bookingStatus: "OPEN",
      availabilityHi: "प्रतिदिन प्रातः 05:00",
      availabilityEn: "Daily at 05:00 AM",
      sortOrder: 1,
    },
    {
      slug: "shringar-aarti",
      titleHi: "श्रृंगार आरती",
      titleEn: "Shringar Aarti",
      descriptionHi: "प्रभु का दिव्य पुष्पों और आभूषणों से मनोहारी श्रृंगार दर्शन।",
      descriptionEn: "Adornment ritual featuring sacred flowers, sandalwood, and ornate vestments.",
      timingHi: "प्रातः 07:30 - 08:15",
      timingEn: "07:30 AM - 08:15 AM",
      guidelinesHi: "श्रद्धालु शांतिपूर्वक कतारबद्ध होकर दर्शन करें।",
      guidelinesEn: "Devotees are requested to maintain queue discipline.",
      imageUrl: "https://images.unsplash.com/photo-1620619767323-b95a89183081?q=80&w=800&auto=format&fit=crop",
      price: 0,
      bookingStatus: "OPEN",
      availabilityHi: "प्रतिदिन प्रातः 07:30",
      availabilityEn: "Daily at 07:30 AM",
      sortOrder: 2,
    },
    {
      slug: "rajbhog-aarti",
      titleHi: "राजभोग आरती एवं दोपहर दर्शन",
      titleEn: "Rajbhog Aarti & Afternoon Darshan",
      descriptionHi: "भगवान को दिव्य नैवेद्य एवं छप्पन भोग समर्पण। इसके पश्चात दोपहर में कपाट विश्राम हेतु बंद होते हैं।",
      descriptionEn: "Grand food offering (Naivedya) followed by afternoon resting period.",
      timingHi: "दोपहर 12:00 - 12:30",
      timingEn: "12:00 PM - 12:30 PM",
      guidelinesHi: "दोपहर 12:30 से 04:00 बजे तक मंदिर कपाट विश्राम हेतु बंद रहते हैं।",
      guidelinesEn: "Temple remains closed for holy rest between 12:30 PM and 04:00 PM.",
      imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
      price: 0,
      bookingStatus: "OPEN",
      availabilityHi: "प्रतिदिन दोपहर 12:00",
      availabilityEn: "Daily at 12:00 PM",
      sortOrder: 3,
    },
    {
      slug: "sandhya-aarti",
      titleHi: "संध्या महाआरती",
      titleEn: "Sandhya Maha Aarti",
      descriptionHi: "सायंकालीन महाआरती, शंखध्वनि, ढोल-नगाड़ों और दीपों की जगमगाहट के साथ भव्य वातावरण।",
      descriptionEn: "Grand evening aarti accompanied by temple bells, conch shells, and traditional brass lamps.",
      timingHi: "सायं 07:00 - 07:45",
      timingEn: "07:00 PM - 07:45 PM",
      guidelinesHi: "संध्या आरती में विशेष भीड़ होती है; वरिष्ठ नागरिकों के लिए पृथक व्यवस्था उपलब्ध है।",
      guidelinesEn: "High visitor volume expected; designated seating is available for senior devotees.",
      imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=800&auto=format&fit=crop",
      price: 0,
      bookingStatus: "OPEN",
      availabilityHi: "प्रतिदिन सायं 07:00",
      availabilityEn: "Daily at 07:00 PM",
      sortOrder: 4,
    },
    {
      slug: "shayan-aarti",
      titleHi: "शयन आरती",
      titleEn: "Shayan Aarti",
      descriptionHi: "दिन का अंतिम दर्शन एवं भगवान के शयन का समय।",
      descriptionEn: "Nightfall closing ritual concluding the daily pilgrimage schedule.",
      timingHi: "रात्रि 09:30 - 10:00",
      timingEn: "09:30 PM - 10:00 PM",
      guidelinesHi: "रात्रि 10:00 बजे मंदिर के मुख्य द्वार बंद कर दिए जाते हैं।",
      guidelinesEn: "Main gates close promptly at 10:00 PM.",
      imageUrl: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=800&auto=format&fit=crop",
      price: 0,
      bookingStatus: "OPEN",
      availabilityHi: "प्रतिदिन रात्रि 09:30",
      availabilityEn: "Daily at 09:30 PM",
      sortOrder: 5,
    },
    {
      slug: "akhand-dhoona-seva",
      titleHi: "अखंड धूणा आहुति एवं विशेष पूजा",
      titleEn: "Akhand Dhoona Hawan & Special Pooja",
      descriptionHi: "परम पूज्य जोरावर जी महाराज के अखंड धूणे में पवित्र हवन सामग्री, कपूर, गूगल एवं देसी घी द्वारा आहुति सेवा।",
      descriptionEn: "Sacred hawan offering at the eternal flame with pure desi ghee, guggul, and Vedic herbs for spiritual peace.",
      timingHi: "प्रातः 09:00 - 11:00",
      timingEn: "09:00 AM - 11:00 AM",
      guidelinesHi: "हवन में भाग लेने हेतु पूर्व सूचना दें अथवा काउंटर पर पंजीकरण करवाएं।",
      guidelinesEn: "Please notify the trust office counter for registration.",
      imageUrl: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=800&auto=format&fit=crop",
      price: 251,
      bookingStatus: "AVAILABLE",
      availabilityHi: "सोमवार, गुरुवार व पूर्णिमा",
      availabilityEn: "Mon, Thu & Purnima",
      sortOrder: 6,
    },
    {
      slug: "annakshetra-maha-bhandara",
      titleHi: "नित्य अन्नक्षेत्र महाप्रसाद सेवा",
      titleEn: "Daily Annakshetra Maha Bhandara",
      descriptionHi: "धाम आने वाले सैकड़ों श्रद्धालुओं एवं साधु-संतों हेतु शुद्ध सात्विक भोजन भंडारा सेवा में सहयोग।",
      descriptionEn: "Support the continuous free community kitchen serving pure vegetarian prasadam to visiting pilgrims.",
      timingHi: "दोपहर 11:30 - 02:30",
      timingEn: "11:30 AM - 02:30 PM",
      guidelinesHi: "अन्नदान महादान है; श्रद्धालु अपनी स्वेच्छा से सहयोग कर सकते हैं।",
      guidelinesEn: "Food donation is considered the supreme virtue; devotees may contribute voluntarily.",
      imageUrl: "https://images.unsplash.com/photo-1620619767323-b95a89183081?q=80&w=800&auto=format&fit=crop",
      price: 1100,
      bookingStatus: "AVAILABLE",
      availabilityHi: "प्रतिदिन उपलब्ध",
      availabilityEn: "Available Daily",
      sortOrder: 7,
    },
    {
      slug: "kamadhenu-gau-seva",
      titleHi: "श्री कामधेनु गौ सेवा एवं चारा अर्पण",
      titleEn: "Kamadhenu Cow Protection & Fodder Seva",
      descriptionHi: "धाम की गौशाला में निराश्रित व देसी नस्ल की गौ माताओं के लिए हरा चारा, गुड़ व चिकित्सा सहयोग।",
      descriptionEn: "Fodder, nutrition, and medical care for protected indigenous cows at the temple sanctuary.",
      timingHi: "दिनभर उपलब्ध",
      timingEn: "All Day Available",
      guidelinesHi: "गौशाला प्रांगण में स्वयं जाकर गायों को गुड़ एवं चारा खिलाने की सुविधा।",
      guidelinesEn: "Devotees may personally visit the cow sanctuary to feed sacred cows.",
      imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
      price: 501,
      bookingStatus: "AVAILABLE",
      availabilityHi: "नित्य सेवा",
      availabilityEn: "Daily Seva",
      sortOrder: 8,
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  // 5b. Seed Service Slots for Booking
  console.log("Seeding slots for services...");
  const dbServices = await prisma.service.findMany();
  for (const s of dbServices) {
    const existingSlots = await prisma.serviceSlot.count({ where: { serviceId: s.id } });
    if (existingSlots === 0) {
      if (s.slug === "mangala-aarti") {
        await prisma.serviceSlot.create({
          data: {
            serviceId: s.id,
            startTime: "05:15 AM",
            endTime: "06:00 AM",
            capacity: 100,
            priceInPaise: 0,
            sortOrder: 1,
          },
        });
      } else if (s.slug === "shringar-aarti") {
        await prisma.serviceSlot.create({
          data: {
            serviceId: s.id,
            startTime: "07:30 AM",
            endTime: "08:15 AM",
            capacity: 150,
            priceInPaise: 0,
            sortOrder: 1,
          },
        });
      } else if (s.slug === "rajbhog-aarti") {
        await prisma.serviceSlot.create({
          data: {
            serviceId: s.id,
            startTime: "12:00 PM",
            endTime: "12:30 PM",
            capacity: 100,
            priceInPaise: 0,
            sortOrder: 1,
          },
        });
      } else if (s.slug === "sandhya-aarti") {
        await prisma.serviceSlot.create({
          data: {
            serviceId: s.id,
            startTime: "07:00 PM",
            endTime: "07:45 PM",
            capacity: 200,
            priceInPaise: 0,
            sortOrder: 1,
          },
        });
      } else if (s.slug === "shayan-aarti") {
        await prisma.serviceSlot.create({
          data: {
            serviceId: s.id,
            startTime: "09:30 PM",
            endTime: "10:00 PM",
            capacity: 80,
            priceInPaise: 0,
            sortOrder: 1,
          },
        });
      } else if (s.slug === "akhand-dhoona-seva") {
        await prisma.serviceSlot.createMany({
          data: [
            {
              serviceId: s.id,
              startTime: "09:00 AM",
              endTime: "10:00 AM",
              capacity: 20,
              priceInPaise: 25100,
              sortOrder: 1,
            },
            {
              serviceId: s.id,
              startTime: "10:00 AM",
              endTime: "11:00 AM",
              capacity: 20,
              priceInPaise: 25100,
              sortOrder: 2,
            },
          ],
        });
      } else {
        await prisma.serviceSlot.createMany({
          data: [
            {
              serviceId: s.id,
              startTime: "08:00 AM",
              endTime: "10:00 AM",
              capacity: 50,
              priceInPaise: (s.price || 0) * 100,
              sortOrder: 1,
            },
            {
              serviceId: s.id,
              startTime: "04:00 PM",
              endTime: "06:00 PM",
              capacity: 50,
              priceInPaise: (s.price || 0) * 100,
              sortOrder: 2,
            },
          ],
        });
      }
    }
  }

  // 6. Seed Notices
  const notices = [
    {
      titleHi: "श्री जोरावर धाम में निःशुल्क प्रवेश एवं दर्शन व्यवस्था",
      titleEn: "Free Entry & Public Darshan Guidelines",
      bodyHi: "सभी श्रद्धालुओं को सूचित किया जाता है कि श्री जोरावर धाम में प्रवेश, दर्शन एवं चरणामृत पूर्णतः निःशुल्क है। किसी भी मध्यस्थ या व्यक्ति को कोई शुल्क न दें।",
      bodyEn: "All pilgrims are hereby notified that general sanctum entry and darshan are completely free. Please do not pay any unauthorized intermediaries.",
      priority: NoticePriority.URGENT,
      isPinned: true,
      isActive: true,
    },
    {
      titleHi: "आगामी नवरात्र महोत्सव की विशेष तैयारियाँ एवं समय सारिणी",
      titleEn: "Special Preparations for Upcoming Navratri Mahotsav",
      bodyHi: "आश्विन मास के पावन नवरात्र महोत्सव पर नौ दिवसीय अखंड पाठ, संकीर्तन एवं विशाल भंडारे का आयोजन होगा। श्रद्धालुओं के लिए अतिरिक्त विश्राम कक्ष और चिकित्सा शिविर संचालित रहेंगे।",
      bodyEn: "During the holy Navratri festival, special non-stop recitations, devotional kirtans, and a grand community feast (Bhandara) will be organized. Extended medical camps and dormitories are being set up.",
      priority: NoticePriority.NORMAL,
      isPinned: false,
      isActive: true,
    },
  ];

  for (const n of notices) {
    const existing = await prisma.notice.findFirst({
      where: { titleEn: n.titleEn },
    });
    if (!existing) {
      await prisma.notice.create({ data: n });
    }
  }

  // 7. Seed Events
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextMonthEnd = new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = [
    {
      slug: "navratri-mahotsav-2026",
      titleHi: "वार्षिक नवरात्र महापर्व एवं शतचंडी महायज्ञ",
      titleEn: "Annual Navratri Mahotsav & Shatchandi Maha Yajna",
      descriptionHi: "नौ दिवसीय भव्य उत्सव जिसमें शतचंडी महायज्ञ, अखंड संकीर्तन एवं राजस्थान के विख्यात कलाकारों द्वारा भजन संध्या का आयोजन किया जाएगा।",
      descriptionEn: "A 9-day grand pilgrimage festival featuring continuous Vedic havan, devotional concerts by traditional Rajasthani artists, and daily prasadam distribution to thousands.",
      startDate: nextMonth,
      endDate: nextMonthEnd,
      locationHi: "श्री जोरावर धाम मुख्य मेला प्रांगण, चूरू, राजस्थान",
      locationEn: "Shri Jorawar Dham Main Festival Grounds, Churu, Rajasthan",
      bannerImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1200&auto=format&fit=crop",
      isFeatured: true,
      status: EventStatus.UPCOMING,
    },
  ];

  for (const e of events) {
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: e,
      create: e,
    });
  }

  // 8. Seed Gallery Categories & Items
  const categories = [
    { slug: "sanctum", nameHi: "गर्भगृह व दिव्य स्वरूप", nameEn: "Sanctum & Deities", sortOrder: 1 },
    { slug: "festivals", nameHi: "वार्षिक उत्सव व मेले", nameEn: "Annual Festivals & Melas", sortOrder: 2 },
    { slug: "premises", nameHi: "मंदिर प्रांगण व वास्तुकला", nameEn: "Temple Architecture & Grounds", sortOrder: 3 },
    { slug: "seva", nameHi: "भंडारा व दैनिक सेवा", nameEn: "Daily Seva & Annakshetra", sortOrder: 4 },
  ];

  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    const cat = await prisma.galleryCategory.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    categoryMap.set(c.slug, cat.id);
  }

  // Seed baseline gallery items with high-res temple photography
  const sampleItems = [
    {
      categorySlug: "sanctum",
      titleHi: "गर्भगृह में प्रज्वलित अखंड धूणा",
      titleEn: "Sacred Akhand Dhoona in Sanctum",
      fileUrl: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=800&auto=format&fit=crop",
      fileKey: "seed_sanctum_1.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 154000,
    },
    {
      categorySlug: "sanctum",
      titleHi: "भगवान जोरावर जी का मनोहारी दिव्य विग्रह",
      titleEn: "Divine Consecrated Idol of Bhagwan Jorawar Ji",
      fileUrl: "https://images.unsplash.com/photo-1620619767323-b95a89183081?q=80&w=800&auto=format&fit=crop",
      fileKey: "seed_sanctum_2.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 168000,
    },
    {
      categorySlug: "festivals",
      titleHi: "वार्षिक नवरात्र महाआरती में उमड़ा जनसैलाब",
      titleEn: "Devotee Congregation during Annual Navratri Aarti",
      fileUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=800&auto=format&fit=crop",
      fileKey: "seed_fest_1.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 182000,
    },
    {
      categorySlug: "premises",
      titleHi: "राजस्थानी शैली में निर्मित मुख्य शिखर व प्रांगण",
      titleEn: "Rajasthani Sandstone Temple Shikhara & Courtyard",
      fileUrl: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=800&auto=format&fit=crop",
      fileKey: "seed_prem_1.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 194000,
    },
    {
      categorySlug: "seva",
      titleHi: "अन्नक्षेत्र में महाप्रसाद वितरण",
      titleEn: "Daily Sattvic Prasadam Distribution",
      fileUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
      fileKey: "seed_seva_1.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 145000,
    },
  ];

  for (const item of sampleItems) {
    const catId = categoryMap.get(item.categorySlug);
    if (catId) {
      const existing = await prisma.galleryItem.findFirst({
        where: { fileKey: item.fileKey },
      });
      if (!existing) {
        await prisma.galleryItem.create({
          data: {
            categoryId: catId,
            titleHi: item.titleHi,
            titleEn: item.titleEn,
            fileUrl: item.fileUrl,
            fileKey: item.fileKey,
            mimeType: item.mimeType,
            sizeBytes: item.sizeBytes,
            isFeatured: true,
          },
        });
      }
    }
  }

  // 9. Seed FAQs
  const faqs = [
    {
      category: "darshan",
      questionHi: "क्या श्री जोरावर धाम में दर्शन हेतु कोई शुल्क या वीआईपी पास है?",
      questionEn: "Is there any fee or VIP pass required for Darshan at Shri Jorawar Dham?",
      answerHi: "नहीं, श्री जोरावर धाम में सभी श्रद्धालुओं के लिए प्रवेश एवं दर्शन पूर्णतः निःशुल्क हैं। मंदिर में किसी भी प्रकार का वीआईपी शुल्क अथवा मध्यस्थ व्यवस्था नहीं है।",
      answerEn: "No, entry and darshan are completely free for all pilgrims. There are no VIP paid passes or commercial intermediary channels.",
      sortOrder: 1,
    },
    {
      category: "darshan",
      questionHi: "मंदिर के कपाट किस समय खुलते और बंद होते हैं?",
      questionEn: "What are the opening and closing hours of the temple sanctum?",
      answerHi: "मंदिर प्रातःकाल 05:00 बजे मंगला आरती के साथ खुलता है और दोपहर 12:30 बजे राजभोग पश्चात विश्राम हेतु बंद होता है। पुनः सायं 04:00 बजे खुलकर रात्रि 10:00 बजे शयन आरती के उपरांत बंद होता है।",
      answerEn: "The temple opens at 05:00 AM for Mangala Aarti and closes at 12:30 PM after Rajbhog. It reopens at 04:00 PM and closes for the night at 10:00 PM after Shayan Aarti.",
      sortOrder: 2,
    },
    {
      category: "accommodation",
      questionHi: "क्या धाम परिसर में तीर्थयात्रियों के ठहरने हेतु धर्मशाला उपलब्ध है?",
      questionEn: "Is accommodation / dharamshala available inside the Dham premises?",
      answerHi: "हाँ, तीर्थ ट्रस्ट द्वारा संचालित वातानुकूलित एवं सामान्य विश्राम कक्ष श्रद्धालुओं हेतु मामूली रख-रखाव सहयोग राशि पर उपलब्ध हैं। परिवार एवं वृद्धजनों के लिए विशेष व्यवस्था की गई है।",
      answerEn: "Yes, clean air-conditioned and non-AC rooms are managed by the Trust and allocated on arrival for nominal maintenance contributions.",
      sortOrder: 3,
    },
    {
      category: "seva",
      questionHi: "धाम के अन्नक्षेत्र (भंडारे) में महाप्रसाद का क्या समय है?",
      questionEn: "What are the timings for the daily community kitchen (Annakshetra)?",
      answerHi: "धाम में प्रतिदिन दोपहर 11:30 से 02:30 बजे तक एवं सायंकाल 07:30 से 09:30 बजे तक शुद्ध सात्विक महाप्रसाद निःशुल्क वितरित किया जाता है।",
      answerEn: "Free pure sattvic prasadam is served daily between 11:30 AM - 02:30 PM and 07:30 PM - 09:30 PM in the community dining hall.",
      sortOrder: 4,
    },
    {
      category: "travel",
      questionHi: "श्री जोरावर धाम पहुँचने के लिए सबसे नजदीकी रेलवे स्टेशन कौन सा है?",
      questionEn: "Which is the nearest railway station to reach Shri Jorawar Dham?",
      answerHi: "निकटतम प्रमुख रेलवे स्टेशन चूरू जंक्शन (Churu Junction) एवं सादुलपुर हैं, जो दिल्ली, जयपुर, बीकानेर एवं जोधपुर से सीधे जुड़े हैं। स्टेशन से ऑटो एवं बसें आसानी से उपलब्ध हैं।",
      answerEn: "The closest major rail junctions are Churu Junction and Sadulpur, directly linked to Delhi, Jaipur, Bikaner, and Jodhpur. Taxis and local buses operate continuously.",
      sortOrder: 5,
    },
    {
      category: "donation",
      questionHi: "क्या धाम को दिया जाने वाला दान आयकर अधिनियम 80G के अंतर्गत कर-मुक्त है?",
      questionEn: "Is donation made to the Trust eligible for tax exemption under Section 80G?",
      answerHi: "हाँ, श्री जोरावर धाम तीर्थ ट्रस्ट भारत सरकार के आयकर अधिनियम 1961 की धारा 80G के अंतर्गत पंजीकृत है। दानदाताओं को आधिकारिक पावती एवं 80G प्रमाण पत्र प्रदान किया जाता है।",
      answerEn: "Yes, Shri Jorawar Dham Pilgrimage Trust is registered under Section 80G of the Income Tax Act. Official donation receipts and certificates are issued.",
      sortOrder: 6,
    },
  ];

  for (const f of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { questionEn: f.questionEn },
    });
    if (!existing) {
      await prisma.faq.create({ data: f });
    }
  }

  // 10. Seed Site Settings
  const settings = [
    { key: "temple_name_hi", value: "श्री जोरावर धाम", description: "Temple Hindi Name", isPublic: true },
    { key: "temple_name_en", value: "Shri Jorawar Dham", description: "Temple English Name", isPublic: true },
    { key: "contact_phone", value: "+91-141-2345678", description: "Office Phone Number", isPublic: true },
    { key: "helpline_phone", value: "+91-98765-43210", description: "24x7 Devotee Helpline", isPublic: true },
    { key: "contact_email", value: "trust@jorawardham.org", description: "Official Inquiries Email", isPublic: true },
    { key: "address_hi", value: "श्री जोरावर धाम, ज़िला चूरू / शेखावाटी, राजस्थान 331001", description: "Physical Address in Hindi", isPublic: true },
    { key: "address_en", value: "Shri Jorawar Dham, Churu District / Shekhawati, Rajasthan 331001, India", description: "Physical Address in English", isPublic: true },
    { key: "morning_darshan_time", value: "05:00 AM - 12:30 PM", description: "Morning Darshan Hours", isPublic: true },
    { key: "evening_darshan_time", value: "04:00 PM - 10:00 PM", description: "Evening Darshan Hours", isPublic: true },
    { key: "bank_name", value: "State Bank of India", description: "Trust Primary Bank", isPublic: true },
    { key: "bank_account_name", value: "Shri Jorawar Dham Pilgrimage Trust", description: "Account Beneficiary", isPublic: true },
    { key: "bank_account_no", value: "39871234567", description: "Trust Account Number", isPublic: true },
    { key: "bank_ifsc", value: "SBIN0001234", description: "Bank IFSC Code", isPublic: true },
    { key: "bank_branch", value: "Churu Main Branch, Rajasthan", description: "Bank Branch", isPublic: true },
  ];

  for (const st of settings) {
    await prisma.siteSetting.upsert({
      where: { key: st.key },
      update: { value: st.value, description: st.description, isPublic: st.isPublic },
      create: st,
    });
  }

  // 10. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      actorType: ActorType.SYSTEM,
      actorEmail: adminEmail,
      action: AuditAction.SECURITY_ALERT,
      entity: "SYSTEM_INITIALIZATION",
      details: {
        message: "Phase 1 technical foundation seeded successfully",
        environment: process.env.NODE_ENV || "development",
      },
    },
  });

  // 11. Seed Donation Causes (Phase 4)
  const donationCauses = [
    {
      slug: "general-dham-seva",
      titleHi: "सामान्य धाम विकास एवं धर्मार्थ सेवा",
      titleEn: "General Dham Welfare & Sacred Services",
      descriptionHi: "धाम के दैनिक धार्मिक संचालन, श्रद्धालुओं की सुविधा एवं मंदिर परिसर की निरंतर पवित्र सेवा हेतु सामान्य सहयोग।",
      descriptionEn: "General contribution for ongoing temple maintenance, pilgrim facilities, and sacred daily operations.",
      suggestedAmounts: [25100, 50100, 110000, 210000, 510000],
      targetAmountInPaise: 50000000,
      collectedAmountInPaise: 18450000,
      isActive: true,
      sortOrder: 1,
    },
    {
      slug: "annakshetra-bhandara",
      titleHi: "नित्य अन्नक्षेत्र महाप्रसाद सेवा",
      titleEn: "Daily Annakshetra Mahaprasad Seva",
      descriptionHi: "श्री जोरावर धाम आने वाले सभी तीर्थयात्रियों एवं साधु-संतों हेतु प्रतिदिन निःशुल्क पौष्टिक सात्विक महाप्रसाद की अखंड व्यवस्था।",
      descriptionEn: "Endowment for the uninterrupted sacred community kitchen providing free pure meals to all visiting pilgrims.",
      suggestedAmounts: [50100, 110000, 210000, 510000, 1100000],
      targetAmountInPaise: 25000000,
      collectedAmountInPaise: 12500000,
      isActive: true,
      sortOrder: 2,
    },
    {
      slug: "kamdhenu-gaushala",
      titleHi: "कामधेनु गौशाला एवं गो-संवर्धन सेवा",
      titleEn: "Kamdhenu Cow Sanctuary Care",
      descriptionHi: "देशी गिर व थारपारकर गायों के संरक्षण, नित्य पौष्टिक चारा, स्वच्छ आश्रय एवं चिकित्सीय देखरेख हेतु समर्पित गोसेवा।",
      descriptionEn: "Caring for indigenous Gir and Tharparkar cows with nutritious fodder, clean shelters, and dedicated veterinary medical care.",
      suggestedAmounts: [25100, 50100, 110000, 210000, 510000],
      targetAmountInPaise: 15000000,
      collectedAmountInPaise: 8200000,
      isActive: true,
      sortOrder: 3,
    },
    {
      slug: "chikitsa-seva",
      titleHi: "निःशुल्क धर्मार्थ औषधालय एवं प्राथमिक चिकित्सा",
      titleEn: "Free Charitable Dispensary & Medical Relief",
      descriptionHi: "तीर्थयात्रियों, वृद्धों एवं स्थानीय ग्रामीण जन हेतु निःशुल्क आयुर्वेदिक व एलोपैथिक प्राथमिक चिकित्सा एवं आवश्यक दवा वितरण।",
      descriptionEn: "Free primary medical dispensary supplying essential emergency care, first-aid, and medicines to pilgrims and villagers.",
      suggestedAmounts: [25100, 50100, 110000, 210000],
      targetAmountInPaise: 10000000,
      collectedAmountInPaise: 4300000,
      isActive: true,
      sortOrder: 4,
    },
    {
      slug: "mandir-renovation",
      titleHi: "गर्भगृह जीर्णोद्धार एवं परिक्रमा विस्तार",
      titleEn: "Sanctum & Parikrama Path Expansion",
      descriptionHi: "परम पूज्य जोरावर जी महाराज के मुख्य गर्भगृह के नक्काशीदार बंसी पहाड़पुर पाषाण जीर्णोद्धार एवं वृहद परिक्रमा पथ निर्माण कार्य।",
      descriptionEn: "Artistic sandstone architectural enhancement of the inner sanctum and widening of the covered pilgrim circumambulation corridor.",
      suggestedAmounts: [110000, 210000, 510000, 1100000, 2100000],
      targetAmountInPaise: 50000000,
      collectedAmountInPaise: 29500000,
      isActive: true,
      sortOrder: 5,
    },
  ];

  for (const cause of donationCauses) {
    await prisma.donationCause.upsert({
      where: { slug: cause.slug },
      update: cause,
      create: cause,
    });
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
