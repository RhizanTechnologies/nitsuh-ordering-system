import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nitsuh Foods & Cafe Operations System',
  description: 'Enterprise Cafe POS, Kitchen Display System, and Dual-Store Inventory Management System - Addis Ababa, Ethiopia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" className="light theme-light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  localStorage.removeItem('cafe_theme');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.remove('theme-dark', 'dark');
                  document.documentElement.classList.add('theme-light', 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased selection:bg-red-600 selection:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
