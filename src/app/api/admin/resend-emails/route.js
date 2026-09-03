import { requireUser, unauthorized, isAdminUser } from '@/lib/apiAuth';

export async function GET(request) {
  const user = await requireUser(request);
  if (!isAdminUser(user)) return unauthorized();
  const response = await fetch('https://api.resend.com/emails?limit=100', {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    cache: 'no-store'
  });
  if (!response.ok) return Response.json({ users: [] }, { status: 502 });
  const data = await response.json();
  const users = (data.data || []).flatMap((email) => (email.to || []).map((address) => ({ email: address, createdAt: email.created_at || null })));
  return Response.json({ users });
}
