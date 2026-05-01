import { createHash, timingSafeEqual } from "crypto";

export function createSessionToken() {
  const password = process.env.APP_PASSWORD;

  if (!password) {
    return "";
  }

  return createHash("sha256").update(`cristy-recipes:${password}`).digest("hex");
}

export function isValidPassword(password: string) {
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    return false;
  }

  const provided = Buffer.from(password);
  const expected = Buffer.from(appPassword);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function isAuthorized(request: Request) {
  const expectedToken = createSessionToken();
  const providedToken = request.headers.get("x-cristy-session") ?? "";

  if (!expectedToken || !providedToken || expectedToken.length !== providedToken.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(providedToken), Buffer.from(expectedToken));
}
