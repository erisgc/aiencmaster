import type { Metadata } from 'next';
import { PublicShell } from './components/PublicShell';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'AIENC',
  description: 'Plataforma de anuncios AIENC',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}
