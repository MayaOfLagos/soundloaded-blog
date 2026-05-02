"use client";

import { useEffect } from "react";

type CodeInjectionClientProps = {
  html: string;
  target: "head" | "body";
  marker: string;
};

function copyAttributes(from: Element, to: Element) {
  for (const attr of Array.from(from.attributes)) {
    to.setAttribute(attr.name, attr.value);
  }
}

function createExecutableScript(source: HTMLScriptElement) {
  const script = document.createElement("script");
  copyAttributes(source, script);
  script.text = source.text;
  return script;
}

export function CodeInjectionClient({ html, target, marker }: CodeInjectionClientProps) {
  useEffect(() => {
    const mount = target === "head" ? document.head : document.body;
    if (!mount || !html.trim()) return;

    const template = document.createElement("template");
    template.innerHTML = html;

    const appended: Node[] = [];

    for (const node of Array.from(template.content.childNodes)) {
      const nextNode =
        node instanceof HTMLScriptElement ? createExecutableScript(node) : node.cloneNode(true);

      if (nextNode instanceof Element) {
        nextNode.setAttribute("data-code-injection", marker);
      }

      mount.appendChild(nextNode);
      appended.push(nextNode);
    }

    return () => {
      for (const node of appended) {
        node.parentNode?.removeChild(node);
      }
    };
  }, [html, marker, target]);

  return null;
}
