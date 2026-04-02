import { handleRegisterRequest } from "@/server/interfaces/auth/register-route-handler";

export async function POST(request: Request) {
  return handleRegisterRequest(request);
}
