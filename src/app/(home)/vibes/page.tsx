import { VibeLists } from "@/components/vibe-lists";

export function VibesPage() {
  return (
    <div className="min-h-dvh flex flex-col max-w-3xl mx-auto w-full">
      <div className="space-y-6 py-[16vh] 2xl:py-48">
        <VibeLists />
      </div>
    </div>
  );
}

export default VibesPage;
