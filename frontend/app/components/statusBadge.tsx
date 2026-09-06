
import { cn, getDynamicStyles } from "@/lib/utils";
import { StatusDot } from "./statusDot";

export function StatusBadge({crowdLevel=0, variant="", className=""}){
    const colorMap = {
        success: { bg: "bg-emerald-100 text-emerald-400", ping: "bg-emerald-400" }, // Open
        warning: { bg: "bg-amber-100 text-ember-400", ping: "bg-amber-400" },     // Closing Soon
        closed:   { bg: "bg-rose-100/90 text-rose-600", ping: "bg-rose-600", name:'Closed' },       // Closed
        neutral: { bg: "bg-slate-100 text-slate-400", ping: "bg-slate-300" },     // Unknown
        NotCrowded: { bg: "bg-emerald-100/90 text-emerald-600 ", ping: "bg-green-600" },
        NotTooCrowded: { bg: "bg-yellow-100/90 text-yellow-600", ping: "bg-yellow-600" },
        Crowded: { bg: "bg-orange-100/90 text-orange-700", ping: "bg-orange-700" },
        AtCapacity: { bg: "bg-red-100/90 text-red-600", ping: "bg-red-600" }
      };
    //   console.log((variant=="" ? (getDynamicStyles(crowdLevel).statusType || 'success') : variant))
      const colors = colorMap[variant=="" ? (getDynamicStyles(crowdLevel).statusType || 'success') : variant];
    return(
    <div className={cn("flex items-center font-bold py-1 px-3 rounded-full text-xs",className, colors ? colors.bg : "", "")}>
      {variant != "closed"  &&
    <StatusDot 
      colors={colors}
      className="mr-2" 
    />
      }
    {variant=="" ? getDynamicStyles(crowdLevel).statusName : colors?.name || 'Closed'}
  </div>
    )
}