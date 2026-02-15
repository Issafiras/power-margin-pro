CREATE TABLE IF NOT EXISTS "cpu_benchmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"cpu_name" text NOT NULL,
	"score" real NOT NULL,
	"rank" real,
	"samples" real,
	"url" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cpu_benchmarks_cpu_name_unique" UNIQUE("cpu_name")
);
