/**
 * Parses cookies from a Request object's 'Cookie' header.
 * @param request The request object.
 * @returns A record of cookie names to values.
 */
export function parseCookies(request: Request): Record<string, string> {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return {};

    return cookieHeader
        .split(";")
        .reduce((acc, cookie) => {
            const parts = cookie.trim().split("=");
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join("=").trim();
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, string>);
}
