import { Box, Container, Stack, Typography } from "@mui/material";
import PublicNavbar from "../components/PublicNavbar";

function TermsOfUsePage() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <PublicNavbar />

      <Container
        maxWidth="md"
        sx={{ pt: { xs: 12, md: 14 }, pb: { xs: 6, md: 8 } }}
      >
        <Stack spacing={2.2}>
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontWeight: 700 }}
          >
            Terminos de uso
          </Typography>

          <Typography color="text.secondary">
            Estos terminos regulan el acceso y uso de la plataforma CIELP. Al
            usar el servicio, aceptas cumplir estas condiciones y la politica de
            privacidad.
          </Typography>

          <Typography variant="h6">1. Objeto del servicio</Typography>
          <Typography color="text.secondary">
            CIELP es una plataforma para apoyar procesos de bienestar docente,
            tamizaje, seguimiento y analitica institucional en contextos
            educativos.
          </Typography>

          <Typography variant="h6">2. Registro y cuenta de usuario</Typography>
          <Typography color="text.secondary">
            Para acceder a funcionalidades protegidas debes crear una cuenta con
            informacion veraz y mantener la confidencialidad de tus
            credenciales.
          </Typography>

          <Typography variant="h6">3. Uso permitido</Typography>
          <Typography color="text.secondary">
            El usuario se compromete a utilizar la plataforma de forma legal,
            etica y respetuosa, evitando acciones que puedan afectar la
            seguridad, disponibilidad o integridad de la informacion.
          </Typography>

          <Typography variant="h6">4. Uso prohibido</Typography>
          <Typography color="text.secondary">
            Se prohibe manipular el sistema de forma fraudulenta, suplantar
            identidades, extraer informacion sin autorizacion o interferir con
            el funcionamiento del servicio.
          </Typography>

          <Typography variant="h6">5. Propiedad intelectual</Typography>
          <Typography color="text.secondary">
            Los contenidos, marcas, software y elementos de la plataforma son de
            titularidad de CIELP o de terceros autorizados y estan protegidos
            por la normativa aplicable.
          </Typography>

          <Typography variant="h6">6. Disponibilidad y cambios</Typography>
          <Typography color="text.secondary">
            El servicio puede actualizarse, modificarse o suspenderse de forma
            parcial por mantenimiento, mejoras tecnicas o causas de fuerza
            mayor.
          </Typography>

          <Typography variant="h6">7. Limitacion de responsabilidad</Typography>
          <Typography color="text.secondary">
            CIELP no reemplaza diagnosticos clinicos ni atencion profesional en
            salud. La informacion presentada por el sistema es de apoyo para
            toma de decisiones institucionales.
          </Typography>

          <Typography variant="h6">8. Terminacion de acceso</Typography>
          <Typography color="text.secondary">
            CIELP puede suspender o cancelar cuentas que incumplan estos
            terminos, sin perjuicio de las acciones legales que correspondan.
          </Typography>

          <Typography variant="h6">9. Ley aplicable y contacto</Typography>
          <Typography color="text.secondary">
            Estos terminos se rigen por la legislacion colombiana. Para
            consultas, escribe a cielpcontacto@gmail.com.
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Ultima actualizacion: marzo de 2026.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default TermsOfUsePage;
