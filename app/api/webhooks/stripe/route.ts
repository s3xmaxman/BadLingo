import db from "@/db/drizzle";
import { userSubscriptions } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";


// Stripe Webhookのリクエストを処理
export async function POST(req: Request) {
    // Stripe Webhookのシグネチャーを取得
    const signature = headers().get("Stripe-Signature") as string;

    // リクエストボディを取得
    const body = await req.text();

    // Stripe Eventオブジェクトを初期化
    let event: Stripe.Event;

    try {
        // Stripe Webhookのイベントを検証
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (error: any) {
        // 検証に失敗した場合、エラーメッセージを返す
        return new NextResponse(`Webhook error:${error.message}`, { status: 400 });
    }

    // Stripe Checkoutセッションを取得
    const session = event.data.object as Stripe.Checkout.Session; 

    // Checkoutセッションが完了したイベントの場合
    if(event.type === "checkout.session.completed") {
        // Stripeサブスクリプションを取得
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // ユーザーIDが取得できない場合、エラーメッセージを返す
        if(!session?.metadata?.userId) {
            return new NextResponse("ユーザー情報の取得に失敗しました", { status: 400 });
        }

        // ユーザーのサブスクリプション情報をデータベースに保存
        await db.insert(userSubscriptions).values({
            userId: session.metadata.userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date( subscription.current_period_end * 1000),
        });
    }

    // 請求書の支払い成功イベントの場合
    if (event.type === "invoice.payment_succeeded") {
        // Stripeサブスクリプションを取得
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // ユーザーのサブスクリプション情報をデータベースに更新
        await db.update(userSubscriptions).set({
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        })
        .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
    }

    // 成功レスポンスを返す
    return new NextResponse(null, { status: 200 });
}