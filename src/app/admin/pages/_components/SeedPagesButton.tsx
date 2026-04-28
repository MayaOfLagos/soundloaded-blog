"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, getApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";

export function SeedPagesButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSeed() {
    setIsPending(true);
    try {
      const res = await adminApi.post<{
        created: number;
        skipped: number;
      }>("/api/admin/pages/seed");
      toast.success(
        res.data.created > 0
          ? `${res.data.created} system page${res.data.created === 1 ? "" : "s"} created`
          : "System pages already exist"
      );
      router.refresh();
    } catch (error) {
      toast.error(getApiError(error, "Failed to create system pages"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleSeed} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FilePlus2 className="mr-2 h-4 w-4" />
      )}
      Seed System Pages
    </Button>
  );
}
