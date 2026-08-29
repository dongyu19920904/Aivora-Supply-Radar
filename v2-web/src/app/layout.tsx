import { Header } from '../components/Header';
import { MobileNav } from '../components/MobileNav';
import { FloatingGithubBanner } from '../components/FloatingGithubBanner';
import { GoogleAnalytics } from '@next/third-parties/google';
import NextTopLoader from 'nextjs-toploader';
import { JsonLd } from '../components/JsonLd';
import { DEFAULT_SHARE_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from '../lib/site';
import './globals.css';

import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: '爱窝啦·货源雷达 | AI账号货源、渠道比价与商机日报',
  description: '爱窝啦·货源雷达聚合 AI 账号与数字商品货源、渠道报价、官方地区价格、价格异动和账号商机日报，帮助买家比价，也帮助卖家发现可执行的利润机会。',
  keywords: ['AI订阅比价', 'AI订阅价格', '卡网渠道比价', 'ChatGPT Plus价格', 'Claude Pro价格', 'Gemini价格', 'Grok价格', 'Cursor价格', 'AI代充价格', '成品号价格'],
  openGraph: {
    title: '爱窝啦·货源雷达 | AI账号货源与商机平台',
    description: '聚合 AI 账号货源、渠道报价、官方地区价格、价格异动和账号商机日报。',
    url: '/',
    siteName: SITE_NAME,
    locale: 'zh_CN',
    type: 'website',
    images: [{ url: DEFAULT_SHARE_IMAGE, width: 1200, height: 630, alt: '爱窝啦·货源雷达 AI 账号货源与渠道比价' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '爱窝啦·货源雷达 | AI账号货源与商机平台',
    description: '聚合 AI 账号货源、渠道报价、官方地区价格、价格异动和账号商机日报。',
    images: [DEFAULT_SHARE_IMAGE],
  },
  icons: {
    icon: '/icon.svg?v=2',
  },
};

import { Footer } from '../components/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('aivora-supply-theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}" }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <JsonLd data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: absoluteUrl('/icon.svg'),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: 'zh-CN',
            publisher: { '@id': `${SITE_URL}/#organization` },
          },
        ]} />
        <NextTopLoader color="#10b981" showSpinner={false} shadow="0 0 10px #10b981,0 0 5px #10b981" />
        <Header />
        <div className="flex-1 pb-11 md:pb-0">
          {children}
        </div>
        <Footer />
        <MobileNav />
        <FloatingGithubBanner />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
