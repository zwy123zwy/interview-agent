"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function normalizeUserId(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export default function RegisterPage() {
  const router = useRouter();
  const [userIdInput, setUserIdInput] = useState("");
  const [password, setPassword] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const userId = useMemo(() => normalizeUserId(userIdInput), [userIdInput]);
  const disabled =
    userId.length < 3 || password.trim().length < 6 || registrationCode.trim().length === 0 || loading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          password,
          registrationCode,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage("用户已存在，请直接登录。");
          return;
        }

        if (response.status === 403) {
          setErrorMessage("注册码无效。");
          return;
        }

        setErrorMessage("注册失败，请检查输入后重试。");
        return;
      }

      router.replace("/login");
    } catch {
      setErrorMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Interview Agent</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">注册</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">需要输入注册码才能创建账号。</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block text-sm text-slate-700" htmlFor="user-id">
            用户标识
          </label>
          <input
            id="user-id"
            value={userIdInput}
            onChange={(event) => setUserIdInput(event.target.value)}
            placeholder="例如：zhangwenye"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
          />

          <label className="mt-2 block text-sm text-slate-700" htmlFor="password">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 6 位"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
          />

          <label className="mt-2 block text-sm text-slate-700" htmlFor="registration-code">
            注册码
          </label>
          <input
            id="registration-code"
            value={registrationCode}
            onChange={(event) => setRegistrationCode(event.target.value)}
            placeholder="由管理员提供"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
          />

          <p className="text-xs text-slate-500">最终标识：{userId || "-"}</p>
          {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "注册中..." : "注册"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            已有账号？去登录
          </button>
        </form>
      </section>
    </main>
  );
}

