
// IMPORTANT: This file should be placed in:
// src/app/secure-admin-zone/create/page.tsx
// AFTER you have manually renamed `src/app/admin` to `src/app/secure-admin-zone`

import AdminArticleForm from '@/components/admin/AdminArticleForm';

export const dynamic = 'force-dynamic'; // Prevent prerendering issues

export default function CreateArticlePage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 font-headline">Create New Article</h2>
      <AdminArticleForm />
    </div>
  );
}
