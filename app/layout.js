import './globals.css';

export const metadata = {
  title: 'Telkom Indonesia - Reminder Status Penawaran',
  description: 'Enterprise & Business Service Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
