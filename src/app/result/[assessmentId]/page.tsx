import ResultPageClient from "./ResultPageClient";

type Props = { params: Promise<{ assessmentId: string }> };

export default async function ResultPage({ params }: Props) {
  const { assessmentId } = await params;
  return <ResultPageClient assessmentId={assessmentId} />;
}
