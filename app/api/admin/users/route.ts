import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/argon2";
import { AdminRoleType, AdminStatus, AuditAction, ActorType } from "@prisma/client";
import { z } from "zod";

const createAdminSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8, "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए"),
  firstName: z.string().min(2).max(100),
  lastName: z.string().max(100).optional().nullable(),
  roles: z.array(z.nativeEnum(AdminRoleType)).min(1, "कम से कम एक पद (Role) अनिवार्य है"),
});

const updateAdminSchema = z.object({
  adminId: z.string().uuid(),
  status: z.nativeEnum(AdminStatus).optional(),
  roles: z.array(z.nativeEnum(AdminRoleType)).optional(),
});

export async function GET() {
  try {
    const currentAdmin = await getAuthenticatedAdmin();
    if (!currentAdmin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    // Role check: Only SUPER_ADMIN
    if (!currentAdmin.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "उपयोगकर्ता प्रबंधन केवल सुपर एडमिन हेतु उपलब्ध है (Super Admin access required)" },
        { status: 403 }
      );
    }

    const [admins, devoteesCount] = await Promise.all([
      prisma.admin.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          roles: {
            select: {
              role: { select: { name: true, description: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      success: true,
      admins: admins.map((a) => ({
        id: a.id,
        username: a.username,
        email: a.email,
        name: `${a.firstName} ${a.lastName || ""}`.trim(),
        status: a.status,
        roles: a.roles.map((r) => r.role.name),
        lastLoginAt: a.lastLoginAt,
        createdAt: a.createdAt,
      })),
      devoteesCount,
    });
  } catch {
    return NextResponse.json({ success: false, error: "व्यवस्थापक सूची प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentAdmin = await getAuthenticatedAdmin();
    if (!currentAdmin || !currentAdmin.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "व्यवस्थापक निर्माण केवल सुपर एडमिन हेतु उपलब्ध है" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "अमान्य विवरण" },
        { status: 400 }
      );
    }

    const { username, email, password, firstName, lastName, roles } = parsed.data;

    // Check duplicate
    const existing = await prisma.admin.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "ईमेल अथवा यूज़रनेम पूर्व में ही पंजीकृत है" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Create admin
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName: lastName || null,
        status: AdminStatus.ACTIVE,
      },
    });

    // Assign roles
    for (const roleName of roles) {
      const roleRecord = await prisma.role.findUnique({ where: { name: roleName } });
      if (roleRecord) {
        await prisma.adminRole.create({
          data: {
            adminId: newAdmin.id,
            roleId: roleRecord.id,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorType: ActorType.ADMIN,
        actorId: currentAdmin.id,
        actorEmail: currentAdmin.email,
        action: AuditAction.CREATE,
        entity: "ADMIN_USER",
        entityId: newAdmin.id,
        details: { email, username, roles, createdBy: currentAdmin.email },
      },
    });

    return NextResponse.json({
      success: true,
      message: "नया व्यवस्थापक सफलतापूर्वक निर्मित",
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        roles,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "व्यवस्थापक निर्माण में त्रुटि" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentAdmin = await getAuthenticatedAdmin();
    if (!currentAdmin || !currentAdmin.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "संशोधन केवल सुपर एडमिन कर सकते हैं" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "अमान्य संशोधन डेटा" }, { status: 400 });
    }

    const { adminId, status, roles } = parsed.data;

    // Prevent self-deactivation
    if (adminId === currentAdmin.id && status === AdminStatus.SUSPENDED) {
      return NextResponse.json({ success: false, error: "आप स्वयं का खाता निलंबित नहीं कर सकते" }, { status: 400 });
    }

    if (status) {
      await prisma.admin.update({
        where: { id: adminId },
        data: { status },
      });
    }

    if (roles && roles.length > 0) {
      // Remove old roles and reassign
      await prisma.adminRole.deleteMany({ where: { adminId } });
      for (const roleName of roles) {
        const r = await prisma.role.findUnique({ where: { name: roleName } });
        if (r) {
          await prisma.adminRole.create({
            data: { adminId, roleId: r.id },
          });
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        actorType: ActorType.ADMIN,
        actorId: currentAdmin.id,
        actorEmail: currentAdmin.email,
        action: AuditAction.ROLE_CHANGE,
        entity: "ADMIN_USER",
        entityId: adminId,
        details: { status, roles, updatedBy: currentAdmin.email },
      },
    });

    return NextResponse.json({ success: true, message: "व्यवस्थापक विवरण सफलतापूर्वक अद्यतन" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "अद्यतन त्रुटि" }, { status: 500 });
  }
}
