import { Alert, Button, Stack, Typography } from "@mui/material";
import { Component } from "react";

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Error en ruta del dashboard:", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Stack
          minHeight="50dvh"
          alignItems="center"
          justifyContent="center"
          spacing={1.4}
          sx={{ px: 2 }}
        >
          <Alert
            severity="error"
            sx={{ width: "100%", maxWidth: 560 }}
          >
            No fue posible cargar este módulo. Intente nuevamente.
          </Alert>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
          >
            Si el problema persiste, recargue la página o vuelva a iniciar
            sesión.
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleRetry}
          >
            Reintentar carga
          </Button>
        </Stack>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
