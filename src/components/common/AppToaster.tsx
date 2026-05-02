"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("react-hot-toast").then((mod) => mod.Toaster), {
  ssr: false,
});

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      gutter={8}
      containerStyle={{ bottom: 88 }}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1a1a1a",
          color: "#ededed",
          border: "1px solid #262626",
          borderRadius: "8px",
          fontSize: "14px",
          fontFamily: "var(--font-inter)",
        },
      }}
    />
  );
}
