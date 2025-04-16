
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { authenticateUser } from "@/data/mockData";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [credential, setCredential] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const userId = authenticateUser(credential);
      if (userId) {
        login(userId);
        navigate("/tasks");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid employee code or phone number",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-5 rounded-full">
              <Lock size={40} className="text-blue-600" />
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Resort Staff Login</h1>
          <p className="mt-2 text-gray-600">
            Enter your employee code or phone number to access your tasks
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="credential" className="block text-sm font-medium text-gray-700">
              Employee Code or Phone Number
            </label>
            <input
              id="credential"
              type="text"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-lg"
              placeholder="123456 or +1234567890"
              required
            />
          </div>
          
          <button
            type="submit"
            className={`w-full flex justify-center rounded-md border border-transparent px-4 py-3 text-base font-medium text-white shadow-sm ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>For demo purposes, enter any value to login</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
