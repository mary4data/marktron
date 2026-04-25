import { BrandDashboard } from '@/components/BrandDashboard'

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BrandDashboard slug={slug} />
}
