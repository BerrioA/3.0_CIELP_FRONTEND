import AuthSplitLayout from "../../../shared/ui/AuthSplitLayout";
import RegisterTeacherForm from "../components/RegisterTeacherForm";

function RegisterTeacherPage() {
  return (
    <AuthSplitLayout
      title="Registro de nuevos docentes"
      subtitle="Complete sus datos para crear su cuenta y comenzar su proceso en la plataforma."
      asideTitle="Comience su experiencia CIELP"
      asideText="Su registro habilita evaluaciones de bienestar, acceso a espacios digitales y acompañamiento institucional en un entorno seguro."
      form={<RegisterTeacherForm />}
    />
  );
}

export default RegisterTeacherPage;
