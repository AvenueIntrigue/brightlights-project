import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

interface PrivateRouteProps {
  roles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ roles }) => {
  const { isAuthenticated, user } = useAuth0();
  const location = useLocation();

  const namespace = "http://localhost:3000";

  const userHasRequiredRole = roles
    ? roles.some((role) => user?.[`${namespace}roles`]?.includes(role))
    : true;

  if (!isAuthenticated || !userHasRequiredRole) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default PrivateRoute;
