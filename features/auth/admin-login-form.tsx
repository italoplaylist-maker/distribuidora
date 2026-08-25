"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions";
import { Loader2 } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await loginAction(email, password);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-zinc-300">
          E-mail administrativo
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          placeholder="admin@plataforma.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-zinc-300">
          Senha
        </Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Acessar painel
      </Button>
    </form>
  );
}
