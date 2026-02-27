"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      toast.error("Login failed. Check your credentials.");
    } else {
      toast.success("Welcome back!");
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="border-border bg-card rounded-2xl border p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-2xl font-black">Admin Login</h1>
          <p className="text-muted-foreground mt-1 text-sm">Soundloaded Blog editorial access</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@soundloaded.ng"
                className="pl-9"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-brand text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-9"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-brand text-xs">{errors.password.message}</p>}
          </div>

          {error && <p className="text-brand bg-brand/10 rounded-lg px-3 py-2 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-brand/90 text-brand-foreground w-full"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
