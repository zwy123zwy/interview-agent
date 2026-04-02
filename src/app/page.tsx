"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ChatPage } from "@/app/chat-page";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Probe the server — if the session cookie is absent/invalid the API
    // returns 401 and we redirect to login. No userId stored client-side.
    fetch("/api/chat/conversations")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
        } else {
          setReady(true);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!ready) {
    return <main className="min-h-screen bg-slate-50" />;
  }

  return (
    <ChatPage
      onLogout={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
      }}
    />
  );
}
