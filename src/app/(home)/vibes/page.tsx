import { VibeLists } from "@/components/vibe-lists";

export default function Page() {
  return (
    <div className="min-h-dvh flex flex-col max-w-3xl mx-auto w-full">
      <div className="space-y-6 py-[16vh] 2xl:py-48">
        <VibeLists />
      </div>
    </div>
  );
}
