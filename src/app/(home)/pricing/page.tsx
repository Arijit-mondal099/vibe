"use client";

import { PricingTable } from "@clerk/nextjs";
import Image from "next/image";

function Page() {
  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <section className="space-y-6 pt-[16vh] 2xl:pt-48">
        <div className="flex flex-col items-center">
          <Image src="/logo.svg" alt="vibe" width={50} height={50} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-3xl font-bold text-center">Pricing</h1>
          <p className="text-muted-foreground text-center text-sm md:text-base">
            Choose the plan that fits your needs
          </p>
        </div>

        <PricingTable 
          appearance={{
            elements: {
              pricingTableCard: "border! shadow-none! rounded-lg! bg-sidebar!"
            }
          }}
        />
      </section>
    </div>
  );
}

export default Page;
