// Temporary CORS proxy for RAG service streaming
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[RAG Proxy] Forwarding request to RAG service:', body);
    
    // Forward request to RAG service
    const ragResponse = await fetch('https://api.notaku.cloud/query/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[RAG Proxy] RAG service response status:', ragResponse.status);

    if (!ragResponse.ok) {
      const errorText = await ragResponse.text();
      console.error('[RAG Proxy] RAG service error:', ragResponse.status, errorText);
      
      // Handle Cloudflare 520 errors specifically
      if (ragResponse.status === 520) {
        console.error('[RAG Proxy] Cloudflare 520 error - RAG service is down or overloaded');
        return NextResponse.json(
          { 
            error: 'RAG service temporarily unavailable',
            details: 'The AI service is currently experiencing issues. Please try again in a few minutes.',
            fallback_response: 'Maaf, layanan AI sedang mengalami gangguan. Silakan coba lagi dalam beberapa menit. Sementara itu, Anda dapat melihat nota-nota Anda di halaman Receipts.'
          },
          { 
            status: 503, // Service Unavailable
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
      
      throw new Error(`RAG service error: ${ragResponse.status} - ${errorText}`);
    }

    // Check if response is streaming (text/event-stream) or regular text
    const contentType = ragResponse.headers.get('content-type') || '';
    console.log('[RAG Proxy] Response content-type:', contentType);
    
    if (contentType.includes('text/event-stream')) {
      // Handle streaming response
      console.log('[RAG Proxy] Handling streaming response');
      
      const readable = new ReadableStream({
        start(controller) {
          const reader = ragResponse.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          
          function pump(): Promise<void> {
            return reader!.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              return pump();
            });
          }
          
          return pump();
        }
      });
      
      return new NextResponse(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } else {
      // Handle regular text response
      console.log('[RAG Proxy] Handling regular text response');
      const data = await ragResponse.text();
      
      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

  } catch (error) {
    console.error('[RAG Proxy] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to proxy RAG request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
