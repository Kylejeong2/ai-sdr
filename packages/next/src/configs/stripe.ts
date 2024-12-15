import type { Stripe as StripeJS } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

let stripePromise: Promise<StripeJS | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);
  }
  return stripePromise;
};

export const createStripeCustomer = async (email: string, name: string, userId: string) => {
  const customer = await stripe.customers.create({ email, name, metadata: {
    userId
  }});
  return customer;
};

export const createPortalSession = async (customerId: string, returnUrl: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
};


export const createSubscription = async (customerId: string, priceId: string) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
    expand: ['pending_setup_intent'],
  });
  return subscription;
};

export const retrieveInvoice = async (invoiceId: string) => {
  const invoice = await stripe.invoices.retrieve(invoiceId);
  return invoice;
};

export const retrieveInvoiceItem = async (invoiceItemId: string) => {
  const invoiceItem = await stripe.invoiceItems.retrieve(invoiceItemId);
  return invoiceItem;
};


export const createUsageRecord = async (subscriptionItemId: string, quantity: number) => {
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: 'now',
      action: 'increment',
    }
  );
  return usageRecord;
};

export const retrieveSubscriptionItem = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items'],
  });
  return subscription.items.data[0];
};