import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import type { CreatorApplicationFormValues } from "@/lib/validations/application";

type Application = {
  id: string;
  type: "ARTIST" | "LABEL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  displayName: string;
  slug: string;
  bio: string | null;
  createdAt: string;
  reviewNote: string | null;
  reviewedAt: string | null;
};

export function useMyApplications() {
  return useQuery({
    queryKey: ["my-applications"],
    queryFn: async () => {
      const { data } = await axios.get<{ applications: Application[] }>("/api/applications");
      return data.applications;
    },
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreatorApplicationFormValues) => {
      const { data } = await axios.post("/api/applications", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Application submitted!");
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data?.error === "string"
            ? err.response.data.error
            : "Failed to submit application";
        toast.error(msg);
      } else {
        toast.error("Something went wrong");
      }
    },
  });
}
