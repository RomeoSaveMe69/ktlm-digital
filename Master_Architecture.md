# Kone The Lay Myar Digital (ကုန်သည်လေးများ) - Master Architecture

## Vision: The "Alibaba of Myanmar"
This project is the digital branch (`konethelaymyardigital.com`) of the "Kone The Lay Myar" ecosystem, focusing on P2P Digital Goods and Game Top-ups. (A future branch will handle physical goods).

## 1. Project Overview & Tech Stack
- **Frontend & Backend:** Next.js (React) with TypeScript (App Router).
- **Brand Name:** Kone The Lay Myar Digital (Abbreviation: KTLM Digital).
- **Styling:** Tailwind CSS (Dark Theme / Gamer Vibe).
- **Database, Auth & Storage:** Supabase (PostgreSQL).
- **Real-time Features:** Supabase Realtime (for Chat and Order updates).
- **Core Platform:** Telegram Mini App (TMA) / Web App.

## 2. Core Strategy: Telegram Mini App & Bot Integration (CRITICAL)
Since both Buyers and Sellers primarily use mobile phones, the Next.js frontend MUST be optimized to run flawlessly as a **Telegram Mini App**. 
- **Telegram Bot:** Acts as the "Heart" of the system. It handles all instant notifications (New Order, Escrow Held, Chat Messages, Slip Approvals).
- **Mini App:** Users will open the Next.js marketplace directly inside Telegram via the Bot's "Launch App" button. 
- **Authentication:** Users will link their Telegram accounts (`telegram_user_id` / `telegram_chat_id`) for seamless login and notifications.

## 3. Phase 1: Manual P2P Topup System (Escrow + Admin Control)
- **Seller KYC:** Sellers must register and submit KYC before listing products.
- **Escrow Wallet:** Buyers deposit MMK (via KPay/WavePay manual slip upload). Admin approves the slip before funds are credited.
- **Platform Fee:** The platform takes a 0.5% fee on successful trades.
- **Order Flow:** Buyer orders -> Funds held in escrow -> Telegram Bot notifies Seller -> Seller tops up manually -> Seller uploads proof -> Buyer confirms -> Escrow released.
- **Admin Chat Control:** Real-time Chat between Buyer and Seller. Admins MUST have 100% control to read all chat logs (No strict E2E encryption that blocks Admin) for dispute resolution and to prevent platform leakage.
- **Disputes:** If an order has an issue, it goes into a "Disputed" state for Admin resolution.

## 4. Phase 2: Future Scalability (API Provider System)
- The database is designed NOW to support automated API top-ups in the future.
- Sellers will be able to subscribe to API fulfillment (e.g., MooGold).
- **Internal Exchange:** Sellers will convert their MMK wallet balance into USDT within the platform (at a platform-defined rate) to fund their API usage.

---

## 5. PostgreSQL Database Schema (Supabase)

```sql
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM (
  'pending',      -- Order created, escrow not yet held
  'processing',  -- Escrow held, seller topping up
  'completed',   -- Buyer confirmed, escrow released
  'cancelled',   -- Cancelled before completion
  'disputed'     -- Under admin resolution
);
CREATE TYPE fulfillment_type AS ENUM ('manual', 'api');
CREATE TYPE transaction_type AS ENUM (
  'deposit',         -- Buyer deposits to wallet (slip upload)
  'escrow_hold',     -- Deduct from buyer wallet to escrow
  'escrow_release',  -- Release to seller wallet
  'fee',             -- Platform fee deduction
  'refund'           -- Refund to buyer
);
CREATE TYPE transaction_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'buyer',
  kyc_status kyc_status DEFAULT 'pending',
  telegram_chat_id TEXT, -- CRITICAL for Telegram Bot notifications
  telegram_username TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. WALLETS (MMK and USDT per user)
-- ============================================================
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('MMK', 'USDT')),
  balance NUMERIC(20, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  escrow_balance NUMERIC(20, 2) NOT NULL DEFAULT 0 CHECK (escrow_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  game_name TEXT NOT NULL,
  price_mmk NUMERIC(20, 2) NOT NULL CHECK (price_mmk > 0),
  fulfillment_type fulfillment_type NOT NULL DEFAULT 'manual',
  api_provider TEXT,
  api_product_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_seller_id ON public.products(seller_id);

-- ============================================================
-- 4. ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  player_id TEXT NOT NULL,
  amount_mmk NUMERIC(20, 2) NOT NULL CHECK (amount_mmk > 0),
  platform_fee_mmk NUMERIC(20, 2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  fulfillment_type fulfillment_type NOT NULL DEFAULT 'manual',
  api_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- ============================================================
-- 5. TRANSACTIONS (idempotency via unique reference_id/slip_id)
-- ============================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount NUMERIC(20, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('MMK', 'USDT')),
  reference_id TEXT NOT NULL,
  slip_image_url TEXT,
  status transaction_approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reference_id)
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_reference_id ON public.transactions(reference_id);

-- ============================================================
-- 6. CHAT ROOMS & MESSAGES (RLS: participants + Admin read-all)
-- ============================================================
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. PLATFORM EXCHANGE RATES (Phase 2 MMK ↔ USDT)
-- ============================================================
CREATE TABLE public.platform_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL CHECK (from_currency IN ('MMK', 'USDT')),
  to_currency TEXT NOT NULL CHECK (to_currency IN ('MMK', 'USDT')),
  rate NUMERIC(20, 6) NOT NULL CHECK (rate > 0),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_currency <> to_currency)
);

-- ============================================================
-- ROW LEVEL SECURITY (Chat: Admin bypass)
-- ============================================================
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "chat_rooms_select_participant_or_admin"
  ON public.chat_rooms FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "chat_rooms_insert_participant"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "chat_messages_select_participant_or_admin"
  ON public.chat_messages FOR SELECT
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.chat_rooms r WHERE r.id = chat_messages.room_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

CREATE POLICY "chat_messages_insert_participant"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.create_wallets_for_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, currency) VALUES (NEW.id, 'MMK');
  INSERT INTO public.wallets (user_id, currency) VALUES (NEW.id, 'USDT');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_create_wallets AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_wallets_for_new_user();