import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  // For logout - clear the auth cookie
  const response = NextResponse.json({ success: true });
  
  // Clear the cookie by setting it to empty with immediate expiration
  response.cookies.set('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0), // Set expiration to past date
    path: '/',
  });

  // Also try to delete the cookie explicitly
  response.cookies.delete('authToken');

  return response;
}

