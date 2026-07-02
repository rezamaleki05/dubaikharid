import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // Step 1: Fetch main page to get cookies and HTML on the server
    const getRes = await fetch('https://www.bonbast.com/', {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 0 } // Prevent Next.js fetch caching
    });
    
    const cookies = getRes.headers.get('set-cookie');
    const html = await getRes.text();
    
    // Step 2: Extract param token from html
    const paramRegex = /\$\.post\('\/json',\s*{\s*param:\s*"([^"]+)"/i;
    const match = html.match(paramRegex);
    if (!match) {
      return NextResponse.json({ error: 'Could not find param token in HTML' }, { status: 500 });
    }
    const token = match[1];
    
    // Step 3: Send POST request to bonbast.com/json
    const postRes = await fetch('https://www.bonbast.com/json', {
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': cookies || '',
        'Referer': 'https://www.bonbast.com/',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `param=${encodeURIComponent(token)}`,
      next: { revalidate: 0 }
    });
    
    const data = await postRes.json();
    if (data && data.aed1) {
      const rateToman = parseFloat(data.aed1);
      const finalRate = Math.round(rateToman + 600);
      return NextResponse.json({ rate: finalRate, lastUpdate: data.last_modified || data.created });
    }
    
    return NextResponse.json({ error: 'Invalid data returned from source' }, { status: 500 });
  } catch (e) {
    console.error('Server-side fetch error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
