import { Barlow, Public_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";

const barlow = Barlow({
  weight: ['300', '400', '500', '600', '700'], // Add weights you need
  subsets: ['latin'],
  variable: '--font-barlow',
});

const publicSans = Public_Sans({
  weight: ['300', '400', '500', '600', '700'], // Add weights you need
  subsets: ['latin'],
  variable: '--font-public-sans',
})


export const metadata = {
  title: "Leo Charter Services",
  description: "Secure login page with OTP verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${barlow.variable} ${publicSans.variable}  dark text-foreground antialiased`}
      >
        <Providers> {children}</Providers>  
      </body>
    </html>
  );
}
