import jwt from "jsonwebtoken";
import {
  hashToken,
  tokenVerificationErrors,
} from "../../utils/tokenManager.js";
import { JWT_REFRESH } from "../../config/env.js";
import { RefreshTokenSession } from "../../models/relations.model.js";

// Función encargada de generar y validar el refreshtoken
export const requireRefreshToken = async (req, res, next) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;
    if (!refreshTokenCookie) {
      return res.status(403).json({
        message:
          "No se encontro una sesion activa (refresh token). Inicia sesion nuevamente.",
      });
    }

    const payload = jwt.verify(refreshTokenCookie, JWT_REFRESH);
    const { uid, role, jti } = payload;

    if (!jti) {
      return res.status(401).json({
        message: "Refresh token invalido. Sesion no reconocida.",
      });
    }

    const tokenHash = hashToken(refreshTokenCookie);

    const refreshSession = await RefreshTokenSession.findOne({
      where: {
        id: jti,
        user_id: uid,
        token_hash: tokenHash,
      },
    });

    if (!refreshSession || refreshSession.revoked_at) {
      return res.status(401).json({
        message: "Refresh token revocado o no reconocido.",
      });
    }

    if (new Date(refreshSession.expires_at).getTime() <= Date.now()) {
      await refreshSession.update({
        revoked_at: new Date(),
      });

      return res.status(401).json({
        message: "Refresh token expirado.",
      });
    }

    req.uid = uid;
    req.role = role;
    req.refreshTokenSessionId = refreshSession.id;
    req.refreshTokenRaw = refreshTokenCookie;

    next();
  } catch (error) {
    console.log(
      "Se he presentado un error en el Refreshtoken requerido:",
      error.message,
    );

    return res
      .status(401)
      .send({ message: tokenVerificationErrors[error.message] });
  }
};
