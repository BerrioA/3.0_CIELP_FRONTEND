import AuthSplitLayout from "../../../shared/ui/AuthSplitLayout";
import VerifyAccountCard from "../components/VerifyAccountCard";

function VerifyAccountPage() {
  return (
    <AuthSplitLayout
      title="Validación segura de cuenta"
      subtitle="Protegemos el acceso a la plataforma mediante verificación de correo institucional."
      asideTitle="Su cuenta está a un paso"
      asideText="La validación de correo confirma su identidad y mantiene la seguridad de la comunidad educativa dentro de CIELP."
      form={<VerifyAccountCard />}
    />
  );
}

export default VerifyAccountPage;
