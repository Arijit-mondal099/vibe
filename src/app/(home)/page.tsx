import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { ChevronRightIcon } from "lucide-react";

import { Features } from "@/modules/home/ui/components/features";
import { Faq } from "@/modules/home/ui/components/faq";
import { Footer } from "@/modules/home/ui/components/footer";
import { Pricing } from "@/modules/home/ui/components/pricing";

export default async function Page() {
  const user = await currentUser();

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="min-h-dvh flex flex-col items-center">
        <div className="flex-1 flex flex-col items-center justify-center gap-y-6 w-full">
          <Hint text="Hi, I'm Vibe. How can I help you today?">
            <div className="flex flex-col items-center">
              <Image src="/logo.svg" alt="Vibe" width={50} height={50} />
            </div>
          </Hint>

          <h1 className="text-2xl md:text-5xl font-bold text-center">
            {user?.firstName
              ? `What's cooking, ${user.firstName}?`
              : "Build something with Vibe"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center">
            Create apps and websites by chatting with AI
          </p>

          <div className="max-w-3xl mx-auto w-full">
            <ProjectForm />
          </div>
        </div>

        {user && (
          <div className="pb-8">
            <Link href="/vibes">
              <Button variant="outline" size="lg" className="group">
                <span>My Vibes</span>
                <ChevronRightIcon className="group-hover:animate-sway transition-all" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {!user && <Features />}
      {!user && <Pricing />}
      {!user && <Faq />}
      {!user && <Footer />}
    </div>
  );
}
