import "@testing-library/jest-dom/vitest";
import "whatwg-fetch";
import { TextEncoder, TextDecoder } from "node:util";
import { vi } from "vitest";
import React from "react";

if (!globalThis.TextEncoder) {
  // eslint-disable-next-line no-new
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}

if (!globalThis.TextDecoder) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.TextDecoder = TextDecoder as any;
}

// Basic stub for matchMedia used in some DSFR components.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

vi.mock("next/navigation", () => {
  const push = vi.fn();
  const replace = vi.fn();
  const refresh = vi.fn();
  const back = vi.fn();
  const forward = vi.fn();

  return {
    useRouter: () => ({
      push,
      replace,
      refresh,
      back,
      forward,
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", {
      ...props,
      alt: props.alt ?? "",
    }),
}));

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>(
    "framer-motion",
  );

  const createMotionComponent =
    (element: string) =>
    // eslint-disable-next-line react/display-name
    (props: React.HTMLAttributes<HTMLElement>) =>
      React.createElement(element, props);

  const motionProxy = new Proxy(
    {},
    {
      get: (_target, key: string) => createMotionComponent(key),
    },
  );

  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: motionProxy,
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
    }),
    // Default to a linear easing to avoid errors when components call cubicBezier.
    cubicBezier: () => (t: number) => t,
  };
});

