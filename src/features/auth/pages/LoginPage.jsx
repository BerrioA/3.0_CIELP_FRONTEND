import AuthSplitLayout from "../../../shared/ui/AuthSplitLayout";
import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <AuthSplitLayout
      title="Bienvenido al sistema"
      subtitle="Gestiona bienestar docente y acompañamiento psicológico desde un solo lugar."
      asideTitle="Bienestar con datos, intervención con impacto"
      asideText="Centralice procesos de evaluación, espacios digitales y seguimiento institucional con una experiencia clara y segura para todo su equipo."
      form={<LoginForm />}
    />
  );
}

export default LoginPage;
