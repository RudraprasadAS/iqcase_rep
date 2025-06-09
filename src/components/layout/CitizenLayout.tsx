
import CitizenSidebar from "./CitizenSidebar";
import CitizenNavbar from "./CitizenNavbar";

interface CitizenLayoutProps {
  children: React.ReactNode;
}

const CitizenLayout = ({ children }: CitizenLayoutProps) => {
  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <CitizenSidebar />
      <div className="flex-1 flex flex-col">
        <CitizenNavbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;
