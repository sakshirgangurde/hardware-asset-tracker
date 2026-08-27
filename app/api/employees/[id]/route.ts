import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        assets: {
          include: {
            maintenance: {
              take: 1,
              orderBy: { dateReported: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        assignments: {
          include: {
            asset: {
              select: {
                id: true,
                assetTag: true,
                name: true,
                category: true,
                brand: true,
                model: true,
              },
            },
          },
          orderBy: { assignedDate: "desc" },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Get employee error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve employee details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = employeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const currentEmp = await prisma.employee.findUnique({
      where: { id: params.id },
    });

    if (!currentEmp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const data = parsed.data;

    // Check unique email if changed
    if (data.email !== currentEmp.email) {
      const existing = await prisma.employee.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Email "${data.email}" is already used by another employee.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: data.name,
        email: data.email,
        department: data.department,
        officeLocation: data.officeLocation,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
      },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        assets: { where: { status: "IN_USE" } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (employee.assets.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete employee while they have ${employee.assets.length} active assigned assets. Please complete the offboarding workflow first.`,
        },
        { status: 400 }
      );
    }

    await prisma.employee.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Employee record deleted" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
