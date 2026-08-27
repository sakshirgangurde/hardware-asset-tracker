import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { offboardEmployeeSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = offboardEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { endDate, notes, assetActions = [] } = parsed.data;

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        assets: {
          where: { status: "IN_USE" },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const offboardResult = await prisma.$transaction(async (tx) => {
      // Process each asset action
      for (const actionItem of assetActions) {
        const { assetId, action, notes: actionNotes, location } = actionItem;

        if (action === "RETURN_TO_STOCK") {
          // Close assignment
          await tx.assignmentHistory.updateMany({
            where: {
              assetId,
              employeeId: params.id,
              returnedDate: null,
            },
            data: {
              returnedDate: endDate,
              notes: `Offboarding return: ${actionNotes || "Returned to inventory on employee exit."}`,
            },
          });

          // Set asset in stock
          await tx.asset.update({
            where: { id: assetId },
            data: {
              status: "IN_STOCK",
              employeeId: null,
              officeLocation: location || employee.officeLocation,
            },
          });
        } else if (action === "MARK_LOST") {
          // Close assignment
          await tx.assignmentHistory.updateMany({
            where: {
              assetId,
              employeeId: params.id,
              returnedDate: null,
            },
            data: {
              returnedDate: endDate,
              notes: `Offboarding loss: ${actionNotes || "Marked lost during offboarding audit."}`,
            },
          });

          // Create disposal record for lost asset
          await tx.disposalRecord.create({
            data: {
              assetId,
              disposalDate: endDate,
              disposalReason: "LOST",
              notes: `Marked lost during offboarding of ${employee.name}. ${actionNotes || ""}`,
            },
          });

          // Update asset status
          await tx.asset.update({
            where: { id: assetId },
            data: {
              status: "LOST",
              employeeId: null,
            },
          });
        }
      }

      // Update employee record to OFFBOARDED
      const updatedEmployee = await tx.employee.update({
        where: { id: params.id },
        data: {
          status: "OFFBOARDED",
          endDate,
          notes: notes
            ? `${employee.notes ? employee.notes + "\n" : ""}Offboarding Note: ${notes}`
            : employee.notes,
        },
      });

      return updatedEmployee;
    });

    return NextResponse.json({
      success: true,
      message: `Employee ${employee.name} offboarded successfully. Assets resolved.`,
      employee: offboardResult,
    });
  } catch (error) {
    console.error("Offboard employee error:", error);
    return NextResponse.json(
      { error: "Failed to offboard employee" },
      { status: 500 }
    );
  }
}
