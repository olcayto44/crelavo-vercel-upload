import {CategoryDetailPage} from "@/components/CategoryDetailPage";import {AdPerformanceScoreChecker} from "@/components/AdPerformanceScoreChecker";import {categoryDetailMeta} from "@/lib/category-detail-meta";
export const metadata=categoryDetailMeta("ad_score_checker");
export default function Page(){return <CategoryDetailPage id="ad_score_checker"><AdPerformanceScoreChecker/></CategoryDetailPage>}
