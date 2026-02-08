import React, { Suspense } from 'react';
import InstallClient from './InstallClient';

export default function InstallPage() {
  return (
    <Suspense fallback={<div>読み込み中…</div>}>
      <InstallClient />
    </Suspense>
  );
}
