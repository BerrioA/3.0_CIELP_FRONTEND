const ROLE_LABELS_ES = {
  superAdmin: "Super Administrador",
  admin: "Administrador",
  teacher: "Docente",
  psychologist: "Psicólogo",
  developer: "Desarrollador",
};

const ROLE_LABELS_PLURAL_ES = {
  superAdmin: "Super Administradores",
  admin: "Administradores",
  teacher: "Docentes",
  psychologist: "Psicólogos",
  developer: "Desarrolladores",
};

export const formatRoleLabel = (role, fallback = "Sin rol") => {
  if (!role || typeof role !== "string") {
    return fallback;
  }

  return ROLE_LABELS_ES[role] || role;
};

export const formatRoleLabelPlural = (role, fallback = "Roles") => {
  if (!role || typeof role !== "string") {
    return fallback;
  }

  return ROLE_LABELS_PLURAL_ES[role] || role;
};

export const roleLabelsEs = ROLE_LABELS_ES;
