import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SRM Faculty Appraisal & Analytics — API System 2025',
  description: 'Academic Performance Indicators (API) and Analytics Platform — SRM Institute of Science and Technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
