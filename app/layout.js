import './globals.css';

export const metadata = {
  title: 'Состав — анализ продуктов',
  description: 'Сфотографируй этикетку и узнай насколько полезен продукт',
  manifest: '/manifest.json',
  themeColor: '#F7F5F0',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Состав',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#F7F5F0" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
