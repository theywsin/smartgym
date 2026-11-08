import { Dumbbell } from "lucide-react";

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-brand-600 text-white">
        <Dumbbell className="size-5" aria-hidden />
      </div>
      {withText && <span className="text-lg font-extrabold">اسمارت‌جیم</span>}
    </div>
  );
}
