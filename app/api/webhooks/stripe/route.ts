import db from "@/db/drizzle";
import { userSubscriptions } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";


// Stripe Webhookのリクエストを処理
export async function POST(req: Request) {

    const signature = headers().get("Stripe-Signature") as string;

    const body = await req.text();

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (error: any) {
        return new NextResponse(`Webhook error:${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session; 

    if(event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        if(!session?.metadata?.userId) {
            return new NextResponse("ユーザー情報の取得に失敗しました", { status: 400 });
        }

        await db.insert(userSubscriptions).values({
            userId: session.metadata.userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date( subscription.current_period_end * 1000,),
        });
    }

    if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
    
        await db.update(userSubscriptions).set({
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000,),
        })
        .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
    }

    return new NextResponse(null, { status: 200 });
}