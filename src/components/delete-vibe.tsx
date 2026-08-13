"use client";

import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  id?: string;
}

export const DeleteVibe: React.FC<Props> = ({}) => {
  return (
    <Button variant="destructive" size="icon" >
      <Trash2  />
    </Button>
  );
};
