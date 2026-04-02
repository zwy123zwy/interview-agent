import { handleLoginRequest } from "@/server/interfaces/auth/login-route-handler";

export async function POST(request: Request) {
  return handleLoginRequest(request);
}
