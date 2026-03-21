import bcryptjs from "bcryptjs";
import { randomUUID } from "crypto";
import { Op } from "sequelize";
import {
  AdditionalInformation,
  AuthLoginAttempt,
  RefreshTokenSession,
  Role,
  User,
  VerificationCode,
} from "../models/relations.model.js";
import {
  generateRefreshToken,
  generateToken,
  hashToken,
} from "../utils/tokenManager.js";
import {
  FRONTEND_URL,
  LOGIN_ATTEMPT_BLOCK_MS,
  LOGIN_ATTEMPT_MAX_FAILURES,
  LOGIN_ATTEMPT_WINDOW_MS,
  NODE_ENV,
} from "../config/env.js";
import {
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./email.service.js";
import { logger } from "../observability/logger.js";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const AUTO_VERIFIED_ROLES = new Set(["admin", "psychologist"]);

const assertEmailNotBlocked = async (normalizedEmail) => {
  const attempt = await AuthLoginAttempt.findOne({
    where: { email: normalizedEmail },
  });

  if (!attempt?.blocked_until) {
    return;
  }

  if (new Date(attempt.blocked_until).getTime() > Date.now()) {
    const error = new Error(
      "Demasiados intentos fallidos. Intenta nuevamente en unos minutos.",
    );
    error.statusCode = 429;
    throw error;
  }

  await attempt.update({
    failed_attempts: 0,
    first_failed_at: null,
    last_failed_at: null,
    blocked_until: null,
  });
};

const registerFailedLoginAttempt = async (normalizedEmail) => {
  const now = new Date();

  const [attempt] = await AuthLoginAttempt.findOrCreate({
    where: { email: normalizedEmail },
    defaults: {
      email: normalizedEmail,
      failed_attempts: 0,
    },
  });

  const firstFailedAt = attempt.first_failed_at
    ? new Date(attempt.first_failed_at).getTime()
    : 0;

  const shouldResetWindow =
    !firstFailedAt || Date.now() - firstFailedAt > LOGIN_ATTEMPT_WINDOW_MS;

  const failedAttempts = shouldResetWindow ? 1 : attempt.failed_attempts + 1;

  const updatePayload = {
    failed_attempts: failedAttempts,
    first_failed_at: shouldResetWindow ? now : attempt.first_failed_at,
    last_failed_at: now,
  };

  if (failedAttempts >= LOGIN_ATTEMPT_MAX_FAILURES) {
    updatePayload.blocked_until = new Date(Date.now() + LOGIN_ATTEMPT_BLOCK_MS);
  }

  await attempt.update(updatePayload);

  return {
    blocked: Boolean(updatePayload.blocked_until),
    failedAttempts,
  };
};

const clearLoginAttempts = async (normalizedEmail) => {
  await AuthLoginAttempt.destroy({
    where: { email: normalizedEmail },
  });
};

const createRefreshSession = async ({ uid, role, req, res }) => {
  const sessionId = randomUUID();
  const { refreshToken, expiresAt } = generateRefreshToken(
    uid,
    role,
    sessionId,
    res,
  );

  await RefreshTokenSession.create({
    id: sessionId,
    user_id: uid,
    token_hash: hashToken(refreshToken),
    user_agent: req.header("user-agent") || null,
    ip_address: req.ip || null,
    expires_at: expiresAt,
    last_used_at: new Date(),
  });

  return sessionId;
};

const revokeRefreshSessionByToken = async (rawToken) => {
  if (!rawToken) {
    return;
  }

  const tokenHash = hashToken(rawToken);
  const session = await RefreshTokenSession.findOne({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
    },
  });

  if (!session) {
    return;
  }

  await session.update({
    revoked_at: new Date(),
    last_used_at: new Date(),
  });
};

export const rotateRefreshSession = async ({
  uid,
  role,
  req,
  res,
  currentSessionId,
}) => {
  const nextSessionId = await createRefreshSession({ uid, role, req, res });

  await RefreshTokenSession.update(
    {
      revoked_at: new Date(),
      replaced_by_token_id: nextSessionId,
      last_used_at: new Date(),
    },
    {
      where: {
        id: currentSessionId,
        revoked_at: null,
      },
    },
  );

  return nextSessionId;
};

