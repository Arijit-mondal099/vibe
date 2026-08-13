import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: Props) {
  return (
    <main className="flex flex-col min-h-screen max-h-screen">
      <Navbar />

      <div className="flex-1 flex flex-col px-4">{children}</div>

      {/* Background style */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)] bg-[radial-gradient(#dadde2_1px,transparent_1px)] bg-size-[16px_16px]" />
    </main>
  );
}
