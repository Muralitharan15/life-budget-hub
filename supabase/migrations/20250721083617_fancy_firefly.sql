@@ .. @@
-- Create or replace the audit function
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
-        INSERT INTO transaction_history (transaction_id, user_id, action, new_values, changes_description)
-        VALUES (NEW.id, NEW.user_id, 'created', to_jsonb(NEW), 'Transaction created');
+        INSERT INTO transaction_history (transaction_id, user_id, profile_name, budget_year, budget_month, action, new_values, changes_description)
+        VALUES (NEW.id, NEW.user_id, NEW.profile_name, NEW.budget_year, NEW.budget_month, 'created', to_jsonb(NEW), 'Transaction created');
         RETURN NEW;
     ELSIF TG_OP = 'UPDATE' THEN
-        INSERT INTO transaction_history (transaction_id, user_id, action, old_values, new_values, changes_description)
-        VALUES (NEW.id, NEW.user_id, 'updated', to_jsonb(OLD), to_jsonb(NEW), 'Transaction updated');
+        INSERT INTO transaction_history (transaction_id, user_id, profile_name, budget_year, budget_month, action, old_values, new_values, changes_description)
+        VALUES (NEW.id, NEW.user_id, NEW.profile_name, NEW.budget_year, NEW.budget_month, 'updated', to_jsonb(OLD), to_jsonb(NEW), 'Transaction updated');
         RETURN NEW;
     ELSIF TG_OP = 'DELETE' THEN
-        INSERT INTO transaction_history (transaction_id, user_id, action, old_values, changes_description)
-        VALUES (OLD.id, OLD.user_id, 'deleted', to_jsonb(OLD), 'Transaction deleted');
+        INSERT INTO transaction_history (transaction_id, user_id, profile_name, budget_year, budget_month, action, old_values, changes_description)
+        VALUES (OLD.id, OLD.user_id, OLD.profile_name, OLD.budget_year, OLD.budget_month, 'deleted', to_jsonb(OLD), 'Transaction deleted');
         RETURN OLD;
     END IF;
     RETURN NULL;