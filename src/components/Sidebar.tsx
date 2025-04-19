
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  CreditCard,
  Home,
  BarChart,
  Wallet,
  Settings,
  LogOut
} from "lucide-react";

const Sidebar = () => {
  // This would typically come from auth context in a real app
  const user = { name: "Student User" };

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: CreditCard, label: "Transactions", path: "/transactions" },
    { icon: PieChart, label: "Budget", path: "/budget" },
    { icon: Wallet, label: "Income", path: "/income" },
    { icon: BarChart, label: "Reports", path: "/reports" },
    { icon: Wallet, label: "Goals", path: "/goals" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-4 h-screen sticky top-0">
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 rounded-full bg-finmate-purple flex items-center justify-center text-white font-bold mr-2">
          F
        </div>
        <h1 className="text-xl font-bold">FinMate</h1>
      </div>

      <div className="mb-8">
        <div className="px-4 py-3 bg-finmate-light-purple rounded-lg">
          <p className="text-sm text-gray-600">Welcome</p>
          <p className="font-medium">{user.name}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item, index) => (
          <Link to={item.path} key={index}>
            <Button variant="ghost" className="w-full justify-start">
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      <Button variant="outline" className="mt-auto w-full justify-start">
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
};

export default Sidebar;
