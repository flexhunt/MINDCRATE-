import { createClient } from "@/lib/supabase/client"

/**
 * Initializes the shop system by creating necessary tables
 */
export async function initializeShopSystem() {
  const supabase = createClient()

  try {
    // Execute the SQL to create the shop tables
    const { error } = await supabase.rpc("initialize_shop_system")

    if (error) {
      console.error("Error initializing shop system:", error)

      // Fallback: Try to create tables directly
      try {
        // Create items table
        await supabase.query(`
          CREATE TABLE IF NOT EXISTS public.items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER NOT NULL CHECK (price > 0),
            image_url TEXT,
            stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)

        // Create orders table
        await supabase.query(`
          CREATE TABLE IF NOT EXISTS public.orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            item_id UUID NOT NULL,
            price_paid INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
            ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)

        // Create admin_users table
        await supabase.query(`
          CREATE TABLE IF NOT EXISTS public.admin_users (
            user_id UUID PRIMARY KEY,
            granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            granted_by UUID
          );
        `)

        // Make current user an admin
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user?.id) {
          await supabase
            .from("admin_users")
            .insert({
              user_id: session.user.id,
              granted_by: session.user.id,
            })
            .onConflict("user_id")
            .ignore()
        }

        return { success: true }
      } catch (fallbackError) {
        console.error("Fallback initialization failed:", fallbackError)
        return { success: false, error: fallbackError }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in initializeShopSystem:", error)
    return { success: false, error }
  }
}

/**
 * Creates a stored procedure to initialize the shop system
 */
export async function createInitializationProcedure() {
  const supabase = createClient()

  try {
    // Create a stored procedure to initialize the shop system
    const { error } = await supabase.query(`
      CREATE OR REPLACE FUNCTION initialize_shop_system()
      RETURNS JSONB AS $$
      DECLARE
        result JSONB;
        current_user_id UUID;
      BEGIN
        -- Create items table
        CREATE TABLE IF NOT EXISTS public.items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          price INTEGER NOT NULL CHECK (price > 0),
          image_url TEXT,
          stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create orders table
        CREATE TABLE IF NOT EXISTS public.orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          item_id UUID NOT NULL,
          price_paid INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
          ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create admin_users table
        CREATE TABLE IF NOT EXISTS public.admin_users (
          user_id UUID PRIMARY KEY,
          granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          granted_by UUID
        );
        
        -- Create is_admin function
        CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.admin_users WHERE user_id = $1
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Create purchase_item function
        CREATE OR REPLACE FUNCTION public.purchase_item(item_id UUID, user_id UUID)
        RETURNS JSON AS $$
        DECLARE
          item_record RECORD;
          user_balance INTEGER;
          new_balance INTEGER;
          order_id UUID;
        BEGIN
          -- Check if item exists and is active
          SELECT * INTO item_record FROM public.items WHERE id = item_id AND is_active = true;
          IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'message', 'Item not found or not available');
          END IF;
          
          -- Check if item is in stock
          IF item_record.stock = 0 THEN
            RETURN json_build_object('success', false, 'message', 'Item out of stock');
          END IF;
          
          -- Get user's current balance
          SELECT balance INTO user_balance FROM public.user_coins WHERE user_id = purchase_item.user_id;
          IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'message', 'User has no coin balance');
          END IF;
          
          -- Check if user has enough coins
          IF user_balance < item_record.price THEN
            RETURN json_build_object('success', false, 'message', 'Insufficient coins');
          END IF;
          
          -- Begin transaction
          BEGIN
            -- Deduct coins from user's balance
            new_balance := user_balance - item_record.price;
            UPDATE public.user_coins 
            SET balance = new_balance, updated_at = NOW() 
            WHERE user_id = purchase_item.user_id;
            
            -- Record the transaction
            INSERT INTO public.coin_transactions (
              user_id, 
              amount, 
              balance_after, 
              transaction_type, 
              description, 
              metadata
            ) VALUES (
              purchase_item.user_id, 
              -item_record.price, 
              new_balance, 
              'shop_purchase', 
              'Purchased item: ' || item_record.name, 
              json_build_object('item_id', item_id)
            );
            
            -- Create order record
            INSERT INTO public.orders (
              user_id, 
              item_id, 
              price_paid
            ) VALUES (
              purchase_item.user_id, 
              item_id, 
              item_record.price
            ) RETURNING id INTO order_id;
            
            -- Decrease item stock
            UPDATE public.items 
            SET stock = stock - 1, updated_at = NOW() 
            WHERE id = item_id;
            
            -- Return success
            RETURN json_build_object(
              'success', true, 
              'message', 'Purchase successful', 
              'order_id', order_id, 
              'new_balance', new_balance
            );
          EXCEPTION
            WHEN OTHERS THEN
              -- Rollback is automatic on exception
              RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
          END;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Get current user ID
        SELECT auth.uid() INTO current_user_id;
        
        -- Make current user an admin if admin_users is empty
        IF NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) AND current_user_id IS NOT NULL THEN
          INSERT INTO public.admin_users (user_id, granted_by)
          VALUES (current_user_id, current_user_id);
        END IF;
        
        result := jsonb_build_object('success', true, 'message', 'Shop system initialized successfully');
        RETURN result;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)

    if (error) {
      console.error("Error creating initialization procedure:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in createInitializationProcedure:", error)
    return { success: false, error }
  }
}
