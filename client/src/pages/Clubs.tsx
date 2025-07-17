import { ClubManagement } from "@/components/ClubManagement";
import Navbar from "@/components/Navbar";

const Clubs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <ClubManagement />
      </div>
    </div>
  );
};

export default Clubs;