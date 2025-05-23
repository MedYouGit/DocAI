import { Outlet } from "react-router-dom";
import "./dashboardLayout.css";
import ChatList from "../../components/chatList/ChatList";

const DashboardLayout = () => {
  return (
    <div className="dashboardLayout">
      <div className="menu"><ChatList/></div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
