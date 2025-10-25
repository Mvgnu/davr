export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout intentionally doesn't include Navbar/Footer
  // The dashboard has its own navigation via DashboardLayout
  return <>{children}</>;
}
