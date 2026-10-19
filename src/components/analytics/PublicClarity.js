'use client';
import { useEffect } from 'react';
import { installPublicClarity } from '@/lib/clarityRuntime';

export default function PublicClarity({ enabled, projectId }) {
  useEffect(() => {
    installPublicClarity(window, { enabled, projectId });
  }, [enabled, projectId]);
  return null;
}
