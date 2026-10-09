import { Product } from "@/generated/prisma/browser";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 500;

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const log = (message: string) => {
        console.log(message);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(message)}\n\n`),
        );
      };

      try {
        log("[СИНХРОНІЗАЦІЯ] Початок синхронізації...");
        log("[СИНХРОНІЗАЦІЯ] Отримання товарів з API...");

        const response = await fetch(
          "https://india-pharm.com/api.php?lang=ua&format=text",
          {
            headers: {
              "X-Api-Token": process.env.INDIA_PHARM_API_TOKEN!,
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.products)) {
          throw new Error("Invalid API response");
        }

        log(`[СИНХРОНІЗАЦІЯ] Отримано ${data.products.length} товарів з API`);

        log("[СИНХРОНІЗАЦІЯ] Підготовка товарів...");

        const products = data.products
          .filter((product: Product) => {
            const price = Number(product.price ?? 0);
            const minPricePerPill = Number(product.minPricePerPill ?? 0);

            return (
              product.inProduction !== false &&
              !(price === 0 && minPricePerPill === 0)
            );
          })
          .map((product: Product) => ({
            id: product.id,
            name: product.name,
            category:
              /Жіночий|Жіноча/i.test(product.name) ||
              /Жіноча віагра/i.test(product.category ?? "")
                ? "Жіночі збуджувачі"
                : (product.category ?? null),

            currency: product.currency ?? "UAH",

            price: product.price ?? 0,
            minPricePerPill: product.minPricePerPill ?? null,

            rating: product.rating ?? null,
            reviewsCount: product.reviewsCount ?? 0,

            inProduction: product.inProduction ?? false,
            isSale: product.isSale ?? false,
            isTop: product.isTop ?? false,

            url: product.url ?? null,

            description: product.description ?? null,
            shortDescription: product.shortDescription ?? null,

            advantages: product.advantages ?? null,
            contraindications: product.contraindications ?? null,
            indications: product.indications ?? null,
            overdose: product.overdose ?? null,
            sideEffects: product.sideEffects ?? null,
            storage: product.storage ?? null,
            usage: product.usage ?? null,

            characteristics: product.characteristics ?? null,
            images: product.images ?? null,
            reviews: product.reviews ?? null,
            variants: product.variants ?? null,
          }));

        log("[СИНХРОНІЗАЦІЯ] Товари підготовлено");

        await prisma.$transaction(async (tx) => {
          log("[СИНХРОНІЗАЦІЯ] Оновлення товарів...");

          await tx.product.deleteMany();

          log("[СИНХРОНІЗАЦІЯ] Старі товари оновлено");

          for (let i = 0; i < products.length; i += BATCH_SIZE) {
            const batch = products.slice(i, i + BATCH_SIZE);

            await tx.product.createMany({
              data: batch,
            });
          }
        });

        log(
          `[СИНХРОНІЗАЦІЯ] Синхронізацію завершено. Синхронізовано ${products.length} товарів.`,
        );

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "complete",
              count: products.length,
            })}\n\n`,
          ),
        );

        controller.close();
      } catch (error) {
        console.error(error);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Synchronization failed",
            })}\n\n`,
          ),
        );

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
