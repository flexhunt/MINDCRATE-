-- Create a trigger to notify clients when user_coins table is updated
CREATE OR REPLACE FUNCTION notify_coin_balance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about the change
  PERFORM pg_notify(
    'coin_balance_change',
    json_build_object(
      'user_id', NEW.user_id,
      'balance', NEW.balance,
      'previous_balance', CASE WHEN TG_OP = 'UPDATE' THEN OLD.balance ELSE NULL END
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS notify_coin_balance_change_trigger ON user_coins;

-- Create the trigger
CREATE TRIGGER notify_coin_balance_change_trigger
AFTER INSERT OR UPDATE ON user_coins
FOR EACH ROW
EXECUTE FUNCTION notify_coin_balance_change();

-- Create a trigger to update user_coins when a transaction is recorded
CREATE OR REPLACE FUNCTION update_user_coins_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user_coins table with the new balance
  -- This is a safety measure to ensure the balance is always correct
  UPDATE user_coins
  SET balance = NEW.balance_after,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_user_coins_on_transaction_trigger ON coin_transactions;

-- Create the trigger
CREATE TRIGGER update_user_coins_on_transaction_trigger
AFTER INSERT ON coin_transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_coins_on_transaction();
