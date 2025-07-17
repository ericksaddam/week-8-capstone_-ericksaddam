import { TaskManagement } from "@/components/TaskManagement";
import Navbar from "@/components/Navbar";
import { RequireAuth } from "@/components/auth/RequireAuth";

const Tasks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <RequireAuth>
          <TaskManagement />
        </RequireAuth>
      </div>
    </div>
  );
};

export default Tasks;