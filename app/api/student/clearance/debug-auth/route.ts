import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Authentication Check ===');
    
    // Log all headers
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Request headers:', JSON.stringify(headers, null, 2));
    
    // Check cookies
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header:', cookieHeader);
    
    // Check for auth token
    const authToken = request.cookies.get('auth_token');
    console.log('Auth token from cookies:', authToken);
    
    // Check current user
    const user = await getCurrentUser();
    console.log('Current user from getCurrentUser:', JSON.stringify(user, null, 2));
    
    return NextResponse.json({
      message: 'Auth debug completed',
      headers,
      cookieHeader,
      authToken,
      user
    });
    
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({ 
      error: 'Auth debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}