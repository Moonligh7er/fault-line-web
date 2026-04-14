import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SubmitForm from './submit-form';

export const metadata = {
  title: 'Report an issue',
  description: 'Report a pothole, broken streetlight, or other infrastructure issue.',
};

export default async function SubmitPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/submit');
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Report an Infrastructure Issue
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Your report helps the community document what needs to be fixed.
      </p>
      <SubmitForm />
    </div>
  );
}
