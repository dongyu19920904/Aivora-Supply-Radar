import React from 'react';
import { Metadata } from 'next';
import { Info, Search, Shield, Heart, Handshake, Github, Newspaper, Plus, Store, Users } from 'lucide-react';
import Link from 'next/link';
import { SubmitChannelButton } from '@/components/SubmitChannelButton';
import { PROJECT_REPOSITORY_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '关于 | 爱窝啦·货源雷达',
  description: '爱窝啦·货源雷达 是一个完全开源、中立的 AI 订阅全网比价聚合平台。我们致力于打破信息孤岛，通过自动追踪全网优质卡网渠道的实时底价与库存，帮你低价买到最靠谱的 ChatGPT、Claude 及 Cursor AI 订阅产品。',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="bg-white pb-20">
      {/* 简洁大气的头部 */}
      <div className="py-20 text-center px-4 sm:px-6 lg:px-8 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-6">
            <Info className="w-4 h-4" />
            <span>关于 爱窝啦·货源雷达 开源项目</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
            打破信息茧房，<br className="hidden sm:block"/>
            <span className="text-emerald-600">做 AI订阅产品的搬运工</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            爱窝啦·货源雷达 顾名思义是“开放价格”。我们是一个依托于开源社区的项目，致力于收录全网卡网渠道的各种 AI 订阅及数字产品价格。我们不提供 AI 服务，只为拉进顾客与渠道商之间的距离。
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16">
        
        {/* 我们解决的痛点 */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">为什么要做这个项目？</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              市面上有非常多高性价比的AI订阅产品，但它们往往散落在各个微信群、TG群、各种发卡网中。这种信息不对称导致了双输的局面：
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <Users className="w-10 h-10 text-blue-600 mb-5 relative z-10" />
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">消费者的困境</h3>
              <p className="text-gray-600 leading-relaxed relative z-10">
                想要购买便宜靠谱的 ChatGPT、Claude 或流媒体账号，却需要花费大量时间四处寻找渠道。更糟的是，由于信息闭塞，往往花了大量时间不仅没买到合适的产品，反而容易花高价当了“韭菜”。
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <Store className="w-10 h-10 text-emerald-600 mb-5 relative z-10" />
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">渠道商的痛点</h3>
              <p className="text-gray-600 leading-relaxed relative z-10">
                手里握有优质的货源和全网最低的价格，却苦于没有集中曝光的流量池。不懂营销，就像曾经的我一样，导致有好的产品却无人问津。
              </p>
            </div>
          </div>
        </div>

        {/* 我们的承诺与理念 */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">我们的开源理念与承诺</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-5">
                <Search className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">全网价格透明化</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                依靠强大的自动化爬虫，我们将各个渠道的价格聚合。平台内的商品<strong>完全按照价格高低进行客观排序</strong>，绝无暗箱操作，让底价一览无余。
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">绝对中立与客观</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                本站仅提供客观的数据聚合，不参与实际交易，也不为第三方产品背书。我们只做数据的呈现者，将选择的权利彻底交还给用户。
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-5">
                <Handshake className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">与商家生态共建</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                支持主流发卡系统一键免费收录，针对自建商城的渠道，如果页面有嵌入 JSON-LD 结构化数据，也可以被收录。所有流程均不收费，这是一个我们、顾客、商家的共赢项目。
              </p>
            </div>
          </div>
        </div>

        {/* 社区与联系方式 */}
        <div className="max-w-4xl mx-auto bg-emerald-50 rounded-3xl p-8 sm:p-12 text-center border border-emerald-100">
          <Heart className="w-10 h-10 text-emerald-500 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">参与爱窝啦货源生态</h2>
          <p className="text-emerald-800 mb-8 max-w-2xl mx-auto leading-relaxed">
            这个开源项目离不开每一位开发者的贡献、渠道的收录以及用户的反馈。如果这个项目帮助到了您，请在 GitHub 上为我们点亮 Star ⭐！
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
            <a 
              href={PROJECT_REPOSITORY_URL}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
            >
              <Github className="w-5 h-5" />
              访问 GitHub 仓库
            </a>
            <Link
              href="/opportunities"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <Newspaper className="w-5 h-5" />
              查看账号商机
            </Link>
            <SubmitChannelButton
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              提交货源渠道
            </SubmitChannelButton>
          </div>
        </div>
        
      </div>
    </div>
  );
}
