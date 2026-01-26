import Overview from "./Overview";
import Budget from "./budget/Budget";
import Insights from "./Insights";
import Spending from "./Spending";

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 h-full w-full px-4">
      <div className="grid grid-cols-1 gap-6 h-full min-h-0 overflow-y-auto">
        <div className="h-full w-full max-w-xl mx-auto lg:overflow-hidden order-3 lg:order-1">
          <Budget />
        </div>
      </div>
    </div>
  );
}

