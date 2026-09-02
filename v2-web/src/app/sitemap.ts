import { MetadataRoute } from 'next';
import { supabaseAdmin as supabase } from '../lib/supabase-admin';
import { getPublishedBlogPosts } from '../lib/notion';
import { SITE_URL } from '../lib/site';
import { listAccountOpportunities } from '../lib/legacy-radar';
import { sellerPlatformTopics } from '../lib/seo-geo';

export const revalidate = 36000; // 缓存 10 小时 (36000秒)，防止每次请求都去查数据库导致超时

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // 1. 获取所有产品
  let products: Array<{ slug: string; updated_at: string | null }> = [];
  let officialApps: Array<{ slug: string; updated_at: string | null }> = [];
  try {
    const [productResult, officialResult] = await Promise.all([
      supabase.from('product_catalog').select('slug, updated_at').eq('is_active', true),
      supabase.from('apple_store_apps').select('slug, updated_at').eq('is_active', true),
    ]);
    products = productResult.data || [];
    officialApps = officialResult.data || [];
  } catch (error) {
    console.error('数据库暂不可用，sitemap 将只包含可确认的公开页面:', error);
  }

  const productUrls = (products || []).map((product) => ({
    url: `${baseUrl}/card-products/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 2. 获取官方订阅 App 详情
  const officialAppUrls = (officialApps || []).map((app) => ({
    url: `${baseUrl}/official-prices/${app.slug}`,
    lastModified: app.updated_at ? new Date(app.updated_at) : undefined,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 3. 获取所有已发布的博客文章
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = await getPublishedBlogPosts();
    blogUrls = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('获取博客文章失败，sitemap中将跳过动态博客生成:', error);
  }

  const opportunities = await listAccountOpportunities(500);
  const opportunityUrls = opportunities.map((item) => ({
    url: `${baseUrl}/opportunities/${item.report_date}`,
    lastModified: item.synced_at ? new Date(item.synced_at) : undefined,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 4. 定义所有静态路由
  const staticRoutes = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'always' as const },
    { url: `${baseUrl}/card-products`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/card-products/all`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/channels`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/official-prices`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/changes`, priority: 0.9, changeFrequency: 'hourly' as const },
    { url: `${baseUrl}/opportunities`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/opportunities/archive`, priority: 0.8, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/profit-calculator`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/wholesale`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/commercial`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/community`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/methodology`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/blog`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/guide`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/guide/official-vs-card-products`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/guide/getting-started`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/guide/best-practices`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/about`, priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  const staticUrls = staticRoutes.map((route) => ({
    url: route.url,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const platformUrls = sellerPlatformTopics.map((topic) => ({
    url: `${baseUrl}/platforms/${topic.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  return [
    ...staticUrls,
    ...platformUrls,
    ...productUrls,
    ...officialAppUrls,
    ...opportunityUrls,
    ...blogUrls,
  ];
}
