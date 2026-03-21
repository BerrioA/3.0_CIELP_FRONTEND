import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SelfImprovementRoundedIcon from "@mui/icons-material/SelfImprovementRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { ALL_USER_ROLES, USER_ROLES } from "./roles";

export const dashboardNavigation = [
  {
    label: "Inicio",
    path: "/dashboard",
    icon: DashboardRoundedIcon,
    allowedRoles: ALL_USER_ROLES,
  },
  {
    label: "MBI",
    path: "/dashboard/mbi",
    icon: PsychologyRoundedIcon,
    allowedRoles: ALL_USER_ROLES,
  },
  {
    label: "Espacios",
    path: "/dashboard/espacios",
    icon: SelfImprovementRoundedIcon,
    allowedRoles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.TEACHER,
      USER_ROLES.DEVELOPER,
    ],
  },
  {
    label: "Analítica",
    path: "/dashboard/analytics-global",
    icon: InsightsRoundedIcon,
    allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
  },
  {
    label: "Docentes",
    path: "/dashboard/docentes",
    icon: SchoolRoundedIcon,
    allowedRoles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.PSYCHOLOGIST,
    ],
  },
  {
    label: "Papelera",
    path: "/dashboard/usuarios/papelera",
    icon: DeleteSweepRoundedIcon,
    allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
  },
  {
    label: "Usuarios",
    path: "/dashboard/usuarios",
    icon: GroupRoundedIcon,
    allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
  },
  {
    label: "Ajustes",
    path: "/dashboard/configuracion",
    icon: SettingsRoundedIcon,
    allowedRoles: ALL_USER_ROLES,
  },
];

export const getDashboardNavigationByRole = (role) => {
  if (!role) {
    return [];
  }

  return dashboardNavigation.filter((item) => item.allowedRoles.includes(role));
};

export const getDefaultDashboardPathByRole = (role) => {
  return (
    getDashboardNavigationByRole(role)[0]?.path || "/dashboard/configuracion"
  );
};
