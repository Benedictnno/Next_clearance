import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initiateClearanceRequest } from "@/lib/clearance";
import { applySecurityHeaders } from "@/lib/security";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.student) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clearanceRequest = await initiateClearanceRequest(user.student.id);
    const response = NextResponse.json({ success: true, data: clearanceRequest });
    return applySecurityHeaders(response);
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 400 });
    return applySecurityHeaders(response);
  }
}