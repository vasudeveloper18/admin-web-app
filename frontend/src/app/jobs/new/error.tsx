'use client';



import { useEffect } from 'react';

import { AlertCircle } from 'lucide-react';

import Link from 'next/link';



export default function NewJobError({

  error,

  reset,

}: {

  error: Error & { digest?: string };

  reset: () => void;

}) {

  useEffect(() => {

    console.error(error);

  }, [error]);



  return (

    <div style={{ padding: 40, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>

      <AlertCircle size={40} color="#ef4444" />

      <h2 style={{ color: '#f0f2f8', fontSize: 18, fontWeight: 600 }}>Failed to load create job page</h2>

      <p style={{ color: '#8b92a9', fontSize: 14 }}>{error.message || 'Something went wrong.'}</p>

      <div style={{ display: 'flex', gap: 12 }}>

        <button

          onClick={reset}

          style={{ padding: '10px 20px', borderRadius: 8, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}

        >

          Try again

        </button>

        <Link href="/jobs" style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#c5cae0', textDecoration: 'none', fontSize: 13 }}>

          Back to Jobs

        </Link>

      </div>

    </div>

  );

}

