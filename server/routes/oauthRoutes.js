/**
 * Google OAuth 2.0 — alongside existing email/password auth.
 *
 * Flow:
 *   1. Client visits GET /api/auth/google → redirects to Google consent screen
 *   2. Google redirects to GET /api/auth/google/callback
 *   3. Server creates/finds user → issues JWT + refresh token → redirects to client
 *
 * Required env vars (optional — routes are no-ops if absent):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 */

import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

const router = express.Router();

const OAUTH_ENABLED =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (OAUTH_ENABLED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  `${process.env.SERVER_ORIGIN || "http://localhost:8000"}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("No email returned from Google"));

          let user = await User.findOne({ email });

          if (!user) {
            // Register new user via Google — no password required
            user = await User.create({
              name:          profile.displayName || email.split("@")[0],
              email,
              password:      jwt.sign({ r: Math.random() }, env.JWT_SECRET), // unusable random hash
              emailVerified: true,
              avatarUrl:     profile.photos?.[0]?.value || null,
            });
          } else if (!user.emailVerified) {
            // Mark existing user verified since Google confirmed the email
            user.emailVerified = true;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  router.use(passport.initialize());

  /**
   * @openapi
   * /auth/google:
   *   get:
   *     tags: [Auth]
   *     summary: Initiate Google OAuth login
   *     description: Redirects to Google consent screen. Only available when GOOGLE_CLIENT_ID/SECRET are set.
   *     responses:
   *       302:
   *         description: Redirect to Google
   */
  router.get(
    "/google",
    passport.authenticate("google", { session: false, scope: ["profile", "email"] })
  );

  /**
   * @openapi
   * /auth/google/callback:
   *   get:
   *     tags: [Auth]
   *     summary: Google OAuth callback
   *     description: Google redirects here after login. Issues JWT and redirects to client.
   *     responses:
   *       302:
   *         description: Redirect to client with token in query param
   */
  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: `${env.CLIENT_ORIGIN}/login?error=oauth` }),
    async (req, res) => {
      try {
        const user = req.user;

        const accessToken  = jwt.sign({ id: user._id, name: user.name }, env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: "7d" });

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure:   env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge:   7 * 24 * 60 * 60 * 1000,
        });

        // Redirect to client — token in query param (client reads it once then discards)
        res.redirect(`${env.CLIENT_ORIGIN}/oauth-callback?token=${accessToken}`);
      } catch {
        res.redirect(`${env.CLIENT_ORIGIN}/login?error=oauth`);
      }
    }
  );
} else {
  // OAuth not configured — return informative 501
  router.get("/google",          (req, res) => res.status(501).json({ error: "Google OAuth is not configured on this server." }));
  router.get("/google/callback", (req, res) => res.status(501).json({ error: "Google OAuth is not configured on this server." }));
}

export default router;
