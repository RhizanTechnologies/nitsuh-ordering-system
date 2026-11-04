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
    <html lang="en" suppressHydrationWarning>
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
                  var saved = localStorage.getItem('cafe_theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', saved);
                  if (saved === 'light') {
                    document.documentElement.classList.add('theme-light', 'light');
                  } else {
                    document.documentElement.classList.add('theme-dark', 'dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased selection:bg-[#C11221] selection:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
