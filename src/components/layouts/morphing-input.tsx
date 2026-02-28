"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  UnfoldMoreIcon,
  Album02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

interface PlaceholderConfig {
  id: number;
  placeholder: string;
  icon: any;
}

// Change Here
const placeholderOptions: PlaceholderConfig[] = [
  { id: 1, placeholder: "Search anything...", icon: SparklesIcon },
  { id: 2, placeholder: "Generate Image", icon: Album02Icon },
];

const AnimatedPlaceholder = ({ text }: { text: string }) => {
  const letters = text.split("");

  return (
    <motion.span className="inline-flex overflow-hidden">
      {letters.map((letter, index) => (
        <motion.span
          key={`${text}-${index}`}
          initial={{
            opacity: 0,
            rotateX: "80deg",
            y: 8,
            filter: "blur(3px)",
          }}
          exit={{
            opacity: 0,
            rotateX: "-80deg",
            filter: "blur(3px)",
            y: -8,
          }}
          animate={{
            opacity: 1,
            rotateX: "0deg",
            y: 0,
            filter: "blur(0px)",
          }}
          transition={{
            delay: 0.015 * index,

            type: "spring",
            damping: 16,
            stiffness: 240,
            mass: 1.2,
          }}
          style={{
            willChange: "transform",
          }}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

const InputSwitch = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const currentConfig = placeholderOptions[activeIndex];

  const handleIconClick = () => {
    setActiveIndex((prev) => (prev + 1) % placeholderOptions.length);
  };

  const IconComponent = currentConfig.icon;

  return (
    <div className="bg-muted flex w-full max-w-sm items-center justify-center rounded-full px-1 py-1">
      <motion.button
        className="bg-background flex cursor-default items-center justify-center gap-1.5 overflow-hidden rounded-full p-2.5 px-2.5 shadow-sm transition-colors"
        onClick={handleIconClick}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentConfig.id}
            exit={{
              filter: "blur(5px)",
              opacity: 0,
            }}
            initial={{
              opacity: 0,
              filter: "blur(5px)",
            }}
            animate={{
              filter: "blur(0px)",
              opacity: 1,
            }}
            transition={{
              ease: "easeInOut",

              duration: 0.35,
            }}
            className="flex items-center justify-center gap-1"
          >
            <HugeiconsIcon icon={IconComponent} className="text-foreground h-5 w-5" />
          </motion.div>
        </AnimatePresence>
        <HugeiconsIcon icon={UnfoldMoreIcon} className="text-muted-foreground h-3 w-3" />
      </motion.button>
      <div className="relative min-w-0 flex-1">
        {!inputValue && (
          <div className="pointer-events-none absolute top-0 left-0 flex h-full w-full items-center overflow-hidden bg-transparent pl-1.5">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={currentConfig.id}
                className="text-muted-foreground text-sm whitespace-nowrap"
              >
                <AnimatedPlaceholder text={currentConfig.placeholder} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        <Input
          type="text"
          value={inputValue}
          onChange={(e: any) => setInputValue(e.target.value)}
          className="text-foreground m-0 !border-0 border-none bg-transparent! !pl-1.5 text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <button className="bg-background flex cursor-pointer items-center justify-center self-stretch rounded-full px-3 py-2.5 shadow-sm transition-transform duration-150 ease-in-out active:scale-95">
        <HugeiconsIcon icon={ArrowRight02Icon} className="text-foreground h-4 w-4" />
      </button>
    </div>
  );
};

export default InputSwitch;
