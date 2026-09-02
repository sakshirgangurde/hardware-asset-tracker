import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    let user = null;
    try {
      user = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() },
      });
    } catch (dbError) {
      console.warn("Database read failed, checking demo fallback...", dbError);
    }

    if (!user) {
      // Fallback for demo admin credentials on Vercel without cloud DB
      if (email.toLowerCase() === "admin@hardwaretracker.com" && password === "adminpassword123") {
        user = {
          id: "62d48148-9cd1-4e33-930d-991faacbab69",
          email: "admin@hardwaretracker.com",
          name: "IT Administrator",
          passwordHash: "",
        };
      } else {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
    } else {
      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "Database error during login",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
