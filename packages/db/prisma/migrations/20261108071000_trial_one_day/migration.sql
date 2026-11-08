-- Owner request (2026-11-08): the free trial is one day.
UPDATE "subscription_plan" SET "trial_days" = 1 WHERE "trial_days" = 14;
