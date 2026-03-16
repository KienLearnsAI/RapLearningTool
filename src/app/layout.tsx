import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rap Flow Workbench',
  description: 'Lightweight beat and bar writing tool'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
