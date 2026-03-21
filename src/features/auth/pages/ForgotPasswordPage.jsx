import AuthSplitLayout from "../../../shared/ui/AuthSplitLayout";
import ForgotPasswordCard from "../components/ForgotPasswordCard";

function ForgotPasswordPage() {
  return (
    <AuthSplitLayout
      title="Recuperación segura de acceso"
      subtitle="Protegemos la recuperación de credenciales con enlaces temporales y verificación estricta."
      asideTitle="Recupere su cuenta"
      asideText="Solicite un enlace temporal para restablecer su contraseña sin perder acceso a sus módulos de trabajo."
      form={<ForgotPasswordCard />}
    />
  );
}

export default ForgotPasswordPage;
