import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { registerRoutes } from "@convex-dev/stripe";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { components, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

registerRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
  events: {
    "checkout.session.completed": async (ctx, event) => {
      const session = event.data.object;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? undefined);
      await ctx.runMutation(internal.orders.markPaid, {
        stripeSessionId: session.id,
        paymentIntentId,
      });
    },
    "checkout.session.expired": async (ctx, event) => {
      const session = event.data.object;
      await ctx.runMutation(internal.orders.cancelExpired, {
        stripeSessionId: session.id,
      });
    },
  },
});

function buildName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | undefined {
  const trimmed = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

http.route({
  path: "/clerk/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret) {
      console.error("CLERK_WEBHOOK_SIGNING_SECRET is not set");
      return new Response("Server misconfigured", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const payload = await request.text();

    let event: WebhookEvent;
    try {
      const webhook = new Webhook(secret);
      event = webhook.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Clerk webhook verification failed", err);
      return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "user.created" || event.type === "user.updated") {
      const data = event.data;
      const primary =
        data.email_addresses.find(
          (e) => e.id === data.primary_email_address_id,
        ) ?? data.email_addresses[0];
      const email = primary?.email_address;
      if (!email) {
        console.warn(
          "Clerk webhook: user event with no usable email",
          data.id,
        );
        return new Response("OK", { status: 200 });
      }
      await ctx.runMutation(internal.users.syncFromClerk, {
        clerkUserId: data.id,
        email,
        name: buildName(data.first_name, data.last_name),
        imageUrl: data.image_url ?? undefined,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
