import { Box, Container, Stack, Typography } from "@mui/material";
import PublicNavbar from "../components/PublicNavbar";

function PrivacyPolicyPage() {
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
            Politica de privacidad
          </Typography>

          <Typography color="text.secondary">
            En CIELP protegemos los datos personales de nuestros usuarios y los
            tratamos de acuerdo con la normativa aplicable, incluyendo la Ley
            1581 de 2012 de Colombia y sus decretos reglamentarios.
          </Typography>

          <Typography variant="h6">1. Responsable del tratamiento</Typography>
          <Typography color="text.secondary">
            El responsable del tratamiento de los datos personales es la
            plataforma CIELP. Para consultas sobre privacidad puedes escribir a
            cielpcontacto@gmail.com.
          </Typography>

          <Typography variant="h6">2. Datos que recopilamos</Typography>
          <Typography color="text.secondary">
            Podemos recopilar datos de identificacion y contacto (nombre,
            apellido, correo), datos de acceso (credenciales y sesiones) y datos
            de uso de la plataforma relacionados con procesos de bienestar
            docente y analitica institucional.
          </Typography>

          <Typography variant="h6">3. Finalidades del tratamiento</Typography>
          <Typography color="text.secondary">
            Los datos se utilizan para crear y gestionar cuentas, habilitar
            funcionalidades del sistema, generar analitica institucional,
            mejorar la experiencia del servicio, atender solicitudes y cumplir
            obligaciones legales.
          </Typography>

          <Typography variant="h6">4. Base legal y consentimiento</Typography>
          <Typography color="text.secondary">
            El tratamiento se realiza con base en el consentimiento del titular
            y/o en las bases legales aplicables. Cuando corresponda, solicitamos
            autorizacion expresa para el tratamiento de datos personales.
          </Typography>

          <Typography variant="h6">5. Derechos del titular</Typography>
          <Typography color="text.secondary">
            El titular puede conocer, actualizar, rectificar y suprimir sus
            datos, asi como revocar la autorizacion y presentar consultas o
            reclamos sobre su tratamiento, en los terminos establecidos por la
            ley.
          </Typography>

          <Typography variant="h6">
            6. Conservacion de la informacion
          </Typography>
          <Typography color="text.secondary">
            Conservamos la informacion durante el tiempo necesario para cumplir
            las finalidades descritas, atender obligaciones legales y preservar
            trazabilidad tecnica y operativa del sistema.
          </Typography>

          <Typography variant="h6">7. Seguridad de la informacion</Typography>
          <Typography color="text.secondary">
            Aplicamos medidas tecnicas y organizativas razonables para proteger
            los datos contra acceso no autorizado, perdida, alteracion o uso
            indebido.
          </Typography>

          <Typography variant="h6">8. Transferencias y encargados</Typography>
          <Typography color="text.secondary">
            Podemos apoyarnos en proveedores tecnologicos para operar la
            plataforma. En estos casos exigimos condiciones de seguridad y
            confidencialidad acordes con la normativa vigente.
          </Typography>

          <Typography variant="h6">9. Cambios a esta politica</Typography>
          <Typography color="text.secondary">
            Esta politica puede actualizarse para reflejar cambios normativos o
            del servicio. La version vigente estara siempre disponible en este
            sitio.
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

export default PrivacyPolicyPage;