// Servicio para registrar usuarios (nuevo docente, psicólogo, etc.)
export const registerUser = async (userData, roleName = "teacher") => {
  const { given_name, surname, email, password, data_privacy_consent } =
    userData;
  try {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser)
      throw new Error("Este correo electronico ya se encuentra registrado.");

    const role = await Role.findOne({ where: { name: roleName } });

    if (!role) throw new Error("El rol asignado no existe.");

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await User.create({
      given_name,
      surname,
      email: normalizedEmail,
      password: hashedPassword,
      data_privacy_consent,
      role_id: role.id,
      status: AUTO_VERIFIED_ROLES.has(roleName) ? "verified" : "pending",
    });
    return newUser;
  } catch (error) {
    logger.error("register_user_failed", {
      error,
      email,
      role_name: roleName,
    });
    throw error;
  }
};

// Servicio para obtener el perfil de un usuario por su ID con base al token
export const getUserProfile = async (uid) => {
  const user = await User.findByPk(uid, {
    include: [
      {
        model: Role,
        attributes: ["name"],
      },
      {
        model: AdditionalInformation,
        attributes: ["id"],
        required: false,
      },
    ],
  });

  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  return {
    uid: user.id,
    given_name: user.given_name,
    surname: user.surname,
    email: user.email,
    role: user.role?.name,
    has_additional_information: Boolean(user.additional_information?.id),
  };
};

// Servicio para iniciar sesión
export const authLogin = async (userAuth, res, req) => {
  const { email, password } = userAuth;

  const normalizedEmail = normalizeEmail(email);

  await assertEmailNotBlocked(normalizedEmail);

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    const attemptResult = await registerFailedLoginAttempt(normalizedEmail);
    if (attemptResult.blocked) {
      const blockedError = new Error(
        "Demasiados intentos fallidos. Intenta nuevamente en unos minutos.",
      );
      blockedError.statusCode = 429;
      throw blockedError;
    }

    throw new Error("Credenciales incorrectas.");
  }

  const matchPassword = await bcryptjs.compare(password, user.password);
  if (!matchPassword) {
    const attemptResult = await registerFailedLoginAttempt(normalizedEmail);
    if (attemptResult.blocked) {
      const blockedError = new Error(
        "Demasiados intentos fallidos. Intenta nuevamente en unos minutos.",
      );
      blockedError.statusCode = 429;
      throw blockedError;
    }

    throw new Error("Credenciales incorrectas.");
  }

  if (user.status !== "verified") {
    const error = new Error(
      "Tu cuenta aun no esta verificada. Verifica tu correo para poder iniciar sesion.",
    );
    error.statusCode = 403;
    throw error;
  }

  await clearLoginAttempts(normalizedEmail);

  const { token, expiresIn } = generateToken(user.id);
  await createRefreshSession({ uid: user.id, role: user.role_id, req, res });

  return {
    token,
    expiresIn,
  };
};

// Servicio para cerrar sesión
export const authLogout = async (req, res) => {
  // Si no hay token, simplemente salir
  if (!req.cookies?.refreshToken) {
    return { message: "No hay sesión activa." };
  }

  await revokeRefreshSessionByToken(req.cookies.refreshToken);

  // Limpiar cookie
  const isProduction = NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return { message: "Sesión cerrada correctamente." };
};

// Servicio para generar un token de recuperación de contraseña
export const generateRecoveryToken = async (email) => {
  const user = await User.findOne({ where: { email } });

  // Por seguridad en salud mental, a veces es mejor no decir si el email existe,
  // pero para el flujo interno del servicio, lanzamos el error.
  if (!user) throw new Error("Usuario no encontrado");

  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de validez

  // Limpiamos códigos viejos del mismo tipo para este usuario
  await VerificationCode.destroy({
    where: { user_id: user.id, type: "reset_password" },
    force: true,
  });

  await VerificationCode.create({
    user_id: user.id,
    code: rawCode,
    type: "reset_password",
    expires_at: expiresAt,
  });

  // Generamos el payload. Usamos un formato que el Frontend pueda entender fácilmente.
  const data = JSON.stringify({ email: user.email, code: rawCode });
  const payload = Buffer.from(data).toString("base64");

  return {
    url: `${process.env.FRONTEND_URL}/reset-password/${encodeURIComponent(payload)}`,
    userEmail: user.email,
  };
};

