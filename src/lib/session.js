import { getIronSession } from 'iron-session';

const sessionOptions = {
    password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
    cookieName: 'shop_license_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 30, // 30 minutes
    },
};

export async function getSessionFromCookies(cookies) {
    return getIronSession(cookies, sessionOptions);
}

export { sessionOptions };
