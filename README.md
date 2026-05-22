# 🛒 Papamart

Hey there! 👋 Welcome to **Papamart** — a full-stack grocery storefront built live on YouTube as part of a step-by-step coding tutorial.

🎥 **[Watch the full build on YouTube here](https://www.youtube.com/live/o9_TXWWjF3Y)**

This is a real scalable build that pulls together a modern stack:

- **[Next.js 16](https://nextjs.org)** (App Router, React 19, Server Components & Server Actions)
- **[Convex](https://convex.dev)** as the realtime backend & database
- **[Clerk](https://go.clerk.com/o9wDSN3)** for authentication, user management, organizations & billing
- **[Stripe](https://stripe.com)** for payments and checkout (via `@convex-dev/stripe`)
- **[Tailwind CSS v4](https://tailwindcss.com)** + **[shadcn/ui](https://ui.shadcn.com)** for a beautiful, modern UI
- **[Zustand](https://github.com/pmndrs/zustand)** for client-side cart state

### What you'll find inside

- 🏪 A public storefront with product browsing, search, categories, and product detail pages
- 🛍️ A persistent shopping cart and favourites
- 📦 Mandatory address onboarding & full checkout flow with stock reservation
- 💳 Stripe Checkout integration with webhook-driven order updates
- ⭐ Membership tier with free shipping via Clerk Billing's `<PricingTable />`
- 🛠️ A complete admin panel — product CRUD, image uploads, categories, orders, and customer management

---

## ⚠️ Before You Start — Sign Up for Clerk

This build uses **Clerk** for authentication, user management, **and** billing (membership subscriptions). Before you can run the project locally, you'll need a free Clerk account.

### 👉 [Sign up for Clerk here](https://go.clerk.com/o9wDSN3) 👈

Using **[this link](https://go.clerk.com/o9wDSN3)** to sign up genuinely means the world to me — it directly supports the YouTube channel and helps me keep making free, in-depth tutorials like this one. **Thank you so much! 🙏❤️**

Once you've signed up:

1. Create a new application in the [Clerk Dashboard](https://go.clerk.com/o9wDSN3)
2. Grab your API keys and drop them into `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

3. Configure your sign-in/sign-up options however you like (email, Google, GitHub, etc.) — Clerk's dashboard makes this a one-click setup.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 💛 Support the Channel

If this build has helped you level up, the **biggest** thing you can do to say thanks is:

- ⭐ **[Sign up for Clerk via my referral link](https://go.clerk.com/o9wDSN3)** — it's free and it directly supports the channel
- 🎥 **[Watch the full build on YouTube](https://www.youtube.com/live/o9_TXWWjF3Y)** and follow along
- 👍 Like the video and subscribe on YouTube
- 💬 Drop a comment letting me know what you'd like to see next

**Thank you so much for being here — let's build! 🚀**
