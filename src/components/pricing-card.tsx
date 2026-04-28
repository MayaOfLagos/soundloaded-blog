// @ts-nocheck
"use client";

import {
  Add01Icon,
  MinusPlus01Icon,
  MinusSignIcon,
  Tick02Icon,
  UserGroupIcon,
  UserStoryIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";
import { useState } from "react";

// Change Here
const plans = [
  {
    id: "plus",
    name: "Plus",
    description: "solo",
    monthlyPrice: 8.99,
    yearlyPrice: 6.99,
    features: ["1TB of Space", "30 days of file recovery", "256-bit AES and SSL/TLS"],
  },
  {
    id: "standard",
    name: "Standard",
    description: "startup",
    monthlyPrice: 12.99,
    yearlyPrice: 9.99,
    features: ["1TB of Space", "30 days of file recovery", "256-bit AES and SSL/TLS"],
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "teams",
    monthlyPrice: 24.99,
    yearlyPrice: 19.99,
    features: ["1TB of Space", "30 days of file recovery", "256-bit AES and SSL/TLS"],
  },
];

const TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

function PricingCard() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [userCount, setUserCount] = useState(3);

  return (
    <div className="border-border bg-background not-prose flex w-full max-w-[450px] flex-col gap-6 rounded-4xl border p-5 px-4 shadow-sm transition-colors duration-300 sm:rounded-2xl sm:p-6">
      <div className="mb-2 flex flex-col gap-4">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Select a Plan</h1>

        <div className="bg-muted ring-border flex h-10 w-full rounded-xl p-1 ring-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`relative h-full flex-1 rounded-lg text-base font-medium transition-colors duration-300 ${
              billingCycle === "monthly"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {billingCycle === "monthly" && (
              <motion.div
                layoutId="tab-bg"
                className="bg-background ring-border absolute inset-0 rounded-lg shadow-sm ring-1"
                transition={TRANSITION}
              />
            )}
            <span className="relative z-10">Monthly</span>
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`relative flex h-full flex-1 items-center justify-center gap-2 rounded-lg text-base font-medium transition-colors duration-300 ${
              billingCycle === "yearly"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {billingCycle === "yearly" && (
              <motion.div
                layoutId="tab-bg"
                className="bg-background ring-border absolute inset-0 rounded-lg shadow-sm ring-1"
                transition={TRANSITION}
              />
            )}
            <span className="relative z-10">Yearly</span>
            <span className="bg-primary text-primary-foreground relative z-10 rounded-full px-1.5 py-0.5 text-xs font-black font-light tracking-tight whitespace-nowrap uppercase">
              20% OFF
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className="relative cursor-pointer"
            >
              <div
                className={`bg-card border-foreground/10 relative rounded-xl border transition-colors duration-300 ${
                  isSelected ? "border-primary z-10 border-2" : ""
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="mt-1 shrink-0">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isSelected ? "border-primary" : "border-muted-foreground/15"
                          }`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="bg-primary h-4 w-4 rounded-full"
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 25,
                                  duration: 0.2,
                                }}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-foreground text-lg leading-tight font-medium">
                          {plan.name}
                        </h3>
                        <p className="text-muted-foreground text-sm lowercase">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground text-xl font-medium">
                        <NumberFlow value={price} format={{ style: "currency", currency: "USD" }} />
                      </div>
                      <div className="text-muted-foreground/60 flex items-center justify-end gap-1 text-xs">
                        {billingCycle === "monthly" ? "Month" : "Year"}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.32, 0.72, 0, 1],
                        }}
                        className="w-full overflow-hidden"
                      >
                        <div className="flex flex-col gap-6 pt-6">
                          <div className="flex flex-col gap-3.5">
                            {plan.features.map((feature, idx) => (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: idx * 0.05,
                                  duration: 0.3,
                                }}
                                key={idx}
                                className="text-foreground/80 flex items-center gap-3 text-sm"
                              >
                                <HugeiconsIcon
                                  icon={Tick02Icon}
                                  size={16}
                                  className="text-primary"
                                />
                                {feature}
                              </motion.div>
                            ))}
                          </div>

                          <div className="bg-muted h-px" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                                <HugeiconsIcon
                                  icon={UserStoryIcon}
                                  size={30}
                                  className="text-muted-foreground"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-foreground text-base leading-none font-medium">
                                  Users
                                </span>
                                <span className="text-muted-foreground mt-0.5 text-sm">
                                  Starting at {userCount} users
                                </span>
                              </div>
                            </div>

                            <div className="bg-muted border-border flex items-center gap-4 rounded-xl border p-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUserCount(Math.max(1, userCount - 1));
                                }}
                                aria-label="Remove one user"
                                className="hover:bg-background text-muted-foreground/60 hover:text-foreground rounded-lg p-1.5 transition-all hover:shadow-sm active:scale-95"
                              >
                                <HugeiconsIcon icon={MinusSignIcon} size={14} />
                              </button>
                              <span className="text-foreground/80 w-4 text-center text-sm tabular-nums">
                                <NumberFlow value={userCount} />
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUserCount(userCount + 1);
                                }}
                                aria-label="Add one user"
                                className="hover:bg-background text-muted-foreground/60 hover:text-foreground rounded-lg p-1.5 transition-all hover:shadow-sm active:scale-95"
                              >
                                <HugeiconsIcon icon={Add01Icon} size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PricingCard;
