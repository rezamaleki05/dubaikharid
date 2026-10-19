import { indexNowKeyResponse } from '@/lib/indexnowDomain';

export const dynamic = 'force-dynamic';
export async function GET(request) {
  return indexNowKeyResponse(request.url, 'indexnow.txt');
}
