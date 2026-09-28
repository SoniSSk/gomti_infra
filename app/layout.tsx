import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import GlobalLoader from "./component/common/GlobalLoader";
import ReduxProvider from "./redux/ReduxProvider";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Gomti Infra And Mining",
  description: "Gomti Infra And Mining Dashboard",
};

// viewport-fit=cover lets fixed footers/buttons pad for the iOS safe area
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8a4d3e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ReduxProvider>
            <GlobalLoader />
            {children}
          </ReduxProvider>
        </SessionProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
