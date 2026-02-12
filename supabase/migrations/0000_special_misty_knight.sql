CREATE TABLE "power_products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"price" real NOT NULL,
	"original_price" real,
	"image_url" text,
	"product_url" text NOT NULL,
	"sku" text,
	"in_stock" boolean DEFAULT true,
	"is_high_margin" boolean DEFAULT false,
	"margin_reason" text,
	"specs" jsonb,
	"updated_at" timestamp DEFAULT now()
);
