
import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const [currency, setCurrency] = useState("INR (₹)");
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveSettings = () => {
    // Save settings to local storage
    localStorage.setItem("finmateSettings", JSON.stringify({
      currency,
      darkMode,
    }));
    toast.success("Settings saved successfully");
  };

  const handleExportData = () => {
    // Prepare data for export
    const userData = localStorage.getItem("finmateUser");
    const transactions = localStorage.getItem("transactions");
    const budgets = localStorage.getItem("budgets");
    const goals = localStorage.getItem("goals");
    
    const exportData = {
      userData: userData ? JSON.parse(userData) : null,
      transactions: transactions ? JSON.parse(transactions) : [],
      budgets: budgets ? JSON.parse(budgets) : [],
      goals: goals ? JSON.parse(goals) : [],
    };
    
    // Create and download the file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "finmate-data.json";
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    
    toast.success("Data exported successfully");
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Clear all data
      localStorage.removeItem("finmateUser");
      localStorage.removeItem("transactions");
      localStorage.removeItem("budgets");
      localStorage.removeItem("goals");
      localStorage.removeItem("finmateSettings");
      
      toast.success("Account deleted successfully. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Application Settings</h1>
          <p className="text-muted-foreground">
            Manage app preferences and settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-finmate-purple" />
              Application Settings
            </CardTitle>
            <CardDescription>Manage app preferences and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Toggle dark mode for the application
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-finmate-purple rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-finmate-purple"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Currency</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred currency
                  </p>
                </div>
                <select 
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option>INR (₹)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>

              <Separator />

              <div className="pt-4">
                <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 w-full"
                    onClick={handleExportData}
                  >
                    Export Data
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 w-full"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-finmate-purple hover:bg-finmate-dark-purple"
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
