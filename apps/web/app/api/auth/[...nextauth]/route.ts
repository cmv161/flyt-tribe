import { GET as authGET, POST as authPOST } from "@/auth.node";
import { runWithRequestContext } from "@/lib/request-context";

export const runtime = "nodejs";

const withRequestContext =
  <TRequest extends Request>(handler: (request: TRequest) => Promise<Response>) =>
  (request: TRequest) =>
    runWithRequestContext(request, async (requestContext) => {
      const response = await handler(request);
      response.headers.set("x-request-id", requestContext.requestId);
      response.headers.set("x-correlation-id", requestContext.correlationId);
      return response;
    });

export const GET = withRequestContext(authGET);
export const POST = withRequestContext(authPOST);
