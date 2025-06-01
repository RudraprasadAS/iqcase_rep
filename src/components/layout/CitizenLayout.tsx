
import { Outlet } from "react-router-dom";
import CitizenNavbar from "./CitizenNavbar";
import CitizenSidebar from "./CitizenSidebar";

const CitizenLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CitizenSidebar />
      <div className="flex-1 flex flex-col">
        <CitizenNavbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;
