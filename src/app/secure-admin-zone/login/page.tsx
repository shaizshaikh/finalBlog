
import { Suspense } from 'react';
import AdminLoginClientForm from '@/components/admin/AdminLoginClientForm';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';


export default function AdminLoginPageContainer() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-muted/40 px-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="sr-only">Loading login page...</p>
      </div>
    }>
      <AdminLoginClientForm />
    </Suspense>
  );
}
