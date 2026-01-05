import Overview from "./Overview";
import Budget from "./budget/Budget";
import Insights from "./Insights";
import Spending from "./Spending";

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 h-full w-full">
      <div className="w-full mb-6">
        <Overview />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0 overflow-y-auto">
        <div className="h-full lg:overflow-hidden order-3 lg:order-1">
          <Budget />
        </div>
        <div className="h-full lg:overflow-hidden order-1 lg:order-2">
          <Insights />
        </div>
        <div className="h-full lg:overflow-hidden order-2 lg:order-3">
          <Spending />
        </div>
      </div>
    </div>
  );
}

