import Overview from "./Overview";
import Budget from "./Budget";
import Insights from "./Insights";
import Spending from "./Spending";

export default function DashboardGrid() {
  return (
    <div className="w-full">
      {/* Overview - Full width at top */}
      <div className="w-full mb-6">
        <Overview />
      </div>

      {/* Three column grid on desktop, single column stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mobile order: Insights -> Spending -> Budget */}
        {/* Desktop order: Budget -> Insights -> Spending */}
        <div className="order-3 lg:order-1">
          <Budget />
        </div>
        <div className="order-1 lg:order-2">
          <Insights />
        </div>
        <div className="order-2 lg:order-3">
          <Spending />
        </div>
      </div>
    </div>
  );
}

