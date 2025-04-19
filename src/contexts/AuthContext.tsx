
import { createContext, useState, useContext, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  university?: string;
  studentId?: string;
  joinedDate: string;
  profileImage?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage on initial load
    const checkUserAuth = () => {
      const userData = localStorage.getItem("finmateUser");
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setIsLoading(false);
    };

    checkUserAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // This is a mock implementation - in a real app, this would call an API
    try {
      // Mock successful login for demo purposes
      const mockUser = {
        id: "user-123",
        name: "Student User",
        email: email,
        university: "State University",
        studentId: "SU20240419",
        joinedDate: new Date().toISOString(),
        profileImage: null
      };
      
      localStorage.setItem("finmateUser", JSON.stringify(mockUser));
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    // This is a mock implementation - in a real app, this would call an API
    try {
      // Mock successful registration
      const newUser = {
        id: `user-${Math.floor(Math.random() * 1000)}`,
        name: userData.name || "New User",
        email: userData.email || "",
        university: userData.university || "",
        studentId: userData.studentId || "",
        joinedDate: new Date().toISOString(),
        profileImage: null
      };
      
      localStorage.setItem("finmateUser", JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("finmateUser");
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem("finmateUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
