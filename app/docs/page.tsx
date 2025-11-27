import { DocsLayout } from "@/components/DocsLayout";
import { WebhookSection } from "@/components/docs/WebhookSection";
import { ApiGraphSection } from "@/components/docs/ApiGraphSection";
import { ThirdPartyServicesSection } from "@/components/docs/ThirdPartyServicesSection";

export default function DocsPage() {
  return (
    <DocsLayout>
      <WebhookSection />
      <ApiGraphSection />
      <ThirdPartyServicesSection />
    </DocsLayout>
  );
}

