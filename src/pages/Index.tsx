
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yuktor-400 to-yuktor-600 bg-clip-text text-transparent mb-4">
            Yuktor
          </h1>
          <p className="text-xl md:text-2xl text-zinc-100 mb-8">
            SAP BASIS Enterprise Support Platform
          </p>
          <p className="text-lg text-zinc-300 mb-12 max-w-xl mx-auto">
            Professional SAP BASIS support services for your enterprise. Get expert assistance with SAP RISE, SAP Grow, migrations, and on-premise solutions.
          </p>
        </div>
        
        <div className="animate-slide-up space-y-4">
          {user ? (
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="btn-glow bg-yellow-500 hover:bg-yellow-400 text-lg px-8 py-3"
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => navigate('/login')} 
                className="btn-glow bg-yellow-500 hover:bg-yellow-400 text-lg px-8 py-3 mr-4"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/login')} 
                variant="outline"
                className="text-lg px-8 py-3 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
