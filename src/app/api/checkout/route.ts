import { NextResponse } from "next/server";

type PackageId = "coins_100" | "coins_500" | "coins_2000";

const PACKAGES: Record<PackageId, { coins: number; unitAmount: number; label: string }> = {
  coins_100: { coins: 100, unitAmount: 99, label: "100 coins" },
  coins_500: { coins: 500, unitAmount: 399, label: "500 coins" },
  coins_2000: { coins: 2000, unitAmount: 999, label: "2000 coins" },
};

export async function POST(request: Request) {
  const body = (await request.json()) as { packageId?: PackageId };
  const packageId = body.packageId;
  if (!packageId || !PACKAGES[packageId]) {
    return NextResponse.json({ error: "Invalid package selected." }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ comingSoon: true, error: "Stripe is not configured yet." }, { status: 200 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey);
    const selected = PACKAGES[packageId];
    const origin = request.headers.get("origin") ?? "";
    if (!origin) {
      return NextResponse.json({ error: "Could not resolve request origin." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/?shop=success`,
      cancel_url: `${origin}/?shop=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: `Trivia Coins - ${selected.label}`,
              description: `Receive ${selected.coins} in-game coins`,
            },
            unit_amount: selected.unitAmount,
          },
        },
      ],
      metadata: {
        packageId,
        coins: String(selected.coins),
      },
    });

    return NextResponse.json({ url: session.url, comingSoon: false });
  } catch {
    return NextResponse.json({ error: "Could not initialize checkout." }, { status: 500 });
  }
}
