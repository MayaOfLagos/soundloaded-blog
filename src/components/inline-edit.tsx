// @ts-nocheck
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Edit01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function SaveInput() {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("this.urvish");

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex w-full items-center justify-center text-xl">
      <motion.div
        layout
        initial={{
          boxShadow: "0px 0px 2px hsl(var(--foreground) / 0.1)",
        }}
        animate={{
          boxShadow: isEditing
            ? " none border border-foreground"
            : "0px 0px 2px hsl(var(--foreground) / 0.1)",
        }}
        className={cn(
          "bg-background relative flex items-center overflow-hidden border-2",
          isEditing && "ring-ring ring-offset-background ring-2 ring-offset-2 outline-none"
        )}
        style={{ borderRadius: 60 }}
      >
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={!isEditing}
          className={cn(
            "h-12 w-full min-w-32 border-0 bg-transparent p-0 pr-12 pl-4 text-base shadow-none focus-visible:ring-0",
            isEditing ? "text-foreground" : "text-muted-foreground"
          )}
          placeholder="username"
        />
        <AnimatePresence initial={false}>
          {!isEditing ? (
            <motion.span
              key="pen"
              layout="position"
              initial={{ x: 50 }}
              animate={{ x: 0 }}
              exit={{ x: 50 }}
              transition={{ type: "spring", bounce: 0.1 }}
              onClick={() => {
                setIsEditing(true);

                if (inputRef.current) inputRef.current.select();
              }}
              className="bg-card/80 hover:bg-card text-muted-foreground absolute right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[0.2px]"
            >
              <HugeiconsIcon icon={Edit01Icon} size={20} />
            </motion.span>
          ) : (
            <motion.span
              key="check"
              layout="position"
              initial={{ x: 50 }}
              animate={{ x: 0 }}
              exit={{ x: 50 }}
              transition={{ type: "spring", bounce: 0.1 }}
              onClick={() => setIsEditing(false)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground absolute right-1 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[0.2px]"
            >
              <HugeiconsIcon icon={Tick02Icon} size={20} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default SaveInput;
