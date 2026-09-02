import { Header } from '../components/Header';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Noto_Sans_SC, Space_Grotesk } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { JsonLd } from '../components/JsonLd';
import { STORE_ORGANIZATION_ID } from '../lib/seo-geo';
import {
  DEFAULT_SHARE_IMAGE,
  PROJECT_REPOSITORY_URL,
  SITE_NAME,
  SITE_URL,
  STORE_NAME,
  STORE_URL,
} from '../lib/site';
import './globals.css';

import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: '爱窝啦·货源雷达 | AI账号卖家货源、渠道核价与商机日报',
  description: '爱窝啦·货源雷达为 AI 账号卖家聚合数字商品货源、渠道报价、官方地区价格、价格异动和账号商机日报，帮助卖家核验进货成本并发现可执行的利润机会。',
  keywords: ['AI账号货源', 'AI账号卖家', 'AI账号进货', '卡网渠道核价', 'ChatGPT货源', 'Claude货源', 'AI账号利润', 'AI账号商机日报'],
  openGraph: {
    title: '爱窝啦·货源雷达 | AI账号卖家货源与商机平台',
    description: '为 AI 账号卖家聚合货源、渠道报价、官方地区价格、价格异动和账号商机日报。',
    url: '/',
    siteName: SITE_NAME,
    locale: 'zh_CN',
    type: 'website',
    images: [{ url: DEFAULT_SHARE_IMAGE, width: 1200, height: 630, alt: '爱窝啦·货源雷达 AI 账号货源与渠道比价' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '爱窝啦·货源雷达 | AI账号卖家货源与商机平台',
    description: '为 AI 账号卖家聚合货源、渠道报价、官方地区价格、价格异动和账号商机日报。',
    images: [DEFAULT_SHARE_IMAGE],
  },
  icons: {
    icon: '/icon.svg?v=2',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

import { Footer } from '../components/Footer';

const bodyFont = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
});

const displayFont = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

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
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-screen flex flex-col`}>
        <JsonLd data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': STORE_ORGANIZATION_ID,
            name: STORE_NAME,
            alternateName: SITE_NAME,
            url: STORE_URL,
            sameAs: [SITE_URL, PROJECT_REPOSITORY_URL],
            description: '爱窝啦·AI账号店提供面向个人自用买家的 AI 工具零售商品，并发布面向 AI 账号卖家的爱窝啦·货源雷达。',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: 'zh-CN',
            publisher: { '@id': STORE_ORGANIZATION_ID },
            audience: {
              '@type': 'BusinessAudience',
              audienceType: 'AI账号卖家和数字商品渠道商',
            },
            about: ['AI账号货源', '渠道报价', '库存变化', '官方价格', '账号商机日报'],
          },
        ]} />
        <NextTopLoader color="#f5c518" showSpinner={false} shadow="none" />
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
