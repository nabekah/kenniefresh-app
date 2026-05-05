// =============================================================
// Kenniefresh.biz — Shop Backend Router
// Handles: Hubtel MoMo payment initiation + status check
//          Arkesel SMS order confirmation
// =============================================================

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import axios from "axios";

// ─── Hubtel MoMo ─────────────────────────────────────────────

const HubtelInitSchema = z.object({
  amount: z.number().positive(),
  phoneNumber: z.string().min(10),
  description: z.string(),
  clientReference: z.string(), // order number
  network: z.enum(["MTN", "Telecel"]),
});

const HubtelStatusSchema = z.object({
  clientReference: z.string(),
});

// ─── Arkesel SMS ─────────────────────────────────────────────

const SMSSchema = z.object({
  to: z.string().min(10),
  customerName: z.string(),
  orderNumber: z.string(),
  total: z.string(),
  paymentMethod: z.string(),
  items: z.array(z.object({ name: z.string(), qty: z.number() })),
});

// ─── Delivery Fee ─────────────────────────────────────────────

const DELIVERY_FEES: Record<string, number> = {
  "Accra": 10,
  "Tema": 12,
  "Kumasi": 25,
  "Takoradi": 30,
  "Tamale": 45,
  "Cape Coast": 28,
  "Koforidua": 20,
  "Ho": 35,
  "Sunyani": 40,
  "Wa": 55,
  "Bolgatanga": 55,
  "Techiman": 38,
  "Other": 50,
};

export const shopRouter = router({

  // ── Get delivery fee for a city ──────────────────────────
  getDeliveryFee: publicProcedure
    .input(z.object({ city: z.string() }))
    .query(({ input }) => {
      const normalised = input.city.trim();
      // Try exact match first, then partial match, then fallback
      const exact = DELIVERY_FEES[normalised];
      if (exact !== undefined) return { fee: exact, city: normalised };

      const partial = Object.keys(DELIVERY_FEES).find(k =>
        normalised.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(normalised.toLowerCase())
      );
      if (partial) return { fee: DELIVERY_FEES[partial]!, city: partial };

      return { fee: DELIVERY_FEES["Other"]!, city: "Other" };
    }),

  // ── List all cities with fees ────────────────────────────
  getDeliveryFees: publicProcedure.query(() => {
    return Object.entries(DELIVERY_FEES).map(([city, fee]) => ({ city, fee }));
  }),

  // ── Initiate Hubtel MoMo payment ─────────────────────────
  initiateMoMo: publicProcedure
    .input(HubtelInitSchema)
    .mutation(async ({ input }) => {
      const clientId = process.env.HUBTEL_CLIENT_ID;
      const clientSecret = process.env.HUBTEL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        // Demo mode: return a simulated pending response
        return {
          success: true,
          demo: true,
          message: "Demo mode: Hubtel credentials not configured. Payment simulated.",
          data: {
            status: "pending",
            clientReference: input.clientReference,
            transactionId: `DEMO-${Date.now()}`,
          },
        };
      }

      try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const response = await axios.post(
          "https://api-txnghana.hubtel.com/v1/merchantaccount/merchants/receive-money",
          {
            Amount: input.amount,
            Title: "Kenniefresh.biz Order",
            Description: input.description,
            ClientReference: input.clientReference,
            CallbackUrl: `${process.env.APP_BASE_URL || ""}/api/hubtel/callback`,
            ReturnUrl: `${process.env.APP_BASE_URL || ""}/shop`,
            CancellationUrl: `${process.env.APP_BASE_URL || ""}/shop/cart`,
            Logo: "",
            PrimaryColor: "#f59e0b",
            SecondaryColor: "#1f2937",
          },
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );

        return {
          success: true,
          demo: false,
          message: "Payment initiated",
          data: response.data,
        };
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "Payment initiation failed";
        return {
          success: false,
          demo: false,
          message,
          data: null,
        };
      }
    }),

  // ── Check Hubtel payment status ──────────────────────────
  checkMoMoStatus: publicProcedure
    .input(HubtelStatusSchema)
    .query(async ({ input }) => {
      const clientId = process.env.HUBTEL_CLIENT_ID;
      const clientSecret = process.env.HUBTEL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return { success: true, demo: true, status: "pending", message: "Demo mode" };
      }

      try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const response = await axios.get(
          `https://api-txnghana.hubtel.com/v1/merchantaccount/merchants/transaction/status?clientReference=${input.clientReference}`,
          {
            headers: { Authorization: `Basic ${credentials}` },
            timeout: 10000,
          }
        );
        return { success: true, demo: false, status: response.data?.status, data: response.data };
      } catch (err: any) {
        return { success: false, demo: false, status: "unknown", message: err?.message };
      }
    }),

  // ── Send Arkesel SMS confirmation ────────────────────────
  sendOrderSMS: publicProcedure
    .input(SMSSchema)
    .mutation(async ({ input }) => {
      const apiKey = process.env.ARKESEL_API_KEY;
      const senderId = process.env.ARKESEL_SENDER_ID || "Kenniefresh";

      const itemList = input.items
        .slice(0, 3)
        .map(i => `${i.qty}x ${i.name}`)
        .join(", ");
      const more = input.items.length > 3 ? ` +${input.items.length - 3} more` : "";

      const message =
        `Hi ${input.customerName}! Your Kenniefresh.biz order ${input.orderNumber} has been received.\n` +
        `Items: ${itemList}${more}\n` +
        `Total: GHS ${input.total} via ${input.paymentMethod}.\n` +
        `We'll notify you when it ships. Thank you!`;

      if (!apiKey) {
        // Demo mode
        console.log(`[SMS Demo] To: ${input.to}\n${message}`);
        return {
          success: true,
          demo: true,
          message: "Demo mode: Arkesel API key not configured. SMS logged to console.",
        };
      }

      try {
        const response = await axios.post(
          "https://sms.arkesel.com/sms/api",
          null,
          {
            params: {
              action: "send-sms",
              api_key: apiKey,
              to: input.to,
              from: senderId,
              sms: message,
            },
            timeout: 10000,
          }
        );
        const ok = response.data?.code === "ok" || response.status === 200;
        return {
          success: ok,
          demo: false,
          message: ok ? "SMS sent successfully" : (response.data?.message || "SMS failed"),
        };
      } catch (err: any) {
        return {
          success: false,
          demo: false,
          message: err?.response?.data?.message || err?.message || "SMS send failed",
        };
      }
    }),
});
