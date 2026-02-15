CREATE TABLE IF NOT EXISTS "gpu_benchmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"gpu_name" text NOT NULL,
	"score" real NOT NULL,
	"url" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "gpu_benchmarks_gpu_name_unique" UNIQUE("gpu_name")
);