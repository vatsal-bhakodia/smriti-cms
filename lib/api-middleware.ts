import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(",") || [];

export function checkDomainAccess(origin: string | null): boolean {
  if (!origin) return false;
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // Allow localhost for development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
    
    return ALLOWED_DOMAINS.some((domain) => {
      // Exact match or subdomain match
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
}

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  return null;
}

export function restrictToGetOnly(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.json(
      { error: "Method not allowed. Only GET requests are permitted." },
      { status: 405 }
    );
  }
  
  // Allow server-side requests (no origin header)
  const origin = request.headers.get("origin");
  if (!origin) {
    return null; // Server-side request, allow it
  }
  
  // Check domain access for browser requests
  if (!checkDomainAccess(origin)) {
    return NextResponse.json(
      { error: "Forbidden. Domain not allowed." },
      { status: 403 }
    );
  }
  
  return null;
}