// Servicio para resetear la contraseña usando el token generado
export const resetUserPassword = async (payloadBase64, newPassword) => {
  let email, code;

  // 1. Decodificación Segura
  try {
    const decoded = Buffer.from(payloadBase64, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    email = parsed.email;
    code = parsed.code;
  } catch (err) {
    throw new Error("El enlace de recuperación es corrupto o inválido.");
  }

  // 2. Validación de existencia y tiempo
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("Usuario no asociado al token.");

  const storedCode = await VerificationCode.findOne({
    where: {
      user_id: user.id,
      code: code.toString(),
      type: "reset_password",
    },
  });

  if (!storedCode) {
    throw new Error("El código es inválido o ya fue utilizado.");
  }

  if (new Date() > storedCode.expires_at) {
    await storedCode.destroy({ force: true }); // Limpiamos el código expirado
    throw new Error("El enlace ha expirado. Por favor, solicita uno nuevo.");
  }

  // 3. Actualización de Password
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(newPassword, salt);

  await user.update({ password: hashedPassword });

  // 4. Limpieza total de códigos de recuperación para este usuario
  await VerificationCode.destroy({
    where: { user_id: user.id, type: "reset_password" },
    force: true,
  });

  // Notificamos en background para no afectar el tiempo de respuesta.
  void sendPasswordResetSuccessEmail(
    user.email,
    user.given_name,
    user.surname,
  ).catch((error) => {
    logger.error("password_reset_success_email_send_failed", {
      email: user.email,
      error,
    });
  });

  return true;
};

export const processResendVerification = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("Usuario no encontrado");

  // 1. Generar los datos necesarios
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();

  // IMPORTANTE: Asegúrate de que el nombre sea 'expires_at'
  // tal cual lo pusiste en la migración
  const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // 2. Guardar en la base de datos
  // Usamos destroy/create para evitar problemas de índices únicos con upsert
  await VerificationCode.destroy({
    where: { user_id: user.id, type: "verify_account" },
    force: true,
  });

  await VerificationCode.create({
    user_id: user.id,
    code: rawCode,
    type: "verify_account",
    expires_at: expires_at, // <--- AQUÍ ESTABA EL ERROR
  });

  // 3. Generar URL y enviar email
  const payload = Buffer.from(
    JSON.stringify({ email, code: rawCode }),
  ).toString("base64");
  const url = `${FRONTEND_URL}/verify-account/${encodeURIComponent(payload)}`;

  // Enviamos en background para no bloquear la respuesta HTTP del registro.
  void sendVerificationEmail(email, url)
    .then((result) => {
      if (!result?.success) {
        logger.error("verification_email_send_failed", {
          email,
          error: result?.error,
        });
      }
    })
    .catch((error) => {
      logger.error("verification_email_send_unexpected_error", {
        email,
        error,
      });
    });
};

// Servicio para confirmar la verificación de cuenta usando el código enviado por email
export const confirmAccountVerification = async (payloadBase64) => {
  let email, code;
  try {
    const decoded = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
    email = decoded.email;
    code = decoded.code;
  } catch (e) {
    throw new Error("Token de verificación inválido");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  const storedCode = await VerificationCode.findOne({
    where: { user_id: user.id, code, type: "verify_account" },
  });

  if (!storedCode) {
    throw new Error("El código ha expirado o es inválido.");
  }

  if (new Date() > storedCode.expires_at) {
    await storedCode.destroy({ force: true });
    throw new Error("El código ha expirado o es inválido.");
  }

  // Éxito: Verificamos y limpiamos
  await user.update({ status: "verified" });
  await storedCode.destroy({ force: true });

  // Enviamos bienvenida (asíncrono, no bloqueamos la respuesta)
  sendWelcomeEmail(user.email, user.given_name, user.surname);
};

// Limpia códigos expirados de verificación y recuperación.
export const cleanupExpiredVerificationCodes = async () => {
  const deletedCount = await VerificationCode.destroy({
    where: {
      type: {
        [Op.in]: ["verify_account", "reset_password"],
      },
      expires_at: {
        [Op.lt]: new Date(),
      },
    },
    force: true,
  });

  return deletedCount;
};
