import { VideoPlayer } from "@/components/video-player";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <section className="space-y-6 pt-[16vh] 2xl:pt-48 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <SignUp
            appearance={{
              elements: {
                card: "border! shadow-none! rounded-lg!",
                headerTitle: "text-2xl!",
                headerSubtitle: "text-muted-foreground!",
                socialButtonsBlockButton: "rounded-lg!",
                formButtonPrimary: "rounded-lg!",
                formFieldInput: "rounded-lg!",
                footerActionLink: "text-primary!",
              },
            }}
          />
        </div>
        <div className="h-[58.5vh] w-full bg-destructive rounded-lg overflow-hidden hidden lg:block">
          <VideoPlayer path="/auth-hero.mp4" />
        </div>
      </section>
    </div>
  );
}
