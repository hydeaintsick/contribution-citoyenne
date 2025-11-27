import { DocsLayout } from "@/components/DocsLayout";
import { WebhookSection } from "@/components/docs/WebhookSection";
import { ThirdPartyServicesSection } from "@/components/docs/ThirdPartyServicesSection";
import { GraphQLSection } from "@/components/docs/GraphQLSection";

export default function DocsPage() {
  return (
    <DocsLayout>
      <WebhookSection />
      <GraphQLSection />
      <ThirdPartyServicesSection />
    </DocsLayout>
  );
}

