import type { Metadata, Viewport } from "next";
import { Noto_Serif_Bengali, Tiro_Bangla } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n";

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-bengali",
  display: "swap",
});

const tiroBangla = Tiro_Bangla({
  subsets: ["bengali"],
  weight: ["400"],
  variable: "--font-tiro-bangla",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dua Card - দোয়া কার্ড",
  description:
    "ব্যক্তিগত দোয়ার সংগ্রহ ও পাঠক - Private Islamic Dua Collection & Reader",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dua Card",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`dark ${notoSerifBengali.variable} ${tiroBangla.variable}`}
    >
      <head>
        {/* Anti-flash theme initialization script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('dua_card_theme_pref');
                var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
                if (isDark) {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                }
                var activeColor = isDark ? '#121212' : '#ffffff';
                var metas = document.querySelectorAll('meta[name="theme-color"]');
                metas.forEach(function(m) { m.remove(); });
                var newMeta = document.createElement('meta');
                newMeta.setAttribute('name', 'theme-color');
                newMeta.setAttribute('content', activeColor);
                document.head.appendChild(newMeta);
                var appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                if (appleMeta) {
                  appleMeta.setAttribute('content', isDark ? 'black' : 'default');
                }
              } catch (e) {}
            `,
          }}
        />
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration skipped:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-bengali antialiased selection:bg-[#ffb31a]/30 selection:text-zinc-900 dark:selection:text-zinc-100">
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
