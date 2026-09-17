import { EmptyState } from '../../../components/states';
import { PageFrame } from '../knowledge-bases/page';
export default function Page() {
  return (
    <PageFrame
      title="Analytics"
      description="Understand knowledge and AI usage across your workspace."
    >
      <EmptyState
        title="Analytics will appear here"
        description="Usage event collection is modeled in the API foundation but is not yet displayed."
      />
    </PageFrame>
  );
}
