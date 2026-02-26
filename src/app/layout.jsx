import '@/globals.css';
import Providers from './providers';

export const metadata = {
  title: 'QUMA Finance',
  description: 'QUMA Finance SaaS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
