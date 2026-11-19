import { SolutionLanding, solutionMetadata } from "@/components/seo/solution-landing";

export const metadata = solutionMetadata("website-development");

export default function Page() {
  return <SolutionLanding slug="website-development" />;
}
