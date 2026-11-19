import { SolutionLanding, solutionMetadata } from "@/components/seo/solution-landing";

export const metadata = solutionMetadata("ecommerce-development");

export default function Page() {
  return <SolutionLanding slug="ecommerce-development" />;
}
