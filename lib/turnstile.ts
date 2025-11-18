/**
 * Cloudflare Turnstile verification utilities
 * 
 * Documentation: https://developers.cloudflare.com/turnstile/
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

/**
 * Verify a Turnstile token with Cloudflare's API
 * 
 * @param token - The token to verify (from the client)
 * @param remoteip - Optional IP address of the user (for additional security)
 * @returns Promise resolving to the verification result
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<TurnstileVerifyResponse> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY is not configured");
    return {
      success: false,
      "error-codes": ["missing-secret"],
    };
  }

  if (!token || token.trim().length === 0) {
    return {
      success: false,
      "error-codes": ["missing-input-response"],
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteip) {
      formData.append("remoteip", remoteip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error("Turnstile verification request failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return {
        success: false,
        "error-codes": ["http-error"],
      };
    }

    const result = (await response.json()) as TurnstileVerifyResponse;
    return result;
  } catch (error) {
    console.error("Turnstile verification error", error);
    return {
      success: false,
      "error-codes": ["network-error"],
    };
  }
}

/**
 * Extract IP address from request headers
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP)
 */
export function getClientIp(request: Request): string | undefined {
  // Check X-Forwarded-For header (first IP in the chain)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  // Check X-Real-IP header
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback: try to get from connection (may not be available in all environments)
  return undefined;
}

