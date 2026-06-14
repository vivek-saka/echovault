"use client";

import { useState }   from "react";
import { signIn }     from "next-auth/react";
import Link           from "next/link";
import { useRouter }  from "next/navigation";
import { useForm }    from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/types/auth";
import { api } from "@/lib/trpc/client";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const registerMutation = api.auth.register.useMutation({
    onError: (err) => setServerError(err.message),
  });

  async function onSubmit(data: RegisterInput) {
    setServerError("");

    try {
      await registerMutation.mutateAsync(data);

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email:    data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/workspace");
        router.refresh();
      }
    } catch {
      // Error handled by mutation onError
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Create your vault</h1>
        <p className="text-muted-foreground text-sm">
          Free forever · No credit card required
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {serverError}
          </p>
        )}

        <div>
          <label className="text-sm font-medium mb-1.5 block">Full name</label>
          <input
            type="text"
            placeholder="Vivek Saka"
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              className="w-full border border-input rounded-lg px-3 py-2.5 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Confirm password</label>
          <input
            type="password"
            placeholder="Repeat your password"
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-vault-600 hover:bg-vault-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Create vault
        </button>
      </form>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        By creating an account, you agree that content is encrypted in your browser.
        We cannot recover your data if you lose your password.
      </p>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-vault-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
