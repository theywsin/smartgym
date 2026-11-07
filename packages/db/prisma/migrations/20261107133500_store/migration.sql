-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('STORE', 'BUFFET');

-- CreateEnum
CREATE TYPE "StockReason" AS ENUM ('PURCHASE', 'ADJUST', 'SALE', 'SALE_VOID');

-- AlterTable
ALTER TABLE "ledger_entry" ADD COLUMN     "sale_id" UUID;

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price_rial" BIGINT NOT NULL,
    "track_stock" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_stock" (
    "gym_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_stock_pkey" PRIMARY KEY ("product_id","branch_id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "StockReason" NOT NULL,
    "sale_id" UUID,
    "note" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "member_id" UUID,
    "total_rial" BIGINT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "idempotency_key" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided_at" TIMESTAMPTZ(3),
    "voided_by_user_id" UUID,
    "void_reason" TEXT,

    CONSTRAINT "sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_item" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_rial" BIGINT NOT NULL,
    "line_total_rial" BIGINT NOT NULL,

    CONSTRAINT "sale_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_gym_id_name_key" ON "product"("gym_id", "name");

-- CreateIndex
CREATE INDEX "product_stock_gym_id_branch_id_idx" ON "product_stock"("gym_id", "branch_id");

-- CreateIndex
CREATE INDEX "stock_movement_gym_id_product_id_created_at_idx" ON "stock_movement"("gym_id", "product_id", "created_at");

-- CreateIndex
CREATE INDEX "sale_gym_id_created_at_idx" ON "sale"("gym_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sale_gym_id_idempotency_key_key" ON "sale"("gym_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "sale_item_sale_id_idx" ON "sale_item"("sale_id");

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────── Hand-written additions ─────────
ALTER TABLE "product" ADD CONSTRAINT "product_price_chk" CHECK ("price_rial" >= 0);
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_nonneg_chk" CHECK ("quantity" >= 0);
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_delta_chk" CHECK ("delta" <> 0);
ALTER TABLE "sale" ADD CONSTRAINT "sale_total_chk" CHECK ("total_rial" > 0);
ALTER TABLE "sale" ADD CONSTRAINT "sale_void_chk" CHECK (("voided_at" IS NULL) = ("void_reason" IS NULL));
ALTER TABLE "sale_item"
  ADD CONSTRAINT "sale_item_qty_chk" CHECK ("quantity" > 0),
  ADD CONSTRAINT "sale_item_total_chk" CHECK ("line_total_rial" = "quantity" * "unit_price_rial");

ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "product" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "product_stock" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "product_stock" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "stock_movement" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "stock_movement" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "sale" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "sale" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "sale_item" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "sale_item" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE ON "product" TO smartgym_app;
    REVOKE DELETE ON "product" FROM smartgym_app;
    GRANT SELECT, INSERT, UPDATE ON "product_stock" TO smartgym_app;
    REVOKE DELETE ON "product_stock" FROM smartgym_app;
    GRANT SELECT, INSERT ON "stock_movement" TO smartgym_app;
    REVOKE UPDATE, DELETE ON "stock_movement" FROM smartgym_app;
    GRANT SELECT, INSERT ON "sale" TO smartgym_app;
    REVOKE UPDATE, DELETE ON "sale" FROM smartgym_app;
    GRANT UPDATE ("voided_at", "voided_by_user_id", "void_reason") ON "sale" TO smartgym_app;
    GRANT SELECT, INSERT ON "sale_item" TO smartgym_app;
    REVOKE UPDATE, DELETE ON "sale_item" FROM smartgym_app;
  END IF;
END $$;
