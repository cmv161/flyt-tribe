import { NextResponse } from "next/server";

import { authUnsafe } from "@/auth";
import { getSignInPath } from "@/auth/routes";

const proxy = authUnsafe((request) => {
  if (request.auth?.user?.id) {
    return NextResponse.next();
  }

  const signInUrl = new URL(getSignInPath(), request.nextUrl.origin);
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  signInUrl.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(signInUrl);
});

export default proxy;

export const config = {
  matcher: ["/dashboard/:path*"],
};
