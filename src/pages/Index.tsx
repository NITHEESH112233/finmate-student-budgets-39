
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("finmateUser");
    if (userData) {
      navigate("/");
    } else {
      navigate("/auth");
    }
  }, [navigate]);
  
  return null;
};

export default Index;
