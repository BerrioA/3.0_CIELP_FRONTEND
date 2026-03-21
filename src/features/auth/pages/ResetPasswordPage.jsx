import AuthSplitLayout from "../../../shared/ui/AuthSplitLayout";
import ResetPasswordCard from "../components/ResetPasswordCard";

function ResetPasswordPage() {
  return (
    <AuthSplitLayout
      title="Restablecimiento de contraseña"
      subtitle="Defina una nueva clave para retomar su trabajo de forma segura en la plataforma."
      asideTitle="Seguridad de cuenta"
      asideText="Una contraseña robusta protege la información institucional y el seguimiento de bienestar docente."
      form={<ResetPasswordCard />}
    />
  );
}

export default ResetPasswordPage;
