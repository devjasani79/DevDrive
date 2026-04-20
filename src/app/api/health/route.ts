import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Used for monitoring and load balancer health checks
 * Returns 200 if the service is up
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_APPWRITE_HOST_URL',
      'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
      'NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID',
      'APPWRITE_API_KEY',
      'SHARE_SECRET',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'Missing environment variables',
          missing: missingEnvVars,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[health] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
