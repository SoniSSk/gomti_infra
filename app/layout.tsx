import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import ScrollToTop from "./component/common/ScrollToTop";
import GlobalLoader from "./component/common/GlobalLoader";
import ReduxProvider from "./redux/ReduxProvider";
import "./globals.css";
import Routes from "./component/Routes";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Gomti Infra Mining",
  description: "Gomti Infra Mining Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <Routes />
          <GlobalLoader />
          {children}
        </ReduxProvider>
        <Toaster position="top-right" />
        <ScrollToTop />
      </body>
    </html>
  );
}
