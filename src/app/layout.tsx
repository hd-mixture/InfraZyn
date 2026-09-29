
'use client';

import type { Metadata } from 'next';
import './globals.css';
import './orbit.css';
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react';

const metadata: Metadata = {
  title: 'DevTeXhHub | AI Infrastructure Project Intelligence (SIH26103 - Team InfraZyn)',
  description: 'AI-Powered Infrastructure Project Monitoring & Early Warning Platform inspired by the MoSPI PAIMANA ecosystem. Predict. Monitor. Prevent.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>{String(metadata.title)}</title>
        <meta name="description" content={String(metadata.description)} />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
