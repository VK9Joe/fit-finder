import { NextResponse } from 'next/server';
import { fetchProducts } from '@/lib/shopify';

export async function GET(request: Request) {
  try {
    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '250', 10);
    const cursor = searchParams.get('cursor') || undefined;
    
    // Fetch products using GraphQL Storefront API
    const result = await fetchProducts(limit, cursor);
    
    return NextResponse.json({ 
      ok: true, 
      products: result.products,
      pageInfo: result.pageInfo 
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch products';
    console.error('Products API error:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}