"use client"

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.hello.queryOptions({ text: "arijit" }))

  return (
    <div>
      Home {JSON.stringify(data)}
      <Button>click me</Button>
    </div>
  )
}
