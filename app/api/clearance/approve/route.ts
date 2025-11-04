import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { approveStep } from "@/lib/clearance";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.officer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { requestId, stepId, comment } = body;

  try {
    await approveStep(requestId, stepId, user.officer.id, comment);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}