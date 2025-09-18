-- Create coin links system
DO $$
BEGIN
    -- Create extension if it doesn't exist
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create coin_links table
    CREATE TABLE IF NOT EXISTS public.coin_links (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        coins INTEGER NOT NULL DEFAULT 0,
        max_uses INTEGER NOT NULL DEFAULT 1,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_by UUID REFERENCES auth.users(id)
    );

    -- Create coin_link_uses table
    CREATE TABLE IF NOT EXISTS public.coin_link_uses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        link_id UUID NOT NULL REFERENCES public.coin_links(id),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(link_id, user_id)
    );

    -- Create process_coin_link function
    CREATE OR REPLACE FUNCTION public.process_coin_link(
        p_code TEXT,
        p_user_id UUID
    ) RETURNS JSONB AS $$
    DECLARE
        v_link_id UUID;
        v_coins INTEGER;
        v_max_uses INTEGER;
        v_uses INTEGER;
        v_current_balance INTEGER;
    BEGIN
        -- Get the coin link
        SELECT id, coins, max_uses
        INTO v_link_id, v_coins, v_max_uses
        FROM public.coin_links
        WHERE code = p_code AND active = true;

        -- Check if link exists
        IF v_link_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Link not found or inactive'
            );
        END IF;

        -- Check if user has already used this link
        SELECT COUNT(*)
        INTO v_uses
        FROM public.coin_link_uses
        WHERE link_id = v_link_id AND user_id = p_user_id;

        -- Check if user has reached max uses
        IF v_uses >= v_max_uses THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'You have already used this link the maximum number of times'
            );
        END IF;

        -- Record the use
        INSERT INTO public.coin_link_uses (link_id, user_id)
        VALUES (v_link_id, p_user_id);

        -- Get current balance
        SELECT balance INTO v_current_balance
        FROM public.user_coins
        WHERE user_id = p_user_id;

        -- If user doesn't have a balance record, set to 0
        IF v_current_balance IS NULL THEN
            v_current_balance := 0;
        END IF;

        -- Update user's coin balance
        INSERT INTO public.user_coins (user_id, balance)
        VALUES (p_user_id, v_coins)
        ON CONFLICT (user_id)
        DO UPDATE SET balance = user_coins.balance + v_coins;

        -- Return success
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Coins awarded successfully',
            'coins_awarded', v_coins
        );
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Error processing coin link: ' || SQLERRM
            );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Set up RLS policies
    -- Enable RLS on coin_links
    ALTER TABLE public.coin_links ENABLE ROW LEVEL SECURITY;

    -- Create policies for coin_links
    CREATE POLICY "Allow users to view active coin links"
        ON public.coin_links FOR SELECT
        USING (active = true);

    CREATE POLICY "Allow admins to manage coin links"
        ON public.coin_links FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
            )
        );

    -- Enable RLS on coin_link_uses
    ALTER TABLE public.coin_link_uses ENABLE ROW LEVEL SECURITY;

    -- Create policies for coin_link_uses
    CREATE POLICY "Allow users to view their own uses"
        ON public.coin_link_uses FOR SELECT
        USING (user_id = auth.uid());

    CREATE POLICY "Allow users to insert their own uses"
        ON public.coin_link_uses FOR INSERT
        WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Allow admins to manage coin link uses"
        ON public.coin_link_uses FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
            )
        );
END $$;
