import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

function PasswordVisibilityAdornment({ visible, onToggle }) {
  return (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
      >
        {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
      </IconButton>
    </InputAdornment>
  );
}

export default PasswordVisibilityAdornment;
