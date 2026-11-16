import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | VOIDTECH SOLUTION",
    default: "Admin Console | VOIDTECH SOLUTION",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

