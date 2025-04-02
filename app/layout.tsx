import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '扣子 API 聊天演示',
  description: '扣子 API 聊天演示',
  generator: 'v0.dev',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
