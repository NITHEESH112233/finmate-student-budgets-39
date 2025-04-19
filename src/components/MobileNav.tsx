
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  CreditCard,
  Home,
  BarChart,
  Wallet,
  Settings,
  LogOut,
  Menu,
  User
} from "lucide-react";
import { useEffect, useState } from "react";

const MobileNav = () => {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("finmateUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: CreditCard, label: "Transactions", path: "/transactions" },
    { icon: PieChart, label: "Budget", path: "/budget" },
    { icon: Wallet, label: "Income", path: "/income" },
    { icon: BarChart, label: "Reports", path: "/reports" },
    { icon: Wallet, label: "Goals", path: "/goals" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("finmateUser");
    window.location.href = "/auth";
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 md:hidden">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-finmate-purple flex items-center justify-center text-white font-bold mr-2">
            F
          </div>
          <h1 className="text-xl font-bold">FinMate</h1>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-8">
                <div className="w-8 h-8 rounded-full bg-finmate-purple flex items-center justify-center text-white font-bold mr-2">
                  F
                </div>
                <h1 className="text-xl font-bold">FinMate</h1>
              </div>

              <div className="mb-8">
                <div className="px-4 py-3 bg-finmate-light-purple rounded-lg">
                  <p className="text-sm text-gray-600">Welcome</p>
                  <p className="font-medium">{user?.name || "Guest"}</p>
                  {user?.university && (
                    <p className="text-xs text-gray-500 mt-1">{user.university}</p>
                  )}
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

              <Button variant="outline" className="mt-auto w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default MobileNav;
