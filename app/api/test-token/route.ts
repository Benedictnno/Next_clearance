import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role') || 'STUDENT';

  // Validate role
  const validRoles = ['STUDENT', 'OFFICER', 'ADMIN', 'SUPER_ADMIN'];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be STUDENT, OFFICER, ADMIN, or SUPER_ADMIN' },
      { status: 400 }
    );
  }

  // Generate a test token with the structure you provided
  const testPayload = {
    _id: role === 'STUDENT' ? "68f650ad139569c128ca2f6d" : 
         role === 'OFFICER' ? "68f650ad139569c128ca2f7a" :
         role === 'ADMIN' ? "68f650ad139569c128ca2f8b" : "68f650ad139569c128ca2f9c",
    email: role === 'STUDENT' ? "test.student@eksu.edu.ng" :
           role === 'OFFICER' ? "test.officer@eksu.edu.ng" :
           role === 'ADMIN' ? "test.admin@eksu.edu.ng" : "super.admin@eksu.edu.ng",
    matricNumber: role === 'STUDENT' ? "230903285" : undefined,
    role: role.toLowerCase(), // lowercase as it would come from external system
    isActive: true,
    name: role === 'STUDENT' ? "Test Student" :
          role === 'OFFICER' ? "Test Officer" :
          role === 'ADMIN' ? "Test Admin" : "Super Admin",
    phoneNumber: "07081418052",
    profilePictureUrl: "",
    department: role === 'STUDENT' || role === 'OFFICER' ? "Computer Science" : undefined,
    gender: "male",
    admissionYear: role === 'STUDENT' ? 2023 : undefined,
    yearsSinceAdmission: role === 'STUDENT' ? 2 : undefined,
  };

  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  
  try {
    const token = jwt.sign(testPayload, JWT_SECRET, {
      expiresIn: '7d'
    });

    // Create appropriate dashboard URL based on role
    const dashboardUrl = 
      role === 'STUDENT' ? '/student/dashboard' :
      role === 'OFFICER' ? '/officer/dashboard' :
      '/admin/dashboard';

    // Return both the token and the URL to use
    const testUrl = `http://localhost:3000/?token=${token}`;
    
    return NextResponse.json({
      success: true,
      role,
      token,
      testUrl,
      dashboardUrl,
      payload: testPayload,
      instructions: [
        "1. Copy the 'token' value",
        "2. Or visit the 'testUrl' directly in your browser",
        "3. You should be redirected to the appropriate dashboard",
        `4. Expected dashboard: ${dashboardUrl}`
      ]
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
