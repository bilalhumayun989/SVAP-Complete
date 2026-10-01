-- Adds the exact public.orders.id to notifications generated for order events.
-- Safe to run without changing any triggers or constraints.

CREATE OR REPLACE FUNCTION public.handle_order_placed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  buyer_username text;
  participant_order_count integer;
BEGIN
  SELECT username INTO buyer_username
  FROM public.profiles
  WHERE id = NEW.from_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, route)
  VALUES (
    NEW.to_user_id,
    'order_update',
    'Order placed for your SVAP',
    '@' || COALESCE(buyer_username, 'A user') || ' has placed an order. Prepare your item for shipping. Order ID: ' || NEW.id::text,
    '/orders'
  );

  IF NEW.swap_request_id IS NOT NULL THEN
    SELECT count(DISTINCT o.from_user_id)
      INTO participant_order_count
    FROM public.orders o
    JOIN public.swap_requests sr ON sr.id = o.swap_request_id
    WHERE o.swap_request_id = NEW.swap_request_id
      AND o.from_user_id IN (sr.from_user_id, sr.to_user_id);

    IF participant_order_count >= 2 THEN
      UPDATE public.swap_requests
      SET status = 'completed'
      WHERE id = NEW.swap_request_id
        AND status IN ('accepted', 'completed');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_title text;
  v_body text;
  v_partner_user_id uuid;
  v_partner_order_status text;
  v_partner_has_order boolean := false;
  v_order_ref text := 'Order ID: ' || NEW.id::text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'payment_verification' THEN
      v_title := 'Payment Verification';
      v_body := 'We''re verifying your payment. You''ll be notified once confirmed.';
    WHEN 'product_verification' THEN
      v_title := 'Product Verification';
      v_body := 'Payment confirmed! Please prepare your item for dispatch.';
    WHEN 'item_verification' THEN
      v_title := 'Item Verification';
      v_body := 'Your payment is confirmed. Please prepare your item for dispatch.';
    WHEN 'shipped' THEN
      v_title := 'Order Shipped';
      v_body := 'Your SVAP order is on its way! Check your orders tab for tracking details.';
    WHEN 'delivered' THEN
      v_title := 'Order Delivered';
      v_body := 'Your SVAP order has been delivered. Enjoy your SVAP!';
    WHEN 'cancelled' THEN
      v_title := 'Order Cancelled';
      IF OLD.status IN ('product_verification', 'item_verification', 'shipped', 'delivered') THEN
        v_body := 'Your payment was verified before this SVAP was cancelled. Our support team will contact you to arrange your refund.';
      ELSE
        v_body := 'Your order has been cancelled.';
      END IF;
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, body, route)
  VALUES (NEW.from_user_id, 'order_status', v_title, v_body || ' ' || v_order_ref, '/profile');

  -- Notify only the partner whose own payment is still awaiting verification.
  IF NEW.status IN ('product_verification', 'item_verification')
    AND COALESCE(OLD.status, '') NOT IN ('product_verification', 'item_verification')
    AND NEW.swap_request_id IS NOT NULL THEN
    SELECT CASE
        WHEN sr.from_user_id = NEW.from_user_id THEN sr.to_user_id
        ELSE sr.from_user_id
      END
      INTO v_partner_user_id
    FROM public.swap_requests sr
    WHERE sr.id = NEW.swap_request_id;

    SELECT o.status
      INTO v_partner_order_status
    FROM public.orders o
    WHERE o.swap_request_id = NEW.swap_request_id
      AND o.from_user_id = v_partner_user_id
    ORDER BY o.created_at DESC
    LIMIT 1;
    v_partner_has_order := FOUND;

    IF v_partner_user_id IS NOT NULL
      AND (NOT v_partner_has_order OR v_partner_order_status IN ('pending', 'payment_verification')) THEN
      INSERT INTO public.notifications (user_id, type, title, body, route)
      VALUES (
        v_partner_user_id,
        'order_status',
        'SVAP Partner Payment Verified',
        'Your SVAP partner''s payment is verified by us. Now the item will be inspected. ' || v_order_ref,
        '/orders'
      );
    END IF;
  END IF;

  IF NEW.status = 'cancelled' AND NEW.swap_request_id IS NOT NULL THEN
    SELECT CASE
        WHEN sr.from_user_id = NEW.from_user_id THEN sr.to_user_id
        ELSE sr.from_user_id
      END
      INTO v_partner_user_id
    FROM public.swap_requests sr
    WHERE sr.id = NEW.swap_request_id;

    SELECT o.status
      INTO v_partner_order_status
    FROM public.orders o
    WHERE o.swap_request_id = NEW.swap_request_id
      AND o.from_user_id = v_partner_user_id
    ORDER BY o.created_at DESC
    LIMIT 1;

    IF FOUND AND v_partner_user_id IS NOT NULL THEN
      IF v_partner_order_status IN ('product_verification', 'item_verification', 'shipped', 'delivered') THEN
        INSERT INTO public.notifications (user_id, type, title, body, route)
        VALUES (
          v_partner_user_id,
          'order_status',
          'SVAP Partner Order Cancelled',
          'Your SVAP partner''s order was cancelled. Our support team will contact you to arrange your refund. ' || v_order_ref,
          '/orders'
        );
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, route)
        VALUES (
          v_partner_user_id,
          'order_status',
          'SVAP Partner Order Cancelled',
          'Your SVAP partner''s order was cancelled.' || v_order_ref,
          '/orders'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.expire_stale_swaps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  r record;
  checkout_count integer;
  checkout_user uuid;
  checkout_order_id uuid;
  no_checkout_user uuid;
  changed_id uuid;
  expired_count integer := 0;
  timeout_note constant text :=
    'Auto-cancelled: partner did not checkout in time. Our support team will contact you to arrange your refund.';
BEGIN
  FOR r IN
    SELECT sr.*
    FROM public.swap_requests sr
    WHERE sr.expires_at <= now()
      AND sr.status IN ('pending', 'accepted', 'completed')
      AND (
        (sr.status = 'pending' AND NOT EXISTS (
          SELECT 1 FROM public.orders o WHERE o.swap_request_id = sr.id
        ))
        OR (sr.status = 'accepted' AND (
          SELECT count(DISTINCT o.from_user_id) FROM public.orders o
          WHERE o.swap_request_id = sr.id
            AND o.from_user_id IN (sr.from_user_id, sr.to_user_id)
        ) < 2)
        OR (sr.status = 'completed' AND (
          SELECT count(DISTINCT o.from_user_id) FROM public.orders o
          WHERE o.swap_request_id = sr.id
            AND o.from_user_id IN (sr.from_user_id, sr.to_user_id)
        ) < 2)
      )
    ORDER BY sr.expires_at
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT count(DISTINCT o.from_user_id)
      INTO checkout_count
    FROM public.orders o
    WHERE o.swap_request_id = r.id
      AND o.from_user_id IN (r.from_user_id, r.to_user_id);

    SELECT o.from_user_id, o.id
      INTO checkout_user, checkout_order_id
    FROM public.orders o
    WHERE o.swap_request_id = r.id
      AND o.from_user_id IN (r.from_user_id, r.to_user_id)
    ORDER BY o.created_at
    LIMIT 1;

    UPDATE public.swap_requests
    SET status = 'cancelled'
    WHERE id = r.id
      AND status = r.status
    RETURNING id INTO changed_id;

    IF changed_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.orders
    SET status = 'cancelled',
        admin_notes = concat_ws(E'\n', NULLIF(admin_notes, ''), timeout_note)
    WHERE swap_request_id = r.id
      AND from_user_id IN (r.from_user_id, r.to_user_id)
      AND status <> 'cancelled';

    UPDATE public.products
    SET status = 'active'
    WHERE id IN (r.offered_product_id, r.requested_product_id)
      AND status <> 'active';

    IF r.status = 'completed' AND checkout_count < 2 THEN
      UPDATE public.profiles
      SET total_swaps = GREATEST(0, total_swaps - 1)
      WHERE id IN (r.from_user_id, r.to_user_id);
    END IF;

    IF checkout_count = 0 THEN
      INSERT INTO public.notifications (user_id, type, title, body, route, is_read)
      VALUES
        (r.from_user_id, 'swap_timeout', 'SVAP Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the SVAP has been cancelled.',
         '/requests', false),
        (r.to_user_id, 'swap_timeout', 'SVAP Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the SVAP has been cancelled.',
         '/requests', false);
    ELSE
      no_checkout_user :=
        CASE WHEN checkout_user = r.from_user_id THEN r.to_user_id ELSE r.from_user_id END;

      INSERT INTO public.notifications (user_id, type, title, body, route, is_read)
      VALUES
        (no_checkout_user, 'swap_timeout', 'SVAP Cancelled - Timeout',
         'Timeout: You did not complete checkout within 48 hours, so the SVAP has been cancelled. Order ID: ' || checkout_order_id::text,
         '/requests', false),
        (checkout_user, 'swap_timeout', 'SVAP Cancelled - Timeout',
         'Your SVAP partner did not complete checkout within 48 hours, so the SVAP has been cancelled. Our support team will contact you to arrange your refund. Order ID: ' || checkout_order_id::text,
         '/requests', false);
    END IF;

    expired_count := expired_count + 1;
  END LOOP;

  RETURN expired_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.expire_stale_swaps() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_swaps() TO service_role;
-- Clean up older notification wording. This does not modify notification types
-- or attempt to infer IDs for historical orders.
UPDATE public.notifications
SET title = CASE WHEN title ILIKE '%swap%' THEN regexp_replace(title, '\mswap\M', 'SVAP', 'gi') ELSE title END,
    body = CASE WHEN body ILIKE '%swap%' THEN regexp_replace(body, '\mswap\M', 'SVAP', 'gi') ELSE body END
WHERE title ILIKE '%swap%'
   OR body ILIKE '%swap%';