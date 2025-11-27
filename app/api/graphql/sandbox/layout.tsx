import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GraphQL Sandbox - Contribcit",
};

export default function SandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        html, body {
          height: 100vh !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        #__next {
          height: 100vh !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        header,
        footer,
        nav:not([data-sandbox]),
        [id*="consent"],
        [class*="SocialMedias"],
        [class*="ConsentBanner"],
        [class*="HeaderClient"],
        [class*="Footer"],
        .fr-follow,
        .fr-follow__social,
        .admin-shell,
        .admin-shell-container {
          display: none !important;
        }
        main {
          height: 100vh !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        [data-sandbox-container],
        [data-sandbox-container] > *,
        [data-sandbox-container] > * > *,
        iframe {
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          display: block !important;
        }
        iframe {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 99999 !important;
        }
      `,
        }}
      />
      {children}
    </>
  );
}
